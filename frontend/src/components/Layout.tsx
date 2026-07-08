import React, { useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate, useLocation, Link, NavLink } from 'react-router-dom';
import {
  PlusCircle,
  Building2,
  LayoutDashboard,
  HelpCircle,
  LogOut,
  Settings as SettingsIcon,
  QrCode,
  FileText,
  Receipt,
  Users,
  ShoppingBag,
  Menu,
  X,
  LogIn,
  UserPlus,
} from 'lucide-react';
import BrandMark from './BrandMark';
import { getDisplayAuthUser, signOut } from '../auth';

interface LayoutProps {
  isAuthed: boolean;
  userName?: string;
  onLogout?: () => void;
}

type NavItem = {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresAuth: boolean;
};

const DESKTOP_EXPANDED_WIDTH = 272;
const DESKTOP_COLLAPSED_WIDTH = 104;
const HEADER_HEIGHT = 73;

export default function Layout({ isAuthed, userName, onLogout }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isDesktopSidebarExpanded, setIsDesktopSidebarExpanded] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('saved');

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    window.setTimeout(() => {
      setShowToast(false);
    }, 3500);
  };

  const handleLogout = () => {
    signOut();
    onLogout?.();
    navigate('/');
  };

  const authUser = getDisplayAuthUser();
  const displayName = userName?.trim() || authUser.displayName;
  const initials = authUser.initials;
  const username = authUser.username || authUser.email || authUser.phone || '';

  const isInvoiceModuleRoute = isAuthed && (
    location.pathname.startsWith('/create-invoice')
    || location.pathname === '/invoices'
    || location.pathname === '/clients'
    || location.pathname === '/business'
    || location.pathname === '/invoice-help-support'
  );

  const quoteNavItems: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, requiresAuth: false },
    { path: '/quotes', label: 'My Quotes', icon: FileText, requiresAuth: true },
    { path: '/create-invoice', label: 'New Invoice', icon: Receipt, requiresAuth: true },
    { path: '/invoices', label: 'My Invoices', icon: FileText, requiresAuth: true },
    { path: '/items', label: 'Items / Products', icon: ShoppingBag, requiresAuth: true },
    { path: '/clients', label: 'My Customers', icon: Users, requiresAuth: true },
    { path: '/business', label: 'My Business', icon: Building2, requiresAuth: true },
    { path: '/portfolio', label: 'My Portfolio', icon: QrCode, requiresAuth: true },
    { path: '/qr-codes', label: 'QR Portfolio', icon: QrCode, requiresAuth: true },
    { path: '/settings', label: 'Settings', icon: SettingsIcon, requiresAuth: true },
    { path: '/help-support', label: 'Help & Support', icon: HelpCircle, requiresAuth: false },
  ];

  const invoiceNavItems: NavItem[] = [
    { path: '/create-invoice', label: 'New Invoice', icon: Receipt, requiresAuth: true },
    { path: '/invoices', label: 'My Invoices', icon: FileText, requiresAuth: true },
    { path: '/clients', label: 'Customers', icon: Users, requiresAuth: true },
    { path: '/business', label: 'My Business', icon: Building2, requiresAuth: true },
    { path: '/invoice-help-support', label: 'Help & Support', icon: HelpCircle, requiresAuth: false },
  ];

  const navItems = isInvoiceModuleRoute ? invoiceNavItems : quoteNavItems;
  const visibleNavItems = navItems.filter((item) => isAuthed || !item.requiresAuth);
  const primaryActionLabel = isInvoiceModuleRoute ? 'New Invoice' : 'New Quote';
  const primaryActionTarget = isInvoiceModuleRoute ? '/create-invoice' : '/create-quote';
  const primaryActionStorageKey = isInvoiceModuleRoute ? null : 'ilovequote_editing_quote_id';
  const primaryActionToast = isInvoiceModuleRoute ? 'Opening invoice builder...' : 'Initializing fresh quote container...';

  const desktopSidebarWidth = isDesktopSidebarExpanded ? DESKTOP_EXPANDED_WIDTH : DESKTOP_COLLAPSED_WIDTH;

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isMobileMenuOpen]);

  const handlePrimaryAction = () => {
    if (primaryActionStorageKey) {
      localStorage.removeItem(primaryActionStorageKey);
    }
    triggerToast(primaryActionToast);
    navigate(primaryActionTarget);
    setIsMobileMenuOpen(false);
  };

  const mainContentStyle = useMemo(
    () => ({
      paddingTop: HEADER_HEIGHT,
      ['--sidebar-width' as string]: `${desktopSidebarWidth}px`,
    }),
    [desktopSidebarWidth],
  );

  const isPathActive = (path: string) =>
    location.pathname === path || (path === '/create-invoice' && location.pathname.startsWith('/create-invoice'));

  const renderNavList = (expanded: boolean, mobile = false) => (
    <nav className={`flex-1 ${expanded ? 'space-y-3' : 'space-y-4'} overflow-y-auto px-4 py-4`}>
      {visibleNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = isPathActive(item.path);
        return (
          <NavLink
            key={item.path}
            to={item.path}
            title={expanded ? undefined : item.label}
            onClick={() => {
              if (mobile) {
                setIsMobileMenuOpen(false);
              }
            }}
            className={`group flex w-full items-center ${expanded ? 'justify-start gap-4 px-5' : 'justify-center px-0'} min-h-[56px] rounded-2xl text-sm font-semibold transition-all duration-300 ${
              isActive
                ? 'bg-[#EEF4FF] text-[#1D4ED8] shadow-[0_10px_24px_rgba(37,99,235,0.08)]'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Icon className={`h-6 w-6 shrink-0 ${isActive ? 'text-[#1D4ED8]' : 'text-slate-400 group-hover:text-slate-700'}`} />
            {expanded ? <span className="truncate text-[15px]">{item.label}</span> : null}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 antialiased">
      {showToast ? (
        <div className="fixed right-5 top-5 z-[70] flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-xs font-bold text-white shadow-2xl">
          <div className="h-2 w-2 rounded-full bg-blue-500" />
          <span>{toastMessage}</span>
        </div>
      ) : null}

      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#E5E7EB] bg-white/95 backdrop-blur">
        <div className="flex h-[73px] items-center justify-between px-4 lg:px-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setIsDesktopSidebarExpanded((current) => !current)}
              className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 lg:inline-flex"
              aria-label={isDesktopSidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {isDesktopSidebarExpanded ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link to="/dashboard" className="flex items-center gap-1.5">
              <BrandMark size="sm" />
            </Link>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            {isAuthed ? (
              <>
                <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
                  <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1D4ED8] text-[12px] font-semibold text-white shadow-sm">
                    {initials}
                  </button>
                  <div className="hidden flex-col items-start leading-tight sm:flex">
                    <span className="text-[13px] font-semibold text-slate-800">{displayName}</span>
                    <span className="text-[11px] text-slate-500">{username || (userName ? 'Signed in' : 'Guest')}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login?mode=login"
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  <LogIn className="h-4 w-4" />
                  Login
                </Link>
                <Link
                  to="/login?mode=signup"
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#1D4ED8] px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:bg-blue-800"
                >
                  <UserPlus className="h-4 w-4" />
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <aside
        className="fixed bottom-0 left-0 top-[73px] z-40 hidden border-r border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)] transition-[width] duration-300 ease-out lg:flex lg:flex-col"
        style={{ width: desktopSidebarWidth }}
      >
        <div className="flex h-full flex-col">
          <div className={`flex items-center ${isDesktopSidebarExpanded ? 'justify-between px-6' : 'justify-center px-2'} border-b border-slate-100 py-6`}>
            {isDesktopSidebarExpanded ? (
              <Link to="/dashboard" className="flex items-center gap-1.5 overflow-hidden">
                <BrandMark size="sm" />
              </Link>
            ) : (
              <div className="h-5" aria-hidden="true" />
            )}
            {isDesktopSidebarExpanded ? (
              <button
                type="button"
                onClick={() => setIsDesktopSidebarExpanded(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
                aria-label="Close sidebar"
              >
                <X className="h-6 w-6" />
              </button>
            ) : null}
          </div>

          <div className="px-4 py-5">
            <button
              type="button"
              onClick={handlePrimaryAction}
              className={`inline-flex w-full items-center justify-center gap-3 rounded-[22px] bg-[#1D4ED8] font-bold text-white shadow-[0_18px_34px_rgba(29,78,216,0.24)] transition-all duration-300 hover:bg-blue-800 ${
                isDesktopSidebarExpanded ? 'min-h-[56px] px-5 text-[15px]' : 'mx-auto h-[72px] w-[72px] rounded-[26px] px-0'
              }`}
              id="btn-sidebar-primary"
              title={primaryActionLabel}
            >
              <PlusCircle className={`${isDesktopSidebarExpanded ? 'h-5 w-5' : 'h-7 w-7'}`} />
              {isDesktopSidebarExpanded ? <span>{primaryActionLabel}</span> : null}
            </button>
          </div>

          {renderNavList(isDesktopSidebarExpanded)}

          <div className="mt-auto border-t border-slate-100 px-4 py-5">
            {isDesktopSidebarExpanded ? (
                <button
                  type="button"
                  onClick={() => setIsDesktopSidebarExpanded(false)}
                  className="inline-flex min-h-[52px] w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-[15px] font-semibold text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-700"
                >
                  <span className="text-lg leading-none">‹</span>
                  Collapse
                </button>
            ) : (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setIsDesktopSidebarExpanded(true)}
                  className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-700"
                  aria-label="Expand sidebar"
                >
                  <span className="text-2xl leading-none">›</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div
        className={`fixed inset-0 z-[60] lg:hidden ${isMobileMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        aria-hidden={!isMobileMenuOpen}
      >
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(false)}
          className={`absolute inset-0 bg-slate-900/40 transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}
          aria-label="Close sidebar backdrop"
        />
        <aside
          className={`relative h-full w-[240px] max-w-[82vw] border-r border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">
            <Link to="/dashboard" className="flex items-center gap-1.5">
              <BrandMark size="sm" />
            </Link>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-4 py-4">
            <button
              type="button"
              onClick={handlePrimaryAction}
              className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-[#1D4ED8] px-4 text-sm font-bold text-white shadow-[0_18px_34px_rgba(29,78,216,0.22)] transition hover:bg-blue-800"
            >
              <PlusCircle className="h-4 w-4" />
              <span>{primaryActionLabel}</span>
            </button>
          </div>

          {renderNavList(true, true)}

          <div className="border-t border-slate-100 px-4 py-4">
            {isAuthed ? (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            ) : (
              <div className="grid gap-2">
                <Link
                  to="/login?mode=login"
                  className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm"
                >
                  <LogIn className="h-4 w-4" />
                  Login
                </Link>
                <Link
                  to="/login?mode=signup"
                  className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-[#1D4ED8] px-4 text-sm font-semibold text-white shadow-sm"
                >
                  <UserPlus className="h-4 w-4" />
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </aside>
      </div>

      <main
        className="min-h-screen overflow-x-hidden bg-[#F8FAFC] lg:ml-[var(--sidebar-width)] lg:transition-[margin-left] lg:duration-300 lg:ease-out"
        style={mainContentStyle}
      >
        <div className="min-h-[calc(100vh-73px)] overflow-y-auto lg:transition-all lg:duration-300 lg:ease-out" style={{ marginLeft: 0 }}>
          <div className="lg:hidden" style={{ paddingTop: 0 }} />
          <Outlet context={{ onTriggerToast: triggerToast, setSaveStatus }} />
        </div>
      </main>
    </div>
  );
}
