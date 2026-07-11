# Workflows and State Transitions

This document outlines the operational flows, triggers, side effects, and state checks matching the target navigation document.

---

### 1. Login Redirection Workflow
- **Starting State**: Guest
- **Actor**: Any User
- **Trigger**: Accessing internal pages
- **Current State**: On `/login` landing page
- **Allowed Action**: Select SPC Management login and enter credentials
- **Next State**: Authenticated session on `/dashboard`
- **Side Effects**: Sets access token, loads sidebar views matching role (`company_admin` or `hr`).
- **Invalid Transitions**: accessing dashboard pages directly.
- **Related Requirement IDs**: AUTH-001, ROLE-001

---

### 2. Post Job Workflow
- **Starting State**: Draft Job Desk list
- **Actor**: HR, Company Admin
- **Trigger**: HR clicks "Post New Job"
- **Current State**: Creator form panel
- **Allowed Action**: Fill details and select status to Publish
- **Next State**: Job Desk Status: `Published`
- **Side Effects**: Adds job description to careers portal immediately.
- **Invalid Transitions**: Creating standalone jobs without linking to client demands (under target spec).
- **Related Requirement IDs**: JOB-001, PUB-001

---

### 3. Careers Candidate Application Workflow
- **Starting State**: Visitor accesses `/jobs` careers portal
- **Actor**: Public Candidate
- **Trigger**: Candidate clicks apply
- **Current State**: Application modal
- **Allowed Action**: Upload resume file, fill name, and click submit
- **Next State**: Candidate Application stage: `Applied`
- **Side Effects**: Candidate profile is created or email matches existing candidate. Increments Candidate Pool.
- **Invalid Transitions**: Submitting application without resume attachment.
- **Related Requirement IDs**: PUB-001, CAN-001

---

### 4. Applicant Review Workflow
- **Starting State**: Candidate application is in `Applied` stage
- **Actor**: HR, Company Admin
- **Trigger**: HR reviews candidates list
- **Current State**: Candidate detail profile modal
- **Allowed Action**: select stage from dropdown (e.g. Under Review, Shortlisted, Selected)
- **Next State**: Updated candidate stage
- **Side Effects**: Updates Candidate Stage breakdown charts on dashboard.
- **Invalid Transitions**: Bypassing selection stages.
- **Related Requirement IDs**: APP-001, CAN-001

---

### 5. Send Candidate to Onboarding Workflow
- **Starting State**: Candidate stage is set to `Selected`
- **Actor**: HR, Company Admin
- **Trigger**: HR clicks "Send Candidate to Onboarding"
- **Current State**: Onboarding handover confirmation
- **Allowed Action**: Click confirm
- **Next State**: Onboarding status: `Offer Sent`
- **Side Effects**: Initializes onboarding case folder under `/employees/onboarding`.
- **Invalid Transitions**: Sending candidates to onboarding who are not in `Selected` stage.
- **Related Requirement IDs**: ONB-001, APP-001

---

### 6. Onboarding approvals request Workflow
- **Starting State**: Onboarding folder created
- **Actor**: HR, Company Admin
- **Trigger**: HR clicks "Request Approval" from onboarding detail
- **Current State**: Onboarding approval request
- **Allowed Action**: Company Admin reviews terms and clicks "Approve"
- **Next State**: Onboarding Approval status: `Approved`
- **Side Effects**: Unlocks "Send Offer" action in onboarding pipelines.
- **Invalid Transitions**: Sending offer letter before approval is granted.
- **Related Requirement IDs**: APR-001, ONB-001

---

### 7. Offer Templates and Accepted Offer Workflow
- **Starting State**: Onboarding Approval status is `Approved`
- **Actor**: HR, Candidate
- **Trigger**: HR selects Offer Template and clicks "Send Offer"
- **Current State**: Offer dispatched
- **Allowed Action**: Candidate signs, HR clicks "Mark Offer Accepted"
- **Next State**: Onboarding stage: `Offer Accepted`
- **Side Effects**: Unlocks the "Request Documents" button.
- **Invalid Transitions**: Sending offer using deactivated templates.
- **Related Requirement IDs**: ONB-001, APR-001

---

### 8. Document Request and Token Upload Workflow
- **Starting State**: Onboarding stage is `Offer Accepted`
- **Actor**: HR, Candidate
- **Trigger**: HR clicks "Request Documents"
- **Current State**: Document collection checklist
- **Allowed Action**: Candidate uploads files via tokenized secure link `/public/upload-documents/:token`
- **Next State**: Onboarding stage: `Documents Pending` (until all submitted)
- **Side Effects**: Sets status checks in verification panel.
- **Invalid Transitions**: Uploading wrong file extensions.
- **Related Requirement IDs**: DOC-001, ONB-001

---

### 9. Document Verification Workflow
- **Starting State**: Onboarding stage is `Documents Pending`
- **Actor**: HR, Company Admin
- **Trigger**: HR reviews uploaded file grid
- **Current State**: Document verification panel
- **Allowed Action**: HR checks files; marks individual items as "Approved" or "Rejected"
- **Next State**: Onboarding stage: `Documents Verified` (if all approved) or `Changes Requested` (if rejected)
- **Side Effects**: Candidate receives email to re-upload rejected files.
- **Invalid Transitions**: Marking onboarding completed with rejected files.
- **Related Requirement IDs**: DOC-001, ONB-001

---

### 10. Complete Onboarding Workflow
- **Starting State**: Onboarding stage is `Documents Verified`
- **Actor**: HR, Company Admin
- **Trigger**: HR sets joining date and clicks "Complete Onboarding"
- **Current State**: Onboarding completion checkpoint
- **Allowed Action**: Convert candidate profile
- **Next State**: Onboarding stage: `Completed`
- **Side Effects**: Automatically generates the active Employee record under `/employees`.
- **Invalid Transitions**: Converting candidates before documents are verified and joining date set.
- **Related Requirement IDs**: EMP-001, ONB-001

---

### 11. Manual & Bulk Employee Upload Workflow
- **Starting State**: Employee directory overview
- **Actor**: HR, Company Admin
- **Trigger**: User clicks "Add Employee" or "Bulk Upload"
- **Current State**: Form fields or CSV file importer
- **Allowed Action**: Fills fields manually or uploads CSV, clicks save
- **Next State**: Employee profiles created
- **Side Effects**: Updates Total Employees list and department count dashboards.
- **Invalid Transitions**: Uploading CSV files containing formatting or schema errors.
- **Related Requirement IDs**: EMP-001

---

### 12. Department Assignments Workflow
- **Starting State**: Employee profile exists
- **Actor**: Company Admin
- **Trigger**: Admin opens `/departments`
- **Current State**: Department setup and assign panel
- **Allowed Action**: Selects employees, maps to department codes, and clicks save
- **Next State**: Employees assigned to department
- **Side Effects**: Updates department-wise employee lists.
- **Invalid Transitions**: Map employees to non-existent departments.
- **Related Requirement IDs**: DEP-001, EMP-001

---

### 13. Contract Creation and Approvals Workflow
- **Starting State**: Employee profile loaded
- **Actor**: HR, Company Admin
- **Trigger**: HR clicks "Create New Contract"
- **Current State**: Contract form configurations
- **Allowed Action**: HR enters terms. Admin reviews details under pending approvals and clicks approve
- **Next State**: Contract status: `Active`
- **Side Effects**: Triggers active deployment billing checks and log actions.
- **Invalid Transitions**: Activating contracts without admin approvals.
- **Related Requirement IDs**: CON-001, APR-001

---

### 14. HR User Creation and Status Toggle Workflow
- **Starting State**: HR list directory
- **Actor**: Company Admin
- **Trigger**: Admin clicks "Add HR user" or toggles active status
- **Current State**: HR accounts list
- **Allowed Action**: Admin enters credentials, clicks deactivate/activate
- **Next State**: HR account created or status toggled
- **Side Effects**: Deactivated HR users are blocked from logging in.
- **Invalid Transitions**: Deactivating the logged-in admin account.
- **Related Requirement IDs**: HRM-001, AUTH-001

---

### 15. Offboarding Workflow
- **Starting State**: Active Employee profile
- **Actor**: HR, Company Admin
- **Trigger**: HR clicks "Initiate Offboarding"
- **Current State**: exit checklist and clearance forms
- **Allowed Action**: Completes clearance processes and updates status
- **Next State**: Employee status: `Exited`
- **Side Effects**: Halts future billing periods.
- **Invalid Transitions**: Completing exit checks while clearance tasks are pending.
- **Related Requirement IDs**: OFF-001, EMP-001
