export type SprintInput = {
  name: string;
  startDate: Date;
  endDate: Date;
};

export type GenerateSprintsInput = {
  startDate: Date;
  endDate: Date;
  defaultSprintLengthBusinessDays: number;
  holidays?: Date[];
};

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isBusinessDay(date: Date, holidaySet: Set<string>): boolean {
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) return false;
  if (holidaySet.has(toDateKey(date))) return false;
  return true;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function normalizeDate(date: Date): Date {
  return new Date(date.toISOString().slice(0, 10) + "T00:00:00.000Z");
}

export function generateSprintsForRelease({
  startDate,
  endDate,
  defaultSprintLengthBusinessDays,
  holidays = []
}: GenerateSprintsInput): SprintInput[] {
  if (defaultSprintLengthBusinessDays <= 0) {
    throw new Error("defaultSprintLengthBusinessDays must be greater than 0");
  }

  const start = normalizeDate(startDate);
  const end = normalizeDate(endDate);

  if (end < start) {
    throw new Error("endDate must be on or after startDate");
  }

  const holidaySet = new Set(holidays.map(toDateKey));

  // Enumerate all dates in range and collect business days
  const dates: Date[] = [];
  const businessDayIndices: number[] = [];

  let current = new Date(start);
  while (current <= end) {
    const index = dates.length;
    dates.push(new Date(current));
    if (isBusinessDay(current, holidaySet)) {
      businessDayIndices.push(index);
    }
    current = addDays(current, 1);
  }

  if (businessDayIndices.length === 0) {
    return [];
  }

  // Partition business days into chunks.
  // Each chunk (except the last) has exactly defaultSprintLengthBusinessDays.
  // The last chunk absorbs all remaining business days.
  const chunks: { startIndex: number; endIndex: number }[] = [];
  let bizCursor = 0;

  while (bizCursor < businessDayIndices.length) {
    const remainingBizDays = businessDayIndices.length - bizCursor;

    let chunkBizCount: number;
    if (remainingBizDays <= defaultSprintLengthBusinessDays) {
      // Last chunk: absorb all remaining
      chunkBizCount = remainingBizDays;
    } else if (remainingBizDays < defaultSprintLengthBusinessDays * 2) {
      // Not enough for two full chunks; merge remainder into this chunk
      chunkBizCount = remainingBizDays;
    } else {
      chunkBizCount = defaultSprintLengthBusinessDays;
    }

    const startIndex = businessDayIndices[bizCursor];
    const endIndex = businessDayIndices[bizCursor + chunkBizCount - 1];
    chunks.push({ startIndex, endIndex });

    bizCursor += chunkBizCount;
  }

  // Map chunks to sprint inputs with contiguous calendar ranges
  const sprints: SprintInput[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    let sprintStart = dates[chunk.startIndex];
    let sprintEnd = dates[chunk.endIndex];

    // Ensure contiguous calendar ranges
    if (i > 0) {
      sprintStart = addDays(sprints[i - 1].endDate, 1);
    }

    if (i === chunks.length - 1) {
      sprintEnd = new Date(end);
    }

    sprints.push({
      name: `Sprint ${i + 1}`,
      startDate: new Date(sprintStart),
      endDate: new Date(sprintEnd)
    });
  }

  return sprints;
}
