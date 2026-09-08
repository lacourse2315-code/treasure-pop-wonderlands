# Save Contract — PRD-03

IndexedDB is the authoritative local V1 save store. Saves are keyed by `profileId + slot`, so one child's data cannot be selected as another child's save.

## Schema

The current schema is explicitly V1. Unknown future versions, missing versions, malformed payloads, invalid timestamps, invalid profile ownership, and checksum mismatches are rejected. The migration boundary is intentionally ready for future V1 → V2 → V3 work, but PRD-03 does not invent migrations that do not yet exist.

## Transaction / recovery policy

Each IndexedDB slot write uses a read-write transaction. The application service follows: validate next save → preserve valid current as previous → write current → re-read and validate current → promote verified current to lastKnownGood. Loading checks `current → previous → lastKnownGood` and never crosses profile IDs.

Profile deletion calls `deleteProfile`, deleting all three slots deterministically.

## Non-guarantees

IndexedDB is local persistence, not cloud backup. Browser-data deletion, uninstall, complete storage cleanup, physical device loss, or changing devices can destroy local data.

## Future parent transfer seam

`ParentSaveTransferPort` remains an architectural boundary only. Export/import is not implemented in PRD-03.
