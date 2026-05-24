import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  increment,
  updateDoc,
  setDoc,
  where,
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
 *
 * Correctness notes:
 *  - Doc ID is deterministic (`grouped_<barcode>_<sizeSlug>` or `unique_<uuid>`)
 *    so two counters scanning the same SKU within milliseconds both hit the
 *    same Firestore document and `increment()` resolves atomically.
 *  - If the item exists but was previously soft-deleted, we un-delete it AND
 *    restore its old quantity into the session total (which `softDeleteItem`
 *    subtracted when deleting). Otherwise the session total drifts low.
 *  - All flags (`wasNew`, `restoredFromDeleted`, `restoredQty`) are computed
 *    inside the transaction callback and returned from it — Firestore retries
 *    the callback on contention, so capturing values in closure across retries
 *    would carry stale state from prior attempts.
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

  const result = await runTransaction(db, async (tx) => {
    const snap = await tx.get(itemRef);
    const sessionSnap = await tx.get(sessionRef);

    let wasNew = false;
    let restoredFromDeleted = false;
    let restoredQty = 0;

    if (!snap.exists()) {
      wasNew = true;
      tx.set(itemRef, {
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
      });
    } else {
      const data = snap.data();
      if (data.deleted === true) {
        restoredFromDeleted = true;
        restoredQty = data.quantity ?? 0;
      }
      tx.update(itemRef, {
        quantity: increment(qtyDelta),
        lastCountedBy: input.counterName,
        updatedAt: serverTimestamp(),
        deleted: false,
      });
    }

    // Session deltas — the only correct way to compute these now that we
    // know whether the item was new, restored, or just incremented.
    const totalDelta = restoredFromDeleted ? restoredQty + qtyDelta : qtyDelta;
    const itemCountDelta = wasNew || restoredFromDeleted ? 1 : 0;

    if (!sessionSnap.exists()) {
      tx.set(sessionRef, {
        name: input.sessionId,
        createdAt: serverTimestamp(),
        createdBy: input.counterName,
        closedAt: null,
        itemCount: itemCountDelta,
        totalQuantity: totalDelta,
      });
    } else if (itemCountDelta !== 0 || totalDelta !== 0) {
      tx.update(sessionRef, {
        totalQuantity: increment(totalDelta),
        itemCount: increment(itemCountDelta),
      });
    }

    return { wasNew };
  });

  return { id, wasNew: result.wasNew };
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
      totalQuantity: increment(-(data.quantity ?? 0)),
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
      totalQuantity: increment(data.quantity ?? 0),
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
  if (!Number.isFinite(newQuantity) || newQuantity < 0) {
    throw new Error('Quantity must be ≥ 0');
  }
  const db = requireDb();
  const itemRef = doc(db, 'items', itemId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(itemRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const currentQty = data.quantity ?? 0;
    const delta = newQuantity - currentQty;
    if (delta === 0) return;
    const sessionRef = doc(db, 'sessions', data.sessionId);
    tx.update(itemRef, {
      quantity: newQuantity,
      lastCountedBy: counterName,
      updatedAt: serverTimestamp(),
    });
    // Only adjust session.totalQuantity if the item is not deleted
    // (a deleted item already had its quantity subtracted from the session)
    if (data.deleted !== true) {
      tx.update(sessionRef, { totalQuantity: increment(delta) });
    }
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

/**
 * Recompute denormalized session totals from the source-of-truth `items` collection.
 *
 * Use this as a manual "Repair" action when totals drift due to a bug or a
 * partial-failure write. Reads every non-deleted item in the session, sums
 * quantity, counts docs, and overwrites the session totals.
 */
export async function recomputeSessionTotals(
  sessionId: string
): Promise<{ totalQuantity: number; itemCount: number }> {
  const db = requireDb();
  const snap = await getDocs(
    query(
      collection(db, 'items'),
      where('sessionId', '==', sessionId),
      where('deleted', '==', false)
    )
  );
  let totalQuantity = 0;
  let itemCount = 0;
  for (const d of snap.docs) {
    const data = d.data();
    const q = Number(data.quantity);
    if (Number.isFinite(q) && q > 0) {
      totalQuantity += q;
      itemCount += 1;
    }
  }
  await updateDoc(doc(db, 'sessions', sessionId), {
    totalQuantity,
    itemCount,
  });
  return { totalQuantity, itemCount };
}
