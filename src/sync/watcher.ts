import chokidar from "chokidar";
import type { Database } from "bun:sqlite";
import { sha256 } from "./hash";
import { importExcelFile } from "./excel-importer";

let watcher: ReturnType<typeof chokidar.watch> | null = null;

export function startWatcher(
  folderPath: string,
  db: Database,
  onSync?: (result: { filePath: string; imported: number; skipped: number }) => void
) {
  if (watcher) {
    watcher.close();
  }

  watcher = chokidar.watch(folderPath, {
    persistent: true,
    ignoreInitial: false,
    depth: 0,
    awaitWriteFinish: { stabilityThreshold: 2000 },
  });

  watcher.on("add", async (filePath) => {
    if (!filePath.endsWith(".xlsx")) return;
    await processFile(filePath, db, onSync);
  });

  watcher.on("change", async (filePath) => {
    if (!filePath.endsWith(".xlsx")) return;
    await processFile(filePath, db, onSync);
  });

  watcher.on("unlink", (filePath) => {
    console.log(`[sync] File removed: ${filePath}`);
  });

  console.log(`[sync] Watching folder: ${folderPath}`);
}

export function stopWatcher() {
  if (watcher) {
    watcher.close();
    watcher = null;
  }
}

async function processFile(
  filePath: string,
  db: Database,
  onSync?: (result: { filePath: string; imported: number; skipped: number }) => void
) {
  try {
    const file = Bun.file(filePath);
    const exists = await file.exists();
    if (!exists) return;

    const content = await file.arrayBuffer();
    const hash = await sha256(content);

    const row = db
      .query<{ hash: string }, [string]>("SELECT hash FROM file_hashes WHERE path = ?")
      .get(filePath);

    if (row && row.hash === hash) {
      console.log(`[sync] Skipping unchanged file: ${filePath}`);
      return;
    }

    console.log(`[sync] Processing file: ${filePath}`);
    const result = await importExcelFile(filePath, content, db);

    db.run(
      "INSERT OR REPLACE INTO file_hashes (path, hash, synced_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
      [filePath, hash]
    );

    console.log(`[sync] Imported ${result.imported}, skipped ${result.skipped} from ${filePath}`);
    onSync?.({ filePath, imported: result.imported, skipped: result.skipped });
  } catch (err) {
    console.error(`[sync] Error processing ${filePath}:`, err);
  }
}
