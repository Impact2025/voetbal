const pulse = 'animate-pulse bg-gray-700 rounded';

export const PlayerCardSkeleton = () => (
  <div className="shrink-0 flex flex-col gap-2 p-3 rounded-lg border border-gray-700 bg-gray-900/60 w-36">
    <div className="flex items-center gap-3">
      <div className={`${pulse} w-10 h-10 rounded-full`} />
      <div className={`${pulse} h-4 flex-1`} />
    </div>
    <div className={`${pulse} h-3 w-24`} />
  </div>
);

export const EvaluationSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    {Array.from({ length: 7 }).map((_, i) => (
      <div key={i} className="space-y-1">
        <div className="bg-gray-700 rounded h-3 w-24" />
        <div className="bg-gray-700 rounded-full h-2 w-full" />
      </div>
    ))}
  </div>
);
