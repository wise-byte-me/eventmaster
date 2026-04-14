import React from 'react';
import { X, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import clsx from 'clsx';

// ── Modal wrapper ──────────────────────────────────────────
export function Modal({ title, onClose, children, wide }: {
  title: string; onClose: () => void; children: React.ReactNode; wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className={clsx('bg-white rounded-2xl shadow-2xl w-full my-4', wide ? 'max-w-2xl' : 'max-w-md')}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-base">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────
export function StatCard({ label, value, icon: Icon, color, bg, sub }: {
  label: string; value: number | string; icon: React.ElementType;
  color: string; bg: string; sub?: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
          <Icon size={15} className={color} />
        </div>
      </div>
      <div className="text-2xl font-semibold text-gray-900">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }: {
  icon: React.ElementType; title: string; description?: string; action?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center py-16 px-8 text-center">
      <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
        <Icon size={26} className="text-gray-300" />
      </div>
      <p className="text-sm font-medium text-gray-700 mb-1">{title}</p>
      {description && <p className="text-xs text-gray-400 mb-4">{description}</p>}
      {action}
    </div>
  );
}

// ── Toast notifications ───────────────────────────────────
export function Toast({ message, type = 'info', onDismiss }: {
  message: string; type?: 'success' | 'error' | 'info'; onDismiss: () => void;
}) {
  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };
  const Icon = type === 'success' ? CheckCircle2 : type === 'error' ? AlertCircle : Info;
  return (
    <div className={clsx('fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg', styles[type])}>
      <Icon size={16} />
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onDismiss}><X size={14} /></button>
    </div>
  );
}

// ── Page header ───────────────────────────────────────────
export function PageHeader({ title, subtitle, action }: {
  title: string; subtitle?: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ── Table ─────────────────────────────────────────────────
export function Table({ headers, children, loading, empty }: {
  headers: string[]; children: React.ReactNode; loading?: boolean; empty?: React.ReactNode;
}) {
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            {headers.map(h => (
              <th key={h} className="text-left text-xs font-medium text-gray-500 px-5 py-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {loading ? (
            <tr><td colSpan={headers.length} className="px-5 py-10 text-center text-sm text-gray-400">Loading...</td></tr>
          ) : !children || (children as any[])?.length === 0 ? (
            <tr><td colSpan={headers.length} className="px-5 py-10 text-center">{empty}</td></tr>
          ) : children}
        </tbody>
      </table>
    </div>
  );
}

// ── Confirm dialog ────────────────────────────────────────
export function ConfirmDialog({ title, message, onConfirm, onCancel, danger }: {
  title: string; message: string; onConfirm: () => void; onCancel: () => void; danger?: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-5">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
          <button onClick={onConfirm} className={danger ? 'btn-danger flex-1' : 'btn-primary flex-1'}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

// ── Search input ──────────────────────────────────────────
export function SearchInput({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="relative flex-1">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        className="input pl-9"
        placeholder={placeholder ?? 'Search...'}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}
