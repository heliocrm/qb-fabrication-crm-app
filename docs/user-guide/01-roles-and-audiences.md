# Roles & audiences

QB Fabrication CRM uses four **organization roles**. Job titles below are guidance for assigning seats — not separate permission systems.

Menu modules (Opportunities, Jobs, Material Requests, Customers, Reports) can be turned on/off **per role** under **Admin → Organization Settings → Section access**. Dashboard and Settings are always visible. Admin is admins only.

**Job contract value** (and related job `$` on list/detail/customer/change orders/reports export) is visible to **admin** and **manager** only — members and viewers never see it in the UI. Opportunity pipeline values are unchanged.

Material Pull adds **capability flags** on each user (except admins, who get all pull powers). See [Admin Guide](./admin-guide.md).

---

## Role → typical job titles

| System role | Typical job titles at QB | Primary surfaces |
|-------------|--------------------------|------------------|
| **admin** | Owner, ops lead, IT/systems, office manager configuring the app | Full CRM, Admin, all Material Pull powers |
| **manager** | Project manager, production manager, estimating lead, sales manager, yard lead who approves pulls | CRM + approve/batch pulls (per caps); create jobs; manage assignees; Needs a touch → All |
| **member** | Estimator, project coordinator, salesperson, buyer, fabricator/yard with login, office staff who edit jobs | CRM write where allowed; create pull requests if `can_request`; floor sign-off |
| **viewer** | Station/tablet shared login, read-only office, guest reviewer | Read boards; floor checklist sign-off with PIN; no job create/edit; no pull actions unless caps say otherwise (usually none) |

---

## Capability matrix (actions)

| Action | admin | manager | member | viewer |
|--------|:-----:|:-------:|:------:|:------:|
| View Dashboard / Settings | ✓ | ✓ | ✓ | ✓ |
| Open Admin | ✓ | — | — | — |
| Create jobs | ✓ | ✓ | — | — |
| Edit jobs / import travelers | ✓ | ✓ | ✓ | — |
| View job contract value / change-order $ | ✓ | ✓ | — | — |
| Manage job assignees | ✓ | ✓ | — | — |
| Floor task sign-off (PIN) | ✓ | ✓ | ✓ | ✓ |
| Needs a touch → **All** queue | ✓ | ✓ | — | — |
| Needs a touch → **My** queue | ✓ | ✓ | ✓ | ✓* |
| Connect Google (own account) | ✓ | ✓ | ✓ | ✓ |

\*Viewers can use the queue if Customers section is enabled for their role; they typically have limited write.

### Material Pull capabilities (overlays)

Set per user in **Admin → Edit user**. Admins ignore these flags (full access).

| Capability | Meaning | Often assigned to |
|------------|---------|-------------------|
| `can_request` | Submit pull requests | Yard / floor requestors, coordinators |
| `can_approve` | Approve pending (non-borrow) requests | Production / yard manager |
| `can_approve_allocation` | Approve borrow / “needs PM” | Project manager |
| `can_batch` | Batch approved → print list → mark pulled | Material handler / pull lead |

Suggested soft-launch pattern (from pilot notes):

| Seat type | Role | Caps |
|-----------|------|------|
| Approver | manager | `can_approve` (+ `can_request` if they also submit) |
| Batch / pull | manager | `can_batch` |
| PM borrow approval | manager | `can_approve_allocation` |
| Floor requestor | member | `can_request` only |
| Board watch-only | viewer | none |

---

## Which guide to read

| If you… | Start here |
|---------|------------|
| Sell, estimate, run jobs, manage customers | [User Guide](./user-guide.md) |
| Invite people, set roles/PINs/caps | [Admin Guide](./admin-guide.md) |
| Work pulls on phone/tablet | [Material Pull cheat sheet](./cheat-sheet-material-pull.md) |
| Sign off traveler checklists on a station | [Traveler cheat sheet](./cheat-sheet-traveler.md) |
