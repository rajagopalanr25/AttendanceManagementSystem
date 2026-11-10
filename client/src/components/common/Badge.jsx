import React from 'react';

export const Badge = ({ children, variant = 'default', size = 'md', className = '' }) => {
  const variantStyles = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    present: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    absent: 'bg-rose-50 text-rose-700 border-rose-200',
    onDuty: 'bg-blue-50 text-blue-700 border-blue-200',
    eligible: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    shortage: 'bg-amber-50 text-amber-700 border-amber-200',
    critical: 'bg-rose-50 text-rose-700 border-rose-200',
    admin: 'bg-purple-50 text-purple-700 border-purple-200',
    teacher: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    student: 'bg-sky-50 text-sky-700 border-sky-200',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    inactive: 'bg-slate-100 text-slate-500 border-slate-200'
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1 font-medium',
    lg: 'text-sm px-3 py-1 font-medium'
  };

  const style = variantStyles[variant] || variantStyles.default;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${style} ${sizeStyles[size]} ${className}`}
    >
      {variant === 'present' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
      {variant === 'absent' && <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />}
      {variant === 'onDuty' && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
      {children}
    </span>
  );
};

