import { watch, type FSWatcher } from "chokidar";
import type { Database } from "bun:sqlite";
import { sha256 } from "./hash";

let watcher: FSWatcher | null = null;

export interface SyncEvent {
  filePath: string;
  content: ArrayBuffer;
  isNew: boolean;
}

export function startWatcher(
  folderPath: string,
  db: Database,
  onSync: (event: SyncEvent) => void | Promise<void>
): void {
  if (watcher) {
    watcher.close();
  }

  watcher = watch(folderPath, {
    persistent: true,
    ignoreInitial: false,
    depth: 0,
    awaitWriteFinish: { stabilityThreshold: 2000 },
  });

  watcher.on("add", async (filePath: string) => {
    if (!filePath.toLowerCase().endsWith(".xlsx")) return;

    try {
      const content = await Bun.file(filePath).arrayBuffer();
      const hash = await sha256(content);

      const row = db
        .query<{ hash: string }, [string]>(
          "SELECT hash FROM file_hashes WHERE path = ?"
        )
        .get(filePath);

      if (row && row.hash === hash) {
        return; // no change
      }

      onSync({ filePath, content, isNew: !row });
    } catch (err) {
      console.error(`[watcher] Failed to process ${filePath}:`, err);
    }
  });

  watcher.on("change", async (filePath: string) => {
    if (!filePath.toLowerCase().endsWith(".xlsx")) return;

    try {
      const content = await Bun.file(filePath).arrayBuffer();
      const hash = await sha256(content);

      const row = db
        .query<{ hash: string }, [string]>(
          "SELECT hash FROM file_hashes WHERE path = ?"
        )
        .get(filePath);

      if (row && row.hash === hash) {
        return; // no change
      }

      onSync({ filePath, content, isNew: !row });
    } catch (err) {
      console.error(`[watcher] Failed to process ${filePath}:`, err);
    }
  });

  watcher.on("unlink", (filePath: string) => {
    console.log(`[watcher] File removed: ${filePath}`);
  });

  watcher.on("error", (err: Error) => {
    console.error("[watcher] Error:", err);
  });
}

export function stopWatcher(): void {
  if (watcher) {
    watcher.close();
    watcher = null;
  }
}
