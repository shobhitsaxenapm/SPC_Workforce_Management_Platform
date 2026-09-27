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

## Scope Restrictions Maintained
1. **No Backend Abstractions Invented:** All persistence relies on the existing frontend context pattern (`localStorage`) to avoid diverging from prototype constraints.
2. **Independence from Other Entities:** Client statuses (`Active`/`Inactive`) and applicant/pipeline stages were strictly untouched.
3. **Canonical Truth:** `isPublished` is explicitly the ONLY source of truth for publication, preventing dual-state discrepancies.
