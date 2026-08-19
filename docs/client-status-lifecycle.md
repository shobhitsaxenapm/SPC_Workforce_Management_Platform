# Client Status Lifecycle

The SPC Workforce Management Platform uses a strictly system-derived, automatic lifecycle for Client statuses. This ensures data consistency and removes the overhead of manual status tracking.

## The Invariant

Client status is calculated solely based on the presence of non-deleted, attached client requirements:

```text
client.status = requirementCount > 0 ? 'Active' : 'Inactive'
```

- **`Active`**: The client has at least one associated non-deleted requirement.
- **`Inactive`**: The client has zero associated non-deleted requirements.

> **Note:** The lifecycle state of the attached requirement itself (e.g., Draft, Open, Fulfilled, Closed) **does not affect** the client's active status. As long as the requirement exists and is attached to the client, the client is considered `Active`. Soft-deleted requirements do not count.

## Implementation Details

### Centralized Recalculation
The application guarantees this invariant by using a centralized data synchronization step. In `AppContext.tsx`, any mutation to the requirements state (via `persistRequirements`) automatically and atomically recalculates the statuses for all clients affected by those requirements.

Operations that trigger recalculation:
1. **Creation**: Creating a new requirement transitions its client from `Inactive` to `Active`.
2. **Reassignment**: If a requirement is reassigned from Client A to Client B, both clients are recalculated within the same transaction.
3. **Deletion**: Deleting the final non-deleted requirement for a client transitions it to `Inactive`.

### API & Form Contracts
- **No manual override**: The `status` field has been removed from all client creation (`createClient`) and update DTOs.
- **Initial State**: All newly created clients are instantiated with an `Inactive` status by default, as they have zero requirements at the moment of creation.
- **Read-only**: Statuses displayed in the UI (e.g., badges on the Client List or Client Details pages) are strictly read-only.

## Data Migration
When the context mounts, an automatic data migration routine (`AppContext.tsx`) runs across all persisted clients. It evaluates each client's relationships against the stored requirements and corrects any stale status values (e.g., clients that were manually set to `Active` but have zero requirements) before hydrating the application state. This ensures backward compatibility with legacy seeded data.
