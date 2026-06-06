import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Globe, Home, Loader2, RefreshCw } from 'lucide-react';

type PlatformAdminShellProps = {
  onRefresh: () => void;
  loading: boolean;
  alerts?: ReactNode;
  tabs: ReactNode;
  children: ReactNode;
  badge?: string;
  title?: string;
  subtitle?: string;
};

export function PlatformAdminShell({
  onRefresh,
  loading,
  alerts,
  tabs,
  children,
  badge = 'Roma Plataforma',
  title = 'Administración Global',
  subtitle = 'Gestión centralizada de empresas, colaboradores y roles RBAC.',
}: PlatformAdminShellProps) {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/80">
      <header className="border-b border-slate-200 bg-white/90 px-4 py-5 backdrop-blur-md md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-cyan-600">
              <Globe className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">{badge}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              {title}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <Home className="h-4 w-4" />
              Volver al HR
            </Link>
            <button
              type="button"
              disabled={loading}
              onClick={onRefresh}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Actualizar
            </button>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {alerts}
          {tabs}
          {children}
        </div>
      </main>
    </div>
  );
}
