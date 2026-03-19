export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-slate-700 rounded-full" />
        <div className="absolute inset-0 border-4 border-primary-500 rounded-full animate-spin" style={{ borderTopColor: 'transparent', borderRightColor: 'transparent' }} />
        <div className="absolute inset-2 border-4 border-accent-500 rounded-full animate-spin" style={{ borderBottomColor: 'transparent', borderLeftColor: 'transparent', animationDirection: 'reverse', animationDuration: '1.5s' }} />
      </div>
      <div className="text-center">
        <p className="text-slate-300 font-medium">Researching...</p>
        <p className="text-slate-500 text-sm mt-1">Searching academic journals and real-world experiences</p>
      </div>
      <div className="flex items-center gap-6 mt-2">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>📚</span>
          <span className="animate-pulse">Fetching research</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>💬</span>
          <span className="animate-pulse" style={{ animationDelay: '0.3s' }}>Gathering experiences</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>⚖️</span>
          <span className="animate-pulse" style={{ animationDelay: '0.6s' }}>Comparing data</span>
        </div>
      </div>
    </div>
  );
}
