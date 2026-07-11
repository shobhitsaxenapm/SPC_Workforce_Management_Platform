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
- To be determined during audit.

## File Upload Limitations
- **Resume and Document Attachments**: candidate resumes and onboarding documents are verified through UI form handlers only and do not upload raw data files to any storage container.

## Email Limitations
- **Verification and Offer Link Despatches**: Document token email links and offer notifications are mocked.

## AI Analysis Limitations
- **Static Parser Suggestions**: Matches and JD scores are calculated from hardcoded mock lists rather than active LLM endpoints.

## Security Limitations
- **No Route guards**: Route protection gates in `App.tsx` do not currently perform active server-side permission checks.
