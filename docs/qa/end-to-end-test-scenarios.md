# End-to-End Test Scenarios

This document specifies the end-to-end testing scenarios required to validate the atomic requirement flows of the SPC Workforce Management Platform.

---

### TEST-AUTH-01 — Authentication Landing and Access Redirection
- **Test ID**: TEST-AUTH-01
- **Related Requirement IDs**: AUTH-001, AUTH-002, AUTH-003, AUTH-004, AUTH-005, AUTH-006
- **Preconditions**: No active user session (localStorage is empty).
- **User Role**: Guest / Unauthenticated Visitor
- **Starting Route**: `/` (Dashboard)
- **Test Data**: Email: 'rahul.s@spc.com', Password: 'password123', Invalid Email: 'invalid-email'
- **Steps**:
  1. Attempt to navigate directly to `/` (Dashboard) in the browser.
  2. Verify redirection to `/login` with username and password input boxes visible.
  3. Click Submit with blank fields, and verify input validation triggers.
  4. Input an invalid email format and check validation inline alerts.
  5. Enter correct credentials and click Log In.
  6. Verify navigation lands on Overview page, and access token is written to storage.
  7. Refresh browser tab and confirm the session persists.
  8. Click Logout button from profile card and verify token is cleared and user is redirected to `/login`.
- **Expected Result**: User is successfully gated, validated, authenticated, persisted, and cleared.
- **Actual Result**: Not Tested
- **Status**: Not Audited
- **Evidence**: None

---

### TEST-ROLE-01 — Role-Based Access Control and Permissions Gates
- **Test ID**: TEST-ROLE-01
- **Related Requirement IDs**: ROLE-001, ROLE-002, ROLE-003, ROLE-004, ROLE-005, ROLE-006
- **Preconditions**: Database contains users with roles Admin and HR.
- **User Role**: Company Admin, HR, Guest Candidate
- **Starting Route**: `/login`
- **Test Data**: Admin Credentials, HR Credentials
- **Steps**:
  1. Log in as HR user Amit Kumar.
  2. Verify that Admin-only sidebar options (Users & Roles, settings, departments) are hidden.
  3. Attempt to navigate directly to `/users` or `/settings` using the address bar.
  4. Verify redirection to an Unauthorized Access warning screen.
  5. Verify that Admin-only action buttons (e.g. Approve Contract) are disabled or hidden.
  6. Logout and log in as Company Admin Rahul Sharma.
  7. Verify all options are fully visible and active.
  8. Test guest candidate access bounds on private URL routes and confirm redirection gates work.
- **Expected Result**: Page content and route access are restricted according to active role settings.
- **Actual Result**: Not Tested
- **Status**: Not Audited
- **Evidence**: None

---

### TEST-DASH-01 — Operational Dashboard Stats and Sourcing Trends
- **Test ID**: TEST-DASH-01
- **Related Requirement IDs**: DASH-001, DASH-002, DASH-003, DASH-004, DASH-005
- **Preconditions**: Database populated with mock clients, candidates, and logs data.
- **User Role**: Company Admin, HR
- **Starting Route**: `/` (Dashboard)
- **Test Data**: Standard active metrics records
- **Steps**:
  1. Log in as Company Admin and load Dashboard.
  2. Verify the statistics cards (Total HR Users, Active HR Users, Job Openings, Candidate counts) load correct numbers.
  3. Check that Priority Work Queue highlights at-risk requirements and pending actions.
  4. Confirm that AI operational summary card renders warning severity tags, evidence lists, and recommended actions.
  5. Verify Recent Activity timeline displays latest events logs in sequence.
  6. Ensure the visual growth trend charts load and correctly render stats.
- **Expected Result**: Overview metrics display dynamic, reconciled totals, alerts, activity feeds, and charts.
- **Actual Result**: Not Tested
- **Status**: Not Audited
- **Evidence**: None

---

### TEST-JOB-01 — Job Desk ATS Postings and Operations
- **Test ID**: TEST-JOB-01
- **Related Requirement IDs**: JOB-001, JOB-002, JOB-003, JOB-004, JOB-005, JOB-006, JOB-007, JOB-008, JOB-009, JOB-013
- **Preconditions**: Active client requirement exists.
- **User Role**: HR, Company Admin
- **Starting Route**: `/job-desk`
- **Test Data**: Job Details: Title: 'Warehouse Supervisor', Openings: 5, Deadline: '2026-08-01'
- **Steps**:
  1. Load Job Desk page and verify current openings list.
  2. Filter list by location and check that search filters matching strings correctly.
  3. Click Create Job from Requirement and verify inheritance of Client and requirements metadata.
  4. Input openings exceeding remaining spots and verify openings block validations.
  5. Click Save Draft and check that job is listed as Draft internally.
  6. Input complete job description details and click Publish Job.
  7. Verify status switches to Published and propagates to Careers portal.
  8. Edit job details and check updates save correctly.
  9. Click Unpublish/Delete and check job is removed from public careers directory.
  10. Click Refresh button and verify latest collections load immediately.
- **Expected Result**: Jobs are successfully created, draft-saved, published, edited, and closed.
- **Actual Result**: Not Tested
- **Status**: Not Audited
- **Evidence**: None

---

### TEST-APP-01 — Job Applicants Pipeline and AI Analysis
- **Test ID**: TEST-APP-01
- **Related Requirement IDs**: JOB-010, JOB-011, JOB-012, APP-001
- **Preconditions**: Published job exists with active applicants in pipeline.
- **User Role**: HR, Company Admin
- **Starting Route**: `/job-desk/:jobId/applicants`
- **Test Data**: Application ID, CSV output settings
- **Steps**:
  1. Load Job details page and click Applicants Pipeline tab.
  2. Verify that candidates are displayed under correct stages lists.
  3. Confirm that AI Match Insights cards load, displaying scores, strengths, and risk gaps lists.
  4. Change candidate stage via select dropdown in Kanban column.
  5. Verify stage updates in-memory immediately.
  6. Click 'Export Applicants' button and verify CSV file download contains complete record details.
- **Expected Result**: Applicants pipeline renders, stage changes trigger in-memory, and analysis exports.
- **Actual Result**: Not Tested
- **Status**: Not Audited
- **Evidence**: None

---

### TEST-CAN-01 — Candidates Pool Directory and Resume Parsing
- **Test ID**: TEST-CAN-01
- **Related Requirement IDs**: CAN-001, CAN-002, CAN-003, CAN-004, CAN-005, CAN-006, CAN-007, CAN-008, CAN-009
- **Preconditions**: HR session active on candidates pool directory.
- **User Role**: HR, Company Admin
- **Starting Route**: `/candidates`
- **Test Data**: Raw text: 'Aman Sharma, 3 years warehouse inventory logistics experience.', Resume PDF
- **Steps**:
  1. Open Candidates Directory, search by name, and apply filters.
  2. Click 'Add Raw Resume Text' button to open textbox modal.
  3. Paste Aman's details and click Parse.
  4. Verify that AI parser successfully extracts name, experience, and skills into candidate profile fields.
  5. Upload a resume file and verify extension checks are run.
  6. Verify JD matching calculates compatibility scores for active jobs.
  7. Open candidate details profile modal and check history logs.
  8. Modify candidate stage and verify persistence.
  9. Check that AI duplicate warning flags possible duplicate profiles and offers a merge action.
- **Expected Result**: Candidates profiles are searched, uploaded/pasted, parsed, matched, and checked for duplicates.
- **Actual Result**: Not Tested
- **Status**: Not Audited
- **Evidence**: None

---

### TEST-ONB-01 — Onboarding Pipeline Checklist and Clearances
- **Test ID**: TEST-ONB-01
- **Related Requirement IDs**: ONB-001, ONB-002, ONB-003, ONB-004, ONB-005, ONB-006, ONB-007, ONB-008, ONB-009, ONB-010
- **Preconditions**: Application status is set to Selected.
- **User Role**: HR, Company Admin
- **Starting Route**: `/employees/onboarding`
- **Test Data**: Onboarding case ID, Offer parameters
- **Steps**:
  1. Move candidate to Selected to trigger onboarding case creation.
  2. Verify onboarding folder initializes with complete documents checklists.
  3. Click 'Request Approval' to submit offer terms to Admin approvals queue.
  4. Login as Admin and Approve the onboarding case.
  5. Verify clearance transitions to Approved.
  6. Reject another onboarding case, verify rejection note validations, and log feedback.
  7. HR dispatches onboarding offer document packet (Send Offer).
  8. Mark Offer Accepted in checklist options.
  9. Skip a stage using progress timeline skips and verify skip log.
  10. Complete document verifications, click 'Complete Onboarding', and verify that Employee record is generated.
  11. Manage offer templates in Onboarding settings tab.
- **Expected Result**: Onboardings follow sequential approvals, offer acceptance, checkpoints clearances, and conversions.
- **Actual Result**: Not Tested
- **Status**: Not Audited
- **Evidence**: None

---

### TEST-DOC-01 — Secure Onboarding Document Upload and HR Verification
- **Test ID**: TEST-DOC-01
- **Related Requirement IDs**: DOC-001, DOC-002, DOC-003, DOC-004, DOC-005, DOC-006
- **Preconditions**: Onboarding case status is set to Offer Accepted.
- **User Role**: HR, Company Admin, Guest Candidate
- **Starting Route**: `/employees/onboarding`
- **Test Data**: Secure upload token, PAN file, Aadhaar file
- **Steps**:
  1. HR clicks 'Request Documents' on onboarding details view.
  2. Candidate receives token-based link. Candidate opens link directly.
  3. Verify token signature security and expiry dates validations.
  4. Candidate uploads invalid file types (e.g. executable/word) and checks validation blocks.
  5. Candidate uploads Pan and Aadhaar PDF files and submits form.
  6. HR loads case checklist verification panel.
  7. HR rejects PAN card file, typing rejection reason. Candidate re-uploads document.
  8. HR reviews and approves document checklist items, checking off checklist compliance slots.
- **Expected Result**: Document uploads validate constraints, support rejection re-uploads, and clear HR verification checklists.
- **Actual Result**: Not Tested
- **Status**: Not Audited
- **Evidence**: None

---

### TEST-EMP-01 — Employees Profile Directory Administration
- **Test ID**: TEST-EMP-01
- **Related Requirement IDs**: EMP-001, EMP-002, EMP-003, EMP-004, EMP-005, EMP-006, EMP-007
- **Preconditions**: Active HR session on employees list.
- **User Role**: HR, Company Admin
- **Starting Route**: `/employees`
- **Test Data**: Employee Form: Name: 'Vikram Seth', email: 'vikram@spc.com', Code: 'EMP-022'
- **Steps**:
  1. Open Employees directory table and verify search filters.
  2. Click 'Add Employee' and load creation drawers.
  3. Submit blank fields and check mandatory warnings.
  4. Save correct employee form fields and verify new record is created in status Active.
  5. Edit employee parameters and save.
  6. Trigger Delete Employee and confirm action.
  7. View Employee Profile details screen and check active deployment links.
  8. Upload Excel spreadsheet template, verify bulk upload parsing, and check import summaries.
- **Expected Result**: Employee profiles are searched, created, edited, deleted, and imported in bulk.
- **Actual Result**: Not Tested
- **Status**: Not Audited
- **Evidence**: None

---

### TEST-DEP-01 — Departments Setup and Allocation
- **Test ID**: TEST-DEP-01
- **Related Requirement IDs**: DEP-001, DEP-002, DEP-003, DEP-004
- **Preconditions**: Active Admin session, employee exists.
- **User Role**: Company Admin
- **Starting Route**: `/departments`
- **Test Data**: Department: Name: 'Operations', Code: 'OPS'
- **Steps**:
  1. Open Departments screen and click Create Department.
  2. Input details and click save. Try creating duplicate name and check validation warnings.
  3. Edit department parameters and save.
  4. Delete department and check blocks if employees are currently allocated.
  5. Assign active employee to OPS department.
  6. Open OPS details view and verify that allocated employee is listed in the count grid.
- **Expected Result**: Admin manages departments structure, assigns workers, and lists department totals.
- **Actual Result**: Not Tested
- **Status**: Not Audited
- **Evidence**: None

---

### TEST-CON-01 — Contract Operations and Alert Thresholds
- **Test ID**: TEST-CON-01
- **Related Requirement IDs**: CON-001, CON-002, CON-003, CON-004, CON-005, CON-006, CON-007
- **Preconditions**: Active Employee exists.
- **User Role**: Company Admin, HR
- **Starting Route**: `/contracts`
- **Test Data**: Contract details: billing rate, billing model, duration, start/end dates
- **Steps**:
  1. Open Contracts dashboard and check summary counts metric cards.
  2. Click Create Contract, select active employee, and populate details form.
  3. Verify date checks (start date before end date) validate correctly.
  4. Save contract. Login as Admin, open details page, and approve the contract.
  5. Verify contract status changes to Active.
  6. Simulate contract near end date and verify that Renewal Alerts trigger on dashboard.
  7. Search contract rows using contract number patterns.
- **Expected Result**: Contracts are drafted, approved, tracked, and flagged for renewal near expiry.
- **Actual Result**: Not Tested
- **Status**: Not Audited
- **Evidence**: None

---

### TEST-HRM-01 — HR Users Registry Administration
- **Test ID**: TEST-HRM-01
- **Related Requirement IDs**: HRM-001, HRM-002, HRM-003, HRM-004, HRM-005
- **Preconditions**: Super Admin session active.
- **User Role**: Company Admin
- **Starting Route**: `/hr-management`
- **Test Data**: HR User: Name: 'Nisha Gupta', email: 'nisha@spc.com', role: 'HR'
- **Steps**:
  1. Open HR Management users lists screen.
  2. Click Add HR user, input details, and save. Check email validation.
  3. Toggle Nisha's status checkbox to Deactivate.
  4. Attempt to login as Nisha and verify authentication block gates work.
  5. Toggle status to active, edit Nisha's role to Admin, and verify Nisha gains admin permissions.
  6. Apply search filters on users grid rows.
- **Expected Result**: Admin manages user registry directory, role configurations, and access statuses.
- **Actual Result**: Not Tested
- **Status**: Not Audited
- **Evidence**: None

---

### TEST-ACT-01 — Immutable Activity Logs Auditing
- **Test ID**: TEST-ACT-01
- **Related Requirement IDs**: ACT-001, ACT-002, ACT-003
- **Preconditions**: Operations logs database contains items.
- **User Role**: Company Admin
- **Starting Route**: `/hr-activity-history`
- **Test Data**: None
- **Steps**:
  1. Open HR Activity logs timeline screen.
  2. Verify log entries render actor descriptions, timestamps, and linked entities details.
  3. Select action category filters (Onboarding, Contract) and verify timeline updates.
  4. Search log records by actor username strings and verify results view.
- **Expected Result**: timeline feed renders chronological, immutable entries filterable by types/actors.
- **Actual Result**: Not Tested
- **Status**: Not Audited
- **Evidence**: None

---

### TEST-PUB-01 — Careers Portal Guest Job Application
- **Test ID**: TEST-PUB-01
- **Related Requirement IDs**: PUB-001, PUB-002, PUB-003, PUB-004, PUB-005, PUB-006
- **Preconditions**: Job is published with public visibility.
- **User Role**: Public Candidate
- **Starting Route**: `/jobs`
- **Test Data**: Candidate Apply details, Mock PDF resume
- **Steps**:
  1. Guest candidate opens Careers listings page `/jobs`.
  2. Search openings by location and experience filters.
  3. Click View Details on supervisor opening and verify descriptions load.
  4. Click Apply to open modal form. Submit empty fields and check validation blocks.
  5. Enter candidate name and attach mock resume PDF file.
  6. Click Submit Application.
  7. Verify candidate and application records are generated separately and status becomes Applied.
  8. Confirm application success screen renders.
- **Expected Result**: Public candidates search, inspect, and apply to openings with validations.
- **Actual Result**: Not Tested
- **Status**: Not Audited
- **Evidence**: None

---

### TEST-OFF-01 — Employee Exit Clearance and Offboarding
- **Test ID**: TEST-OFF-01
- **Related Requirement IDs**: OFF-001, OFF-002, OFF-003, OFF-004, OFF-005
- **Preconditions**: Employee has active deployment and contract.
- **User Role**: HR, Company Admin
- **Starting Route**: `/employees/offboarding`
- **Test Data**: Exit Parameters: type: Resignation, last day: 2026-07-25
- **Steps**:
  1. Open offboarding pipeline page and click Initiate Offboarding.
  2. Select employee Vikram Seth, input exit dates, and submit.
  3. Verify new exit case folder is registered in status Initiated.
  4. Update clearance checklist entries (documents closure, client clearance) to Approved.
  5. Click Complete Offboarding and verify that Employee status changes to Exited.
  6. Ensure that future billing generation cycles exclude this deployment immediately.
- **Expected Result**: Exit workflows are initiated, clearance checks completed, and billing halted upon exit.
- **Actual Result**: Not Tested
- **Status**: Not Audited
- **Evidence**: None

