import React from 'react';
import {
  Bell,
  ChevronDown,
  CreditCard,
  Globe,
  Lock,
  LogOut,
  Paperclip,
  PenSquare,
  ShieldCheck,
  Smartphone,
  Upload,
  User,
} from 'lucide-react';

const innerNav = [
  { label: 'Profile Settings', icon: User, active: true },
  { label: 'Business Settings', icon: Paperclip },
  { label: 'Notifications', icon: Bell },
  { label: 'Quote Settings', icon: PenSquare },
  { label: 'Email Templates', icon: LogOut },
  { label: 'Payment & Taxes', icon: CreditCard },
  { label: 'Security', icon: Lock },
  { label: 'Users & Roles', icon: ShieldCheck },
  { label: 'Integrations', icon: Globe },
  { label: 'Billing & Subscription', icon: CreditCard },
];

const quickLinks = [
  { label: 'My Profile', icon: User },
  { label: 'Change Password', icon: Lock },
  { label: 'Login Activity', icon: Smartphone },
  { label: 'Download My Data', icon: Upload },
  { label: 'Delete Account', icon: LogOut, danger: true },
];

export default function SettingsPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
      <div className="px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
        <div className="mx-auto max-w-[1460px]">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-[27px] font-extrabold tracking-tight text-slate-900">
                Settings
              </h1>
              <p className="mt-2 text-[15px] text-slate-500">
                Manage your account preferences and application settings.
              </p>
            </div>

            <button className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-[14px] font-semibold text-slate-900 shadow-sm lg:inline-flex">
              <span className="text-[#F5B301]">★</span>
              Upgrade to Pro
            </button>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-[270px_minmax(0,1fr)_330px]">
            <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="space-y-2">
                {innerNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      className={[
                        'flex w-full items-center gap-3 rounded-xl px-4 py-4 text-left text-[14px] font-semibold transition-colors',
                        item.active
                          ? 'bg-[#EDF3FF] text-[#1650FF]'
                          : 'text-slate-700 hover:bg-slate-50',
                      ].join(' ')}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </aside>

            <main className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-6 border-b border-slate-200 px-6 py-6 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-[24px] font-extrabold tracking-tight text-slate-900">
                    Profile Settings
                  </h2>
                  <p className="mt-2 text-[14px] text-slate-500">
                    Update your personal information and account details.
                  </p>
                </div>

                <button className="inline-flex items-center gap-2 self-start rounded-xl bg-[#1650FF] px-5 py-3 text-[14px] font-semibold text-white shadow-sm">
                  <span className="text-[15px]">💾</span>
                  Save Changes
                </button>
              </div>

              <div className="px-6 py-6">
                <div className="space-y-7">
                  <div>
                    <div className="mb-4 text-[14px] font-semibold text-slate-900">Profile Picture</div>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="relative h-20 w-20 shrink-0 rounded-full bg-[#1650FF] text-[28px] font-medium text-white shadow-sm">
                        <span className="absolute inset-0 flex items-center justify-center">RS</span>
                        <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-white text-[#1650FF] shadow-sm">
                          <Upload className="h-4 w-4" />
                        </span>
                      </div>
                      <div className="flex flex-col gap-3">
                        <div className="text-[14px] text-slate-500">JPG, PNG or GIF. Max size of 2MB</div>
                        <button className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-[14px] font-semibold text-slate-900 shadow-sm">
                          <Upload className="h-4 w-4 text-[#1650FF]" />
                          Upload Photo
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-3 block text-[14px] font-semibold text-slate-900">Full Name</label>
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 text-[15px] text-slate-700 shadow-sm">
                      Rahul Sharma
                    </div>
                  </div>

                  <div>
                    <label className="mb-3 block text-[14px] font-semibold text-slate-900">Email Address</label>
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 text-[15px] text-slate-700 shadow-sm">
                      rahul.sharma@example.com
                    </div>
                  </div>

                  <div>
                    <label className="mb-3 block text-[14px] font-semibold text-slate-900">Phone Number</label>
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 text-[15px] text-slate-700 shadow-sm">
                      <span className="text-[18px]">🇮🇳</span>
                      <ChevronDown className="h-4 w-4 text-slate-500" />
                      <span className="ml-2">+91 98765 43210</span>
                    </div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-3 block text-[14px] font-semibold text-slate-900">Language</label>
                      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-4 text-[15px] text-slate-700 shadow-sm">
                        <span>English</span>
                        <ChevronDown className="h-4 w-4 text-slate-500" />
                      </div>
                    </div>
                    <div>
                      <label className="mb-3 block text-[14px] font-semibold text-slate-900">Time Zone</label>
                      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-4 text-[15px] text-slate-700 shadow-sm">
                        <span>(GMT+05:30) Asia/Kolkata</span>
                        <ChevronDown className="h-4 w-4 text-slate-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </main>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-[18px] font-extrabold tracking-tight text-slate-900">
                  Account Summary
                </h3>

                <div className="mt-6 space-y-5">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-[#F2F4FF] p-2 text-[#1650FF]">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-slate-500">User ID</div>
                      <div className="mt-1 text-[15px] font-semibold text-slate-900">USR-567890</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-[#F2F4FF] p-2 text-[#1650FF]">
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-slate-500">Member Since</div>
                      <div className="mt-1 text-[15px] font-semibold text-slate-900">16 May 2024</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-[#F2F4FF] p-2 text-[#1650FF]">
                      <Lock className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-slate-500">Account Type</div>
                      <div className="mt-1 text-[15px] font-semibold text-slate-900">Free Plan</div>
                      <div className="mt-1 text-[14px] font-semibold text-[#1650FF]">Upgrade to Pro</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-[#F2F4FF] p-2 text-[#1650FF]">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div className="w-full">
                      <div className="text-[13px] font-semibold text-slate-500">Storage Used</div>
                      <div className="mt-1 text-[15px] font-semibold text-slate-900">2.4 MB of 1 GB</div>
                      <div className="mt-3 flex items-center gap-2">
                        <div className="h-2 flex-1 rounded-full bg-slate-200">
                          <div className="h-2 w-[14%] rounded-full bg-slate-400" />
                        </div>
                        <span className="text-[12px] font-semibold text-slate-500">0%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-[18px] font-extrabold tracking-tight text-slate-900">
                  Quick Links
                </h3>

                <div className="mt-5 space-y-1">
                  {quickLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        className={[
                          'flex w-full items-center justify-between rounded-xl px-1 py-3 text-left text-[14px] font-semibold',
                          item.danger ? 'text-red-500' : 'text-[#1650FF]',
                        ].join(' ')}
                      >
                        <span className="flex items-center gap-3">
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </span>
                        <ChevronDown className="h-4 w-4 -rotate-90 text-slate-400" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-sm">
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-[#F8FBFF] text-[#1650FF]">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-[16px] font-extrabold text-slate-900">
                    Keep your account secure
                  </div>
                  <div className="mt-1 text-[14px] text-slate-500">
                    Enable two-factor authentication and keep your password updated regularly.
                  </div>
                </div>
              </div>

              <button className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-[14px] font-semibold text-[#1650FF] shadow-sm">
                Enable 2FA
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
