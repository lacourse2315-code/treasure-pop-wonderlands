# Wonderlands Architecture Contract — PRD-02

Status: PRD-01 APPROVED / LOCKED. This document defines the minimum architectural boundaries that all implementation work must preserve.

## Canonical stack

- HTML5 / web-first.
- Phaser exactly 4.2.1 for presentation/runtime.
- TypeScript strict for application and domain code.
- Vite for development and production builds.
- Pure TypeScript domain systems wherever practical.
- Data-driven content with explicit contracts and pre-QA reference validation.
- IndexedDB planned as the authoritative V1 local save store; localStorage only for tiny preferences where appropriate.
- Vitest for domain/unit tests and Playwright for browser/responsive acceptance tests.
- Tiled is optional per zone and is never a gameplay/runtime requirement.
- No Three.js, PixiJS dependency, or Capacitor in V1 without an authorized milestone.

## Layer boundary

`src/domain` MUST NOT import Phaser.

Phaser owns rendering, scenes, camera, animation, input adapters, audio integration, and runtime world presentation. Business rules such as profiles, saves, progression, quests, objectives, rewards, inventory, collections, companions, secrets, unlocks, New Adventure+, and content validation remain renderer-independent whenever practical.

## Zone representation

The World/Zone runtime must be able to consume different presentation definitions. A future zone may use an orthogonal tilemap, isometric tilemap, composed background art, freely positioned sprites, parallax layers, separate navigation/path data, or a mixture. Tiled exports are adapters/data sources, not a core runtime dependency.

## Anti-overengineering rule

Create infrastructure when required, but obey these contracts from day one. Do not create empty subsystems simply to mirror a future folder diagram.

## Version discipline

Phaser is pinned to `4.2.1`. Do not use `latest`, do not mix Phaser 3 documentation into Phaser 4 work, and do not treat an unusual Phaser API as proven solely because TypeScript compiles. Runtime browser verification is required.

## Performance rule

Order of priorities: correctness → stable mobile runtime → measured optimization. Realm/zone unload boundaries must remain possible, but complex streaming is not introduced until measurements justify it.
