import { useEffect, useState, useRef } from "react";
import {
  BookOpen,
  Layers,
  GitBranch,
  ChartNoAxesCombined,
  ShieldCheck,
  ChevronDown,
  Plus,
  Copy,
  Trash2,
  Upload,
  Download,
  HelpCircle,
  X,
  Check,
} from "lucide-react";
import { useWorkshop } from "../storage/store";
import { catalog, importJson, exportJson } from "../domain/workspace";
import { Catalog } from "../features/catalog/Catalog";
import { Boards } from "../features/themes/Boards";
import { Workflows } from "../features/workflows/Workflows";
import { Results } from "../features/results/Results";
import { Modal, Field, download } from "../components/shared";
const tabs = [
  { name: "PIO entdecken", icon: BookOpen },
  { name: "Themen ordnen", icon: Layers },
  { name: "Abläufe gestalten", icon: GitBranch },
  { name: "Ergebnisse", icon: ChartNoAxesCombined },
];
export function App() {
  const store = useWorkshop();
  const [tab, setTab] = useState(0);
  const [selected, setSelected] = useState(
    catalog.elements.find((e) => e.kind === "section")!.id,
  );
  const [manage, setManage] = useState(false);
  const [newName, setNewName] = useState("");
  const [help, setHelp] = useState(
    () => localStorage.getItem("pflege-help-dismissed") !== "yes",
  );
  const [message, setMessage] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    void useWorkshop.getState().initialize();
    const save = () => {
      void useWorkshop
        .getState()
        .flush()
        .catch(() => {});
    };
    const visibility = () => {
      if (document.visibilityState === "hidden") save();
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", save);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", save);
    };
  }, []);
  const action = (fn: () => Promise<void>) => {
    void fn().catch((e) =>
      setMessage(String(e instanceof Error ? e.message : e)),
    );
  };
  if (!store.workspace)
    return <div className="loading">Pflegeinformationen werden geladen …</div>;
  const w = store.workspace;
  return (
    <>
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark">
            p<span>↗</span>
          </div>
          <div>
            <strong>Pflegedaten im Dialog</strong>
            <span>WERKSTATT · KERNDATENSATZ PFLEGE</span>
          </div>
        </div>
        <div className="header-tools">
          <span
            className={
              "save-status " +
              (store.status === "Nicht gespeichert" ? "error" : "")
            }
            role="status"
          >
            <Check size={14} />
            {store.status}
          </span>
          <button className="workspace-button" onClick={() => setManage(true)}>
            {w.name}
            <ChevronDown size={16} />
          </button>
          <button aria-label="Hilfe öffnen" onClick={() => setHelp(!help)}>
            <HelpCircle size={18} />
          </button>
        </div>
      </header>
      <nav className="main-nav" aria-label="Arbeitsbereiche">
        <div>
          {tabs.map((t, i) => (
            <button
              key={t.name}
              className={tab === i ? "active" : ""}
              aria-current={tab === i ? "page" : undefined}
              onClick={() => setTab(i)}
            >
              <t.icon size={17} />
              <span>{t.name}</span>
              <small>0{i + 1}</small>
            </button>
          ))}
        </div>
        <span className="local-label">
          <ShieldCheck size={15} /> Nur auf diesem Gerät
        </span>
      </nav>
      {store.error && (
        <div className="error-banner" role="alert">
          {store.error}
        </div>
      )}
      {message && (
        <div className="error-banner" role="alert">
          {message}
          <button onClick={() => setMessage("")}>Schließen</button>
        </div>
      )}
      {help && (
        <section className="onboarding">
          <div>
            <span className="eyebrow">Willkommen in deinem Workshop</span>
            <h2>Gemeinsam denken. Eigenständig erarbeiten.</h2>
            <p>
              1. PIO erkunden · 2. Eigene Themen und Prioritäten setzen · 3.
              Versorgungsabläufe beschreiben · 4. Ergebnisse sichern.
            </p>
            <span className="small">
              Keine Patienten- oder Falldaten eintragen. Alles bleibt in diesem
              Browser; keine Übertragung an externe Server.
            </span>
          </div>
          <button
            aria-label="Einführung schließen"
            onClick={() => {
              setHelp(false);
              localStorage.setItem("pflege-help-dismissed", "yes");
            }}
          >
            <X size={18} />
          </button>
        </section>
      )}
      <main key={w.id}>
        {tab === 0 ? (
          <Catalog selected={selected} onSelect={setSelected} />
        ) : tab === 1 ? (
          <Boards />
        ) : tab === 2 ? (
          <Workflows />
        ) : (
          <Results />
        )}
      </main>
      <footer className="app-footer">
        <span>
          PIO-Original {catalog.igVersion} · FHIR{" "}
          {catalog.fhirVersions.join(", ")} · {catalog.stats.sections}{" "}
          Abschnitte
        </span>
        <span>
          Deine Entscheidungen ergänzen den PIO. Sie verändern ihn nicht.
        </span>
      </footer>
      <input
        ref={input}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          action(async () => {
            if (file.size > 25 * 1024 * 1024)
              throw new Error(
                "Die Datei ist größer als 25 MB. Bitte einen Workshop-JSON-Export verwenden.",
              );
            const imported = importJson(await file.text());
            await store.importWorkspace(imported);
            setManage(false);
            setMessage(
              "Import erfolgreich. Ein separater Arbeitsstand wurde angelegt.",
            );
          });
          e.target.value = "";
        }}
      />
      {manage && (
        <Modal title="Lokale Arbeitsstände" onClose={() => setManage(false)}>
          <p className="muted">
            Jeder Arbeitsstand bleibt unabhängig. Browserdaten können gelöscht
            werden; JSON dient als Backup.
          </p>
          <Field label="Aktuellen Arbeitsstand benennen">
            <input
              value={w.name}
              onChange={(e) =>
                store.edit((w) => {
                  w.name = e.target.value;
                })
              }
            />
          </Field>
          <Field label="Arbeitsstand öffnen">
            <select
              value={w.id}
              onChange={(e) => action(() => store.open(e.target.value))}
            >
              {store.list.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="row">
            <button onClick={() => action(() => store.duplicate())}>
              <Copy size={15} /> Duplizieren
            </button>
            <button
              onClick={() => {
                if (
                  confirm(
                    "Aktuellen Arbeitsstand endgültig aus diesem Browser löschen? Ein JSON-Backup bleibt erhalten, falls du eines exportiert hast.",
                  )
                )
                  action(() => store.remove());
              }}
            >
              <Trash2 size={15} /> Löschen
            </button>
          </div>
          <form
            className="workspace-new"
            onSubmit={(e) => {
              e.preventDefault();
              action(async () => {
                await store.create(newName.trim());
                setNewName("");
              });
            }}
          >
            <Field label="Neuer Arbeitsstand">
              <input
                placeholder="Arbeitstitel"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </Field>
            <button disabled={!newName.trim()}>
              <Plus size={15} /> Neu anlegen
            </button>
          </form>
          <div className="row">
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
              <Download size={15} /> JSON exportieren
            </button>
            <button onClick={() => input.current?.click()}>
              <Upload size={15} /> JSON importieren
            </button>
          </div>
          <p className="small muted">
            Dateien mit abweichender IG-Version oder unbekannten IDs werden
            erklärt abgelehnt. Ein Import überschreibt niemals einen bestehenden
            Arbeitsstand.
          </p>
        </Modal>
      )}
    </>
  );
}
