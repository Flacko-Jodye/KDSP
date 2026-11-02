import {
  test,
  expect,
  chromium,
  firefox,
  type Page,
  type Locator,
} from "@playwright/test";
import { readFile } from "node:fs/promises";
async function start(page: Page) {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Welche Informationen zählen?" }),
  ).toBeVisible();
  if (
    await page.getByRole("button", { name: "Einführung schließen" }).isVisible()
  )
    await page.getByRole("button", { name: "Einführung schließen" }).click();
}
async function tab(page: Page, name: string) {
  await page
    .getByRole("button", { name: new RegExp(name) })
    .first()
    .click();
}
async function theme(page: Page, name: string) {
  await page
    .getByRole("button", { name: "Thema anlegen", exact: true })
    .click();
  await page.getByLabel("Name des Themenbereichs").fill(name);
  await page.getByRole("button", { name: "Thema speichern" }).click();
}
async function pointerDrag(page: Page, from: Locator, to: Locator) {
  await page.waitForTimeout(400);
  await from.scrollIntoViewIfNeeded();
  const a = await from.boundingBox();
  const b = await to.boundingBox();
  if (!a || !b) throw new Error("Drag-Ziel fehlt");
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(a.x + a.width / 2 + 10, a.y + a.height / 2 + 10, {
    steps: 8,
  });
  await page.waitForTimeout(150);
  await page.mouse.move(b.x + b.width / 2, b.y + Math.min(190, b.height / 2), {
    steps: 25,
  });
  await page.waitForTimeout(300);
  await page.mouse.up();
  await expect(page.locator("[data-dnd-dropping]")).toHaveCount(0);
}
test("vollständiger Workshop, unabhängige Kontexte, Backup und Import", async ({
  page,
  browser,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page);
  await page.screenshot({
    path: "test-results/katalog-" + testInfo.project.name + ".png",
    fullPage: false,
  });
  await page.getByLabel("PIO durchsuchen").fill("Pflegegrad");
  await page
    .locator(".catalog-card")
    .filter({
      has: page.getByRole("heading", { name: "Pflegegrad", exact: true }),
    })
    .click();
  await page.getByLabel("Priorität", { exact: true }).selectOption("kern");
  await page
    .getByLabel("Begründung", { exact: true })
    .fill("Für die Abstimmung im Workshop erforderlich.");
  await page.getByText("Quelle anzeigen", { exact: true }).click();
  await expect(page.locator(".source")).toContainText(
    "Composition.section:pflegegrad",
  );
  await tab(page, "Themen ordnen");
  await theme(page, "Versorgungsbedarf");
  await page
    .getByLabel("Zuordnen: Pflegegrad", { exact: true })
    .selectOption({ label: "Versorgungsbedarf" });
  await expect(
    page.locator(".board-column").filter({ hasText: "Versorgungsbedarf" }),
  ).toContainText("Kerndatensatz");
  await tab(page, "Abläufe gestalten");
  await page.getByRole("button", { name: "Neuer Ablauf", exact: true }).click();
  await page.getByLabel("Name des neuen Ablaufs").fill("Übergabe planen");
  await page
    .getByRole("button", { name: "Ablauf anlegen", exact: true })
    .click();
  await page
    .getByLabel("Szenariobeschreibung")
    .fill("Synthetische Demonstration ohne Falldaten.");
  await page.getByRole("button", { name: "Akteure", exact: true }).click();
  for (const name of ["Abgebende Pflege", "Aufnehmende Pflege"]) {
    await page.getByLabel("Neuer Akteur", { exact: true }).fill(name);
    await page.getByRole("button", { name: "Akteur hinzufügen" }).click();
  }
  await page.getByRole("button", { name: "Schließen", exact: true }).click();
  for (const [kind, title] of [
    ["Start", "Vorbereiten"],
    ["Aktivität", "Übergeben"],
    ["Ende", "Aufnehmen"],
  ]) {
    await page.getByRole("button", { name: "+ " + kind, exact: true }).click();
    await page.getByLabel("Titel des Schritts").fill(title);
    await page
      .getByLabel(
        title === "Aufnehmen" ? "Aufnehmende Pflege" : "Abgebende Pflege",
        { exact: true },
      )
      .check();
    if (title !== "Übergeben") {
      await page
        .getByRole("button", { name: "Information hinzufügen", exact: true })
        .click();
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Pflegegrad", exact: true })
        .click();
      await page
        .getByLabel("Verwendung: Pflegegrad")
        .selectOption(title === "Vorbereiten" ? "uebergibt" : "benoetigt");
    }
  }
  await page.getByText("Verbindungen ohne Ziehen", { exact: true }).click();
  for (const [a, b] of [
    ["Vorbereiten", "Übergeben"],
    ["Übergeben", "Aufnehmen"],
  ]) {
    await page
      .getByLabel("Von Schritt", { exact: true })
      .selectOption({ label: a });
    await page
      .getByLabel("Zu Schritt", { exact: true })
      .selectOption({ label: b });
    await page.getByLabel("Beschriftung", { exact: true }).fill("danach");
    await page.getByRole("button", { name: "Schritte verbinden" }).click();
  }
  await expect(page.locator(".react-flow__edge")).toHaveCount(2);
  await page.getByRole("button", { name: "Ansicht anpassen" }).click();
  await page.screenshot({
    path: "test-results/ablauf-" + testInfo.project.name + ".png",
    fullPage: true,
  });
  await expect(page.getByRole("status").first()).toHaveText("Gespeichert");
  await page.reload();
  await tab(page, "Abläufe gestalten");
  await expect(page.locator(".react-flow__node")).toHaveCount(3);
  await expect(page.locator(".react-flow__edge")).toHaveCount(2);
  await tab(page, "Ergebnisse");
  await expect(page.locator("tbody tr")).toHaveCount(2);
  await expect(page.locator("tbody")).toContainText("Übergibt");
  await expect(page.locator("tbody")).toContainText("Benötigt");
  await expect(page.locator("tbody")).toContainText("Versorgungsbedarf");
  const dlPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "JSON-Backup", exact: true }).click();
  const dl = await dlPromise;
  const json = await readFile((await dl.path())!, "utf8");
  const saved = JSON.parse(json).workspace;
  expect(saved.workflows[0].steps).toHaveLength(3);
  expect(saved.workflows[0].connections).toHaveLength(2);
  const independent = await browser.newContext();
  const other = await independent.newPage();
  await start(other);
  await tab(other, "Ergebnisse");
  await expect(other.locator("tbody tr")).toHaveCount(0);
  await other.locator(".workspace-button").click();
  await other.locator("input[type=file]").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(json),
  });
  await expect(other.getByRole("alert")).toContainText("Import erfolgreich");
  await expect(other.locator("tbody tr")).toHaveCount(2);
  const roundtrip = other.waitForEvent("download");
  await other.getByRole("button", { name: "JSON-Backup", exact: true }).click();
  const imported = JSON.parse(
    await readFile((await (await roundtrip).path())!, "utf8"),
  ).workspace;
  expect(imported.workflows).toEqual(saved.workflows);
  expect(imported.assignments).toEqual(saved.assignments);
  await independent.close();
  await page.locator(".workspace-button").click();
  await page
    .getByLabel("Neuer Arbeitsstand", { exact: true })
    .fill("Zweiter Workshop");
  await page.getByRole("button", { name: "Neu anlegen", exact: true }).click();
  await page.getByRole("button", { name: "Schließen", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(0);
  await page.locator(".workspace-button").click();
  await page.getByLabel("Arbeitsstand öffnen").selectOption(saved.id);
  await page.getByRole("button", { name: "Schließen", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(2);
  expect(errors).toEqual([]);
});
test("echtes Board-Drag-and-drop ändert nur die gewählte Dimension", async ({
  page,
}) => {
  await start(page);
  await tab(page, "Themen ordnen");
  await theme(page, "Thema A");
  await theme(page, "Thema B");
  const a = page.locator(".board-column").filter({
    has: page.getByRole("heading", { name: "Thema A", exact: true }),
  });
  const b = page.locator(".board-column").filter({
    has: page.getByRole("heading", { name: "Thema B", exact: true }),
  });
  await pointerDrag(
    page,
    page.getByRole("button", { name: "Ziehen: Pflegegrad", exact: true }),
    a,
  );
  await expect(a.locator(".board-card")).toContainText("Pflegegrad");
  await pointerDrag(
    page,
    a.getByRole("button", { name: "Ziehen: Pflegegrad", exact: true }),
    b,
  );
  await expect(b.locator(".board-card")).toContainText("Pflegegrad");
  await expect(a.locator(".board-card")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Priorisierung", exact: true })
    .click();
  await pointerDrag(
    page,
    page
      .getByTestId("drop-offen")
      .getByRole("button", { name: "Ziehen: Pflegegrad", exact: true }),
    page.getByTestId("drop-kern"),
  );
  await expect(
    page.getByTestId("drop-kern").locator(".board-card"),
  ).toContainText("Pflegegrad");
  await page
    .getByRole("button", { name: "Themenbereiche", exact: true })
    .click();
  await expect(b.locator(".board-card")).toContainText("Kerndatensatz");
});
test("Canvas-Drop auf zwei Schritte, Panning, Positionen und Löschen", async ({
  page,
}) => {
  await start(page);
  await tab(page, "Abläufe gestalten");
  await page
    .getByRole("button", { name: "Fiktive Startervorlage", exact: true })
    .click();
  await page.getByRole("button", { name: "Ansicht anpassen" }).click();
  const palette = page.locator(".native-card").filter({
    has: page.getByRole("button", { name: "Pflegegrad", exact: true }),
  });
  const steps = page.locator(".step-node");
  await palette.dragTo(steps.nth(0));
  await expect(steps.nth(0)).toContainText("Pflegegrad");
  await palette.dragTo(steps.nth(2));
  await expect(steps.nth(2)).toContainText("Pflegegrad");
  await steps.nth(2).click();
  await page.getByLabel("Verwendung: Pflegegrad").selectOption("erzeugt");
  const first = page.locator(".react-flow__node").first();
  const before = await first.getAttribute("style");
  await first.hover();
  await page.mouse.down();
  await page.mouse.move(780, 500, { steps: 20 });
  await page.mouse.up();
  await expect(first).not.toHaveAttribute("style", before!);
  await page.getByRole("button", { name: "Verkleinern" }).click();
  const canvas = page.locator(".react-flow__pane");
  const box = await canvas.boundingBox();
  await page.mouse.move(box!.x + box!.width - 30, box!.y + 40);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width - 80, box!.y + 90, { steps: 10 });
  await page.mouse.up();
  await expect(page.getByRole("status").first()).toHaveText("Gespeichert");
  await page.reload();
  await tab(page, "Abläufe gestalten");
  await expect(
    page.locator(".step-node").filter({ hasText: "Pflegegrad" }),
  ).toHaveCount(2);
  await page.locator(".step-node").nth(1).click();
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Schritt löschen", exact: true })
    .click();
  await expect(page.locator(".react-flow__node")).toHaveCount(2);
  await expect(page.locator(".react-flow__edge")).toHaveCount(0);
});

test("Karten per Ziehen sortieren und Knoten an Canvas-Koordinaten platzieren", async ({
  page,
}) => {
  await start(page);
  await tab(page, "Themen ordnen");
  await theme(page, "Reihenfolge");
  for (const name of ["Pflegegrad", "Grad der Behinderung"])
    await page
      .getByLabel("Zuordnen: " + name, { exact: true })
      .selectOption({ label: "Reihenfolge" });
  const col = page.locator(".board-column").filter({
    has: page.getByRole("heading", { name: "Reihenfolge", exact: true }),
  });
  await pointerDrag(
    page,
    col.getByRole("button", {
      name: "Ziehen: Grad der Behinderung",
      exact: true,
    }),
    col.locator(".board-card").filter({
      has: page.getByRole("button", { name: "Pflegegrad", exact: true }),
    }),
  );
  await expect(col.locator(".board-card").first()).toContainText(
    "Grad der Behinderung",
  );
  await expect(col.locator(".board-card")).toHaveCount(2);
  await tab(page, "Abläufe gestalten");
  await page
    .getByRole("button", { name: "Fiktive Startervorlage", exact: true })
    .click();
  const canvas = page.locator(".react-flow__pane");
  const box = await canvas.boundingBox();
  const target = { x: box!.width / 2, y: box!.height / 2 };
  await page
    .getByRole("button", { name: "+ Entscheidung", exact: true })
    .dragTo(canvas, { targetPosition: target });
  await expect(page.locator(".react-flow__node")).toHaveCount(4);
  const created = await page.locator(".react-flow__node").last().boundingBox();
  expect(Math.abs(created!.x - (box!.x + target.x))).toBeLessThan(8);
  expect(Math.abs(created!.y - (box!.y + target.y))).toBeLessThan(8);
  await page.getByRole("button", { name: "Ansicht anpassen" }).click();
  const source = await page
    .locator(".react-flow__node")
    .nth(2)
    .locator(".react-flow__handle.source")
    .boundingBox();
  const destination = await page
    .locator(".react-flow__node")
    .nth(3)
    .locator(".react-flow__handle.target")
    .boundingBox();
  await page.mouse.move(
    source!.x + source!.width / 2,
    source!.y + source!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    destination!.x + destination!.width / 2,
    destination!.y + destination!.height / 2,
    { steps: 20 },
  );
  await page.mouse.up();
  await expect(page.locator(".react-flow__edge")).toHaveCount(3);
});

test("Browser-Neustart, Löschen/Import und verständlicher Versionskonflikt", async ({
  browserName,
}, testInfo) => {
  const type = browserName === "firefox" ? firefox : chromium;
  const profile = testInfo.outputPath("persistent-profile");
  let context = await type.launchPersistentContext(profile, {
    headless: true,
    viewport: { width: 1500, height: 1050 },
  });
  let page = await context.newPage();
  await page.goto("http://127.0.0.1:5173/");
  await expect(page.locator(".workspace-button")).toBeVisible();
  await page.locator(".workspace-button").click();
  await page
    .getByLabel("Aktuellen Arbeitsstand benennen")
    .fill("Neustart-Test");
  await page.getByRole("button", { name: "Schließen", exact: true }).click();
  await expect(page.getByRole("status").first()).toHaveText("Gespeichert");
  await context.close();
  context = await type.launchPersistentContext(profile, {
    headless: true,
    viewport: { width: 1500, height: 1050 },
  });
  page = await context.newPage();
  await page.goto("http://127.0.0.1:5173/");
  await expect(page.locator(".workspace-button")).toHaveText("Neustart-Test");
  await page.locator(".workspace-button").click();
  const dl = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "JSON exportieren", exact: true })
    .click();
  const json = await readFile((await (await dl).path())!, "utf8");
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Löschen", exact: true })
    .click();
  await expect(page.getByLabel("Aktuellen Arbeitsstand benennen")).toHaveValue(
    "Neuer Workshop",
  );
  const invalid = JSON.parse(json);
  invalid.workspace.sourceIgVersion = "99.0";
  await page.locator("input[type=file]").setInputFiles({
    name: "falsche-version.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(invalid)),
  });
  await expect(page.getByRole("alert")).toContainText("IG-Versionskonflikt");
  await expect(page.getByLabel("Aktuellen Arbeitsstand benennen")).toHaveValue(
    "Neuer Workshop",
  );
  await page.locator("input[type=file]").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(json),
  });
  await expect(page.locator(".workspace-button")).toHaveText("Neustart-Test");
  await context.close();
});
