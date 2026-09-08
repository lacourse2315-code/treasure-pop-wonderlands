# Save Contract Foundation — PRD-02

## Canonical V1 direction

- Multiple independent local child profiles.
- IndexedDB will be the authoritative local persistence layer when implemented.
- `localStorage` may hold only tiny preferences or recovery hints where appropriate.
- Save schemas are versioned and migrated; old valid saves are not reset simply because the application changes.
- Recovery chain: `current → previous → lastKnownGood`.
- New saves must eventually be validated, checksummed, written transactionally, re-read, and verified before becoming authoritative.

## Explicit non-guarantee

IndexedDB cannot guarantee permanent survival after browser data deletion, app deletion, device loss, full storage loss, or changing devices. Future documentation must not claim otherwise.

## Future parent transfer seam

A future authorized milestone may implement **Parent Save Export / Import**. PRD-02 defines only the `ParentSaveTransferPort` interface; it does not implement export/import, cloud sync, accounts, or networking.

## V1 network policy

No cloud save is required for V1. Gameplay must not depend on a network save service.
