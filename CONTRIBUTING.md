# Contributing to Reactor

Reactor is a general frontend library for Blue Fission applications and compatible browser projects. Contributions should improve a reusable frontend contract, primitive, adapter, migration path, test, example, or document without moving product-specific behavior into the package.

## Set up the repository

Reactor requires a current Node.js release supported by the repository workflows.

```bash
npm ci
npm test
npm run check
```

The normal test suite is self-contained and must pass without credentials or optional services.

## Choose a focused change

Start from an issue that states the intent, user story, acceptance criteria, and ownership boundary. Use one of these branch forms:

- `feature/<issue>-<slug>`
- `issue/<issue>-<slug>`
- `hotfix/<issue>-<slug>`

Keep public APIs framework-agnostic where practical. Compatibility behavior belongs in an adapter. Application workflows, backend policy, and product-specific screen orchestration remain outside Reactor.

When behavior changes, update or add tests and revise the relevant API, architecture, specification, migration, or roadmap document. Examples should use domain-neutral names and should run without private services.

## Validate the change

Run the checks that match the change. For code and package-surface changes, run all three commands:

```bash
npm test
npm run check
npm run verify:release
```

Documentation-only changes should still verify referenced files, commands, package entry points, and links against the current branch.

## Open a pull request

Pull requests must target the repository's protected default branch and include:

- an intent summary
- user stories or acceptance criteria
- key files changed
- exact test commands and results
- a QA checklist
- any approval conditions or unresolved reviewer questions

Do not commit credentials, local machine paths, private project identities, generated dependency directories, or environment files. Use the private reporting process in `SECURITY.md` for suspected vulnerabilities.
