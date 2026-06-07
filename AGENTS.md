# AGENTS.md

VS Code extension (TypeScript) for fast navigation between Rails files.

## Architecture

Navigation is rule-driven. To add/change navigation behavior:
- `src/rails-file.ts` — `RailsFile`: file classification (`isController`, `isMailer`, etc.) derived from `fileType`. Start here for "what kind of file is this".
- `src/rails-workspace.ts` — path derivation (`getViewPath`, `getSpecPath`, `getTestPath`) and workspace/app-root resolution.
- `src/makers/*` — pure functions producing candidate `SwitchFile`s for a given file type.
- `src/rules.ts` — wires matchers to makers; controls fast-nav (`alt+r`) results.
- `src/commands/*` — command entry points; `index.ts` maps command names to handlers (mirror this in `package.json` `contributes.commands`).

Routing: a navigation feature usually touches a maker + `rules.ts` + the relevant command guard, plus a classifier in `rails-file.ts`.

## Conventions / gotchas

- View dir derivation differs by source: controllers strip `_controller` (`cats_controller` -> `views/cats`); mailers use the full name (`user_mailer` -> `views/user_mailer`). Namespacing reuses `locationWithinAppLocation`.
- Multiple app roots (Packwerk packs, engines) are supported via `rails.appDirs`; resolve paths from `railsFile.containingAppPath`, not a single app dir.
- Test fixtures for navigation live in `src/test/project/**`. Add example files there so features are manually testable in the Extension Host.

## Validation

- `npm run test-compile` — tsc; run before claiming done.
- `npm run test:unit` — fast headless unit tests (mocha).
- `npm test` — full vscode-extension-tester suite; needs a GUI VS Code instance and will not run in an agent/headless env. Add integration tests but ask the user to run this locally/CI.

## Release flow

- Jeremy publishes. Versioning: `npm version <patch|minor|major>` (bumps `package.json` + `package-lock.json`, creates an annotated tag `vX.Y.Z` whose message is the bare version, e.g. `1.4.0`).
- Feature = minor bump.
- If the version was already bumped + committed manually, do NOT run `npm version` (double-bump). Instead create the matching tag: `git tag -a vX.Y.Z <release-commit> -m "X.Y.Z"` and push it.
- CHANGELOG.md uses top-level `## X.Y.Z` sections, newest first.
