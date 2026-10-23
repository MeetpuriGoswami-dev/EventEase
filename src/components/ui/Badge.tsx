import React from 'react';
import { EventType, TaskPriority, TaskStatus, VendorStatus } from '@/types';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
}

export function Badge({ variant = 'default', className = '', children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]',
    success: 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]',
    warning: 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]',
    danger: 'bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]',
    info: 'bg-[#E0F2FE] text-[#0284C7] border-[#BAE6FD]',
    purple: 'bg-[#EEF2FF] text-[#4F46E5] border-[#C7D2FE]',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  if (priority === 'high') {
    return <Badge variant="danger">High</Badge>;
  }
  if (priority === 'medium') {
    return <Badge variant="warning">Medium</Badge>;
  }
  return <Badge variant="default">Low</Badge>;
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  if (status === 'done') {
    return <Badge variant="success">Completed</Badge>;
  }
  if (status === 'in_progress') {
    return <Badge variant="purple">In Progress</Badge>;
  }
  return <Badge variant="default">Pending</Badge>;
}

export function EventTypeBadge({ type }: { type: EventType }) {
  const map: Record<EventType, { label: string; variant: 'purple' | 'info' | 'success' }> = {
    wedding: { label: 'Wedding', variant: 'purple' },
    birthday: { label: 'Birthday', variant: 'info' },
    community: { label: 'Community', variant: 'success' },
  };
  const config = map[type] || { label: type, variant: 'default' };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function VendorStatusBadge({ status }: { status: VendorStatus }) {
  const map: Record<VendorStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'purple' | 'danger' }> = {
    to_contact: { label: 'To Contact', variant: 'default' },
    contacted: { label: 'Contacted', variant: 'purple' },
    quote_received: { label: 'Pending Quote', variant: 'warning' },
    shortlisted: { label: 'Shortlisted', variant: 'purple' },
    booked: { label: 'Confirmed', variant: 'success' },
    not_selected: { label: 'Declined', variant: 'default' },
  };
  const config = map[status] || { label: status, variant: 'default' };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
