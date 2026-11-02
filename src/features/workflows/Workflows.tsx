import { useState, useMemo, createContext, useContext } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  MarkerType,
  useReactFlow,
  type NodeProps,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Plus, Copy, Trash2, Users, GitBranch } from "lucide-react";
import {
  catalog,
  elementMap,
  uid,
  addInformation,
  removeStep,
  usages,
  type ProcessStep,
  type Workflow,
} from "../../domain/workspace";
import { useWorkshop } from "../../storage/store";
import {
  Modal,
  Field,
  Empty,
  FilterBar,
  emptyFilters,
  filterElements,
} from "../../components/shared";
import { Details } from "../catalog/Catalog";
const kinds = {
  start: "Start",
  aktion: "Aktivität",
  entscheidung: "Entscheidung",
  ende: "Ende",
} as const;
const DropContext = createContext<(step: string, element: string) => void>(
  () => {},
);
type StepNode = Node<{ step: ProcessStep; actors: string[] }, "step">;
function StepCard({ data, selected }: NodeProps<StepNode>) {
  const onDrop = useContext(DropContext);
  const [over, setOver] = useState(false);
  return (
    <div
      data-testid={"step-" + data.step.id}
      className={
        "step-node " +
        data.step.kind +
        (selected ? " selected" : "") +
        (over ? " drop-active" : "")
      }
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("application/pio-element")) {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
          setOver(true);
        }
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        if (!e.dataTransfer.types.includes("application/pio-element")) return;
        e.preventDefault();
        e.stopPropagation();
        setOver(false);
        const id = e.dataTransfer.getData("application/pio-element");
        if (elementMap.has(id)) onDrop(data.step.id, id);
      }}
    >
      <Handle type="target" position={Position.Left} />
      <div className="eyebrow">{kinds[data.step.kind]}</div>
      <strong>{data.step.title}</strong>
      {data.actors.length > 0 && (
        <p className="small">
          <Users size={12} /> {data.actors.join(", ")}
        </p>
      )}
      <div className="step-badges">
        {data.step.information.map((i) => (
          <span key={i.elementId}>
            {usages[i.usage]} · {elementMap.get(i.elementId)?.label}
          </span>
        ))}
      </div>
      <p className="small muted">
        {data.step.information.length
          ? data.step.information.length + " Informationen"
          : "Information hier ablegen"}
      </p>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
const nodeTypes = { step: StepCard };
export function Workflows() {
  return (
    <ReactFlowProvider>
      <WorkflowEditor />
    </ReactFlowProvider>
  );
}
function WorkflowEditor() {
  const w = useWorkshop((s) => s.workspace)!;
  const edit = useWorkshop((s) => s.edit);
  const [flowId, setFlowId] = useState(w.workflows[0]?.id ?? "");
  const flow = w.workflows.find((f) => f.id === flowId) ?? w.workflows[0];
  const [selected, setSelected] = useState("");
  const [measured, setMeasured] = useState<
    Record<string, { width: number; height: number }>
  >({});
  const [filters, setFilters] = useState(emptyFilters);
  const [limit, setLimit] = useState(30);
  const [notice, setNotice] = useState("");
  const [showActors, setShowActors] = useState(false);
  const [picker, setPicker] = useState(false);
  const [detail, setDetail] = useState("");
  const [edgeSource, setEdgeSource] = useState("");
  const [edgeTarget, setEdgeTarget] = useState("");
  const [edgeLabel, setEdgeLabel] = useState("");
  const [actorName, setActorName] = useState("");
  const [newFlow, setNewFlow] = useState(false);
  const [flowName, setFlowName] = useState("");
  const rf = useReactFlow();
  const update = (fn: (f: Workflow) => void) => {
    if (flow)
      edit((w) => {
        const f = w.workflows.find((f) => f.id === flow.id);
        if (f) fn(f);
      });
  };
  const step = flow?.steps.find((s) => s.id === selected);
  const changeStep = (fn: (s: ProcessStep) => void) =>
    update((f) => {
      const s = f.steps.find((s) => s.id === selected);
      if (s) fn(s);
    });
  const add = (stepId: string, id: string) => {
    update((f) => {
      const s = f.steps.find((s) => s.id === stepId);
      if (s) addInformation(s, id);
    });
    setNotice(
      "„" +
        elementMap.get(id)!.label +
        "“ dem Schritt hinzugefügt. Verwendung zunächst: Benötigt.",
    );
  };
  const nodes: StepNode[] = useMemo(
    () =>
      flow?.steps.map((s) => ({
        id: s.id,
        type: "step",
        position: s.position,
        measured: measured[s.id],
        selected: s.id === selected,
        data: {
          step: s,
          actors: s.actorIds.map(
            (id) => w.actors.find((a) => a.id === id)?.name ?? "",
          ),
        },
      })) ?? [],
    [flow, w.actors, selected, measured],
  );
  const edges: Edge[] =
    flow?.connections.map((c) => ({
      ...c,
      markerEnd: { type: MarkerType.ArrowClosed },
      type: "smoothstep",
    })) ?? [];
  const all = filterElements(filters);
  const paletteItems =
    !filters.search && !filters.priority && !filters.theme && !filters.used
      ? all.filter((e) => e.kind === "section")
      : all;
  const palette = paletteItems.slice(0, limit);
  const createStep = (
    kind: ProcessStep["kind"],
    position?: { x: number; y: number },
  ) => {
    const id = uid();
    update((f) =>
      f.steps.push({
        id,
        title: kinds[kind],
        kind,
        actorIds: [],
        information: [],
        position: position ?? {
          x: 80 + (f.steps.length % 3) * 320,
          y: 100 + Math.floor(f.steps.length / 3) * 220,
        },
      }),
    );
    setSelected(id);
  };
  const connect = () => {
    if (
      !flow?.steps.some((s) => s.id === edgeSource) ||
      !flow.steps.some((s) => s.id === edgeTarget)
    )
      return;
    update((f) =>
      f.connections.push({
        id: uid(),
        source: edgeSource,
        target: edgeTarget,
        label: edgeLabel,
      }),
    );
    setEdgeLabel("");
  };
  return (
    <div className="module workflow-module">
      <div className="section-title">
        <div>
          <div className="eyebrow">03 / Abläufe gestalten</div>
          <h1>Informationen im Versorgungskontext.</h1>
          <p className="muted">
            Beschreibe deinen Ablauf. Wer benötigt, erzeugt oder übergibt welche
            Information?
          </p>
        </div>
        <div className="row">
          <button onClick={() => setShowActors(true)}>
            <Users size={17} /> Akteure
          </button>
          <button
            className="primary"
            onClick={() => {
              setFlowName("");
              setNewFlow(true);
            }}
          >
            <Plus size={17} /> Neuer Ablauf
          </button>
        </div>
      </div>
      {!flow ? (
        <Empty>
          <GitBranch size={34} />
          <h2>Jeder Versorgungsweg ist anders.</h2>
          <p>
            Beginne mit einem leeren Ablauf oder einer fiktiven, vollständig
            bearbeitbaren Demonstration.
          </p>
          <button className="primary" onClick={() => setNewFlow(true)}>
            Ablauf erstellen
          </button>
          <button
            onClick={() => {
              const id = uid();
              const a = uid(),
                b = uid();
              const steps: ProcessStep[] = [
                "Entlassung vorbereiten",
                "Informationen übergeben",
                "Pflege aufnehmen",
              ].map((title, i) => ({
                id: uid(),
                title,
                kind: i === 0 ? "start" : i === 2 ? "ende" : "aktion",
                position: { x: 40 + i * 330, y: 120 },
                actorIds: [i === 2 ? b : a],
                information: [],
              }));
              edit((w) => {
                w.actors.push(
                  { id: a, name: "Abgebende Einrichtung" },
                  { id: b, name: "Aufnehmende Pflege" },
                );
                w.workflows.push({
                  id,
                  name: "Demonstration: Krankenhaus → Pflegeeinrichtung",
                  description:
                    "Fiktive Startervorlage, kein normatives PIO-Prozessmodell. Keine Falldaten.",
                  steps,
                  connections: steps.slice(1).map((s, i) => ({
                    id: uid(),
                    source: steps[i].id,
                    target: s.id,
                  })),
                });
              });
              setFlowId(id);
            }}
          >
            Fiktive Startervorlage
          </button>
        </Empty>
      ) : (
        <>
          <div className="flow-toolbar">
            <select
              aria-label="Ablauf auswählen"
              value={flow.id}
              onChange={(e) => {
                setFlowId(e.target.value);
                setSelected("");
              }}
            >
              {w.workflows.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                const id = uid();
                edit((w) => {
                  const clone = structuredClone(flow);
                  const ids = new Map(clone.steps.map((s) => [s.id, uid()]));
                  clone.id = id;
                  clone.name += " – Kopie";
                  clone.steps.forEach((s) => (s.id = ids.get(s.id)!));
                  clone.connections.forEach((c) => {
                    c.id = uid();
                    c.source = ids.get(c.source)!;
                    c.target = ids.get(c.target)!;
                  });
                  w.workflows.push(clone);
                });
                setFlowId(id);
              }}
            >
              <Copy size={15} /> Duplizieren
            </button>
            <button
              onClick={() => {
                if (
                  confirm(
                    "Diesen Ablauf mit allen Schritten und Notizen löschen?",
                  )
                ) {
                  edit((w) => {
                    w.workflows = w.workflows.filter((f) => f.id !== flow.id);
                  });
                  setSelected("");
                }
              }}
            >
              <Trash2 size={15} /> Löschen
            </button>
            <div className="row node-tools">
              {Object.entries(kinds).map(([k, v]) => (
                <button
                  key={k}
                  draggable
                  onDragStart={(e) =>
                    e.dataTransfer.setData("application/process-kind", k)
                  }
                  onClick={() => createStep(k as ProcessStep["kind"])}
                >
                  + {v}
                </button>
              ))}
            </div>
          </div>
          <div className="workflow-layout">
            <aside className="palette">
              <h3>PIO-Informationen</h3>
              <p className="small muted">
                Auf einen Schritt ziehen oder Schritt wählen und „Information
                hinzufügen“ nutzen.
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
                <div
                  key={e.id}
                  className="native-card"
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData("application/pio-element", e.id);
                    event.dataTransfer.effectAllowed = "copy";
                  }}
                >
                  <button
                    className="card-label"
                    onClick={() => setDetail(e.id)}
                  >
                    {e.label}
                  </button>
                  <button
                    title="Zum ausgewählten Schritt hinzufügen"
                    aria-label={"Hinzufügen: " + e.label}
                    disabled={!step}
                    onClick={() => add(step!.id, e.id)}
                  >
                    +
                  </button>
                </div>
              ))}
              {paletteItems.length > limit && (
                <button onClick={() => setLimit(limit + 30)}>
                  Weitere laden
                </button>
              )}
            </aside>
            <div className="canvas-wrapper">
              <div className="flow-meta">
                <input
                  aria-label="Name des Ablaufs"
                  value={flow.name}
                  onChange={(e) =>
                    update((f) => {
                      f.name = e.target.value;
                    })
                  }
                />
                <textarea
                  aria-label="Szenariobeschreibung"
                  placeholder="Szenario beschreiben …"
                  value={flow.description ?? ""}
                  onChange={(e) =>
                    update((f) => {
                      f.description = e.target.value;
                    })
                  }
                />
              </div>
              <div
                className="flow-canvas"
                onDragOver={(e) => {
                  if (e.dataTransfer.types.includes("application/process-kind"))
                    e.preventDefault();
                }}
                onDrop={(e) => {
                  const kind = e.dataTransfer.getData(
                    "application/process-kind",
                  );
                  if (kind in kinds) {
                    e.preventDefault();
                    createStep(
                      kind as ProcessStep["kind"],
                      rf.screenToFlowPosition({ x: e.clientX, y: e.clientY }),
                    );
                  }
                }}
              >
                <DropContext.Provider value={add}>
                  <ReactFlow
                    key={flow.id}
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    onNodeClick={(_, n) => setSelected(n.id)}
                    onPaneClick={() => setSelected("")}
                    onNodesChange={(changes) => {
                      const selection = changes.find(
                        (c) => c.type === "select" && c.selected,
                      );
                      if (selection?.type === "select") setSelected(selection.id);
                      const dimensions = changes.filter(
                        (c) => c.type === "dimensions" && c.dimensions,
                      );
                      if (dimensions.length)
                        setMeasured((previous) => {
                          let next = previous;
                          dimensions.forEach((c) => {
                            if (c.type !== "dimensions" || !c.dimensions)
                              return;
                            if (
                              previous[c.id]?.width === c.dimensions.width &&
                              previous[c.id]?.height === c.dimensions.height
                            )
                              return;
                            if (next === previous) next = { ...previous };
                            next[c.id] = c.dimensions;
                          });
                          return next;
                        });
                      const moves = changes.filter(
                        (c) =>
                          c.type === "position" &&
                          c.position &&
                          flow.steps.some(
                            (s) =>
                              s.id === c.id &&
                              (s.position.x !== c.position!.x ||
                                s.position.y !== c.position!.y),
                          ),
                      );
                      if (moves.length)
                        update((f) => {
                          moves.forEach((c) => {
                            if (c.type === "position" && c.position) {
                              const s = f.steps.find((s) => s.id === c.id);
                              if (s) s.position = c.position;
                            }
                          });
                        });
                    }}
                    onConnect={(c) =>
                      update((f) =>
                        f.connections.push({
                          id: uid(),
                          source: c.source,
                          target: c.target,
                        }),
                      )
                    }
                    onEdgeDoubleClick={(_, edge) => {
                      const label = prompt(
                        "Beschriftung der Verbindung",
                        String(edge.label ?? ""),
                      );
                      if (label !== null)
                        update((f) => {
                          f.connections.find((c) => c.id === edge.id)!.label =
                            label;
                        });
                    }}
                    deleteKeyCode={null}
                    fitView
                    minZoom={0.2}
                    maxZoom={2}
                    ariaLabelConfig={{
                      "node.a11yDescription.default":
                        "Mit Eingabe oder Leertaste auswählen; mit Pfeiltasten verschieben. Zum Löschen die Schrittdetails verwenden.",
                      "node.a11yDescription.keyboardDisabled":
                        "Mit Eingabe oder Leertaste auswählen. Alternativ die Schrittauswahl rechts verwenden.",
                      "node.a11yDescription.ariaLiveMessage": ({ x, y }) =>
                        `Schritt verschoben. Position: ${x}, ${y}.`,
                      "edge.a11yDescription.default":
                        "Mit Eingabe oder Leertaste auswählen. Beschriftung und Löschen unter Verbindungen ohne Ziehen.",
                      "controls.zoomIn.ariaLabel": "Vergrößern",
                      "controls.zoomOut.ariaLabel": "Verkleinern",
                      "controls.fitView.ariaLabel": "Ansicht anpassen",
                      "controls.interactive.ariaLabel":
                        "Interaktion umschalten",
                    }}
                  >
                    <Background gap={22} color="#d3dcd7" />
                    <Controls />
                    <MiniMap pannable zoomable />
                  </ReactFlow>
                </DropContext.Provider>
              </div>
              <div className="status-line" role="status">
                {notice ||
                  "Tipp: Verbinde die Punkte an den Schritten. Mit den Steuerelementen passt du die Ansicht an."}
              </div>
            </div>
            <aside className="step-editor">
              <Field label="Versorgungsschritt auswählen">
                <select
                  value={step?.id ?? ""}
                  onChange={(e) => setSelected(e.target.value)}
                >
                  <option value="">Schritt wählen …</option>
                  {flow.steps.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </Field>
              {step ? (
                <>
                  <div className="eyebrow">Versorgungsschritt</div>
                  <Field label="Titel des Schritts">
                    <input
                      value={step.title}
                      onChange={(e) =>
                        changeStep((s) => {
                          s.title = e.target.value;
                        })
                      }
                    />
                  </Field>
                  <Field label="Schritttyp">
                    <select
                      value={step.kind}
                      onChange={(e) =>
                        changeStep((s) => {
                          s.kind = e.target.value as ProcessStep["kind"];
                        })
                      }
                    >
                      {Object.entries(kinds).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Beschreibung des Schritts">
                    <textarea
                      value={step.description ?? ""}
                      onChange={(e) =>
                        changeStep((s) => {
                          s.description = e.target.value;
                        })
                      }
                    />
                  </Field>
                  <h3>Beteiligte Akteure</h3>
                  {w.actors.map((a) => (
                    <label className="check" key={a.id}>
                      <input
                        type="checkbox"
                        checked={step.actorIds.includes(a.id)}
                        onChange={(e) =>
                          changeStep((s) => {
                            s.actorIds = e.target.checked
                              ? [...s.actorIds, a.id]
                              : s.actorIds.filter((id) => id !== a.id);
                          })
                        }
                      />
                      {a.name}
                    </label>
                  ))}
                  <button
                    className="text-button"
                    onClick={() => setShowActors(true)}
                  >
                    Akteure verwalten
                  </button>
                  <h3>Informationen ({step.information.length})</h3>
                  {step.information.map((i) => (
                    <div className="info-assignment" key={i.elementId}>
                      <button
                        className="card-label"
                        onClick={() => setDetail(i.elementId)}
                      >
                        {elementMap.get(i.elementId)!.label} ↗
                      </button>
                      <select
                        aria-label={
                          "Verwendung: " + elementMap.get(i.elementId)!.label
                        }
                        value={i.usage}
                        onChange={(e) =>
                          changeStep((s) => {
                            s.information.find(
                              (x) => x.elementId === i.elementId,
                            )!.usage = e.target.value as typeof i.usage;
                          })
                        }
                      >
                        {Object.entries(usages).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </select>
                      <textarea
                        aria-label="Notiz zur Information"
                        placeholder="Notiz zur Verwendung …"
                        value={i.notes ?? ""}
                        onChange={(e) =>
                          changeStep((s) => {
                            s.information.find(
                              (x) => x.elementId === i.elementId,
                            )!.notes = e.target.value;
                          })
                        }
                      />
                      <button
                        className="text-button"
                        onClick={() =>
                          changeStep((s) => {
                            s.information = s.information.filter(
                              (x) => x.elementId !== i.elementId,
                            );
                          })
                        }
                      >
                        Zuordnung entfernen
                      </button>
                    </div>
                  ))}
                  <button className="primary" onClick={() => setPicker(true)}>
                    <Plus size={15} /> Information hinzufügen
                  </button>
                  <div className="row step-actions">
                    <button
                      onClick={() => {
                        const clone = structuredClone(step);
                        clone.id = uid();
                        clone.title += " – Kopie";
                        clone.position = {
                          x: clone.position.x + 50,
                          y: clone.position.y + 100,
                        };
                        update((f) => f.steps.push(clone));
                        setSelected(clone.id);
                      }}
                    >
                      <Copy size={14} /> Kopie
                    </button>
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            "Schritt samt Informationsnotizen und verbundenen Kanten löschen?",
                          )
                        ) {
                          update((f) => removeStep(f, step.id));
                          setSelected("");
                        }
                      }}
                    >
                      <Trash2 size={14} /> Schritt löschen
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3>Dein Ablauf</h3>
                  <p className="muted">
                    Wähle einen Schritt, um Titel, Akteure und Informationen zu
                    bearbeiten.
                  </p>
                  <p className="small">
                    Vereinfachte Erklärung: Jeder Schritt ist frei gestaltbar.
                    Informationen lassen sich an mehreren Schritten unabhängig
                    verwenden.
                  </p>
                </>
              )}
              <details className="connection-editor">
                <summary>Verbindungen ohne Ziehen</summary>
                <Field label="Von Schritt">
                  <select
                    value={edgeSource}
                    onChange={(e) => setEdgeSource(e.target.value)}
                  >
                    <option value="">Auswählen …</option>
                    {flow.steps.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Zu Schritt">
                  <select
                    value={edgeTarget}
                    onChange={(e) => setEdgeTarget(e.target.value)}
                  >
                    <option value="">Auswählen …</option>
                    {flow.steps.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Beschriftung">
                  <input
                    value={edgeLabel}
                    onChange={(e) => setEdgeLabel(e.target.value)}
                  />
                </Field>
                <button disabled={!edgeSource || !edgeTarget} onClick={connect}>
                  Schritte verbinden
                </button>
                {flow.connections.map((c) => (
                  <div key={c.id} className="connection">
                    <p className="small">
                      {flow.steps.find((s) => s.id === c.source)?.title} →{" "}
                      {flow.steps.find((s) => s.id === c.target)?.title}
                    </p>
                    <input
                      aria-label="Verbindungsbeschriftung"
                      value={c.label ?? ""}
                      onChange={(e) =>
                        update((f) => {
                          f.connections.find((x) => x.id === c.id)!.label =
                            e.target.value;
                        })
                      }
                    />
                    <button
                      onClick={() =>
                        update((f) => {
                          f.connections = f.connections.filter(
                            (x) => x.id !== c.id,
                          );
                        })
                      }
                    >
                      Verbindung löschen
                    </button>
                  </div>
                ))}
              </details>
            </aside>
          </div>
        </>
      )}
      {newFlow && (
        <Modal title="Neuen Ablauf anlegen" onClose={() => setNewFlow(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const id = uid();
              edit((w) =>
                w.workflows.push({
                  id,
                  name: flowName.trim(),
                  steps: [],
                  connections: [],
                }),
              );
              setFlowId(id);
              setSelected("");
              setNewFlow(false);
            }}
          >
            <Field label="Name des neuen Ablaufs">
              <input
                required
                autoFocus
                value={flowName}
                onChange={(e) => setFlowName(e.target.value)}
              />
            </Field>
            <button className="primary" disabled={!flowName.trim()}>
              Ablauf anlegen
            </button>
          </form>
        </Modal>
      )}
      {showActors && (
        <Modal title="Akteure im Workshop" onClose={() => setShowActors(false)}>
          <p className="muted">
            Fachliche Rollen oder Einrichtungen, keine personenbezogenen
            Angaben.
          </p>
          {w.actors.map((a) => (
            <div className="actor-row" key={a.id}>
              <input
                aria-label="Akteursname"
                value={a.name}
                onChange={(e) =>
                  edit((w) => {
                    w.actors.find((x) => x.id === a.id)!.name = e.target.value;
                  })
                }
              />
              <input
                aria-label="Akteursbeschreibung"
                placeholder="Beschreibung"
                value={a.description ?? ""}
                onChange={(e) =>
                  edit((w) => {
                    w.actors.find((x) => x.id === a.id)!.description =
                      e.target.value;
                  })
                }
              />
              <button
                aria-label={"Akteur löschen: " + a.name}
                onClick={() => {
                  if (
                    confirm("Akteur löschen und aus allen Schritten entfernen?")
                  )
                    edit((w) => {
                      w.actors = w.actors.filter((x) => x.id !== a.id);
                      w.workflows.forEach((f) =>
                        f.steps.forEach(
                          (s) =>
                            (s.actorIds = s.actorIds.filter(
                              (id) => id !== a.id,
                            )),
                        ),
                      );
                    });
                }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (actorName.trim())
                edit((w) =>
                  w.actors.push({ id: uid(), name: actorName.trim() }),
                );
              setActorName("");
            }}
          >
            <Field label="Neuer Akteur">
              <input
                value={actorName}
                onChange={(e) => setActorName(e.target.value)}
                placeholder="z. B. Aufnehmende Pflege"
              />
            </Field>
            <button className="primary" disabled={!actorName.trim()}>
              Akteur hinzufügen
            </button>
          </form>
        </Modal>
      )}
      {picker && step && (
        <Modal
          title="Information zum Schritt hinzufügen"
          onClose={() => setPicker(false)}
        >
          <FilterBar value={filters} onChange={setFilters} />
          <div className="picker-list">
            {palette.map((e) => (
              <button
                key={e.id}
                onClick={() => {
                  add(step.id, e.id);
                  setPicker(false);
                }}
              >
                {e.label}
                <Plus size={15} />
              </button>
            ))}
          </div>
        </Modal>
      )}
      {detail && (
        <Modal title="PIO-Original und Bewertung" onClose={() => setDetail("")}>
          <Details id={detail} onSelect={setDetail} />
        </Modal>
      )}
    </div>
  );
}
