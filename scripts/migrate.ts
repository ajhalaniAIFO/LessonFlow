import { getDatabasePath, getDatabase } from "@/lib/db/client";

getDatabase();
console.log(`Database ready at ${getDatabasePath()}`);
