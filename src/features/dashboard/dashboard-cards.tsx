import { AlertTriangle, BarChart3, CheckCircle2, Flag, Gauge, Layers, ListChecks, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { DashboardData } from "@/lib/dashboard";

type Metric = {
  label: string;
  value: string;
  helper?: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  tone?: "neutral" | "success" | "warning" | "danger";
};

export function DashboardCards({ data }: { data: DashboardData }) {
  const releaseCapacityHelper =
    data.overCapacityDays > 0
      ? `Estouro da release: ${data.overCapacityDays.toFixed(1)}d`
      : `Sobra da release: ${Math.max(0, data.remainingCapacityDays).toFixed(1)}d`;
  const metrics: Metric[] = [
    {
      label: "Progresso",
      value: `${data.progress}%`,
      helper: "Conclusão da release",
      icon: BarChart3,
      tone: data.progress >= 80 ? "success" : "neutral"
    },
    { label: "Capacidade total", value: `${data.totalCapacityDays.toFixed(1)}d`, icon: Gauge },
    { label: "Esforço planejado", value: `${data.plannedEffortDays.toFixed(1)}d`, icon: ListChecks },
    {
      label: "Risco",
      value: data.risk === "Over capacity" ? "Acima da capacidade" : "No prazo",
      helper: releaseCapacityHelper,
      icon: AlertTriangle,
      tone: data.risk === "Over capacity" ? "danger" : "success"
    },
    { label: "Features", value: String(data.featureCount), icon: Layers },
    { label: "Histórias", value: String(data.storyCount), icon: Users },
    { label: "Histórias concluídas", value: String(data.finishedStoryCount), icon: CheckCircle2, tone: "success" },
    {
      label: "Histórias vazadas",
      value: String(data.leakedStoryCount),
      icon: Flag,
      tone: data.leakedStoryCount > 0 ? "warning" : "neutral"
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.label} className="min-h-32">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm text-slate-500">{metric.label}</div>
                <div className="mt-2 text-2xl font-semibold text-ink">{metric.value}</div>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-2">
                <Icon className="h-4 w-4 text-slate-600" aria-hidden />
              </div>
            </div>
            {metric.label === "Progresso" ? (
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-accent" style={{ width: `${data.progress}%` }} />
              </div>
            ) : null}
            {metric.helper ? (
              <div className="mt-3">
                <Badge tone={metric.tone ?? "neutral"}>{metric.helper}</Badge>
              </div>
            ) : metric.tone ? (
              <div className="mt-3">
                <Badge tone={metric.tone}>{metric.tone === "success" ? "Saudável" : "Atenção"}</Badge>
              </div>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
