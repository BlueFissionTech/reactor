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

test("publication workflow uses release tags, OIDC, provenance, and public access", () => {
  const workflow = readFileSync(new URL("../.github/workflows/publish.yml", import.meta.url), "utf8");

  assert.match(workflow, /types: \[published\]/);
  assert.match(workflow, /id-token: write/);
  assert.match(workflow, /node-version: "24"/);
  assert.match(workflow, /npm run verify:release/);
  assert.match(workflow, /npm publish --provenance --access public/);
  assert.match(workflow, /NODE_AUTH_TOKEN: \$\{\{ secrets\.NPM_TOKEN \}\}/);
});

test("MIT license and security reporting instructions are publication inputs", () => {
  const license = readFileSync(new URL("../LICENSE", import.meta.url), "utf8");
  const security = readFileSync(new URL("../SECURITY.md", import.meta.url), "utf8");

  assert.match(license, /^MIT License/);
  assert.match(license, /Blue Fission Technology/);
  assert.match(security, /security\/advisories\/new/);
});
