import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Globe, 
  User, 
  Instagram, 
  Linkedin, 
  MessageSquare, 
  Phone, 
  Building2, 
  Sparkles,
  Smartphone,
  CheckCircle,
  Wifi,
  Battery,
  Youtube
} from 'lucide-react';
import { BusinessFormValues, SocialLink } from '../types';

interface QRCodePreviewProps {
  formData: Partial<BusinessFormValues>;
}

export default function QRCodePreview({ formData }: QRCodePreviewProps) {
  const companyName = formData.companyName || '';
  const tagline = formData.tagline || '';
  const slug = formData.businessSlug || '';
  const phone = formData.phone || '';
  const website = formData.website || '';
  
  // Combine portfolio domain or relative path
  const portfolioUrl = slug ? `${window.location.origin}/portfolio/${slug}` : `${window.location.origin}/portfolio`;

  // Helper to extract social URL by platform name safely
  const getSocialUrl = (platformName: string): string => {
    return formData.socialLinks?.find(
      (s: SocialLink) => s.platform.toLowerCase().trim() === platformName.toLowerCase().trim()
    )?.url || '';
  };

  const instagramUrl = getSocialUrl('Instagram');
  const linkedinUrl = getSocialUrl('LinkedIn');
  const facebookUrl = getSocialUrl('Facebook');
  const twitterUrl = getSocialUrl('X (Twitter)');
  const youtubeUrl = getSocialUrl('YouTube');
  
  // WhatsApp is active if phone is supplied or user configured a link
  const whatsappUrl = getSocialUrl('WhatsApp') || (phone ? `https://wa.me/${phone.replace(/[^0-9]/g, '')}` : '');

  // Determine which actions to show based on non-empty values
  const actionItems = [
    { id: 'website', name: 'Our Website', url: website, icon: <Globe className="w-4 h-4" />, color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
    { id: 'portfolio', name: 'Our Portfolio', url: portfolioUrl, icon: <User className="w-4 h-4" />, color: 'bg-[#1D4ED8]/10 text-[#1D4ED8] border-[#1D4ED8]/20' },
    { id: 'instagram', name: 'Instagram', url: instagramUrl, icon: <Instagram className="w-4 h-4" />, color: 'bg-rose-50 text-rose-600 border-rose-100' },
    { id: 'linkedin', name: 'LinkedIn', url: linkedinUrl, icon: <Linkedin className="w-4 h-4" />, color: 'bg-sky-50 text-[#1D4ED8] border-sky-100' },
    { id: 'facebook', name: 'Facebook', url: facebookUrl, icon: <Globe className="w-4 h-4" />, color: 'bg-blue-50 text-blue-600 border-blue-100' },
    { id: 'xtwitter', name: 'X (Twitter)', url: twitterUrl, icon: <Globe className="w-4 h-4" />, color: 'bg-slate-100 text-slate-800 border-slate-200' },
    { id: 'youtube', name: 'YouTube', url: youtubeUrl, icon: <Youtube className="w-4 h-4" />, color: 'bg-red-50 text-red-650 border-red-150' },
    { id: 'whatsapp', name: 'WhatsApp', url: whatsappUrl, icon: <MessageSquare className="w-4 h-4" />, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { id: 'call', name: 'Call Us', url: phone ? `tel:${phone}` : '', icon: <Phone className="w-4 h-4" />, color: 'bg-teal-50 text-teal-600 border-teal-100' },
  ].filter(item => item.url && item.url.trim() !== '');

  // Current formatted time for phone status bar
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="w-full flex flex-col items-center select-none" id="mobile-mockup-wrapper">
      
      {/* Smartphone Chassis Bezel */}
      <div 
        className="relative w-full max-w-[310px] h-[585px] bg-[#0F172A] p-2.5 rounded-[44px] shadow-2xl border-4 border-slate-800 transition-all duration-300" 
        id="smartphone-bezel"
      >
        {/* Notch Camera Indicator */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-[#0F172A] rounded-full z-30 flex items-center justify-center">
          <div className="w-12 h-1 bg-slate-800 rounded-full mb-1" />
          <div className="w-2.5 h-2.5 bg-slate-900 rounded-full absolute right-5 top-1 border border-slate-800/40" />
        </div>

        {/* Screen Content Wrapper */}
        <div 
          className="w-full h-full bg-[#F8FAFC] rounded-[34px] overflow-hidden flex flex-col relative"
          id="smartphone-screen"
        >
          {/* Internal StatusBar */}
          <div className="h-8 bg-[#0F172A] text-white px-6 pt-1 flex justify-between items-center text-[10px] uppercase font-sans tracking-tight z-20 shrink-0">
            <span className="font-semibold tracking-wide text-[9px]">{currentTime}</span>
            <div className="flex items-center gap-1.5 opacity-90">
              <Wifi className="w-3.5 h-3.5" />
              <div className="flex items-center gap-0.5">
                <span className="text-[9px] font-bold font-mono">LTE</span>
                <Battery className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
              </div>
            </div>
          </div>

          {/* Dynamic Scrollable Canvas */}
          <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col text-slate-800 space-y-4 custom-scrollbar" id="mobile-canvas">
            
            {/* Header Identity banner */}
            <div className="text-center py-2 shrink-0">
              {formData.logo ? (
                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden mx-auto mb-2.5 animate-fade-in">
                  <img 
                    src={formData.logo} 
                    alt="Logo preview" 
                    className="max-w-full max-h-full object-contain p-1.5"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="w-14 h-14 bg-gradient-to-tr from-[#1D4ED8] to-indigo-600 rounded-2xl shadow-md mx-auto mb-2.5 flex items-center justify-center text-white font-extrabold text-xl">
              {companyName ? companyName.charAt(0).toUpperCase() : '?'}
              </div>
              )}
              {companyName && (
                <h4 className="text-sm font-extrabold text-slate-900 leading-tight tracking-tight line-clamp-1 px-2">
                  {companyName}
                </h4>
              )}
              {tagline && (
                <p className="text-[10px] text-slate-505 font-medium italic mt-1 leading-snug max-w-[190px] mx-auto line-clamp-2">
                  {tagline}
                </p>
              )}
            </div>

            {/* Quick Action Buttons list exactly as shown in screenshot requirements */}
            <div className="space-y-2 shrink-0">
              <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase block pl-1">
                Quick Action Links
              </span>
              
              {actionItems.length > 0 ? (
                <div className="grid grid-cols-2 gap-2" id="quick-action-links-grid">
                  {actionItems.map((action) => (
                    <a
                      key={action.id}
                      href={action.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-1.5 px-2.5 py-2.5 border rounded-xl text-[10px] font-black transition-all hover:scale-[1.02] shadow-xs active:scale-95 ${action.color}`}
                    >
                      <span className="shrink-0">{action.icon}</span>
                      <span className="truncate">{action.name}</span>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5 px-3 bg-white border border-slate-200/60 rounded-2xl text-[9px] text-slate-400 font-medium">
                  Add your website, social links, or phone number to preview communication buttons.
                </div>
              )}
            </div>

            {/* Live Portfolio QR Code space automatically generated */}
            <div className="mt-auto pt-4 border-t border-slate-200/50 flex flex-col items-center shrink-0">
              
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-tr from-[#1D4ED8]/30 to-violet-500/20 rounded-2xl blur-xs group-hover:opacity-100 transition duration-300"></div>
                <div className="relative bg-white p-2.5 rounded-2xl shadow-xs border border-slate-200">
                  <QRCodeSVG
                    value={portfolioUrl}
                    size={90}
                    level="H"
                    includeMargin={false}
                    fgColor="#0F172A"
                  />
                </div>
              </div>

              <div className="text-center mt-2 space-y-0.5">
                <div className="inline-flex items-center gap-1 text-[8px] font-extrabold text-[#1D4ED8] bg-blue-50/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  <Sparkles className="w-2.5 h-2.5" />
                  Portfolio QR Ready
                </div>
                <p className="text-[9px] font-mono font-bold text-slate-700">
                  /portfolio/<span className="text-[#1D4ED8]">{slug || 'your-business'}</span>
                </p>
              </div>
            </div>

          </div>

          {/* Simple iPhone home indicator swipe bar */}
          <div className="h-5 bg-white shrink-0 flex items-center justify-center pb-2.5 relative">
            <div className="w-24 h-1 bg-slate-900 rounded-full" />
          </div>
        </div>
      </div>
      
    </div>
  );
}
