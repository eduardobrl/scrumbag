import type { FeatureReassignmentUndo } from "@/lib/features";

export type FeatureMoveToastState = {
  message: string;
  undo: FeatureReassignmentUndo;
} | null;

export function FeatureMoveToast({
  toast,
  undoing,
  undoLabel,
  onUndo,
  onDismiss
}: {
  toast: FeatureMoveToastState;
  undoing: boolean;
  undoLabel: string;
  onUndo: () => void;
  onDismiss: () => void;
}) {
  if (!toast) {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-30 w-80 rounded-md border border-line bg-white p-4 shadow-lg">
      <div className="text-sm font-medium text-ink">{toast.message}</div>
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={onDismiss}
          className="h-9 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          OK
        </button>
        <button
          type="button"
          onClick={onUndo}
          disabled={undoing}
          className="h-9 rounded-md bg-accent px-3 text-sm font-medium text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {undoing ? "..." : undoLabel}
        </button>
      </div>
    </div>
  );
}
