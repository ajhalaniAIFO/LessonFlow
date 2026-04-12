import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { runMigrations } from "@/lib/db/migrations";

let database: Database.Database | null = null;

function resolveDatabasePath() {
  const customPath = process.env.LESSONFLOW_DB_PATH?.trim();
  if (customPath) {
    return path.resolve(customPath);
  }

  return path.join(process.cwd(), "data", "app.db");
}

function ensureDataDir(dbPath: string) {
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

export function getDatabase() {
  if (database) {
    return database;
  }

  const dbPath = resolveDatabasePath();
  ensureDataDir(dbPath);
  database = new Database(dbPath);
  runMigrations(database);
  return database;
}

export function getDatabasePath() {
  return resolveDatabasePath();
}

export function resetDatabase() {
  if (!database) {
    return;
  }

  database.close();
  database = null;
}
