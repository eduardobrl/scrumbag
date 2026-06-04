import { SettingsForm } from "@/features/settings/settings-form";
import { getOrCreateSettings, toSettingsView } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = toSettingsView(await getOrCreateSettings());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal text-ink">Configurações</h1>
        <p className="mt-1 text-sm text-slate-600">Configure padrões locais de capacidade e conexão MCP.</p>
      </div>
      <SettingsForm initialSettings={settings} />
    </div>
  );
}
