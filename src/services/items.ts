import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  increment,
  updateDoc,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { requireDb } from '@/lib/firebase';
import type { Item, ItemInput } from '@/types/item';
import { groupedItemId, uniqueItemId, slugifySize } from './ids';

function computeFinalPrice(price: number, discount: number): number {
  return Math.round(price * (1 - discount / 100));
}

/**
 * Race-free add or increment.
 * Two counters scanning the same barcode within milliseconds end up with
 * correct quantity because `increment()` is atomic on the server.
 */
export async function addOrIncrementItem(input: ItemInput): Promise<{ id: string; wasNew: boolean }> {
  const db = requireDb();
  const id = input.isUnique
    ? uniqueItemId()
    : groupedItemId(input.barcode, input.size);

  const itemRef = doc(db, 'items', id);
  const sessionRef = doc(db, 'sessions', input.sessionId);
  const qtyDelta = input.quantityToAdd ?? 1;
  const finalPrice = computeFinalPrice(input.originalPrice, input.discount);

  let wasNew = false;

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(itemRef);
    const sessionSnap = await tx.get(sessionRef);

    if (!snap.exists()) {
      wasNew = true;
      const newItem = {
        barcode: input.barcode.trim(),
        size: input.size.trim(),
        sizeSlug: slugifySize(input.size),
        color: input.color.trim(),
        pattern: input.pattern?.trim() || null,
        description: input.description?.trim() || null,
        originalPrice: input.originalPrice,
        discount: input.discount,
        finalPrice,
        quantity: qtyDelta,
        photoUrl: input.photoUrl || null,
        thumbUrl: input.thumbUrl || null,
        createdBy: input.counterName,
        lastCountedBy: input.counterName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isUnique: input.isUnique,
        deleted: false,
        sessionId: input.sessionId,
      };
      tx.set(itemRef, newItem);
    } else {
      tx.update(itemRef, {
        quantity: increment(qtyDelta),
        lastCountedBy: input.counterName,
        updatedAt: serverTimestamp(),
        deleted: false, // un-delete if it was soft-deleted
      });
    }

    // Maintain denormalized session totals
    if (!sessionSnap.exists()) {
      tx.set(sessionRef, {
        name: input.sessionId,
        createdAt: serverTimestamp(),
        createdBy: input.counterName,
        closedAt: null,
        itemCount: wasNew ? 1 : 0,
        totalQuantity: qtyDelta,
      });
    } else {
      tx.update(sessionRef, {
        totalQuantity: increment(qtyDelta),
        itemCount: wasNew ? increment(1) : increment(0),
      });
    }
  });

  return { id, wasNew };
}

/** Check if a barcode+size group already exists (one-shot read for duplicate warning). */
export async function findExistingGroupedItem(
  barcode: string,
  size: string
): Promise<Item | null> {
  const db = requireDb();
  const id = groupedItemId(barcode, size);
  const snap = await getDoc(doc(db, 'items', id));
  if (!snap.exists()) return null;
  const data = snap.data();
  if (data.deleted) return null;
  return { id: snap.id, ...data } as Item;
}

/** Soft delete with quantity rollback for the session total. */
export async function softDeleteItem(itemId: string, counterName: string): Promise<void> {
  const db = requireDb();
  const itemRef = doc(db, 'items', itemId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(itemRef);
    if (!snap.exists() || snap.data().deleted) return;
    const data = snap.data();
    const sessionRef = doc(db, 'sessions', data.sessionId);
    tx.update(itemRef, {
      deleted: true,
      lastCountedBy: counterName,
      updatedAt: serverTimestamp(),
    });
    tx.update(sessionRef, {
      totalQuantity: increment(-data.quantity),
      itemCount: increment(-1),
    });
  });
}

/** Restore a soft-deleted item (used by undo toast). */
export async function restoreItem(itemId: string, counterName: string): Promise<void> {
  const db = requireDb();
  const itemRef = doc(db, 'items', itemId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(itemRef);
    if (!snap.exists() || !snap.data().deleted) return;
    const data = snap.data();
    const sessionRef = doc(db, 'sessions', data.sessionId);
    tx.update(itemRef, {
      deleted: false,
      lastCountedBy: counterName,
      updatedAt: serverTimestamp(),
    });
    tx.update(sessionRef, {
      totalQuantity: increment(data.quantity),
      itemCount: increment(1),
    });
  });
}

/** Edit non-quantity fields. Uses last-write-wins on conflict (acceptable for this domain). */
export async function updateItemFields(
  itemId: string,
  updates: Partial<Pick<Item, 'color' | 'pattern' | 'description' | 'originalPrice' | 'discount' | 'size'>>,
  counterName: string
): Promise<void> {
  const db = requireDb();
  const patch: Record<string, unknown> = {
    ...updates,
    lastCountedBy: counterName,
    updatedAt: serverTimestamp(),
  };
  if (updates.originalPrice !== undefined && updates.discount !== undefined) {
    patch.finalPrice = computeFinalPrice(updates.originalPrice, updates.discount);
  }
  if (updates.size !== undefined) {
    patch.sizeSlug = slugifySize(updates.size);
  }
  await updateDoc(doc(db, 'items', itemId), patch);
}

/** Adjust quantity directly (e.g., user typed wrong count). Uses transaction to keep session total in sync. */
export async function adjustQuantity(
  itemId: string,
  newQuantity: number,
  counterName: string
): Promise<void> {
  const db = requireDb();
  const itemRef = doc(db, 'items', itemId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(itemRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const delta = newQuantity - data.quantity;
    if (delta === 0) return;
    const sessionRef = doc(db, 'sessions', data.sessionId);
    tx.update(itemRef, {
      quantity: newQuantity,
      lastCountedBy: counterName,
      updatedAt: serverTimestamp(),
    });
    tx.update(sessionRef, { totalQuantity: increment(delta) });
  });
}

/** Ensure the default session exists (called once on app start). */
export async function ensureSession(sessionId: string, name: string, counterName: string): Promise<void> {
  const db = requireDb();
  const ref = doc(db, 'sessions', sessionId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      name,
      createdAt: Timestamp.now(),
      createdBy: counterName,
      closedAt: null,
      itemCount: 0,
      totalQuantity: 0,
    });
  }
}
