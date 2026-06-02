import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readSource(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("sprint board refresh after scope changes", () => {
  test("wires sprint scope mutations to a board reload", () => {
    const app = readSource("src/App.tsx");
    const sprintDetail = readSource("src/components/SprintDetailScreen.tsx");
    const planningWorkspace = readSource("src/components/SprintPlanningWorkspace.tsx");
    const sprintBoard = readSource("src/components/SprintBoard.tsx");

    expect(planningWorkspace).toContain("onScopeChanged?: () => void");
    expect(planningWorkspace).toMatch(
      /function handleChanged\(\) \{\s*setRefreshKey\(\(key\) => key \+ 1\);\s*onScopeChanged\?\.\(\);\s*\}/s
    );

    expect(sprintBoard).toContain("refreshKey?: number");
    expect(sprintBoard).toMatch(
      /export function SprintBoard\(\{\s*sprint,\s*refreshKey = 0,\s*onSprintChanged,\s*\}: SprintBoardProps\)/
    );
    expect(sprintBoard).toMatch(
      /useEffect\(\(\) => \{\s*refreshBoard\(\);\s*\}, \[sprint\.id, refreshKey\]\);/s
    );

    expect(app).toContain("<SprintDetailScreen");
    expect(sprintDetail).toContain("const [refreshKey, setRefreshKey] = useState(0);");
    expect(sprintDetail).toMatch(
      /function handleScopeChanged\(\) \{\s*setRefreshKey\(\(key\) => key \+ 1\);\s*\}/s
    );
    expect(sprintDetail).toMatch(
      /<SprintPlanningWorkspace\s+sprint=\{sprint\}\s+onScopeChanged=\{handleScopeChanged\}\s+\/>/s
    );
    expect(sprintDetail).toMatch(
      /<SprintBoard\s+sprint=\{sprint\}\s+refreshKey=\{refreshKey\}/s
    );
  });
});
