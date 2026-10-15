export function Shimmer({ className = '' }) {
  return (
    <div className={`relative overflow-hidden bg-cream-100 rounded-lg ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite]
                      bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

export function MenuSkeleton() {
  return (
    <div className="px-5 py-5 grid sm:grid-cols-2 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card p-4 flex gap-4">
          <Shimmer className="w-20 h-20 !rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Shimmer className="h-5 w-3/4" />
            <Shimmer className="h-3 w-full" />
            <Shimmer className="h-3 w-2/3" />
            <div className="flex justify-between pt-2">
              <Shimmer className="h-3 w-16" />
              <Shimmer className="h-7 w-16 !rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function OrdersSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card p-5 space-y-3">
          <div className="flex justify-between">
            <div className="space-y-2 flex-1">
              <Shimmer className="h-5 w-24" />
              <Shimmer className="h-3 w-32" />
            </div>
            <Shimmer className="h-6 w-20 !rounded-full" />
          </div>
          <div className="space-y-2">
            <Shimmer className="h-3 w-full" />
            <Shimmer className="h-3 w-5/6" />
            <Shimmer className="h-3 w-4/6" />
          </div>
          <div className="flex justify-between pt-2">
            <Shimmer className="h-6 w-16" />
            <Shimmer className="h-7 w-20 !rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-5">
        {[0, 1].map(i => (
          <div key={i} className="card p-6">
            <Shimmer className="h-3 w-24 mb-3" />
            <Shimmer className="h-10 w-32" />
          </div>
        ))}
      </div>
      <div className="card p-6 space-y-3">
        <Shimmer className="h-6 w-40 mb-4" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Shimmer className="w-7 h-7 !rounded-full" />
            <Shimmer className="h-3 flex-1" />
            <Shimmer className="h-3 w-24" />
            <Shimmer className="h-3 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}