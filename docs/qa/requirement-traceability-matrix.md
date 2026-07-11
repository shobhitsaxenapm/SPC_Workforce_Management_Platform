# Requirement Traceability Matrix

This table maps functional requirement IDs to codebase locations, execution statuses, and test scenarios.

| Requirement ID | Module | Route | Requirement | Expected Role | Code Location | Current Status | Test ID | Evidence | Notes |
|---|---|---|---|---|---|---|---|---|---|
| **AUTH-001** | Authentication | `/login` | Display login landing page and credentials inputs (Email + Password). | All Roles / Guest | Not Audited | Not Audited | TEST-AUTH-01 | Not Tested | None |
| **AUTH-002** | Authentication | `/login` | Email and password validation on login entry. | Guest | Not Audited | Not Audited | TEST-AUTH-01 | Not Tested | None |
| **AUTH-003** | Authentication | `/login` | Credentials submission validation. | Guest | Not Audited | Not Audited | TEST-AUTH-01 | Not Tested | None |
| **AUTH-004** | Authentication | `All Routes` | JWT local session persistence. | All Roles | Not Audited | Not Audited | TEST-AUTH-01 | Not Tested | None |
| **AUTH-005** | Authentication | `All Routes` | Logout session clearance. | All Roles | Not Audited | Not Audited | TEST-AUTH-01 | Not Tested | None |
| **AUTH-006** | Authentication | `All Protected Routes` | Route guards unauthenticated redirection. | All Roles / Guest | Not Audited | Not Audited | TEST-AUTH-01 | Not Tested | None |
| **ROLE-001** | Users & Roles | `All Routes` | Enforce Company Admin full global access permissions. | Company Admin | Not Audited | Not Audited | TEST-ROLE-01 | Not Tested | None |
| **ROLE-002** | Users & Roles | `All Routes` | Enforce HR role-based access restrictions. | HR | Not Audited | Not Audited | TEST-ROLE-01 | Not Tested | None |
| **ROLE-003** | Users & Roles | `/jobs, /public/upload-documents/:token` | Enforce Public Candidate guest access bounds. | Public Candidate | Not Audited | Not Audited | TEST-ROLE-01 | Not Tested | None |
| **ROLE-004** | Users & Roles | `All Routes` | Sidebar visibility filtering based on role. | All Roles | Not Audited | Not Audited | TEST-ROLE-01 | Not Tested | None |
| **ROLE-005** | Users & Roles | `All Routes` | Action controls disabling based on role. | All Roles | Not Audited | Not Audited | TEST-ROLE-01 | Not Tested | None |
| **ROLE-006** | Users & Roles | `All Protected Routes` | Unauthorized redirection logic for URL bypasses. | All Roles | Not Audited | Not Audited | TEST-ROLE-01 | Not Tested | None |
| **DASH-001** | Dashboard | `/dashboard` | Statistics overview counts cards. | Company Admin, HR | Not Audited | Not Audited | TEST-DASH-01 | Not Tested | None |
| **DASH-002** | Dashboard | `/dashboard` | Priority work queue action mapping. | Company Admin, HR | Not Audited | Not Audited | TEST-DASH-01 | Not Tested | None |
| **DASH-003** | Dashboard | `/dashboard` | AI Advisory operational summary card. | Company Admin, HR | Not Audited | Not Audited | TEST-DASH-01 | Not Tested | None |
| **DASH-004** | Dashboard | `/dashboard` | Recent operational activity feed. | Company Admin, HR | Not Audited | Not Audited | TEST-DASH-01 | Not Tested | None |
| **DASH-005** | Dashboard | `/dashboard` | HR and Candidates growth trend charts. | Company Admin, HR | Not Audited | Not Audited | TEST-DASH-01 | Not Tested | None |
| **JOB-001** | Job Desk | `/job-desk` | Post new job postings linked to client requirements. | HR, Company Admin | Not Audited | Not Audited | TEST-JOB-01 | Not Tested | None |
| **JOB-002** | Job Desk | `/job-desk` | Job desk listings rendering. | HR, Company Admin | Not Audited | Not Audited | TEST-JOB-01 | Not Tested | None |
| **JOB-003** | Job Desk | `/job-desk` | Create job from client requirement wizard. | HR, Company Admin | Not Audited | Not Audited | TEST-JOB-01 | Not Tested | None |
| **JOB-004** | Job Desk | `/job-desk` | Prevent openings exceeding requirement positions. | HR, Company Admin | Not Audited | Not Audited | TEST-JOB-01 | Not Tested | None |
| **JOB-005** | Job Desk | `/job-desk` | Save job as draft. | HR, Company Admin | Not Audited | Not Audited | TEST-JOB-01 | Not Tested | None |
| **JOB-006** | Job Desk | `/job-desk` | Publish job. | HR, Company Admin | Not Audited | Not Audited | TEST-JOB-01 | Not Tested | None |
| **JOB-007** | Job Desk | `/job-desk` | Edit job details. | HR, Company Admin | Not Audited | Not Audited | TEST-JOB-01 | Not Tested | None |
| **JOB-008** | Job Desk | `/job-desk` | Unpublish or delete job. | HR, Company Admin | Not Audited | Not Audited | TEST-JOB-01 | Not Tested | None |
| **JOB-009** | Job Desk | `/job-desk/:id` | View job details page. | HR, Company Admin | Not Audited | Not Audited | TEST-JOB-01 | Not Tested | None |
| **JOB-010** | Job Desk | `/job-desk/:id/applicants` | View job applicants list by pipeline stage. | HR, Company Admin | Not Audited | Not Audited | TEST-APP-01 | Not Tested | None |
| **JOB-011** | Job Desk | `/job-desk/:id/applicants` | AI Candidate Match and Insights. | HR, Company Admin | Not Audited | Not Audited | TEST-APP-01 | Not Tested | None |
| **JOB-012** | Job Desk | `/job-desk/:id/applicants` | Export applicants to CSV file. | HR, Company Admin | Not Audited | Not Audited | TEST-APP-01 | Not Tested | None |
| **JOB-013** | Job Desk | `/job-desk` | Refresh job list. | HR, Company Admin | Not Audited | Not Audited | TEST-JOB-01 | Not Tested | None |
| **CAN-001** | Candidates | `/candidates` | Candidates pool directory search and render. | HR, Company Admin | Not Audited | Not Audited | TEST-CAN-01 | Not Tested | None |
| **CAN-002** | Candidates | `/candidates` | Filter candidate pools. | HR, Company Admin | Not Audited | Not Audited | TEST-CAN-01 | Not Tested | None |
| **CAN-003** | Candidates | `/candidates` | Add raw resume text modal. | HR, Company Admin | Not Audited | Not Audited | TEST-CAN-01 | Not Tested | None |
| **CAN-004** | Candidates | `/candidates` | Upload resume files. | HR, Company Admin | Not Audited | Not Audited | TEST-CAN-01 | Not Tested | None |
| **CAN-005** | Candidates | `/candidates` | Resume details parser. | HR, Company Admin | Not Audited | Not Audited | TEST-CAN-01 | Not Tested | None |
| **CAN-006** | Candidates | `/candidates` | Job description matching (JD Match). | HR, Company Admin | Not Audited | Not Audited | TEST-CAN-01 | Not Tested | None |
| **CAN-007** | Candidates | `/candidates/:id` | Candidate details profile modal. | HR, Company Admin | Not Audited | Not Audited | TEST-CAN-01 | Not Tested | None |
| **CAN-008** | Candidates | `/candidates/:id` | Change candidate stage. | HR, Company Admin | Not Audited | Not Audited | TEST-CAN-01 | Not Tested | None |
| **CAN-009** | Candidates | `/candidates/:id` | AI duplicate candidate detection. | HR, Company Admin | Not Audited | Not Audited | TEST-CAN-01 | Not Tested | None |
| **ONB-001** | Employee Management | `/employees/onboarding` | Onboarding pipeline list rendering. | HR, Company Admin | Not Audited | Not Audited | TEST-ONB-01 | Not Tested | None |
| **ONB-002** | Employee Management | `/employees/onboarding` | Create onboarding folder. | HR, Company Admin | Not Audited | Not Audited | TEST-ONB-01 | Not Tested | None |
| **ONB-003** | Employee Management | `/employees/onboarding` | Request onboarding approvals. | HR, Company Admin | Not Audited | Not Audited | TEST-ONB-01 | Not Tested | None |
| **ONB-004** | Employee Management | `/employees/onboarding` | Approve onboarding clearances. | Company Admin | Not Audited | Not Audited | TEST-ONB-01 | Not Tested | None |
| **ONB-005** | Employee Management | `/employees/onboarding` | Reject onboarding clearances. | Company Admin | Not Audited | Not Audited | TEST-ONB-01 | Not Tested | None |
| **ONB-006** | Employee Management | `/employees/onboarding` | Send offer document packages. | HR, Company Admin | Not Audited | Not Audited | TEST-ONB-01 | Not Tested | None |
| **ONB-007** | Employee Management | `/employees/onboarding` | Mark offer accepted. | HR, Company Admin | Not Audited | Not Audited | TEST-ONB-01 | Not Tested | None |
| **ONB-008** | Employee Management | `/employees/onboarding` | Complete onboarding conversions. | HR, Company Admin | Not Audited | Not Audited | TEST-ONB-01 | Not Tested | None |
| **ONB-009** | Employee Management | `/employees/onboarding` | Onboarding progress and timeline skips. | HR, Company Admin | Not Audited | Not Audited | TEST-ONB-01 | Not Tested | None |
| **ONB-010** | Employee Management | `/employees/onboarding` | Manage offer templates. | HR, Company Admin | Not Audited | Not Audited | TEST-ONB-01 | Not Tested | None |
| **DOC-001** | Onboarding | `/employees/onboarding` | Request onboarding documents. | HR, Company Admin | Not Audited | Not Audited | TEST-DOC-01 | Not Tested | None |
| **DOC-002** | Onboarding | `/public/upload-documents/:token` | Token-based secure upload access checks. | Public Candidate | Not Audited | Not Audited | TEST-DOC-01 | Not Tested | None |
| **DOC-003** | Onboarding | `/public/upload-documents/:token` | Public candidate document upload form. | Public Candidate | Not Audited | Not Audited | TEST-DOC-01 | Not Tested | None |
| **DOC-004** | Onboarding | `/public/upload-documents/:token` | Upload file validation rules. | Public Candidate | Not Audited | Not Audited | TEST-DOC-01 | Not Tested | None |
| **DOC-005** | Onboarding | `/public/upload-documents/:token` | Re-upload rejected documents. | Public Candidate | Not Audited | Not Audited | TEST-DOC-01 | Not Tested | None |
| **DOC-006** | Onboarding | `/employees/onboarding` | HR verification clearances checklists. | HR, Company Admin | Not Audited | Not Audited | TEST-DOC-01 | Not Tested | None |
| **EMP-001** | Employee Management | `/employees` | Employees profiles directory list rendering. | HR, Company Admin | Not Audited | Not Audited | TEST-EMP-01 | Not Tested | None |
| **EMP-002** | Employee Management | `/employees` | Manual Employee creation form. | HR, Company Admin | Not Audited | Not Audited | TEST-EMP-01 | Not Tested | None |
| **EMP-003** | Employee Management | `/employees` | Form validation rules for manual creation. | HR, Company Admin | Not Audited | Not Audited | TEST-EMP-01 | Not Tested | None |
| **EMP-004** | Employee Management | `/employees` | Edit Employee profiles. | HR, Company Admin | Not Audited | Not Audited | TEST-EMP-01 | Not Tested | None |
| **EMP-005** | Employee Management | `/employees` | Delete Employee profile confirmation. | HR, Company Admin | Not Audited | Not Audited | TEST-EMP-01 | Not Tested | None |
| **EMP-006** | Employee Management | `/employees/:id` | View Employee Profile details dashboard. | HR, Company Admin | Not Audited | Not Audited | TEST-EMP-01 | Not Tested | None |
| **EMP-007** | Employee Management | `/employees` | Spreadsheet bulk upload. | HR, Company Admin | Not Audited | Not Audited | TEST-EMP-01 | Not Tested | None |
| **DEP-001** | Departments | `/departments` | Create organizational department. | Company Admin | Not Audited | Not Audited | TEST-DEP-01 | Not Tested | None |
| **DEP-002** | Departments | `/departments` | Edit or delete department records. | Company Admin | Not Audited | Not Audited | TEST-DEP-01 | Not Tested | None |
| **DEP-003** | Departments | `/departments` | Assign Employee to department. | Company Admin | Not Audited | Not Audited | TEST-DEP-01 | Not Tested | None |
| **DEP-004** | Departments | `/departments` | View department-wise employees list. | Company Admin | Not Audited | Not Audited | TEST-DEP-01 | Not Tested | None |
| **CON-001** | Contract Management | `/contracts/dashboard` | Contracts Dashboard summary overview. | Company Admin, HR | Not Audited | Not Audited | TEST-CON-01 | Not Tested | None |
| **CON-002** | Contract Management | `/contracts` | Contracts operations listings search. | Company Admin, HR | Not Audited | Not Audited | TEST-CON-01 | Not Tested | None |
| **CON-003** | Contract Management | `/contracts/create` | Select employee for contract creation. | Company Admin, HR | Not Audited | Not Audited | TEST-CON-01 | Not Tested | None |
| **CON-004** | Contract Management | `/contracts/create` | Create contract form validations. | Company Admin, HR | Not Audited | Not Audited | TEST-CON-01 | Not Tested | None |
| **CON-005** | Contract Management | `/contracts/:id` | Approve or reject contracts gateways. | Company Admin | Not Audited | Not Audited | TEST-CON-01 | Not Tested | None |
| **CON-006** | Contract Management | `/contracts` | Contracts renewal alerts. | Company Admin, HR | Not Audited | Not Audited | TEST-CON-01 | Not Tested | None |
| **CON-007** | Contract Management | `/contracts` | Search contracts by number. | Company Admin, HR | Not Audited | Not Audited | TEST-CON-01 | Not Tested | None |
| **HRM-001** | HR Management | `/hr-management` | Create HR and Admin accounts keys. | Company Admin | Not Audited | Not Audited | TEST-HRM-01 | Not Tested | None |
| **HRM-002** | HR Management | `/hr-management` | HR user directory list rendering. | Company Admin | Not Audited | Not Audited | TEST-HRM-01 | Not Tested | None |
| **HRM-003** | HR Management | `/hr-management` | Activate or deactivate user accounts. | Company Admin | Not Audited | Not Audited | TEST-HRM-01 | Not Tested | None |
| **HRM-004** | HR Management | `/hr-management` | Assign HR users roles. | Company Admin | Not Audited | Not Audited | TEST-HRM-01 | Not Tested | None |
| **HRM-005** | HR Management | `/hr-management` | Filter HR users list. | Company Admin | Not Audited | Not Audited | TEST-HRM-01 | Not Tested | None |
| **ACT-001** | HR Activity History | `/hr-activity-history` | Immutable HR operational activity timeline logs. | Company Admin | Not Audited | Not Audited | TEST-ACT-01 | Not Tested | None |
| **ACT-002** | HR Activity History | `/hr-activity-history` | Activity log filters. | Company Admin | Not Audited | Not Audited | TEST-ACT-01 | Not Tested | None |
| **ACT-003** | HR Activity History | `/hr-activity-history` | Track activity by actor. | Company Admin | Not Audited | Not Audited | TEST-ACT-01 | Not Tested | None |
| **PUB-001** | Careers Page | `/jobs` | Careers page openings listings. | Public Candidate | Not Audited | Not Audited | TEST-PUB-01 | Not Tested | None |
| **PUB-002** | Careers Page | `/jobs` | Search & filter openings by location. | Public Candidate | Not Audited | Not Audited | TEST-PUB-01 | Not Tested | None |
| **PUB-003** | Careers Page | `/jobs` | View job details description. | Public Candidate | Not Audited | Not Audited | TEST-PUB-01 | Not Tested | None |
| **PUB-004** | Careers Page | `/jobs` | Apply form validations. | Public Candidate | Not Audited | Not Audited | TEST-PUB-01 | Not Tested | None |
| **PUB-005** | Careers Page | `/jobs` | Attach resume upload file. | Public Candidate | Not Audited | Not Audited | TEST-PUB-01 | Not Tested | None |
| **PUB-006** | Careers Page | `/jobs` | Display application confirmation panel. | Public Candidate | Not Audited | Not Audited | TEST-PUB-01 | Not Tested | None |
| **OFF-001** | Employee Management | `/employees/offboarding` | Offboarding cases list rendering. | HR, Company Admin | Not Audited | Not Audited | TEST-OFF-01 | Not Tested | None |
| **OFF-002** | Employee Management | `/employees/offboarding` | Initiate Employee Offboardingexit workflow. | HR, Company Admin | Not Audited | Not Audited | TEST-OFF-01 | Not Tested | None |
| **OFF-003** | Employee Management | `/employees/offboarding` | Exit clearance checklists approvals. | HR, Company Admin | Not Audited | Not Audited | TEST-OFF-01 | Not Tested | None |
| **OFF-004** | Employee Management | `/employees/offboarding` | Mark exit completed. | HR, Company Admin | Not Audited | Not Audited | TEST-OFF-01 | Not Tested | None |
| **OFF-005** | Employee Management | `/employees/offboarding` | Halt future contract calculations. | HR, Company Admin | Not Audited | Not Audited | TEST-OFF-01 | Not Tested | None |
