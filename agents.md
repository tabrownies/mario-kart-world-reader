# AI Developer Agents Directory & Guide

Welcome, AI Agent!

Please read and adhere to the guidelines below.

---

## 1. Shared Types & Bidirectional Translators

Before hardcoding strings or custom enums, check the central Protobuf schema:

- **Schema**: `packages/types/data.proto`

We have generated types and created translation scripts for two languages:

- **TypeScript**: `packages/types/typescript/`
- **Python**: `packages/types/python/`

Please add more if you need a new language.

---

## 2. Formatting and Linting Standards

Every AI agent must ensure that all code additions or modifications are formatted prior to
completing their tasks. Run the following root commands:

- **Check All**: `npm run check:all`
- **Fix All**: `npm run fix`

## 3. As a soft rule, use test as a suffix for tests. This is not a hard rule
