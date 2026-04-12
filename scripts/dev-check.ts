import { getDatabasePath, getDatabase } from "@/lib/db/client";
import { getProvider } from "@/lib/server/llm/provider-registry";
import { getModelSettings } from "@/lib/server/settings/settings-service";

async function main() {
  getDatabase();
  const settings = await getModelSettings();
  const provider = getProvider(settings.provider);

  console.log("Database path:", getDatabasePath());
  console.log("Saved provider:", settings.provider);
  console.log("Provider loaded:", provider.constructor.name);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
