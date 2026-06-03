import { describe, expect, it } from "vitest";
import { RoleType } from "@prisma/client";
import { validateSquadMemberInput } from "@/lib/squad";

describe("squad member validation", () => {
  it("rejects an empty name", () => {
    const result = validateSquadMemberInput({ name: " ", roleType: RoleType.FULL_TIME });

    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.errors.name).toBe("Required");
  });

  it("accepts full-time and intern role types", () => {
    expect(validateSquadMemberInput({ name: "Ana", roleType: RoleType.FULL_TIME }).ok).toBe(true);
    expect(validateSquadMemberInput({ name: "Bruno", roleType: RoleType.INTERN }).ok).toBe(true);
  });
});
