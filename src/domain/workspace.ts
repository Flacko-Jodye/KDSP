import { z } from "zod";
import data from "../generated/pio-catalog.json";
import type { PioElement } from "./catalog";
export const catalog = data as unknown as Omit<typeof data, "elements"> & {
  elements: PioElement[];
};
export const elementMap = new Map(catalog.elements.map((e) => [e.id, e]));
export const profileMap = new Map(
  catalog.elements
    .filter((e) => e.kind === "profile")
    .map((e) => [e.source.canonical, e]),
);
export const priorities = {
  offen: "Offen",
  kern: "Kerndatensatz",
  erweiterung: "Erweiterung",
  nicht_im_kern: "Nicht im Kern",
} as const;
export const usages = {
  benoetigt: "Benötigt",
  erzeugt: "Erzeugt",
  uebergibt: "Übergibt",
} as const;
const text = z.string().max(20000);
const id = z.string().min(1).max(3000);
const date = z.string().datetime();
const assignmentSchema = z.object({
  elementId: id,
  themeId: id.optional(),
  priority: z.enum(["offen", "kern", "erweiterung", "nicht_im_kern"]),
  rationale: text.optional(),
  sortOrder: z.number().finite(),
  updatedAt: date,
});
const stepSchema = z.object({
  id,
  title: text,
  description: text.optional(),
  actorIds: z.array(id),
  information: z.array(
    z.object({
      elementId: id,
      usage: z.enum(["benoetigt", "erzeugt", "uebergibt"]),
      notes: text.optional(),
    }),
  ),
  position: z.object({ x: z.number().finite(), y: z.number().finite() }),
  kind: z.enum(["start", "aktion", "entscheidung", "ende"]),
});
const workflowSchema = z.object({
  id,
  name: text,
  description: text.optional(),
  steps: z.array(stepSchema),
  connections: z.array(
    z.object({ id, source: id, target: id, label: text.optional() }),
  ),
});
export const workspaceSchema = z.object({
  schemaVersion: z.literal(1),
  id,
  name: text,
  sourceIgVersion: id,
  catalogFingerprint: id,
  createdAt: date,
  updatedAt: date,
  themes: z.array(
    z.object({
      id,
      name: text,
      description: text.optional(),
      color: text.optional(),
      sortOrder: z.number().finite(),
    }),
  ),
  actors: z.array(z.object({ id, name: text, description: text.optional() })),
  assignments: z.array(assignmentSchema),
  workflows: z.array(workflowSchema),
});
export type Workspace = z.infer<typeof workspaceSchema>;
export type Assignment = z.infer<typeof assignmentSchema>;
export type Workflow = z.infer<typeof workflowSchema>;
export type ProcessStep = z.infer<typeof stepSchema>;
export type Priority = Assignment["priority"];
export const uid = () => crypto.randomUUID();
export function newWorkspace(name = "Mein Workshop"): Workspace {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    id: uid(),
    name,
    sourceIgVersion: catalog.igVersion,
    catalogFingerprint: catalog.fingerprint,
    createdAt: now,
    updatedAt: now,
    themes: [],
    actors: [],
    assignments: [],
    workflows: [],
  };
}
export function setAssignment(
  w: Workspace,
  elementId: string,
  patch: Partial<Omit<Assignment, "elementId">>,
) {
  let a = w.assignments.find((a) => a.elementId === elementId);
  if (!a) {
    a = {
      elementId,
      priority: "offen",
      sortOrder: w.assignments.length,
      updatedAt: new Date().toISOString(),
    };
    w.assignments.push(a);
  }
  Object.assign(a, patch, { updatedAt: new Date().toISOString() });
}
export function removeTheme(w: Workspace, id: string) {
  w.themes = w.themes.filter((t) => t.id !== id);
  w.assignments.forEach((a) => {
    if (a.themeId === id) delete a.themeId;
  });
}
export function removeStep(f: Workflow, id: string) {
  f.steps = f.steps.filter((s) => s.id !== id);
  f.connections = f.connections.filter(
    (c) => c.source !== id && c.target !== id,
  );
}
export function addInformation(step: ProcessStep, elementId: string) {
  if (!step.information.some((i) => i.elementId === elementId))
    step.information.push({ elementId, usage: "benoetigt" });
}
export function validateWorkspace(input: unknown): Workspace {
  const parsed = workspaceSchema.safeParse(input);
  if (!parsed.success)
    throw new Error(
      "Die Datei hat kein gültiges Arbeitsstand-Format (Schema 1). " +
        parsed.error.issues
          .slice(0, 3)
          .map((i) => i.path.join(".") + ": " + i.message)
          .join("; "),
    );
  const w = parsed.data;
  if (w.sourceIgVersion !== catalog.igVersion)
    throw new Error(
      `IG-Versionskonflikt: Datei ${w.sourceIgVersion}, lokal ${catalog.igVersion}. Import abgelehnt; keine IDs wurden umgedeutet.`,
    );
  if (w.catalogFingerprint !== catalog.fingerprint)
    throw new Error(
      "Der Quellkatalog unterscheidet sich trotz gleicher Versionsnummer. Import abgelehnt; bitte denselben IG-Quellbestand verwenden.",
    );
  const unique = (xs: string[], label: string) => {
    if (new Set(xs).size !== xs.length)
      throw new Error(`Doppelte IDs: ${label}`);
  };
  unique(
    w.themes.map((t) => t.id),
    "Themen",
  );
  unique(
    w.actors.map((a) => a.id),
    "Akteure",
  );
  unique(
    w.assignments.map((a) => a.elementId),
    "Zuordnungen",
  );
  unique(
    w.workflows.map((f) => f.id),
    "Abläufe",
  );
  const checkElement = (id: string) => {
    if (!elementMap.has(id)) throw new Error("Unbekannte PIO-ID: " + id);
  };
  w.assignments.forEach((a) => {
    checkElement(a.elementId);
    if (a.themeId && !w.themes.some((t) => t.id === a.themeId))
      throw new Error("Unbekanntes Thema");
  });
  w.workflows.forEach((f) => {
    unique(
      f.steps.map((s) => s.id),
      "Schritte",
    );
    unique(
      f.connections.map((c) => c.id),
      "Verbindungen",
    );
    f.steps.forEach((s) => {
      unique(
        s.information.map((i) => i.elementId),
        "Schrittinformationen",
      );
      s.information.forEach((i) => checkElement(i.elementId));
      s.actorIds.forEach((id) => {
        if (!w.actors.some((a) => a.id === id))
          throw new Error("Unbekannter Akteur");
      });
    });
    f.connections.forEach((c) => {
      if (
        !f.steps.some((s) => s.id === c.source) ||
        !f.steps.some((s) => s.id === c.target)
      )
        throw new Error("Verbindung verweist auf fehlenden Schritt");
    });
  });
  return w;
}
export function exportJson(w: Workspace) {
  const ids = new Set([
    ...w.assignments.map((a) => a.elementId),
    ...w.workflows.flatMap((f) =>
      f.steps.flatMap((s) => s.information.map((i) => i.elementId)),
    ),
  ]);
  return JSON.stringify(
    {
      format: "pflege-workshop",
      workspace: w,
      originalLabels: [...ids].map((id) => ({
        id,
        label: elementMap.get(id)!.label,
        source: elementMap.get(id)!.source,
      })),
    },
    null,
    2,
  );
}
export function importJson(json: string) {
  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Die Datei enthält kein lesbares JSON.");
  }
  return validateWorkspace(parsed.workspace ?? parsed);
}
export function resultRows(w: Workspace) {
  const ids = new Set([
    ...w.assignments.map((a) => a.elementId),
    ...w.workflows.flatMap((f) =>
      f.steps.flatMap((s) => s.information.map((i) => i.elementId)),
    ),
  ]);
  return [...ids].flatMap((id) => {
    const e = elementMap.get(id)!;
    const a = w.assignments.find((a) => a.elementId === id);
    const base = {
      id,
      label: e.label,
      theme: w.themes.find((t) => t.id === a?.themeId)?.name ?? "",
      priority: priorities[a?.priority ?? "offen"],
      rationale: a?.rationale ?? "",
      source: e.source.file + " #" + e.source.elementId,
    };
    const relations = w.workflows.flatMap((f) =>
      f.steps.flatMap((s) =>
        s.information
          .filter((i) => i.elementId === id)
          .map((i) => ({
            ...base,
            workflow: f.name,
            step: s.title,
            actors: s.actorIds
              .map((id) => w.actors.find((a) => a.id === id)?.name)
              .join(", "),
            usage: usages[i.usage],
            notes: i.notes ?? "",
          })),
      ),
    );
    return relations.length
      ? relations
      : [{ ...base, workflow: "", step: "", actors: "", usage: "", notes: "" }];
  });
}
export function exportCsv(w: Workspace) {
  const rows = resultRows(w);
  const keys = [
    "id",
    "label",
    "theme",
    "priority",
    "rationale",
    "workflow",
    "step",
    "actors",
    "usage",
    "notes",
    "source",
  ] as const;
  const quote = (s: string) =>
    '"' + (/^[\s]*[=+@\-]/.test(s) ? "'" + s : s).replaceAll('"', '""') + '"';
  return (
    "\uFEFF" +
    [
      [
        "IG-ID",
        "Originalbezeichnung",
        "Thema",
        "Priorität",
        "Begründung",
        "Ablauf",
        "Schritt",
        "Akteure",
        "Verwendung",
        "Notizen",
        "Quelle",
      ]
        .map(quote)
        .join(";"),
      ...rows.map((r) => keys.map((k) => quote(r[k])).join(";")),
    ].join("\r\n")
  );
}
