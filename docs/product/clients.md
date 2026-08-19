# Client Management

The Client Management module allows users to track and maintain profiles of client organizations. A Client acts as the parent entity for any Client Requirements and subsequent Job Postings.

## Overview

- **Core Fields**: Name, Primary Industry, Locations.
- **Optional Contacts**: Primary Contact Name, Email, and Phone can be supplied.
- **Dynamic Status**: A Client's `status` (Active / Inactive) is automatically determined by the presence of active requirements.

## Creating Clients
Clients can be created via:
1. The **Add Client** manual modal on the Clients List.
2. The inline creation form during Requirement creation (e.g., via Smart Requirement Document parsing).

New clients begin in the `Inactive` status.

## Editing Clients
Only **ADMIN** and **MANAGER** roles can modify existing Client records. Recruiters cannot edit or delete clients.
- **Fields allowed**: Name, Industry, Locations, and Contact fields.
- **Restricted fields**: `status`, `activeRequirementsCount`, `openPositionsCount`. These are managed by system constraints and cannot be updated manually.
- Duplicate names (case-insensitive) are rejected.
- Form prevents closing accidentally if there are unsaved changes.

## Deleting Clients
Deleting a Client is restricted to **ADMIN** and **MANAGER** roles. It is heavily discouraged if active records depend on it.
