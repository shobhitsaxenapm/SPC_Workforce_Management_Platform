# Smart Job Creation

## Overview

The Smart Job Creation feature streamlines the process of generating Job Openings from Job Description (JD) documents. Instead of manually filling out the job form, recruiters can upload a PDF, DOCX, or TXT file, and the platform will automatically extract relevant details (Title, Skills, Experience, Location, etc.) and propose a draft job.

## Workflow

1. **Entry Point**: The user initiates job creation from either the global "Jobs" list or a specific "Client Requirement" detail page.
2. **Selection**: A modal prompts the user to either "Create Manually" or "Upload Document".
3. **Upload**: 
   - The user drags and drops or selects a document (PDF, DOCX, TXT) up to 10MB.
   - The client application sends the file to the local Vite Dev Server Express API endpoint (`/api/extract-job`).
4. **Processing**:
   - The backend reads the buffer using `pdf-parse` (for PDF) or `mammoth` (for DOCX), or standard string conversion (for TXT).
   - The extracted raw text is sent to Google's Gemini API via structured schema (JSON mode) to cleanly map attributes such as Required Skills, Preferred Skills, Openings, Experience Range, and Employment Type.
5. **Review**:
   - The parsed JSON is returned to the frontend alongside the raw source text.
   - The `SmartJobReview` component presents a side-by-side view: the raw text on the left, and an editable form on the right.
   - If the AI confidently finds a matching Client Requirement (based on titles, IDs, or codes), it pre-selects it. Otherwise, the user *must* explicitly select a Linked Client Requirement.
   - The user can adjust any AI-extracted values.
6. **Save**:
   - Jobs created via upload are strictly saved as `Draft` status first. 
   - `JobSourceMetadata` is saved alongside the job for auditability (recording the parser version, timestamp, original filename, and extraction status).

## Technical Architecture

- **Backend**: An Express middleware mounted inside the Vite config (`server/api.ts`).
- **File Parsing**: `multer` for multipart form parsing, `pdf-parse`, and `mammoth`.
- **LLM**: `@google/genai` (Gemini 1.5 Flash).
- **Frontend**: 
   - `SmartJobUpload.tsx` (Drag/Drop UI, error states, progress indication).
   - `SmartJobReview.tsx` (Side-by-side split screen form, Draft enforcement).

## Data Models

`Job` interface extension:
```ts
export interface JobSourceMetadata {
  originalFilename: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
  extractionStatus: 'Success' | 'Partial' | 'Failed';
  parserVersion: string;
}
```

`ExtractedJobData` intermediate representation:
- Structurally enforces types for fields like `requiredSkills: string[]` and `openings: number`.

## Validation Rules

- Document size limit: 10MB.
- Allowed MIME types: `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `text/plain`.
- Job requires a mandatory `Linked Requirement` mapping before it can be saved.
- Extracted Job is forced to `Draft` mode and cannot be published in one step.
