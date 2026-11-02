import { useState } from "react";
import { catalog } from "../../domain/workspace";
import { download } from "../../components/shared";
const assets = import.meta.glob("../../generated/terminologies/*.json", {
  query: "?url",
  import: "default",
  eager: true,
}) as Record<string, string>;
export function Terminology({ url }: { url: string }) {
  const [raw, setRaw] = useState("");
  const [error, setError] = useState("");
  const term = catalog.terminologies.find(
    (t) => t.canonical === url.split("|")[0],
  );
  return (
    <details
      onToggle={async (e) => {
        if (e.currentTarget.open && term && !raw) {
          try {
            const asset = assets["../../generated/terminologies/" + term.asset];
            const res = await fetch(asset);
            if (!res.ok) throw new Error(String(res.status));
            setRaw(JSON.stringify(await res.json(), null, 2));
          } catch (err) {
            setError(
              "Lokaler Terminologiebeleg konnte nicht geladen werden: " +
                String(err),
            );
          }
        }
      }}
    >
      <summary className="break">Terminologie: {url}</summary>
      {term ? (
        <>
          <p>
            {term.file} · Version {term.version ?? "nicht angegeben"}
          </p>
          {raw ? (
            <>
              <pre>
                {raw.slice(0, 30000)}
                {raw.length > 30000
                  ? "\n… Vorschau gekürzt; vollständiger Originalbeleg über Download."
                  : ""}
              </pre>
              <button
                onClick={() => download(raw, term.asset, "application/json")}
              >
                Vollständige Terminologie herunterladen
              </button>
            </>
          ) : (
            <p>{error || "Lokalen Beleg laden …"}</p>
          )}
        </>
      ) : (
        <p>Nicht lokal aufgelöst. Keine externe Abfrage.</p>
      )}
    </details>
  );
}
