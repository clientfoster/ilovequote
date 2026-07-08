import React from 'react';
import { BookOpen, ChevronRight, Headphones, MessageCircle, PlayCircle, Search, Star } from 'lucide-react';

const helpTiles = [
  {
    title: 'Help Center',
    description: 'Browse articles and guides to learn how to create and manage invoices.',
    action: 'Browse Articles',
    icon: BookOpen,
    iconWrap: 'bg-[#EEF2FF] text-[#2F55FF]',
    targetId: 'popular-articles',
  },
  {
    title: 'Contact Support',
    description: 'Cannot find what you need? We are here to help with invoice setup and delivery.',
    action: 'Send a Message',
    icon: MessageCircle,
    iconWrap: 'bg-emerald-50 text-emerald-600',
    targetId: 'support-card',
  },
  {
    title: 'FAQ',
    description: 'Find answers to common invoice, customer, and payment questions.',
    action: 'View FAQ',
    icon: Star,
    iconWrap: 'bg-violet-50 text-violet-600',
    targetId: 'faq-section',
  },
  {
    title: 'Video Tutorials',
    description: 'Watch invoice walkthroughs for customer fetch, saving, and PDF export.',
    action: 'Watch Now',
    icon: PlayCircle,
    iconWrap: 'bg-amber-50 text-amber-500',
    targetId: 'video-tutorials',
  },
];

const articles = [
  {
    title: 'How to create a new invoice',
    description: 'Learn how to fill invoice details, dates, and line items correctly.',
  },
  {
    title: 'Managing customers',
    description: 'Learn how to add, edit, and fetch customer details inside the invoice module.',
  },
  {
    title: 'Adding products and services',
    description: 'See how to add line items, tax values, and pricing inside invoices.',
  },
  {
    title: 'Saving and downloading invoices',
    description: 'Understand how saved invoices, PDF export, and invoice history work.',
  },
];

const faqs = [
  {
    question: 'How do I save an invoice?',
    answer: 'Open the invoice preview and use the Save Invoice action. Logged-in users will find it later in My Invoices.',
  },
  {
    question: 'How do I download the PDF?',
    answer: 'Open the invoice design preview and tap Download PDF. It will export the live invoice layout as a PDF file.',
  },
  {
    question: 'How do I fetch customer details while creating an invoice?',
    answer: 'Save customer records in the Customers section, then select them from the invoice customer profile dropdown.',
  },
  {
    question: 'What if I do not want bank details on the invoice?',
    answer: 'Bank details are optional. You can leave that step blank and the invoice preview will still render cleanly.',
  },
];

export default function HelpSupportPage() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openSupportEmail = () => {
    const subject = encodeURIComponent('Invoice module support request');
    const body = encodeURIComponent('Hi support team,\n\nI need help with the invoice module...');
    window.location.href = `mailto:support@ilovequote.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] px-4 py-5 sm:px-6 lg:px-5">
      <div className="mx-auto w-full max-w-[1240px] space-y-6">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900">Help &amp; Support</h1>
          <p className="mt-2 text-[15px] text-slate-500">
            We are here to help with invoice creation, customer management, saving, and PDF export.
          </p>
        </div>

        <div className="flex items-center rounded-[12px] border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <input
            type="text"
            placeholder="Search invoice help articles..."
            className="w-full border-none bg-transparent text-[15px] font-medium text-slate-700 outline-none placeholder:text-slate-400"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                scrollToSection('popular-articles');
              }
            }}
          />
          <Search className="h-5 w-5 shrink-0 text-slate-700" />
        </div>

        <section>
          <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-slate-900">How can we help you?</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {helpTiles.map((tile) => {
              const Icon = tile.icon;
              return (
                <div key={tile.title} className="rounded-[14px] border border-slate-200 bg-white px-5 py-8 text-center shadow-sm">
                  <div className={`mx-auto flex h-[70px] w-[70px] items-center justify-center rounded-full ${tile.iconWrap}`}>
                    <Icon className="h-9 w-9" />
                  </div>
                  <h3 className="mt-5 text-[16px] font-semibold text-slate-900">{tile.title}</h3>
                  <p className="mx-auto mt-3 max-w-[220px] text-[14px] leading-6 text-slate-500">{tile.description}</p>
                  <button
                    type="button"
                    onClick={() => {
                      if (tile.targetId === 'support-card') {
                        openSupportEmail();
                        return;
                      }
                      scrollToSection(tile.targetId);
                    }}
                    className="mt-7 inline-flex items-center gap-2 text-[15px] font-semibold text-[#2457F0]"
                  >
                    {tile.action}
                    <ChevronRight className="h-4.5 w-4.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div id="popular-articles" className="rounded-[14px] border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between px-5 py-5">
              <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-slate-900">Popular Articles</h2>
            </div>
            <div className="divide-y divide-slate-200/70">
              {articles.map((article) => (
                <button
                  key={article.title}
                  type="button"
                  onClick={() => scrollToSection('faq-section')}
                  className="flex w-full items-center gap-4 px-5 py-5 text-left hover:bg-slate-50"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#2457F0]">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[15px] font-semibold text-slate-900">{article.title}</h3>
                    <p className="mt-1 text-[13px] leading-6 text-slate-500">{article.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-slate-700" />
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[14px] border border-slate-200 bg-white p-5 shadow-sm" id="support-card">
            <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-slate-900">Still need help?</h2>
            <div className="mt-8 flex flex-col items-center text-center">
              <div className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-[#EEF2FF] text-[#2457F0]">
                <Headphones className="h-9 w-9" />
              </div>
              <p className="mt-6 max-w-[220px] text-[14px] leading-6 text-slate-500">
                Our support team is ready to assist you with invoice flow, customer fetch, and PDF export questions.
              </p>
              <button
                type="button"
                onClick={openSupportEmail}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#2457F0] px-5 py-3 text-[15px] font-semibold text-white shadow-sm"
              >
                Contact Support
              </button>
            </div>
          </div>
        </section>

        <section id="faq-section" className="rounded-[14px] border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-slate-900">FAQ</h2>
          <div className="mt-4 space-y-4">
            {faqs.map((faq) => (
              <button
                key={faq.question}
                type="button"
                onClick={() => scrollToSection('video-tutorials')}
                className="w-full rounded-[12px] border border-slate-200 px-4 py-4 text-left transition hover:bg-slate-50"
              >
                <p className="text-[15px] font-semibold text-slate-900">{faq.question}</p>
                <p className="mt-1 text-[13px] leading-6 text-slate-500">{faq.answer}</p>
              </button>
            ))}
          </div>
        </section>

        <section id="video-tutorials" className="rounded-[14px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
              <PlayCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-slate-900">Video Tutorials</h2>
              <p className="mt-1 text-[13px] leading-6 text-slate-500">
                Tutorial videos for the invoice module are being prepared. For now, use the support link above to get live help.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
