import { AbsenceForm } from "@/features/squad/absence-form";
import { AbsenceTable } from "@/features/squad/absence-table";
import { HolidayForm } from "@/features/squad/holiday-form";
import { HolidayTable } from "@/features/squad/holiday-table";
import { MemberForm } from "@/features/squad/member-form";
import { MemberTable } from "@/features/squad/member-table";
import { SquadSummary } from "@/features/squad/squad-summary";
import { getCapacitySummary } from "@/lib/capacity-summary";
import { getOrCreateSettings, toSettingsView } from "@/lib/settings";
import { listAbsences, listHolidays, listSquadMembers, toAbsenceView, toHolidayView, toMemberView } from "@/lib/squad";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function SquadPage() {
  const [members, absences, holidays, settings, summary] = await Promise.all([
    listSquadMembers(),
    listAbsences(),
    listHolidays(),
    getOrCreateSettings(),
    getCapacitySummary()
  ]);
  const memberViews = members.map(toMemberView);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal text-ink">Squad</h1>
        <p className="mt-1 text-sm text-slate-600">Configure os dados locais da squad usados nos cálculos de capacidade.</p>
      </div>
      <SquadSummary summary={summary} />

      <div className="grid grid-cols-[360px_1fr] gap-4">
        <Card>
          <h2 className="text-base font-semibold">Novo membro</h2>
          <div className="mt-4">
            <MemberForm />
          </div>
        </Card>
        <Card>
          <h2 className="text-base font-semibold">Membros</h2>
          <div className="mt-4">
            <MemberTable members={memberViews} settings={toSettingsView(settings)} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-[360px_1fr] gap-4">
        <Card>
          <h2 className="text-base font-semibold">Nova ausência</h2>
          <div className="mt-4">
            <AbsenceForm members={memberViews} />
          </div>
        </Card>
        <Card>
          <h2 className="text-base font-semibold">Ausências</h2>
          <div className="mt-4">
            <AbsenceTable absences={absences.map(toAbsenceView)} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-[360px_1fr] gap-4">
        <Card>
          <h2 className="text-base font-semibold">Novo feriado</h2>
          <div className="mt-4">
            <HolidayForm />
          </div>
        </Card>
        <Card>
          <h2 className="text-base font-semibold">Feriados</h2>
          <div className="mt-4">
            <HolidayTable holidays={holidays.map(toHolidayView)} />
          </div>
        </Card>
      </div>
    </div>
  );
}
