import { useState, type ReactNode } from "react";
import { DragDropProvider, useDraggable, useDroppable } from "@dnd-kit/react";
import {
  GripVertical,
  Plus,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  catalog,
  elementMap,
  priorities,
  setAssignment,
  removeTheme,
  uid,
  type Priority,
} from "../../domain/workspace";
import { useWorkshop } from "../../storage/store";
import {
  Badge,
  FilterBar,
  emptyFilters,
  filterElements,
  Field,
  Modal,
  Empty,
} from "../../components/shared";
import { Details } from "../catalog/Catalog";
function DragCard({
  id,
  prefix,
  onSelect,
  children,
  column,
}: {
  id: string;
  prefix: string;
  onSelect: (id: string) => void;
  children?: ReactNode;
  column?: string;
}) {
  const { ref, handleRef, isDragging } = useDraggable({
    id: prefix + id,
    data: { elementId: id },
  });
  const drop = useDroppable({
    id: "before-" + prefix + id,
    disabled: !column,
    data: { column, beforeId: id },
  });
  return (
    <div
      ref={(node) => {
        ref(node);
        drop.ref(node);
      }}
      className={"board-card " + (isDragging ? "dragging" : "")}
    >
      <div className="row">
        <button
          ref={handleRef}
          className="drag-handle"
          aria-label={"Ziehen: " + elementMap.get(id)!.label}
        >
          <GripVertical size={17} />
        </button>
        <button className="card-label" onClick={() => onSelect(id)}>
          {elementMap.get(id)!.label}
        </button>
      </div>
      {children}
    </div>
  );
}
function DropColumn({
  id,
  title,
  count,
  children,
  actions,
}: {
  id: string;
  title: string;
  count: number;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const { ref, isDropTarget } = useDroppable({ id, data: { column: id } });
  return (
    <section
      ref={ref}
      data-testid={"drop-" + id}
      className={"board-column " + (isDropTarget ? "drop-active" : "")}
    >
      <div className="column-title">
        <h3>{title}</h3>
        <span>{count}</span>
      </div>
      {actions}
      <div className="column-cards">{children}</div>
      <div className="drop-hint">Information hier ablegen</div>
    </section>
  );
}
export function Boards() {
  const w = useWorkshop((s) => s.workspace)!;
  const edit = useWorkshop((s) => s.edit);
  const [mode, setMode] = useState<"themes" | "priority">("themes");
  const [filters, setFilters] = useState(emptyFilters);
  const [selected, setSelected] = useState("");
  const [themeDialog, setThemeDialog] = useState<{
    id: string;
    name: string;
    description: string;
  } | null>(null);
  const [limit, setLimit] = useState(30);
  const all = filterElements(filters);
  const paletteItems =
    !filters.search && !filters.priority && !filters.theme && !filters.used
      ? all.filter((e) => e.kind === "section")
      : all;
  const palette = paletteItems.slice(0, limit);
  const filteredIds = new Set(all.map((e) => e.id));
  const move = (id: string, column: string, beforeId?: string) =>
    edit((w) => {
      if (id === beforeId) return;
      setAssignment(
        w,
        id,
        mode === "themes"
          ? { themeId: column === "none" ? undefined : column }
          : { priority: column as Priority },
      );
      const items = w.assignments
        .filter(
          (a) =>
            a.elementId !== id &&
            (mode === "themes"
              ? (a.themeId ?? "none") === column
              : a.priority === column),
        )
        .sort((a, b) => a.sortOrder - b.sortOrder);
      const a = w.assignments.find((a) => a.elementId === id)!;
      const index = items.findIndex((a) => a.elementId === beforeId);
      items.splice(index < 0 ? items.length : index, 0, a);
      items.forEach((a, i) => (a.sortOrder = i));
    });
  const columns =
    mode === "themes"
      ? [
          { id: "none", name: "Ohne Thema" },
          ...[...w.themes].sort((a, b) => a.sortOrder - b.sortOrder),
        ]
      : Object.entries(priorities).map(([id, name]) => ({ id, name }));
  const reorder = (id: string, delta: number, column: string) =>
    edit((w) => {
      const items = w.assignments
        .filter((a) =>
          mode === "themes"
            ? (a.themeId ?? "none") === column
            : a.priority === column,
        )
        .sort((a, b) => a.sortOrder - b.sortOrder);
      const i = items.findIndex((a) => a.elementId === id);
      const j = i + delta;
      if (j < 0 || j >= items.length) return;
      [items[i], items[j]] = [items[j], items[i]];
      items.forEach((a, n) => (a.sortOrder = n));
    });
  return (
    <div className="module">
      <div className="section-title">
        <div>
          <div className="eyebrow">02 / Themen ordnen</div>
          <h1>Deine Perspektive auf die Pflege.</h1>
          <p className="muted">
            Ordne Informationen eigenen Themen zu und entscheide unabhängig über
            ihre Priorität.
          </p>
        </div>
        <button
          className="primary"
          onClick={() => setThemeDialog({ id: "", name: "", description: "" })}
        >
          <Plus size={17} /> Thema anlegen
        </button>
      </div>
      <div className="row toolbar">
        <div className="segmented">
          <button
            className={mode === "themes" ? "active" : ""}
            onClick={() => setMode("themes")}
          >
            Themenbereiche
          </button>
          <button
            className={mode === "priority" ? "active" : ""}
            onClick={() => setMode("priority")}
          >
            Priorisierung
          </button>
        </div>
        <span className="small muted">
          Bewertungen gelten nur für den gewählten Eintrag, nie automatisch für
          Unterelemente.
        </span>
      </div>
      <DragDropProvider
        onDragEnd={(event) => {
          if (event.canceled) return;
          const id = event.operation.source?.data.elementId;
          const col = event.operation.target?.data.column;
          if (typeof id === "string" && typeof col === "string")
            move(
              id,
              col,
              typeof event.operation.target?.data.beforeId === "string"
                ? event.operation.target.data.beforeId
                : undefined,
            );
        }}
      >
        <div className="board-layout">
          <aside className="palette">
            <h3>
              PIO-Palette <span className="muted">↗</span>
            </h3>
            <p className="small muted">
              Ziehen oder per Auswahl zuordnen. Informationen bleiben im
              Katalog.
            </p>
            <FilterBar
              value={filters}
              onChange={(f) => {
                setFilters(f);
                setLimit(30);
              }}
              compact
            />
            {palette.map((e) => (
              <DragCard
                key={e.id}
                id={e.id}
                prefix="palette-"
                onSelect={setSelected}
              >
                <select
                  aria-label={"Zuordnen: " + e.label}
                  value=""
                  onChange={(ev) => {
                    if (ev.target.value) move(e.id, ev.target.value);
                  }}
                >
                  <option value="">
                    {mode === "themes"
                      ? "Thema wählen …"
                      : "Priorität wählen …"}
                  </option>
                  {columns.map((c) => (
                    <option value={c.id} key={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </DragCard>
            ))}
            {paletteItems.length > limit && (
              <button onClick={() => setLimit(limit + 30)}>
                Weitere Einträge laden
              </button>
            )}
          </aside>
          <div className="board-columns">
            {columns.map((col) => {
              const items = w.assignments
                .filter(
                  (a) =>
                    filteredIds.has(a.elementId) &&
                    (mode === "themes"
                      ? (a.themeId ?? "none") === col.id
                      : a.priority === col.id),
                )
                .sort((a, b) => a.sortOrder - b.sortOrder);
              return (
                <DropColumn
                  key={col.id}
                  id={col.id}
                  title={col.name}
                  count={items.length}
                  actions={
                    mode === "themes" && col.id !== "none" ? (
                      <div className="column-actions">
                        <button
                          aria-label={"Thema bearbeiten: " + col.name}
                          onClick={() => {
                            const t = w.themes.find((t) => t.id === col.id)!;
                            setThemeDialog({
                              id: t.id,
                              name: t.name,
                              description: t.description ?? "",
                            });
                          }}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          aria-label={"Thema nach links: " + col.name}
                          onClick={() =>
                            edit((w) => {
                              const ts = w.themes.sort(
                                (a, b) => a.sortOrder - b.sortOrder,
                              );
                              const i = ts.findIndex((t) => t.id === col.id);
                              if (i > 0)
                                [ts[i - 1], ts[i]] = [ts[i], ts[i - 1]];
                              ts.forEach((t, i) => (t.sortOrder = i));
                            })
                          }
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          aria-label={"Thema nach rechts: " + col.name}
                          onClick={() =>
                            edit((w) => {
                              const ts = w.themes.sort(
                                (a, b) => a.sortOrder - b.sortOrder,
                              );
                              const i = ts.findIndex((t) => t.id === col.id);
                              if (i < ts.length - 1)
                                [ts[i + 1], ts[i]] = [ts[i], ts[i + 1]];
                              ts.forEach((t, i) => (t.sortOrder = i));
                            })
                          }
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          aria-label={"Thema löschen: " + col.name}
                          onClick={() => {
                            if (
                              confirm(
                                "Thema löschen? Zugeordnete Informationen bleiben mit ihrer Priorität erhalten und werden „Ohne Thema“ zugeordnet.",
                              )
                            )
                              edit((w) => removeTheme(w, col.id));
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : undefined
                  }
                >
                  {mode === "themes" &&
                    w.themes.find((t) => t.id === col.id)?.description && (
                      <p className="small">
                        {w.themes.find((t) => t.id === col.id)?.description}
                      </p>
                    )}
                  {items.map((a) => (
                    <DragCard
                      key={a.elementId}
                      id={a.elementId}
                      prefix="assigned-"
                      column={col.id}
                      onSelect={setSelected}
                    >
                      <Badge priority={a.priority} />
                      {a.rationale && <p className="small">{a.rationale}</p>}
                      <div className="row">
                        <select
                          aria-label={
                            "Verschieben: " + elementMap.get(a.elementId)!.label
                          }
                          value={col.id}
                          onChange={(e) => move(a.elementId, e.target.value)}
                        >
                          {columns.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <button
                          aria-label="Karte nach oben"
                          onClick={() => reorder(a.elementId, -1, col.id)}
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          aria-label="Karte nach unten"
                          onClick={() => reorder(a.elementId, 1, col.id)}
                        >
                          <ArrowDown size={14} />
                        </button>
                      </div>
                    </DragCard>
                  ))}
                  {!items.length && <Empty>Noch keine Auswahl</Empty>}
                </DropColumn>
              );
            })}
            {mode === "themes" && w.themes.length === 0 && (
              <div className="board-welcome">
                <h2>Raum für deine Themen.</h2>
                <p>
                  Lege einen eigenen Themenbereich an. Die PIO-Palette links
                  bleibt dein gemeinsamer Ausgangspunkt.
                </p>
                <button
                  onClick={() =>
                    setThemeDialog({ id: "", name: "", description: "" })
                  }
                >
                  Erstes Thema anlegen
                </button>
              </div>
            )}
          </div>
        </div>
      </DragDropProvider>
      <p className="small muted">
        Das Board zeigt bewusst hinzugefügte Informationen.{" "}
        {catalog.elements.length - w.assignments.length} weitere Katalogeinträge
        sind noch offen und über die Palette erreichbar.
      </p>
      {themeDialog && (
        <Modal
          title={themeDialog.id ? "Thema bearbeiten" : "Neues Thema"}
          onClose={() => setThemeDialog(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              edit((w) => {
                const old = w.themes.find((t) => t.id === themeDialog.id);
                if (old)
                  Object.assign(old, {
                    name: themeDialog.name.trim(),
                    description: themeDialog.description,
                  });
                else
                  w.themes.push({
                    id: uid(),
                    name: themeDialog.name.trim(),
                    description: themeDialog.description,
                    sortOrder: w.themes.length,
                  });
              });
              setThemeDialog(null);
            }}
          >
            <Field label="Name des Themenbereichs">
              <input
                required
                autoFocus
                value={themeDialog.name}
                onChange={(e) =>
                  setThemeDialog({ ...themeDialog, name: e.target.value })
                }
              />
            </Field>
            <Field label="Beschreibung">
              <textarea
                value={themeDialog.description}
                onChange={(e) =>
                  setThemeDialog({
                    ...themeDialog,
                    description: e.target.value,
                  })
                }
              />
            </Field>
            <button className="primary" disabled={!themeDialog.name.trim()}>
              Thema speichern
            </button>
          </form>
        </Modal>
      )}
      {selected && (
        <Modal title="Information bewerten" onClose={() => setSelected("")}>
          <Details id={selected} onSelect={setSelected} />
        </Modal>
      )}
    </div>
  );
}
