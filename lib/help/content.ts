import type { HelpChapter } from "@/lib/help/types"

/**
 * Help Center content, seeded from docs/user-guide/*.md.
 * Keep this typed module as the single source of truth for chapter copy —
 * edit here, not in the page components.
 */
export const helpChapters: HelpChapter[] = [
  {
    slug: "getting-started",
    title: "Getting started",
    navGroup: "user-guide",
    iconName: "Rocket",
    summary: "Sign in, find your way around the sidebar, and set up your profile.",
    whoCanDoThis: "Anyone with an active org login.",
    recommendedFor: ["admin", "manager", "member", "viewer", "floor"],
    subsections: [
      {
        heading: "Sign in",
        body: {
          kind: "steps",
          steps: [
            { text: "Open the CRM, or the Pull / Traveler app URL your admin gave you." },
            { text: "Sign in with the email and password your admin set up for you." },
            { text: "Use Reset password from the login screen if you're locked out." },
          ],
        },
        ctas: [{ label: "Go to reset password", href: "/auth/reset-password" }],
      },
      {
        heading: "Navigation",
        body: {
          kind: "table",
          headers: ["Menu", "Purpose"],
          rows: [
            ["Dashboard", "Shop snapshot"],
            ["Opportunities", "Sales pipeline"],
            ["Jobs", "Production"],
            ["Customers", "Accounts + Customer 360"],
            ["Material Requests", "Pull board (CRM)"],
            ["Reports", "Analytics / export"],
            ["Settings", "Preferences + Google"],
            ["Admin", "Admins only"],
          ],
        },
      },
      {
        heading: "Profile & settings",
        body: {
          kind: "steps",
          steps: [
            { text: "Update your display name and avatar from your profile." },
            { text: "Review the jobs assigned to you." },
            { text: "Your floor PIN is set by an admin today — self-serve PIN reset is planned." },
            { text: "Org-wide user admin lives under Admin, not Settings." },
          ],
        },
        ctas: [{ label: "Open Settings", href: "/settings" }],
      },
    ],
  },
  {
    slug: "dashboard",
    title: "Dashboard",
    navGroup: "user-guide",
    iconName: "LayoutDashboard",
    summary: "A read-only snapshot of the shop — metrics, recent jobs, and the pipeline.",
    whoCanDoThis: "All roles with CRM access.",
    recommendedFor: ["admin", "manager", "member", "viewer"],
    subsections: [
      {
        heading: "What's on the Dashboard",
        body: {
          kind: "steps",
          steps: [
            { text: "Key metrics for the shop at a glance.", imageSlot: "Dashboard metrics row" },
            { text: "Recent jobs list.", imageSlot: "Recent jobs widget" },
            { text: "Pipeline chart.", imageSlot: "Pipeline chart widget" },
            { text: "Upcoming deliveries.", imageSlot: "Upcoming deliveries widget" },
            { text: "Open a job or opportunity from the lists when you need detail — the Dashboard itself is read-only." },
          ],
        },
        ctas: [{ label: "Open Dashboard", href: "/" }],
      },
    ],
  },
  {
    slug: "opportunities",
    title: "Opportunities",
    navGroup: "user-guide",
    iconName: "TrendingUp",
    summary: "Work the sales pipeline from Prospecting through Won or Lost, then create a job.",
    whoCanDoThis: "Create/edit: admin, manager, member (if enabled). Create a job from Won: admin, manager.",
    recommendedFor: ["admin", "manager", "member"],
    subsections: [
      {
        heading: "Create or update an opportunity",
        body: {
          kind: "steps",
          steps: [
            { text: "Go to Opportunities → New (or open an existing card)." },
            { text: "Fill in customer/account, value, stage, assignee, and notes." },
            { text: "Save. Use the list or kanban view as available.", imageSlot: "Opportunity kanban board" },
          ],
        },
        ctas: [{ label: "Open Opportunities", href: "/opportunities" }],
      },
      {
        heading: "Win → create a job",
        whoCanDoThis: "admin, manager",
        body: {
          kind: "steps",
          steps: [
            { text: "Move the opportunity to Won and save the required win reason (or Lost + loss reason)." },
            { text: "Use Create job (or equivalent) from the opportunity." },
            { text: "Complete the job fields, then open the new job to add line items and a traveler." },
          ],
        },
      },
      {
        heading: "Note",
        body: {
          kind: "text",
          body: "Customer 360 also links open opportunities for that account, so you don't have to search twice.",
        },
      },
    ],
  },
  {
    slug: "jobs",
    title: "Jobs",
    navGroup: "user-guide",
    iconName: "Briefcase",
    summary: "Production tracking from To Do through Delivered — statuses, tabs, and assignees.",
    whoCanDoThis:
      "Create: admin, manager. Edit / import travelers: admin, manager, member. Manage assignees: admin, manager. Floor sign-off: all roles.",
    recommendedFor: ["admin", "manager", "member"],
    subsections: [
      {
        heading: "Status flow",
        body: {
          kind: "text",
          body: "Typical production path: To Do → In Progress → QC → Shipping → Delivered. Use the list or kanban views on Jobs.",
        },
      },
      {
        heading: "Create a job",
        whoCanDoThis: "admin, manager",
        body: {
          kind: "steps",
          steps: [
            { text: "Jobs → New, or create one from a Won opportunity." },
            { text: "Set customer, identifiers, dates, and assignees as needed." },
            { text: "Open the job and work through the tabs below." },
          ],
        },
        ctas: [
          { label: "Open Jobs", href: "/jobs" },
          { label: "Create a job", href: "/jobs/new" },
        ],
      },
      {
        heading: "Job detail tabs",
        body: {
          kind: "table",
          headers: ["Tab", "Use it for"],
          rows: [
            ["Overview", "Status, key fields, summary"],
            ["Line Items", "Production cards / WIP checklists"],
            ["Traveler", "Import WO PDF, print/email/DOCX, floor panel"],
            ["Documents", "Files (often the Google Drive job folder)"],
            ["Changes", "Change orders, issues, NCRs"],
            ["Activity", "Job system audit / activity feed"],
          ],
        },
      },
      {
        heading: "Assignees & delivered follow-up",
        body: {
          kind: "steps",
          steps: [
            { text: "Managers and admins set who owns or works the job — members generally edit content but don't manage the assignee list." },
            { text: "When a job is Delivered, the CRM can create a 30-day check-in follow-up for the relationship owner — complete it from Customer 360 or your follow-up list." },
          ],
        },
      },
    ],
  },
  {
    slug: "customers",
    title: "Customers",
    navGroup: "user-guide",
    iconName: "Building2",
    summary: "Accounts, contacts, activity, and follow-ups — all from the Customer 360 hub.",
    whoCanDoThis: "Roles with the Customers section enabled.",
    recommendedFor: ["admin", "manager", "member", "viewer"],
    subsections: [
      {
        heading: "Accounts & Customer 360",
        body: {
          kind: "steps",
          steps: [
            { text: "Customers shows the accounts list. Open one to open Customer 360.", imageSlot: "Customer 360 panel" },
            { text: "From Customer 360 you can view/edit account fields, manage contacts, see activity, create follow-ups, open linked jobs and opportunities, open a QuickBooks link, and send email or schedule a meeting once Google is connected." },
          ],
        },
        ctas: [{ label: "Open Customers", href: "/customers" }],
      },
      {
        heading: "Contacts",
        body: {
          kind: "steps",
          steps: [
            { text: "Add people under the account (name, title, email, phone)." },
            { text: "Mark one contact primary when appropriate." },
            { text: "Claim \"I own this relationship\" so Needs a touch → My queue and new follow-ups default to you." },
            { text: "Set a next touch date/owner for planned outreach." },
          ],
        },
      },
      {
        heading: "Log activity",
        body: {
          kind: "text",
          body: "Add notes, calls, meetings, or touches on the timeline. Synced Gmail/Calendar rows also appear here once you run Sync in Settings.",
        },
      },
    ],
    tour: {
      title: "Customer 360 walkthrough",
      description: "A quick tour of the account hub you'll live in most days.",
      steps: [
        { label: "Open an account from the Customers list", targetHint: "Customers table row" },
        { label: "Review contacts and mark the primary contact", targetHint: "Contacts panel" },
        { label: "Check the activity timeline for recent touches", targetHint: "Activity timeline" },
        { label: "Create a follow-up for your next outreach", targetHint: "Create follow-up button" },
      ],
    },
  },
  {
    slug: "needs-a-touch",
    title: "Needs a touch",
    navGroup: "user-guide",
    iconName: "Bell",
    summary: "Find contacts due for outreach and turn them into follow-ups.",
    whoCanDoThis: "Users with Customers access. All queue: admin, manager.",
    recommendedFor: ["admin", "manager", "member"],
    subsections: [
      {
        heading: "When a contact appears due",
        body: {
          kind: "text",
          body: "A contact shows up when its next-touch date is today or earlier, or when the last contact is older than 90 days with no future next touch set.",
        },
      },
      {
        heading: "Work a row",
        body: {
          kind: "steps",
          steps: [
            { text: "Open Customer 360 for the contact." },
            { text: "Log a touch." },
            { text: "Set the next touch date." },
            { text: "Create a follow-up — it's prefilled with contact/account/owner." },
          ],
        },
        ctas: [{ label: "Open Needs a touch", href: "/customers/needs-a-touch" }],
      },
      {
        heading: "My queue vs All",
        body: {
          kind: "text",
          body: "Default filter is My queue. Managers and admins can switch to All. Follow-ups are relationship to-dos and are separate from shop-floor checklist tasks on line items.",
        },
      },
    ],
  },
  {
    slug: "google-crm",
    title: "Google CRM",
    navGroup: "user-guide",
    iconName: "Mail",
    summary: "Connect your own Google account for Gmail and Calendar sync.",
    whoCanDoThis: "Any user can connect their own Google Workspace account.",
    recommendedFor: ["admin", "manager", "member", "viewer"],
    subsections: [
      {
        heading: "Connect",
        body: {
          kind: "steps",
          steps: [
            { text: "Go to Settings → Integrations." },
            { text: "Click Connect Google and approve the Gmail / Calendar / Contacts scopes as prompted." },
            { text: "If send or enrich fails later, Disconnect then Connect again to refresh scopes." },
          ],
        },
        ctas: [{ label: "Open Settings", href: "/settings" }],
      },
      {
        heading: "Sync (manual)",
        body: {
          kind: "steps",
          steps: [
            { text: "Sync Gmail pulls matching email activity into CRM timelines." },
            { text: "Sync Calendar does a light inbound meeting sync." },
            { text: "Sync is manual — press the button, it's not continuous background sync." },
          ],
        },
      },
      {
        heading: "Enrich contacts",
        body: {
          kind: "text",
          body: "Enrich contacts matches Google Contacts to existing CRM contacts by email and fills in blank phone / role title only. It does not create new CRM contacts from Google.",
        },
      },
      {
        heading: "Send email / schedule",
        body: {
          kind: "text",
          body: "From Customer 360 (contact Email, activity Reply, schedule meeting): outbound mail uses your connected Gmail and logs an email activity; calendar scheduling uses your connected Calendar.",
        },
      },
    ],
  },
  {
    slug: "material-pull",
    title: "Material Pull",
    navGroup: "user-guide",
    iconName: "Package",
    summary: "Request, approve, batch, and pull material for a job — on the CRM board or the floor PWA.",
    whoCanDoThis: "Depends on your Material Pull capabilities. Admins always have full pull powers.",
    recommendedFor: ["admin", "manager", "member", "floor"],
    subsections: [
      {
        heading: "Two surfaces, one data",
        body: {
          kind: "table",
          headers: ["Surface", "Location", "Best for"],
          rows: [
            ["CRM board", "CRM → Material Requests", "Office overview"],
            ["Floor PWA", "pull.qbfab.com → /pull", "Phone/tablet yard work"],
          ],
        },
        ctas: [
          { label: "Open Material Requests", href: "/material-requests" },
          { label: "Open floor Pull app", href: "/pull" },
        ],
      },
      {
        heading: "The funnel",
        body: {
          kind: "text",
          body: "Submit → Approve → (PM if borrow) → Batch & print → Mark pulled. Only approved requests go into a batch — never pending ones.",
        },
      },
      {
        heading: "Submit a request",
        whoCanDoThis: "can_request or admin",
        body: {
          kind: "steps",
          steps: [
            { text: "Open /pull or Material Requests → New." },
            { text: "Enter job #, material, qty, needed-by (required), priority, reason, location, and notes." },
            { text: "Reasons cover scrap / nest wrong / short staged / rush / other — borrow is not a reason code." },
            { text: "Borrowing from another job? Check Borrowing from another job and enter the Borrow from job #." },
            { text: "Submit. Hot priority alerts approvers by push and/or email when configured." },
          ],
        },
      },
      {
        heading: "Approve",
        whoCanDoThis: "can_approve",
        body: { kind: "text", body: "Open pending requests and Approve (non-borrow path)." },
      },
      {
        heading: "Approve borrow / allocation",
        whoCanDoThis: "can_approve_allocation",
        body: { kind: "text", body: "Approve items that need PM allocation — borrow, source job #, or \"Needs PM\"." },
      },
      {
        heading: "Batch & pull",
        whoCanDoThis: "can_batch",
        body: {
          kind: "steps",
          steps: [
            { text: "Open Batch." },
            { text: "Select approved requests." },
            { text: "Create a pull list, then Print." },
            { text: "Pull material using the checklist and notes." },
            { text: "Mark pulled." },
          ],
        },
      },
      {
        heading: "Reference",
        body: { kind: "text", body: "Queue sorting prefers hot priority, then need-by date. See the Material Pull cheat sheet for the laminated floor version." },
        ctas: [{ label: "Open Material Pull cheat sheet", href: "/help/cheat-sheet-material-pull" }],
      },
    ],
    tour: {
      title: "Submit → approve → batch",
      description: "Walk through one pull request end to end.",
      steps: [
        { label: "Submit a request with job #, qty, and needed-by date", targetHint: "New pull request form" },
        { label: "An approver approves the pending request", targetHint: "Approve button on request card" },
        { label: "A batch handler selects approved requests into a batch", targetHint: "Batch selection checkboxes" },
        { label: "Print the pull list, then mark it pulled", targetHint: "Mark pulled button" },
      ],
    },
  },
  {
    slug: "travelers",
    title: "Travelers",
    navGroup: "user-guide",
    iconName: "ClipboardList",
    summary: "Import the work-order PDF, print or email it, and sign off the floor checklist.",
    whoCanDoThis: "Import / print / export: admin, manager, member. Sign off checklist tasks: all roles, with a floor PIN.",
    recommendedFor: ["admin", "manager", "member", "floor"],
    subsections: [
      {
        heading: "Surfaces",
        body: {
          kind: "text",
          body: "Job → Traveler tab, the standalone traveler.qbfab.com → /traveler PWA, or the print route from the job or traveler page.",
        },
        ctas: [{ label: "Open Traveler app", href: "/traveler" }],
      },
      {
        heading: "Import a work-order PDF",
        body: {
          kind: "steps",
          steps: [
            { text: "Open the job (or the Traveler app and pick the job)." },
            { text: "Upload the QB work-order PDF." },
            { text: "Review the parsed fields: Customer (Ship To), PO, Order Date, QB SO, Ship Date, catalog lines." },
            { text: "Confirm the Structure # (auto-detected from marks like (MK-0532R)) or Fill N/A." },
            { text: "Import traveler — this saves the traveler and lines, seeds production line items / checklists, and soft-syncs the job PO/marks." },
          ],
        },
      },
      {
        heading: "Print / email / DOCX",
        body: {
          kind: "text",
          body: "Anytime after import: Print for an HTML print view, Email for a deep link via Resend, or Download DOCX built from the database (and logged). Re-import creates a new version and marks the previous active traveler superseded — old production cards are not auto-deleted.",
        },
      },
      {
        heading: "Floor sign-off",
        body: {
          kind: "steps",
          steps: [
            { text: "Open the job traveler / floor panel — often on a station tablet." },
            { text: "Select the checklist task (Machine / Fabrication / QA / Shipping)." },
            { text: "Pick the worker, enter their floor PIN, choose reason chips, and add an optional note." },
            { text: "Submit the sign-off." },
          ],
        },
      },
      {
        heading: "Station tablets",
        body: {
          kind: "text",
          body: "Station tablets stay logged in as a station account; each sign-off picks a real worker plus their PIN — it doesn't switch Google sessions. Personal logins default the worker to yourself, but a PIN is still required. See the Traveler cheat sheet for the laminated floor version.",
        },
        ctas: [{ label: "Open Traveler cheat sheet", href: "/help/cheat-sheet-traveler" }],
      },
    ],
    tour: {
      title: "Floor sign-off walkthrough",
      description: "The exact taps a floor worker makes to sign off a checklist task.",
      steps: [
        { label: "Open the job's traveler / floor panel", targetHint: "Traveler tab" },
        { label: "Tap the checklist task to sign off", targetHint: "Checklist task row" },
        { label: "Select your name from the worker picker", targetHint: "Worker picker" },
        { label: "Enter your floor PIN and submit", targetHint: "PIN entry + submit button" },
      ],
    },
  },
  {
    slug: "reports",
    title: "Reports",
    navGroup: "user-guide",
    iconName: "BarChart3",
    summary: "Filter, analyze, and export production and pipeline data.",
    whoCanDoThis: "Roles with the Reports section enabled.",
    recommendedFor: ["admin", "manager"],
    subsections: [
      {
        heading: "Run a report",
        body: {
          kind: "steps",
          steps: [
            { text: "Open Reports." },
            { text: "Apply filters or choose a saved view." },
            { text: "Export CSV when you need a spreadsheet." },
          ],
        },
        ctas: [{ label: "Open Reports", href: "/reports" }],
      },
      {
        heading: "Note",
        body: {
          kind: "text",
          body: "Use reports for management review — day-to-day edits still happen on Jobs, Opportunities, and Customers.",
        },
      },
    ],
  },
  {
    slug: "quickbooks",
    title: "QuickBooks",
    navGroup: "user-guide",
    iconName: "Link2",
    summary: "Manual deep links to QuickBooks Online — no automatic sync.",
    whoCanDoThis: "Users who can edit the account/job fields where chips are stored.",
    recommendedFor: ["admin", "manager", "member"],
    subsections: [
      {
        heading: "Using QB chips",
        body: {
          kind: "steps",
          steps: [
            { text: "Paste the QuickBooks Online URL for a customer or job into the CRM chip/field." },
            { text: "Click the chip later to open QB in the browser." },
            { text: "There is no automatic invoice/estimate sync — QuickBooks remains the accounting system of record and the CRM just holds the shortcut." },
          ],
        },
      },
    ],
  },
  {
    slug: "faq",
    title: "FAQ",
    navGroup: "user-guide",
    iconName: "CircleHelp",
    summary: "Fast fixes for the most common questions.",
    recommendedFor: ["admin", "manager", "member", "viewer", "floor"],
    subsections: [
      {
        heading: "Troubleshooting",
        body: {
          kind: "table",
          headers: ["Problem", "What to try"],
          rows: [
            ["Menu item missing", "Your role may not have that section — ask an admin to check Section access."],
            ["Cannot create a job", "Need admin or manager."],
            ["Cannot edit a job", "Viewers cannot edit; use a member+ seat or sign off only on floor tasks."],
            ["Google send fails", "Settings → Disconnect Google → Connect again (send scope)."],
            ["Enrich did nothing", "Enrich only fills blank fields on contacts that already match by email."],
            ["Cannot see Batch on Pull", "Need can_batch (or admin)."],
            ["Borrow stuck", "Needs can_approve_allocation (PM), not only can_approve."],
            ["Floor PIN rejected", "Ask admin to reset the PIN; confirm you selected the correct worker on a station tablet."],
            ["Offline", "Use the /~offline guidance; reconnect to sync when network returns."],
            ["Pull vs CRM data mismatch", "Same Supabase data — refresh, and confirm you're on the production URLs."],
          ],
        },
      },
    ],
  },
  {
    slug: "glossary",
    title: "Glossary",
    navGroup: "user-guide",
    iconName: "BookOpen",
    summary: "Terms used across the CRM, Material Pull, and Traveler.",
    recommendedFor: ["admin", "manager", "member", "viewer", "floor"],
    subsections: [
      {
        heading: "Terms",
        body: {
          kind: "table",
          headers: ["Term", "Meaning"],
          rows: [
            ["Account", "Customer company record"],
            ["Contact", "Person at an account"],
            ["Opportunity", "Pre-win sales deal"],
            ["Job", "Production job after win / release"],
            ["Traveler", "Digital work-order packet + lines for the shop"],
            ["Line item", "Production card / WIP unit on a job"],
            ["Floor task / checklist", "Shop steps (Machine, Fab, QA, Shipping) signed with PIN"],
            ["Follow-up", "CRM relationship to-do"],
            ["Activity (CRM)", "Note/call/meeting/touch/email on Customer 360"],
            ["Activity log (job)", "System audit feed on the job"],
            ["Material pull", "Request to stage/pull stock for a job"],
            ["Batch", "Group of approved pulls printed as a pull list"],
            ["Station account", "Shared tablet login for floor sign-off"],
            ["Floor PIN", "Worker code used at sign-off (not a login password)"],
            ["Section access", "Which roles see which sidebar modules"],
            ["QB chip", "Manual QuickBooks Online deep link"],
          ],
        },
      },
    ],
  },
  {
    slug: "admin",
    title: "Admin guide",
    navGroup: "admin-guide",
    iconName: "Shield",
    summary: "Invite users, set roles, manage Material Pull capabilities, and configure section access.",
    whoCanDoThis: "admin role only.",
    recommendedFor: ["admin"],
    adminOnly: true,
    subsections: [
      {
        heading: "Admin home",
        body: {
          kind: "text",
          body: "Open Admin in the sidebar — only the admin role can access this area. Typical work: invite/edit users, set roles, toggle Material Pull capabilities, mark station accounts, set floor PINs, and manage Section access.",
        },
        ctas: [{ label: "Open Admin", href: "/admin" }],
      },
      {
        heading: "Invite & edit users",
        body: {
          kind: "steps",
          steps: [
            { text: "Admin → Users → invite/create flow (email + role)." },
            { text: "The user completes login/password as prompted by Auth." },
            { text: "Confirm they appear active and can reach the right app URL (CRM vs Pull vs Traveler)." },
          ],
        },
      },
      {
        heading: "Role assignment cheat sheet",
        body: {
          kind: "table",
          headers: ["Hire / seat", "Suggested role", "Notes"],
          rows: [
            ["Systems / owner configuring the app", "admin", "Few seats"],
            ["PM / production manager / sales manager", "manager", "Often + pull caps"],
            ["Estimator, coordinator, salesperson, yard with edits", "member", "+ can_request if they pull"],
            ["Station tablet shared login", "viewer + station flag", "No personal PIN on the station user"],
            ["Read-only office", "viewer", "Section access as needed"],
          ],
        },
      },
      {
        heading: "Section access",
        body: {
          kind: "text",
          body: "Admin → Organization Settings → Section access controls which roles see Opportunities, Jobs, Material Requests, Customers, and Reports. Dashboard and Settings are always on; Admin is admin-only. A missing override row means \"use product defaults.\"",
        },
      },
      {
        heading: "Material Pull capabilities",
        body: {
          kind: "table",
          headers: ["Capability", "Grant to"],
          rows: [
            ["can_request", "Anyone who submits pulls (often member)"],
            ["can_approve", "Approves pending non-borrow (often production/yard manager)"],
            ["can_approve_allocation", "Approves borrow / needs-PM (often PM)"],
            ["can_batch", "Builds print lists and marks pulled"],
          ],
        },
      },
      {
        heading: "Station accounts & floor PINs",
        body: {
          kind: "steps",
          steps: [
            { text: "Create an Auth user for the tablet, then enable Station / tablet account on their profile — role is often viewer." },
            { text: "For real workers, set a floor PIN (4–8 digits) on their profile." },
            { text: "Workers sign off by selecting their name and PIN on the tablet." },
            { text: "Clear or reset a PIN from Admin if it's forgotten — self-serve reset is on the backlog." },
          ],
        },
      },
      {
        heading: "Common support tickets",
        body: {
          kind: "table",
          headers: ["Ticket", "Admin action"],
          rows: [
            ["\"I don't see Jobs / Customers\"", "Check Section access for their role"],
            ["\"Can't create jobs\"", "Promote to manager (or admin) if appropriate"],
            ["\"Can't approve pulls\"", "Enable can_approve / can_approve_allocation"],
            ["\"No Batch tab\"", "Enable can_batch"],
            ["\"PIN doesn't work\"", "Clear + set a new floor PIN on the worker"],
            ["\"Tablet signed in as wrong person\"", "Use the station account; don't use personal Google on a kiosk"],
            ["New hire", "Invite → role → pull caps → PIN if floor"],
          ],
        },
      },
    ],
  },
  {
    slug: "cheat-sheet-material-pull",
    title: "Material Pull cheat sheet",
    navGroup: "floor-cheat-sheets",
    iconName: "Tablet",
    summary: "The laminated version — submit, approve, batch, and mark pulled.",
    whoCanDoThis: "Depends on your capability flags: can_request, can_approve, can_approve_allocation, can_batch.",
    recommendedFor: ["floor", "member", "manager"],
    subsections: [
      {
        heading: "1. Submit a request",
        body: {
          kind: "steps",
          steps: [
            { text: "Open Pull → New." },
            { text: "Job # · material · qty · needed-by · priority · reason · location · notes." },
            { text: "Borrowing? Check Borrowing from another job → enter Borrow from job #." },
            { text: "Submit. Use Hot only when it truly is — approvers get notified." },
          ],
        },
        ctas: [{ label: "Open floor Pull app", href: "/pull" }],
      },
      {
        heading: "2. Approve",
        body: {
          kind: "steps",
          steps: [
            { text: "Open the request (board or detail)." },
            { text: "Approve if you have can_approve." },
            { text: "Borrow / Needs PM → a PM with can_approve_allocation approves." },
          ],
        },
      },
      {
        heading: "3. Batch → print → mark pulled",
        body: {
          kind: "steps",
          steps: [
            { text: "Open Batch (needs can_batch)." },
            { text: "Select approved lines (hot / need-by sort)." },
            { text: "Create pull list → Print." },
            { text: "Pull material." },
            { text: "Checklist / notes → Mark pulled." },
          ],
        },
      },
      {
        heading: "Quick fixes",
        body: {
          kind: "table",
          headers: ["Issue", "Fix"],
          rows: [
            ["No Batch tab", "Ask admin for can_batch"],
            ["Can't submit", "Ask admin for can_request"],
            ["Borrow stuck", "Needs PM allocation approval"],
            ["No alerts", "Allow notifications; email fallback if push is off"],
          ],
        },
      },
    ],
  },
  {
    slug: "cheat-sheet-traveler",
    title: "Traveler cheat sheet",
    navGroup: "floor-cheat-sheets",
    iconName: "Tablet",
    summary: "The laminated version — checklist sign-off with a floor PIN.",
    whoCanDoThis: "All roles can sign off; viewers still can't edit the job.",
    recommendedFor: ["floor", "viewer", "member"],
    subsections: [
      {
        heading: "Station tablet (shared login)",
        body: {
          kind: "steps",
          steps: [
            { text: "The tablet stays signed in as the station account." },
            { text: "Do not sign into a personal Google account on the kiosk." },
            { text: "Every sign-off: pick your name → enter your PIN." },
          ],
        },
      },
      {
        heading: "Sign off a checklist task",
        body: {
          kind: "steps",
          steps: [
            { text: "Open the job traveler / floor panel." },
            { text: "Find the task (Machine / Fabrication / QA / Shipping)." },
            { text: "Tap to sign off." },
            { text: "Select worker." },
            { text: "Enter floor PIN (4–8 digits)." },
            { text: "Tap reason chip(s); add a note if needed." },
            { text: "Submit." },
          ],
        },
        ctas: [{ label: "Open Traveler app", href: "/traveler" }],
      },
      {
        heading: "Quick fixes",
        body: {
          kind: "table",
          headers: ["Issue", "Fix"],
          rows: [
            ["PIN rejected", "Check worker name; ask admin to reset PIN"],
            ["Wrong person on tablet", "Use the station account + picker, not a shared personal login"],
            ["Can't edit job", "Expected for viewer/station — sign-off only"],
            ["No traveler on job", "Ask the office to import the work-order PDF"],
          ],
        },
      },
    ],
  },
]

export function getHelpChapter(slug: string): HelpChapter | undefined {
  return helpChapters.find((chapter) => chapter.slug === slug)
}

export function getChaptersByGroup(navGroup: HelpChapter["navGroup"]): HelpChapter[] {
  return helpChapters.filter((chapter) => chapter.navGroup === navGroup)
}
