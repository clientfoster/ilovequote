import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronRight,
  CreditCard,
  Download,
  Lock,
  LogOut,
  Smartphone,
  Trash2,
  Upload,
  User,
} from 'lucide-react';
import { apiRequest, apiUrl } from '../api';
import { getDisplayAuthUser, setStoredAuthUser, signOut } from '../auth';
import { AuthUser } from '../auth';
import { useNavigate } from 'react-router-dom';

type SectionKey = 'profile' | 'security' | 'activity' | 'data' | 'danger';

type ActivityItem = {
  id: string;
  type: string;
  at: string;
  ip?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
};

const sections: Array<{
  key: SectionKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: 'profile', label: 'Profile Settings', icon: User },
  { key: 'security', label: 'Security', icon: Lock },
  { key: 'activity', label: 'Login Activity', icon: Smartphone },
  { key: 'data', label: 'Download My Data', icon: Download },
  { key: 'danger', label: 'Delete Account', icon: Trash2 },
];

function formatDate(value?: string) {
  if (!value) return 'Recently joined';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

function triggerFileDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, displayName, username, initials, email, phone } = getDisplayAuthUser();
  const [activeSection, setActiveSection] = useState<SectionKey>('profile');
  const [profileName, setProfileName] = useState(displayName);
  const [profilePhone, setProfilePhone] = useState(phone);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const sectionRefs = useRef<Record<SectionKey, HTMLDivElement | null>>({
    profile: null,
    security: null,
    activity: null,
    data: null,
    danger: null,
  });

  const memberSince = user?.createdAt ? formatDate(user.createdAt) : 'Recently joined';

  useEffect(() => {
    let active = true;
    apiRequest<{ items: ActivityItem[] }>('/api/account/activity')
      .then((payload) => {
        if (active) setActivities(payload.items || []);
      })
      .catch(() => {
        if (active) setActivities([]);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setProfileName(displayName);
    setProfilePhone(phone);
  }, [displayName, phone]);

  const visibleSections = useMemo(() => sections, []);

  const scrollToSection = (key: SectionKey) => {
    setActiveSection(key);
    sectionRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSaveChanges = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await apiRequest<{ user: AuthUser; message?: string }>('/api/account/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name: profileName,
          phone: profilePhone,
        }),
      });
      setStoredAuthUser(result.user);
      setMessage(result.message || 'Profile saved successfully.');
      window.setTimeout(() => window.location.reload(), 450);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile changes.');
    } finally {
      setBusy(false);
    }
  };

  const handleChangePassword = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      if (newPassword.length < 8) {
        throw new Error('New password must be at least 8 characters long.');
      }
      if (newPassword !== confirmPassword) {
        throw new Error('New password and confirmation do not match.');
      }

      const result = await apiRequest<{ message?: string }>('/api/account/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage(result.message || 'Password changed successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change password.');
    } finally {
      setBusy(false);
    }
  };

  const handleDownloadData = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(apiUrl('/api/account/export'), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('ilovequote_auth_token') || ''}`,
        },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || payload.error || 'Could not export account data.');
      }

      const blob = await response.blob();
      triggerFileDownload(blob, 'ilovequote-my-data.json');
      setMessage('Your account data download has started.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not export account data.');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('This will permanently delete your account and saved quotes. Continue?')) {
      return;
    }

    setBusy(true);
    setError('');
    setMessage('');
    try {
      await apiRequest('/api/account', { method: 'DELETE' });
      signOut();
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete account.');
    } finally {
      setBusy(false);
    }
  };

  const authTypeLabel = user?.authMethod === 'phone' ? 'Phone' : 'Email';

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
      <div className="px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
        <div className="mx-auto max-w-[1460px]">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-[27px] font-extrabold tracking-tight text-slate-900">Settings</h1>
              <p className="mt-2 text-[15px] text-slate-500">
                Manage your account preferences and application settings.
              </p>
            </div>

            <button type="button" className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-[14px] font-semibold text-slate-900 shadow-sm lg:inline-flex">
              <span className="text-[#F5B301]">★</span>
              Upgrade to Pro
            </button>
          </div>

          {message ? (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {message}
            </div>
          ) : null}

          {error ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 xl:grid-cols-[270px_minmax(0,1fr)_330px]">
            <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="space-y-2">
                {visibleSections.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => scrollToSection(item.key)}
                      className={[
                        'flex w-full items-center gap-3 rounded-xl px-4 py-4 text-left text-[14px] font-semibold transition-colors',
                        isActive ? 'bg-[#EDF3FF] text-[#1650FF]' : 'text-slate-700 hover:bg-slate-50',
                      ].join(' ')}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </aside>

            <main className="space-y-4">
              <section ref={(node) => { sectionRefs.current.profile = node; }} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-6 border-b border-slate-200 px-6 py-6 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-[24px] font-extrabold tracking-tight text-slate-900">Profile Settings</h2>
                    <p className="mt-2 text-[14px] text-slate-500">Update your personal information and account details.</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveChanges}
                    disabled={busy}
                    className="inline-flex items-center gap-2 self-start rounded-xl bg-[#1650FF] px-5 py-3 text-[14px] font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <span className="text-[15px]">💾</span>
                    Save Changes
                  </button>
                </div>

                <div className="px-6 py-6">
                  <div className="space-y-7">
                    <div>
                      <div className="mb-4 text-[14px] font-semibold text-slate-900">Profile Picture</div>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#1650FF] text-[28px] font-medium text-white shadow-sm">
                          {initials}
                          <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-white text-[#1650FF] shadow-sm">
                            <Upload className="h-4 w-4" />
                          </span>
                        </div>
                        <div className="flex flex-col gap-3">
                          <div className="text-[14px] text-slate-500">JPG, PNG or GIF. Max size of 2MB</div>
                          <button type="button" className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-[14px] font-semibold text-slate-900 shadow-sm">
                            <Upload className="h-4 w-4 text-[#1650FF]" />
                            Upload Photo
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <label className="mb-3 block text-[14px] font-semibold text-slate-900">Full Name</label>
                        <input
                          value={profileName}
                          onChange={(event) => setProfileName(event.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-4 text-[15px] text-slate-700 shadow-sm outline-none"
                          placeholder="Your name"
                        />
                      </div>

                      <div>
                        <label className="mb-3 block text-[14px] font-semibold text-slate-900">Username</label>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-[15px] text-slate-600 shadow-sm">
                          {username || email || phone || 'Account'}
                        </div>
                        <p className="mt-2 text-[12px] text-slate-500">Your username follows the signup method: email or phone.</p>
                      </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <label className="mb-3 block text-[14px] font-semibold text-slate-900">Email Address</label>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-[15px] text-slate-700 shadow-sm">
                          {email || 'your-email@example.com'}
                        </div>
                      </div>

                      <div>
                        <label className="mb-3 block text-[14px] font-semibold text-slate-900">Phone Number</label>
                        <input
                          value={profilePhone}
                          onChange={(event) => setProfilePhone(event.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-4 text-[15px] text-slate-700 shadow-sm outline-none"
                          placeholder="+91 98765 43210"
                        />
                      </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <label className="mb-3 block text-[14px] font-semibold text-slate-900">Account Type</label>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-[15px] text-slate-700 shadow-sm">
                          {authTypeLabel}
                        </div>
                      </div>
                      <div>
                        <label className="mb-3 block text-[14px] font-semibold text-slate-900">Member Since</label>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-[15px] text-slate-700 shadow-sm">
                          {memberSince}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section ref={(node) => { sectionRefs.current.security = node; }} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-6 py-5">
                  <h2 className="text-[20px] font-extrabold tracking-tight text-slate-900">Security</h2>
                  <p className="mt-2 text-[14px] text-slate-500">Change your password and keep your account protected.</p>
                </div>
                <div className="grid gap-5 px-6 py-6 md:grid-cols-3">
                  <div className="md:col-span-2 grid gap-4">
                    <div>
                      <label className="mb-2 block text-[13px] font-semibold text-slate-700">Current Password</label>
                      <input
                        value={currentPassword}
                        onChange={(event) => setCurrentPassword(event.target.value)}
                        type="password"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] outline-none"
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-[13px] font-semibold text-slate-700">New Password</label>
                        <input
                          value={newPassword}
                          onChange={(event) => setNewPassword(event.target.value)}
                          type="password"
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-[13px] font-semibold text-slate-700">Confirm Password</label>
                        <input
                          value={confirmPassword}
                          onChange={(event) => setConfirmPassword(event.target.value)}
                          type="password"
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] outline-none"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleChangePassword}
                      disabled={busy}
                      className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#1650FF] px-5 py-3 text-[14px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <Lock className="h-4 w-4" />
                      Change Password
                    </button>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-5">
                    <div className="text-[13px] font-semibold uppercase tracking-[0.2em] text-slate-500">Password Tips</div>
                    <ul className="mt-4 space-y-3 text-[14px] text-slate-600">
                      <li>Use at least 8 characters.</li>
                      <li>Mix letters, numbers, and symbols.</li>
                      <li>Never reuse a password from another site.</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section ref={(node) => { sectionRefs.current.activity = node; }} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-6 py-5">
                  <h2 className="text-[20px] font-extrabold tracking-tight text-slate-900">Login Activity</h2>
                  <p className="mt-2 text-[14px] text-slate-500">Recent sign-ins and account activity.</p>
                </div>
                <div className="px-6 py-6">
                  {activities.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-[14px] text-slate-500">
                      No recent activity yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activities.map((item) => (
                        <div key={item.id} className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                          <div>
                            <div className="text-[14px] font-semibold text-slate-900">{item.type.replace(/_/g, ' ')}</div>
                            <div className="mt-1 text-[13px] text-slate-500">{formatDate(item.at)}</div>
                          </div>
                          <div className="text-right text-[12px] text-slate-500">
                            {item.ip ? <div>{item.ip}</div> : null}
                            {item.userAgent ? <div className="max-w-[220px] truncate">{item.userAgent}</div> : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <section ref={(node) => { sectionRefs.current.data = node; }} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-6 py-5">
                  <h2 className="text-[20px] font-extrabold tracking-tight text-slate-900">Download My Data</h2>
                  <p className="mt-2 text-[14px] text-slate-500">Export your profile and saved quotes as a JSON file.</p>
                </div>
                <div className="flex flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
                  <div className="text-[14px] text-slate-600">
                    Includes your account details, login activity, and owned quotes.
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadData}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-[14px] font-semibold text-[#1650FF] shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <Download className="h-4 w-4" />
                    Download My Data
                  </button>
                </div>
              </section>

              <section ref={(node) => { sectionRefs.current.danger = node; }} className="rounded-2xl border border-red-200 bg-white shadow-sm">
                <div className="border-b border-red-200 px-6 py-5">
                  <h2 className="text-[20px] font-extrabold tracking-tight text-red-600">Delete Account</h2>
                  <p className="mt-2 text-[14px] text-slate-500">This removes your profile, tokens, and saved quotes.</p>
                </div>
                <div className="flex flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
                  <div className="text-[14px] text-slate-600">
                    This action cannot be undone.
                  </div>
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-5 py-3 text-[14px] font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Account
                  </button>
                </div>
              </section>
            </main>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-[18px] font-extrabold tracking-tight text-slate-900">Account Summary</h3>

                <div className="mt-6 space-y-5">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-[#F2F4FF] p-2 text-[#1650FF]">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-slate-500">Username</div>
                      <div className="mt-1 text-[15px] font-semibold text-slate-900">{username || email || phone || 'Account'}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-[#F2F4FF] p-2 text-[#1650FF]">
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-slate-500">Member Since</div>
                      <div className="mt-1 text-[15px] font-semibold text-slate-900">{memberSince}</div>
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
                <h3 className="text-[18px] font-extrabold tracking-tight text-slate-900">Quick Links</h3>
                <div className="mt-5 space-y-1">
                  {sections.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => scrollToSection(item.key)}
                        className="flex w-full items-center justify-between rounded-xl px-1 py-3 text-left text-[14px] font-semibold text-[#1650FF]"
                      >
                        <span className="flex items-center gap-3">
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </span>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-[18px] font-extrabold tracking-tight text-slate-900">Session</h3>
                <p className="mt-3 text-[14px] text-slate-500">
                  Signed in as <span className="font-semibold text-slate-900">{displayName}</span>.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    navigate('/login');
                  }}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-[14px] font-semibold text-slate-700 shadow-sm"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
