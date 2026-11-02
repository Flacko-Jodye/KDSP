import "fake-indexeddb/auto";
import { describe, it, expect } from "vitest";
import {
  newWorkspace,
  setAssignment,
  removeTheme,
  removeStep,
  addInformation,
  importJson,
  exportJson,
  exportCsv,
  catalog,
  type ProcessStep,
} from "../../src/domain/workspace";
import { WorkshopDb } from "../../src/storage/store";
const id = catalog.elements.find((e) => e.label === "Pflegegrad")!.id;
const step = (id: string): ProcessStep => ({
  id,
  title: id,
  actorIds: [],
  information: [],
  position: { x: 123, y: 456 },
  kind: "aktion",
});
describe("Workshopintegrität", () => {
  it("trennt Dimensionen und bereinigt Themen ohne Prioritätsverlust", () => {
    const w = newWorkspace();
    w.themes.push({ id: "t", name: "Thema", sortOrder: 0 });
    setAssignment(w, id, { themeId: "t", priority: "kern" });
    setAssignment(w, id, { priority: "erweiterung" });
    expect(w.assignments[0].themeId).toBe("t");
    removeTheme(w, "t");
    expect(w.assignments[0].priority).toBe("erweiterung");
    expect(w.assignments[0].themeId).toBeUndefined();
  });
  it("behält unabhängige Mehrfachverwendung, Kanten und Koordinaten beim Roundtrip", () => {
    const w = newWorkspace();
    const a = step("a"),
      b = step("b");
    addInformation(a, id);
    addInformation(b, id);
    addInformation(b, id);
    b.information[0].usage = "uebergibt";
    w.workflows.push({
      id: "f",
      name: "Test",
      steps: [a, b],
      connections: [{ id: "e", source: "a", target: "b", label: "danach" }],
    });
    expect(importJson(exportJson(w))).toEqual(w);
    expect(a.information[0].usage).toBe("benoetigt");
    expect(b.information).toHaveLength(1);
    removeStep(w.workflows[0], "a");
    expect(w.workflows[0].connections).toHaveLength(0);
    expect(w.workflows[0].steps[0].information).toHaveLength(1);
  });
  it("lehnt falsche Versionen, IDs, Dubletten und kaputte JSON ab", () => {
    const w = newWorkspace();
    expect(() => importJson("{")).toThrow("JSON");
    expect(() =>
      importJson(JSON.stringify({ ...w, sourceIgVersion: "2" })),
    ).toThrow("Versionskonflikt");
    expect(() =>
      importJson(JSON.stringify({ ...w, catalogFingerprint: "x" })),
    ).toThrow("Quellkatalog");
    setAssignment(w, "unknown", {});
    expect(() => importJson(JSON.stringify(w))).toThrow("Unbekannte PIO-ID");
    w.assignments = [];
    w.themes = [
      { id: "t", name: "A", sortOrder: 0 },
      { id: "t", name: "B", sortOrder: 1 },
    ];
    expect(() => importJson(JSON.stringify(w))).toThrow("Doppelte");
  });
  it("schützt CSV vor Formeln und erhält Anführungszeichen", () => {
    const w = newWorkspace();
    setAssignment(w, id, { rationale: '=HYPERLINK("x")' });
    expect(exportCsv(w)).toContain("'=HYPERLINK");
    expect(exportCsv(w)).toContain('""x""');
  });
  it("persistiert mehrere getrennte Arbeitsstände nach Wiederöffnung", async () => {
    const name = "test-" + crypto.randomUUID();
    const db = new WorkshopDb(name);
    const a = newWorkspace("A"),
      b = newWorkspace("B");
    setAssignment(a, id, { priority: "kern" });
    await db.workspaces.bulkPut([a, b]);
    db.close();
    const again = new WorkshopDb(name);
    expect(await again.workspaces.get(a.id)).toEqual(a);
    expect((await again.workspaces.get(b.id))?.assignments).toHaveLength(0);
    await again.delete();
  });
});
