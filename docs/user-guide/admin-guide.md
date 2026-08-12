# QB Fabrication CRM — Admin Guide

For **admin** role users who configure people, access, Material Pull capabilities, and floor station tablets.

End-user workflows: [User Guide](./user-guide.md).  
Role meanings: [Roles & audiences](./01-roles-and-audiences.md).  
Eng detail: [section-access.md](../section-access.md), [material-pull-soft-launch.md](../material-pull-soft-launch.md), [traveler-v1.md](../traveler-v1.md).

---

## 1. Admin home

Open **Admin** in the sidebar (`/admin`). Only the **admin** role can access this area.

Typical work:

- Invite and edit users  
- Set organization roles  
- Toggle Material Pull capabilities  
- Mark station/tablet accounts  
- Set or clear floor PINs  
- Organization Settings → **Section access**  

---

## 2. Invite & edit users

### Invite

1. Admin → Users → invite/create flow (email + role).  
2. User completes login / password as prompted by Auth.  
3. Confirm they appear active and can reach the correct app URL (CRM vs Pull vs Traveler).

### Edit

For each profile you can typically set:

| Field | Guidance |
|-------|----------|
| **Role** | `admin` / `manager` / `member` / `viewer` — see [roles](./01-roles-and-audiences.md) |
| **Active** | Deactivate instead of deleting when someone leaves |
| **Material Pull capabilities** | Request / approve / batch / allocation (ignored for admins — full access) |
| **Station / tablet account** | Shared kiosk login for floor travelers |
| **Floor PIN** | 4–8 digits for real workers (hashed; not shown later) |

### Role assignment cheat sheet

| Hire / seat | Suggested role | Notes |
|-------------|----------------|-------|
| Systems / owner configuring the app | admin | Few seats |
| PM / production manager / sales manager | manager | Often + pull caps |
| Estimator, coordinator, salesperson, yard with edits | member | + `can_request` if they pull |
| Station tablet shared login | viewer + **station** flag | No personal PIN on the station user |
| Read-only office | viewer | Section access as needed |

---

## 3. Section access

**Admin → Organization Settings → Section access**

Controls which **roles** see each main-menu module:

- Opportunities  
- Jobs  
- Material Requests  
- Customers  
- Reports  

**Always on:** Dashboard, Settings.  
**Admin only:** Admin.

Missing override rows mean “use product defaults.” Soft-launch Pull/Traveler hosts skip this menu guard.

When adding a new module later, eng updates the section registry; you then flip roles here after deploy. See [section-access.md](../section-access.md).

---

## 4. Material Pull capabilities

Capabilities are **per user**, not a fifth org role.

| Cap | Grant to |
|-----|----------|
| `can_request` | Anyone who submits pulls (often `member`) |
| `can_approve` | Approves pending non-borrow (often production/yard manager) |
| `can_approve_allocation` | Approves borrow / needs-PM (often PM) |
| `can_batch` | Builds print lists and marks pulled |

**Pilot pattern** (adjust names as seats change):

| Seat | Role | Caps |
|------|------|------|
| Approver | manager | `can_approve` |
| Pull handler | manager | `can_batch` |
| PM | manager | `can_approve_allocation` |
| Floor requestor | member | `can_request` |
| Watch only | viewer | _(none)_ |

Remind users:

- Batch only includes **approved** requests.  
- Borrow needs allocation approval.  
- Hot priority notifies approvers when push/email is configured.

Deploy/PWA checklist: [material-pull-soft-launch.md](../material-pull-soft-launch.md).

---

## 5. Station accounts & floor PINs

Used for traveler checklist sign-off on shared tablets.

### Station account

1. Create an Auth user for the tablet (e.g. `station-bay1@…`).  
2. Admin → Edit user → enable **Station / tablet account**.  
3. Role is often **viewer** (read + sign-off only).  
4. Keep the tablet signed into this account.

### Floor PINs (real workers)

1. Admin → Edit **worker** profile (not the station user).  
2. Set **floor PIN** (4–8 digits).  
3. Worker signs off by selecting their name + PIN on the tablet.  
4. Clear/reset PIN from Admin if forgotten (self-serve reset is backlog).

Personal logins still require PIN at sign-off; the worker picker defaults to self.

Tech notes: [traveler-v1.md](../traveler-v1.md).

---

## 6. Org settings & support tasks

### Google CRM for users

Each person connects Google under **their** Settings. Admins:

- Ensure Google Cloud OAuth clients allow CRM (and traveler) redirect URLs.  
- Point users at [User Guide § Google](./user-guide.md) and [google-oauth-crm.md](../google-oauth-crm.md).  
- If send/enrich/import fails: user Disconnect → Connect (needs `contacts.readonly` for Enrich/Import).
- **Import Google contacts** creates CRM people from the signed-in user’s Google Contacts after review — not a Workspace-admin dump of other mailboxes.

### Trello import

Managers/admins: Settings → Trello. One-way boards → jobs (cards → line items). Requires `TRELLO_API_KEY` + `TRELLO_TOKEN` and migration `023`. Details: [trello-import.md](../trello-import.md).

### QuickBooks chips

No admin sync — users paste QBO URLs on accounts/jobs. Train that CRM does not replace QuickBooks.

### Common support tickets

| Ticket | Admin action |
|--------|----------------|
| “I don’t see Jobs / Customers” | Section access for their role |
| “Can’t create jobs” | Promote to manager (or admin) if appropriate |
| “Can’t approve pulls” | Enable `can_approve` / `can_approve_allocation` |
| “No Batch tab” | Enable `can_batch` |
| “PIN doesn’t work” | Clear + set new floor PIN on the worker |
| “Tablet signed in as wrong person” | Use station account; don’t use personal Google on kiosk |
| New hire | Invite → role → pull caps → PIN if floor |

### What admins should not promise yet

From backlog / deferred: inventory module, receiving app, ship-readiness module, self-serve PIN reset, hard ship gates on unsigned travelers. Point to process SOPs outside the CRM until those ship.

---

## Document control

| | |
|--|--|
| Audience | `admin` role |
| Companion | [User Guide](./user-guide.md), [Roles](./01-roles-and-audiences.md) |
