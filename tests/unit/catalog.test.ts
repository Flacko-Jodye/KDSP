import { describe, it, expect } from "vitest";
import { discover } from "../../scripts/ig/discover";
import { extract } from "../../scripts/ig/extract";
import { validate } from "../../scripts/ig/validate";
import { catalog, elementMap } from "../../src/domain/workspace";
describe("Originalkatalog", () => {
  it("deckt jedes Originalelement genau einmal ab und ist zyklenfrei", async () => {
    const sources = await discover("PIO_Überleitungsbogen");
    const result = extract(sources);
    expect(result.elements.length).toBe(
      sources.reduce(
        (sum, s) =>
          sum +
          (s.resource.snapshot?.element.length ??
            s.resource.differential?.element.length ??
            0),
        0,
      ),
    );
    expect(validate(result.elements)).toEqual(catalog.stats);
    expect(result.elements).toEqual(catalog.elements);
  });
  it("belegt Titel, Profilverweis, fehlende Kardinalität und Slice", () => {
    const section = catalog.elements.find(
      (e) => e.source.elementId === "Composition.section:pflegegrad",
    )!;
    expect(section.label).toBe("Pflegegrad");
    expect(section.metadata.cardinality).toBe("1..1");
    const entry = elementMap.get(section.id + ".entry")!;
    expect(entry.references[0]).toContain("Observation_Care_Level|1.0.0");
    expect(
      catalog.elements.some((e) => e.metadata.cardinality.includes("?")),
    ).toBe(true);
    expect(
      catalog.elements.some((e) => e.source.elementId.includes("value[x]:")),
    ).toBe(true);
    expect(catalog.elements.some((e) => e.metadata.terminology.length)).toBe(
      true,
    );
  });
});
