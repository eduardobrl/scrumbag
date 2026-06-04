export function normalizeDateOnly(date: Date): Date {
  return new Date(`${date.toISOString().slice(0, 10)}T00:00:00.000Z`);
}

export function isBusinessDay(date: Date): boolean {
  const day = date.getUTCDay();
  return day !== 0 && day !== 6;
}

export function eachBusinessDayInRange(startDate: Date, endDate: Date): Date[] {
  const days: Date[] = [];
  const current = normalizeDateOnly(startDate);
  const end = normalizeDateOnly(endDate);

  while (current <= end) {
    if (isBusinessDay(current)) {
      days.push(new Date(current));
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return days;
}

export function countBusinessDaysInRange(startDate: Date | string, endDate: Date | string): number {
  const start = typeof startDate === "string" ? new Date(`${startDate}T00:00:00.000Z`) : startDate;
  const end = typeof endDate === "string" ? new Date(`${endDate}T00:00:00.000Z`) : endDate;

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 0;
  }

  return eachBusinessDayInRange(start, end).length;
}
