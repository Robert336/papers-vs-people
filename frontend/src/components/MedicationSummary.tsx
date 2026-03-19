interface MedicationSummaryProps {
  name: string;
  summary: string;
}

export default function MedicationSummary({ name, summary }: MedicationSummaryProps) {
  const paragraphs = summary.split('\n').filter((p) => p.trim());

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <h2 className="text-2xl font-bold text-slate-100 mb-4">{name}</h2>
      <div className="space-y-3">
        {paragraphs.map((para, i) => (
          <p key={i} className="text-slate-300 leading-relaxed text-base">
            {para}
          </p>
        ))}
      </div>
    </div>
  );
}
