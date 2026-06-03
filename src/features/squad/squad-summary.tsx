import { Card } from "@/components/ui/card";

type Summary = {
  activeMemberCount: number;
  dailyGrossCapacityHours: number;
  futureAbsenceCount: number;
  holidayCount: number;
  absenceImpactByType: {
    VACATION: number;
    DAY_OFF: number;
  };
};

export function SquadSummary({ summary }: { summary: Summary }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <MetricCard id="active-members" label="Active members" value={summary.activeMemberCount.toString()} />
        <MetricCard id="daily-capacity" label="Daily capacity" value={`${summary.dailyGrossCapacityHours}h`} />
        <MetricCard id="future-absences" label="Future absences" value={summary.futureAbsenceCount.toString()} />
        <MetricCard id="holidays" label="Holidays" value={summary.holidayCount.toString()} />
      </div>
      <Card>
        <h2 className="text-base font-semibold">Absence impact by sprint</h2>
        <p className="mt-2 text-sm text-slate-600">Sprint impact appears after Phase 2 creates sprints.</p>
        <div className="mt-3 flex gap-2 text-sm text-slate-700">
          <span>Vacation: {summary.absenceImpactByType.VACATION}</span>
          <span>Day off: {summary.absenceImpactByType.DAY_OFF}</span>
        </div>
      </Card>
    </div>
  );
}

function MetricCard({ id, label, value }: { id: string; label: string; value: string }) {
  return (
    <Card data-testid={`metric-${id}`}>
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-xl font-semibold">{value}</div>
    </Card>
  );
}
