import { copyFileSync, existsSync, mkdirSync } from "fs";
import { basename, join, resolve } from "path";

const dataDir = resolve(process.cwd(), "data");
const sourcePath = join(dataDir, "squad-planner.db");
const backupDir = join(dataDir, "backups");

function timestamp() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");

  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    "-",
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds())
  ].join("");
}

if (!existsSync(sourcePath)) {
  console.error(`Cannot back up missing database: ${sourcePath}`);
  process.exit(1);
}

mkdirSync(backupDir, { recursive: true });

const backupPath = join(backupDir, `squad-planner-${timestamp()}.db`);
copyFileSync(sourcePath, backupPath);

for (const suffix of ["-wal", "-shm"]) {
  const sidecarPath = `${sourcePath}${suffix}`;
  if (existsSync(sidecarPath)) {
    copyFileSync(sidecarPath, `${backupPath}${suffix}`);
  }
}

console.log(`Backup created: ${backupPath}`);
console.log(`Source database: ${basename(sourcePath)}`);
