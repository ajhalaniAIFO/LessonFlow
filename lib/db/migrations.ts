import type Database from "better-sqlite3";
import { SETTINGS_TABLE_SQL } from "@/lib/db/schema";

export function runMigrations(db: Database.Database) {
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(SETTINGS_TABLE_SQL);
}
