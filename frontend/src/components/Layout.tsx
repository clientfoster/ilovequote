import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link, NavLink } from 'react-router-dom';
import {
  Plus,
  PlusCircle, 
  Building2,
  LayoutDashboard, 
  HelpCircle,
  LogOut,
  Settings as SettingsIcon,
  QrCode,
  FileText,
  FilePlus,
  FileSpreadsheet,
  Briefcase,
  Users,
  ShoppingBag,
  Menu,
  X,
  LogIn,
  UserPlus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import BrandMark from './BrandMark';
import { getDisplayAuthUser, signOut } from '../auth';

interface LayoutProps {
  isAuthed: boolean;
  userName?: string;
  onLogout?: () => void;
}

export default function Layout({ isAuthed, userName, onLogout }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Status for draft save simulation
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('saved');

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3500);
  };

  const handleLogout = () => {
    signOut();
    onLogout?.();
    navigate('/dashboard');
  };

  const authUser = getDisplayAuthUser();
  const displayName = userName?.trim() || authUser.displayName;
  const initials = authUser.initials;
  const username = authUser.username || authUser.email || authUser.phone || '+91 91237 6612';

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);

    try {
      const flash = sessionStorage.getItem('ilovequote_flash_toast');
      if (flash) {
        sessionStorage.removeItem('ilovequote_flash_toast');
        triggerToast(flash);
      }
    } catch {
      // ignore
    }
  }, [location.pathname]);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4 shrink-0" /> },
    { path: '/quotes', label: 'My Quotes', icon: <FileText className="w-4 h-4 shrink-0" /> },
    { path: '/create-invoice', label: 'New Invoice', icon: <FilePlus className="w-4 h-4 shrink-0" /> },
    { path: '/invoices', label: 'My Invoices', icon: <FileSpreadsheet className="w-4 h-4 shrink-0" /> },
    { path: '/items', label: 'Items / Products', icon: <ShoppingBag className="w-4 h-4 shrink-0" /> },
    { path: '/clients', label: 'My Customers', icon: <Users className="w-4 h-4 shrink-0" /> },
    { path: '/business', label: 'My Business', icon: <Building2 className="w-4 h-4 shrink-0" /> },
    { path: '/portfolio', label: 'My Portfolio', icon: <Briefcase className="w-4 h-4 shrink-0" /> },
    { path: '/qr-codes', label: 'QR Portfolio', icon: <QrCode className="w-4 h-4 shrink-0" /> },
    { path: '/settings', label: 'Settings', icon: <SettingsIcon className="w-4 h-4 shrink-0" /> },
    { path: '/help-support', label: 'Help & Support', icon: <HelpCircle className="w-4 h-4 shrink-0" /> },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] font-sans antialiased text-slate-800" id="app-viewport">
      
      {/* Toast Alert popups */}
      {showToast && (
        <div 
          className="fixed top-5 right-5 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl z-55 flex items-center gap-2 border border-slate-700"
          id="toast-notification"
        >
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* DESKTOP PERMANENT SIDEBAR */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 border-r border-[#E5E7EB] bg-white transition-all duration-200 z-20 ${
          isDesktopCollapsed ? 'w-20' : 'w-60 xl:w-64'
        }`}
        id="desktop-sidebar"
      >
        {/* Logo Section */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between min-h-[58px]">
          <Link to="/dashboard" className="flex items-center gap-2 overflow-hidden">
            {isDesktopCollapsed ? (
              <span className="font-black text-xl text-[#2563EB]">i❤</span>
            ) : (
              <BrandMark size="sm" />
            )}
          </Link>
        </div>

        {/* New Quote Button */}
        <div className="p-3.5">
          <button
            onClick={() => {
              localStorage.removeItem('ilovequote_editing_quote_id');
              triggerToast('Initializing fresh quote container...');
              navigate('/create-quote');
            }}
            className="w-full inline-flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl shadow-sm transition-all cursor-pointer"
            id="btn-sidebar-newquote"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            {!isDesktopCollapsed && <span>New Quote</span>}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-2.5 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                id={`nav-link-${item.path.replace('/', '')}`}
                title={isDesktopCollapsed ? item.label : undefined}
                className={`w-full flex items-center ${isDesktopCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 text-[#2563EB] font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-[#2563EB]' : 'text-slate-400'}>{item.icon}</span>
                  {!isDesktopCollapsed && <span>{item.label}</span>}
                </div>
              </NavLink>
            );
          })}
        </nav>

        {/* Collapse Button at bottom */}
        <div className="p-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setIsDesktopCollapsed((prev) => !prev)}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
            id="btn-sidebar-collapse"
          >
            {isDesktopCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT WRAPPER */}
      <div className="flex h-full w-full flex-1 flex-col overflow-hidden">
        {/* DESKTOP TOP HEADER */}
        <header className="hidden lg:flex shrink-0 border-b border-[#E5E7EB] bg-white h-14 items-center justify-end px-6 z-10">
          <div className="flex items-center gap-3">
            {isAuthed ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-white pl-1.5 pr-3.5 py-1 shadow-2xs">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2563EB] text-[11px] font-bold text-white shadow-xs">
                    {initials || 'U'}
                  </div>
                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-xs font-bold text-slate-800">{displayName || username}</span>
                    <span className="text-[10px] text-slate-400 font-medium">Standard plan</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-2xs hover:bg-slate-50 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white pl-1.5 pr-3 py-1 shadow-2xs">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2563EB] text-[11px] font-bold text-white shadow-xs">
                    +
                  </div>
                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-xs font-bold text-slate-800">+91 91237 6612</span>
                    <span className="text-[10px] text-slate-400 font-medium">Standard plan</span>
                  </div>
                </div>
                <Link
                  to={`/login?mode=login${location.pathname === '/create-quote' ? `&returnUrl=${encodeURIComponent(location.pathname + location.search)}` : ''}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Login
                </Link>
                <Link
                  to={`/login?mode=signup${location.pathname === '/create-quote' ? `&returnUrl=${encodeURIComponent(location.pathname + location.search)}` : ''}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-blue-700 transition-colors"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </header>

        {/* MOBILE HEADER */}
        <header className="lg:hidden bg-white border-b border-[#E5E7EB] py-3 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 hover:bg-slate-50 text-slate-600 rounded-lg shrink-0 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link to="/dashboard" className="flex items-center gap-1.5">
              <BrandMark size="sm" />
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {!isAuthed && (
              <Link
                to="/login?mode=login"
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 shadow-xs"
              >
                Login
              </Link>
            )}
            <button
              onClick={() => {
                localStorage.removeItem('ilovequote_editing_quote_id');
                navigate('/create-quote');
              }}
              className="p-1.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg shrink-0 cursor-pointer shadow-xs"
              title="New Quote"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* MOBILE MENU DRAWER */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden" id="mobile-menu-drawer">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            <div className="relative w-64 bg-white h-full flex flex-col justify-between shadow-2xl border-r border-slate-150 z-10">
              <div>
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <BrandMark size="sm" />
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1.5 hover:bg-slate-150 text-slate-400 rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3">
                  <button
                    onClick={() => {
                      localStorage.removeItem('ilovequote_editing_quote_id');
                      setIsMobileMenuOpen(false);
                      triggerToast('Initializing fresh quote container...');
                      navigate('/create-quote');
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    New Quote
                  </button>
                </div>

                <nav className="px-2 space-y-0.5 overflow-y-auto max-h-[calc(100vh-220px)]">
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-blue-50 text-[#2563EB] font-bold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={isActive ? 'text-[#2563EB]' : 'text-slate-400'}>{item.icon}</span>
                          <span>{item.label}</span>
                        </div>
                      </NavLink>
                    );
                  })}
                </nav>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                {isAuthed ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Logout
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <Link
                      to={`/login?mode=login`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs"
                    >
                      Login
                    </Link>
                    <Link
                      to={`/login?mode=signup`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#2563EB] px-3 py-2 text-xs font-semibold text-white shadow-xs"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SCROLLABLE MAIN CONTENT OUTLET */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#F8FAFC]" id="main-content-flow">
          <Outlet context={{ onTriggerToast: triggerToast, setSaveStatus }} />
        </main>
      </div>

    </div>
  );
}
