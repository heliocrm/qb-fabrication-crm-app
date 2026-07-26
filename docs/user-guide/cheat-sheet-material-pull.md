# Cheat sheet — Material Pull

**App:** `https://pull.qbfab.com` (or CRM → Material Requests)  
**Install:** Android → Install app · iPhone Safari → Share → Add to Home Screen  
**Full guide:** [User Guide § Material Pull](./user-guide.md)

---

## Who does what

| You… | Need |
|------|------|
| Submit a request | `can_request` (or admin) |
| Approve pending | `can_approve` |
| Approve borrow / Needs PM | `can_approve_allocation` |
| Batch, print, mark pulled | `can_batch` |

---

## 1. Submit a request

1. Open Pull → **New**.  
2. Job # · material · qty · **needed-by** · priority · reason · location · notes.  
3. Borrowing? Check **Borrowing from another job** → enter **Borrow from job #**.  
4. Submit. Use **Hot** only when it truly is — approvers get notified.

Reasons: scrap / nest wrong / short staged / rush / other.  
Borrow is a **flag + source job #**, not a reason.

---

## 2. Approve

1. Open the request (board or detail).  
2. **Approve** if you have `can_approve`.  
3. Borrow / Needs PM → PM with `can_approve_allocation` approves.

Pending requests **cannot** go into a batch.

---

## 3. Batch → print → mark pulled

1. Open **Batch** (needs `can_batch`).  
2. Select **approved** lines (hot / need-by sort).  
3. Create pull list → **Print**.  
4. Pull material.  
5. Checklist / notes → **Mark pulled**.

---

## Quick fixes

| Issue | Fix |
|-------|-----|
| No Batch tab | Ask admin for `can_batch` |
| Can’t submit | Ask admin for `can_request` |
| Borrow stuck | Needs PM allocation approval |
| No alerts | Allow notifications; email fallback if push off |

---

*Laminate: print this page. Keep phones on pull.qbfab.com, not the full CRM.*
