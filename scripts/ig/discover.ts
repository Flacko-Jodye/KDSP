import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
export interface Resource {
  resourceType: string;
  id: string;
  url?: string;
  version?: string;
  fhirVersion?: string;
  title?: string;
  name?: string;
  description?: string;
  type?: string;
  baseDefinition?: string;
  differential?: { element: RawElement[] };
  snapshot?: { element: RawElement[] };
  [key: string]: any;
}
export interface RawElement {
  id: string;
  path: string;
  short?: string;
  definition?: string;
  [key: string]: any;
}
export interface Source {
  file: string;
  hash: string;
  resource: Resource;
}
export async function discover(root: string): Promise<Source[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const result: Source[] = [];
  for (const entry of entries.sort((a, b) =>
    a.name.localeCompare(b.name, "en"),
  )) {
    const file = path.join(root, entry.name);
    if (entry.isDirectory()) result.push(...(await discover(file)));
    else {
      if (!file.endsWith(".json"))
        throw new Error(
          `Nicht unterstützte Quelle: ${file}. Bitte zuerst inventarisieren.`,
        );
      const bytes = await readFile(file);
      const resource = JSON.parse(
        bytes.toString("utf8").replace(/^\uFEFF/, ""),
      ) as Resource;
      if (!resource.resourceType)
        throw new Error(`FHIR-Ressourcentyp fehlt: ${file}`);
      result.push({
        file: file.replaceAll("\\", "/"),
        hash: createHash("sha256").update(bytes).digest("hex"),
        resource,
      });
    }
  }
  return result;
}
