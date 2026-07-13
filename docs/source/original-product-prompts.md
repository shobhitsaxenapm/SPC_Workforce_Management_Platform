# Original Product Prompts

Below are the exact text prompts provided as the source material for the SPC Workforce Management Platform.

---

## Prompt 1

You are building a fresh SaaS web application from scratch for SPC Management.

The product name is:

SPC Workforce Management Platform

Build a modern, polished, professional B2B SaaS application for a staffing and workforce outsourcing company.

# Business Context

SPC Management deploys employees to external client companies. These employees may be sourced, hired, onboarded, put on SPC payroll, assigned to client projects, tracked through attendance/timesheets, billed to clients monthly/daily/hourly, and later offboarded.

This product is not a generic HRMS like Keka, greytHR, Zoho People, or Pocket HRMS.

A generic HRMS manages internal employees.

This product manages:

Client → Client Requirement → Job → Candidate → Onboarding → Employee → Client Deployment → Attendance/Timesheet → Billing → Offboarding

The system should be purpose-built for staffing and client-deployment operations.

# Primary Goal

Create the complete application foundation with excellent UI/UX, clean navigation, strong product structure, realistic mock data, and connected modules.

This first version can use mock/local data. Focus on product flow, UI quality, data relationships, and stakeholder-demo readiness.

# UI/UX Direction

The app should look like a premium modern B2B SaaS product.

It should feel:

* Clean
* Professional
* Operational
* Trustworthy
* Modern
* Easy to scan
* Suitable for recruiters, HR teams, operations managers, and finance users

Avoid:

* Generic admin dashboard look
* Too many plain tables
* Oversized empty cards
* Too much whitespace
* Random icons
* Fake AI animations
* Overly colourful UI
* Generic HRMS modules
* Developer/placeholder wording

Use:

* Left sidebar navigation
* Clean top bar
* Compact KPI cards
* Smart operational dashboards
* Clear status badges
* Progress indicators
* Search and filters
* Slide-over drawers for details where useful
* Tables with good density
* Contextual actions
* Meaningful empty states
* Responsive layout
* Strong visual hierarchy

Suggested style:

* Light grey app background
* White cards with soft borders
* Deep navy or clean neutral sidebar
* One primary action colour
* Consistent status colours:

  * Green for completed/accepted/active
  * Amber for pending/at-risk
  * Red for rejected/expired/critical
  * Blue for in-progress
  * Grey for draft/closed

# Main Navigation

Create a left sidebar with these modules:

1. Dashboard
2. Clients
3. Client Requirements
4. Jobs / ATS
5. Candidates
6. Onboarding
7. Employees
8. Deployments
9. Attendance & Timesheets
10. Billing
11. Offboarding
12. Website Management
13. Reports & AI Insights
14. Users & Roles
15. Settings

Do not add modules outside this list.

# User Roles

Create role-based UI behaviour for these roles:

## Super Admin

Can access everything.

## Recruitment Manager

Can manage clients, requirements, jobs, candidates, onboarding handoff, interviews, offers.

## Recruiter

Can manage assigned jobs, candidates, interviews, offers, and onboarding initiation.

## Operations Manager

Can manage employees, deployments, attendance, timesheets, and offboarding.

## Billing Manager

Can manage billing cycles, billing drafts, invoice support data, adjustments, and billing reports.

## Client Approver

Limited client-side role. Can approve attendance/timesheets and view deployed employees for their client only.

## Employee

Lightweight user. Can view own profile, assignment, document status, and submit timesheets if applicable.

For the prototype, include a small demo role switcher in the user profile menu only. Do not make it visually dominant.

# Core Data Model

Create realistic mock data and structure for these entities.

## Client

Fields:

* id
* clientName
* industry
* status
* primaryContactName
* primaryContactEmail
* primaryContactPhone
* locations
* activeRequirements
* activeDeployments
* openPositions
* createdAt
* updatedAt

## Client Requirement

Represents client manpower demand.

Fields:

* id
* requirementCode
* clientId
* roleTitle
* projectName
* locations
* numberOfPositions
* positionsFilled
* remainingPositions
* employmentType
* contractDuration
* targetJoiningDate
* priority
* assignedRecruiterId
* status
* createdAt
* updatedAt

Statuses:

* Draft
* Open
* In Progress
* Partially Filled
* Fulfilled
* On Hold
* Closed

Priority:

* Low
* Medium
* High
* Critical

## Job

Every job must belong to a client requirement. No standalone jobs.

Fields:

* id
* jobCode
* requirementId
* clientId
* title
* location
* openings
* positionsFilled
* remainingPositions
* employmentType
* experienceRange
* requiredSkills
* preferredSkills
* jobDescription
* targetJoiningDate
* applicationDeadline
* assignedRecruiterId
* visibility
* status
* publishedAt

Statuses:

* Draft
* Published
* Paused
* Filled
* Closed

Visibility:

* Public
* Private

## Candidate

Candidate is the person.

Fields:

* id
* candidateCode
* fullName
* email
* phone
* currentLocation
* totalExperience
* currentCompany
* currentRole
* skills
* education
* currentSalary
* expectedSalary
* noticePeriodDays
* resumeFileName
* source
* duplicateStatus
* createdAt

Sources:

* SPC Careers Website
* Manual Entry
* Bulk Resume Upload
* Referral
* Email
* WhatsApp
* Existing Talent Pool

## Application

Application is the candidate applying to a specific job.

Candidate and Application must remain separate.

Fields:

* id
* candidateId
* jobId
* requirementId
* currentStage
* appliedAt
* source
* assignedRecruiterId
* screeningAnswers
* matchScore
* matchStrengths
* matchGaps
* rejectionReason
* lastActivityAt

Stages:

* Applied
* Under Review
* Screening
* Shortlisted
* Interview Scheduled
* Interview Completed
* Selected
* Offer Sent
* Offer Accepted
* Ready for Onboarding
* On Hold
* Rejected
* Withdrawn
* No Show
* Offer Declined

## Onboarding Case

Created after offer acceptance.

Fields:

* id
* candidateId
* applicationId
* clientId
* requirementId
* jobId
* onboardingStatus
* documentChecklist
* joiningDate
* assignedHR
* verificationStatus
* createdAt

Statuses:

* Not Started
* Documents Requested
* Documents Submitted
* Verification In Progress
* Changes Requested
* Approved
* Joining Scheduled
* Completed

## Employee

Created after onboarding completion.

Fields:

* id
* employeeCode
* fullName
* email
* phone
* clientId
* employmentStatus
* joiningDate
* designation
* salaryCost
* documents
* bankDetailsStatus
* complianceStatus

Statuses:

* Active
* On Hold
* Notice Period
* Exited

## Deployment

This is the most important SPC-specific object.

Deployment maps an employee to a client/project/location.

Fields:

* id
* employeeId
* clientId
* projectName
* location
* roleTitle
* startDate
* endDate
* reportingManager
* billingModel
* billingRate
* salaryCost
* status

Billing models:

* Monthly
* Daily
* Hourly

Statuses:

* Scheduled
* Active
* Paused
* Transferred
* Completed
* Terminated

## Attendance / Timesheet

Fields:

* id
* deploymentId
* employeeId
* clientId
* period
* attendanceDays
* hoursWorked
* overtimeHours
* approvalStatus
* approvedBy
* exceptions

Approval statuses:

* Draft
* Submitted
* Client Approved
* Rejected
* Locked for Billing

## Billing

Fields:

* id
* billingCycle
* clientId
* billingModel
* deploymentsIncluded
* grossAmount
* adjustments
* taxAmount
* finalAmount
* status
* generatedAt

Statuses:

* Draft
* Pending Approval
* Approved
* Invoice Ready
* Sent
* Paid
* Disputed

## Offboarding

Fields:

* id
* employeeId
* deploymentId
* clientId
* exitType
* lastWorkingDate
* exitReason
* finalAttendanceStatus
* finalBillingStatus
* documentClosureStatus
* status

Statuses:

* Initiated
* Client Clearance Pending
* Final Attendance Pending
* Final Settlement Pending
* Completed
* Cancelled

# Business Rules

Follow these rules strictly:

1. Every job must belong to a client requirement.
2. Every client requirement must belong to a client.
3. Candidate and application are separate entities.
4. One candidate can have multiple applications.
5. Onboarding starts only after offer acceptance or manual authorised override.
6. Employee is created only after onboarding completion.
7. Deployment is created only after employee creation.
8. Billing uses deployment + attendance/timesheet data.
9. Offboarding stops future billing.
10. Payroll and client billing are different concepts.
11. Salary cost and billing rate can be different.
12. AI is advisory only and cannot make final decisions.

# Main Pages To Build

Build the foundation pages for all modules.

## Dashboard

Should answer:

What needs attention today?

Show:

* Active clients
* Open requirements
* Open positions
* Candidates in pipeline
* Onboarding pending
* Active deployments
* Attendance pending approval
* Billing pending
* Offboarding pending
* AI operational alerts

## Clients

List and detail page.

## Client Requirements

List and detail page.

## Jobs / ATS

Jobs list, job detail, applicant summary.

## Candidates

Candidate list, candidate detail, application history.

## Onboarding

Onboarding cases list and detail.

## Employees

Employee list and profile.

## Deployments

Deployment list and detail.

## Attendance & Timesheets

Attendance/timesheet cycle page with approval status.

## Billing

Billing cycle page with draft billing summary.

## Offboarding

Offboarding list and detail.

## Website Management

Manage:

* Published jobs
* Careers page
* Insights/articles
* Draft/published status

Keep it lightweight. Do not build full CMS.

## Reports & AI Insights

Show operational insights:

* Requirement risk
* Candidate bottlenecks
* Onboarding delays
* Attendance missing
* Billing anomalies
* Contract expiry risks

## Users & Roles

Role summary and permission matrix.

## Settings

Basic settings:

* Candidate sources
* Rejection reasons
* Interview types
* Offer templates
* Onboarding document checklist
* Billing models
* Offboarding reasons

# AI-Native Behaviour

AI should be useful, explainable, and controlled.

Use AI-like static advisory patterns for prototype.

Allowed AI areas:

1. Resume parsing
2. Candidate-job match explanation
3. Duplicate candidate detection
4. Requirement risk alerts
5. Onboarding missing document detection
6. Attendance anomaly detection
7. Billing anomaly detection
8. Operational summary insights

AI must always show:

* Suggestion
* Evidence/reason
* Review required label

AI must never:

* Reject candidates automatically
* Move candidate stages automatically
* Approve documents automatically
* Approve billing automatically
* Infer sensitive attributes
* Make final hiring decisions

# Seed Data

Use realistic Indian staffing examples.

Clients:

1. NorthStar Healthcare Services
2. UrbanEdge Logistics
3. GreenField Development Foundation
4. MetroCare Diagnostics

Requirements:

1. 25 Data Entry Operators in Delhi and Noida
2. 15 Warehouse Associates in Gurugram
3. 12 Field Coordinators across Rajasthan
4. 8 Patient Support Executives in Delhi

Jobs:

1. Data Entry Operator — Delhi
2. Data Entry Operator — Noida
3. Warehouse Associate — Gurugram
4. Field Coordinator — Jaipur
5. Field Coordinator — Ajmer
6. Patient Support Executive — Delhi

Candidates:

Use realistic names:

* Riya Sharma
* Aman Verma
* Sana Khan
* Jatin Singh
* Mehul Jain
* Pooja Saini
* Karan Malik
* Neha Arora
* Neha A.
* Devansh Rawat
* Mohit Yadav
* Ishita Bose

Include one possible duplicate:

* Neha Arora
* Neha A.

Employees:

Create sample employees deployed to clients with monthly, daily, and hourly billing models.

Deployments:

Create a mix of active and scheduled deployments.

Attendance:

Create sample pending, approved, rejected, and locked records.

Billing:

Create sample draft, pending approval, invoice ready, sent, and disputed billing cycles.

Offboarding:

Create sample initiated and completed offboarding cases.

# Acceptance Criteria

The app is acceptable only if:

1. It clearly feels like a staffing workforce platform, not generic HRMS.
2. Client, Requirement, Job, Candidate, Application, Onboarding, Employee, Deployment, Attendance, Billing, and Offboarding are clearly connected.
3. Navigation is clean and easy to understand.
4. Dashboard is operational, not decorative.
5. UI looks polished and modern.
6. Tables are readable and action-oriented.
7. Detail pages show useful information.
8. Statuses are visually clear.
9. AI insights are advisory and explainable.
10. No unnecessary modules are added.
11. No developer placeholder wording is visible.
12. The app is responsive.
13. The product is stakeholder-demo ready.

---

## Prompt 2

Now build the core end-to-end MVP flows for the SPC Workforce Management Platform.

Do not rebuild the app from scratch.

Use the existing structure, routes, mock data, components, and design system created earlier.

Focus on making the product workflow actually usable.

# Goal

Build the main connected journey:

Client → Client Requirement → Job → Candidate/Application → Offer Accepted → Onboarding → Employee → Deployment → Attendance/Timesheet → Billing → Offboarding

This should feel like one connected staffing operations workflow.

# Flow 1: Client Creation

Build a polished Add Client flow.

User should be able to add:

* Client name
* Industry
* Primary contact name
* Primary contact email
* Primary contact phone
* Locations
* Status

UX expectations:

* Use modal or drawer
* Clear validation
* Helpful empty state
* Duplicate client warning
* New client appears in Clients list
* Client detail page opens after creation or shows success CTA

Validation:

* Client name required
* At least one location required
* Email format validation
* Duplicate client name warning

# Flow 2: Client Requirement Creation

Build Create Client Requirement flow.

User should create manpower demand for a client.

Fields:

* Client
* Role title
* Project name
* Locations
* Number of positions
* Employment type
* Contract duration
* Target joining date
* Priority
* Assigned recruiter
* Notes

UX expectations:

* Should be a guided drawer or multi-section form
* Show selected client summary
* Show clear position and target date information
* After creation, requirement appears in list
* Requirement detail shows fulfilment progress
* Requirement status starts as Draft or Open

Validation:

* Client required
* Role title required
* Number of positions greater than zero
* Target joining date cannot be in the past
* Assigned recruiter required

# Flow 3: Create Job from Requirement

Build Create Job from Requirement flow.

Important rule:

No standalone job creation.

Every job must be created from an existing client requirement.

From requirement detail, user can click:

Create Job

The job should inherit:

* Client
* Requirement
* Role title
* Project
* Locations
* Target joining date
* Priority
* Assigned recruiter

User can then define:

* Job title
* Location
* Number of openings
* Experience range
* Required skills
* Preferred skills
* Job description
* Responsibilities
* Qualifications
* Application deadline
* Visibility: Public / Private

UX expectations:

* Step-based wizard preferred
* Show inherited requirement context clearly
* Prevent total job openings from exceeding remaining requirement positions unless user confirms and has manager/admin role
* Save as Draft
* Publish Job
* Preview Job

Validation:

* Requirement required
* Job title required
* Location required
* Openings greater than zero
* Application deadline cannot be after target joining date
* Required skills required
* Job description required before publishing

# Flow 4: Careers Page Publishing

Build internal Careers Page Management.

When job visibility is Public and status is Published, it should appear in careers page admin preview.

Create an internal public-preview page or section showing published jobs.

Each job card should show:

* Job title
* Location
* Employment type
* Experience
* Client visibility setting
* Application deadline
* Apply button

For now, Apply button should open candidate application form.

# Flow 5: Candidate Application

Build candidate application form for published jobs.

Candidate should not need to create an account.

Application form fields:

* Full name
* Email
* Phone
* Current location
* Total experience
* Current role
* Skills
* Notice period
* Expected salary
* Resume upload placeholder
* Screening questions
* Consent checkbox

After submission:

* Candidate record is created or matched to existing candidate by email/phone
* Application record is created for the job
* Application stage becomes Applied
* Candidate appears in Candidates
* Application appears in job applicant summary
* Show confirmation screen

Validation:

* Name required
* Email or phone required
* Consent required
* Resume required for published job application
* Prevent exact duplicate application for same candidate and job

# Flow 6: Candidate Review and Pipeline

Build job-specific applicant view.

From Job Detail, user can click:

View Applicants

Show applicants by stage.

Use either:

* Kanban pipeline, or
* strong list with stage filters

Stages:

* Applied
* Under Review
* Screening
* Shortlisted
* Interview Scheduled
* Interview Completed
* Selected
* Offer Sent
* Offer Accepted
* Ready for Onboarding
* Rejected
* Withdrawn
* No Show
* Offer Declined
* On Hold

Actions:

* Move to Under Review
* Start Screening
* Shortlist
* Schedule Interview
* Mark Selected
* Reject
* Put On Hold

Do not allow invalid transitions.

Show candidate card with:

* Name
* Location
* Experience
* Skills
* Match score
* Source
* Last activity

# Flow 7: Interview Scheduling and Feedback

Build basic interview flow.

From application/candidate:

Schedule Interview

Fields:

* Interview type
* Date/time
* Duration
* Interviewer
* Mode
* Meeting link/location

After scheduling:

* Application stage becomes Interview Scheduled
* Interview appears in Interviews page

Build feedback form:

* Overall rating
* Skill rating
* Communication rating
* Reliability rating
* Strengths
* Concerns
* Recommendation: Hire / Hold / Reject

After feedback:

* Interview feedback status becomes Submitted
* Application can move to Interview Completed
* Recruiter can mark Selected or Rejected

# Flow 8: Offer Flow

Build offer creation after candidate is selected.

Fields:

* Offered role
* Offered compensation
* Proposed joining date
* Contract duration
* Client/project
* Notes

Offer statuses:

* Draft
* Approval Pending
* Approved
* Sent
* Viewed
* Accepted
* Declined
* Expired

For prototype, allow authorised user to simulate:

* Send Offer
* Mark Accepted
* Mark Declined

After offer accepted:

* Application stage becomes Offer Accepted
* Action appears: Start Onboarding

# Flow 9: Onboarding Handoff

Build onboarding case creation from accepted offer.

On clicking Start Onboarding:

Create Onboarding Case with:

* Candidate details
* Client
* Requirement
* Job
* Role
* Proposed joining date
* Assigned HR
* Document checklist

Document checklist:

* Aadhaar
* PAN
* Bank details
* Address proof
* Education proof
* Previous employment proof
* Photo

Onboarding statuses:

* Not Started
* Documents Requested
* Documents Submitted
* Verification In Progress
* Changes Requested
* Approved
* Joining Scheduled
* Completed

Build onboarding detail page.

Allow user to simulate:

* Request Documents
* Mark Documents Submitted
* Approve Documents
* Schedule Joining
* Complete Onboarding

After onboarding completed:

* Create Employee record
* Employee status becomes Active
* Show action: Create Deployment

# Flow 10: Deployment Creation

Build Create Deployment from employee/onboarding.

Fields:

* Employee
* Client
* Project
* Location
* Role
* Start date
* End date
* Reporting manager
* Billing model: Monthly / Daily / Hourly
* Billing rate
* Salary cost

After creation:

* Deployment status becomes Scheduled or Active
* Employee appears under client deployment
* Deployment appears in Deployments module

# Flow 11: Attendance and Timesheets

Build basic attendance/timesheet cycle.

For Monthly billing:

* Present days
* Leave/absent days
* Overtime if any

For Daily billing:

* Worked dates or number of working days

For Hourly billing:

* Hours worked
* Overtime hours

Statuses:

* Draft
* Submitted
* Client Approved
* Rejected
* Locked for Billing

Client Approver role can approve/reject submitted attendance.

After Client Approved:

* Record can be locked for billing

# Flow 12: Billing Draft

Build billing generation from approved/locked attendance.

User selects:

* Client
* Billing cycle
* Billing model or all models

System calculates billing draft:

Monthly:

billing amount = monthly billing rate adjusted for active days if needed

Daily:

billing amount = approved working days × daily rate

Hourly:

billing amount = approved hours × hourly rate

Show:

* Employee/deployment
* Billing model
* Approved days/hours
* Rate
* Amount
* Adjustments
* Tax placeholder
* Final amount

Statuses:

* Draft
* Pending Approval
* Approved
* Invoice Ready
* Sent
* Paid
* Disputed

Do not build real invoice integration.

Allow export/download placeholder.

# Flow 13: Offboarding

Build offboarding initiation.

From employee or deployment:

Initiate Offboarding

Fields:

* Exit type
* Last working date
* Exit reason
* Client clearance required
* Final attendance status
* Final billing status
* Document closure status

Statuses:

* Initiated
* Client Clearance Pending
* Final Attendance Pending
* Final Settlement Pending
* Completed
* Cancelled

After offboarding completed:

* Deployment status becomes Completed or Terminated
* Employee status becomes Exited
* Future billing should exclude that deployment

# UI/UX Requirements

Make every flow polished.

Use:

* Drawers for quick creation
* Stepper for complex creation
* Clear validation
* Confirmation modals for important actions
* Toasts after successful actions
* Activity timeline updates
* Status badges
* Progress indicators
* Breadcrumbs
* Context panels
* Good empty states
* Helpful next-best actions

Do not create a confusing all-in-one form.

Keep forms grouped into logical sections.

# Acceptance Criteria

The MVP flow is acceptable only if:

1. User can create a client.
2. User can create a client requirement.
3. User can create job from requirement only.
4. User can publish a job.
5. Candidate can apply to a published job.
6. Candidate and application records are created separately.
7. Recruiter can move candidate through pipeline.
8. Interview can be scheduled and feedback submitted.
9. Offer can be created and marked accepted.
10. Accepted offer can start onboarding.
11. Completed onboarding creates employee.
12. Employee can be deployed to client.
13. Attendance/timesheet can be submitted and approved.
14. Billing draft can be generated from approved data.
15. Offboarding can stop future billing.
16. All modules feel connected.
17. UI remains polished and easy to use.
18. No internal hiring is added.
19. No unrelated HRMS features are added.
20. No fake external integrations are added.

---

## Prompt 3

Now improve the SPC Workforce Management Platform to make it stakeholder-demo ready.

Do not rebuild from scratch.

Preserve all working flows and business logic.

Focus on UI/UX quality, operational intelligence, AI-native assistance, and product polish.

# Goal

Make the app feel like a premium SaaS platform built for staffing and deployed workforce management.

Improve:

* Visual hierarchy
* Navigation clarity
* Dashboard usefulness
* Detail page design
* Form usability
* Status clarity
* Empty states
* Error states
* AI advisory insights
* Responsiveness
* Demo storytelling

# Dashboard Polish

The dashboard should answer:

What needs attention today?

Improve dashboard layout with:

* Compact KPI cards
* Priority work queue
* AI operational summary
* Client requirement risk
* Onboarding blockers
* Attendance approval blockers
* Billing readiness
* Contract/deployment expiry alerts
* Recent activity timeline

Avoid decorative charts.

Use operational cards like:

* 3 requirements at risk
* 8 candidates waiting for interview feedback
* 5 onboarding cases missing documents
* 12 timesheets awaiting client approval
* ₹4.8L billing ready for review
* 2 deployments ending this week

# AI Insights Layer

Create reusable AI insight components.

AI insight card must show:

* Insight title
* Severity
* Explanation
* Evidence
* Recommended action
* Review required label

Add AI insights in these areas:

## Recruitment

* Requirement risk detected
* Candidate match explanation
* Duplicate candidate warning
* Talent pool resurfacing suggestion

## Onboarding

* Missing document summary
* Document quality warning
* Joining risk alert

## Deployment

* Deployment ending soon
* Employee without active billing rule
* Client assignment conflict

## Attendance

* Missing attendance
* Unusual overtime
* Timesheet submitted late

## Billing

* Billing anomaly
* Rate mismatch
* Employee included without approved attendance
* Month-on-month billing variance

AI must be advisory only.

AI must never:

* Reject candidates
* Approve documents
* Approve billing
* Change statuses automatically
* Make final decisions

# Detail Page Polish

Improve detail pages using a consistent layout.

Recommended detail page structure:

* Header with entity name, status, primary actions
* Left/main area with operational information
* Right side panel with summary, owner, dates, related records
* Activity timeline
* Next recommended action

Apply this to:

* Client detail
* Requirement detail
* Job detail
* Candidate detail
* Onboarding detail
* Employee detail
* Deployment detail
* Billing detail
* Offboarding detail

# Table Polish

Improve all tables:

* Better column sizing
* Sticky header where useful
* Search and filters
* Status badges
* Progress bars
* Row hover
* Row click
* Contextual action menus
* Empty states
* Pagination or page size control
* Clear loading states

Do not overload tables with too many columns.

Use secondary text for less important details.

# Forms Polish

Improve forms:

* Group fields into sections
* Use stepper for long workflows
* Show context panels
* Show validation inline
* Use helpful helper text
* Avoid huge single-page forms
* Keep primary action sticky where useful
* Use confirmation for irreversible actions

# Candidate Experience Polish

Improve public job and application flow:

* Clean job cards
* Clear job detail
* Simple application form
* No unnecessary sensitive data at application stage
* Consent checkbox
* Confirmation screen
* Resume upload placeholder
* Mobile-friendly design

Do not ask for Aadhaar, PAN, or bank details before selection/onboarding.

# Website Management Polish

Improve website management:

* Published jobs
* Draft jobs
* Paused jobs
* Careers preview
* Insights/articles list
* Draft/published state
* Basic edit/create article flow

Keep it lightweight.

Do not build full CMS.

# Reports Polish

Improve Reports & AI Insights page.

Show:

* Recruitment funnel
* Requirement fulfilment
* Onboarding SLA
* Active deployments
* Attendance approval status
* Billing readiness
* Offboarding status
* AI risk summary

Use charts only where they help.

Avoid decorative analytics.

# Role-Based UX Polish

Make sure each role sees relevant actions.

Recruiter:

* Requirements assigned to them
* Jobs
* Candidates
* Interviews
* Offers

Operations Manager:

* Onboarding
* Employees
* Deployments
* Attendance
* Offboarding

Billing Manager:

* Billing
* Attendance approval status
* Billing reports

Client Approver:

* Their client deployments
* Attendance/timesheet approvals only

Employee:

* Own profile
* Own deployment
* Own timesheets/documents

# Copy Polish

Remove all developer-facing language.

Do not show:

* Mock
* Placeholder
* Seed data
* Demo state
* Fake
* Lorem ipsum
* Coming soon
* Not implemented
* Future flow
* Test data

Use product-facing copy.

If a feature is not fully implemented, use graceful language such as:

* No records found
* Create your first requirement
* Select a client to continue
* This action needs approval

# Responsiveness

Ensure:

* Desktop experience is excellent
* Tablet usable
* Mobile basic flows usable
* Tables scroll gracefully
* Forms do not break
* Sidebar collapses properly
* Actions remain accessible

# Final Acceptance Criteria

The app is ready when:

1. It looks polished enough for stakeholder demo.
2. It clearly solves SPC’s staffing workflow.
3. It does not look like a generic HRMS.
4. Main workflows are connected.
5. UI hierarchy is strong.
6. Statuses and next actions are clear.
7. AI insights are useful and explainable.
8. No unnecessary complexity is added.
9. No developer wording is visible.
10. All pages are responsive and usable.
11. The product story is clear from dashboard to billing.
