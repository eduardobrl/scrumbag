export default function FeatureSplitSuggestion({ suggestion }: { suggestion: string | null }) {
  if (!suggestion) return null;
  return (
    <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
      {suggestion}
    </p>
  );
}
