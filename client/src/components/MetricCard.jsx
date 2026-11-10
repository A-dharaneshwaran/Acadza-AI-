import React from 'react';

/**
 * MetricCard
 * Reusable dark academic summary card displaying a single operational indicator.
 */
export default function MetricCard({ 
  label, 
  value, 
  sublabel, 
  icon: Icon, 
  accentColor = 'text-[#6ba883]',
  badgeText = null,
  badgeType = 'default' 
}) {
  return (
    <div className="p-4 rounded-lg bg-[#161a18] border border-[#2b312e] hover:border-[#38413c] transition-colors">
      <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-[#78827c]">
        <span>{label}</span>
        {Icon && <Icon className={`w-4 h-4 ${accentColor}`} />}
      </div>

      <div className="flex items-baseline justify-between mt-2.5">
        <div className="text-2xl font-semibold text-[#f4f3ee] tracking-tight">
          {value !== undefined && value !== null ? value : '—'}
        </div>
        {badgeText && (
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
            badgeType === 'danger'
              ? 'bg-[#3b1f1c] text-[#f2b8b3] border-[#5c2b26]'
              : badgeType === 'warning'
              ? 'bg-[#2b271d] text-[#e0c082] border-[#4d4229]'
              : 'bg-[#1e2722] text-[#8fd1a8] border-[#2e4437]'
          }`}>
            {badgeText}
          </span>
        )}
      </div>

      {sublabel && (
        <p className="text-[11px] text-[#626965] mt-1.5 truncate">
          {sublabel}
        </p>
      )}
    </div>
  );
}

