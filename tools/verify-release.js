import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const packagePath = fileURLToPath(new URL("../package.json", import.meta.url));

export function verifyRelease({ packageJson, tag = "" }) {
  const errors = [];

  if (packageJson.name !== "@bluefission/reactor") {
    errors.push("Package name must be @bluefission/reactor.");
  }

  if (packageJson.license !== "MIT") {
    errors.push("Public releases must use the MIT license.");
  }

  if (packageJson.publishConfig?.access !== "public") {
    errors.push("Public releases require publishConfig.access=public.");
  }

  if (packageJson.repository?.url !== "git+https://github.com/BlueFissionTech/reactor.git") {
    errors.push("Package repository metadata must identify BlueFissionTech/reactor.");
  }

  if (tag && tag !== `v${packageJson.version}`) {
    errors.push(`Release tag ${tag} does not match package version v${packageJson.version}.`);
  }

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }

  return {
    name: packageJson.name,
    version: packageJson.version,
    tag: tag || `v${packageJson.version}`,
    access: packageJson.publishConfig.access
  };
}

export function verifyCurrentRelease(tag = process.env.GITHUB_REF_NAME || "") {
  const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
  return verifyRelease({ packageJson, tag });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const result = verifyCurrentRelease(process.argv[2] || "");
  console.log(`${result.name}@${result.version} is ready for ${result.tag} (${result.access}).`);
}
