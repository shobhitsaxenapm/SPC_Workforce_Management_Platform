# UI States and Validations

This document details form validation rules, data checks, and UI states configured across the SPC Workforce Management Platform.

---

## Form and Action Validations

### 1. Resume Parsing & Uploads (Candidates)
- **Paste Text**: Paste field must contain non-empty text before trigger parsing.
- **Upload File**: File format must enforce pdf/docx extensions with sizes under 5MB.
- **Bulk Upload**: Files must pass validation checks. Reject incomplete columns and show errors.

### 2. Bulk Employee Importer (CSV / Excel)
- **Data Validation**: System validates each row before final import (confirming name, email format, and unique employee code).
- **Validation Errors Screen**: Lists rows with errors (e.g. "Row 4: Email format invalid") and disables the "Import" action until cleared.

### 3. Secure Document Upload (/public/upload-documents/:token)
- **Token Authorization Check**: Links are validated against database expiration dates.
- **Required Files**: Candidate must attach requested documents (Aadhaar, PAN) in JPG, PNG, or PDF formats.
- **Verification Review**: HR can approve or reject each item. Rejections require inputting feedback reasons.

### 4. Create Contract Form
- **Employee Selection**: Must select an active employee from lookup.
- **Duration**: Duration months must be positive integers.
- **Expiry Date**: Expiry date must not be before contract start date.

---

## Required UI States

- **Loading State**: Center loading spinner disables form submit actions during remote operations.
- **Empty State**: Renders illustrative instructions (e.g. "No pending onboarding approvals").
- **No Search Result State**: Displays empty search tables with reset buttons.
- **Success State**: Toast or banner flashes green for 3 seconds.
- **Error State**: Displays red banner alerts with retry options.
- **Validation Error State**: Form borders highlighted in red with validation strings.
- **Disabled Action State**: Inactive buttons showing `opacity-50` and blocked clicks.
- **Confirmation Modal State**: Warns before destructive tasks (e.g. deactivating HR users).
- **Unauthorized Access State**: full screen warning for unauthorized role paths.
- **Not Found State**: Renders "404 - Page/Record Not Found".
- **File Upload Progress State**: Displays percentage progress bars during document uploads.
- **Duplicate Submission State**: Disables buttons immediately after click to prevent double submits.
- **Unsaved Changes State**: Dialog check pops up if user leaves a modified form without clicking save.
