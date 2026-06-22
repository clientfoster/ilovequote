import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layers3, FolderGit2, QrCode } from 'lucide-react';

// Shell & Pages Imports
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClientsPage from './pages/ClientsPage';
import BusinessPage from './pages/BusinessPage';
import ItemsPage from './pages/ItemsPage';
import HelpSupportPage from './pages/HelpSupportPage';
import QuotesPage from './pages/QuotesPage';
import PortfolioPage from './pages/PortfolioPage';
import QRPortfolioPage from './pages/QRPortfolioPage';
import CreateQuotePage from './pages/CreateQuotePage';
import SettingsPage from './pages/SettingsPage';
import PlaceholderPage from './pages/PlaceholderPage';
import {
  AuthUser,
  getAuthToken,
  getStoredAuthUser,
  isAuthenticated,
  setStoredAuthUser,
  signOut,
} from './auth';

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app') ? '/api' : 'http://localhost:3001');

export default function App() {
  const [isAuthed, setIsAuthed] = useState(() => isAuthenticated());
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getStoredAuthUser());

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setCurrentUser(null);
      setIsAuthed(false);
      return;
    }

    let cancelled = false;

    async function loadCurrentUser() {
      try {
        const response = await fetch(`${API_BASE}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Session expired');
        }

        const payload = (await response.json()) as { user?: AuthUser };
        if (!cancelled && payload.user) {
          setStoredAuthUser(payload.user);
          setCurrentUser(payload.user);
          setIsAuthed(true);
        }
      } catch {
        if (!cancelled) {
          signOut();
          setCurrentUser(null);
          setIsAuthed(false);
        }
      }
    }

    loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthed ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginPage
                onLogin={(user) => {
                  setIsAuthed(true);
                  setCurrentUser(user);
                }}
              />
            )
          }
        />

        <Route
          element={
            <Layout
              isAuthed={isAuthed}
              userName={currentUser?.name}
              onLogout={() => {
                setIsAuthed(false);
                setCurrentUser(null);
              }}
            />
          }
        >
          {/* Default entry point now always opens the app shell for guests and signed-in users alike. */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/create-quote" element={<CreateQuotePage />} />

          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/items" element={<ItemsPage />} />

          <Route path="/quotes" element={<QuotesPage onTriggerToast={() => {}} />} />

          <Route path="/business" element={<BusinessPage />} />
          <Route path="/settings" element={<SettingsPage onTriggerToast={() => {}} />} />
          <Route path="/help-support" element={<HelpSupportPage />} />

          {/* Placeholder subviews for Coming Soon products */}
          <Route
            path="/templates"
            element={
              <PlaceholderPage
                title="Quotation Templates"
                description="Our design team is building high-converting thematic invoice layouts (Minimal, Brutalist, Corporate, and Neon). You will be able to customize fonts, colors, and layout borders in real-time."
                icon={<Layers3 className="w-8 h-8" />}
              />
            }
          />

          <Route
            path="/portfolio"
            element={<PortfolioPage />}
          />

          <Route
            path="/qr-codes"
            element={<QRPortfolioPage />}
          />

          {/* Fallback route handles unexpected slugs */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}
