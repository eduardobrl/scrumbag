import { describe, expect, it } from "vitest";
import { getSprintBoardColumnTitle, SPRINT_BOARD_COLUMNS } from "@/features/sprints/sprint-board";

describe("sprint board column rendering", () => {
  it("maps fixed columns to story statuses", () => {
    expect(SPRINT_BOARD_COLUMNS).toEqual([
      { title: "Backlog da Sprint", status: "SPRINT_BACKLOG" },
      { title: "Em Execução", status: "IN_PROGRESS" },
      { title: "Finalizado", status: "DONE" }
    ]);
    expect(getSprintBoardColumnTitle("SPRINT_BACKLOG")).toBe("Backlog da Sprint");
    expect(getSprintBoardColumnTitle("IN_PROGRESS")).toBe("Em Execução");
    expect(getSprintBoardColumnTitle("DONE")).toBe("Finalizado");
  });
});
