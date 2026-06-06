import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function YearSelector({ year, label }: { year: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/timeline?year=${year - 1}`}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
        aria-label={`${label} ${year - 1}`}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </Link>
      <form action="/timeline" className="flex items-center gap-2">
        <label htmlFor="timeline-year" className="text-sm font-medium text-slate-600">
          {label}
        </label>
        <input
          id="timeline-year"
          name="year"
          type="number"
          min="2000"
          max="2100"
          defaultValue={year}
          className="h-9 w-24 rounded-md border border-slate-300 px-2 text-sm font-semibold text-ink focus:border-accent focus:outline-none"
        />
      </form>
      <Link
        href={`/timeline?year=${year + 1}`}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
        aria-label={`${label} ${year + 1}`}
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
