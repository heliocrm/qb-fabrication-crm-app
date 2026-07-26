# Documentation outline (locked)

**Decisions (2026-07-25)**

1. **Format:** Repo markdown + Notion (both).
2. **Sets:** User Guide + Admin Guide + Floor cheat sheets (not one monolithic PDF).
3. **Scope:** Full shop (office CRM + Material Pull + Travelers).
4. **Audience:** System roles (`admin` / `manager` / `member` / `viewer`) mapped to typical job titles — see [01-roles-and-audiences.md](./01-roles-and-audiences.md).

**Out of scope until built:** Inventory, receiving inspection, ship-readiness logistics modules (process notes may exist under `data/docs/` only).

---

## A. User Guide

1. Overview & who this is for  
2. Getting started (login, nav, profile, settings)  
3. Dashboard  
4. Opportunities (pipeline → win → create job)  
5. Jobs (statuses, tabs, line items, documents, changes, activity)  
6. Customers / Customer 360  
7. Needs a touch + follow-ups  
8. Google CRM (connect, sync, email, calendar, enrich)  
9. Material Pull (CRM board + `/pull` PWA)  
10. Travelers (import, print/email/DOCX, floor sign-off)  
11. Reports  
12. QuickBooks deep links  
13. Troubleshooting & FAQ  
14. Glossary  

## B. Admin Guide

1. Admin home  
2. Invite / edit users & roles  
3. Section access matrix  
4. Material Pull capabilities  
5. Station accounts & floor PINs  
6. Org settings & common support tasks  

## C. Floor cheat sheets

1. Material Pull — request / approve / batch / mark pulled  
2. Traveler — open job, checklist sign-off with PIN  

---

## Writing order

1. Roles & audiences (done first — prevents wrong “who can…” text)  
2. Floor cheat sheets (highest how-do-I load)  
3. User Guide core: Opportunities → Jobs → Customers  
4. Material Pull + Travelers (full chapters)  
5. Google + Needs a touch  
6. Admin Guide  
7. FAQ / glossary  
8. Screenshots in Notion after UI is stable  

## Style

- Task-first headings (“Create a job from a won opportunity”).  
- Call out **who can** at the top of each workflow.  
- Prefer short numbered steps; link eng docs for deploy/setup detail.
