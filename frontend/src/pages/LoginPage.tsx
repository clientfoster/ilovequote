import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Globe,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import BrandMark from '../components/BrandMark';
import { AuthUser } from '../auth';
import { signIn } from '../auth';
import { apiRequest } from '../api';
import { isFirebasePhoneConfigured, requestPhoneOtp } from '../firebasePhoneAuth';
import { ConfirmationResult } from 'firebase/auth';

interface LoginPageProps {
  onLogin?: (user: AuthUser) => void;
}

type FlowMode = 'signup' | 'login';
type SignupStep = 'email' | 'otp' | 'password';
type LoginView = 'password' | 'otp' | 'forgot' | 'resetOtp' | 'reset';

function isEmailIdentifier(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function normalizePhoneForFirebase(value: unknown) {
  const trimmed = String(value || '').trim();
  if (trimmed.startsWith('+')) {
    return `+${trimmed.slice(1).replace(/\D/g, '')}`;
  }

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91${digits}`;
  }

  return digits ? `+${digits}` : '';
}

function friendlyFirebasePhoneError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || '');
  const code = (error as { code?: string } | null)?.code || '';

  if (code.includes('invalid-phone-number')) {
    return 'Invalid phone number. Use country code format, for example +919876543210.';
  }
  if (code.includes('too-many-requests') || code.includes('quota-exceeded')) {
    return 'Too many OTP requests. Please wait a while and try again.';
  }
  if (code.includes('invalid-verification-code')) {
    return 'Invalid OTP. Please check the code and try again.';
  }
  if (code.includes('code-expired')) {
    return 'OTP expired. Please send a new OTP.';
  }
  if (code.includes('captcha-check-failed')) {
    return 'reCAPTCHA failed. Refresh the page and try again.';
  }
  if (code.includes('unauthorized-domain')) {
    return 'This domain is not authorized in Firebase. Add your live domain in Firebase Authentication authorized domains.';
  }
  if (code.includes('operation-not-allowed')) {
    return 'Phone sign-in is not enabled in Firebase Authentication.';
  }
  if (code.includes('missing-app-credential') || code.includes('app-not-authorized')) {
    return 'Firebase app is not authorized. Check your Firebase web config and authorized domains.';
  }
  if (code.includes('argument-error')) {
    return 'Could not start phone OTP. Please refresh and try again.';
  }

  return message || 'Could not complete phone OTP request.';
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<FlowMode>(() => {
    const modeParam = new URLSearchParams(location.search).get('mode');
    return modeParam === 'login' ? 'login' : 'signup';
  });
  const [step, setStep] = useState<SignupStep>('email');
  const [loginView, setLoginView] = useState<LoginView>(() => {
    const params = new URLSearchParams(location.search);
    return params.get('resetToken') ? 'reset' : 'password';
  });
  const [email, setEmail] = useState('you@business.com');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginOtp, setLoginOtp] = useState('');
  const [loginOtpSessionId, setLoginOtpSessionId] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetSessionId, setResetSessionId] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [devResetOtp, setDevResetOtp] = useState('');
  const [phoneConfirmation, setPhoneConfirmation] = useState<ConfirmationResult | null>(null);
  const [loginPhoneConfirmation, setLoginPhoneConfirmation] = useState<ConfirmationResult | null>(null);
  const [resetPhoneConfirmation, setResetPhoneConfirmation] = useState<ConfirmationResult | null>(null);
  const [phoneBusy, setPhoneBusy] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const modeParam = params.get('mode');
    const tokenParam = params.get('resetToken') || '';

    if (modeParam === 'login' || modeParam === 'signup') {
      setMode(modeParam);
    }

    if (tokenParam) {
      setMode('login');
      setLoginView('reset');
      setResetToken(tokenParam);
      setError('');
      setInfo('');
      setDevResetToken('');
      return;
    }

    if (modeParam === 'login') {
    setLoginView((current) => (current === 'otp' || current === 'forgot' || current === 'resetOtp' || current === 'reset' ? 'password' : current));
    } else if (modeParam === 'signup') {
      setLoginView('password');
    }
  }, [location.search]);

  const stepIndex = useMemo(() => {
    if (step === 'email') return 1;
    if (step === 'otp') return 2;
    return 3;
  }, [step]);

  const emailFieldIsPhone = useMemo(() => {
    const value = email.trim();
    return Boolean(value && !isEmailIdentifier(value) && /\d/.test(value));
  }, [email]);

  const handleCreateRequestOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setInfo('');

    if (emailFieldIsPhone) {
      await handleSendPhoneOtp(email);
      return;
    }

    setBusy(true);

    try {
      const result = await apiRequest<{ sessionId: string; message?: string; devOtp?: string }>(
        '/api/auth/request-otp',
        {
          method: 'POST',
          body: JSON.stringify({ email, name }),
        },
      );
      setSessionId(result.sessionId);
      setStep('otp');
      setInfo(result.message || 'We sent a one-time code to your email.');
      setDevOtp(result.devOtp || '');
      setOtp('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not request OTP');
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setInfo('');

    if (phoneConfirmation) {
      await handleVerifyPhoneOtp();
      return;
    }

    setBusy(true);

    try {
      const result = await apiRequest<{ verificationToken: string; message?: string }>(
        '/api/auth/verify-otp',
        {
          method: 'POST',
          body: JSON.stringify({ email, sessionId, otp }),
        },
      );
      setVerificationToken(result.verificationToken);
      setStep('password');
      setInfo(result.message || 'OTP verified. Create your password next.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not verify OTP');
    } finally {
      setBusy(false);
    }
  };

  const handleCreatePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setInfo('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      const result = await apiRequest<{ authToken: string; user: { id: string; email: string; name: string }; message?: string }>(
        '/api/auth/register',
        {
          method: 'POST',
          body: JSON.stringify({
            email: phoneConfirmation ? '' : email,
            phone: phoneConfirmation ? email : '',
            name,
            password,
            verificationToken,
          }),
        },
      );
      signIn(result.authToken, result.user);
      onLogin?.(result.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create account');
    } finally {
      setBusy(false);
    }
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setInfo('');
    setBusy(true);

    try {
      const result = await apiRequest<{ authToken: string; user: { id: string; email: string; name: string } }>(
        '/api/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({
            identifier: email,
            password: loginPassword,
          }),
        },
      );
      signIn(result.authToken, result.user);
      onLogin?.(result.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in');
    } finally {
      setBusy(false);
    }
  };

  const handleRequestLoginOtp = async () => {
    setError('');
    setInfo('');
    setLoginOtp('');
    setLoginOtpSessionId('');
    setLoginPhoneConfirmation(null);
    setBusy(true);

    try {
      const identifier = email.trim();
      if (emailFieldIsPhone) {
        const phone = normalizePhoneForFirebase(identifier);
        const confirmation = await requestPhoneOtp(phone, 'firebase-login-recaptcha');
        setLoginPhoneConfirmation(confirmation);
        setEmail(phone);
        setLoginView('otp');
        setInfo(`Login OTP sent to ${phone}.`);
        return;
      }

      const result = await apiRequest<{ sessionId: string; message?: string; devOtp?: string }>(
        '/api/auth/request-login-otp',
        {
          method: 'POST',
          body: JSON.stringify({ identifier }),
        },
      );
      setLoginOtpSessionId(result.sessionId);
      setDevOtp(result.devOtp || '');
      setLoginView('otp');
      setInfo(result.message || 'Login OTP sent to your email.');
    } catch (err) {
      setError(friendlyFirebasePhoneError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyLoginOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setInfo('');

    if (loginOtp.length !== 6) {
      setError('Enter the 6-digit login OTP.');
      return;
    }

    setBusy(true);
    try {
      if (loginPhoneConfirmation) {
        const credential = await loginPhoneConfirmation.confirm(loginOtp);
        const idToken = await credential.user.getIdToken();
        const result = await apiRequest<{ authToken: string; user: AuthUser; message?: string }>(
          '/api/auth/firebase-phone',
          {
            method: 'POST',
            body: JSON.stringify({ idToken }),
          },
        );
        signIn(result.authToken, result.user);
        onLogin?.(result.user);
        navigate('/dashboard');
        return;
      }

      const result = await apiRequest<{ authToken: string; user: AuthUser; message?: string }>(
        '/api/auth/verify-login-otp',
        {
          method: 'POST',
          body: JSON.stringify({ email, sessionId: loginOtpSessionId, otp: loginOtp }),
        },
      );
      signIn(result.authToken, result.user);
      onLogin?.(result.user);
      navigate('/dashboard');
    } catch (err) {
      setError(friendlyFirebasePhoneError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSendPhoneOtp = async (phoneOverride?: string) => {
    setError('');
    setInfo('');
    setPhoneBusy(true);

    try {
      if (!isFirebasePhoneConfigured()) {
        throw new Error('Firebase phone login is not configured yet. Add the VITE_FIREBASE_* values.');
      }

      const phone = normalizePhoneForFirebase(phoneOverride || email);
      if (!phone || phone.length < 8) {
        throw new Error('Enter a valid phone number, for example +919876543210.');
      }

      const confirmation = await requestPhoneOtp(phone, 'firebase-phone-recaptcha');
      setPhoneConfirmation(confirmation);
      setOtp('');
      setEmail(phone);
      setStep('otp');
      setInfo(`OTP sent to ${phone}. Enter it in the phone OTP box below.`);
    } catch (err) {
      setError(friendlyFirebasePhoneError(err));
    } finally {
      setPhoneBusy(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    setError('');
    setInfo('');

    if (!phoneConfirmation) {
      setError('Please send the phone OTP first.');
      return;
    }

    setPhoneBusy(true);
    try {
      const credential = await phoneConfirmation.confirm(otp);
      const idToken = await credential.user.getIdToken();
      const result = await apiRequest<{ verificationToken: string; phone: string; message?: string }>(
        '/api/auth/verify-phone-otp',
        {
          method: 'POST',
          body: JSON.stringify({ idToken }),
        },
      );

      setVerificationToken(result.verificationToken);
      setEmail(result.phone);
      setStep('password');
      setInfo(result.message || 'Phone verified. Create your password next.');
    } catch (err) {
      setError(friendlyFirebasePhoneError(err));
    } finally {
      setPhoneBusy(false);
    }
  };

  const handleRequestPasswordReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setInfo('');
    setResetSessionId('');
    setResetOtp('');
    setResetToken('');
    setResetPhoneConfirmation(null);
    setDevResetOtp('');
    setBusy(true);

    try {
      const identifier = email.trim();
      const result = await apiRequest<{ delivery?: 'email' | 'firebase-phone'; phone?: string; sessionId?: string; message?: string; devOtp?: string }>(
        '/api/auth/request-password-reset',
        {
          method: 'POST',
          body: JSON.stringify({ identifier }),
        },
      );

      if (result.delivery === 'firebase-phone') {
        const phone = normalizePhoneForFirebase(result.phone || identifier);
        const confirmation = await requestPhoneOtp(phone, 'firebase-reset-recaptcha');
        setResetPhoneConfirmation(confirmation);
        setEmail(phone);
        setLoginView('resetOtp');
        setInfo(result.message || `Recovery OTP sent to ${phone}.`);
        return;
      }

      setInfo(result.message || 'If an account exists for that email, we sent a recovery OTP.');
      setDevResetOtp(result.devOtp || '');
      if (result.sessionId) {
        setResetSessionId(result.sessionId);
        setLoginView('resetOtp');
      }
    } catch (err) {
      setError(friendlyFirebasePhoneError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyPasswordResetOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setInfo('');

    if (resetOtp.length !== 6) {
      setError('Enter the 6-digit recovery OTP.');
      return;
    }

    setBusy(true);
    try {
      if (resetPhoneConfirmation) {
        const credential = await resetPhoneConfirmation.confirm(resetOtp);
        const idToken = await credential.user.getIdToken();
        const result = await apiRequest<{ resetToken: string; message?: string }>(
          '/api/auth/verify-phone-password-reset',
          {
            method: 'POST',
            body: JSON.stringify({ idToken }),
          },
        );
        setResetToken(result.resetToken);
      } else {
        const result = await apiRequest<{ resetToken: string; message?: string }>(
          '/api/auth/verify-password-reset-otp',
          {
            method: 'POST',
            body: JSON.stringify({ email, sessionId: resetSessionId, otp: resetOtp }),
          },
        );
        setResetToken(result.resetToken);
      }

      setLoginView('reset');
      setResetPassword('');
      setResetConfirmPassword('');
      setInfo('Recovery OTP verified. Create your new password.');
    } catch (err) {
      setError(friendlyFirebasePhoneError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmPasswordReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setInfo('');

    if (resetPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (resetPassword !== resetConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      const result = await apiRequest<{ authToken: string; user: AuthUser; message?: string }>(
        '/api/auth/confirm-password-reset',
        {
          method: 'POST',
          body: JSON.stringify({
            resetToken,
            password: resetPassword,
          }),
        },
      );

      signIn(result.authToken, result.user);
      onLogin?.(result.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset password');
    } finally {
      setBusy(false);
    }
  };

  const goBackToEmail = () => {
    setStep('email');
    setOtp('');
    setPassword('');
    setConfirmPassword('');
    setVerificationToken('');
    setError('');
    setInfo('');
    setDevOtp('');
    setPhoneConfirmation(null);
  };

  const goBackToLogin = () => {
    setLoginView('password');
    setResetToken('');
    setResetSessionId('');
    setResetOtp('');
    setResetPassword('');
    setResetConfirmPassword('');
    setShowResetPassword(false);
    setError('');
    setInfo('');
    setDevResetOtp('');
    setResetPhoneConfirmation(null);
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#F5F8FF] text-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(29,78,216,0.18),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(37,99,235,0.12),_transparent_28%),linear-gradient(180deg,_#F8FBFF_0%,_#EEF4FF_100%)]" />
      <div className="absolute left-[-8rem] top-24 h-64 w-64 rounded-full bg-[#BBD2FF]/40 blur-3xl" />
      <div className="absolute bottom-[-5rem] right-[-4rem] h-72 w-72 rounded-full bg-[#DCE8FF]/70 blur-3xl" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-8 px-4 py-6 md:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:px-10">
        <section className="flex flex-col justify-between rounded-[32px] border border-white/70 bg-white/70 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-10">
          <div className="flex items-center justify-between">
            <BrandMark size="md" />
            <div className="hidden items-center gap-2 rounded-full border border-[#D8E4FF] bg-[#F4F7FF] px-3 py-1 text-[11px] font-semibold text-[#2457F0] md:inline-flex">
              <Sparkles className="h-3.5 w-3.5" />
              OTP protected access
            </div>
          </div>

          <div className="mt-12 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D8E4FF] bg-[#F4F7FF] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#2457F0]">
              <ShieldCheck className="h-3.5 w-3.5" />
              {mode === 'signup'
                ? 'Secure email sign up'
                : loginView === 'otp'
                  ? 'OTP sign in'
                : loginView === 'forgot'
                  ? 'Password recovery'
                  : loginView === 'resetOtp'
                    ? 'Recovery OTP'
                    : loginView === 'reset'
                      ? 'Reset password'
                    : 'Secure email sign in'}
            </div>

            <h1 className="mt-5 text-4xl font-black tracking-[-0.04em] text-slate-950 md:text-6xl">
              {mode === 'signup'
                ? 'One email, one code, one workspace.'
                : loginView === 'otp'
                  ? 'Enter your login OTP.'
                : loginView === 'forgot'
                  ? 'We’ll help you get back in.'
                  : loginView === 'resetOtp'
                    ? 'Enter the recovery OTP.'
                    : loginView === 'reset'
                      ? 'Set a new password and continue.'
                    : 'One email, one password, one workspace.'}
            </h1>

            <p className="mt-5 max-w-xl text-[16px] leading-7 text-slate-600 md:text-[18px]">
              {mode === 'signup'
                ? 'Create your account with email verification, set a password after the OTP check, and get straight into your quote dashboard.'
                : loginView === 'otp'
                  ? 'Use the OTP sent to your email or phone to sign in without a password.'
                : loginView === 'forgot'
                  ? 'Enter your connected email or phone and we will send a recovery OTP.'
                  : loginView === 'resetOtp'
                    ? 'Enter the OTP sent to your connected email or phone number.'
                    : loginView === 'reset'
                    ? 'Create a new password for this account.'
                    : 'Sign in with your email or phone and password to continue managing quotes.'}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                { icon: FileText, label: 'Quote builder' },
                { icon: Globe, label: 'Client sharing' },
                { icon: CheckCircle2, label: 'Business profile' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-sm"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF4FF] text-[#2457F0]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="text-[14px] font-semibold text-slate-700">{item.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-10 grid gap-4 border-t border-slate-200/70 pt-6 sm:grid-cols-2">
            <div className="rounded-3xl bg-[#F8FBFF] p-5">
              <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                What you get
              </div>
              <div className="mt-3 text-[15px] font-semibold text-slate-900">
                Fast access with a verified email and password you control.
              </div>
            </div>
            <div className="rounded-3xl bg-[#F8FBFF] p-5">
              <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Designed for
              </div>
              <div className="mt-3 text-[15px] font-semibold text-slate-900">
                Freelancers, agencies, and small teams that send quotes daily.
              </div>
            </div>
          </div>
        </section>

        <section className="relative">
          <div className="rounded-[32px] border border-white/70 bg-white p-6 shadow-[0_20px_80px_rgba(15,23,42,0.12)] md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.22em] text-[#2457F0]">
                  {mode === 'signup' ? 'Create account' : 'Welcome back'}
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-950">
                  {mode === 'signup' ? 'Verify your email, then set a password' : 'Sign in with your email and password'}
                </h2>
              </div>

              <div className="hidden rounded-2xl bg-[#F4F7FF] px-4 py-3 text-right md:block">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Step {mode === 'signup' ? stepIndex : 1}
                </div>
                <div className="mt-1 text-[13px] font-semibold text-slate-900">
                  {mode === 'signup'
                    ? step === 'email'
                      ? 'Enter email'
                      : step === 'otp'
                        ? 'Check OTP'
                        : 'Create password'
                    : 'Login form'}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-2 rounded-2xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setLoginView('password');
                  setError('');
                  setInfo('');
                }}
                className={`flex-1 rounded-2xl px-4 py-3 text-[14px] font-semibold transition ${
                  mode === 'signup' ? 'bg-white text-[#2457F0] shadow-sm' : 'text-slate-600'
                }`}
              >
                Create account
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setLoginView('password');
                  setError('');
                  setInfo('');
                }}
                className={`flex-1 rounded-2xl px-4 py-3 text-[14px] font-semibold transition ${
                  mode === 'login' ? 'bg-white text-[#2457F0] shadow-sm' : 'text-slate-600'
                }`}
              >
                Sign in
              </button>
            </div>

            {error ? (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] font-medium text-red-700">
                {error}
              </div>
            ) : null}

            {info ? (
              <div className="mt-5 rounded-2xl border border-[#D8E4FF] bg-[#F4F7FF] px-4 py-3 text-[14px] font-medium text-[#2457F0]">
                {info}
              </div>
            ) : null}

            {devOtp ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-semibold text-amber-800">
                Dev OTP: {devOtp}
              </div>
            ) : null}

            {mode === 'signup' ? (
              <>
                <div className="mt-6 grid grid-cols-3 gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {['Email / Phone', 'OTP', 'Password'].map((label, index) => {
                    const active = index + 1 <= stepIndex;
                    return (
                      <div
                        key={label}
                        className={`rounded-2xl border px-3 py-2 text-center ${
                          active ? 'border-[#D8E4FF] bg-[#F4F7FF] text-[#2457F0]' : 'border-slate-200 bg-white'
                        }`}
                      >
                        {label}
                      </div>
                    );
                  })}
                </div>

                {step === 'email' ? (
                  <form onSubmit={handleCreateRequestOtp} className="mt-6 space-y-4">
                    <label className="block">
                      <span className="mb-2 block text-[13px] font-semibold text-slate-700">Full name</span>
                      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 focus-within:border-[#2457F0] focus-within:bg-white">
                        <CheckCircle2 className="h-4.5 w-4.5 text-slate-400" />
                        <input
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          type="text"
                          name="name"
                          autoComplete="name"
                          className="w-full bg-transparent text-[15px] font-medium text-slate-900 outline-none placeholder:text-slate-400"
                          placeholder="Your name"
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-[13px] font-semibold text-slate-700">Email or phone</span>
                      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 focus-within:border-[#2457F0] focus-within:bg-white">
                        <Mail className="h-4.5 w-4.5 text-slate-400" />
                        <input
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          type="text"
                          name="email"
                          autoComplete="username"
                          className="w-full bg-transparent text-[15px] font-medium text-slate-900 outline-none placeholder:text-slate-400"
                          placeholder="you@business.com or +91 98765 43210"
                        />
                      </div>
                    </label>

                    <div id="firebase-phone-recaptcha" />

                    <button
                      type="submit"
                      disabled={busy}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2457F0] px-5 py-3.5 text-[15px] font-semibold text-white shadow-[0_16px_28px_rgba(36,87,240,0.2)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {busy || phoneBusy ? 'Sending OTP...' : emailFieldIsPhone ? 'Send phone OTP' : 'Send OTP to my email'}
                      <ArrowRight className="h-4.5 w-4.5" />
                    </button>
                  </form>
                ) : step === 'otp' ? (
                  <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] text-slate-600">
                      We sent a 6-digit code to <span className="font-semibold text-slate-900">{email}</span>.
                    </div>

                    <label className="block">
                      <span className="mb-2 block text-[13px] font-semibold text-slate-700">OTP</span>
                      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 focus-within:border-[#2457F0] focus-within:bg-white">
                        <KeyRound className="h-4.5 w-4.5 text-slate-400" />
                        <input
                          value={otp}
                          onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          type="text"
                          name="otp"
                          className="w-full bg-transparent text-[15px] font-medium tracking-[0.3em] text-slate-900 outline-none placeholder:tracking-normal placeholder:text-slate-400"
                          placeholder="000000"
                        />
                      </div>
                    </label>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={goBackToEmail}
                        className="flex-1 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-[14px] font-semibold text-slate-700 shadow-sm"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                      disabled={busy || phoneBusy || otp.length !== 6}
                      className="flex-1 rounded-2xl bg-[#2457F0] px-5 py-3.5 text-[14px] font-semibold text-white shadow-[0_16px_28px_rgba(36,87,240,0.2)] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {busy || phoneBusy ? 'Verifying...' : 'Verify OTP'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleCreatePassword} className="mt-6 space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] text-slate-600">
                      {phoneConfirmation ? 'Phone' : 'Email'} verified for <span className="font-semibold text-slate-900">{email}</span>. Create the password you will use to sign in later.
                    </div>

                    <label className="block">
                      <span className="mb-2 block text-[13px] font-semibold text-slate-700">Password</span>
                      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 focus-within:border-[#2457F0] focus-within:bg-white">
                        <Lock className="h-4.5 w-4.5 text-slate-400" />
                        <input
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          autoComplete="new-password"
                          className="w-full bg-transparent text-[15px] font-medium text-slate-900 outline-none placeholder:text-slate-400"
                          placeholder="Create a password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          className="rounded-xl px-3 py-2 text-[12px] font-semibold text-[#2457F0] hover:bg-slate-100"
                        >
                          {showPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-[13px] font-semibold text-slate-700">Confirm password</span>
                      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 focus-within:border-[#2457F0] focus-within:bg-white">
                        <Lock className="h-4.5 w-4.5 text-slate-400" />
                        <input
                          value={confirmPassword}
                          onChange={(event) => setConfirmPassword(event.target.value)}
                          type="password"
                          name="confirm-password"
                          autoComplete="new-password"
                          className="w-full bg-transparent text-[15px] font-medium text-slate-900 outline-none placeholder:text-slate-400"
                          placeholder="Re-enter password"
                        />
                      </div>
                    </label>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setStep('otp')}
                        className="flex-1 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-[14px] font-semibold text-slate-700 shadow-sm"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={busy}
                        className="flex-1 rounded-2xl bg-[#2457F0] px-5 py-3.5 text-[14px] font-semibold text-white shadow-[0_16px_28px_rgba(36,87,240,0.2)] disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {busy ? 'Creating account...' : 'Create account'}
                      </button>
                    </div>
                  </form>
                )}
              </>
            ) : loginView === 'forgot' ? (
              <form onSubmit={handleRequestPasswordReset} className="mt-6 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] text-slate-600">
                  Enter your connected email or phone number and we will send a recovery OTP.
                </div>

                <label className="block">
                  <span className="mb-2 block text-[13px] font-semibold text-slate-700">Email or phone</span>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 focus-within:border-[#2457F0] focus-within:bg-white">
                    <Mail className="h-4.5 w-4.5 text-slate-400" />
                    <input
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      type="text"
                      name="reset-email"
                      autoComplete="username"
                      className="w-full bg-transparent text-[15px] font-medium text-slate-900 outline-none placeholder:text-slate-400"
                      placeholder="you@business.com or +91 98765 43210"
                    />
                  </div>
                </label>

                <div id="firebase-reset-recaptcha" />

                {devResetOtp ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-semibold text-amber-800">
                    Dev recovery OTP: {devResetOtp}
                  </div>
                ) : null}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={goBackToLogin}
                    className="flex-1 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-[14px] font-semibold text-slate-700 shadow-sm"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="flex-1 rounded-2xl bg-[#2457F0] px-5 py-3.5 text-[14px] font-semibold text-white shadow-[0_16px_28px_rgba(36,87,240,0.2)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {busy ? 'Sending OTP...' : 'Send recovery OTP'}
                  </button>
                </div>
              </form>
            ) : loginView === 'resetOtp' ? (
              <form onSubmit={handleVerifyPasswordResetOtp} className="mt-6 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] text-slate-600">
                  Enter the 6-digit recovery OTP sent to <span className="font-semibold text-slate-900">{email}</span>.
                </div>

                <label className="block">
                  <span className="mb-2 block text-[13px] font-semibold text-slate-700">Recovery OTP</span>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 focus-within:border-[#2457F0] focus-within:bg-white">
                    <KeyRound className="h-4.5 w-4.5 text-slate-400" />
                    <input
                      value={resetOtp}
                      onChange={(event) => setResetOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      type="text"
                      className="w-full bg-transparent text-[15px] font-medium tracking-[0.3em] text-slate-900 outline-none placeholder:tracking-normal placeholder:text-slate-400"
                      placeholder="000000"
                    />
                  </div>
                </label>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setLoginView('forgot')}
                    className="flex-1 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-[14px] font-semibold text-slate-700 shadow-sm"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={busy || resetOtp.length !== 6}
                    className="flex-1 rounded-2xl bg-[#2457F0] px-5 py-3.5 text-[14px] font-semibold text-white shadow-[0_16px_28px_rgba(36,87,240,0.2)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {busy ? 'Verifying...' : 'Verify OTP'}
                  </button>
                </div>
              </form>
            ) : loginView === 'reset' ? (
              <form onSubmit={handleConfirmPasswordReset} className="mt-6 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] text-slate-600">
                  Choose a new password for your account.
                </div>

                <label className="block">
                  <span className="mb-2 block text-[13px] font-semibold text-slate-700">New password</span>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 focus-within:border-[#2457F0] focus-within:bg-white">
                    <Lock className="h-4.5 w-4.5 text-slate-400" />
                    <input
                      value={resetPassword}
                      onChange={(event) => setResetPassword(event.target.value)}
                      type={showResetPassword ? 'text' : 'password'}
                      name="new-password"
                      autoComplete="new-password"
                      className="w-full bg-transparent text-[15px] font-medium text-slate-900 outline-none placeholder:text-slate-400"
                      placeholder="Create a new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword((current) => !current)}
                      className="rounded-xl px-3 py-2 text-[12px] font-semibold text-[#2457F0] hover:bg-slate-100"
                    >
                      {showResetPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-[13px] font-semibold text-slate-700">Confirm password</span>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 focus-within:border-[#2457F0] focus-within:bg-white">
                    <Lock className="h-4.5 w-4.5 text-slate-400" />
                    <input
                      value={resetConfirmPassword}
                      onChange={(event) => setResetConfirmPassword(event.target.value)}
                      type="password"
                      name="confirm-new-password"
                      autoComplete="new-password"
                      className="w-full bg-transparent text-[15px] font-medium text-slate-900 outline-none placeholder:text-slate-400"
                      placeholder="Re-enter new password"
                    />
                  </div>
                </label>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={goBackToLogin}
                    className="flex-1 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-[14px] font-semibold text-slate-700 shadow-sm"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="flex-1 rounded-2xl bg-[#2457F0] px-5 py-3.5 text-[14px] font-semibold text-white shadow-[0_16px_28px_rgba(36,87,240,0.2)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {busy ? 'Updating...' : 'Update password'}
                  </button>
                </div>
              </form>
            ) : loginView === 'otp' ? (
              <form onSubmit={handleVerifyLoginOtp} className="mt-6 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] text-slate-600">
                  Enter the 6-digit login OTP sent to <span className="font-semibold text-slate-900">{email}</span>.
                </div>

                <label className="block">
                  <span className="mb-2 block text-[13px] font-semibold text-slate-700">Login OTP</span>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 focus-within:border-[#2457F0] focus-within:bg-white">
                    <KeyRound className="h-4.5 w-4.5 text-slate-400" />
                    <input
                      value={loginOtp}
                      onChange={(event) => setLoginOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      type="text"
                      className="w-full bg-transparent text-[15px] font-medium tracking-[0.3em] text-slate-900 outline-none placeholder:tracking-normal placeholder:text-slate-400"
                      placeholder="000000"
                    />
                  </div>
                </label>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setLoginView('password')}
                    className="flex-1 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-[14px] font-semibold text-slate-700 shadow-sm"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={busy || loginOtp.length !== 6}
                    className="flex-1 rounded-2xl bg-[#2457F0] px-5 py-3.5 text-[14px] font-semibold text-white shadow-[0_16px_28px_rgba(36,87,240,0.2)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {busy ? 'Verifying...' : 'Verify & Sign in'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="mt-6 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-[13px] font-semibold text-slate-700">Email or phone</span>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 focus-within:border-[#2457F0] focus-within:bg-white">
                    <Mail className="h-4.5 w-4.5 text-slate-400" />
                    <input
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      type="text"
                      name="email"
                      autoComplete="username"
                      className="w-full bg-transparent text-[15px] font-medium text-slate-900 outline-none placeholder:text-slate-400"
                      placeholder="you@business.com or +91 98765 43210"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-[13px] font-semibold text-slate-700">Password</span>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 focus-within:border-[#2457F0] focus-within:bg-white">
                    <Lock className="h-4.5 w-4.5 text-slate-400" />
                    <input
                      value={loginPassword}
                      onChange={(event) => setLoginPassword(event.target.value)}
                      type={showLoginPassword ? 'text' : 'password'}
                      name="password"
                      autoComplete="current-password"
                      className="w-full bg-transparent text-[15px] font-medium text-slate-900 outline-none placeholder:text-slate-400"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((current) => !current)}
                      className="rounded-xl px-3 py-2 text-[12px] font-semibold text-[#2457F0] hover:bg-slate-100"
                    >
                      {showLoginPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </label>

                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginView('forgot');
                      setError('');
                      setInfo('');
                    }}
                    className="text-[13px] font-semibold text-[#2457F0] hover:underline"
                  >
                    Forgot password?
                  </button>
                  <button
                    type="button"
                    onClick={handleRequestLoginOtp}
                    className="text-[13px] font-semibold text-[#2457F0] hover:underline"
                  >
                    Sign in with OTP
                  </button>
                </div>

                <div id="firebase-login-recaptcha" />

                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2457F0] px-5 py-3.5 text-[15px] font-semibold text-white shadow-[0_16px_28px_rgba(36,87,240,0.2)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {busy ? 'Signing in...' : 'Sign in'}
                  <ArrowRight className="h-4.5 w-4.5" />
                </button>
              </form>
            )}

            <div className="mt-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                secure access
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <p className="mt-6 text-center text-[13px] leading-6 text-slate-500">
              Your email is verified with OTP before the password is saved. In local development the backend also returns the OTP so you can test without SMTP.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
