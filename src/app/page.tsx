import { MemberList } from "@/features/squad/member-list";
import { MemberQuickCreate } from "@/features/squad/member-quick-create";
import { listSquadMembers } from "@/lib/squad";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const members = await listSquadMembers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal text-ink">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">Local planning foundation for squad setup and future release capacity.</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <div className="text-sm text-slate-500">Active release</div>
          <div className="mt-2 text-xl font-semibold">None</div>
        </Card>
        <Card>
          <div className="text-sm text-slate-500">Capacity</div>
          <div className="mt-2 text-xl font-semibold">--</div>
        </Card>
        <Card>
          <div className="text-sm text-slate-500">Squad members</div>
          <div className="mt-2 text-xl font-semibold">{members.length}</div>
        </Card>
        <Card>
          <div className="text-sm text-slate-500">Alerts</div>
          <div className="mt-2 text-xl font-semibold">0</div>
        </Card>
      </div>

      <div className="grid grid-cols-[360px_1fr] gap-4">
        <Card>
          <h2 className="text-base font-semibold">Create squad member</h2>
          <div className="mt-4">
            <MemberQuickCreate />
          </div>
        </Card>
        <Card>
          <h2 className="text-base font-semibold">Squad members</h2>
          <div className="mt-4">
            <MemberList members={members} />
          </div>
        </Card>
      </div>
    </div>
  );
}
