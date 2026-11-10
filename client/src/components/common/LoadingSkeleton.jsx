import React from 'react';

export const LoadingSkeleton = ({ rows = 5 }) => {
  return (
    <div className="space-y-4 animate-pulse p-4">
      <div className="h-8 bg-slate-200 rounded w-1/4 mb-6"></div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-slate-100 rounded-xl border border-slate-200"></div>
        ))}
      </div>
      <div className="space-y-3">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="h-12 bg-slate-100 rounded-lg w-full"></div>
        ))}
      </div>
    </div>
  );
};
