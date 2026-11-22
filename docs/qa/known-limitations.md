# Known Limitations

This document lists the confirmed limitations, unverified assumptions, and conflicts identified during the code audit of the SPC Workforce Management Platform.

## Feedback prototype (2026-11-21)

- Shared frontend mock login is not secure or production-ready. Development placeholders are documented outside the UI; Liam's real credentials remain unknown.
- Reports/images are local to this browser/origin under `spc_feedback_v2`. No backend or cross-device/team synchronization. Concurrent cross-tab writes are not transactional.
- Full/blocked/malformed storage rejects submission, preserving draft; no memory-only false success. Old sample data stays untouched under its old key and is not displayed.
- Screenshot: one PNG/JPEG/WebP up to 2 MiB. Images are not automatically redacted. Local storage quotas limit total feedback volume.
- Activity ring covers navigation and existing client/candidate creation and job create/update hooks only, with fixed action names and sanitized routes. No typed contents or credentials are captured. Ring resets on refresh/logout/user change.
- Browser tool stopped because Chrome's URL could not be confidently identified. Real desktop/mobile visuals, native focus containment and image decoding remain unverified. Automated tests use jsdom shims.
- Node 22.11 tests require `NODE_OPTIONS=--experimental-require-module`. Build retains the existing bundle-size warning.
The legacy audit notes below predate this feature and may describe older application behavior.

---

## Confirmed Limitations
- **Mock Data Layer**: The system currently runs using in-memory JavaScript lists inside `mockData.ts`. It does not write back to a persistent relational database, causing state edits to reset on page reload.
- **Frontend-Only Architecture**: There is no active API or web server. Authentication sessions, token validation, and file parses are simulated.

## Unverified Assumptions
- **Token Redirection Security**: It is assumed that the `/public/upload-documents/:token` route validates cryptographic signatures on the backend rather than simple route parameter strings.

## Requirement Conflicts
- **Navigation Structure Mismatches**: The "HRMS Application – End-User Flow & Navigation Document" targets a complete set of child routes (e.g. `/approvals/pending`, `/departments`, `/hr-management`, `/contracts`, `/employee/hr/resume-parser`) that do not match the current codebase routing layout `/src/App.tsx`. The current codebase contains extra screens (Interviews, Offers, Deployments, Billing, Attendance) that are not listed in the target navigation tree. These differences are registered as conflicts to resolve during development.

## Prototype-Only Behaviour
- **State Mutation Persistence**: Candidate stage modifications, employee creation additions, and parsed raw text details reset upon reload.

## Backend Limitations
- In-memory database mutations: Operations changes do not persist in storage.

## File Upload Limitations
- **Resume and Document Attachments**: Candidate resumes and onboarding documents are verified through UI form handlers only and do not upload raw data files to any storage container.

## Email Limitations
- **Verification and Offer Link Despatches**: Document token email links and offer notifications are mocked.

## AI Analysis Limitations
- **Static Parser Suggestions**: Matches and JD scores are calculated from hardcoded mock lists rather than active LLM endpoints.

## Security & Access Limitations
- **No Route Guards**: Route protection gates in `App.tsx` do not perform any active session validations.
- **Sidebar Access Gaps**: Sidebar menu links show administrative routes to all roles unconditionally.
- **Hardcoded Session**: Layout hardcodes Company Admin Rahul Sharma session context with no login/logout flow controls.

## Buttons Without Functional Handlers (No-op)
- **Dashboard (`Dashboard.tsx`)**: "Create Client Requirement"
- **Job Desk (`JobsList.tsx`, `JobDetail.tsx`)**: "Create from Requirement", "Edit Job", "Preview", "Unpublish"
- **Candidates Pool (`CandidatesList.tsx`, `CandidateDetail.tsx`)**: "Filters", "Edit Profile", "View Resume", "Reject", "Schedule Interview", "Advance Stage"
- **Onboarding Pipeline (`OnboardingList.tsx`)**: "Mark Complete"
- **Offboarding Pipeline (`OffboardingList.tsx`)**: "Initiate Offboarding"
- **Offers List (`OffersList.tsx`)**: "Edit Offer", "Review Approval", "View Offer", "Start Onboarding"

## Forms Without Working Submission
- **Public Apply Form (`CareersPage.tsx`)**: Form validates fields correctly, but does not append records to the in-memory pool.

## Data That Is Hardcoded or Disconnected
- **Dashboard KPIs**: Stats are computed from requirements, not matching spec.
- **Dashboard Charts**: Trend charts and candidate staging counts are missing.
- **User Permission Matrix**: Lists roles statically in HTML instead of dynamic database bindings.
