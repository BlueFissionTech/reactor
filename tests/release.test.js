import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { verifyRelease } from "../tools/verify-release.js";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("public package metadata identifies the reviewed Reactor source", () => {
  assert.equal(packageJson.name, "@bluefission/reactor");
  assert.equal(packageJson.version, "0.1.0");
  assert.equal(packageJson.license, "MIT");
  assert.equal(packageJson.publishConfig.access, "public");
  assert.equal(packageJson.repository.url, "git+https://github.com/BlueFissionTech/reactor.git");
  assert.equal(packageJson.homepage, "https://github.com/BlueFissionTech/reactor#readme");
  assert.equal(packageJson.bugs.url, "https://github.com/BlueFissionTech/reactor/issues");
});

test("public CRUD exports use neutral resource terminology", () => {
  assert.equal(
    packageJson.exports["./resource-crud"],
    "./src/adapters/resource-crud.js"
  );
  assert.equal(packageJson.exports["./opus-crud"], undefined);
});

test("release identity requires a tag matching the immutable package version", () => {
  assert.deepEqual(verifyRelease({ packageJson, tag: "v0.1.0" }), {
    name: "@bluefission/reactor",
    version: "0.1.0",
    tag: "v0.1.0",
    access: "public"
  });

  assert.throws(
    () => verifyRelease({ packageJson, tag: "v0.1.1" }),
    /does not match package version v0\.1\.0/
  );
});

test("publication workflow uses release tags and OIDC without a standing token", () => {
  const workflow = readFileSync(new URL("../.github/workflows/publish.yml", import.meta.url), "utf8");

  assert.match(workflow, /types: \[published\]/);
  assert.match(workflow, /id-token: write/);
  assert.match(workflow, /node-version: "24"/);
  assert.match(workflow, /npm install --global npm@\^11\.5\.1/);
  assert.match(workflow, /npm run verify:release/);
  assert.match(workflow, /npm publish --provenance --access public/);
  assert.doesNotMatch(workflow, /NODE_AUTH_TOKEN|NPM_TOKEN/);
});

test("MIT license and security reporting instructions are publication inputs", () => {
  const license = readFileSync(new URL("../LICENSE", import.meta.url), "utf8");
  const security = readFileSync(new URL("../SECURITY.md", import.meta.url), "utf8");

  assert.match(license, /^MIT License/);
  assert.match(license, /Blue Fission Technology/);
  assert.match(security, /security\/advisories\/new/);
});

test("release guidance defines tokenless publishing and bounded recovery", () => {
  const guide = readFileSync(new URL("../docs/releasing.md", import.meta.url), "utf8");

  assert.match(guide, /Unlimited public packages/);
  assert.match(guide, /npm team ls bluefission:developers/);
  assert.match(guide, /no standing npm publish token/i);
  assert.match(guide, /NPM_READ_TOKEN/);
  assert.match(guide, /expire within 30 days/);
  assert.match(guide, /authenticate interactively and complete npm's two-factor challenge/);
  assert.doesNotMatch(guide, /secrets\.NPM_TOKEN|Store that token as.*NPM_TOKEN/);
});
