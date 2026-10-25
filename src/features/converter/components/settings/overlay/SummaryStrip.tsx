import type React from "react";

interface SummaryCell {
  label: string;
  value: React.ReactNode;
}

interface SummaryStripProps {
  cells: SummaryCell[];
}

export function SummaryStrip({ cells }: SummaryStripProps) {
  return (
    <div className="grid overflow-hidden rounded-[12px] border border-white/[0.09] bg-white/[0.03] sm:grid-cols-2">
      {cells.map((cell, index) => (
        <div
          className={
            index === 0
              ? "flex min-h-[70px] min-w-0 flex-col justify-center gap-1 px-5 py-4"
              : "flex min-h-[70px] min-w-0 flex-col justify-center gap-1 border-t border-white/[0.08] px-5 py-4 sm:border-t-0 sm:border-l"
          }
          key={cell.label}
        >
          <span className="text-[11px] leading-[14px] tracking-wide text-white/31">
            {cell.label}
          </span>
          <div className="min-w-0 text-[15px] leading-[19px] font-semibold text-white">
            {cell.value}
          </div>
        </div>
      ))}
    </div>
  );
}
