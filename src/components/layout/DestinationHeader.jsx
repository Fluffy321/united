import React from 'react';

export default function DestinationHeader({
  icon: Icon,
  title,
  help,
  leading,
  actions,
  sticky = true,
  className = '',
  toolbarClassName = '',
}) {
  return (
    <div
      className={`${sticky ? 'sticky top-0' : 'relative'} z-[60] shrink-0 px-3 pt-3 pb-2 sm:px-4 sm:pt-4 ${className}`}
    >
      <div className={`glass-toolbar mobile-page flex min-h-[56px] items-center justify-between rounded-[24px] px-3 py-2 ${toolbarClassName}`}>
        {leading || (
          <div className="flex min-w-0 items-center gap-2">
            {Icon && <Icon className="h-[18px] w-[18px] shrink-0 text-blue-600" strokeWidth={2.5} />}
            <h1 className="truncate text-[17px] font-black text-slate-950">{title}</h1>
            {help}
          </div>
        )}

        {actions && (
          <div className="flex shrink-0 items-center gap-1">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
