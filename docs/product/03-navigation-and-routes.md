# Navigation and Routes

This document details the route architecture specified in the **HRMS Application – End-User Flow & Navigation Document** and compares it directly with the current React codebase routing configuration (`src/App.tsx`).

---

## Route Registry and Discrepancies

| Target Route (Spec) | Page Name | Module | Allowed Roles | Public/Protected | Codebase Path (`App.tsx`) | Status in Codebase / Mismatch Details |
|---|---|---|---|---|---|---|
| `/login` | Entry Login Landing | Authentication | Guest | Public | None | **Missing**: No landing login page or login redirection routes exist. |
| `/login/spc-management` | SPC login | Authentication | Guest | Public | None | **Missing**: Redirection SPC login route is not present. |
| `/dashboard` | Dashboard Overview | Admin / HR | `company_admin`, `hr` | Protected | `/` | **Mismatch**: Dashboard mounts at index route `/` rather than `/dashboard`. |
| `/candidates` | Candidate Database | Admin / HR | `company_admin`, `hr` | Protected | `/candidates` | **Matches**: Exists at same route. |
| `/approvals/pending` | Pending approvals | Admin | `company_admin` | Protected | None | **Missing**: Approval review routes are completely absent. |
| `/departments` | Department Management| Admin | `company_admin` | Protected | None | **Missing**: Department allocation screens do not exist. |
| `/hr-management` | HR User Registry | Admin | `company_admin` | Protected | `/users` | **Mismatch**: Configured at `/users` instead of `/hr-management`. |
| `/hr-activity-history`| Activity log history | Admin | `company_admin` | Protected | None | **Missing**: Log audit feeds do not exist in routes. |
| `/contracts/dashboard`| Contracts summary | Admin / HR | `company_admin`, `hr` | Protected | None | **Missing**: Contract dashboards do not exist in routes. |
| `/contracts` | All Contracts | Admin / HR | `company_admin`, `hr` | Protected | None | **Missing**: All Contracts list route is missing. |
| `/contracts/create` | Create Contract | Admin / HR | `company_admin`, `hr` | Protected | None | **Missing**: Contract creator page is missing. |
| `/contracts/:id` | Contract details | Admin / HR | `company_admin`, `hr` | Protected | None | **Missing**: Contract details view is missing. |
| `/employees` | Employees List | Admin / HR | `company_admin`, `hr` | Protected | `/employees` | **Matches**: Exists at same route. |
| `/employees/add` | Add Employee | Admin / HR | `company_admin`, `hr` | Protected | None | **Missing**: Separate child add-route is missing. |
| `/employees/bulk-upload`| Bulk import | Admin / HR | `company_admin`, `hr` | Protected | None | **Missing**: Bulk upload sub-route is missing. |
| `/employees/onboarding`| Onboarding Case list | Admin / HR | `company_admin`, `hr` | Protected | `/onboarding` | **Mismatch**: Configured as `/onboarding` instead of `/employees/onboarding`. |
| `/employees/offboarding`| Offboarding Case list| Admin / HR | `company_admin`, `hr` | Protected | `/offboarding` | **Mismatch**: Configured as `/offboarding` instead of `/employees/offboarding`. |
| `/job-desk` | Job Desk postings | HR | `company_admin`, `hr` | Protected | `/jobs` | **Mismatch**: Configured as `/jobs` instead of `/job-desk`. |
| `/job-desk/:jobId/applicants`| Job Applicants | HR | `company_admin`, `hr` | Protected | `/jobs/:id` | **Mismatch**: Job applicants summary is handled inside `/jobs/:id` detail. |
| `/employee/hr/candidate-pool`| Unified Candidate pool| HR | `company_admin`, `hr` | Protected | `/talent-pool` | **Mismatch**: Configured as `/talent-pool` instead of candidate pool path. |
| `/employee/hr/resume-parser`| Resume Parser | HR | `company_admin`, `hr` | Protected | None | **Missing**: Resume parsing upload sub-page is missing. |
| `/employee/hr/resume-search`| Resume Search | HR | `company_admin`, `hr` | Protected | None | **Missing**: Search and JDs matching is handled inside `/candidates`. |
| `/employee/hr/document-verification`| Document verification| HR | `company_admin`, `hr` | Protected | None | **Missing**: Verification is currently embedded inside the `/onboarding` detail view. |
| `/jobs` | Careers portal | Public Module | Guest | Public | `/careers` | **Mismatch**: Public jobs listing mounts at `/careers` rather than `/jobs`. |
| `/public/upload-documents/:token`| Document Upload | Public Module | Guest | Public | None | **Missing**: Secured document token upload routes are not in codebase. |

---

## Codebase Extra Routes

The current React codebase contains several active routes that are **not specified** in the target HRMS End-User Flow & Navigation Document:
1. `/interviews`: Renders `InterviewsList.tsx` for scheduling list view.
2. `/offers`: Renders `OffersList.tsx` for listing proposed offers.
3. `/deployments`: Renders `DeploymentsList.tsx` tracking active placements.
4. `/attendance`: Renders `AttendanceList.tsx` tracking client timesheets.
5. `/billing`: Renders `BillingList.tsx` for client billing cycles.
6. `/reports`: Renders `Reports.tsx` dashboard reports.
7. `/settings`: Renders `Settings.tsx` basic config.
