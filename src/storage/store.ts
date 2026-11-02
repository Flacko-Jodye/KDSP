import Dexie, { type Table } from "dexie";
import { create } from "zustand";
import {
  newWorkspace,
  validateWorkspace,
  type Workspace,
  uid,
} from "../domain/workspace";
export class WorkshopDb extends Dexie {
  workspaces!: Table<Workspace, string>;
  constructor(name = "pflege-workshop-v1") {
    super(name);
    this.version(1).stores({ workspaces: "id,updatedAt,name" });
  }
}
export const db = new WorkshopDb();
let timer: ReturnType<typeof setTimeout> | undefined;
let queue: Promise<void> = Promise.resolve();
interface State {
  workspace: Workspace | null;
  list: Workspace[];
  status: string;
  error: string;
  edit: (recipe: (w: Workspace) => void) => void;
  refresh: () => Promise<void>;
  open: (id: string) => Promise<void>;
  initialize: () => Promise<void>;
  create: (name: string) => Promise<void>;
  duplicate: () => Promise<void>;
  remove: () => Promise<void>;
  importWorkspace: (w: Workspace) => Promise<void>;
  flush: () => Promise<void>;
}
export const useWorkshop = create<State>((set, get) => ({
  workspace: null,
  list: [],
  status: "Lädt …",
  error: "",
  edit: (recipe) => {
    const current = get().workspace;
    if (!current) return;
    const w = structuredClone(current);
    recipe(w);
    w.updatedAt = new Date().toISOString();
    set({ workspace: w, status: "Speichert …" });
    clearTimeout(timer);
    timer = setTimeout(() => {
      void get()
        .flush()
        .catch(() => {});
    }, 400);
  },
  flush: async () => {
    clearTimeout(timer);
    const w = get().workspace;
    if (!w) return;
    const snapshot = structuredClone(w);
    const task = queue
      .catch(() => {})
      .then(async () => {
        await db.workspaces.put(snapshot);
        if (get().workspace === w) set({ status: "Gespeichert", error: "" });
        await get().refresh();
      });
    queue = task;
    try {
      await task;
    } catch (e) {
      set({
        status: "Nicht gespeichert",
        error:
          "Lokales Speichern fehlgeschlagen. Bitte JSON als Backup exportieren. " +
          String(e),
      });
      throw e;
    }
  },
  refresh: async () =>
    set({ list: await db.workspaces.orderBy("updatedAt").reverse().toArray() }),
  open: async (id) => {
    await get().flush();
    const w = await db.workspaces.get(id);
    if (w) set({ workspace: validateWorkspace(w), status: "Gespeichert" });
  },
  initialize: async () => {
    try {
      await get().refresh();
      const list = get().list;
      if (list.length)
        set({ workspace: validateWorkspace(list[0]), status: "Gespeichert" });
      else await get().create("Mein erster Workshop");
    } catch (e) {
      set({
        workspace: newWorkspace(),
        status: "Nicht gespeichert",
        error:
          "Gespeicherter Arbeitsstand konnte nicht geladen werden. Ein neuer Arbeitsstand ist im Arbeitsspeicher geöffnet; bestehende Einträge bleiben erhalten. JSON-Backups sichern. " +
          String(e),
      });
    }
  },
  create: async (name) => {
    await get().flush();
    const w = newWorkspace(name);
    await db.workspaces.put(w);
    set({ workspace: w, status: "Gespeichert" });
    await get().refresh();
  },
  duplicate: async () => {
    const w = get().workspace;
    if (w)
      await get().importWorkspace({
        ...structuredClone(w),
        name: w.name + " – Kopie",
      });
  },
  importWorkspace: async (input) => {
    await get().flush();
    const now = new Date().toISOString();
    const w = {
      ...structuredClone(input),
      id: uid(),
      createdAt: now,
      updatedAt: now,
    };
    await db.workspaces.put(w);
    set({ workspace: w, status: "Gespeichert" });
    await get().refresh();
  },
  remove: async () => {
    await get().flush();
    const w = get().workspace;
    if (!w) return;
    await db.workspaces.delete(w.id);
    set({ workspace: null });
    await get().refresh();
    if (get().list.length) await get().open(get().list[0].id);
    else await get().create("Neuer Workshop");
  },
}));
