# Functional Requirements

This document specifies the expanded, atomic functional requirements for the SPC Workforce Management Platform. All statuses default to `Not Audited`.

---

### AUTH-001 — Display login landing page and credentials inputs (Email + Password).

**Module:** Authentication  
**Role:** All Roles / Guest  
**Route:** `/login`  
**Status:** Not Audited  
**Test ID:** TEST-AUTH-01  

**Requirement**

Display login landing page and credentials inputs (Email + Password).

**Trigger**

User attempts to navigate to a protected URL or opens /login directly.

**Expected Behaviour**

Renders SPC Management Portal landing page with credential fields.

**Validation Rules**

- Form validates structure before submission.

**Cross-Module Impact / Dependencies**

None

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

### AUTH-002 — Email and password validation on login entry.

**Module:** Authentication  
**Role:** Guest  
**Route:** `/login`  
**Status:** Not Audited  
**Test ID:** TEST-AUTH-01  

**Requirement**

Email and password validation on login entry.

**Trigger**

User enters fields or clicks Login.

**Expected Behaviour**

Error message displays for incorrect email format or blank password.

**Validation Rules**

- Email must conform to RFC standard format, password must be non-empty.

**Cross-Module Impact / Dependencies**

None

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

### AUTH-003 — Credentials submission validation.

**Module:** Authentication  
**Role:** Guest  
**Route:** `/login`  
**Status:** Not Audited  
**Test ID:** TEST-AUTH-01  

**Requirement**

Credentials submission validation.

**Trigger**

User clicks 'Log In' submit button.

**Expected Behaviour**

Authenticates credentials and redirects to Dashboard on success.

**Validation Rules**

- Credentials are verified against database auth records.

**Cross-Module Impact / Dependencies**

ROLE-001 (loads user roles)

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

### AUTH-004 — JWT local session persistence.

**Module:** Authentication  
**Role:** All Roles  
**Route:** `All Routes`  
**Status:** Not Audited  
**Test ID:** TEST-AUTH-01  

**Requirement**

JWT local session persistence.

**Trigger**

Successful user login validation.

**Expected Behaviour**

JWT token is stored in localStorage / sessionStorage to persist login state.

**Validation Rules**

- Token must be valid and cryptographically signed.

**Cross-Module Impact / Dependencies**

None

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

### AUTH-005 — Logout session clearance.

**Module:** Authentication  
**Role:** All Roles  
**Route:** `All Routes`  
**Status:** Not Audited  
**Test ID:** TEST-AUTH-01  

**Requirement**

Logout session clearance.

**Trigger**

User clicks the Logout option in user dropdown profile.

**Expected Behaviour**

Removes session token and redirects user to /login.

**Validation Rules**

- Token storage is emptied.

**Cross-Module Impact / Dependencies**

None

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

### AUTH-006 — Route guards unauthenticated redirection.

**Module:** Authentication  
**Role:** All Roles / Guest  
**Route:** `All Protected Routes`  
**Status:** Not Audited  
**Test ID:** TEST-AUTH-01  

**Requirement**

Route guards unauthenticated redirection.

**Trigger**

Unauthenticated user tries to access protected page directly.

**Expected Behaviour**

Redirects user to /login.

**Validation Rules**

- Access is blocked if token is absent or invalid.

**Cross-Module Impact / Dependencies**

None

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

### ROLE-001 — Enforce Company Admin full global access permissions.

**Module:** Users & Roles  
**Role:** Company Admin  
**Route:** `All Routes`  
**Status:** Not Audited  
**Test ID:** TEST-ROLE-01  

**Requirement**

Enforce Company Admin full global access permissions.

**Trigger**

Company Admin accesses any screen or triggers CRUD actions.

**Expected Behaviour**

Unrestricted access granted to all HR, operations, settings, and billing features.

**Validation Rules**

- Active user model has role == 'company_admin'.

**Cross-Module Impact / Dependencies**

AUTH-004

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

### ROLE-002 — Enforce HR role-based access restrictions.

**Module:** Users & Roles  
**Role:** HR  
**Route:** `All Routes`  
**Status:** Not Audited  
**Test ID:** TEST-ROLE-01  

**Requirement**

Enforce HR role-based access restrictions.

**Trigger**

HR user attempts to load admin-only pages or edit admin-only configurations.

**Expected Behaviour**

Access is blocked, and page displays Unauthorized Access message.

**Validation Rules**

- Active user model has role == 'hr'. Blocks access to users management, department CRUD, activity timeline, and contracts approvals.

**Cross-Module Impact / Dependencies**

AUTH-004

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

### ROLE-003 — Enforce Public Candidate guest access bounds.

**Module:** Users & Roles  
**Role:** Public Candidate  
**Route:** `/jobs, /public/upload-documents/:token`  
**Status:** Not Audited  
**Test ID:** TEST-ROLE-01  

**Requirement**

Enforce Public Candidate guest access bounds.

**Trigger**

Guest attempts to access private internal portals.

**Expected Behaviour**

Redirects guest candidate to /login or blocks navigation.

**Validation Rules**

- Candidate does not possess internal user token.

**Cross-Module Impact / Dependencies**

AUTH-006

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

### ROLE-004 — Sidebar visibility filtering based on role.

**Module:** Users & Roles  
**Role:** All Roles  
**Route:** `All Routes`  
**Status:** Not Audited  
**Test ID:** TEST-ROLE-01  

**Requirement**

Sidebar visibility filtering based on role.

**Trigger**

User context loads on sidebar mount.

**Expected Behaviour**

Sidebar menus show or hide matching user role (e.g. settings hidden from HR).

**Validation Rules**

- Menu item checks list role eligibility.

**Cross-Module Impact / Dependencies**

NAV-001

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

### ROLE-005 — Action controls disabling based on role.

**Module:** Users & Roles  
**Role:** All Roles  
**Route:** `All Routes`  
**Status:** Not Audited  
**Test ID:** TEST-ROLE-01  

**Requirement**

Action controls disabling based on role.

**Trigger**

Page mounts with interactive actions (e.g. approve contract).

**Expected Behaviour**

Disables or hides action buttons if user lacks necessary permissions.

**Validation Rules**

- Component checks role flags before rendering action elements.

**Cross-Module Impact / Dependencies**

None

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

### ROLE-006 — Unauthorized redirection logic for URL bypasses.

**Module:** Users & Roles  
**Role:** All Roles  
**Route:** `All Protected Routes`  
**Status:** Not Audited  
**Test ID:** TEST-ROLE-01  

**Requirement**

Unauthorized redirection logic for URL bypasses.

**Trigger**

User types restricted URL in browser address bar directly.

**Expected Behaviour**

Intercepts navigation and redirects to /unauthorized or dashboard.

**Validation Rules**

- Checks route eligibility list against user role.

**Cross-Module Impact / Dependencies**

AUTH-006

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

### DASH-001 — Statistics overview counts cards.

**Module:** Dashboard  
**Role:** Company Admin, HR  
**Route:** `/dashboard`  
**Status:** Not Audited  
**Test ID:** TEST-DASH-01  

**Requirement**

Statistics overview counts cards.

**Trigger**

User loads /dashboard overview screen.

**Expected Behaviour**

Displays counts: Total HR Users, Active HR Users, Job Openings, Candidates.

**Validation Rules**

- Counts must reconcile with database collections.

**Cross-Module Impact / Dependencies**

HRM-001, JOB-001, CAN-001

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

### DASH-002 — Priority work queue action mapping.

**Module:** Dashboard  
**Role:** Company Admin, HR  
**Route:** `/dashboard`  
**Status:** Not Audited  
**Test ID:** TEST-DASH-01  

**Requirement**

Priority work queue action mapping.

**Trigger**

User loads /dashboard.

**Expected Behaviour**

Lists actionable entries (at-risk requirements, pending timesheets, document blockers).

**Validation Rules**

- Items generate dynamically from risk and pending collections.

**Cross-Module Impact / Dependencies**

ONB-001, CON-001

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

### DASH-003 — AI Advisory operational summary card.

**Module:** Dashboard  
**Role:** Company Admin, HR  
**Route:** `/dashboard`  
**Status:** Not Audited  
**Test ID:** TEST-DASH-01  

**Requirement**

AI Advisory operational summary card.

**Trigger**

User loads /dashboard.

**Expected Behaviour**

Displays AI risk warnings (unusual drop in sourcing, late joining risks).

**Validation Rules**

- Must show advisory label, justification, evidence, and recommended actions.

**Cross-Module Impact / Dependencies**

None

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

### DASH-004 — Recent operational activity feed.

**Module:** Dashboard  
**Role:** Company Admin, HR  
**Route:** `/dashboard`  
**Status:** Not Audited  
**Test ID:** TEST-DASH-01  

**Requirement**

Recent operational activity feed.

**Trigger**

User loads /dashboard.

**Expected Behaviour**

Appends chronological timeline of recent HR activity entries.

**Validation Rules**

- Displays actor, time, action context, and linked entity.

**Cross-Module Impact / Dependencies**

ACT-001

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

### DASH-005 — HR and Candidates growth trend charts.

**Module:** Dashboard  
**Role:** Company Admin, HR  
**Route:** `/dashboard`  
**Status:** Not Audited  
**Test ID:** TEST-DASH-01  

**Requirement**

HR and Candidates growth trend charts.

**Trigger**

User loads /dashboard.

**Expected Behaviour**

Renders charts: HR Users Growth, Job Openings Trend, Candidates by Stage, Sourcing.

**Validation Rules**

- Trend charts accurately plot database collections numbers over time.

**Cross-Module Impact / Dependencies**

JOB-001, CAN-001, HRM-001

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

### JOB-001 — Post new job postings linked to client requirements.

**Module:** Job Desk  
**Role:** HR, Company Admin  
**Route:** `/job-desk`  
**Status:** Not Audited  
**Test ID:** TEST-JOB-01  

**Requirement**

Post new job postings linked to client requirements.

**Trigger**

User clicks 'Post New Job' or launches job wizard.

**Expected Behaviour**

Inherits requirement properties (Client, Req Code, Skills) and maps job structure.

**Validation Rules**

- Mandatory inheritances must be present and locked.

**Cross-Module Impact / Dependencies**

None

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

### JOB-002 — Job desk listings rendering.

**Module:** Job Desk  
**Role:** HR, Company Admin  
**Route:** `/job-desk`  
**Status:** Not Audited  
**Test ID:** TEST-JOB-01  

**Requirement**

Job desk listings rendering.

**Trigger**

User loads /job-desk screen.

**Expected Behaviour**

Renders list containing code, client, openings, fulfillment status, and recruiter.

**Validation Rules**

- List updates as jobs status changes.

**Cross-Module Impact / Dependencies**

None

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

### JOB-003 — Create job from client requirement wizard.

**Module:** Job Desk  
**Role:** HR, Company Admin  
**Route:** `/job-desk`  
**Status:** Not Audited  
**Test ID:** TEST-JOB-01  

**Requirement**

Create job from client requirement wizard.

**Trigger**

User launches Create Job wizard.

**Expected Behaviour**

Guides user through multi-step form to input job details (title, skills, description).

**Validation Rules**

- Job title, location, deadline, and required skills are mandatory.

**Cross-Module Impact / Dependencies**

None

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

### JOB-004 — Prevent openings exceeding requirement positions.

**Module:** Job Desk  
**Role:** HR, Company Admin  
**Route:** `/job-desk`  
**Status:** Not Audited  
**Test ID:** TEST-JOB-01  

**Requirement**

Prevent openings exceeding requirement positions.

**Trigger**

User inputs openings count in Job form.

**Expected Behaviour**

Warns user or blocks publishing if openings exceed remaining requirement slot counts.

**Validation Rules**

- openings <= requirement.positionsRequired - requirement.positionsFilled.

**Cross-Module Impact / Dependencies**

None

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

### JOB-005 — Save job as draft.

**Module:** Job Desk  
**Role:** HR, Company Admin  
**Route:** `/job-desk`  
**Status:** Not Audited  
**Test ID:** TEST-JOB-01  

**Requirement**

Save job as draft.

**Trigger**

User clicks 'Save Draft' in Job creation wizard.

**Expected Behaviour**

Saves job details to database in status `Draft`.

**Validation Rules**

- Basic details mapped; does not publish to careers page.

**Cross-Module Impact / Dependencies**

None

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

### JOB-006 — Publish job.

**Module:** Job Desk  
**Role:** HR, Company Admin  
**Route:** `/job-desk`  
**Status:** Not Audited  
**Test ID:** TEST-JOB-01  

**Requirement**

Publish job.

**Trigger**

User clicks 'Publish Job' in form or details screen.

**Expected Behaviour**

Job status transitions to `Published` and renders on public careers page.

**Validation Rules**

- Job description and skills must be complete before publishing.

**Cross-Module Impact / Dependencies**

PUB-001

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

### JOB-007 — Edit job details.

**Module:** Job Desk  
**Role:** HR, Company Admin  
**Route:** `/job-desk`  
**Status:** Not Audited  
**Test ID:** TEST-JOB-01  

**Requirement**

Edit job details.

**Trigger**

User clicks Edit Job details button.

**Expected Behaviour**

Loads job editor form with existing data.

**Validation Rules**

- Edits validate standard required inputs before updating.

**Cross-Module Impact / Dependencies**

None

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

### JOB-008 — Unpublish or delete job.

**Module:** Job Desk  
**Role:** HR, Company Admin  
**Route:** `/job-desk`  
**Status:** Not Audited  
**Test ID:** TEST-JOB-01  

**Requirement**

Unpublish or delete job.

**Trigger**

User selects Unpublish or Delete.

**Expected Behaviour**

Job status switches to closed / draft or record is deleted.

**Validation Rules**

- Active candidates in pipeline are flagged if job is deleted.

**Cross-Module Impact / Dependencies**

PUB-001

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

### JOB-009 — View job details page.

**Module:** Job Desk  
**Role:** HR, Company Admin  
**Route:** `/job-desk/:id`  
**Status:** Not Audited  
**Test ID:** TEST-JOB-01  

**Requirement**

View job details page.

**Trigger**

User opens job details view.

**Expected Behaviour**

Displays job metadata, project mappings, requirements logs, and applicants progress.

**Validation Rules**

- None.

**Cross-Module Impact / Dependencies**

None

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

### JOB-010 — View job applicants list by pipeline stage.

**Module:** Job Desk  
**Role:** HR, Company Admin  
**Route:** `/job-desk/:id/applicants`  
**Status:** Not Audited  
**Test ID:** TEST-APP-01  

**Requirement**

View job applicants list by pipeline stage.

**Trigger**

User clicks applicants tab in job details.

**Expected Behaviour**

Displays candidates currently applied grouped by pipeline stages (Kanban or filtered list).

**Validation Rules**

- Applicants match active applications table records.

**Cross-Module Impact / Dependencies**

CAN-001

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

### JOB-011 — AI Candidate Match and Insights.

**Module:** Job Desk  
**Role:** HR, Company Admin  
**Route:** `/job-desk/:id/applicants`  
**Status:** Not Audited  
**Test ID:** TEST-APP-01  

**Requirement**

AI Candidate Match and Insights.

**Trigger**

User opens applicants details or triggers analysis.

**Expected Behaviour**

Displays AI Advisory match score, strengths, and gaps.

**Validation Rules**

- AI results display advisory label and evidence list.

**Cross-Module Impact / Dependencies**

None

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

### JOB-012 — Export applicants to CSV file.

**Module:** Job Desk  
**Role:** HR, Company Admin  
**Route:** `/job-desk/:id/applicants`  
**Status:** Not Audited  
**Test ID:** TEST-APP-01  

**Requirement**

Export applicants to CSV file.

**Trigger**

User clicks 'Export Applicants' button.

**Expected Behaviour**

Downloads a CSV file containing applicant name, email, phone, stage, and match details.

**Validation Rules**

- None.

**Cross-Module Impact / Dependencies**

None

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

### JOB-013 — Refresh job list.

**Module:** Job Desk  
**Role:** HR, Company Admin  
**Route:** `/job-desk`  
**Status:** Not Audited  
**Test ID:** TEST-JOB-01  

**Requirement**

Refresh job list.

**Trigger**

User clicks Refresh button on Job Desk dashboard.

**Expected Behaviour**

Forces reloading of job collections data from storage.

**Validation Rules**

- None.

**Cross-Module Impact / Dependencies**

None

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

### CAN-001 — Candidates pool directory search and render.

**Module:** Candidates  
**Role:** HR, Company Admin  
**Route:** `/candidates`  
**Status:** Not Audited  
**Test ID:** TEST-CAN-01  

**Requirement**

Candidates pool directory search and render.

**Trigger**

User loads candidates pool directory screen.

**Expected Behaviour**

Displays table containing candidate details, top skills, stage, and source.

**Validation Rules**

- Search bar filters candidate cards dynamically.

**Cross-Module Impact / Dependencies**

None

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

### CAN-002 — Filter candidate pools.

**Module:** Candidates  
**Role:** HR, Company Admin  
**Route:** `/candidates`  
**Status:** Not Audited  
**Test ID:** TEST-CAN-01  

**Requirement**

Filter candidate pools.

**Trigger**

User expands filters dropdown checklist.

**Expected Behaviour**

Permits filtering lists by experience range, location, and duplicate flags.

**Validation Rules**

- None.

**Cross-Module Impact / Dependencies**

None

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

### CAN-003 — Add raw resume text modal.

**Module:** Candidates  
**Role:** HR, Company Admin  
**Route:** `/candidates`  
**Status:** Not Audited  
**Test ID:** TEST-CAN-01  

**Requirement**

Add raw resume text modal.

**Trigger**

User clicks 'Add Raw Resume Text' button.

**Expected Behaviour**

Opens a text box modal allowing pasting raw candidate resume details.

**Validation Rules**

- Pasted text cannot be blank.

**Cross-Module Impact / Dependencies**

None

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

### CAN-004 — Upload resume files.

**Module:** Candidates  
**Role:** HR, Company Admin  
**Route:** `/candidates`  
**Status:** Not Audited  
**Test ID:** TEST-CAN-01  

**Requirement**

Upload resume files.

**Trigger**

User clicks 'Upload Resume' or drags file.

**Expected Behaviour**

Accepts resume attachments and parses metadata details.

**Validation Rules**

- File format must check extensions (.pdf, .docx).

**Cross-Module Impact / Dependencies**

None

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

### CAN-005 — Resume details parser.

**Module:** Candidates  
**Role:** HR, Company Admin  
**Route:** `/candidates`  
**Status:** Not Audited  
**Test ID:** TEST-CAN-01  

**Requirement**

Resume details parser.

**Trigger**

User clicks 'Parse' on pasted raw text or uploaded resume.

**Expected Behaviour**

AI advisory parser extracts candidate name, skills, experience, and education.

**Validation Rules**

- Extracted details must populate form fields for validation before creation.

**Cross-Module Impact / Dependencies**

None

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

### CAN-006 — Job description matching (JD Match).

**Module:** Candidates  
**Role:** HR, Company Admin  
**Route:** `/candidates`  
**Status:** Not Audited  
**Test ID:** TEST-CAN-01  

**Requirement**

Job description matching (JD Match).

**Trigger**

User accesses candidate search matches or clicks Match.

**Expected Behaviour**

Compares candidate skills with active job descriptions to compute matches.

**Validation Rules**

- JD Match calculates score percentage statically/dynamically.

**Cross-Module Impact / Dependencies**

JOB-001

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

### CAN-007 — Candidate details profile modal.

**Module:** Candidates  
**Role:** HR, Company Admin  
**Route:** `/candidates/:id`  
**Status:** Not Audited  
**Test ID:** TEST-CAN-01  

**Requirement**

Candidate details profile modal.

**Trigger**

User clicks candidate row item or profile.

**Expected Behaviour**

Opens details layout showing professional profile, application history, and skills list.

**Validation Rules**

- None.

**Cross-Module Impact / Dependencies**

None

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

### CAN-008 — Change candidate stage.

**Module:** Candidates  
**Role:** HR, Company Admin  
**Route:** `/candidates/:id`  
**Status:** Not Audited  
**Test ID:** TEST-CAN-01  

**Requirement**

Change candidate stage.

**Trigger**

User selects stage option in details dropdown.

**Expected Behaviour**

Modifies candidate application stage in-memory or database.

**Validation Rules**

- Dropdown checks sequence guidelines.

**Cross-Module Impact / Dependencies**

JOB-010

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

### CAN-009 — AI duplicate candidate detection.

**Module:** Candidates  
**Role:** HR, Company Admin  
**Route:** `/candidates/:id`  
**Status:** Not Audited  
**Test ID:** TEST-CAN-01  

**Requirement**

AI duplicate candidate detection.

**Trigger**

Candidate profile with identical name/email/phone mounts.

**Expected Behaviour**

Displays AI Advisory warning of duplicate profile with merging option.

**Validation Rules**

- warning labels must specify evidence (e.g. matching phone). Merging requires confirmation.

**Cross-Module Impact / Dependencies**

None

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

### ONB-001 — Onboarding pipeline list rendering.

**Module:** Employee Management  
**Role:** HR, Company Admin  
**Route:** `/employees/onboarding`  
**Status:** Not Audited  
**Test ID:** TEST-ONB-01  

**Requirement**

Onboarding pipeline list rendering.

**Trigger**

User loads onboarding pipeline dashboard screen.

**Expected Behaviour**

Displays table containing candidate onboardings, join dates, and document compliance statuses.

**Validation Rules**

- List synchronizes with onboarding case states.

**Cross-Module Impact / Dependencies**

None

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

### ONB-002 — Create onboarding folder.

**Module:** Employee Management  
**Role:** HR, Company Admin  
**Route:** `/employees/onboarding`  
**Status:** Not Audited  
**Test ID:** TEST-ONB-01  

**Requirement**

Create onboarding folder.

**Trigger**

Candidate applications move to Selected or Offer Accepted.

**Expected Behaviour**

Automatically initializes onboarding case folder with documents checklist.

**Validation Rules**

- onboarding status begins as Not Started.

**Cross-Module Impact / Dependencies**

JOB-010

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

### ONB-003 — Request onboarding approvals.

**Module:** Employee Management  
**Role:** HR, Company Admin  
**Route:** `/employees/onboarding`  
**Status:** Not Audited  
**Test ID:** TEST-ONB-01  

**Requirement**

Request onboarding approvals.

**Trigger**

HR clicks 'Request Approval' button in onboarding pipeline.

**Expected Behaviour**

Submits case to approvals queue and changes status to Approval Pending.

**Validation Rules**

- Offer terms and compensation details are mandatory inputs.

**Cross-Module Impact / Dependencies**

APR-001

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

### ONB-004 — Approve onboarding clearances.

**Module:** Employee Management  
**Role:** Company Admin  
**Route:** `/employees/onboarding`  
**Status:** Not Audited  
**Test ID:** TEST-ONB-01  

**Requirement**

Approve onboarding clearances.

**Trigger**

Admin clicks Approve in onboarding view or approvals list.

**Expected Behaviour**

Transitions onboarding authorization status to Approved.

**Validation Rules**

- Authorized Admin check is run.

**Cross-Module Impact / Dependencies**

APR-001

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

### ONB-005 — Reject onboarding clearances.

**Module:** Employee Management  
**Role:** Company Admin  
**Route:** `/employees/onboarding`  
**Status:** Not Audited  
**Test ID:** TEST-ONB-01  

**Requirement**

Reject onboarding clearances.

**Trigger**

Admin clicks Reject in onboarding clearances.

**Expected Behaviour**

Rejects onboarding offer; prompts Admin to enter validation feedback reason.

**Validation Rules**

- Rejection note cannot be blank.

**Cross-Module Impact / Dependencies**

APR-001

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

### ONB-006 — Send offer document packages.

**Module:** Employee Management  
**Role:** HR, Company Admin  
**Route:** `/employees/onboarding`  
**Status:** Not Audited  
**Test ID:** TEST-ONB-01  

**Requirement**

Send offer document packages.

**Trigger**

HR clicks 'Send Offer' control buttons.

**Expected Behaviour**

Dispatches offer letter package (requires previous approval unless overridden).

**Validation Rules**

- Clearance approval state must be valid.

**Cross-Module Impact / Dependencies**

None

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

### ONB-007 — Mark offer accepted.

**Module:** Employee Management  
**Role:** HR, Company Admin  
**Route:** `/employees/onboarding`  
**Status:** Not Audited  
**Test ID:** TEST-ONB-01  

**Requirement**

Mark offer accepted.

**Trigger**

HR clicks 'Mark Offer Accepted' action button.

**Expected Behaviour**

Changes case state to Offer Accepted.

**Validation Rules**

- Offer must be in Sent status.

**Cross-Module Impact / Dependencies**

None

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

### ONB-008 — Complete onboarding conversions.

**Module:** Employee Management  
**Role:** HR, Company Admin  
**Route:** `/employees/onboarding`  
**Status:** Not Audited  
**Test ID:** TEST-ONB-01  

**Requirement**

Complete onboarding conversions.

**Trigger**

HR clicks 'Complete Onboarding' button.

**Expected Behaviour**

Transitions onboarding status to Completed and instantiates new employee record.

**Validation Rules**

- All mandatory document checklist verification slots must be cleared.

**Cross-Module Impact / Dependencies**

EMP-001

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

### ONB-009 — Onboarding progress and timeline skips.

**Module:** Employee Management  
**Role:** HR, Company Admin  
**Route:** `/employees/onboarding`  
**Status:** Not Audited  
**Test ID:** TEST-ONB-01  

**Requirement**

Onboarding progress and timeline skips.

**Trigger**

User clicks progress timeline slots.

**Expected Behaviour**

Allows HR or Admin to bypass/advance onboarding checklists steps manually.

**Validation Rules**

- Skips are logged with reasons.

**Cross-Module Impact / Dependencies**

None

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

### ONB-010 — Manage offer templates.

**Module:** Employee Management  
**Role:** HR, Company Admin  
**Route:** `/employees/onboarding`  
**Status:** Not Audited  
**Test ID:** TEST-ONB-01  

**Requirement**

Manage offer templates.

**Trigger**

User loads templates tab under onboarding screen.

**Expected Behaviour**

Allows creating, duplicating, activating, or deleting offer configuration templates.

**Validation Rules**

- Template name, roll mapping, and basic components are required.

**Cross-Module Impact / Dependencies**

None

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

### DOC-001 — Request onboarding documents.

**Module:** Onboarding  
**Role:** HR, Company Admin  
**Route:** `/employees/onboarding`  
**Status:** Not Audited  
**Test ID:** TEST-DOC-01  

**Requirement**

Request onboarding documents.

**Trigger**

HR clicks 'Request Documents' buttons.

**Expected Behaviour**

System generates token-based document upload link and updates status to Documents Pending.

**Validation Rules**

- Onboarding status must be Offer Accepted.

**Cross-Module Impact / Dependencies**

ONB-001

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

### DOC-002 — Token-based secure upload access checks.

**Module:** Onboarding  
**Role:** Public Candidate  
**Route:** `/public/upload-documents/:token`  
**Status:** Not Audited  
**Test ID:** TEST-DOC-01  

**Requirement**

Token-based secure upload access checks.

**Trigger**

Candidate loads public upload route directly via link.

**Expected Behaviour**

Validates link token security signature and loads required upload slots.

**Validation Rules**

- Checks token expiry date and signature integrity. Rejects invalid tokens.

**Cross-Module Impact / Dependencies**

None

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

### DOC-003 — Public candidate document upload form.

**Module:** Onboarding  
**Role:** Public Candidate  
**Route:** `/public/upload-documents/:token`  
**Status:** Not Audited  
**Test ID:** TEST-DOC-01  

**Requirement**

Public candidate document upload form.

**Trigger**

Candidate drags/uploads Pan, Aadhaar, or address proof file.

**Expected Behaviour**

System maps uploaded file items references under respective slots.

**Validation Rules**

- All mandatory slots (Pan, Aadhaar) must contain file uploads before submitting.

**Cross-Module Impact / Dependencies**

None

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

### DOC-004 — Upload file validation rules.

**Module:** Onboarding  
**Role:** Public Candidate  
**Route:** `/public/upload-documents/:token`  
**Status:** Not Audited  
**Test ID:** TEST-DOC-01  

**Requirement**

Upload file validation rules.

**Trigger**

Candidate attaches file to document slots.

**Expected Behaviour**

System verifies file extension types and size bounds.

**Validation Rules**

- File types must be PDF, JPG, or PNG. Maximum size is 5MB.

**Cross-Module Impact / Dependencies**

None

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

### DOC-005 — Re-upload rejected documents.

**Module:** Onboarding  
**Role:** Public Candidate  
**Route:** `/public/upload-documents/:token`  
**Status:** Not Audited  
**Test ID:** TEST-DOC-01  

**Requirement**

Re-upload rejected documents.

**Trigger**

Candidate reviews rejection logs and re-uploads document files.

**Expected Behaviour**

Overwrites previous document reference and flags for review.

**Validation Rules**

- Must follow upload file validation rules.

**Cross-Module Impact / Dependencies**

None

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

### DOC-006 — HR verification clearances checklists.

**Module:** Onboarding  
**Role:** HR, Company Admin  
**Route:** `/employees/onboarding`  
**Status:** Not Audited  
**Test ID:** TEST-DOC-01  

**Requirement**

HR verification clearances checklists.

**Trigger**

HR inspects candidate uploads on onboarding case details screen.

**Expected Behaviour**

Allows HR to click Approve or Reject (requiring notes) on each upload card.

**Validation Rules**

- Rejections require entering reason notes.

**Cross-Module Impact / Dependencies**

ONB-001

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

### EMP-001 — Employees profiles directory list rendering.

**Module:** Employee Management  
**Role:** HR, Company Admin  
**Route:** `/employees`  
**Status:** Not Audited  
**Test ID:** TEST-EMP-01  

**Requirement**

Employees profiles directory list rendering.

**Trigger**

User loads `/employees` screen.

**Expected Behaviour**

Renders employee rows containing code, name, designation, location, and status.

**Validation Rules**

- directory search updates rows matching name / employee code.

**Cross-Module Impact / Dependencies**

None

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

### EMP-002 — Manual Employee creation form.

**Module:** Employee Management  
**Role:** HR, Company Admin  
**Route:** `/employees`  
**Status:** Not Audited  
**Test ID:** TEST-EMP-01  

**Requirement**

Manual Employee creation form.

**Trigger**

User clicks 'Add Employee' button.

**Expected Behaviour**

Opens manual addition form drawers containing inputs for details (Name, Code, Contact, Designation).

**Validation Rules**

- Employee Name, email, and employee code are required inputs.

**Cross-Module Impact / Dependencies**

None

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

### EMP-003 — Form validation rules for manual creation.

**Module:** Employee Management  
**Role:** HR, Company Admin  
**Route:** `/employees`  
**Status:** Not Audited  
**Test ID:** TEST-EMP-01  

**Requirement**

Form validation rules for manual creation.

**Trigger**

User submits manual Employee creation form.

**Expected Behaviour**

Blocks saving and lists validation warnings if mandatory inputs are absent.

**Validation Rules**

- Name, email, and code are non-blank. Email is validated for structure.

**Cross-Module Impact / Dependencies**

None

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

### EMP-004 — Edit Employee profiles.

**Module:** Employee Management  
**Role:** HR, Company Admin  
**Route:** `/employees`  
**Status:** Not Audited  
**Test ID:** TEST-EMP-01  

**Requirement**

Edit Employee profiles.

**Trigger**

User clicks edit button on Employee details screen.

**Expected Behaviour**

Loads editor form populating fields with existing data.

**Validation Rules**

- Modifications validate standard required fields before updating.

**Cross-Module Impact / Dependencies**

None

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

### EMP-005 — Delete Employee profile confirmation.

**Module:** Employee Management  
**Role:** HR, Company Admin  
**Route:** `/employees`  
**Status:** Not Audited  
**Test ID:** TEST-EMP-01  

**Requirement**

Delete Employee profile confirmation.

**Trigger**

User triggers Delete Employee action.

**Expected Behaviour**

Opens confirmation overlay modal before purging record.

**Validation Rules**

- None.

**Cross-Module Impact / Dependencies**

None

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

### EMP-006 — View Employee Profile details dashboard.

**Module:** Employee Management  
**Role:** HR, Company Admin  
**Route:** `/employees/:id`  
**Status:** Not Audited  
**Test ID:** TEST-EMP-01  

**Requirement**

View Employee Profile details dashboard.

**Trigger**

User opens Employee details page.

**Expected Behaviour**

Displays personal details, designation, assigned department, and linked contract status.

**Validation Rules**

- None.

**Cross-Module Impact / Dependencies**

None

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

### EMP-007 — Spreadsheet bulk upload.

**Module:** Employee Management  
**Role:** HR, Company Admin  
**Route:** `/employees`  
**Status:** Not Audited  
**Test ID:** TEST-EMP-01  

**Requirement**

Spreadsheet bulk upload.

**Trigger**

User clicks bulk upload and imports CSV/Excel sheet.

**Expected Behaviour**

Parses rows and inserts employee profiles into directory database.

**Validation Rules**

- Verifies columns structure match fields. Logs invalid rows before inserting.

**Cross-Module Impact / Dependencies**

None

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

### DEP-001 — Create organizational department.

**Module:** Departments  
**Role:** Company Admin  
**Route:** `/departments`  
**Status:** Not Audited  
**Test ID:** TEST-DEP-01  

**Requirement**

Create organizational department.

**Trigger**

Admin clicks 'Create Department' or inputs values.

**Expected Behaviour**

Adds a new department record containing code, name, and details.

**Validation Rules**

- Department name must be unique. Code is required.

**Cross-Module Impact / Dependencies**

None

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

### DEP-002 — Edit or delete department records.

**Module:** Departments  
**Role:** Company Admin  
**Route:** `/departments`  
**Status:** Not Audited  
**Test ID:** TEST-DEP-01  

**Requirement**

Edit or delete department records.

**Trigger**

Admin selects Edit or Delete on department rows.

**Expected Behaviour**

Updates department details or deletes record.

**Validation Rules**

- Purging department validates whether employees are currently assigned.

**Cross-Module Impact / Dependencies**

EMP-001

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

### DEP-003 — Assign Employee to department.

**Module:** Departments  
**Role:** Company Admin  
**Route:** `/departments`  
**Status:** Not Audited  
**Test ID:** TEST-DEP-01  

**Requirement**

Assign Employee to department.

**Trigger**

Admin selects Employee and clicks Assign to Department.

**Expected Behaviour**

Binds Employee reference to target department code.

**Validation Rules**

- Employee must be in Active status.

**Cross-Module Impact / Dependencies**

EMP-001

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

### DEP-004 — View department-wise employees list.

**Module:** Departments  
**Role:** Company Admin  
**Route:** `/departments`  
**Status:** Not Audited  
**Test ID:** TEST-DEP-01  

**Requirement**

View department-wise employees list.

**Trigger**

Admin clicks department row item details.

**Expected Behaviour**

Displays employees lists currently assigned to selected department.

**Validation Rules**

- None.

**Cross-Module Impact / Dependencies**

EMP-001

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

### CON-001 — Contracts Dashboard summary overview.

**Module:** Contract Management  
**Role:** Company Admin, HR  
**Route:** `/contracts/dashboard`  
**Status:** Not Audited  
**Test ID:** TEST-CON-01  

**Requirement**

Contracts Dashboard summary overview.

**Trigger**

User loads /contracts/dashboard screen.

**Expected Behaviour**

Displays summary cards: Total, Active, Expiring Soon, Expired, and Contract Types distributions.

**Validation Rules**

- Summary metrics compile dynamically from active collections.

**Cross-Module Impact / Dependencies**

None

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

### CON-002 — Contracts operations listings search.

**Module:** Contract Management  
**Role:** Company Admin, HR  
**Route:** `/contracts`  
**Status:** Not Audited  
**Test ID:** TEST-CON-01  

**Requirement**

Contracts operations listings search.

**Trigger**

User loads /contracts list.

**Expected Behaviour**

Renders table listing of contracts with codes, employee names, status, and duration details.

**Validation Rules**

- Search bar filters rows dynamically.

**Cross-Module Impact / Dependencies**

EMP-001

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

### CON-003 — Select employee for contract creation.

**Module:** Contract Management  
**Role:** Company Admin, HR  
**Route:** `/contracts/create`  
**Status:** Not Audited  
**Test ID:** TEST-CON-01  

**Requirement**

Select employee for contract creation.

**Trigger**

User launches contract creator wizard.

**Expected Behaviour**

Prompts user to select employee from active profiles.

**Validation Rules**

- Employee selection is required.

**Cross-Module Impact / Dependencies**

EMP-001

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

### CON-004 — Create contract form validations.

**Module:** Contract Management  
**Role:** Company Admin, HR  
**Route:** `/contracts/create`  
**Status:** Not Audited  
**Test ID:** TEST-CON-01  

**Requirement**

Create contract form validations.

**Trigger**

User inputs details (duration, rate, billing terms) and clicks Create.

**Expected Behaviour**

validates input entries and creates new contract record.

**Validation Rules**

- Contract type, start date, end date, and rate/compensation are required. Start date must be before end date.

**Cross-Module Impact / Dependencies**

None

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

### CON-005 — Approve or reject contracts gateways.

**Module:** Contract Management  
**Role:** Company Admin  
**Route:** `/contracts/:id`  
**Status:** Not Audited  
**Test ID:** TEST-CON-01  

**Requirement**

Approve or reject contracts gateways.

**Trigger**

Admin reviews pending contracts on details or approvals page.

**Expected Behaviour**

Allows Admin to authorize or decline contract activations.

**Validation Rules**

- Status must be Pending Approval. Rejections require notes.

**Cross-Module Impact / Dependencies**

APR-001

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

### CON-006 — Contracts renewal alerts.

**Module:** Contract Management  
**Role:** Company Admin, HR  
**Route:** `/contracts`  
**Status:** Not Audited  
**Test ID:** TEST-CON-01  

**Requirement**

Contracts renewal alerts.

**Trigger**

System detects active deployments with duration expiry < 30 days.

**Expected Behaviour**

Displays renewal warnings on contracts and dashboard metrics widgets.

**Validation Rules**

- Warnings flag if current date is near end date.

**Cross-Module Impact / Dependencies**

None

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

### CON-007 — Search contracts by number.

**Module:** Contract Management  
**Role:** Company Admin, HR  
**Route:** `/contracts`  
**Status:** Not Audited  
**Test ID:** TEST-CON-01  

**Requirement**

Search contracts by number.

**Trigger**

User inputs contract number pattern into search bar.

**Expected Behaviour**

Updates lists view displaying only matching codes.

**Validation Rules**

- None.

**Cross-Module Impact / Dependencies**

None

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

### HRM-001 — Create HR and Admin accounts keys.

**Module:** HR Management  
**Role:** Company Admin  
**Route:** `/hr-management`  
**Status:** Not Audited  
**Test ID:** TEST-HRM-01  

**Requirement**

Create HR and Admin accounts keys.

**Trigger**

Admin clicks 'Add User' in HR management dashboard.

**Expected Behaviour**

Loads creation forms drawers (Name, email, initial role configuration).

**Validation Rules**

- Email format validation, username required.

**Cross-Module Impact / Dependencies**

None

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

### HRM-002 — HR user directory list rendering.

**Module:** HR Management  
**Role:** Company Admin  
**Route:** `/hr-management`  
**Status:** Not Audited  
**Test ID:** TEST-HRM-01  

**Requirement**

HR user directory list rendering.

**Trigger**

Admin loads `/hr-management` screen.

**Expected Behaviour**

Renders user cards/table with name, email, role, and active status switch.

**Validation Rules**

- None.

**Cross-Module Impact / Dependencies**

None

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

### HRM-003 — Activate or deactivate user accounts.

**Module:** HR Management  
**Role:** Company Admin  
**Route:** `/hr-management`  
**Status:** Not Audited  
**Test ID:** TEST-HRM-01  

**Requirement**

Activate or deactivate user accounts.

**Trigger**

Admin toggles active status checkbox.

**Expected Behaviour**

Updates account status to Active or Inactive. Inactive accounts are blocked from logging in.

**Validation Rules**

- Admin cannot deactivate their own session.

**Cross-Module Impact / Dependencies**

AUTH-003

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

### HRM-004 — Assign HR users roles.

**Module:** HR Management  
**Role:** Company Admin  
**Route:** `/hr-management`  
**Status:** Not Audited  
**Test ID:** TEST-HRM-01  

**Requirement**

Assign HR users roles.

**Trigger**

Admin selects role (Company Admin, HR) in user edit form.

**Expected Behaviour**

Saves role configuration and applies new permission access constraints immediately.

**Validation Rules**

- Role must be valid type.

**Cross-Module Impact / Dependencies**

ROLE-001

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

### HRM-005 — Filter HR users list.

**Module:** HR Management  
**Role:** Company Admin  
**Route:** `/hr-management`  
**Status:** Not Audited  
**Test ID:** TEST-HRM-01  

**Requirement**

Filter HR users list.

**Trigger**

Admin clicks role filters on HR Directory.

**Expected Behaviour**

Filters user rows matching selected roles criteria.

**Validation Rules**

- None.

**Cross-Module Impact / Dependencies**

None

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

### ACT-001 — Immutable HR operational activity timeline logs.

**Module:** HR Activity History  
**Role:** Company Admin  
**Route:** `/hr-activity-history`  
**Status:** Not Audited  
**Test ID:** TEST-ACT-01  

**Requirement**

Immutable HR operational activity timeline logs.

**Trigger**

HR user executes onboarding, employee, or contract actions.

**Expected Behaviour**

System appends new audit entry to log timeline.

**Validation Rules**

- Log parameters (actor ID, date, action description) must be non-null.

**Cross-Module Impact / Dependencies**

None

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

### ACT-002 — Activity log filters.

**Module:** HR Activity History  
**Role:** Company Admin  
**Route:** `/hr-activity-history`  
**Status:** Not Audited  
**Test ID:** TEST-ACT-01  

**Requirement**

Activity log filters.

**Trigger**

Admin selects action filter options (Onboarding, Contract, etc.).

**Expected Behaviour**

Filters timeline items matching checked action categories.

**Validation Rules**

- None.

**Cross-Module Impact / Dependencies**

None

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

### ACT-003 — Track activity by actor.

**Module:** HR Activity History  
**Role:** Company Admin  
**Route:** `/hr-activity-history`  
**Status:** Not Audited  
**Test ID:** TEST-ACT-01  

**Requirement**

Track activity by actor.

**Trigger**

Admin inputs actor username in log search bar.

**Expected Behaviour**

timeline displays logs executed by target user only.

**Validation Rules**

- None.

**Cross-Module Impact / Dependencies**

None

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

### PUB-001 — Careers page openings listings.

**Module:** Careers Page  
**Role:** Public Candidate  
**Route:** `/jobs`  
**Status:** Not Audited  
**Test ID:** TEST-PUB-01  

**Requirement**

Careers page openings listings.

**Trigger**

Public guest opens `/jobs` page.

**Expected Behaviour**

Displays list cards of published jobs with title, location, type, and deadline.

**Validation Rules**

- Only jobs with visibility == 'Public' and status == 'Published' are listed.

**Cross-Module Impact / Dependencies**

JOB-006

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

### PUB-002 — Search & filter openings by location.

**Module:** Careers Page  
**Role:** Public Candidate  
**Route:** `/jobs`  
**Status:** Not Audited  
**Test ID:** TEST-PUB-01  

**Requirement**

Search & filter openings by location.

**Trigger**

Candidate types queries or selects location filters.

**Expected Behaviour**

Filters job card list dynamically matching criteria.

**Validation Rules**

- None.

**Cross-Module Impact / Dependencies**

None

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

### PUB-003 — View job details description.

**Module:** Careers Page  
**Role:** Public Candidate  
**Route:** `/jobs`  
**Status:** Not Audited  
**Test ID:** TEST-PUB-01  

**Requirement**

View job details description.

**Trigger**

Candidate clicks View Details or Apply on a job card.

**Expected Behaviour**

Opens job specifications page showing title, description, skills, and qualifications.

**Validation Rules**

- None.

**Cross-Module Impact / Dependencies**

None

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

### PUB-004 — Apply form validations.

**Module:** Careers Page  
**Role:** Public Candidate  
**Route:** `/jobs`  
**Status:** Not Audited  
**Test ID:** TEST-PUB-01  

**Requirement**

Apply form validations.

**Trigger**

Candidate submits application form.

**Expected Behaviour**

validates entries and creates candidate and application files.

**Validation Rules**

- Candidate Name and consent checkbox are mandatory. Either Email or Phone is required.

**Cross-Module Impact / Dependencies**

CAN-001

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

### PUB-005 — Attach resume upload file.

**Module:** Careers Page  
**Role:** Public Candidate  
**Route:** `/jobs`  
**Status:** Not Audited  
**Test ID:** TEST-PUB-01  

**Requirement**

Attach resume upload file.

**Trigger**

Candidate uploads resume attachment file.

**Expected Behaviour**

Checks file extension and binds attachment to application form.

**Validation Rules**

- File must be PDF or DOCX format. Required fields validation rules apply.

**Cross-Module Impact / Dependencies**

None

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

### PUB-006 — Display application confirmation panel.

**Module:** Careers Page  
**Role:** Public Candidate  
**Route:** `/jobs`  
**Status:** Not Audited  
**Test ID:** TEST-PUB-01  

**Requirement**

Display application confirmation panel.

**Trigger**

Candidate clicks Submit Application with valid form details.

**Expected Behaviour**

Submits details, checks duplicate application checks, and renders confirmation screen.

**Validation Rules**

- Candidate email/phone duplicates are validated. Blocks resubmitting same application.

**Cross-Module Impact / Dependencies**

CAN-009

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

### OFF-001 — Offboarding cases list rendering.

**Module:** Employee Management  
**Role:** HR, Company Admin  
**Route:** `/employees/offboarding`  
**Status:** Not Audited  
**Test ID:** TEST-OFF-01  

**Requirement**

Offboarding cases list rendering.

**Trigger**

User loads offboarding dashboard list view.

**Expected Behaviour**

Renders exit rows with names, last deployment, last working day, and clearance statuses.

**Validation Rules**

- None.

**Cross-Module Impact / Dependencies**

None

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

### OFF-002 — Initiate Employee Offboardingexit workflow.

**Module:** Employee Management  
**Role:** HR, Company Admin  
**Route:** `/employees/offboarding`  
**Status:** Not Audited  
**Test ID:** TEST-OFF-01  

**Requirement**

Initiate Employee Offboardingexit workflow.

**Trigger**

HR clicks 'Initiate Offboarding' button.

**Expected Behaviour**

Opens manual offboarding creator drawer prompting exit parameters.

**Validation Rules**

- Employee selection, last working date, exit type, and exit reason are required fields.

**Cross-Module Impact / Dependencies**

EMP-001

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

### OFF-003 — Exit clearance checklists approvals.

**Module:** Employee Management  
**Role:** HR, Company Admin  
**Route:** `/employees/offboarding`  
**Status:** Not Audited  
**Test ID:** TEST-OFF-01  

**Requirement**

Exit clearance checklists approvals.

**Trigger**

HR updates clearance checklist checkpoints in offboarding details view.

**Expected Behaviour**

Marks checklist elements (documents closure, client clearance, asset handover) as Approved.

**Validation Rules**

- Rejections require entering reason notes.

**Cross-Module Impact / Dependencies**

None

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

### OFF-004 — Mark exit completed.

**Module:** Employee Management  
**Role:** HR, Company Admin  
**Route:** `/employees/offboarding`  
**Status:** Not Audited  
**Test ID:** TEST-OFF-01  

**Requirement**

Mark exit completed.

**Trigger**

HR clicks 'Complete Offboarding' button after clearances.

**Expected Behaviour**

Transitions case status to Completed and marks Employee status as Exited.

**Validation Rules**

- All mandatory clearances must be marked Approved.

**Cross-Module Impact / Dependencies**

EMP-001

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

### OFF-005 — Halt future contract calculations.

**Module:** Employee Management  
**Role:** HR, Company Admin  
**Route:** `/employees/offboarding`  
**Status:** Not Audited  
**Test ID:** TEST-OFF-01  

**Requirement**

Halt future contract calculations.

**Trigger**

offboarding transitions to status Completed.

**Expected Behaviour**

Halts deployment active status and billing calculations immediately.

**Validation Rules**

- Active billing is locked.

**Cross-Module Impact / Dependencies**

CON-001

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

### CREQ-001 — Client Requirement editing impact review.

**Module:** Client Requirements  
**Role:** HR, Company Admin  
**Route:** `/requirements`  
**Status:** Not Audited  
**Test ID:** TEST-CREQ-01  

**Requirement**

Impact-aware editing for Client Requirements.

**Trigger**

User saves material changes to a Client Requirement (Client, Title, Role, Dates, Headcount).

**Expected Behaviour**

Intercepts save if downstream data exists (Jobs, Pipelines). Shows Impact Review dialog prompting for a required audit reason. Upon confirmation, records an audit revision in the database and applies the changes.

**Validation Rules**

- Material changes include: clientId, roleTitle, title, locations, positionsRequired, employmentType, contractDuration, targetJoiningDate.
- `positionsRequired` cannot be reduced below the number of already filled positions.

**Cross-Module Impact / Dependencies**

JOB-001, CAN-001

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
