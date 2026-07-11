# Agent Instructions

These instructions are binding for any agent system working on this repository.

## Development Rules

1. **Read All Specifications**: Always read all product and QA specification files under `/docs/product/` and `/docs/qa/` before performing any implementation, modification, or bug fix.
2. **Product Specifications are the Source of Truth**: Code behavior must strictly follow the defined specifications.
3. **Never Mark a Feature Complete Based Only on Visible UI**: Ensure that back-end flow, state transitions, validation, persistence, and tests function properly.
4. **No Unauthorized Route, Role, or State Transition Changes**: Do not change routes, roles, or state transitions without first checking the specification.
5. **Report Conflicts Proactively**: If requirements conflict or are ambiguous, report the conflict before making assumptions.
6. **Scoped Implementation**: Implement only explicitly selected requirement IDs. Do not make unrelated changes or replace working code unnecessarily.
7. **Maintain Traceability**: Update the requirement traceability matrix `/docs/qa/requirement-traceability-matrix.md` immediately after completing any implementation.
8. **Update Test Evidence**: Update test evidence in `/docs/qa/end-to-end-test-scenarios.md` after verification.
9. **No Untested Completion Claims**: Never mark untested functionality as complete.
10. **Definition of Done**: A requirement is complete only when navigation, validation, persistence, permissions, cross-module updates, and tests pass.
11. **Verification of Mismatch Documentation**: Always review `/docs/product/03-navigation-and-routes.md` to see codebase differences when modifying page paths or components.
