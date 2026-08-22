# Public npm releases

Reactor is a public MIT-licensed companion to DevElation and publishes under the `@bluefission` npm organization scope.

## Release contract

- Publish only reviewed commits from `main`.
- Package versions are immutable. Never overwrite or reuse an npm version.
- The GitHub release tag must equal `v` plus the `package.json` version.
- Public releases use `publishConfig.access=public`.
- Tests, syntax checks, package inspection, and release identity verification must pass before publication.
- Do not place npm credentials in the repository, workflow source, logs, or release notes.

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

An `E404` from `npm view @bluefission/reactor` is expected before the first publication. An authentication or organization error from the membership check must be resolved before creating release credentials.

## Initial `0.1.0` publication

The npm registry cannot configure a package-level trusted publisher until the package exists. Bootstrap the first release with a short-lived granular npm token, then remove it after OIDC trust is configured.

1. Confirm the `bluefission` npm organization exists and the publishing account has write access and two-factor authentication.
2. Merge all changes intended for `0.1.0`, including the production socket lifecycle contract.
3. Protect the GitHub `npm` environment with required reviewer approval.
4. Create a granular npm token limited to package publication, with the minimum lifetime and permissions needed for the first release. Direct publication requires the token's bypass-2FA option; revoke the token immediately after trusted publishing is configured.
5. Store that token as the repository environment secret `NPM_TOKEN`. Never place it in a file.
6. From the exact reviewed `main` commit, create and publish the GitHub release `v0.1.0`.
7. The `publish.yml` workflow verifies the tag, runs the suite, inspects the tarball, and publishes the public package with provenance.
8. Verify the live artifact and exact install from a clean directory.

```bash
npm view @bluefission/reactor@0.1.0
npm install --save-exact @bluefission/reactor@0.1.0
node -e "import('@bluefission/reactor').then((module) => console.log(typeof module.createSignal))"
node -e "import('@bluefission/reactor/socket').then((module) => console.log(typeof module.createSocketClient))"
```

## Trusted publishing

After `0.1.0` exists, configure its npm trusted publisher with:

- provider: GitHub Actions
- organization: `BlueFissionTech`
- repository: `reactor`
- workflow filename: `publish.yml`
- environment: `npm`
- allowed action: `npm publish`

With an authenticated npm CLI that supports trust management, the equivalent configuration is:

```bash
npm trust github @bluefission/reactor --repo BlueFissionTech/reactor --file publish.yml --env npm --allow-publish --yes
```

Run the next release through the workflow to verify OIDC publishing, then delete and revoke `NPM_TOKEN`. The workflow keeps the secret reference only as a first-publication fallback; an absent secret resolves empty while the npm CLI uses the trusted OIDC identity.

## Versioning

- Patch releases fix compatible defects: `0.1.1`.
- Minor releases add compatible public capabilities: `0.2.0`.
- Breaking changes require an intentional version boundary and migration notes.

Update `package.json` and release notes in a reviewed PR before creating the matching GitHub release.
