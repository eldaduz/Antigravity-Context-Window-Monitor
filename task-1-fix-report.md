# Task 1 fix report

- Added `Install Update` confirmation before VSIX download or extension install.
- Regression test confirms dismissing prompt performs only release lookup and never runs install command.
- Verified: `npm test -- updater.test.ts` (4 passed); `npm run compile` (passed); `git diff --check` (passed).
- Scope: `src/updater.ts`, `tests/updater.test.ts`; Task 2 untouched.
