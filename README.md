# Treasure Pop — Wonderlands

PRD-02 foundation shell only. No game content is included.

## Requirements

- Node.js 22.12+
- npm 10.9.2 recommended

## Install

```bash
npm install
```

All direct dependencies are exact-pinned. `npm install` should generate the repository lockfile on the first environment with registry access; commit that lockfile before content implementation begins.

## Development

```bash
npm run dev
```

## Verification

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

`npm run qa` executes the complete sequence.

## Scope

This repository contains only the minimum technical foundation: Phaser bootstrap, strict TypeScript configuration, architecture contracts, content/save contract seams, responsive bootstrap, and test harnesses. It contains no final realm, character, Pip, avatar, mission, gameplay, or final asset.
