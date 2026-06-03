import { ReleaseDetail } from "@/features/releases/release-detail";
import { getReleaseDetails, toReleaseView } from "@/lib/releases";
import { notFound } from "next/navigation";

export default async function ReleaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const release = await getReleaseDetails(id);

  if (!release) {
    notFound();
  }

  const view = toReleaseView(release);

  return <ReleaseDetail release={view} />;
}
