import type { AppSettings } from "@prisma/client";
import { prisma } from "@/lib/db";
import { mergeErrors, requireText, type ValidationResult } from "@/lib/validation";

export const DEFAULT_SETTINGS = {
  workingHoursFullTime: 8,
  workingHoursIntern: 6,
  standardDayHours: 8,
  mcpHost: "localhost",
  mcpPort: 3333,
  mcpEnabled: false
} as const;

export type AppSettingsInput = typeof DEFAULT_SETTINGS;

type SettingsUpdateInput = {
  workingHoursFullTime: unknown;
  workingHoursIntern: unknown;
  standardDayHours: unknown;
  mcpHost: unknown;
  mcpPort: unknown;
  mcpEnabled: unknown;
};

function positiveNumber(value: unknown, field: string): ValidationResult<number> {
  const numeric = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return { ok: false, errors: { [field]: "Must be greater than 0" } };
  }

  return { ok: true, data: numeric };
}

function portNumber(value: unknown): ValidationResult<number> {
  const numeric = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(numeric) || numeric < 1 || numeric > 65535) {
    return { ok: false, errors: { mcpPort: "Must be an integer from 1 to 65535" } };
  }

  return { ok: true, data: numeric };
}

function booleanValue(value: unknown): ValidationResult<boolean> {
  if (typeof value === "boolean") {
    return { ok: true, data: value };
  }

  return { ok: false, errors: { mcpEnabled: "Must be true or false" } };
}

export function validateSettingsInput(input: SettingsUpdateInput) {
  const workingHoursFullTime = positiveNumber(input.workingHoursFullTime, "workingHoursFullTime");
  const workingHoursIntern = positiveNumber(input.workingHoursIntern, "workingHoursIntern");
  const standardDayHours = positiveNumber(input.standardDayHours, "standardDayHours");
  const mcpHost = requireText(input.mcpHost, "mcpHost");
  const mcpPort = portNumber(input.mcpPort);
  const mcpEnabled = booleanValue(input.mcpEnabled);

  if (
    !workingHoursFullTime.ok ||
    !workingHoursIntern.ok ||
    !standardDayHours.ok ||
    !mcpHost.ok ||
    !mcpPort.ok ||
    !mcpEnabled.ok
  ) {
    return {
      ok: false as const,
      errors: mergeErrors(
        !workingHoursFullTime.ok ? workingHoursFullTime.errors : undefined,
        !workingHoursIntern.ok ? workingHoursIntern.errors : undefined,
        !standardDayHours.ok ? standardDayHours.errors : undefined,
        !mcpHost.ok ? mcpHost.errors : undefined,
        !mcpPort.ok ? mcpPort.errors : undefined,
        !mcpEnabled.ok ? mcpEnabled.errors : undefined
      )
    };
  }

  return {
    ok: true as const,
    data: {
      workingHoursFullTime: workingHoursFullTime.data,
      workingHoursIntern: workingHoursIntern.data,
      standardDayHours: standardDayHours.data,
      mcpHost: mcpHost.data,
      mcpPort: mcpPort.data,
      mcpEnabled: mcpEnabled.data
    }
  };
}

export async function getOrCreateSettings(): Promise<AppSettings> {
  const existing = await prisma.appSettings.findFirst({
    orderBy: { createdAt: "asc" }
  });

  if (existing) {
    return existing;
  }

  return prisma.appSettings.create({
    data: DEFAULT_SETTINGS
  });
}

export async function updateSettings(input: SettingsUpdateInput) {
  const validated = validateSettingsInput(input);

  if (!validated.ok) {
    return validated;
  }

  const existing = await getOrCreateSettings();
  const settings = await prisma.appSettings.update({
    where: { id: existing.id },
    data: validated.data
  });

  return { ok: true as const, data: settings };
}

export function toSettingsView(settings: AppSettings) {
  return {
    id: settings.id,
    workingHoursFullTime: settings.workingHoursFullTime,
    workingHoursIntern: settings.workingHoursIntern,
    standardDayHours: settings.standardDayHours,
    mcpHost: settings.mcpHost,
    mcpPort: settings.mcpPort,
    mcpEnabled: settings.mcpEnabled
  };
}
