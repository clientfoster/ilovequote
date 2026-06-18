import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layers3, FolderGit2, QrCode } from 'lucide-react';

// Shell & Pages Imports
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import QuotesPage from './pages/QuotesPage';
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

          <Route path="/quotes" element={<QuotesPage onTriggerToast={() => {}} />} />

          <Route path="/settings" element={<SettingsPage onTriggerToast={() => {}} />} />

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
            element={
              <PlaceholderPage
                title="Business Portfolio Launcher"
                description="Exhibit your active proposals, live client feedback reviews, and recent achievements inside your public portfolio web link, connected directly to your custom brand slug."
                icon={<FolderGit2 className="w-8 h-8" />}
              />
            }
          />

          <Route
            path="/qr-codes"
            element={
              <PlaceholderPage
                title="Smart QR Generator"
                description="Print customized visual QR sticker cards for your offices or retail shelves. When scanned, customers will instantly see your active quote pages and client booking calendars."
                icon={<QrCode className="w-8 h-8" />}
              />
            }
          />

          {/* Fallback route handles unexpected slugs */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}
