import React from 'react';
import { BookingStatus } from '../../types';
import { Clock, CheckCircle2, Navigation, Wrench, ShieldCheck, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: BookingStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  const configs: Record<
    BookingStatus,
    { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
  > = {
    confirmed: {
      label: 'Confirmed',
      bg: 'bg-cyan-50',
      text: 'text-cyan-700',
      border: 'border-cyan-200',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" />,
    },
    worker_assigned: {
      label: 'Worker Assigned',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />,
    },
    en_route: {
      label: 'Worker En Route',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      icon: <Navigation className="w-3.5 h-3.5 text-amber-600 animate-pulse" />,
    },
    job_started: {
      label: 'Job Started',
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
      icon: <Wrench className="w-3.5 h-3.5 text-purple-600" />,
    },
    completed: {
      label: 'Completed',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
    },
    cancelled: {
      label: 'Cancelled',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      icon: <XCircle className="w-3.5 h-3.5 text-rose-600" />,
    },
  };

  const current = configs[status] || configs.confirmed;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${current.bg} ${current.text} ${current.border} ${sizeClasses[size]}`}
    >
      {showIcon && current.icon}
      <span>{current.label}</span>
    </span>
  );
};
