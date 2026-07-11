# Requirement Traceability Matrix

This table maps functional requirement IDs to codebase locations, execution statuses, and test scenarios.

| Requirement ID | Module | Route | Requirement | Expected Role | Code Location | Current Status | Test ID | Evidence | Notes |
|---|---|---|---|---|---|---|---|---|---|
| **AUTH-001** | Authentication | `/login` | Entry Login Redirection | All Roles | Not Audited | Not Audited | TEST-AUTH-01 | Not Tested | None |
| **ROLE-001** | Users & Roles | `/users` | Enforce Admin & HR RBAC | company_admin, hr | Not Audited | Not Audited | TEST-ROLE-01 | Not Tested | None |
| **NAV-001** | Dashboard | `/dashboard` | Admin Sidebar Navigation | company_admin, hr | Not Audited | Not Audited | TEST-NAV-01 | Not Tested | None |
| **DASH-001** | Dashboard | `/dashboard` | Admin Dashboard Statistics | company_admin, hr | Not Audited | Not Audited | TEST-DASH-01 | Not Tested | None |
| **JOB-001** | Job Desk | `/job-desk` | Job Desk Openings Management | company_admin, hr | Not Audited | Not Audited | TEST-JOB-01 | Not Tested | None |
| **CAN-001** | Candidates | `/candidates` | Candidate Resume Parser | company_admin, hr | Not Audited | Not Audited | TEST-CAN-01 | Not Tested | None |
| **APP-001** | Job Desk | `/job-desk/:jobId/applicants` | AI Applicants Analysis | company_admin, hr | Not Audited | Not Audited | TEST-APP-01 | Not Tested | None |
| **ONB-001** | Employee Management | `/employees/onboarding` | Onboarding Pipeline Checklist | company_admin, hr | Not Audited | Not Audited | TEST-ONB-01 | Not Tested | None |
| **APR-001** | Pending Approvals | `/approvals/pending` | Approvals Gateways | company_admin | Not Audited | Not Audited | TEST-APR-01 | Not Tested | None |
| **DOC-001** | Onboarding | `/public/upload-documents/:token` | Secure Document Verification | company_admin, hr | Not Audited | Not Audited | TEST-DOC-01 | Not Tested | None |
| **EMP-001** | Employee Management | `/employees` | Employee Profile Directory | company_admin, hr | Not Audited | Not Audited | TEST-EMP-01 | Not Tested | None |
| **DEP-001** | Departments | `/departments` | Departments Setup | company_admin | Not Audited | Not Audited | TEST-DEP-01 | Not Tested | None |
| **CON-001** | Contract Management | `/contracts` | Contracts Operations | company_admin, hr | Not Audited | Not Audited | TEST-CON-01 | Not Tested | None |
| **HRM-001** | HR Management | `/hr-management` | HR User Administration | company_admin | Not Audited | Not Audited | TEST-HRM-01 | Not Tested | None |
| **ACT-001** | HR Activity History | `/hr-activity-history` | HR Activity History Log | company_admin | Not Audited | Not Audited | TEST-ACT-01 | Not Tested | None |
| **PUB-001** | Careers Page | `/jobs` | Careers Page | Public Candidate | Not Audited | Not Audited | TEST-PUB-01 | Not Tested | None |
| **OFF-001** | Employee Management | `/employees/offboarding` | Employee Offboarding | company_admin, hr | Not Audited | Not Audited | TEST-OFF-01 | Not Tested | None |
