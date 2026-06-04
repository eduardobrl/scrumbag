import { AssistantChat } from "@/features/assistant/assistant-chat";
import { getReleaseForView } from "@/lib/releases";

export const dynamic = "force-dynamic";

export default async function AssistantPage({
  searchParams
}: {
  searchParams?: Promise<{ releaseId?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const activeRelease = await getReleaseForView(sp.releaseId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal text-ink">Assistente IA</h1>
        <p className="mt-1 text-sm text-slate-600">
          {activeRelease
            ? `${activeRelease.name} | ${activeRelease.status}`
            : "Nenhuma release ativa configurada"}
        </p>
      </div>
      <AssistantChat />
    </div>
  );
}
