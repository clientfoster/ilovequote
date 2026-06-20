import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layers3, FolderGit2, QrCode } from 'lucide-react';

// Shell & Pages Imports
import Layout from './components/Layout';
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

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/create-quote" element={<CreateQuotePage />} />

        <Route element={<Layout />}>
          {/* Default entry point redirects directly to /dashboard as requested */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/dashboard" element={<DashboardPage />} />

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
