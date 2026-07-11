# Functional Requirements

This document specifies the core functional requirements for the SPC Workforce Management Platform. All status flags default to `Not Audited`.

---

### AUTH-001 — Entry Login Redirection

**Module:** Authentication  
**Role:** All Roles  
**Route:** `/login`  
**Priority:** High  
**Status:** Not Audited

**Requirement**

The system must redirect unauthenticated entry attempts to `/login` and provide login options (Email + Password).

**Trigger**

A user attempts to load any protected page or navigates to `/login` directly.

**Expected Behaviour**

1. Renders the landing login screen.
2. Form submits details to the server authentication endpoint.
3. Successful authentication routes the user to `/dashboard` (or codebase equivalent `/`).

**Validation Rules**

- Email format validation.
- Password cannot be blank.

**Persistence Requirement**

Saves the JWT access token in safe storage (localStorage/sessionStorage) across page loads.

**Cross-Module Impact**

Grants session access across all protected HRMS sub-modules.

**Permission Rules**

All users and guest candiates can load the login pages.

**Completion Criteria**

- The action is clickable
- The expected page or modal opens
- Validation works
- Data is created or updated
- Dependent modules update
- Data survives refresh
- Success and error states exist
- Role restrictions work
- Relevant end-to-end test passes

---

### ROLE-001 — Enforce Admin & HR RBAC

**Module:** Users & Roles  
**Role:** Company Admin, HR  
**Route:** `/users`  
**Priority:** High  
**Status:** Not Audited

**Requirement**

The platform must limit page access and CRUD operations based on `company_admin` or `hr` roles.

**Trigger**

A user clicks on a sidebar link or triggers page actions.

**Expected Behaviour**

1. If the role is `hr`, settings configurations, approvals, departments, and user lists are blocked.
2. If the role is `company_admin`, full access is granted.
3. Attempting to bypass URL checks shows the Unauthorized Access screen.

**Validation Rules**

- Active user role checks are run on every route mount.

**Persistence Requirement**

The role settings remain configured inside user database models.

**Cross-Module Impact**

Restricts sidebar render flags and route mounts.

**Permission Rules**

Role assignments can be managed only by Company Admin users.

**Completion Criteria**

- The action is clickable
- The expected page or modal opens
- Validation works
- Data is created or updated
- Dependent modules update
- Data survives refresh
- Success and error states exist
- Role restrictions work
- Relevant end-to-end test passes

---

### NAV-001 — Admin Sidebar Navigation

**Module:** Dashboard  
**Role:** Company Admin, HR  
**Route:** `/dashboard`  
**Priority:** High  
**Status:** Not Audited

**Requirement**

The system must show sidebar menus matching the active user role permissions.

**Trigger**

The user authenticates successfully and mounts the application shell.

**Expected Behaviour**

1. Company Admin sidebar shows Dashboard, Candidates, Pending Approvals, Departments, HR Management, HR Activity History, Contracts, Employee Management.
2. Clicking a navigation item updates route parameters and main panel views.
3. Active items show visual indicator highlights.

**Validation Rules**

- Protected sub-routes check permissions.

**Persistence Requirement**

Sidebar collapsed/expanded state is saved.

**Cross-Module Impact**

Switches main viewport layouts.

**Permission Rules**

Internal authenticated roles only.

**Completion Criteria**

- The action is clickable
- The expected page or modal opens
- Validation works
- Data is created or updated
- Dependent modules update
- Data survives refresh
- Success and error states exist
- Role restrictions work
- Relevant end-to-end test passes

---

### DASH-001 — Admin Dashboard Statistics

**Module:** Dashboard  
**Role:** Company Admin, HR  
**Route:** `/dashboard`  
**Priority:** Medium  
**Status:** Not Audited

**Requirement**

The dashboard must display summary count cards and historical growth trends charts.

**Trigger**

The user loads `/dashboard`.

**Expected Behaviour**

1. Statistics cards load: Total HR Users, Active HR Users, Job Openings, Candidates.
2. Trend charts render: HR Users Growth, Job Openings Trend, Candidates by Stage, Candidates by Sourcing.
3. Data reconciles with active database counts.

**Validation Rules**

- Values must recalculate dynamically.

**Persistence Requirement**

Metrics pull current calculations on load.

**Cross-Module Impact**

Updates instantly as candidates, users, or openings are changed.

**Permission Rules**

Company Admin and HR roles can read metrics.

**Completion Criteria**

- The action is clickable
- The expected page or modal opens
- Validation works
- Data is created or updated
- Dependent modules update
- Data survives refresh
- Success and error states exist
- Role restrictions work
- Relevant end-to-end test passes

---

### JOB-001 — Job Desk Openings Management

**Module:** Job Desk  
**Role:** HR, Company Admin  
**Route:** `/job-desk`  
**Priority:** High  
**Status:** Not Audited

**Requirement**

Allows posting job descriptions, editing parameters, deleting records, and managing status toggles (Draft, Published, Closed).

**Trigger**

HR clicks "Post New Job" or selects an item from Job Desk.

**Expected Behaviour**

1. Opens Job Posting form or drawer.
2. Submitting saves job parameters (Title, Experience, Deadline, Skills).
3. Status changes publish jobs immediately to public careers view.

**Validation Rules**

- Job Title, Location, and Application Deadline are mandatory inputs.

**Persistence Requirement**

Job data is written permanently.

**Cross-Module Impact**

Published jobs show on the public website.

**Permission Rules**

HR and Company Admin users.

**Completion Criteria**

- The action is clickable
- The expected page or modal opens
- Validation works
- Data is created or updated
- Dependent modules update
- Data survives refresh
- Success and error states exist
- Role restrictions work
- Relevant end-to-end test passes

---

### CAN-001 — Candidate Resume Parser

**Module:** Candidates  
**Role:** HR, Company Admin  
**Route:** `/candidates`  
**Priority:** High  
**Status:** Not Audited

**Requirement**

The system must parse candidate files (PDF/DOCX) or accept pasted raw resume text to create candidate profiles.

**Trigger**

User clicks "Add Raw Resume Text" (modal) or "Upload Resume File" on candidates screen.

**Expected Behaviour**

1. Form accepts files or pasted text.
2. Saving creates Candidate profile card.
3. Matches extracted skills with active JDs to suggest match scores.

**Validation Rules**

- Paste text cannot be blank. File format must check extensions (.pdf, .docx).

**Persistence Requirement**

Profiles save permanently.

**Cross-Module Impact**

Candidate record is added to candidate list pools.

**Permission Rules**

HR and Company Admin roles.

**Completion Criteria**

- The action is clickable
- The expected page or modal opens
- Validation works
- Data is created or updated
- Dependent modules update
- Data survives refresh
- Success and error states exist
- Role restrictions work
- Relevant end-to-end test passes

---

### APP-001 — AI Applicants Analysis

**Module:** Job Desk  
**Role:** HR, Company Admin  
**Route:** `/job-desk/:jobId/applicants`  
**Priority:** Medium  
**Status:** Not Audited

**Requirement**

Allows analyzing candidate lists using advisory AI matched parameters, tracking pipeline stages, and exporting applicant data.

**Trigger**

HR opens Job Applicants and clicks "Analyze Candidates using AI".

**Expected Behaviour**

1. Renders match summaries: match score, strengths, gaps.
2. Clicking "Export Applicants" downloads CSV file.
3. Allows changing applicant stages via dropdown (Screening, Shortlisted, Selected).

**Validation Rules**

- Target stage change dropdowns must follow sequential flows.

**Persistence Requirement**

Pipeline changes persist.

**Cross-Module Impact**

Updates candidates by stage chart counts.

**Permission Rules**

HR and Company Admin.

**Completion Criteria**

- The action is clickable
- The expected page or modal opens
- Validation works
- Data is created or updated
- Dependent modules update
- Data survives refresh
- Success and error states exist
- Role restrictions work
- Relevant end-to-end test passes

---

### ONB-001 — Onboarding Pipeline Checklist

**Module:** Employee Management  
**Role:** HR, Company Admin  
**Route:** `/employees/onboarding`  
**Priority:** High  
**Status:** Not Audited

**Requirement**

Tracks onboarding stages (Offer Sent, Offer Accepted, Documents Pending, Documents Verified, Joining Date Set, Onboarding Completed) and converts candidate files to Employee records.

**Trigger**

HR opens the Onboarding pipeline or advances selected candidates.

**Expected Behaviour**

1. pipeline renders current compliance stage of candidates.
2. "Complete Onboarding" button generates active Employee profile.
3. Progress bar allows skipping stages.

**Validation Rules**

- Employee record cannot be created without verification checklist approvals.

**Persistence Requirement**

Checklist states remain saved.

**Cross-Module Impact**

Converts candidate profiles to active employee records.

**Permission Rules**

HR and Company Admin roles.

**Completion Criteria**

- The action is clickable
- The expected page or modal opens
- Validation works
- Data is created or updated
- Dependent modules update
- Data survives refresh
- Success and error states exist
- Role restrictions work
- Relevant end-to-end test passes

---

### APR-001 — Approvals Gateways

**Module:** Pending Approvals  
**Role:** Company Admin  
**Route:** `/approvals/pending`  
**Priority:** High  
**Status:** Not Audited

**Requirement**

Admins must review, approve, or reject onboarding offer requests and contract deployment clearances.

**Trigger**

HR submits onboarding clearances or contracts for authorization.

**Expected Behaviour**

1. Pending entries display in Admin review grid.
2. Admin reviews rates, terms, and compensation packages.
3. Click "Approve" transitions statuses to approved.

**Validation Rules**

- Rejection action requires inputting review notes.

**Persistence Requirement**

Approvals write checkmarks to database state fields.

**Cross-Module Impact**

Approved status unlocks contract deployment activation and document dispatch.

**Permission Rules**

Company Admin only.

**Completion Criteria**

- The action is clickable
- The expected page or modal opens
- Validation works
- Data is created or updated
- Dependent modules update
- Data survives refresh
- Success and error states exist
- Role restrictions work
- Relevant end-to-end test passes

---

### DOC-001 — Secure Document Verification

**Module:** Onboarding  
**Role:** HR, Company Admin  
**Route:** `/public/upload-documents/:token`  
**Priority:** High  
**Status:** Not Audited

**Requirement**

Sends token-based upload links to candidates, reviews submitted files, and records audit marks.

**Trigger**

HR triggers "Request Documents" from the onboarding panel.

**Expected Behaviour**

1. System sends token-based email link.
2. Candidate uploads ID files (PDF/JPG/PNG).
3. HR verifies documents, flagging approvals or rejection reasons.

**Validation Rules**

- Token check confirms links are active and not expired.

**Persistence Requirement**

Uploaded file references remain saved.

**Cross-Module Impact**

Approved documents clear the documents check in the onboarding checklist.

**Permission Rules**

HR and Admins verify; candidate uploads files.

**Completion Criteria**

- The action is clickable
- The expected page or modal opens
- Validation works
- Data is created or updated
- Dependent modules update
- Data survives refresh
- Success and error states exist
- Role restrictions work
- Relevant end-to-end test passes

---

### EMP-001 — Employee Profile Directory

**Module:** Employee Management  
**Role:** HR, Company Admin  
**Route:** `/employees`  
**Priority:** High  
**Status:** Not Audited

**Requirement**

Provides a directory of employees, manual profile creation form, and spreadsheet bulk upload controls.

**Trigger**

User opens employee list, clicks "Add Employee", or uploads file.

**Expected Behaviour**

1. Manual form saves details (Personal, Department, Code).
2. Bulk upload validates Excel/CSV columns and imports records.
3. Renders directory searches and profile pages.

**Validation Rules**

- Name, email, and employee code are mandatory.
- Import files validate columns before insertion.

**Persistence Requirement**

Data persists in system directories.

**Cross-Module Impact**

Fills the employee-department list dashboard.

**Permission Rules**

HR and Company Admin roles.

**Completion Criteria**

- The action is clickable
- The expected page or modal opens
- Validation works
- Data is created or updated
- Dependent modules update
- Data survives refresh
- Success and error states exist
- Role restrictions work
- Relevant end-to-end test passes

---

### DEP-001 — Departments Setup

**Module:** Departments  
**Role:** Company Admin  
**Route:** `/departments`  
**Priority:** Medium  
**Status:** Not Audited

**Requirement**

Allows managing organizational departments (CRUD operations) and assigning employees.

**Trigger**

Admin clicks "Create Department" or modifies assignments.

**Expected Behaviour**

1. Creates department code and details.
2. Displays employee counts per department.
3. Allows changing department assignments.

**Validation Rules**

- Department names must be unique.

**Persistence Requirement**

Mappings save permanently.

**Cross-Module Impact**

Updates employee profile department references.

**Permission Rules**

Company Admin only.

**Completion Criteria**

- The action is clickable
- The expected page or modal opens
- Validation works
- Data is created or updated
- Dependent modules update
- Data survives refresh
- Success and error states exist
- Role restrictions work
- Relevant end-to-end test passes

---

### CON-001 — Contracts Operations

**Module:** Contract Management  
**Role:** Company Admin  
**Route:** `/contracts`  
**Priority:** High  
**Status:** Not Audited

**Requirement**

Allows creating rate-based or fixed-deliverable contracts, mapping deliverables, tracking durations, and setting payment configurations.

**Trigger**

User clicks "Create New Contract" or opens dashboard alerts.

**Expected Behaviour**

1. Creator form binds contract details to selected employees.
2. dashboard displays warning counts for expiring/expired agreements.
3. Renders full contract lookup details.

**Validation Rules**

- Contract duration must have start and end dates.

**Persistence Requirement**

Contract configurations save permanently.

**Cross-Module Impact**

Updates active contract counts on dashboard.

**Permission Rules**

Admin roles approve/reject; HR has read-only/draft capabilities.

**Completion Criteria**

- The action is clickable
- The expected page or modal opens
- Validation works
- Data is created or updated
- Dependent modules update
- Data survives refresh
- Success and error states exist
- Role restrictions work
- Relevant end-to-end test passes

---

### HRM-001 — HR User Administration

**Module:** HR Management  
**Role:** Company Admin  
**Route:** `/hr-management`  
**Priority:** High  
**Status:** Not Audited

**Requirement**

Super Admin directory to create HR accounts, activate/deactivate logs, and assign system permissions.

**Trigger**

Admin opens HR Management list.

**Expected Behaviour**

1. Displays directory of users and status switches.
2. Admin can create new account keys.
3. Switching roles applies permission restrictions.

**Validation Rules**

- Email is validated.

**Persistence Requirement**

Changes written permanently.

**Cross-Module Impact**

Immediately updates role switch settings.

**Permission Rules**

Company Admin only.

**Completion Criteria**

- The action is clickable
- The expected page or modal opens
- Validation works
- Data is created or updated
- Dependent modules update
- Data survives refresh
- Success and error states exist
- Role restrictions work
- Relevant end-to-end test passes

---

### ACT-001 — HR Activity History Log

**Module:** HR Activity History  
**Role:** Company Admin  
**Route:** `/hr-activity-history`  
**Priority:** Low  
**Status:** Not Audited

**Requirement**

Maintains a comprehensive, filterable list tracking HR onboarding, deployment, and contract events.

**Trigger**

Users perform action events across platform.

**Expected Behaviour**

1. Appends timeline logs.
2. Timeline grid permits filtering by action types (Onboarding, Contract).
3. Renders description details and actor names.

**Validation Rules**

- Event parameters cannot be null.

**Persistence Requirement**

Logs are immutable.

**Cross-Module Impact**

Exposes audit details on overview pages.

**Permission Rules**

Company Admin only.

**Completion Criteria**

- The action is clickable
- The expected page or modal opens
- Validation works
- Data is created or updated
- Dependent modules update
- Data survives refresh
- Success and error states exist
- Role restrictions work
- Relevant end-to-end test passes

---

### PUB-001 — Careers Page

**Module:** Careers Page  
**Role:** Public Candidate  
**Route:** `/jobs`  
**Priority:** High  
**Status:** Not Audited

**Requirement**

Public portal route for guests to search active job descriptions, read details, and upload resume files.

**Trigger**

A visitor opens the `/jobs` careers portal.

**Expected Behaviour**

1. Lists active openings card.
2. Clicking apply displays a simple form (Name, Contact Details, Resume attachment).
3. Submitting saves candidate profile.

**Validation Rules**

- Name is required. Email or Phone is mandatory.

**Persistence Requirement**

Candidate files remain stored.

**Cross-Module Impact**

Increments candidate database pool count.

**Permission Rules**

Open to public guests.

**Completion Criteria**

- The action is clickable
- The expected page or modal opens
- Validation works
- Data is created or updated
- Dependent modules update
- Data survives refresh
- Success and error states exist
- Role restrictions work
- Relevant end-to-end test passes

---

### OFF-001 — Employee Offboarding

**Module:** Employee Management  
**Role:** HR, Company Admin  
**Route:** `/employees/offboarding`  
**Priority:** High  
**Status:** Not Audited

**Requirement**

Processes employee exits, clearance checklists, and updates status fields.

**Trigger**

Operations manager initiates offboarding.

**Expected Behaviour**

1. Initiates offboarding workflow.
2. Tracks clearance processes.
3. Completing offboarding marks employee status as exited.

**Validation Rules**

- Exit clearances must be completed.

**Persistence Requirement**

Data remains permanently.

**Cross-Module Impact**

Halts contract calculations.

**Permission Rules**

HR and Admin roles.

**Completion Criteria**

- The action is clickable
- The expected page or modal opens
- Validation works
- Data is created or updated
- Dependent modules update
- Data survives refresh
- Success and error states exist
- Role restrictions work
- Relevant end-to-end test passes
