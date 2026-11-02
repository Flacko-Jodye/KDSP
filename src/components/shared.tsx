import {
  useEffect,
  useRef,
  useId,
  cloneElement,
  isValidElement,
  type ReactNode,
  type ReactElement,
} from "react";
import { X, Search } from "lucide-react";
import {
  catalog,
  elementMap,
  priorities,
  type Priority,
} from "../domain/workspace";
import { useWorkshop } from "../storage/store";
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      className="modal"
      aria-labelledby={titleId}
    >
      <div className="modal-head">
        <h2 id={titleId}>{title}</h2>
        <button aria-label="Schließen" onClick={onClose}>
          <X size={18} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      {isValidElement(children)
        ? cloneElement(children as ReactElement<Record<string, unknown>>, {
            id,
            "aria-label": label,
          })
        : children}
    </label>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}
export function download(content: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export interface Filters {
  search: string;
  priority: string;
  theme: string;
  used: boolean;
}
export const emptyFilters: Filters = {
  search: "",
  priority: "",
  theme: "",
  used: false,
};
export function filterElements(filters: Filters, ids?: Set<string>) {
  const w = useWorkshop.getState().workspace;
  const assignments = new Map(w?.assignments.map((a) => [a.elementId, a]));
  const used = new Set(
    w?.workflows.flatMap((f) =>
      f.steps.flatMap((s) => s.information.map((i) => i.elementId)),
    ),
  );
  const q = filters.search.toLocaleLowerCase("de");
  return catalog.elements.filter(
    (e) =>
      (!ids || ids.has(e.id)) &&
      (!q ||
        [e.label, e.description, e.source.elementId, e.source.canonical]
          .join(" ")
          .toLocaleLowerCase("de")
          .includes(q)) &&
      (!filters.priority ||
        (assignments.get(e.id)?.priority ?? "offen") === filters.priority) &&
      (!filters.theme || assignments.get(e.id)?.themeId === filters.theme) &&
      (!filters.used || used.has(e.id)),
  );
}
export function FilterBar({
  value,
  onChange,
  compact = false,
}: {
  value: Filters;
  onChange: (v: Filters) => void;
  compact?: boolean;
}) {
  const themes = useWorkshop((s) => s.workspace?.themes ?? []);
  return (
    <div className={"filters " + (compact ? "compact" : "")}>
      <label className="search">
        <Search size={18} />
        <input
          aria-label="PIO durchsuchen"
          placeholder="Pflegeinformationen durchsuchen …"
          value={value.search}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
        />
      </label>
      <select
        aria-label="Nach Priorität filtern"
        value={value.priority}
        onChange={(e) => onChange({ ...value, priority: e.target.value })}
      >
        <option value="">Alle Prioritäten</option>
        {Object.entries(priorities).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
      <select
        aria-label="Nach Thema filtern"
        value={value.theme}
        onChange={(e) => onChange({ ...value, theme: e.target.value })}
      >
        <option value="">Alle Themen</option>
        {themes.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <label className="check">
        <input
          type="checkbox"
          checked={value.used}
          onChange={(e) => onChange({ ...value, used: e.target.checked })}
        />{" "}
        Im Ablauf verwendet
      </label>
    </div>
  );
}
export function Badge({ priority }: { priority: Priority }) {
  return <span className={"badge " + priority}>{priorities[priority]}</span>;
}
export function ElementName({ id }: { id: string }) {
  return <>{elementMap.get(id)?.label ?? id}</>;
}
