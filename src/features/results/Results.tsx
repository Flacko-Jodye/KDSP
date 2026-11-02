import { Download, Printer, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import {
  catalog,
  priorities,
  resultRows,
  exportCsv,
  exportJson,
} from "../../domain/workspace";
import { useWorkshop } from "../../storage/store";
import { download, Empty, Modal } from "../../components/shared";
import { Details } from "../catalog/Catalog";
export function Results() {
  const w = useWorkshop((s) => s.workspace)!;
  const rows = resultRows(w);
  const [detail, setDetail] = useState("");
  const counts = Object.fromEntries(
    Object.keys(priorities).map((p) => [
      p,
      p === "offen"
        ? catalog.elements.length -
          w.assignments.filter((a) => a.priority !== "offen").length
        : w.assignments.filter((a) => a.priority === p).length,
    ]),
  );
  return (
    <div className="module results">
      <div className="section-title">
        <div>
          <div className="eyebrow">04 / Ergebnisse</div>
          <h1>Aus Einschätzungen wird ein Bild.</h1>
          <p className="muted">
            {w.name} · Individueller Arbeitsstand · PIO {w.sourceIgVersion}
          </p>
        </div>
        <div className="row no-print">
          <button onClick={() => window.print()}>
            <Printer size={16} /> Drucken
          </button>
          <button
            onClick={() =>
              download(
                exportCsv(w),
                "pflege-workshop.csv",
                "text/csv;charset=utf-8",
              )
            }
          >
            <Download size={16} /> CSV
          </button>
          <button
            className="primary"
            onClick={() =>
              download(
                exportJson(w),
                "pflege-workshop.json",
                "application/json",
              )
            }
          >
            <Download size={16} /> JSON-Backup
          </button>
        </div>
      </div>
      <div className="stats-grid">
        {Object.entries(priorities).map(([k, v]) => (
          <div className={"stat " + k} key={k}>
            <span>{v}</span>
            <strong>{counts[k].toLocaleString("de")}</strong>
            <div className="stat-bar">
              <i
                style={{
                  width:
                    Math.max(
                      counts[k] ? 2 : 0,
                      (100 * counts[k]) / catalog.elements.length,
                    ) + "%",
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="result-summary">
        <span>
          <strong>{w.assignments.filter((a) => a.themeId).length}</strong>{" "}
          thematisch zugeordnet
        </span>
        <span>
          <strong>{w.workflows.length}</strong> Abläufe
        </span>
        <span>
          <strong>{w.workflows.reduce((n, f) => n + f.steps.length, 0)}</strong>{" "}
          Schritte
        </span>
        <span>
          <strong>
            {w.workflows.reduce(
              (n, f) =>
                n + f.steps.reduce((m, s) => m + s.information.length, 0),
              0,
            )}
          </strong>{" "}
          Informationszuordnungen
        </span>
        <span>
          <strong>{catalog.elements.length}</strong> Katalogeinträge
        </span>
      </div>
      <div className="notice">
        Diese Auswertung enthält persönliche Workshop-Entscheidungen. „Kern“ ist
        keine Konformitätsaussage zum ursprünglichen PIO. Technische Einträge
        und Gruppen werden einzeln gezählt.
      </div>
      <h2>Bewertungen & Prozessbezüge</h2>
      <p className="muted">
        Eine Zeile je Information und Prozessverwendung; Bewertungen ohne
        Prozess bleiben ebenfalls enthalten.
      </p>
      {rows.length ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>PIO-Information</th>
                <th>Thema / Priorität</th>
                <th>Begründung</th>
                <th>Ablauf / Schritt</th>
                <th>Akteure / Verwendung</th>
                <th>Quelle</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>
                    <button
                      className="text-button"
                      onClick={() => setDetail(r.id)}
                    >
                      {r.label}
                      <ArrowUpRight size={13} />
                    </button>
                    <code className="export-id">{r.id}</code>
                  </td>
                  <td>
                    {r.theme || "Ohne Thema"}
                    <br />
                    <strong>{r.priority}</strong>
                  </td>
                  <td>{r.rationale || "—"}</td>
                  <td>
                    {r.workflow || "—"}
                    <br />
                    {r.step}
                  </td>
                  <td>
                    {r.actors || "—"}
                    <br />
                    {r.usage}
                    {r.notes && <p>{r.notes}</p>}
                  </td>
                  <td className="source-cell">{r.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>
          Noch keine Bewertungen oder Prozesszuordnungen. Beginne unter „PIO
          entdecken“ oder „Themen ordnen“.
        </Empty>
      )}
      <section className="print-processes">
        <h2>Abläufe im Arbeitsstand</h2>
        {w.workflows.map((f) => (
          <article key={f.id}>
            <h3>{f.name}</h3>
            <p>{f.description}</p>
            {f.steps.map((s) => (
              <div key={s.id}>
                <strong>{s.title}</strong> · {s.kind}
                <p>{s.description}</p>
                <p>
                  {s.actorIds
                    .map((id) => w.actors.find((a) => a.id === id)?.name)
                    .join(", ")}
                </p>
              </div>
            ))}
            {f.connections.map((c) => (
              <p key={c.id}>
                {f.steps.find((s) => s.id === c.source)?.title} →{" "}
                {f.steps.find((s) => s.id === c.target)?.title}{" "}
                {c.label && "· " + c.label}
              </p>
            ))}
          </article>
        ))}
      </section>
      <p className="small muted">
        JSON ist das vollständige Austauschformat einschließlich Positionen und
        Verbindungen. Browserdaten können gelöscht werden: Bewahre regelmäßig
        ein JSON-Backup auf.
      </p>
      {detail && (
        <Modal title="Quellbeleg" onClose={() => setDetail("")}>
          <Details id={detail} onSelect={setDetail} />
        </Modal>
      )}
    </div>
  );
}
