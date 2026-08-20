import React from 'react';

/**
 * AnalyticsStrip – a reusable Material‑Design‑style analytics bar.
 *
 * Props:
 *   items: Array of objects with shape { label: string, value: string, color: string }
 *          `color` should correspond to a Tailwind color key (e.g. "emerald", "blue", "amber", "rose").
 *
 * The component renders four chips (rounded‑xl) with a background derived from the
 * provided color palette and displays the label/value pair.
 */
export const AnalyticsStrip = ({ items }) => {
  const displayedItems = (items && items.length === 4 ? items : [
    { label: 'Metric 1', value: '--', color: 'emerald' },
    { label: 'Metric 2', value: '--', color: 'blue' },
    { label: 'Metric 3', value: '--', color: 'amber' },
    { label: 'Metric 4', value: '--', color: 'rose' },
  ]);

  const bgClass = (color) => `bg-${color}-50`;
  const textClass = (color) => `text-${color}-800`;

  return (
    <div className="bg-white border-b border-gray-200 py-4 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {displayedItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2.5">
              <span className={`w-2 h-2 rounded-full ${bgClass(item.color)} shrink-0`} />
              <div>
                <strong className={`${textClass(item.color)} block font-bold`}>{item.label}</strong>
                <span className="text-slate-500 text-[11px]">{item.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
