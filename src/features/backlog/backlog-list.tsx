import { Badge } from "@/components/ui/badge";
import { PlanStoryDialog } from "@/features/backlog/plan-story-dialog";

type BacklogStory = {
  id: string;
  title: string;
  featureName: string;
  status: string;
  storyPoints: number | null;
  estimatedDays: number | null;
  currentSprintName: string;
};

type SprintOption = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
};

const STATUS_LABEL: Record<string, string> = {
  BACKLOG: "Backlog",
  SPRINT_BACKLOG: "Backlog da Sprint",
  IN_PROGRESS: "Em andamento",
  DONE: "Concluída",
  CANCELLED: "Cancelada"
};

export function BacklogList({ stories, sprints }: { stories: BacklogStory[]; sprints: SprintOption[] }) {
  if (stories.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-white p-6 text-center text-sm text-slate-600">
        Nenhuma história corresponde aos filtros do backlog.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full min-w-[820px] border-collapse text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-3 py-2">História</th>
            <th className="px-3 py-2">Feature</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">SP</th>
            <th className="px-3 py-2">Dias</th>
            <th className="px-3 py-2">Sprint</th>
            <th className="px-3 py-2">Ação</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line bg-white">
          {stories.map((story) => (
            <tr key={story.id}>
              <td className="px-3 py-3 font-medium">{story.title}</td>
              <td className="px-3 py-3">{story.featureName}</td>
              <td className="px-3 py-3">
                <Badge tone={story.status === "CANCELLED" ? "danger" : "neutral"}>
                  {STATUS_LABEL[story.status] ?? story.status}
                </Badge>
              </td>
              <td className="px-3 py-3">{story.storyPoints ?? "-"}</td>
              <td className="px-3 py-3">{story.estimatedDays ?? "-"}d</td>
              <td className="px-3 py-3">{story.currentSprintName}</td>
              <td className="px-3 py-3">
                {story.status !== "CANCELLED" && story.currentSprintName === "Backlog" ? (
                  <PlanStoryDialog storyId={story.id} storyTitle={story.title} sprints={sprints} />
                ) : (
                  <span className="text-xs text-slate-500">Sem ação</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
