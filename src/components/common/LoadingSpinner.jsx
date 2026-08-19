import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ message = "Loading store data...", fullPage = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3 py-12 px-4 text-center">
      <Loader2 className="w-9 h-9 text-slate-800 animate-spin" />
      {message && <p className="text-sm font-medium text-slate-600 animate-pulse">{message}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;
