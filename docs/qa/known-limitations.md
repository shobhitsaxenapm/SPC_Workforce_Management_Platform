# Known Limitations

This document lists the confirmed limitations, unverified assumptions, and conflicts identified during the setup phase of the SPC Workforce Management Platform.

---

## Confirmed Limitations
- **Mock Data Layer**: The system currently runs using in-memory JavaScript lists inside `mockData.ts`. It does not write back to a persistent relational database.
- **Frontend-Only Architecture**: There is no active API or web server. Authentication sessions, token validation, and file parses are simulated.

## Unverified Assumptions
- **Token Redirection Security**: It is assumed that the `/public/upload-documents/:token` route validates cryptographic signatures on the backend rather than simple route parameter strings.

## Requirement Conflicts
- **Navigation Structure Mismatches**: The "HRMS Application – End-User Flow & Navigation Document" targets a complete set of child routes (e.g. `/approvals/pending`, `/departments`, `/hr-management`, `/contracts`, `/employee/hr/resume-parser`) that do not match the current codebase routing layout `/src/App.tsx`. The current codebase contains extra screens (Interviews, Offers, Deployments, Billing, Attendance) that are not listed in the target navigation tree. These differences are registered as conflicts to resolve during development.

## Prototype-Only Behaviour
- **State Mutation Persistence**: Candidate stage modifications, employee creation additions, and parsed raw text details reset upon reload.

## Backend Limitations
- **Mock Data Layer**: The system currently runs using in-memory JavaScript lists inside `mockData.ts`. It does not write back to a persistent database, so state changes (e.g. stage updates) are reset on browser refresh.

## File Upload Limitations
- **Resume and Document Attachments**: Candidate resumes and onboarding documents are verified through UI form handlers only and do not upload raw data files.

## Email Limitations
- **Verification and Offer Link Despatches**: Document token email links and offer notifications are mocked.

## AI Analysis Limitations
- **Static Parser Suggestions**: Matches and JD scores are calculated from hardcoded mock lists rather than active LLM endpoints.

## Security & Access Limitations
- **No Route Guards**: Route protection gates in `App.tsx` do not perform any authentication checks.
- **Sidebar Navigation Role Access Gaps**: The navigation sidebar in `Layout.tsx` shows all modules (including Admin-only menus like Users & Roles) to all users indiscriminately.
- **Hardcoded Session Context**: The active user session in `Layout.tsx` is hardcoded to "Rahul Sharma" (Company Admin) with no role-switching mechanism or dynamic context.

## Buttons Without Functional Handlers (No-op)
- **Dashboard (`Dashboard.tsx`)**: "Create Client Requirement" button has no event handler.
- **Job Desk (`JobsList.tsx`, `JobDetail.tsx`)**: "Create from Requirement", "Edit Job", "Preview", and "Unpublish" buttons are present but lack handlers.
- **Candidates Pool (`CandidatesList.tsx`, `CandidateDetail.tsx`)**: "Filters", "Edit Profile", "View Resume", "Reject", "Schedule Interview", and "Advance Stage" buttons are completely non-functional.
- **Talent Pool (`TalentPoolList.tsx`)**: "Filters" and "Match to Job" buttons lack functional handlers.
- **Onboarding Pipeline (`OnboardingList.tsx`)**: "Mark Complete" action button has no handler.
- **Offboarding Pipeline (`OffboardingList.tsx`)**: "Initiate Offboarding" action button is a no-op.
- **Offers List (`OffersList.tsx`)**: "Edit Offer", "Review Approval", "View Offer", and "Start Onboarding" buttons are all non-functional.

## Forms Without Working Submission
- **Public Apply Form (`CareersPage.tsx`)**: The careers page apply form validates required fields and displays a simulated timeout success screen, but it does not write the candidate data to the in-memory store or append it to the application pool.

## Data That Is Hardcoded or Disconnected
- **Dashboard KPIs**: Dashboard metrics are calculated from requirement data, which mismatches the spec requirements for Total HR Users, Active HR Users, Job Openings, and Candidates.
- **Dashboard Charts**: Trend charts and candidate staging stats are completely absent from the UI.
- **User Permission Matrix**: `UsersList.tsx` lists roles and modules in a static HTML table rather than pulling dynamic database settings.
