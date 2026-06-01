import { useState } from "react";

interface CompletionDateDialogProps {
  itemTitle: string;
  onConfirm: (date: string) => void;
  onCancel: () => void;
}

export function CompletionDateDialog({
  itemTitle,
  onConfirm,
  onCancel,
}: CompletionDateDialogProps) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(date);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-4 shadow-lg">
        <h3 className="text-base font-semibold text-gray-900">
          Quando este item foi concluido?
        </h3>
        <p className="mt-1 text-sm text-gray-600">{itemTitle}</p>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => valid && onConfirm(date)}
            disabled={!valid}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

export default CompletionDateDialog;
