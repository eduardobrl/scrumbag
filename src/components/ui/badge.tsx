import { clsx } from "clsx";

type BadgeProps = {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
};

const tones = {
  neutral: "border-slate-300 bg-white text-slate-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-red-200 bg-red-50 text-red-800"
};

export function Badge({ children, tone = "neutral" }: BadgeProps) {
  return (
    <span className={clsx("inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium", tones[tone])}>
      {children}
    </span>
  );
}
