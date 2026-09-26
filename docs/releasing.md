# Public npm releases

Reactor is a public MIT-licensed companion to DevElation and publishes under the `@bluefission` npm organization scope.

## Release contract

- Publish only reviewed commits from `main`.
- Package versions are immutable. Never overwrite or reuse an npm version.
- The GitHub release tag must equal `v` plus the `package.json` version.
- Public releases use `publishConfig.access=public`.
- Tests, syntax checks, package inspection, and release identity verification must pass before publication.
- Normal releases authenticate only through the package's npm trusted publisher and GitHub Actions OIDC.
- Package publishing requires two-factor authentication and disallows traditional access tokens.
- Do not place npm credentials in the repository, workflow source, logs, or release notes.

## Current release-governance record

This record was reviewed against the repository and npm registry on 2026-09-24.

- `@bluefission/reactor@0.1.0` and Git tag `v0.1.0` are legitimate, immutable public history. Preserve them; do not unpublish, overwrite, or retag that version.
- A live npm metadata read returned `0.1.0`. The release workflow declares npm as the public registry and uses OIDC-backed provenance. The repository does not identify another package registry or mirror, so other exposure remains unverified rather than assumed absent.
- Reactor remains at incubating alpha maturity while its reusable frontend surface and migration coverage are still growing. This maturity label does not rename the existing `0.1.0` artifact and does not authorize another publication.
- No substantive closed-project consumer with a verified installed version is currently recorded. The documentation describes a legacy internal dashboard source as extraction and adoption context, but source context alone is not installation or compatibility evidence. A private owner check found one internal checkout that declares and commit-locks Reactor while its current source still imports local frontend modules; no installed Reactor package tree or package imports were observed, so it remains a candidate rather than a proven substantive consumer.

Before another release is approved, close or explicitly accept these proof gaps:

- capture exact installed versions and representative compatibility results for substantive closed-project consumers without publishing private project identities
- verify the published artifact from a clean exact-version install, including its documented entry points
- verify the npm provenance attestation and record any registry or mirror exposure
- complete dependency security and bundled-license review in addition to the package's MIT license
- define a rollback response for an immutable bad release, including deprecation, consumer notification, and a corrected successor version

Closed-project identities and deployment details belong in controlled operational records. A release issue or PR should carry only the neutral compatibility evidence that reviewers need.

## Proposed alpha lineage

The proposed next version line is `0.2.0-alpha.1`. It gives future reviewed capability work an explicit semantic prerelease identity while preserving the existing `0.1.0` artifact. This is a proposal for operator review, not an approved version change.

Do not edit `package.json`, create a tag or GitHub release, or write to a registry for this proposal until the operator approves the version line and a release PR supplies the missing consumer, provenance, security, licensing, clean-install, and rollback evidence.

## Registry ownership prerequisites

An npm organization is distinct from the GitHub organization. Before attempting the first release:

1. Sign in to npm with the company-owned publishing account and enable two-factor authentication.
2. If the `bluefission` npm organization does not exist, create it with the `Unlimited public packages` plan. Public-only organizations are free.
3. Confirm the publishing account is an organization member with write access.
4. Verify the active CLI identity and membership without storing credentials in this repository.

```bash
npm whoami
npm team ls bluefission:developers
```

An authentication or organization error from the membership check must be resolved before changing package ownership or access.

## Trusted publishing

The package trusted publisher is configured with:

- provider: GitHub Actions
- organization: `BlueFissionTech`
- repository: `reactor`
- workflow filename: `publish.yml`
- environment: `npm`
- allowed action: `npm publish`

The workflow grants `id-token: write`, uses Node.js 24 and an OIDC-capable npm CLI, and publishes only from a GitHub release tag. npm exchanges the workflow identity for a short-lived credential bound to this repository, workflow, environment, and action. No `NODE_AUTH_TOKEN` or `NPM_TOKEN` secret is used.

See npm's [trusted publishing documentation](https://docs.npmjs.com/trusted-publishers/) for the registry contract and supported runtime versions.

## Release procedure

1. Merge the reviewed version, release notes, and package changes to `main`.
2. Create and publish a GitHub release whose tag is `v` plus the exact `package.json` version.
3. Approve the protected `npm` environment deployment when required.
4. Let `publish.yml` verify the release identity, run the suite, inspect the tarball, and publish through OIDC with provenance.
5. Verify the live artifact and an exact install from a clean directory.

```bash
npm view @bluefission/reactor@<version>
npm install --save-exact @bluefission/reactor@<version>
node -e "import('@bluefission/reactor').then((module) => console.log(typeof module.createSignal))"
node -e "import('@bluefission/reactor/socket').then((module) => console.log(typeof module.createSocketClient))"
```

## Access token policy

Reactor has no standing npm publish token. Do not add `NPM_TOKEN`, a bypass-2FA token, or another write credential to the repository or its release environment. Trusted publishing is the long-term release credential.

The package currently has no private registry dependencies, so the workflow also needs no install token. If a future reviewed dependency is private, use a separate `NPM_READ_TOKEN` only for the install step. That token must be granular, read-only, limited to the required package or scope, have no organization-management access, keep bypass 2FA disabled, expire within 30 days, and be rotated or revoked when the dependency is removed. Store it only in the protected `npm` environment.

See npm's [access token guidance](https://docs.npmjs.com/about-access-tokens/) for the registry's current granular-token controls.

## Break-glass publication

If OIDC publication fails, first correct or retry the reviewed workflow without changing the tag or package version. When an urgent release cannot wait for workflow recovery, a maintainer may publish the exact reviewed tag interactively from a clean checkout with a second maintainer's approval:

```bash
npm publish --access public
```

The maintainer must authenticate interactively and complete npm's two-factor challenge. This exceptional path does not produce the GitHub-backed provenance of the normal workflow. Do not weaken the package publishing policy or create a bypass-2FA token for emergency publication. Record the reason, missing automated provenance, and verification result on the release issue.

The next versioned release should confirm the OIDC-only path before any other release automation changes are accepted.

## Versioning

- Prereleases use an explicit semantic suffix such as the proposed `0.2.0-alpha.1` and require operator approval before the version is adopted.
- Patch releases fix compatible defects after the applicable release line is approved.
- Minor releases add compatible public capabilities after prerelease evidence and review are complete.
- Breaking changes require an intentional version boundary and migration notes.

Update `package.json` and release notes in a reviewed PR before creating the matching GitHub release.
