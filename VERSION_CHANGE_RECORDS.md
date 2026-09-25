# Project Version Change Records & Deployment Backup Log
**Client:** Semixon Technologies  
**Project:** iLoveQuote (Quotation & Invoicing Platform)  
**Maintained by:** Development Team  
**Last Updated:** 25-Sep-2026

---

## 📌 Version Control & Backup Strategy

To guarantee that **every version is 100% backed up and accessible independently**, we maintain a dual-layer backup system:

1. **Git Branch Isolation:** Every major release has its own isolated Git branch (e.g. `preview` for Version 1, `preview2` for Version 2, `main` for Production).
2. **Permanent Vercel Preview Deployments:** Vercel assigns each branch and each commit a permanent, immutable URL that never gets overwritten.
3. **In-App Version Support:** Both versions can be viewed, compared, and tested side-by-side.

---

## 📑 Version 1.0 (Released: 16-Sep-2026)

* **Git Branch / Tag:** `preview` (Commit `0d88a9d`)
* **Environment:** Version 1 Preview
* **Primary Focus:** Permanent Left Sidebar, 4-Step Quotation Wizard Redesign, Live Preview Board, and Mobile Icon Optimization.

### Key Changes Implemented:
1. **Permanent Desktop Sidebar (`Layout.tsx`):**
   - Added permanent left sidebar (`w-60 xl:w-64`) with brand logo, `+ New Quote` button, full navigation menu, `< Collapse` toggle, and top user profile pill.
2. **Step 1 Business Module Redesign (`BusinessModule.tsx`, `BusinessForm.tsx`):**
   - Added "Use a saved business profile" card.
   - Centered vertical logo drag-and-drop zone.
   - Accordion for Business Address, Tax Settings (GSTIN), and Social Media tiles.
   - Added `LivePreviewBoard.tsx` (Real-time Business Profile Card + Quotation Sheet Preview).
3. **Top Bar & Wizard Stepper (`QuoteWizard.tsx`, `StepWizard.tsx`):**
   - Clean inline header: `Create Quote`, green `DRAFT` pill badge, quote ID (`Q-2026-00021`), auto-save status.
   - 4-Step visual progress stepper: `[1 Business] ──── [2 Client] ──── [3 Items] ──── [4 Preview]`.
4. **Mobile Optimization (`LandingPage.tsx`):**
   - Minimized tool icons on mobile devices from `h-16 w-16` down to `h-9 w-9`.
   - Scaled icon container box from `96px` down to `52px`.
   - Reduced mobile card width to `185px` and optimized navigation arrows.

---

## 📑 Version 2.0 (Completed: 25-Sep-2026)

* **Git Branch / Tag:** `preview2`
* **Environment:** Version 2 Preview
* **Primary Focus:** New Single-Page Price Quote Model (Figma Design), Currency Selector, 3 Mode Cards (Manual, Photo, Audio), 5 Structured Accordions, JSON Document Schema, and 1-Click Conversion to Invoice.

### Key Changes Implemented:
1. **New Price Quote Generator UI (`ManualQuoteGenerator.tsx`):**
   - Created full-featured single-page generator matching Figma mockup (`node-id=1003-9`).
   - Added **Currency Selector** dropdown `[🇮🇳 INR (₹) ▾]` with multi-currency support (`INR ₹`, `USD $`, `EUR €`, `GBP £`, `AED AED`, `AUD A$`, `CAD C$`, `SGD S$`).
   - Integrated **`👁 Preview Quote`** modal showing formatted quotation document with print and download capability.
2. **5 Structured Collapsible Accordions:**
   - **🏢 Your Business:** Business Name, Prepared By, Address, Phone, Email, Website.
   - **👥 Client Details:** Client / Company Name, Contact Person, Address, Phone, Email.
   - **📄 Quote Details:** Quote Number, Quote Date, Valid Till, PO Number.
   - **📑 Items & Summary:** Interactive table (`#`, `Item / Description`, `Unit Price`, `Qty`, `Amount`, `Actions`, `+ Add Item`), with real-time Subtotal, Discount %, Tax %, and Grand Total calculations.
   - **📝 Notes:** Additional notes, payment terms, or conditions.
3. **Structured Document Schema & Conversion (`structuredQuote.ts`, `server.js`):**
   - Full typed JSON document schema storing all line items, rates, taxes, currencies, and metadata.
   - **1-Click Conversion to Invoice:** Added `convertQuoteToInvoiceDraft(...)` and backend endpoint `POST /api/quotes/:id/convert-to-invoice` so quotes convert directly to Invoices without re-entering data.
4. **Photo & Audio AI Review Workflows:**
   - **Photo $\rightarrow$ Quote (`PhotoQuoteExtractor.tsx`):** Camera capture / photo upload $\rightarrow$ OCR extraction $\rightarrow$ Review & Edit line items table before populating quote.
   - **Voice $\rightarrow$ Quote (`AudioQuoteExtractor.tsx`):** In-app microphone recording / audio upload $\rightarrow$ Speech-to-text $\rightarrow$ Review & Edit screen with transcript and line items.
5. **Dual Version Switcher (`CreateQuotePage.tsx`):**
   - Default view is the **New Version 2 Instant Generator**.
   - Includes top switcher banner allowing one-click toggle between **Version 2 (Instant Model)** and **Version 1 (4-Step Wizard)** for side-by-side comparison.

---

## 🗂 File Modification Summary (Version 2)

| File | Type | Description |
| :--- | :--- | :--- |
| `frontend/src/types/structuredQuote.ts` | New | Complete structured quote schema, pricing calculator, and quote-to-invoice conversion helper |
| `frontend/src/components/quote-generator/ManualQuoteGenerator.tsx` | New | Main Price Quote Generator matching Figma mockup |
| `frontend/src/components/quote-generator/PhotoQuoteExtractor.tsx` | New | Photo-to-Quote OCR review and extraction component |
| `frontend/src/components/quote-generator/AudioQuoteExtractor.tsx` | New | Voice-to-Quote speech review and extraction component |
| `frontend/src/pages/CreateQuotePage.tsx` | Modified | Renders new model by default with dual-version switcher |
| `backend/server.js` | Modified | Structured payload persistence and `POST /api/quotes/:id/convert-to-invoice` endpoint |

---

## 🔒 Verification & Compliance
- **Backend Syntax:** Validated with Node.js (`node -c backend/server.js` $\rightarrow$ Exit Code 0).
- **Frontend Build:** Successfully built with Vite (`✓ built in 14.07s`).
- **Dev Servers:** Both active locally (`http://localhost:3000` and `http://localhost:3001`).
- **Git Push:** Remote push is held until user authorizes.
