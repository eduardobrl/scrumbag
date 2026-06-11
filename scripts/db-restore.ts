import { copyFileSync, existsSync, mkdirSync } from "fs";
import { dirname, resolve } from "path";

const args = process.argv.slice(2);
const backupArg = args.find((arg) => !arg.startsWith("--"));
const confirmed = args.includes("--confirm-restore");

const targetPath = resolve(process.cwd(), "data", "squad-planner.db");

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

if (!backupArg || !confirmed) {
  console.error("Usage: npm run db:restore -- <backup-path> --confirm-restore");
  console.error("This command overwrites ./data/squad-planner.db after creating a pre-restore backup.");
  process.exit(1);
}

const backupPath = resolve(process.cwd(), backupArg);

if (!existsSync(backupPath)) {
  console.error(`Backup file not found: ${backupPath}`);
  process.exit(1);
}

mkdirSync(dirname(targetPath), { recursive: true });

if (existsSync(targetPath)) {
  const preRestorePath = resolve(process.cwd(), "data", "backups", `squad-planner-pre-restore-${timestamp()}.db`);
  mkdirSync(dirname(preRestorePath), { recursive: true });
  copyFileSync(targetPath, preRestorePath);
  console.log(`Current database backed up first: ${preRestorePath}`);
}

copyFileSync(backupPath, targetPath);

for (const suffix of ["-wal", "-shm"]) {
  const sidecarPath = `${backupPath}${suffix}`;
  if (existsSync(sidecarPath)) {
    copyFileSync(sidecarPath, `${targetPath}${suffix}`);
  }
}

console.log(`Database restored from: ${backupPath}`);
