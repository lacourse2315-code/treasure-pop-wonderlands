# Data Contract Foundation — PRD-02

All game content added after PRD-02 must use explicit identifiers and contracts. Content validation must run before QA acceptance.

Minimum required cross-reference checks include:

- quest → reward
- quest → NPC
- zone → quest
- companion → asset
- realm → zone
- item → localization

PRD-02 establishes `ContentReference`, `ContentRegistryView`, and `validateContentReferences()` as a minimal pure-TypeScript seam. This is a foundation, not the final content model. New content kinds should be added only when a real authorized system requires them.

IDs use stable lower-case snake_case. The future complete content validator is canonically required to detect, at minimum:

- malformed ID
- duplicate ID
- missing target reference
- invalid source reference
- missing required localization
- missing required asset

These conditions must become QA validation failures rather than deferred runtime crashes. PRD-02/02B intentionally does not create the complete future Realm/content schemas.
