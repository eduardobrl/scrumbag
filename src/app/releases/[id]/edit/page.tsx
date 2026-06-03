import { ReleaseEditForm } from "@/features/releases/release-edit-form";
import { getReleaseDetails, toReleaseView } from "@/lib/releases";
import { notFound } from "next/navigation";

export default async function ReleaseEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const release = await getReleaseDetails(id);

  if (!release) {
    notFound();
  }

  const view = toReleaseView(release);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-normal text-ink">Edit release</h1>
      </div>

      <ReleaseEditForm
        id={id}
        initial={{
          name: view.name,
          objective: view.objective,
          description: view.description,
          startDate: view.startDate,
          endDate: view.endDate,
          defaultSprintLengthBusinessDays: view.defaultSprintLengthBusinessDays,
          meetingPercentage: view.meetingPercentage,
          supportPercentage: view.supportPercentage,
          status: view.status
        }}
      />
    </div>
  );
}
