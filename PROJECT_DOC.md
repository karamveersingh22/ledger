# Ledger / Bills — Project Source of Truth

> This document is the single source of truth for the project. It describes what the
> app does, how it is built, the data model, the request flows, known issues, and a
> running changelog of every change we make. **Update the "Changelog / Work Log"
> section at the bottom whenever a meaningful change is made.**

Last updated: 2026-06-28

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
   3-way **view switcher** (segmented tabs, mobile-scrollable): **Ledger**, **Debtors
   Outstanding**, **Creditors Outstanding**. Each view has a **Download PDF** button.
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

### Upload master
`page.tsx handleMasFileChange` → reads file → `POST /api/` with JSON body →
route deletes existing `mas` docs for this user (`deleteMany({ user: username })`) →
inserts new docs enriched with `user: username`.

### Upload ledger
`page.tsx handleLgrFileChange` → `POST /api/company` → resolves `User._id` from the
token's username → deletes existing `lgr` docs for that `_id` → inserts new docs enriched
with `user: _id`.

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

**Debtors Outstanding** (money to collect from this company):
- `creditTotal = Σ CREDIT` over all ledger rows.
- `payment_to_collect` starts at `YR_BAL − creditTotal` (the initial figure).
- For each **bill = ledger row with a non-zero `DEBIT`**, add `DEBIT` to the running
  `payment_to_collect`; that running value is shown per row. The last row's value is the
  final amount to collect. Positive final ⇒ amount to collect; negative ⇒ advance in hand.
- Table columns: Bill Date (`DATE`), Bill Number (`BILL`), Overdue Days, Bill Amount
  (`DEBIT`), Payment To Collect (running). Summary cards show YR_BAL, credit total, final.

**Creditors Outstanding** (money we owe / to pay this company):
- `debitTotal = Σ DEBIT` over all ledger rows.
- `payment_to_pay` starts at 0; `-= YR_BAL` if `YR_BAL > 0`, `+= abs(YR_BAL)` if
  `YR_BAL < 0` (net: `payment_to_pay = −YR_BAL`), then `-= debitTotal` (the initial figure).
- For each **bill = ledger row with a non-zero `CREDIT`**, add `CREDIT` to the running
  `payment_to_pay`; shown per row; last row is the final amount to pay.
- Table columns: Bill Date, Bill Number, Overdue Days, Bill Amount (`CREDIT`), Payment To
  Pay (running). Summary cards show YR_BAL, debit total, final.

> Implementation notes: only ledger rows with a non-zero bill amount (DEBIT for debtors,
> CREDIT for creditors) are listed as rows, but the credit/debit *totals* sum across **all**
> rows per the spec. Ledger rows arrive already sorted by `DATE` ascending from the API, so
> the running totals accumulate in date order. Amounts formatted with `en-IN` 2-decimals.

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

## 8. Known issues / tech debt (as of 2026-06-28)

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
7. **No data validation** on uploaded JSON beyond `JSON.parse`. Malformed records insert
   with schema defaults.

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
