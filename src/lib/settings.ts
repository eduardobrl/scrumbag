export const DEFAULT_SETTINGS = {
  workingHoursFullTime: 8,
  workingHoursIntern: 6,
  standardDayHours: 8,
  mcpHost: "localhost",
  mcpPort: 3333,
  mcpEnabled: false
} as const;

export type AppSettingsInput = typeof DEFAULT_SETTINGS;
