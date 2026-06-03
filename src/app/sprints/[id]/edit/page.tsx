import { notFound } from "next/navigation";
import { getSprintDetails } from "@/lib/sprints";
import { SprintEditForm } from "@/features/sprints/sprint-edit-form";

export default async function SprintEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sprint = await getSprintDetails(id);

  if (!sprint) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-normal text-ink">
          Edit {sprint.name}
        </h1>
      </div>

      <SprintEditForm
        id={sprint.id}
        initial={{
          name: sprint.name,
          goal: sprint.goal ?? "",
          startDate: sprint.startDate.toISOString().slice(0, 10),
          endDate: sprint.endDate.toISOString().slice(0, 10),
          status: sprint.status
        }}
      />
    </div>
  );
}
