import { AssistantChat } from "@/features/assistant/assistant-chat";
import { getActiveReleaseSummary } from "@/lib/releases";

export const dynamic = "force-dynamic";

export default async function AssistantPage() {
  const activeRelease = await getActiveReleaseSummary();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal text-ink">Assistant AI</h1>
        <p className="mt-1 text-sm text-slate-600">
          {activeRelease
            ? `${activeRelease.name} | ${activeRelease.status}`
            : "No active release configured"}
        </p>
      </div>
      <AssistantChat />
    </div>
  );
}
