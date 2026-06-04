"use client";

import Link from "next/link";
import { AlertCircle, ChevronDown, Info, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { ReleaseAlert } from "@/lib/alerts";

const ICONS = {
  info: Info,
  warning: TriangleAlert,
  danger: AlertCircle
};

const TONES = {
  info: "neutral",
  warning: "warning",
  danger: "danger"
} as const;

export function AlertPanel({ alerts }: { alerts: ReleaseAlert[] }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">Alertas</h2>
          <p className="mt-1 text-sm text-slate-600">{alerts.length} sinais de saúde da release</p>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <ChevronDown className={`h-4 w-4 transition ${collapsed ? "-rotate-90" : ""}`} aria-hidden />
          {collapsed ? "Mostrar" : "Ocultar"}
        </button>
      </div>

      {!collapsed ? (
        <div className="mt-4 space-y-2">
          {alerts.length === 0 ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              Nenhum alerta ativo no painel.
            </div>
          ) : (
            alerts.map((alert, index) => {
              const Icon = ICONS[alert.severity];
              const content = (
                <div className="flex items-center gap-3 rounded-md border border-line bg-slate-50 p-3 text-sm hover:bg-white">
                  <Icon className="h-4 w-4 shrink-0 text-slate-600" aria-hidden />
                  <span className="flex-1 text-slate-700">{alert.message}</span>
                  <Badge tone={TONES[alert.severity]}>{alert.severity}</Badge>
                </div>
              );

              return alert.link ? (
                <Link href={alert.link} key={`${alert.type}-${index}`}>
                  {content}
                </Link>
              ) : (
                <div key={`${alert.type}-${index}`}>{content}</div>
              );
            })
          )}
        </div>
      ) : null}
    </Card>
  );
}
