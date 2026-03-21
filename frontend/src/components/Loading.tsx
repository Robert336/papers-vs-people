export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-80 max-w-full">
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full animate-pulse" style={{ width: '60%' }} />
        </div>
      </div>
      <div className="text-center">
        <p className="text-slate-600 font-medium">Researching...</p>
        <p className="text-slate-400 text-sm mt-1">Searching academic journals and real-world experiences</p>
      </div>
      <div className="flex items-center gap-6 mt-2">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>📘</span>
          <span className="animate-pulse">Fetching research</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>📲</span>
          <span className="animate-pulse" style={{ animationDelay: '0.3s' }}>Gathering experiences</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>⚖</span>
          <span className="animate-pulse" style={{ animationDelay: '0.6s' }}>Comparing data</span>
        </div>
      </div>
    </div>
  );
}
