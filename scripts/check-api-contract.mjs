import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const snapshotPath = resolve(root, "contracts/openapi/v1.yaml");
const generatedPath = resolve(root, "src/api/generated.ts");
const siblingContractPath = resolve(root, "../slack-off-api/contracts/openapi/v1.yaml");

const snapshot = readFileSync(snapshotPath);
const hash = createHash("sha256").update(snapshot).digest("hex");
const generated = readFileSync(generatedPath, "utf8");
const marker = `openapi-contract-sha256: ${hash}`;

if (!generated.includes(marker)) {
  throw new Error(`Generated API types are not marked for OpenAPI contract ${hash}.`);
}

if (existsSync(siblingContractPath)) {
  const sibling = readFileSync(siblingContractPath);
  const siblingHash = createHash("sha256").update(sibling).digest("hex");
  if (siblingHash !== hash) {
    throw new Error(
      `Mobile OpenAPI snapshot is out of sync with sibling API contract. mobile=${hash} api=${siblingHash}`
    );
  }
}

console.log(`OpenAPI contract snapshot verified: ${hash}`);
