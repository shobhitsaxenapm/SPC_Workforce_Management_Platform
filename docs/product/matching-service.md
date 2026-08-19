# Matching Service

This document describes the design and logic for the Candidate Matching Engine used in the SPC Workforce Management application.

## Definitions

- **Match**: A candidate suggested from the internal candidate database based on a deterministic scoring algorithm against a specific job.
- **Applicant**: A candidate who explicitly applied for the job.
- **Pipeline candidate**: A candidate deliberately added to this job’s recruitment workflow (either by applying or being added from matches).

## Deterministic Scoring Engine

The matching engine uses a strict, rules-based algorithm to compute a score (out of 100) comparing a candidate's profile to a job's requirements.

### Weights

1. **Required and Preferred Skills (40%)**: Calculates the percentage of job skills that the candidate possesses. Uses partial string matching.
2. **Experience (20%)**: Checks if the candidate's total experience meets or exceeds the job's minimum experience range. Falls back to proportional scoring if below the minimum.
3. **Location / Work Arrangement (15%)**: Grants points if the candidate's location matches the job location or if the job is Remote/Any.
4. **Education / Qualifications (10%)**: Checks if the candidate's education text contains the job's required qualifications.
5. **Availability (10%)**: Scored based on notice period. (e.g., 'Immediate' = 10 points, '15 Days' = 8 points, '30 Days' = 5 points).
6. **Employment-type Compatibility (5%)**: Evaluates fit based on full-time/contractual alignment (currently defaults to 5 points as candidates do not specify preferred type).

### Thresholds
Only matches scoring **70% or higher** are displayed to the user.

## Permissions

Only the following roles can run the matching engine and view candidate matches for a job:
- **System Admin**
- **Recruitment Manager**
- **The Recruiter explicitly assigned to the Job**

## Match Lifecycle and Staleness

- **Running the Engine**: Matching is not automatic. It must be manually triggered by an authorized user clicking "Find Matching Candidates" (or "Run Matching Again").
- **Staleness**: When job criteria (skills, location, etc.) materially change, the previous match results become stale, prompting the user to run the matching engine again.
- **Dismissing Matches**: A user can "Dismiss" a match. This marks the candidate as dismissed **only for that specific job match run**. It does not delete or deactivate the candidate globally. The dismissal persists even if the matching engine is run again.
- **Adding to Pipeline**: Adding a match to the pipeline creates a new `Application` record (if one does not exist), transferring the match score and strengths/gaps over to the application. This prevents duplicate pipeline entries.
