# Stock Count — Real-time Clothes Inventory

iPhone-first PWA for counting ~20,000 garments with 4–5 counters simultaneously.
Real-time sync via Firebase. Apple-Calculator-inspired UI.

**Stack**: Vite + React + TypeScript + Tailwind + Firebase (Firestore + Storage +
Anonymous Auth) + html5-qrcode + SheetJS + Zustand + wouter + vite-plugin-pwa.

---

## 1. Create the Firebase project (one-time, ~5 min)

1. Go to <https://console.firebase.google.com>, click **Add project** → name it (e.g. `iveel-stock-count`) → no Analytics needed.
2. **Build → Authentication → Get started** → enable **Anonymous** under "Sign-in method".
3. **Build → Firestore Database → Create database** → start in **production mode**, pick closest region.
4. **Build → Storage → Get started** → production mode, same region.
5. **Project settings (⚙) → General → Your apps → Add app → Web** (the `</>` icon). Name it "Stock Count". Copy the `firebaseConfig` values shown.

### Recommended Firebase extension (auto-thumbnails)

In the Firebase console: **Extensions → Resize Images → Install**. Configure:
- **Sizes**: `200x200`
- **Path**: `items` (only resize uploads under `items/{...}`)
- **Output**: same bucket, suffix `_200x200`
- **Format**: jpeg

Without this extension, the app falls back to the full-resolution photo URL for thumbnails (slower, more bandwidth, but works).

---

## 2. Wire up the env vars

```bash
cp .env.example .env.local
```

Open `.env.local` and paste the six values from your Firebase web-app config:

```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=iveel-stock-count.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=iveel-stock-count
VITE_FIREBASE_STORAGE_BUCKET=iveel-stock-count.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

---

## 3. Deploy security rules and indexes

Install Firebase CLI once:

```bash
npm i -g firebase-tools
firebase login
firebase use --add        # pick your project, give it the alias "default"
```

Deploy rules + indexes:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage:rules
```

This installs:
- [firestore.rules](firestore.rules) — auth-only reads/writes, hard-delete disabled
- [storage.rules](storage.rules) — auth-only, 500 KB image cap
- [firestore.indexes.json](firestore.indexes.json) — composite indexes for the recent-items feed and export pagination

---

## 4. Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:5173> on your phone (same Wi-Fi):

```
http://<your-laptop-ip>:5173
```

iOS Safari blocks camera over plain HTTP. For local iPhone camera testing, deploy to Vercel (HTTPS) or use a tool like `ngrok http 5173`.

---

## 5. Deploy to Vercel

```bash
npm i -g vercel
vercel              # follow prompts; project name + scope
```

In the Vercel dashboard → **Project Settings → Environment Variables**, paste the same `VITE_FIREBASE_*` values as in `.env.local`. Re-deploy:

```bash
vercel --prod
```

You'll get a URL like `https://iveel-stock-count.vercel.app`.

### Install on the iPhone

1. Open the Vercel URL in **Safari** (not Chrome).
2. Share button → **Add to Home Screen**.
3. Tap the new icon to launch in standalone mode (no Safari UI). Camera works.

---

## 6. Edit the counter names

Open [src/lib/constants.ts](src/lib/constants.ts) and change `COUNTER_NAMES` to your team's names. Re-deploy.

```ts
export const COUNTER_NAMES = ['Iveel', 'Saraa', 'Bilguun', 'Tuya', 'Ulzii'] as const;
```

---

## How counting works

**Hybrid grouping**: scanning the same `barcode + size` increments the quantity of an existing entry. The doc ID is deterministic (`grouped_<barcode>_<sizeSlug>`), so two counters scanning the same SKU within milliseconds both increment the same atomic counter — no lost units.

To save a one-off (damaged item, custom price), tick "Save as unique entry" in the Add Item form. Unique entries get UUID-based IDs and never merge.

**Real-time tiers** to stay in the Firebase free quota:
- Counter screen: live total (1 doc) + last 12 items (≤12 docs).
- List screen: paginated, 50 per page, not live.
- Presence: 5 docs (one per counter), 30 s heartbeat.

**Soft delete + undo**: every save and delete shows a 5-second "Undo" toast. Hard deletes are blocked by security rules.

---

## Excel export

Tap **Export → Download Excel**. The app pages through Firestore 200 docs at a time and builds the workbook incrementally, so 20 k items fit in browser memory.

Columns: Barcode · Size · Color · Pattern · Description · Original Price (MNT) · Discount % · Final Price (MNT) · Quantity · Line Total · Type · Created By · Last Counted By · Created At · Updated At · Photo URL.

For the very large exports, use a laptop browser.

---

## Project layout

```
src/
  lib/         firebase init, auth, constants
  stores/      zustand: counter, session, toast
  services/    items (race-free transactions), photos, export, ids
  hooks/       useRecentItems, usePresence, useSessionTotals, usePaginatedItems
  types/       Item, Session, Presence
  components/
    ui/        Button, Modal, Chip, NumPad, Toast, SafeArea
    shell/     StatusBar, BottomNav
    scanner/   BarcodeScanner, ManualEntry, DuplicateModal
    add-item/  AddItemFlow, PricePad, DiscountToggle, SizePicker, QuantityStepper, PhotoCapture
  screens/     NamePickerScreen, CounterScreen, ListScreen, ExportScreen
  App.tsx      wouter routing + name-picker gate
  main.tsx     React root
```

Only `services/` touches `firebase/firestore`. Hooks call services, components call hooks. This isolates the SDK so it can be swapped or mocked.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "Camera permission denied" on iPhone | Settings → Safari → Camera → Allow. If installed as PWA, you must re-add to Home Screen after granting. |
| Camera unavailable in standalone PWA | iOS < 14.3 doesn't support camera in standalone mode. Open in Safari tab instead. |
| Build error: "xlsx not found" | Run `npm install` again — SheetJS comes from a CDN tarball, not the npm registry. |
| "Firebase not configured" banner | `.env.local` is missing or has empty values. See step 2. |
| "Missing or insufficient permissions" Firestore errors | Deploy rules: `firebase deploy --only firestore:rules`. |
| Two counters merge into one quantity | They picked the same counter name. Each device should pick a different name. |

---

## Scripts

```
npm run dev        # vite dev server on :5173
npm run build      # tsc + vite build → dist/
npm run preview    # serve dist/ on :4173
npm run typecheck  # tsc --noEmit
```
