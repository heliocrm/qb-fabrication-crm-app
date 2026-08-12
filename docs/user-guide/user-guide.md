# QB Fabrication CRM — User Guide

Full-shop guide for office, sales, project managers, and floor users who work in the CRM or the Material Pull / Traveler apps.

**Roles:** See [Roles & audiences](./01-roles-and-audiences.md).  
**Admin setup:** See [Admin Guide](./admin-guide.md).  
**Floor laminates:** [Material Pull](./cheat-sheet-material-pull.md) · [Traveler](./cheat-sheet-traveler.md).

---

## 1. Overview

The CRM tracks relationships and production for QB Fabrication:

- **Opportunities** — sales pipeline until won or lost  
- **Jobs** — production work after a win (statuses through Delivered)  
- **Customers** — accounts, contacts, activity, follow-ups  
- **Material Pull** — request and pull material for jobs  
- **Travelers** — digital work-order traveler + floor checklist sign-off  
- **Reports** — filters, saved views, CSV export  

QuickBooks Online is linked with **manual URL chips** only (no automatic sync).

---

## 2. Getting started

### Who can

Anyone with an active org login.

### Sign in

1. Open the CRM (`crmv1.qbfab.com`) or the Pull/Traveler PWA URL you were given.  
2. Sign in with the email/password your admin set up.  
3. Use **Reset password** if needed (`/auth/reset-password`).

Google Connect in Settings is **not** your login — it links Gmail/Calendar for CRM sync after you are already signed in.

### Navigation

Left sidebar modules depend on your **role** and **section access**. Typical items:

| Menu | Purpose |
|------|---------|
| Dashboard | Shop snapshot |
| Opportunities | Pipeline |
| Jobs | Production |
| Customers | Accounts + 360 |
| Material Requests | Pull board (CRM) |
| Reports | Analytics / export |
| Settings | Preferences + Google |
| Profile | Your profile & assigned jobs |
| Admin | Admins only |

### Profile

- Update display name / avatar as available.  
- Review jobs assigned to you.  
- Floor PIN is set by an **admin** today (self-serve PIN is planned).

### Settings

- UI preferences.  
- **Integrations → Google:** Connect, Sync Gmail, Sync Calendar, Enrich contacts, Import Google contacts, Disconnect.  
- Org-wide user admin lives under **Admin**, not Settings.

---

## 3. Dashboard

**Who:** All roles with CRM access.

Use the home page to scan:

- Key metrics  
- Recent jobs  
- Pipeline chart  
- Upcoming deliveries  

Open a job or opportunity from the lists when you need detail. Exact widgets may change; treat Dashboard as a read-only overview, not the place to edit records.

---

## 4. Opportunities

**Who can create/edit:** Typically admin, manager, member (if Opportunities section enabled).  
**Who can create a job from Won:** admin, manager.

### Pipeline stages

Work deals from Prospecting through **Won** or **Lost**.

When marking **Won** or **Lost**, enter a **win/loss reason** (required).

### Create or update an opportunity

1. Go to **Opportunities** → **New** (or open an existing card).  
2. Fill customer/account, value, stage, assignee, notes.  
3. Save. Use list or kanban as available.

### Win → create job

1. Move the opportunity to **Won** and save the reason.  
2. Use **Create job** (or equivalent) from the opportunity.  
3. Complete job fields and open the new job to add line items / traveler.

Customer 360 also links open opportunities for that account.

---

## 5. Jobs

**Who can create:** admin, manager.  
**Who can edit / import travelers:** admin, manager, member.  
**Who can manage assignees:** admin, manager.  
**Who can sign off floor tasks:** all roles (including viewer on station tablets).

### Status flow

Typical production path:

**To Do → In Progress → QC → Shipping → Delivered**

Use list or kanban views on **Jobs**.

### Create a job

1. **Jobs → New**, or create from a **Won** opportunity.  
2. Set customer, identifiers, dates, assignees as needed.  
3. Open the job and work through the tabs below.

### Job detail tabs

| Tab | Use it for |
|-----|------------|
| **Overview** | Status, key fields, summary |
| **Line Items** | Production cards / WIP checklists; assign people and due dates on checklist rows |
| **Traveler** | Import WO PDF, print/email/DOCX, floor panel |
| **Documents** | Files (often Google Drive job folder) |
| **Changes** | Change orders, issues, NCRs |
| **Activity** | Job system audit / activity feed |

### Assignees

Managers and admins can set who owns or works the job (shop team on Overview). Members generally edit content but do not manage the assignee list.

On **Line Items**, checklist tasks support **assigning a person** and setting a **due date** inline (click the avatar or date). Empty dates show as “Set date” — not as invalid.

### Delivered → relationship follow-up

When a job is **Delivered**, the CRM can create a **30-day check-in** follow-up for the relationship owner. Complete it from Customer 360 or your follow-up list.

---

## 6. Customers (Customer 360)

**Who:** Roles with Customers section enabled.

### Accounts list

**Customers** shows accounts. Open one to open **Customer 360** (sheet/panel).

### Customer 360 hub

From one place you typically can:

- View/edit account fields  
- Manage **contacts** (primary contact, relationship owner)  
- See **activity** (notes, calls, meetings, touches, emails)  
- Create **follow-ups**  
- Open linked **jobs** and **opportunities**  
- Open **QuickBooks** customer link if a URL was pasted  
- Send email / schedule meeting when Google is connected  

### Contacts

1. Add people under the account (name, title, email, phone).  
2. Mark one **primary** contact when appropriate.  
3. Claim **I own this relationship** so Needs a touch → My queue and new follow-ups default to you.  
4. Set **next touch** date/owner for planned outreach.

### Log activity

Add notes, calls, meetings, or touches on the timeline. Synced Gmail/Calendar rows also appear here when you run Sync in Settings.

---

## 7. Needs a touch & follow-ups

### Needs a touch (`/customers/needs-a-touch`)

**Who:** Users with Customers access. **All** filter: admin, manager.

A contact appears due when:

- `next_touch_at` is today or earlier, **or**  
- Last contact is older than **90 days** and no future next touch is set.

**Actions on a row:**

1. Open Customer 360  
2. Log touch  
3. Set next touch  
4. Create follow-up (prefilled contact/account/owner)

Default filter is **My queue**. Managers/admins can switch to **All**.

### Follow-ups (CRM tasks)

Follow-ups are relationship to-dos (due date, owner, link to account/contact/opportunity/job).  
They are **not** the same as shop-floor checklist tasks on line items.

Complete follow-ups from Customer 360 or the follow-up UI when you finish the outreach.

---

## 8. Google CRM

**Who:** Any user can connect **their own** Google Workspace account.

Setup detail for admins: [google-oauth-crm.md](../google-oauth-crm.md).

### Connect

1. **Settings → Integrations**.  
2. **Connect Google** and approve Gmail / Calendar / Contacts scopes as prompted.  
3. If send or enrich fails later, **Disconnect → Connect** again to refresh scopes.

### Sync (manual)

- **Sync Gmail** — pulls matching email activity into CRM timelines.  
- **Sync Calendar** — light inbound meeting sync.  
- Sync is **manual** (button), not continuous background.

### Enrich contacts

**Enrich contacts** matches Google Contacts to **existing** CRM contacts by email and fills blank phone / role title only. It does **not** create new CRM contacts from Google.

### Import Google contacts

**Import Google contacts** (same Settings card) opens a review list from your Google Contacts:

1. Select the rows to import (recommended new rows are pre-checked).  
2. Confirm or pick the **account** (required when Google has no company).  
3. Set **relationship owner** per row, or use **Bulk owner → Apply to selected**.  
4. For people already in the CRM, optionally check **Fill blank phone/title**.  
5. **Import**.

Emails that already exist anywhere in the org CRM are never duplicated. Import does not pull other users’ Google Contacts — each person connects their own account.

### Send email / schedule

From Customer 360 (contact **Email**, activity **Reply**, schedule meeting):

- Outbound mail uses your connected Gmail and logs an email activity.  
- Calendar scheduling uses your connected Calendar.

---

## 9. Material Pull

**Who:** Depends on Material Pull **capabilities** (see [roles](./01-roles-and-audiences.md)). Admins always have full pull powers.

### Two surfaces, one data

| Surface | URL / path | Best for |
|---------|------------|----------|
| CRM board | CRM → **Material Requests** | Office overview |
| Floor PWA | `pull.qbfab.com` → `/pull` | Phone/tablet yard work |

Install the PWA: Android Chrome → Install; iPhone Safari → Share → **Add to Home Screen**.

### Funnel

**Submit → Approve → (PM if borrow) → Batch & print → Mark pulled**

Only **approved** requests go into a batch (not pending).

### Submit a request (`can_request` or admin)

1. Open `/pull` or Material Requests → **New**.  
2. Enter job #, material, qty, **needed-by** (required), **priority**, **reason**, location, notes.  
3. Reasons cover scrap / nest wrong / short staged / rush / other — **not** “borrow” as a reason code.  
4. If borrowing from another job: check **Borrowing from another job** and enter **Borrow from job #**.  
5. Submit. Hot priority alerts approvers (push and/or email when configured).

### Approve (`can_approve`)

Open pending requests → **Approve** (non-borrow path).

### Approve borrow / allocation (`can_approve_allocation`)

Approve items that need PM allocation (borrow / source job # / “Needs PM”).

### Batch & pull (`can_batch`)

1. Open **Batch**.  
2. Select **approved** requests.  
3. Create pull list → **Print**.  
4. Pull material using the checklist / notes.  
5. **Mark pulled**.

Queue sorting prefers hot priority, then need-by date.

### Notifications

Enable browser notifications on the PWA when prompted. Email fallback uses Resend when push is unavailable.

Shorter steps: [cheat-sheet-material-pull.md](./cheat-sheet-material-pull.md).

---

## 10. Travelers

**Who can import / print / export:** admin, manager, member (job write).  
**Who can sign off checklist tasks:** all roles, with floor PIN.

### Surfaces

- Job → **Traveler** tab  
- Standalone PWA: `traveler.qbfab.com` → `/traveler`  
- Print route from job or traveler job page  

### Import a work-order PDF

1. Open the job (or Traveler app → pick job).  
2. Upload the QB work-order PDF.  
3. Review parsed fields **alongside the work-order PDF preview**: Customer (Ship To), PO, Order Date, QB SO, Ship Date, catalog lines.  
4. Confirm **Structure #** (auto from marks like `(MK-0532R)` when found) or **Fill N/A**.  
5. **Import traveler** — saves traveler + lines, seeds production line items / checklists, soft-syncs job PO/marks.

Re-import creates a **new version** and marks the previous active traveler **superseded**. Old production cards are not auto-deleted.

### Print / email / DOCX

Anytime after import (CRM **and** Traveler PWA):

- **Print** — HTML print view  
- **Email** — deep link via Resend (CRM)  
- **Download DOCX** — fills the official Word master template when available (logged)

### Drawing packet (stamp & rotate)

On the job Traveler tab or Traveler PWA floor panel:

1. Open **Drawing packet**.  
2. Select one or more drawing PDFs (reorder by selection order).  
3. Drag to place the “DRAWINGS ISSUED FOR QB FABRICATION” stamp; use **Stamp → All** for consistency.  
4. Crop / margins / saved crop templates for laminate edge holes.  
5. **Rotate** / **Rotation → All** for print orientation.  
6. **Open / download PDF** to print, or **Save to Drive** (document type Drawing Packet).

### Floor sign-off

On Machine / Fabrication / QA / Shipping checklist tasks:

1. Open the job traveler / floor panel (often on a station tablet).  
2. Select the checklist task.  
3. Pick **worker**, enter **floor PIN**, choose reason chips, optional note.  
4. Submit sign-off.

**Station tablets:** stay logged in as a **station account**; each sign-off picks a real worker + their PIN (does not switch Google sessions). Personal logins default the worker to yourself; PIN is still required.

Shorter steps: [cheat-sheet-traveler.md](./cheat-sheet-traveler.md).

---

## 11. Reports

**Who:** Roles with Reports section enabled.

1. Open **Reports**.  
2. Apply filters / choose a saved view.  
3. Export **CSV** when you need a spreadsheet.  

Use reports for management review; day-to-day edits still happen on Jobs, Opportunities, and Customers.

---

## 12. QuickBooks deep links

**Who:** Users who can edit the account/job fields where chips are stored.

- Paste the QuickBooks Online URL for a **customer** or **job** into the CRM chip/field.  
- Click the chip later to open QB in the browser.  
- There is **no** automatic invoice/estimate sync — QB remains the accounting system of record; CRM holds the shortcut.

---

## 13. Troubleshooting & FAQ

| Problem | What to try |
|---------|-------------|
| Menu item missing | Your role may not have that section — ask an admin to check Section access. |
| Cannot create a job | Need **admin** or **manager**. |
| Cannot edit a job | Viewers cannot edit; use a member+ seat or sign off only on floor tasks. |
| Google send fails | Settings → Disconnect Google → Connect again (send scope). |
| Enrich did nothing | Enrich only fills blank fields on contacts that already match by email. |
| Import needs account | Rows with no Google company must pick or create an account in the review dialog. |
| Import skipped duplicates | Email already exists on a CRM contact — select and enable fill blank phone/title, or skip. |
| Cannot see Batch on Pull | Need `can_batch` (or admin). |
| Borrow stuck | Needs `can_approve_allocation` (PM), not only `can_approve`. |
| Floor PIN rejected | Ask admin to reset PIN; ensure you selected the correct worker on a station tablet. |
| Offline | Use `/~offline` guidance; reconnect to sync when network returns. |
| Pull vs CRM data mismatch | Same Supabase data — refresh; confirm you are on the production URLs. |

---

## 14. Glossary

| Term | Meaning |
|------|---------|
| **Account** | Customer company record |
| **Contact** | Person at an account |
| **Opportunity** | Pre-win sales deal |
| **Job** | Production job after win / release |
| **Traveler** | Digital work-order packet + lines for the shop |
| **Line item** | Production card / WIP unit on a job |
| **Floor task / checklist** | Shop steps (Machine, Fab, QA, Shipping) signed with PIN |
| **Follow-up** | CRM relationship to-do (`crm_tasks`) |
| **Activity (CRM)** | Note/call/meeting/touch/email on Customer 360 |
| **Activity log (job)** | System audit feed on the job |
| **Material pull** | Request to stage/pull stock for a job |
| **Batch** | Group of approved pulls printed as a pull list |
| **Station account** | Shared tablet login for floor sign-off |
| **Floor PIN** | Worker code used at sign-off (not login password) |
| **Section access** | Which roles see which sidebar modules |
| **QB chip** | Manual QuickBooks Online deep link |

---

## Document control

| | |
|--|--|
| Scope | Full shop v1 (CRM + Pull + Traveler) |
| Companion | [Admin Guide](./admin-guide.md), cheat sheets, [outline](./00-outline.md) |
| Eng references | `docs/*.md` pilot/setup notes |
