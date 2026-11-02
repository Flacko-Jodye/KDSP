import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  ChevronRight,
  ChevronDown,
  FileText,
  Layers,
} from "lucide-react";
import {
  catalog,
  elementMap,
  profileMap,
  priorities,
  setAssignment,
  type Priority,
} from "../../domain/workspace";
import type { PioElement } from "../../domain/catalog";
import { useWorkshop } from "../../storage/store";
import { Terminology } from "./Terminology";
import {
  Badge,
  Field,
  FilterBar,
  emptyFilters,
  filterElements,
} from "../../components/shared";
export function Details({
  id,
  onSelect,
}: {
  id: string;
  onSelect: (id: string) => void;
}) {
  const e = elementMap.get(id)!;
  const w = useWorkshop((s) => s.workspace)!;
  const edit = useWorkshop((s) => s.edit);
  const a = w.assignments.find((a) => a.elementId === id);
  const [technical, setTechnical] = useState(false);
  const refs = [
    ...new Set([
      ...e.references,
      ...e.children.flatMap((id) => elementMap.get(id)!.references),
    ]),
  ];
  return (
    <aside className="details" aria-label="Elementdetails">
      <div className="eyebrow">
        <FileText size={14} /> Original aus dem PIO
      </div>
      <h2>{e.label}</h2>
      <p>
        {e.description ||
          "Für diesen Eintrag liegt lokal kein eigener Beschreibungstext vor."}
      </p>
      {e.technicalLabel && (
        <p className="notice small">
          Technische Originalbezeichnung. Fachliche Quellzuordnung offen.
        </p>
      )}
      <p className="muted">
        {e.children.length} direkte Unterelemente ·{" "}
        {e.source.representation === "differential"
          ? "Differential"
          : "Snapshot"}
      </p>
      {refs.length > 0 && (
        <section>
          <h3>Verknüpfte Profile</h3>
          {refs.map((ref) => {
            const target = profileMap.get(ref.split("|")[0]);
            return target ? (
              <button
                className="reference"
                key={ref}
                onClick={() => onSelect(target.id)}
              >
                {target.description ?? target.label}
                <ArrowUpRight size={14} />
              </button>
            ) : (
              <p className="small break" key={ref}>
                Nicht lokal aufgelöst: {ref}
              </p>
            );
          })}
        </section>
      )}
      <details className="source">
        <summary>Quelle anzeigen</summary>
        <p className="break">{e.source.file}</p>
        <code>{e.source.elementId}</code>
        <p className="break">{e.source.canonical}</p>
        <p>
          Version {e.source.igVersion} · Titelbeleg: {e.source.labelElementId}
        </p>
        {import.meta.env.DEV && (
          <a
            target="_blank"
            rel="noreferrer"
            href={
              "/" + e.source.file.split("/").map(encodeURIComponent).join("/")
            }
          >
            Lokale Originaldatei öffnen ↗
          </a>
        )}
        <details>
          <summary>Originaler Elementbeleg (JSON)</summary>
          <pre>{JSON.stringify(e.original, null, 2)}</pre>
        </details>
      </details>
      <button className="text-button" onClick={() => setTechnical(!technical)}>
        {technical ? "Einfache Ansicht" : "Fachdetails einblenden"}
      </button>
      {technical && (
        <div className="technical">
          <Field label="Kardinalität im Differential">
            <output>{e.metadata.cardinality}</output>
          </Field>
          <p>{e.metadata.conformity ?? "MustSupport nicht lokal angegeben"}</p>
          <p>Typ: {e.metadata.type ?? "Nicht lokal angegeben"}</p>
          {e.metadata.notes.map((n) => (
            <p className="small" key={n}>
              {n}
            </p>
          ))}
          {e.metadata.terminology.map((url) => (
            <Terminology key={url} url={url} />
          ))}
        </div>
      )}
      <section className="decision">
        <div className="eyebrow">Deine Workshop-Entscheidung</div>
        <Field label="Priorität">
          <select
            value={a?.priority ?? "offen"}
            onChange={(ev) =>
              edit((w) =>
                setAssignment(w, id, { priority: ev.target.value as Priority }),
              )
            }
          >
            {Object.entries(priorities).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Themenbereich">
          <select
            value={a?.themeId ?? ""}
            onChange={(ev) =>
              edit((w) =>
                setAssignment(w, id, { themeId: ev.target.value || undefined }),
              )
            }
          >
            <option value="">Ohne Thema</option>
            {w.themes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Begründung">
          <textarea
            placeholder="Warum ist diese Information relevant?"
            value={a?.rationale ?? ""}
            onChange={(ev) =>
              edit((w) => setAssignment(w, id, { rationale: ev.target.value }))
            }
          />
        </Field>
        <p className="small muted">
          Gilt nur für diesen Eintrag. Unterelemente werden nicht mitbewertet.
          IG-Vorgaben bleiben unverändert.
        </p>
      </section>
    </aside>
  );
}
function TreeItem({
  e,
  selected,
  onSelect,
  depth = 0,
}: {
  e: PioElement;
  selected: string;
  onSelect: (id: string) => void;
  depth?: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div
        className={"tree-row " + (selected === e.id ? "selected" : "")}
        style={{ paddingLeft: depth * 12 }}
      >
        {e.children.length ? (
          <button
            aria-label={(open ? "Zuklappen: " : "Aufklappen: ") + e.label}
            onClick={() => setOpen(!open)}
          >
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span className="tree-spacer" />
        )}
        <button onClick={() => onSelect(e.id)} title={e.label}>
          {e.label}
        </button>
      </div>
      {open &&
        e.children.map((id) => (
          <TreeItem
            key={id}
            e={elementMap.get(id)!}
            selected={selected}
            onSelect={onSelect}
            depth={depth + 1}
          />
        ))}
    </div>
  );
}
export function Catalog({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (id: string) => void;
}) {
  const [filters, setFilters] = useState(emptyFilters);
  const [scope, setScope] = useState("");
  const [page, setPage] = useState(0);
  const w = useWorkshop((s) => s.workspace)!;
  const e = elementMap.get(selected);
  const sections = catalog.elements.filter((e) => e.kind === "section");
  const roots = catalog.elements.filter((e) => e.kind === "profile");
  const visible = useMemo(() => {
    let ids: Set<string> | undefined;
    if (scope) {
      ids = new Set();
      const visit = (id: string) => {
        ids!.add(id);
        elementMap.get(id)?.children.forEach(visit);
      };
      visit(scope);
    } else if (
      !filters.search &&
      !filters.priority &&
      !filters.theme &&
      !filters.used
    )
      ids = new Set(sections.map((e) => e.id));
    return filterElements(filters, ids);
  }, [filters, scope, w]);
  const crumbs: PioElement[] = [];
  let ancestor = e;
  while (ancestor) {
    crumbs.unshift(ancestor);
    ancestor = ancestor.parentId
      ? elementMap.get(ancestor.parentId)
      : undefined;
  }
  const choose = (id: string) => {
    onSelect(id);
    setScope(id);
    setPage(0);
  };
  return (
    <div className="catalog-layout">
      <aside className="tree-panel">
        <div className="eyebrow">PIO Überleitungsbogen</div>
        <h3>Informationen entdecken</h3>
        <button
          className={"tree-home " + (!scope ? "active" : "")}
          onClick={() => {
            setScope("");
            setPage(0);
          }}
        >
          Alle PIO-Abschnitte <span>{sections.length}</span>
        </button>
        <div className="tree-list">
          {sections.map((s) => (
            <TreeItem key={s.id} e={s} selected={selected} onSelect={choose} />
          ))}
          <details>
            <summary>Alle {roots.length} Profile · technische Ansicht</summary>
            {roots.map((r) => (
              <TreeItem
                key={r.id}
                e={r}
                selected={selected}
                onSelect={choose}
              />
            ))}
          </details>
        </div>
        <p className="small muted">
          Vereinfachte Erklärung: Abschnitte sind der Einstieg. Unterelemente
          zeigen die lokal belegte Profilstruktur.
        </p>
      </aside>
      <section className="catalog-main">
        <div className="section-title">
          <div>
            <div className="eyebrow">01 / PIO entdecken</div>
            <h1>Welche Informationen zählen?</h1>
            <p className="muted">
              Erkunde den Überleitungsbogen und halte deine Einschätzung fest.
            </p>
          </div>
          <span className="version">PIO {catalog.igVersion}</span>
        </div>
        <div className="notice">
          <strong>Transparent zur Quelle.</strong> Ein separates fachliches
          Informationsmodell fehlt lokal. Unterhalb der Originalabschnitte
          siehst du technische Differentials; vererbte Vorgaben sind nicht
          aufgelöst.
        </div>
        <FilterBar
          value={filters}
          onChange={(f) => {
            setFilters(f);
            setPage(0);
          }}
        />
        <div className="breadcrumbs">
          <button onClick={() => setScope("")}>Abschnitte</button>
          {scope &&
            crumbs.map((c) => (
              <span key={c.id}>
                {" "}
                / <button onClick={() => choose(c.id)}>{c.label}</button>
              </span>
            ))}
        </div>
        <div className="list-heading">
          <span>
            {visible.length} Einträge{" "}
            {scope
              ? "in dieser Auswahl"
              : filters.search
                ? "gefunden"
                : "im Überblick"}
          </span>
          <span>Original aus dem PIO</span>
        </div>
        <div className="catalog-cards">
          {visible.slice(page * 40, (page + 1) * 40).map((item) => (
            <button
              className={
                "catalog-card " + (selected === item.id ? "active" : "")
              }
              key={item.id}
              onClick={() => onSelect(item.id)}
            >
              <div className="card-icon">
                <Layers size={19} />
              </div>
              <div>
                <h3>{item.label}</h3>
                <p>
                  {item.description ??
                    (item.kind === "section"
                      ? "Originalabschnitt des Überleitungsbogens"
                      : item.source.elementId)}
                </p>
                <span className="small muted">
                  {item.children.length} Unterelemente ·{" "}
                  {item.kind === "section"
                    ? "Abschnitt"
                    : item.kind === "profile"
                      ? "Profil"
                      : "Technisches Element"}
                </span>
              </div>
              <div className="card-right">
                <Badge
                  priority={
                    w.assignments.find((a) => a.elementId === item.id)
                      ?.priority ?? "offen"
                  }
                />
                <ChevronRight size={18} />
              </div>
            </button>
          ))}
        </div>
        {!visible.length && (
          <p className="empty">
            Keine passenden Informationen. Passe die Suche oder Filter an.
          </p>
        )}
        <div className="pagination">
          <button disabled={!page} onClick={() => setPage(page - 1)}>
            Zurück
          </button>
          <span>
            Seite {page + 1} / {Math.max(1, Math.ceil(visible.length / 40))}
          </span>
          <button
            disabled={(page + 1) * 40 >= visible.length}
            onClick={() => setPage(page + 1)}
          >
            Weiter
          </button>
        </div>
      </section>
      {e && <Details id={selected} onSelect={choose} />}
    </div>
  );
}
