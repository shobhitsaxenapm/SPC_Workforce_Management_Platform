# End-to-End Test Scenarios

This document specifies the end-to-end testing scenarios required to validate the core flows of the SPC Workforce Management Platform.

---

### TEST-JOB-01 — Create and Post Job
- **Test ID**: TEST-JOB-01
- **Related Requirement IDs**: JOB-001, PUB-001
- **Preconditions**: HR is authenticated on Job Desk.
- **User Role**: hr, company_admin
- **Starting Route**: `/job-desk`
- **Test Data**:
  - Title: "Data Entry Operator"
  - Experience: "1-2 Years"
  - Deadline: "2026-08-31"
- **Steps**:
  1. Click "Post New Job" button.
  2. Populate Job Form with Test Data.
  3. Click "Publish".
- **Expected Result**: Job transitions to status `Published`.
- **Cross-module Verification**: The job description displays in the Careers Portal list immediately.
- **Refresh Verification**: Re-opening page keeps the job status as `Published`.
- **Permission Verification**: Guest candidates cannot edit or delete job postings.
- **Actual Result**: Not Tested
- **Status**: Not Audited
- **Evidence**: None

---

### TEST-PUB-01 — Careers Portal Application
- **Test ID**: TEST-PUB-01
- **Related Requirement IDs**: PUB-001, CAN-001
- **Preconditions**: A job description has status `Published`.
- **User Role**: Public Candidate
- **Starting Route**: `/jobs`
- **Test Data**:
  - Name: "Riya Sharma"
  - Email: "riya@email.com"
  - Resume: Mock Resume PDF file
- **Steps**:
  1. Browse Careers Portal jobs list.
  2. Click apply, upload resume file, and check consent.
  3. Click "Submit Application".
- **Expected Result**: Displays application confirmation panel.
- **Cross-module Verification**: candidate card is created inside Candidates Pool; dashboard counters increment.
- **Refresh Verification**: Refreshing page does not send duplicate submissions.
- **Permission Verification**: Open to public without session token checks.
- **Actual Result**: Not Tested
- **Status**: Not Audited
- **Evidence**: None

---

### TEST-CAN-01 — Resume Text Parsing
- **Test ID**: TEST-CAN-01
- **Related Requirement IDs**: CAN-001, APP-001
- **Preconditions**: HR is active on Candidates page.
- **User Role**: hr, company_admin
- **Starting Route**: `/candidates`
- **Test Data**: Raw text containing "Riya Sharma, 2 years experience, Python and React"
- **Steps**:
  1. Click "Add Raw Resume Text" to open modal.
  2. Paste Test Data into the text box and click "Parse".
- **Expected Result**: Extracted skills list and parsed name are populated on the Candidate Profile details block.
- **Cross-module Verification**: Profile appears in Candidates table list.
- **Refresh Verification**: Candidate details persist after reloads.
- **Permission Verification**: HR users can parse candidates, but unauthenticated visitors cannot access candidates directory.
- **Actual Result**: Not Tested
- **Status**: Not Audited
- **Evidence**: None

---

### TEST-ONB-01 — Onboarding Pipeline Checklist
- **Test ID**: TEST-ONB-01
- **Related Requirement IDs**: ONB-001, DOC-001
- **Preconditions**: Candidate stage is set to `Selected`.
- **User Role**: hr, company_admin
- **Starting Route**: `/employees/onboarding`
- **Test Data**: Selected Candidate ID
- **Steps**:
  1. Advance candidate onboarding status to `Offer Sent`.
  2. Clicks "Request Approval".
- **Expected Result**: Onboarding folder generates pending approvals request.
- **Cross-module Verification**: Displays under `/approvals/pending` for Admin review.
- **Refresh Verification**: Case status remains `Offer Sent` after refresh.
- **Permission Verification**: HR cannot self-approve their own onboarding requests.
- **Actual Result**: Not Tested
- **Status**: Not Audited
- **Evidence**: None

---

### TEST-APR-01 — Admin approvals
- **Test ID**: TEST-APR-01
- **Related Requirement IDs**: APR-001, ONB-001
- **Preconditions**: Onboarding folder approval request exists.
- **User Role**: company_admin
- **Starting Route**: `/approvals/pending`
- **Test Data**: Pending Onboarding record
- **Steps**:
  1. Admin reviews pending onboarding case.
  2. Clicks "Approve".
- **Expected Result**: Onboarding Approval status changes to `Approved`.
- **Cross-module Verification**: Unlocks "Send Offer" action controls on HR onboarding pipeline.
- **Refresh Verification**: Approval persists after page reloads.
- **Permission Verification**: HR role cannot view `/approvals/pending` path.
- **Actual Result**: Not Tested
- **Status**: Not Audited
- **Evidence**: None

---

### TEST-DOC-01 — Token upload & verification
- **Test ID**: TEST-DOC-01
- **Related Requirement IDs**: DOC-001, ONB-001
- **Preconditions**: Onboarding status is set to `Offer Accepted`.
- **User Role**: Public Candidate, hr
- **Starting Route**: `/public/upload-documents/:token`
- **Test Data**: Aadhaar and PAN image files
- **Steps**:
  1. Candidate uploads Aadhaar file using token link.
  2. HR opens verification checklist, views Aadhaar, and clicks "Approve".
- **Expected Result**: Aadhaar check status updates to verified.
- **Cross-module Verification**: Sets onboarding checklist items status checks.
- **Refresh Verification**: Verification status persists after browser reloads.
- **Permission Verification**: Token checks reject expired links.
- **Actual Result**: Not Tested
- **Status**: Not Audited
- **Evidence**: None

---

### TEST-EMP-01 — Complete Onboarding (Convert to Employee)
- **Test ID**: TEST-EMP-01
- **Related Requirement IDs**: EMP-001, ONB-001
- **Preconditions**: Onboarding checklist items are verified and joining date set.
- **User Role**: hr, company_admin
- **Starting Route**: `/employees/onboarding`
- **Test Data**: Onboarding case details
- **Steps**:
  1. Click "Complete Onboarding".
- **Expected Result**: Case status transitions to `Completed`.
- **Cross-module Verification**: Automatically creates employee record under `/employees` with generated code.
- **Refresh Verification**: Employee remains listed in All Employees directory after refresh.
- **Permission Verification**: Deactivated users cannot load employee listings.
- **Actual Result**: Not Tested
- **Status**: Not Audited
- **Evidence**: None

---

### TEST-DEP-01 — Departments Setup & Assignment
- **Test ID**: TEST-DEP-01
- **Related Requirement IDs**: DEP-001, EMP-001
- **Preconditions**: Active Admin session.
- **User Role**: company_admin
- **Starting Route**: `/departments`
- **Test Data**: Name: "Operations", Code: "OPS"
- **Steps**:
  1. Click "Create Department" and enter details.
  2. Select active employee and click "Assign to Department".
- **Expected Result**: Department OPS is created and employee is assigned.
- **Cross-module Verification**: Employee details page renders OPS as department.
- **Refresh Verification**: Assignments persist after reload.
- **Permission Verification**: HR role cannot access `/departments` screen.
- **Actual Result**: Not Tested
- **Status**: Not Audited
- **Evidence**: None

---

### TEST-CON-01 — Contract Management
- **Test ID**: TEST-CON-01
- **Related Requirement IDs**: CON-001, APR-001
- **Preconditions**: Active Employee exists.
- **User Role**: hr, company_admin
- **Starting Route**: `/contracts/create`
- **Test Data**: Type: "Rate-based", Duration: 12 months, Deliverables: "OPS support"
- **Steps**:
  1. HR fills contract creator details and clicks create.
  2. Admin opens approvals, reviews rate-based contract, and clicks approve.
- **Expected Result**: Contract status transitions to `Active`.
- **Cross-module Verification**: Expiring warning metrics recalculate on contracts dashboard.
- **Refresh Verification**: Contract status remains `Active` after refresh.
- **Permission Verification**: HR cannot approve contracts.
- **Actual Result**: Not Tested
- **Status**: Not Audited
- **Evidence**: None

---

### TEST-HRM-01 — HR User deactivation
- **Test ID**: TEST-HRM-01
- **Related Requirement IDs**: HRM-001, ROLE-001
- **Preconditions**: Active Admin session.
- **User Role**: company_admin
- **Starting Route**: `/hr-management`
- **Test Data**: HR Username: "Mehul Jain"
- **Steps**:
  1. Add HR user Mehul Jain.
  2. Toggle status check to Deactivate.
- **Expected Result**: Account status toggles to inactive.
- **Cross-module Verification**: Mehul Jain cannot log in.
- **Refresh Verification**: Toggled status persists after browser reload.
- **Permission Verification**: HR users cannot load `/hr-management` page.
- **Actual Result**: Not Tested
- **Status**: Not Audited
- **Evidence**: None

---

### TEST-OFF-01 — Exit checklist offboarding
- **Test ID**: TEST-OFF-01
- **Related Requirement IDs**: OFF-001, EMP-001
- **Preconditions**: Active employee deployment.
- **User Role**: hr, company_admin
- **Starting Route**: `/employees/offboarding`
- **Test Data**: Employee exit parameters
- **Steps**:
  1. Click "Initiate Offboarding".
  2. Approve exit clearance checklists.
- **Expected Result**: Employee record transitions status to `Inactive` or exited.
- **Cross-module Verification**: Halts active contract billing calculations immediately.
- **Refresh Verification**: exit status persists after reload.
- **Permission Verification**: Public candidates cannot trigger offboarding processes.
- **Actual Result**: Not Tested
- **Status**: Not Audited
- **Evidence**: None
