# Job Lifecycle and Publication Model

## Overview
This document outlines the revised Job lifecycle and publication model for the SPC Workforce Management Platform, tracking architectural decisions and reasoning to ensure consistency across the application.

## Problem Statement
Previously, the `JobStatus` type intertwined both the recruitment lifecycle (`Draft`, `Filled`, `Closed`, `Paused`) and visibility/publication states (`Published`, `Active`, `Inactive`). This caused conflicts in understanding whether a job was open for recruitment or merely visible externally, leading to inconsistent UI behaviors and reporting inaccuracies.

## Revised Canonical Model
A Job now has two fundamentally separate properties:

### 1. Job Lifecycle (`status`)
`Draft → Open → Closed`
- **Draft:** Job is incomplete or not yet opened for recruitment.
- **Open:** Recruitment activity is allowed.
- **Closed:** Recruitment has ended, but all history remains available.

*(Note: `Active` and `Inactive` have been completely removed as Job lifecycle statuses.)*

### 2. Publication State (`isPublished`)
`Unpublished ↔ Published`
This is a secondary Boolean state flag (`isPublished: boolean`), independent of the lifecycle status.

**Valid Combinations:**
- Draft + Unpublished
- Open + Unpublished
- Open + Published
- Closed + Unpublished

**Prevented Combinations:**
- Draft + Published (Draft jobs cannot be published)
- Closed + Published (Closing an active job automatically unpublishes it)

## Implementation Details & Reasoning

### Data Normalization
Existing mock data and database records were migrated to follow this pattern:
- Legacy `Published` jobs → `status: 'Open'` + `isPublished: true`
- Legacy `Draft` jobs → `status: 'Draft'` + `isPublished: false`

### Close Job Workflow
When a job is closed, we preserve historical context using the following fields:
- `closedAt`: Timestamp of closure
- `closedBy`: ID of the user who closed the job
- `closeReason`: Reason for closing (e.g., Position Filled, Cancelled, Duplicate, etc.)
- `closeNote`: Optional contextual note provided by the recruiter

**Reasoning:** 
We must prevent active recruitment actions (e.g., Add to Pipeline, schedule interviews, create offers) on closed jobs. However, deleting or hiding historical jobs is strictly forbidden as it destroys auditing history. Closed jobs remain visible in a read-only state, preserving their applicants, matches, interviews, and offers.

### Reopen Job Workflow
Reopening a job sets the lifecycle back to `Open` but keeps the state `Unpublished`.
**Reasoning:** Automatically republishing a reopened job could inadvertently expose the job externally before the recruiter has reviewed the details. Re-publication requires an explicit user action.

### Publication Timestamps Model
To accurately model Job age vs. Careers portal exposure, four timestamps are maintained:
1. `createdAt`: Immutable ISO timestamp recording when the job was created/drafted internally.
2. `publishedAt`: Most recent ISO timestamp when the job was published or republished to the Careers portal. Refreshed on republishing to bubble the role to the top of job board feeds.
3. `firstPublishedAt`: Original ISO timestamp when the job first went live, preserved across unpublish and republish cycles for reporting.
4. `unpublishedAt`: Timestamp when the job was taken down from the Careers portal.

**UI Presentation:**
- **Job Desk Table (`/job-desk`):**
  - Job Title column displays `Created <Date>` under the code and employment type.
  - Published Date column dynamically reflects:
    - `Live on Careers` (or `Republished`) with current `publishedAt` date.
    - `Last Live: <Date> • Unpublished` when temporarily taken offline.
    - `— • Not Published` when never published.
- **Job Detail Page (`/job-desk/:id`):**
  - Details card lists `Created Date`, `Careers Portal Publication` status with full history (first published / last unpublished).
  - Unpublish / Republish action modals provide confirmation, audit history, and date refresh previews.

## Scope Restrictions Maintained
1. **No Backend Abstractions Invented:** All persistence relies on the existing frontend context pattern (`localStorage`) to avoid diverging from prototype constraints.
2. **Independence from Other Entities:** Client statuses (`Active`/`Inactive`) and applicant/pipeline stages were strictly untouched.
3. **Canonical Truth:** `isPublished` is explicitly the ONLY source of truth for publication, preventing dual-state discrepancies.

