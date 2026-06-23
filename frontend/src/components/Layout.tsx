import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link, NavLink } from 'react-router-dom';
import {
  PlusCircle, 
  Building2,
  LayoutDashboard, 
  Layers3, 
  HelpCircle,
  LogOut,
  Settings as SettingsIcon,
  QrCode,
  FileText,
  Users,
  ShoppingBag,
  Smartphone,
  CheckCircle2,
  Menu,
  X,
  LogIn,
  UserPlus
} from 'lucide-react';
import BrandMark from './BrandMark';
import { getDisplayAuthUser, signOut } from '../auth';

const BUSINESS_DRAFT_KEY = 'ilovequote_business_draft';

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
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);
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
  const username = authUser.username || authUser.email || authUser.phone || '';

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsDesktopMenuOpen(false);
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { path: '/quotes', label: 'My Quotes', icon: <FileText className="w-4 h-4" /> },
    { path: '/clients', label: 'Clients', icon: <Users className="w-4 h-4" /> },
    { path: '/items', label: 'Items / Products', icon: <ShoppingBag className="w-4 h-4" /> },
    { path: '/business', label: 'My Business', icon: <Building2 className="w-4 h-4" /> },
    { path: '/templates', label: 'Templates', icon: <Layers3 className="w-4 h-4" /> },
    { path: '/portfolio', label: 'My Portfolio', icon: <QrCode className="w-4 h-4" /> },
    { path: '/qr-codes', label: 'QR Portfolio', icon: <QrCode className="w-4 h-4" /> },
    { path: '/settings', label: 'Settings', icon: <SettingsIcon className="w-4 h-4" /> },
    { path: '/help-support', label: 'Help & Support', icon: <HelpCircle className="w-4 h-4" /> },
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

      <div className="flex h-full w-full flex-1 flex-col overflow-hidden">
        <header className="hidden shrink-0 border-b border-[#E5E7EB] bg-white lg:block">
          <div className="flex items-center justify-between px-4 py-3.5 lg:px-5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsDesktopMenuOpen((prev) => !prev)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                aria-label={isDesktopMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {isDesktopMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <Link to="/dashboard" className="flex items-center gap-1.5">
                <BrandMark size="sm" />
              </Link>
            </div>

            <div className="flex items-center gap-2 lg:gap-4">
              <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full text-slate-700">
                <Smartphone className="h-5 w-5" />
              </button>
              <button type="button" className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm">
                <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  3
                </span>
                <CheckCircle2 className="h-4.5 w-4.5" />
              </button>
              {isAuthed ? (
                <>
                  <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
                    <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1D4ED8] text-[12px] font-semibold text-white shadow-sm">
                      {initials}
                    </button>
                    <div className="flex flex-col items-start leading-tight">
                      <span className="text-[13px] font-semibold text-slate-800">{displayName}</span>
                      <span className="text-[11px] text-slate-500">{username || (userName ? 'Signed in' : 'Guest')}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login?mode=login"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    <LogIn className="h-4 w-4" />
                    Login
                  </Link>
                  <Link
                    to="/login?mode=signup"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#1D4ED8] px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:bg-blue-800"
                  >
                    <UserPlus className="h-4 w-4" />
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="relative flex min-h-0 flex-1 overflow-hidden">
          {isDesktopMenuOpen && (
            <div className="absolute inset-0 z-40 flex" id="desktop-menu-drawer">
              <button
                type="button"
                className="absolute inset-0 bg-slate-900/15"
                onClick={() => setIsDesktopMenuOpen(false)}
                aria-label="Close sidebar backdrop"
              />

              <aside className="relative z-10 flex h-full w-64 flex-col border-r border-[#E5E7EB] bg-white shadow-2xl">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <Link to="/dashboard" className="flex items-center gap-2">
                    <BrandMark />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsDesktopMenuOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50"
                    aria-label="Close menu"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="px-4 py-4">
                  <button
                    onClick={() => {
                      localStorage.removeItem('ilovequote_editing_quote_id');
                      setIsDesktopMenuOpen(false);
                      triggerToast('Initializing fresh quote container...');
                      navigate('/create-quote');
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 bg-[#1D4ED8] hover:bg-blue-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-blue-100 transition-all cursor-pointer transform active:scale-95 hover:-translate-y-0.5"
                    id="btn-sidebar-newquote"
                  >
                    <PlusCircle className="w-4 h-4" />
                    New Quote
                  </button>
                </div>

                <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsDesktopMenuOpen(false)}
                        id={`nav-link-${item.path.replace('/', '')}`}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-blue-50/70 text-[#1D4ED8]'
                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/70'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={isActive ? 'text-[#1D4ED8]' : 'text-slate-400'}>{item.icon}</span>
                          <span>{item.label}</span>
                        </div>
                      </NavLink>
                    );
                  })}
                </nav>
              </aside>
            </div>
          )}

          {/* MOBILE HEADER BAR & SIDEBAR COMPONENT */}
          <div className="lg:hidden flex flex-col w-full h-full overflow-hidden">
            <header className="bg-white border-b border-[#E5E7EB] py-3.5 px-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-1.5 hover:bg-slate-55 text-slate-600 rounded-lg shrink-0 cursor-pointer"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <Link to="/dashboard" className="flex items-center gap-1.5">
                  <BrandMark size="sm" />
                </Link>
              </div>

              <div className="flex items-center gap-2">
                {!isAuthed && (
                  <div className="flex items-center gap-2">
                    <Link
                      to="/login?mode=login"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm"
                    >
                      <LogIn className="h-3.5 w-3.5" />
                      Login
                    </Link>
                    <Link
                      to="/login?mode=signup"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D4ED8] px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Sign Up
                    </Link>
                  </div>
                )}
                <button
                  onClick={() => {
                    localStorage.removeItem('ilovequote_editing_quote_id');
                    navigate('/create-quote');
                  }}
                  className="p-1.5 bg-[#1D4ED8] hover:bg-blue-800 text-white rounded-lg shrink-0 cursor-pointer shadow-sm"
                  title="New Quote"
                >
                  <PlusCircle className="w-4 h-4" />
                </button>
                {isAuthed ? (
                  <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 shadow-sm">
                    <div className="h-7 w-7 rounded-full bg-[#1D4ED8] flex items-center justify-center text-white text-[10px] font-extrabold shadow-inner border border-white">
                      {initials}
                    </div>
                    <span className="max-w-[120px] truncate text-[12px] font-semibold text-slate-800">
                      {displayName}
                    </span>
                    <span className="max-w-[120px] truncate text-[10px] text-slate-500">
                      {username || (userName ? 'Signed in' : 'Guest')}
                    </span>
                  </div>
                ) : null}
              </div>
            </header>

            {isMobileMenuOpen && (
              <div className="fixed inset-0 z-50 flex" id="mobile-menu-drawer">
                <div
                  className="absolute inset-0 bg-slate-900/45 backdrop-blur-xs"
                  onClick={() => setIsMobileMenuOpen(false)}
                />

                <div className="relative w-64 bg-white h-full flex flex-col justify-between shadow-2xl border-r border-slate-150">
                  <div>
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <div className="flex items-center gap-1.5">
                        <BrandMark size="sm" />
                      </div>
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
                        className="w-full inline-flex items-center justify-center gap-2 bg-[#1D4ED8] hover:bg-blue-800 text-white text-xs font-bold py-2 px-3 rounded-lg shadow-sm transition-all cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        New Quote
                      </button>
                    </div>

                    <nav className="p-2 space-y-1">
                      {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                          <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isActive
                                ? 'bg-blue-50/70 text-[#1D4ED8]'
                                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/70'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className={isActive ? 'text-[#1D4ED8]' : 'text-slate-400'}>{item.icon}</span>
                              <span>{item.label}</span>
                            </div>
                          </NavLink>
                        );
                      })}
                    </nav>
                  </div>

                  <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    <p className="text-[10px] font-bold text-slate-700">Help Desk</p>
                    <p className="text-[9px] text-slate-400 leading-tight mt-0.5">help@ilovequote.com</p>
                    {isAuthed ? (
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 shadow-sm"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Logout
                      </button>
                    ) : (
                      <div className="mt-3 flex gap-2">
                        <Link
                          to="/login?mode=login"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 shadow-sm"
                        >
                          <LogIn className="h-3.5 w-3.5" />
                          Login
                        </Link>
                        <Link
                          to="/login?mode=signup"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#1D4ED8] px-3 py-2 text-[11px] font-semibold text-white shadow-sm"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          Sign Up
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-hidden flex flex-col relative bg-[#F8FAFC]">
              <Outlet context={{ onTriggerToast: triggerToast, setSaveStatus }} />
            </div>
          </div>

          {/* MAIN DESKTOP CONTENT AREA */}
          <div className="hidden lg:flex flex-1 flex-col h-full overflow-hidden bg-[#F8FAFC]" id="main-content-flow">
            <Outlet context={{ onTriggerToast: triggerToast, setSaveStatus }} />
          </div>
        </div>
      </div>

    </div>
  );
}
