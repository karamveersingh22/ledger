# Ledger / Bills — Project Source of Truth

> This document is the single source of truth for the project. It describes what the
> app does, how it is built, the data model, the request flows, known issues, and a
> running changelog of every change we make. **Update the "Changelog / Work Log"
> section at the bottom whenever a meaningful change is made.**

Last updated: 2026-09-04

---

## 1. What the project is

A web portal that displays the **account statement / ledger** of various companies to
clients. Each client is a customer (e.g. an accountant or a business) who uploads their
own data and views the ledgers of the companies they deal with.

- **One admin** manages all clients (create / delete client accounts).
- **Multiple clients** log in and see only their own data.
- Data enters the system via two uploaded JSON files per client:
  1. `master.json` — one record per company (company master data).
  2. `ledger.json` — many records per company (the individual ledger/bill entries).
- The two files are linked by the field **`CODE`**, which acts as the primary key that
  ties a company (master) to its ledger entries.

Sample data files committed in the repo: [`mas.json`](mas.json) (master sample) and
[`lgr.json`](lgr.json) (ledger sample).

### Two main screens

1. **Master / Home screen** (`/`) — a searchable table of the client's companies. Shows
   4 fields per row: `CODE`, `ACCOUNT_N` (account/company name), `AMOUNT`, `CITY`.
   Clicking a row opens that company's ledger.
2. **Ledger screen** (`/company/[code]`) — the account statement for one company. Has a
   category-aware **view switcher** (segmented tabs, mobile-scrollable): **Ledger** is
   always available; **Debtors Outstanding** is available only for `MAIN_CODE = SDR`, and
   **Creditors Outstanding** only for `MAIN_CODE = SCR`. Each available view has a
   **Download PDF** button.
   - *Ledger* view shows 6 columns: `DATE`, `BOOK`, `DESCRIBE` ("Particulars"), `DEBIT`,
     `CREDIT`, `BALANCE`.
   - *Debtors / Creditors Outstanding* show summary cards + a billwise running table with
     a configurable **Due days** input (see §6.6).

---

## 2. Tech stack

- **Framework:** Next.js 15 (App Router), React 19, TypeScript.
- **Styling:** Tailwind CSS v4. Dark glassmorphism theme (slate gradients, white/10 cards).
- **Database:** MongoDB via Mongoose 8.
- **Auth:** Custom JWT in an HttpOnly cookie (`token`). `jsonwebtoken` in Node routes,
  `jose` in the Edge middleware. Passwords are currently **plaintext** (see Known Issues).
- **PDF:** `jspdf` + `jspdf-autotable` (client-side, on the ledger screen).
- **HTTP client:** `axios` on the frontend.
- **Deployment:** Vercel (frontend + backend together, since it's a single Next.js app).
- **Analytics:** `@vercel/analytics`.
- Note: `@clerk/nextjs`, `bcryptjs`, `node-dbf`, `js-cookie`, `jwt-decode` are present in
  `package.json` but are mostly **not actively wired in** (legacy / experimental). Auth is
  the custom JWT flow, not Clerk. bcrypt is not used yet (passwords are plaintext).

---

## 3. Repository map

```
app/
  layout.tsx               Root layout; mounts <ClientHeader/> + Vercel Analytics.
  globals.css              Tailwind global styles.
  ClientHeader.tsx         Hides header on /login, else renders <Header/>.
  Header.tsx               Top bar; if not logged in shows a "Session Required" gate
                           overlay. Fetches username from /api/me. Logout button.
  page.tsx                 "/" Master screen: upload MAS+LGR, search, table, row->ledger.
  login/page.tsx           "/login" Login form. Redirects admin->/manage, client->/.
  manage/page.tsx          "/manage" Admin UI: add/delete client users (admin only).
  admin/page.tsx           "/admin" placeholder stub page (unused).
  company/[code]/page.tsx  Ledger screen for one company; PDF download.
  api/
    route.ts               /api  -> MAS upload (POST) + MAS fetch (GET) for current user.
    company/route.ts       /api/company -> LGR upload (POST) + LGR fetch by code (GET).
    login/route.ts         /api/login -> validates creds, sets JWT cookie, seeds users.
    logout/route.ts        /api/logout -> clears token cookie.
    me/route.ts            /api/me -> returns {username, masterPath, ledgerPath, role}.
    manage/route.ts        /api/manage -> admin CRUD over client users (GET/POST/DELETE).
    auth/login.ts          Legacy/unused auth helper file.
    auth/register.ts       Legacy/unused auth helper file.
dbconfig/db.ts             connectdb(): mongoose.connect(process.env.MONGODB_URL).
lib/auth.ts                verifyToken/createToken/etc (jsonwebtoken). Node runtime only.
lib/uploadPayload.ts       readUploadPayload(): gunzips (if x-payload-encoding: gzip),
                           parses and validates an upload body before any DB write.
                           Throws UploadPayloadError (carries an HTTP status). See §6.7.
lib/seedUsers.ts           Seeds users.json into Mongo if User collection is empty.
models/user_schema.ts      User model: username, password, role, masterPath, ledgerPath.
models/mas_schema.ts       mas model: all master fields + `user` (string username).
models/lgr_schema.ts       lgr model: all ledger fields + `user` (ObjectId ref User).
middleware.ts              Edge guard for /manage (admin) and /login redirect.
users.json                 Seed users (admin + clients). Plaintext passwords.
mas.json / lgr.json        Sample master / ledger data.
```

---

## 4. Data model

### 4.1 User (`models/user_schema.ts`, collection `users`)
| field | type | notes |
|-------|------|-------|
| username | String, unique, required | login id |
| password | String, required | **plaintext** currently |
| role | 'admin' \| 'client', required | one admin expected |
| masterPath | String | informational path label shown in UI (not used to read files) |
| ledgerPath | String | informational path label shown in UI |
| timestamps | — | createdAt / updatedAt |

### 4.2 Master (`models/mas_schema.ts`, collection `mas`)
One document per company. Key fields used by the UI: `CODE`, `ACCOUNT_N`, `AMOUNT`, `CITY`.
Full field list mirrors the uploaded `master.json` (CODE, ACCOUNT_N, TITLE, YR_BAL,
AMOUNT, MAIN_CODE, HEAD_NAME, LEVEL, ST_NUMBER, ST_DATE, ADDRESS1, ADDRESS2, CITY, PHONE,
DEP_RATE, REV_CODE, OUT_BAL, PAGE, LAST_BAL, TAX_TYPE, TIN, K1, STATE, CATEGORY,
STATE_CODE, PAN, PINCODE, DISTANCE).
- **Ownership field:** `user` = **username string** (required).

### 4.3 Ledger (`models/lgr_schema.ts`, collection `lgr`)
Many documents per company. Key fields used by the UI: `DATE`, `BOOK`, `DESCRIBE`,
`DEBIT`, `CREDIT`, `BALANCE`. Full field list mirrors uploaded `ledger.json` (CODE,
ACCOUNT_N, VC_NUMBER, VC_TYPE, ENTRY_NO, DEBIT, CREDIT, BALANCE, DESCRIBE, DATE, BILL,
BOOK, INV_DATE, QUANTITY, CASH_MEMO, LEDG_CHECK, MAIN_KEY, K1).
- **Ownership field:** `user` = **User ObjectId** (ref `User`).
- Linked to a company via `CODE` (matches `mas.CODE`).

> ⚠️ **Inconsistency to be aware of:** the master collection stores `user` as the
> **username string**, while the ledger collection stores `user` as the **ObjectId**.
> Any code that deletes/queries by owner must use the right type for each collection
> (see `api/manage` DELETE cascade, which already handles both).

---

## 5. Authentication & authorization

- **Login** (`/api/login`): looks up `User.findOne({ username, password })` (plaintext
  match), signs a JWT `{ username, role }` with `process.env.secret`, expires in 24h, and
  sets it as an HttpOnly `token` cookie (`SameSite=Strict`, `Secure` in production).
  Calls `seedUsers()` first so the initial admin/clients exist.
- **Session read** (`/api/me`): verifies the cookie, returns username/role/paths.
- **Logout** (`/api/logout`): clears the cookie.
- **Middleware** (`middleware.ts`, Edge runtime, uses `jose`):
  - `/manage` and `/manage/*` require a valid token with `role === 'admin'`, else
    redirect to `/login`.
  - `/login` while already authenticated redirects to `/manage` (admin) or `/` (client).
  - Matcher is limited to `['/manage', '/manage/:path*', '/login']`.
- **API-level auth:** the data routes (`/api`, `/api/company`, `/api/manage`) each verify
  the cookie via `lib/auth.verifyToken` and scope queries to the current user.

> ⚠️ The `/` (master) and `/company/[code]` pages are **not** protected by middleware.
> They rely on the client-side `Header` gate + the API returning 401 for unauthenticated
> requests. Direct page HTML is reachable without a cookie; data is not.

---

## 6. Key request flows

### Upload master / Upload ledger (gzip; validate-before-delete)

Both uploads share one client-side flow, `uploadJsonFile(e, endpoint, label)` in
`app/page.tsx`. `handleMasFileChange` calls it with `/api/`, `handleLgrFileChange` with
`/api/company`. See §6.7 for the compression details and the size limits that drove it.

Client steps:
1. Read the file with `FileReader` and `JSON.parse` it. A failure here is a genuinely bad
   file → alert "Invalid JSON file", **nothing is uploaded and nothing is deleted**.
2. Shape check: must be a non-empty array of objects (a single object is accepted and
   treated as one record). Failure → alert, no upload.
3. gzip the serialized JSON with the browser's native `CompressionStream("gzip")` and POST
   it as `application/octet-stream` with the header `x-payload-encoding: gzip`. Browsers
   without `CompressionStream` fall back to posting plain JSON; the API accepts both.
4. Errors are classified by `describeUploadError` — 413 / other HTTP status / network
   failure / server message are reported distinctly instead of all being reported as
   "Invalid JSON file" (see §10 changelog for why this mattered).

Server steps (`app/api/route.ts` for master, `app/api/company/route.ts` for ledger) —
**the order is deliberate**:
1. Verify the JWT cookie. Ledger route also resolves `User._id` from the username.
2. `readUploadPayload(request)` (`lib/uploadPayload.ts`): gunzip if the
   `x-payload-encoding: gzip` header is present, `JSON.parse`, then validate non-empty
   array of objects. Any failure throws `UploadPayloadError` → the route replies 4xx and
   returns **without deleting anything**.
3. Only after validation passes: `deleteMany` the user's existing docs, then `insertMany`
   the new ones enriched with the owner field (`user: username` for `mas`,
   `user: _id` for `lgr`).
4. Response includes `count` (records inserted).

> Uploading a new file still fully replaces the previous data — that is the intended
> behaviour. The change is only that the delete now happens **after** the new file has been
> proven readable, so a corrupt or truncated upload can no longer wipe a client's data.

Both upload routes declare `export const maxDuration = 60` and `export const runtime =
"nodejs"` (the latter because `lib/uploadPayload.ts` uses Node's `zlib`).

### View master table
`page.tsx getMasdata` → `GET /api/` → returns `mas.find({ user: username })`. Client-side
search filters on CODE / ACCOUNT_N / CITY / AMOUNT.

### View a company ledger
Row click → `router.push('/company/[code]')` → `company/[code]/page.tsx getLgrdata` →
`GET /api/company?code=<CODE>` → returns `lgr.find({ user: _id, CODE: numeric })` sorted by
DATE ascending (rows with no/invalid DATE pushed to the end).

### Download PDF
`company/[code]/page.tsx downloadPdf` → builds rows from `lgrdata` → `jspdf-autotable`
renders a table → saves `ledger_<code>.pdf`. Title: "Account statement for <code> company".

### 6.6 Debtors / Creditors Outstanding (ledger screen)
Both views need the company's **opening balance `YR_BAL`** from the master record, so the
ledger page now also calls `GET /api/?code=<CODE>` (master route gained optional `code`
filtering) in addition to `GET /api/company?code=<CODE>` (ledger rows). All calculation is
client-side in `app/company/[code]/page.tsx` (`debtors` and `creditors` `useMemo`s).

A shared **Due days** input drives the overdue calculation:
`overdueDays = (today − billDate in whole days) − dueDays`. `overdueDays > 0` ⇒ the bill is
past due and the whole row is **red-flagged**. Negative ⇒ still within the allowed window.
Dates use local-midnight to avoid timezone drift.

**Ordinary Ledger view:**
- The application does **not** calculate `DEBIT`, `CREDIT`, or `BALANCE` for this table.
  Each value is displayed directly from the corresponding uploaded ledger record.
- Therefore, there is currently no application-side formula such as
  `previous balance + debit − credit` for the ordinary Ledger view; the source data is
  responsible for supplying its already-calculated `BALANCE` value.

**Debtors Outstanding** (money to collect from this company):
- Available and calculated only when the master record has `MAIN_CODE = SDR`.
- `creditTotal = Σ CREDIT` over all ledger rows.
- `payment_to_collect` starts at `YR_BAL − creditTotal` (the initial figure).
- For each **bill = ledger row with a non-zero `DEBIT`**, add `DEBIT` to the running
  `payment_to_collect`; that running value is shown per row. The last row's value is the
  final amount to collect. Running and final values display the absolute amount prefixed
  with **DR** when positive (payment to collect) or **CR** when negative (payment collected
  / advance in hand). Zero is shown without a DR/CR prefix.
- Explicit formulas, with qualifying debit-bill rows ordered by ledger date:
  - `initialPaymentToCollect = YR_BAL − Σ(all ledger CREDIT values)`
  - `paymentToCollect(row n) = initialPaymentToCollect + Σ(DEBIT of bill rows 1..n)`
  - `finalPaymentToCollect = YR_BAL − Σ(all CREDIT) + Σ(non-zero DEBIT bill rows)`
  - Displayed amount = `abs(paymentToCollect)`; marker = `DR` when the signed result is
    positive, `CR` when negative, and no marker when zero.
- Table columns: Bill Date (`DATE`), Bill Number (`BILL`), Overdue Days, Bill Amount
  (`DEBIT`), Payment To Collect (running). Summary cards show YR_BAL, credit total, final.

**Creditors Outstanding** (money we owe / to pay this company):
- Available and calculated only when the master record has `MAIN_CODE = SCR`.
- `debitTotal = Σ DEBIT` over all ledger rows.
- `payment_to_pay` starts at 0; `-= YR_BAL` if `YR_BAL > 0`, `+= abs(YR_BAL)` if
  `YR_BAL < 0` (net: `payment_to_pay = −YR_BAL`), then `-= debitTotal` (the initial figure).
- For each **bill = ledger row with a non-zero `CREDIT`**, add `CREDIT` to the running
  `payment_to_pay`; shown per row; last row is the final amount to pay. Running and final
  values display the absolute amount prefixed with **CR** when positive (payment to pay)
  or **DR** when negative (payment paid / advance paid). Zero is shown without a DR/CR
  prefix.
- Explicit formulas, with qualifying credit-bill rows ordered by ledger date:
  - `initialPaymentToPay = −YR_BAL − Σ(all ledger DEBIT values)`
  - `paymentToPay(row n) = initialPaymentToPay + Σ(CREDIT of bill rows 1..n)`
  - `finalPaymentToPay = −YR_BAL − Σ(all DEBIT) + Σ(non-zero CREDIT bill rows)`
  - Displayed amount = `abs(paymentToPay)`; marker = `CR` when the signed result is
    positive, `DR` when negative, and no marker when zero.
- Table columns: Bill Date, Bill Number, Overdue Days, Bill Amount (`CREDIT`), Payment To
  Pay (running). Summary cards show YR_BAL, debit total, final.

> Implementation notes: only ledger rows with a non-zero bill amount (DEBIT for debtors,
> CREDIT for creditors) are listed as rows, but the credit/debit *totals* sum across **all**
> rows per the spec. Ledger rows arrive already sorted by `DATE` ascending from the API, so
> the running totals accumulate in date order. Amounts formatted with `en-IN` 2-decimals.

### 6.7 Upload size limits & gzip compression

**The constraint.** On Vercel, a serverless function request body is capped at **~4.5 MB**.
The cap is enforced by the platform *before* the route handler runs, so an oversized upload
returns `413` and the function never executes. A real-world ledger export is much larger
than that, so uploads have to be compressed.

**Measured on a real 34,114-row ledger export:**

| | Size |
|---|---|
| Source file on disk | 13.85 MB |
| Same file whitespace-minified | 11.91 MB |
| Serialized POST body (either file) | **11.05 MB** |
| POST body after gzip | **0.86 MB** (~13× smaller) |
| Server-side gunzip + `JSON.parse` | ~70–110 ms |

Why it compresses so well: 34k records repeat the same ~19 key names (≈650k repetitions of
those strings) plus many repeated values (`0`, `""`, `false`, `null`, the same `BOOK` codes
and account names).

> ⚠️ **Minifying the source file does nothing.** `JSON.parse` discards the file's whitespace
> before the upload is serialized, so a pretty-printed file and a minified file produce a
> byte-identical request body. Only compressing the *request body* helps.

**How it is wired.** Browsers do not gzip request bodies automatically, and Next.js/Vercel
does not automatically decompress incoming ones — both sides are explicit:
- Client: `buildUploadBody()` in `app/page.tsx` uses the native `CompressionStream("gzip")`
  and sets `x-payload-encoding: gzip`. A custom header is used rather than `Content-Encoding`
  to avoid any proxy attempting its own decoding.
- Server: `readUploadPayload()` in `lib/uploadPayload.ts` gunzips with Node `zlib`, capped at
  `maxOutputLength` 64 MB as a gzip-bomb guard.
- Brotli would compress ~23×, but `CompressionStream` supports only gzip/deflate, so it
  would require shipping a compression library to the browser. gzip already clears the cap
  with ~5× headroom, so it was not worth it.

**Remaining headroom and the next bottleneck.** At 0.86 MB there is roughly 5× headroom, so
this comfortably supports growth to ~150,000–180,000 ledger rows before the 4.5 MB cap is
reached again. Beyond that, the options are chunked uploads or direct-to-storage
(Vercel Blob / S3).

Compression solves the *size* limit, so the next limit reached is **function execution
time** — the `insertMany` of tens of thousands of documents, not the decompression (which is
~100 ms). Both upload routes therefore set `maxDuration = 60`. Other ceilings, none of which
currently bind: MongoDB `insertMany` batches at 48 MB BSON (a 34k-row ledger is ~11.4 MB),
and MongoDB's 16 MB per-document limit is irrelevant since each ledger row is its own doc.

### Admin manage clients
`/manage` (admin-only via middleware) → `GET /api/manage` lists clients; `POST` adds a
client (role forced to `client`); `DELETE` removes a client and cascades delete of their
`mas` (by username) and `lgr` (by ObjectId) data.

---

## 7. Environment variables

| var | used by | purpose |
|-----|---------|---------|
| `MONGODB_URL` | `dbconfig/db.ts` | MongoDB connection string |
| `secret` | login, `lib/auth`, `middleware` | JWT signing/verification secret |
| `NODE_ENV` | login route | toggles cookie `Secure` flag |

Set these in Vercel project env settings (and a local `.env` for dev).

---

## 8. Known issues / tech debt (as of 2026-09-04)

1. **Plaintext passwords.** `bcryptjs` is installed but unused. Login compares raw
   strings. Should hash on create and compare on login.
2. **`user` type mismatch** between `mas` (username string) and `lgr` (ObjectId). Pick one
   convention to avoid subtle owner-scoping bugs.
3. **Pages `/` and `/company/[code]` are not in the middleware matcher** — they're guarded
   only client-side. Consider server-side protection.
4. **`createToken` in `lib/auth.ts`** ignores its `expiresIn` arg (hardcodes 24h) — minor.
5. **Dead/legacy code:** `app/admin/page.tsx` stub, `app/api/auth/*`, large commented-out
   blocks in the API routes, unused deps (Clerk, node-dbf, js-cookie, jwt-decode).
6. **`masterPath` / `ledgerPath`** are display-only labels; the app does not actually read
   files from those paths (data comes from manual uploads).
7. **Limited data validation** on uploaded JSON. As of 2026-09-04 uploads are checked for
   valid JSON and for being a non-empty list of objects (client and server, before any
   delete — §6.7). There is still **no per-field validation**: a record missing `CODE`,
   `DATE` or `DEBIT`/`CREDIT`, or carrying wrong types, still inserts with schema defaults.
   Unknown fields (e.g. `USER_NAME`, present in real exports but absent from
   `models/lgr_schema.ts`) are silently dropped by Mongoose.
8. **`insertMany` is not transactional and defaults to `ordered: true`.** The delete now only
   runs after the upload is validated, so a *bad file* is safe. But if the insert itself
   fails partway (schema error, or the 60s `maxDuration` timeout on a very large ledger),
   the old data is already deleted and only the records before the failure are written —
   leaving a ledger that looks populated but is incomplete, with no user-visible warning.
   Fixing this properly needs a MongoDB transaction around delete+insert, or writing to a
   temporary collection and swapping. Not done yet.
9. **No upload progress indication.** A large ledger upload can take several seconds; the UI
   gives no feedback between file selection and the success/failure `alert()`, and the file
   input is not disabled during the upload.

---

## 9. Local development

```bash
npm install
# create .env with MONGODB_URL and secret
npm run dev      # next dev --turbopack, http://localhost:3000
```
Default seeded admin (from `users.json`): username `admin`, password `karam@123`.
**Change this before/with any real deployment.**

---

## 10. Changelog / Work Log

Record every meaningful change here: date, what changed, why, and any follow-ups.

- **2026-06-28** — Created this `PROJECT_DOC.md` source-of-truth document after a full
  analysis of the codebase (data model, auth, routes, screens, known issues). No code
  changes yet. Next: planned upgrades to be specified by the project owner.
- **2026-06-29** — Master screen (`app/page.tsx`): added category **filter buttons** below
  the search bar, based on the `MAIN_CODE` field from master data. Filters: All, Customers
  (`SDR`), Suppliers (`SCR`), Expenses (`EXPS`), Purchases (`TRDP`), Sales (`TRDS`).
  Implementation: new `activeFilter` state (default `"ALL"`); `filteredData` now combines
  the existing search match AND the `MAIN_CODE` match (case-insensitive). Frontend-only
  change — `MAIN_CODE` was already stored in the `mas` schema and returned by `GET /api/`.
  The filter and the search bar work together (both must match).
- **2026-06-29** — Ledger screen (`app/company/[code]/page.tsx`): added **Debtors
  Outstanding** and **Creditors Outstanding** views alongside the existing Ledger view,
  via a mobile-friendly segmented tab switcher. Added a **Due days** input that drives an
  **Overdue Days** column; overdue (positive) rows are red-flagged. Each view has summary
  cards (YR_BAL, total received/paid, final figure) and a billwise running table, and the
  **Download PDF** button now exports whichever view is active. Backend: `GET /api/`
  (master route) gained optional `?code=` filtering so the page can read `YR_BAL` for one
  company. All outstanding math is client-side. See §6.6 for the exact formulas.
- **2026-07-12** — Restricted outstanding views by master category: Debtors Outstanding
  is available only for `MAIN_CODE = SDR`, Creditors Outstanding only for `MAIN_CODE =
  SCR`, and other masters show only Ledger. Replaced signed Payment To Collect and Payment
  To Pay displays with absolute amounts prefixed by the applicable DR/CR marker in running
  rows, final summary cards, and outstanding PDFs. Zero balances remain unsigned.
- **2026-07-12** — Expanded §6.6 with the complete initial, per-row, and final formulas
  for both outstanding calculations, plus the DR/CR display conversion. Clarified that
  the ordinary Ledger view displays uploaded `DEBIT`, `CREDIT`, and `BALANCE` values and
  does not recalculate the ledger balance in the application.
- **2026-09-04** — **Large-upload support: gzip compression, `maxDuration = 60`, and
  validate-before-delete.**
  *Why:* uploading a real 13.85 MB / 34,114-row ledger export always failed with the alert
  "Invalid JSON file". Investigation showed the file was **valid JSON** — the single
  `try/catch` in the old handlers wrapped both `JSON.parse` *and* the `axios.post`, so a
  transport failure was misreported as a file error. The real cause was the serialized
  11.05 MB request body exceeding Vercel's ~4.5 MB function body cap (413). Re-saving the
  file minified did not help, because `JSON.parse` discards whitespace before the body is
  serialized — both files produced a byte-identical 11.05 MB body.
  *Changes:*
  - **New `lib/uploadPayload.ts`** — `readUploadPayload()` gunzips the body when
    `x-payload-encoding: gzip` is set (64 MB `maxOutputLength` gzip-bomb guard), parses it,
    and validates it is a non-empty array of objects. Throws `UploadPayloadError` carrying
    an HTTP status. Performs **no** database writes.
  - **`app/page.tsx`** — both handlers now delegate to a shared `uploadJsonFile()`. It
    parses and shape-checks in the browser, gzips via the native `CompressionStream("gzip")`
    (falling back to plain JSON where unsupported), posts as `application/octet-stream`, and
    reports failures through `describeUploadError()` so 413 / HTTP status / network / server
    messages are distinguished instead of all reading "Invalid JSON file". Success alert now
    reports the record count.
  - **`app/api/route.ts` and `app/api/company/route.ts`** — reordered to
    **validate → delete → insert**. Previously `deleteMany` ran *before* `request.json()`,
    so a malformed, truncated or interrupted upload wiped the client's existing data with no
    way to recover it. Replace-on-upload behaviour is unchanged and intentional; only the
    ordering moved. Both routes now declare `maxDuration = 60` and `runtime = "nodejs"`, and
    return `count` on success. Validation failures reply 4xx with the reason and leave the
    previous data untouched.
  *Result:* the same ledger now uploads as **0.86 MB** (~13× smaller), roughly 5× under the
  cap, with server-side gunzip + parse at ~70–110 ms. Headroom to ~150k–180k rows. Full
  details and measurements in **§6.7**.
  *Follow-ups (see §8 items 7–9):* no per-field validation; `insertMany` is still
  non-transactional and `ordered: true`, so a failure *during the insert* (including a 60s
  timeout) can still leave partial data; and there is no upload progress UI.
- **2026-07-31** — Replaced the default Create Next App README with a project-focused
  GitHub README covering the product overview, major features, application flow, stack,
  data model, local setup, JSON import examples, project structure, security notes, and
  roadmap. Seeded credentials were intentionally excluded from the public-facing guide.
