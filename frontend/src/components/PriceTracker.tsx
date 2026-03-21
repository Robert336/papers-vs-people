interface PriceTrackerProps {
  totalCost: number;
  deepDiveCount: number;
}

export default function PriceTracker({ totalCost, deepDiveCount }: PriceTrackerProps) {
  return (
    <div className="fixed right-4 top-24 z-30 bg-white/90 backdrop-blur border border-slate-200 rounded-lg px-3 py-2 text-xs shadow-md">
      <div className="text-slate-500 mb-1">Token Spend</div>
      <div className="text-green-600 font-semibold">${totalCost.toFixed(4)}</div>
      <div className="text-slate-400 mt-0.5">{deepDiveCount} queries</div>
    </div>
  );
}
