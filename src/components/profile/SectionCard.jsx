import React from 'react';

export default function SectionCard({ title, children, action, icon: Icon }) {
  return (
    <div className="px-6 py-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-blue-600" />}
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            {action.label}
          </button>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}