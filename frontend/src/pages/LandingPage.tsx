import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BadgeIndianRupee,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Gift,
  LogIn,
  LogOut,
  PackageCheck,
  Plane,
  Menu,
  ReceiptIndianRupee,
  ScrollText,
  ShieldCheck,
  Smartphone,
  Star,
  UserPlus,
  X,
} from 'lucide-react';
import BrandMark from '../components/BrandMark';
import { AuthUser, getDisplayAuthUser } from '../auth';

type ToolCard = {
  title: string;
  description: string;
  iconWrap: string;
  iconColor: string;
  accent: string;
  route: string;
  renderIcon: () => React.ReactNode;
};

const toolCards: ToolCard[] = [
  {
    title: 'Create Quote',
    description: 'Create professional\nprice quotes in less\nthan 2 minutes.',
    iconWrap: 'bg-[#EEF5FF]',
    iconColor: 'text-[#2563EB]',
    accent: 'text-[#2563EB]',
    route: '/create-quote',
    renderIcon: () => (
      <div className="relative">
        <FileText className="h-16 w-16 text-[#2563EB]" strokeWidth={1.8} />
        <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#2563EB] text-white shadow-sm">
          <BadgeIndianRupee className="h-4 w-4" strokeWidth={2.1} />
        </div>
      </div>
    ),
  },
  {
    title: 'Invoice',
    description: 'Create professional\ninvoices in less\nthan 2 minutes.',
    iconWrap: 'bg-[#EEFCF4]',
    iconColor: 'text-[#22C55E]',
    accent: 'text-[#22C55E]',
    route: '/create-invoice',
    renderIcon: () => <FileSpreadsheet className="h-16 w-16 text-[#22C55E]" strokeWidth={1.8} />,
  },
  {
    title: 'Estimate',
    description: 'Create estimates\nquickly and send\nto your clients.',
    iconWrap: 'bg-[#F5EEFF]',
    iconColor: 'text-[#7C3AED]',
    accent: 'text-[#7C3AED]',
    route: '/login?mode=signup',
    renderIcon: () => <ClipboardList className="h-16 w-16 text-[#7C3AED]" strokeWidth={1.8} />,
  },
  {
    title: 'Purchase Order',
    description: 'Create and send\nprofessional purchase\norders instantly.',
    iconWrap: 'bg-[#FFF7EA]',
    iconColor: 'text-[#F59E0B]',
    accent: 'text-[#F59E0B]',
    route: '/login?mode=signup',
    renderIcon: () => <ScrollText className="h-16 w-16 text-[#F59E0B]" strokeWidth={1.8} />,
  },
  {
    title: 'Sales Receipt',
    description: 'Create sales receipts\ninstantly and share\nwith your customers.',
    iconWrap: 'bg-[#FFF0F7]',
    iconColor: 'text-[#EC4899]',
    accent: 'text-[#EC4899]',
    route: '/login?mode=signup',
    renderIcon: () => <ReceiptIndianRupee className="h-16 w-16 text-[#EC4899]" strokeWidth={1.8} />,
  },
  {
    title: 'Receipt',
    description: 'Create payment\nreceipts instantly\nand download.',
    iconWrap: 'bg-[#EEFCFC]',
    iconColor: 'text-[#14B8A6]',
    accent: 'text-[#14B8A6]',
    route: '/login?mode=signup',
    renderIcon: () => <FileCheck2 className="h-16 w-16 text-[#14B8A6]" strokeWidth={1.8} />,
  },
];

const whyCards = [
  {
    title: '100% Free',
    description: 'All tools are completely\nfree to use. Forever.',
    icon: <Gift className="h-8 w-8 text-[#22C55E]" strokeWidth={1.8} />,
    iconWrap: 'bg-[#EEFDF4]',
  },
  {
    title: 'No Login Required',
    description: 'Start creating instantly.\nNo sign up or\nlogin needed.',
    icon: <ShieldCheck className="h-8 w-8 text-[#7C3AED]" strokeWidth={1.8} />,
    iconWrap: 'bg-[#F6EFFF]',
  },
  {
    title: 'Download PDF',
    description: 'Download your documents\nas PDF and print or\nsend easily.',
    icon: <FileCheck2 className="h-8 w-8 text-[#2563EB]" strokeWidth={1.8} />,
    iconWrap: 'bg-[#EEF5FF]',
  },
  {
    title: 'Share Instantly',
    description: 'Share documents with your\nclients using a secure\npublic link.',
    icon: <Plane className="h-8 w-8 text-[#F59E0B]" strokeWidth={1.8} />,
    iconWrap: 'bg-[#FFF7EA]',
  },
  {
    title: 'Mobile Friendly',
    description: 'Works perfectly on\ndesktop, tablet and\nmobile devices.',
    icon: <Smartphone className="h-8 w-8 text-[#EC4899]" strokeWidth={1.8} />,
    iconWrap: 'bg-[#FFF0F7]',
  },
];

const workSteps = [
  {
    number: '1',
    title: 'Fill Details',
    description: 'Enter your business and\nclient details.',
    iconWrap: 'bg-[#EEF8F6]',
    badge: 'bg-[#22C55E]',
    icon: <FileText className="h-8 w-8 text-[#94A3FF]" strokeWidth={1.8} />,
  },
  {
    number: '2',
    title: 'Add Items',
    description: 'Add products or services\nwith rates and taxes.',
    iconWrap: 'bg-[#F7EEFF]',
    badge: 'bg-[#7C3AED]',
    icon: <PackageCheck className="h-8 w-8 text-[#8B5CF6]" strokeWidth={1.8} />,
  },
  {
    number: '3',
    title: 'Download PDF',
    description: 'Preview and download\nyour document as PDF.',
    iconWrap: 'bg-[#EEF5FF]',
    badge: 'bg-[#2563EB]',
    icon: <FileCheck2 className="h-8 w-8 text-[#94A3FF]" strokeWidth={1.8} />,
  },
  {
    number: '4',
    title: 'Share with Client',
    description: 'Share the document using\na unique link.',
    iconWrap: 'bg-[#FFF0F7]',
    badge: 'bg-[#EC4899]',
    icon: <ArrowRight className="h-8 w-8 text-[#FB7185]" strokeWidth={2.2} />,
  },
];

const topNav = ['Quote', 'Invoice', 'Estimate', 'Purchase Order', 'Sales Receipt', 'Receipt'];

interface LandingPageProps {
  isAuthed?: boolean;
  userName?: string;
  onLogout?: () => void;
}

export default function LandingPage({ isAuthed = false, userName, onLogout }: LandingPageProps) {
  const navigate = useNavigate();
  const toolsScrollerRef = React.useRef<HTMLDivElement | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const authUser = getDisplayAuthUser();
  const displayName = userName?.trim() || authUser.displayName;
  const initials = authUser.initials;
  const username = authUser.username || authUser.email || authUser.phone || '';

  const scrollTools = (direction: 'left' | 'right') => {
    const node = toolsScrollerRef.current;
    if (!node) return;

    node.scrollBy({
      left: direction === 'left' ? -280 : 280,
      behavior: 'smooth',
    });
  };

  return (
    <div className="min-h-screen bg-[#FAFCFF] text-slate-900">
      <div className="mx-auto max-w-[1552px] px-3 py-3 md:px-4 md:py-4">
        <header className="relative rounded-[22px] border border-slate-200 bg-white px-4 py-3 shadow-[0_2px_10px_rgba(15,23,42,0.05)] sm:px-6 sm:py-4">
          <div className="flex items-center justify-between gap-3 sm:gap-6">
            <button type="button" onClick={() => navigate('/')} className="shrink-0">
              <BrandMark size="md" />
            </button>

            <nav className="hidden flex-1 items-center justify-center gap-12 lg:flex">
              {topNav.map((item, index) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => navigate(index === 0 ? '/create-quote' : index === 1 ? '/create-invoice' : '/login?mode=signup')}
                  className="text-[15px] font-semibold text-slate-900 transition hover:text-[#2457F0]"
                >
                  {item}
                </button>
              ))}
            </nav>

            <div className="hidden items-center gap-2 sm:flex sm:gap-4">
              {isAuthed ? (
                <>
                  <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
                    <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1D4ED8] text-[12px] font-semibold text-white shadow-sm">
                      {initials}
                    </button>
                    <div className="flex flex-col items-start leading-tight">
                      <span className="text-[13px] font-semibold text-slate-800">{displayName}</span>
                      <span className="text-[11px] text-slate-500">{username || 'Signed in'}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="inline-flex shrink-0 whitespace-nowrap h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-semibold text-slate-900 shadow-[0_1px_5px_rgba(15,23,42,0.04)] sm:h-[50px] sm:px-7 sm:text-[15px]"
                  >
                    <LogOut className="h-4.5 w-4.5" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => navigate('/login?mode=login')}
                    className="inline-flex shrink-0 whitespace-nowrap h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-semibold text-slate-900 shadow-[0_1px_5px_rgba(15,23,42,0.04)] sm:h-[50px] sm:px-7 sm:text-[15px]"
                  >
                    <LogIn className="h-4.5 w-4.5" />
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/login?mode=signup')}
                    className="inline-flex shrink-0 whitespace-nowrap h-11 items-center gap-2 rounded-2xl bg-[#2563EB] px-4 text-[14px] font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.22)] sm:h-[50px] sm:px-7 sm:text-[15px]"
                  >
                    <UserPlus className="h-4.5 w-4.5" />
                    Sign Up
                  </button>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((current) => !current)}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-[0_1px_5px_rgba(15,23,42,0.04)] sm:hidden"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {mobileMenuOpen ? (
            <div
              id="mobile-nav-menu"
              className="mt-3 space-y-3 rounded-[20px] border border-slate-200 bg-white p-3 shadow-[0_12px_30px_rgba(15,23,42,0.08)] sm:hidden"
            >
              <div className="grid grid-cols-2 gap-2">
                {topNav.map((item, index) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate(index === 0 ? '/create-quote' : index === 1 ? '/create-invoice' : '/login?mode=signup');
                    }}
                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 text-[13px] font-semibold text-slate-900"
                  >
                    {item}
                  </button>
                ))}
              </div>

              {isAuthed ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                    <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1D4ED8] text-[12px] font-semibold text-white shadow-sm">
                      {initials}
                    </button>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-slate-800">{displayName}</p>
                      <p className="truncate text-[11px] text-slate-500">{username || 'Signed in'}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLogout?.();
                    }}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-semibold text-slate-900"
                  >
                    <LogOut className="h-4.5 w-4.5" />
                    Logout
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/login?mode=login');
                    }}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-semibold text-slate-900"
                  >
                    <LogIn className="h-4.5 w-4.5" />
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/login?mode=signup');
                    }}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#2563EB] px-4 text-[14px] font-semibold text-white"
                  >
                    <UserPlus className="h-4.5 w-4.5" />
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </header>

        <main className="pt-4 md:pt-6">
          <section className="px-1 text-center sm:px-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#FFF4DD] px-4 py-1.5 text-[12px] font-semibold text-[#C96A05] sm:px-5 sm:py-2 sm:text-[13px]">
              <Star className="h-4 w-4 fill-current" />
              Popular Tools
            </div>
            <h1 className="mt-3 text-[28px] font-black leading-[1.03] tracking-[-0.04em] text-[#08143C] sm:mt-4 sm:text-[34px] md:text-[44px]">
              Create Quotes, Invoices &amp; Business Documents
            </h1>
            <p className="mt-2 text-[15px] text-slate-600 sm:text-[18px]">All tools are free to use. No hidden charges.</p>
          </section>

          <section className="relative mt-4 px-0 sm:px-1 md:px-2">
            <button
              type="button"
              onClick={() => scrollTools('left')}
              className="absolute left-0 top-[136px] z-10 hidden h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-[0_3px_10px_rgba(15,23,42,0.08)] sm:flex"
              aria-label="Previous tools"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div
              ref={toolsScrollerRef}
              className="flex gap-4 overflow-x-auto scroll-smooth px-4 pb-2 pt-2 sm:gap-6 sm:px-14 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {toolCards.map((card) => (
                <article
                  key={card.title}
                  className={`w-[212px] shrink-0 rounded-[22px] border border-slate-200 bg-gradient-to-b ${card.iconWrap} to-white px-5 pb-5 pt-10 text-center shadow-[0_10px_30px_rgba(15,23,42,0.05)] sm:w-[232px] sm:px-7 sm:pb-6 sm:pt-13`}
                >
                  <div className="mx-auto flex h-[84px] w-[84px] items-center justify-center rounded-[28px] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)] sm:h-[96px] sm:w-[96px]">
                    <div className="scale-90 sm:scale-100">{card.renderIcon()}</div>
                  </div>
                  <h3 className="mt-4 text-[16px] font-black tracking-[-0.03em] text-[#09143C] sm:mt-5 sm:text-[18px]">{card.title}</h3>
                  <p className="mt-3 whitespace-pre-line text-[13px] leading-6 text-slate-700 sm:mt-4 sm:text-[15px] sm:leading-8">{card.description}</p>
                  <button
                    type="button"
                    onClick={() => navigate(card.route)}
                    className={`mt-5 inline-flex items-center gap-2 text-[14px] font-bold sm:mt-6 sm:text-[15px] ${card.accent}`}
                  >
                    Open Tool
                    <ArrowRight className="h-4.5 w-4.5" />
                  </button>
                </article>
              ))}
            </div>

            <button
              type="button"
              onClick={() => scrollTools('right')}
              className="absolute right-0 top-[136px] z-10 hidden h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-[0_3px_10px_rgba(15,23,42,0.08)] sm:flex"
              aria-label="Next tools"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </section>

          <section className="mt-7 px-3 sm:px-5">
            <h2 className="text-center text-[28px] font-black tracking-[-0.04em] text-[#08143C] sm:text-[32px]">Why iLoveQuote?</h2>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:mt-6 sm:gap-6 md:grid-cols-2 xl:grid-cols-5">
              {whyCards.map((card, index) => (
                <div
                  key={card.title}
                  className={`px-4 text-center sm:px-6 xl:px-8 ${index < whyCards.length - 1 ? 'xl:border-r xl:border-slate-200' : ''}`}
                >
                  <div className={`mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-full ${card.iconWrap} sm:h-[78px] sm:w-[78px]`}>
                    {card.icon}
                  </div>
                  <h3 className="mt-4 text-[16px] font-black text-[#08143C] sm:text-[18px]">{card.title}</h3>
                  <p className="mt-2 whitespace-pre-line text-[13px] leading-6 text-slate-700 sm:text-[15px] sm:leading-7">{card.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-7 px-3 pb-4 sm:px-5">
            <div className="text-center">
              <h2 className="text-[28px] font-black tracking-[-0.04em] text-[#08143C] sm:text-[32px]">How It Works</h2>
              <div className="mx-auto mt-2 h-[3px] w-[48px] rounded-full bg-[#2563EB]" />
            </div>

            <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-4">
              {workSteps.map((step, index) => (
                <div key={step.number} className="relative text-center">
                  {index < workSteps.length - 1 ? (
                    <div className="absolute left-[64%] top-[46px] hidden h-px w-[73%] border-t-2 border-dashed border-[#9CC0FF] lg:block" />
                  ) : null}

                  <div className={`relative mx-auto flex h-[76px] w-[76px] items-center justify-center rounded-full ${step.iconWrap} shadow-[0_8px_22px_rgba(15,23,42,0.05)] sm:h-[82px] sm:w-[82px]`}>
                    {step.icon}
                    <div className={`absolute -left-1 top-0 flex h-8 w-8 items-center justify-center rounded-full text-sm font-black text-white shadow-lg ${step.badge}`}>
                      {step.number}
                    </div>
                  </div>

                  <h3 className="mt-4 text-[16px] font-black text-[#08143C] sm:text-[18px]">{step.title}</h3>
                  <p className="mt-2 whitespace-pre-line text-[13px] leading-6 text-slate-700 sm:text-[15px] sm:leading-7">{step.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="px-5 pb-8 pt-2">
            <div className="overflow-hidden rounded-[18px] bg-[linear-gradient(90deg,#0068FF_0%,#2563EB_36%,#9A34F4_100%)] shadow-[0_14px_36px_rgba(37,99,235,0.22)]">
              <div className="flex flex-col items-center justify-between gap-5 px-8 py-7 md:flex-row">
                <div className="flex items-center gap-5">
                  <div className="relative flex h-20 w-28 items-end justify-center">
                    <div className="absolute bottom-0 left-2 h-7 w-20 rounded-t-full bg-white/90" />
                    <div className="absolute bottom-2 left-9 rotate-[-8deg] text-[38px]">🚀</div>
                  </div>
                  <div>
                    <h3 className="text-[22px] font-bold tracking-[-0.03em] text-white md:text-[24px]">
                      Start Creating Your First Document Now!
                    </h3>
                    <p className="mt-1 text-[16px] text-white/90">It's fast, easy and 100% free.</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/create-quote')}
                  className="inline-flex min-h-[56px] items-center gap-3 rounded-2xl bg-white px-8 text-[16px] font-bold text-[#2563EB] shadow-[0_10px_24px_rgba(15,23,42,0.16)]"
                >
                  Create Your First Document
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
