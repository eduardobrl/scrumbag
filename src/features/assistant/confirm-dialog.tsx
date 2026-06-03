"use client";

import { Button } from "@/components/ui/button";
import type { ToolCallRequest } from "@/lib/ai";

export function ConfirmDialog({
  toolCall,
  onConfirm,
  onCancel
}: {
  toolCall: ToolCallRequest;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-6">
      <div className="w-full max-w-lg rounded-lg border border-line bg-white p-5 shadow-lg">
        <h2 className="text-lg font-semibold text-ink">Confirm sensitive operation</h2>
        <p className="mt-2 text-sm text-slate-600">
          This tool can change planning data. Review the operation before execution.
        </p>
        <div className="mt-4 rounded-md border border-line bg-slate-50 p-3 text-sm">
          <div className="font-medium text-slate-800">{toolCall.name}</div>
          <pre className="mt-2 overflow-auto text-xs text-slate-600">{JSON.stringify(toolCall.arguments, null, 2)}</pre>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm}>
            Confirm and execute
          </Button>
        </div>
      </div>
    </div>
  );
}
