# Smart Client Requirement Creation

## Overview

The Smart Client Requirement Creation feature extends the automated document-parsing capabilities of the platform. It allows recruiters and managers to upload Client Requirement documents (PDF, DOCX, XLSX, TXT) to auto-generate multiple draft `ClientRequirement` records in a single pass.

## Workflow

1. **Entry Point**: The user initiates requirement creation from `RequirementsList`, `ClientsList`, or `ClientDetail` via the standard `CreateRequirementModal`.
2. **Selection**: A prompt asks the user to choose between "Create Manually" and "Upload Document".
3. **Upload**: 
   - Drag-and-drop or file selection for PDF, DOCX, TXT, or **XLSX**.
   - Strict 10MB limit.
   - The file is posted to `/api/extract-requirement`.
4. **Processing**:
   - `multer` parses the multipart form data.
   - Files are read as buffers (`pdf-parse`, `mammoth`, `xlsx`).
   - The extracted text is passed to Google Gemini 1.5 Flash.
   - The LLM is instructed to detect **multiple roles** in the single document.
   - Returns a strictly typed `ExtractedRequirementData[]` array.
5. **Review and Client Resolution**:
   - `SmartRequirementReview` renders the source document on the left and extracted roles on the right.
   - Users can exclude or include specific roles.
   - **Client Resolution**: 
     - The AI detects the client name.
     - A fuzzy match is performed against the `clients` state.
     - If matched, the Global Client ID is pre-selected.
     - If unmatched, the user must explicitly select an existing client or use the inline "Create New Client" form.
     - **Constraint**: A new client created this way starts as `Inactive` and is only activated when a requirement is successfully finalized (enforced by the existing context logic).
6. **Save (Atomic & Draft)**:
   - Validated roles are bundled into an array.
   - `createRequirement` handles an atomic array insert into the `requirements` store.
   - `status` is explicitly set to `Draft`.
   - `RequirementSourceMetadata` is attached for auditability.

## API Changes

- Added `POST /api/extract-requirement`.
- Schema expects an array of extracted requirement objects.
- Integrated `xlsx` package to convert sheet cells into flat text for LLM interpretation.

## Validations

- Ensures at least one role is selected.
- Enforces mandatory fields: Client mapping, Role Title, Positions Required (>= 1), and Target Date.
- Prevents submission on extraction errors.
