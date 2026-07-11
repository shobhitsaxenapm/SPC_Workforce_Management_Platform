# Data Model

This document outlines the expected data entities, schemas, and relationships for the SPC Workforce Management Platform. These models are definitions of expected schemas and are not claims that they already exist in the codebase.

---

## Expected Entities

### 1. User (HR / Admin)
- `id` (String, Primary Key)
- `fullName` (String)
- `email` (String, Unique)
- `role` (Enum: 'company_admin', 'hr')
- `status` (Enum: 'Active', 'Inactive')
- `createdAt` (Timestamp)

### 2. Candidate
- `id` (String, Primary Key)
- `fullName` (String)
- `email` (String)
- `phone` (String)
- `rawResumeText` (Text, Nullable)
- `resumeFileUrl` (String, Nullable)
- `matchedSkills` (Array of Strings)
- `matchScore` (Integer)
- `noticePeriodDays` (Integer)
- `expectedSalary` (String)
- `source` (String)
- `stage` (Enum: 'Applied', 'Under Review', 'Screening', 'Shortlisted', 'Interview Scheduled', 'Interview Completed', 'Selected', 'Offer Sent', 'Offer Accepted', 'Ready for Onboarding', 'Rejected', 'Withdrawn')

### 3. Onboarding Case
- `id` (String, Primary Key)
- `candidateId` (String, Foreign Key -> Candidate.id)
- `stage` (Enum: 'Offer Sent', 'Offer Accepted', 'Documents Pending', 'Documents Verified', 'Joining Date Set', 'Onboarding Completed')
- `offerTemplateId` (String, Foreign Key -> OfferTemplate.id, Nullable)
- `documentChecklist` (JSON, tracking verification statuses of Aadhaar, PAN, Address Proofs)
- `joiningDate` (Date, Nullable)
- `approvalRequestId` (String, Foreign Key -> ApprovalRequest.id, Nullable)
- `createdAt` (Timestamp)

### 4. Offer Template
- `id` (String, Primary Key)
- `name` (String)
- `content` (Text)
- `status` (Enum: 'Active', 'Inactive')

### 5. Approval Request
- `id` (String, Primary Key)
- `type` (Enum: 'Onboarding', 'Contract')
- `entityId` (String)
- `requesterId` (String, Foreign Key -> User.id)
- `approverId` (String, Foreign Key -> User.id, Nullable)
- `status` (Enum: 'Pending', 'Approved', 'Rejected')
- `rejectionNotes` (String, Nullable)
- `createdAt` (Timestamp)

### 6. Employee
- `id` (String, Primary Key)
- `employeeCode` (String, Unique)
- `fullName` (String)
- `email` (String)
- `phone` (String)
- `designation` (String)
- `departmentId` (String, Foreign Key -> Department.id, Nullable)
- `joiningDate` (Date)
- `status` (Enum: 'Active', 'Inactive')

### 7. Department
- `id` (String, Primary Key)
- `name` (String, Unique)
- `code` (String, Unique)

### 8. Contract
- `id` (String, Primary Key)
- `contractNumber` (String, Unique)
- `employeeId` (String, Foreign Key -> Employee.id)
- `type` (Enum: 'Rate-based', 'Fixed Deliverable')
- `durationMonths` (Integer)
- `deliverables` (Text)
- `paymentTerms` (Text)
- `status` (Enum: 'Pending Approval', 'Active', 'Expiring Soon', 'Expired')
- `expiryDate` (Date)

### 9. HR Activity Log
- `id` (String, Primary Key)
- `actorId` (String, Foreign Key -> User.id)
- `actionType` (Enum: 'Onboarding', 'Employee', 'Contract', 'User Management')
- `description` (Text)
- `timestamp` (Timestamp)

---

## Entity Relationships

- **HR User & Log Timeline**: One-to-Many (`User` can generate many `HR Activity Logs`).
- **Department & Employees**: One-to-Many (`Department` holds references to multiple `Employees`).
- **Candidate & Onboarding**: One-to-One (`Candidate` generates one `Onboarding Case`).
- **Onboarding Case & Approval**: One-to-One (`Onboarding Case` can request one Admin approval).
- **Employee & Contracts**: One-to-Many (`Employee` can have multiple historical `Contracts`).
