import { MemberList } from "@/features/squad/member-list";
import { MemberQuickCreate } from "@/features/squad/member-quick-create";
import { listSquadMembers } from "@/lib/squad";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function SquadPage() {
  const members = await listSquadMembers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal text-ink">Squad</h1>
        <p className="mt-1 text-sm text-slate-600">Configure the local squad data used by future capacity calculations.</p>
      </div>
      <div className="grid grid-cols-[360px_1fr] gap-4">
        <Card>
          <h2 className="text-base font-semibold">New member</h2>
          <div className="mt-4">
            <MemberQuickCreate />
          </div>
        </Card>
        <Card>
          <h2 className="text-base font-semibold">Members</h2>
          <div className="mt-4">
            <MemberList members={members} />
          </div>
        </Card>
      </div>
    </div>
  );
}
