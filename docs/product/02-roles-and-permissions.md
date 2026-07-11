# Roles and Permissions

This document specifies the permissions and access control rules for the user roles on the SPC Workforce Management Platform.

---

## User Roles

### 1. Company Admin (`company_admin`)
- **Access**: Full global access to all administrative, HR, and settings features.
- **Key Responsibilities**:
  - Manage HR user accounts (add, activate, deactivate, assign roles).
  - Review and authorize onboarding approvals and contract approvals.
  - CRUD operations on organizational Departments.
  - Inspect global HR Activity History and audit logs.

### 2. HR (`hr`)
- **Access**: Access to recruitment, onboarding, candidates, jobs, and employee management.
- **Restricted Modules**: Cannot access or modify company-level settings or Admin-only modules (such as HR user directories, global activity logs, or administrative system configurations).
- **Key Responsibilities**:
  - Post and manage job descriptions under Job Desk.
  - Review candidate pools, parse resumes, and JD matching.
  - Progress onboarding checklists, request candidate files, and verify documents.

---

## Module Access Matrix

| Module / Screen | Route | Company Admin | HR | Guest Candidate |
|---|---|---|---|---|
| **Dashboard** | `/dashboard` | Read/Write | Read Only | Restricted |
| **Candidates** | `/candidates` | Read/Write | Read/Write | Restricted |
| **Pending Approvals** | `/approvals/pending` | Read/Write | Restricted | Restricted |
| **Departments** | `/departments` | Read/Write | Restricted | Restricted |
| **HR Management** | `/hr-management` | Read/Write | Restricted | Restricted |
| **HR Activity History** | `/hr-activity-history` | Read/Write | Restricted | Restricted |
| **Contract Management** | `/contracts` | Read/Write | Read Only | Restricted |
| **Employee Management** | `/employees` | Read/Write | Read/Write | Restricted |
| **Job Desk & Applicants**| `/job-desk` | Read/Write | Read/Write | Restricted |
| **Candidate Pool** | `/employee/hr/candidate-pool` | Read/Write | Read/Write | Restricted |
| **Resume Parser/Search** | `/employee/hr/resume-search` | Read/Write | Read/Write | Restricted |
| **Careers Page** | `/jobs` | Read Only | Read Only | Read/Write (Apply) |
| **Document Upload Link** | `/public/upload-documents/:token` | Read Only | Read Only | Read/Write (Upload) |

---

## Allowed and Blocked Actions

### Company Admin
- **Allowed**: Activate/deactivate HR users, assign admin roles, CRUD on departments, approve contracts, review security audit history.
- **Blocked**: None.

### HR User
- **Allowed**: Parse candidate resumes, transition recruitment stages, send document requests, verify uploaded ID certificates, schedule onboarding dates, create employee profiles, post jobs.
- **Blocked**: Accessing `/hr-management`, modifying departments, self-approving contracts or onboarding clearances, clearing global activity timelines.
