import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link, NavLink } from 'react-router-dom';
import { 
  PlusCircle, 
  LayoutDashboard, 
  Layers3, 
  FolderGit2, 
  HelpCircle, 
  Settings as SettingsIcon,
  QrCode,
  FileText,
  Smartphone,
  CheckCircle2,
  Menu,
  X
} from 'lucide-react';
import BrandMark from './BrandMark';

const BUSINESS_DRAFT_KEY = 'ilovequote_business_draft';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
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

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { path: '/quotes', label: 'My Quotes', icon: <FileText className="w-4 h-4" /> },
    { path: '/templates', label: 'Templates', icon: <Layers3 className="w-4 h-4" /> },
    { path: '/portfolio', label: 'My Portfolio', icon: <FolderGit2 className="w-4 h-4" />, highlight: true },
    { path: '/qr-codes', label: 'QR Codes', icon: <QrCode className="w-4 h-4" /> },
    { path: '/settings', label: 'Settings', icon: <SettingsIcon className="w-4 h-4" /> },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] font-sans antialiased text-slate-800" id="app-viewport">
      
      {/* Toast Alert popups */}
      {showToast && (
        <div 
          className="fixed top-5 right-5 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl z-55 flex items-center gap-2 border border-slate-700 animate-slide-in"
          id="toast-notification"
        >
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. LEFT SIDEBAR: DESKTOP */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-[#E5E7EB] flex-col shrink-0" id="sidebar-navigation">
        {/* Brand Banner */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <BrandMark />
          </Link>
        </div>

        {/* Action Button */}
        <div className="px-4 py-4">
          <button
            onClick={() => {
              localStorage.removeItem('ilovequote_editing_quote_id'); // Clear editing id to represent fresh new quote
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

        {/* Sidebar Nav Links */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            // Determine active tab matching
            const isActive = location.pathname === item.path;
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                id={`nav-link-${item.path.replace('/', '')}`}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-blue-50/70 text-[#1D4ED8]' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-[#1D4ED8]' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.highlight && (
                  <span className="w-2 h-2 rounded-full bg-[#1D4ED8]" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer Help Section */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-bold text-slate-700">Help & Support</p>
              <p className="text-[10px] text-slate-400 leading-normal mt-0.5">Need help setting up your invoice? Talk to our engineers.</p>
              <button 
                onClick={() => triggerToast('Support portal offline. Contact us at help@ilovequote.com.')}
                className="text-[10px] text-[#2563EB] font-bold inline-block mt-1 hover:underline bg-transparent border-none p-0 cursor-pointer text-left"
              >
                Documentation
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE HEADER BAR & SIDEBAR COMPONENT */}
      <div className="lg:hidden flex flex-col w-full h-full overflow-hidden">
        
        {/* Mobile top bar navigation container */}
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
            {/* Quick action button */}
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
            <div className="h-8 w-8 rounded-full bg-[#1D4ED8] flex items-center justify-center text-white text-[10px] font-extrabold shadow-inner border border-white">
              JD
            </div>
          </div>
        </header>

        {/* Mobile Menu Backdrop & Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex" id="mobile-menu-drawer">
            {/* Dark tint background clickout */}
            <div 
              className="absolute inset-0 bg-slate-900/45 backdrop-blur-xs" 
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Menu container popup panel */}
            <div className="relative w-64 bg-white h-full flex flex-col justify-between shadow-2xl border-r border-slate-150 animate-slide-in-left">
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
                          <span className={isActive ? 'text-[#1D4ED8]' : 'text-slate-400'}>
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                        </div>
                        {item.highlight && <span className="w-1.5 h-1.5 rounded-full bg-[#1D4ED8]" />}
                      </NavLink>
                    );
                  })}
                </nav>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <p className="text-[10px] font-bold text-slate-700">Help Desk</p>
                <p className="text-[9px] text-slate-400 leading-tight mt-0.5">help@ilovequote.com</p>
              </div>
            </div>
          </div>
        )}

        {/* Content Outlet Viewport */}
        <div className="flex-1 overflow-hidden flex flex-col relative bg-[#F8FAFC]">
          <Outlet context={{ onTriggerToast: triggerToast, setSaveStatus }} />
        </div>
      </div>

      {/* 2. MAIN DESKTOP CONTENT AREA */}
      <div className="hidden lg:flex flex-1 flex-col h-full overflow-hidden" id="main-content-flow">
        <Outlet context={{ onTriggerToast: triggerToast, setSaveStatus }} />
      </div>

    </div>
  );
}
