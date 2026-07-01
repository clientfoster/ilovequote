import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layers3, FolderGit2, QrCode } from 'lucide-react';

// Shell & Pages Imports
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClientsPage from './pages/ClientsPage';
import BusinessPage from './pages/BusinessPage';
import ItemsPage from './pages/ItemsPage';
import HelpSupportPage from './pages/HelpSupportPage';
import QuotesPage from './pages/QuotesPage';
import PortfolioPage from './pages/PortfolioPage';
import QRPortfolioPage from './pages/QRPortfolioPage';
import QuoteExportPage from './pages/QuoteExportPage';
import CreateQuotePage from './pages/CreateQuotePage';
import CreateInvoicePage from './pages/CreateInvoicePage';
import CreateInvoiceBankDetailsPage from './pages/CreateInvoiceBankDetailsPage';
import CreateInvoiceDesignPage from './pages/CreateInvoiceDesignPage';
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
import { apiUrl } from './api';

function RequireAuth({ isAuthed, children }: { isAuthed: boolean; children: React.ReactElement }) {
  return isAuthed ? children : <Navigate to="/login?mode=login" replace />;
}

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
        const response = await fetch(apiUrl('/api/auth/me'), {
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
        <Route path="/" element={<LandingPage />} />

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

        <Route path="/quote-export/:id" element={<QuoteExportPage />} />

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
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/create-quote" element={<CreateQuotePage />} />
          <Route path="/create-invoice" element={<CreateInvoicePage />} />
          <Route path="/create-invoice/bank-details" element={<CreateInvoiceBankDetailsPage />} />
          <Route path="/create-invoice/design" element={<CreateInvoiceDesignPage />} />

          <Route path="/clients" element={<RequireAuth isAuthed={isAuthed}><ClientsPage /></RequireAuth>} />
          <Route path="/items" element={<RequireAuth isAuthed={isAuthed}><ItemsPage /></RequireAuth>} />

          <Route path="/quotes" element={<RequireAuth isAuthed={isAuthed}><QuotesPage /></RequireAuth>} />

          <Route path="/business" element={<RequireAuth isAuthed={isAuthed}><BusinessPage /></RequireAuth>} />
          <Route path="/settings" element={<RequireAuth isAuthed={isAuthed}><SettingsPage /></RequireAuth>} />
          <Route path="/help-support" element={<HelpSupportPage />} />

          {/* Placeholder subviews for Coming Soon products */}
          <Route
            path="/templates"
            element={
              <RequireAuth isAuthed={isAuthed}>
                <PlaceholderPage
                  title="Quotation Templates"
                  description="Our design team is building high-converting thematic invoice layouts (Minimal, Brutalist, Corporate, and Neon). You will be able to customize fonts, colors, and layout borders in real-time."
                  icon={<Layers3 className="w-8 h-8" />}
                />
              </RequireAuth>
            }
          />

          <Route
            path="/portfolio"
            element={<RequireAuth isAuthed={isAuthed}><PortfolioPage /></RequireAuth>}
          />

          <Route
            path="/portfolio/:slug"
            element={<RequireAuth isAuthed={isAuthed}><PortfolioPage /></RequireAuth>}
          />

          <Route
            path="/qr-codes"
            element={<RequireAuth isAuthed={isAuthed}><QRPortfolioPage /></RequireAuth>}
          />

          {/* Fallback route handles unexpected slugs */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}
