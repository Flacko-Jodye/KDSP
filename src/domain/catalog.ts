export interface PioElement {
  id: string;
  parentId?: string;
  label: string;
  description?: string;
  sortOrder: number;
  kind: "section" | "profile" | "element";
  children: string[];
  technicalLabel: boolean;
  source: {
    igVersion: string;
    file: string;
    elementId: string;
    canonical: string;
    fhirPath: string;
    labelElementId: string;
    representation: string;
  };
  references: string[];
  metadata: {
    cardinality: string;
    conformity?: string;
    type?: string;
    terminology: string[];
    notes: string[];
  };
  original: Record<string, unknown>;
}
