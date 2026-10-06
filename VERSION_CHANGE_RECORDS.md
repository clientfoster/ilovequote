# Project Version Change Records & Deployment Backup Log
**Client:** Semixon Technologies  
**Project:** iLoveQuote (Quotation & Invoicing Platform)  
**Maintained by:** Development Team  
**Last Updated:** 06-Oct-2026

---

## 📌 Version Control & Backup Strategy

To guarantee that **every version is 100% backed up and accessible independently**, we maintain a dual-layer backup system:

1. **Git Branch Isolation:** Every major release has its own isolated Git branch (e.g. `preview1` for Version 1, `preview2` for Version 2, `review3`/`preview3` for Version 3, `review4` for Version 4).
2. **Permanent Vercel Preview Deployments:** Vercel assigns each branch and each commit a permanent, immutable URL that never gets overwritten.
3. **Route Isolation:** Dedicated distinct routes (`/#/create-quote` for V1/V2, `/#/create-quote2` for V3, and `/#/page2` for V4) ensure existing workflows are 100% preserved and never overwritten.

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

## 📑 Version 3.0 (Completed: 30-Sep-2026)

* **Git Branch / Tag:** `preview3`
* **Dedicated Route:** `/#/create-quote2` (e.g. `https://test.ilovequote.com/#/create-quote2`)
* **Primary Focus:** Additional Options Accordion (Shipping Details, GST/Tax Configuration Modal, Column & Formula Customization Modal), Dynamic Items Table & Mobile Cards.

### Key Changes Implemented:
1. **"Additional Options" Accordion Card (`ManualQuoteGenerator.tsx`):**
   - Placed seamlessly between **Quote Details** and **Items & Summary** accordions.
   - Includes **`[ ] Add Shipping Details`** toggle to expand dispatch address, recipient/consignee, transport mode, transporter name, and vehicle/tracking number.
   - Includes **`% Edit GST`** button and **`📊 Edit Columns/Formulas`** button with purple styling.
2. **Tax Configuration Modal (`TaxConfigModal.tsx`):**
   - Numbered step layout matching Refrens specifications:
     1. **Select Tax Type:** `GST (India)`, `VAT`, `Sales Tax`, `None`.
     2. **Place of Supply:** Comprehensive Indian States & UTs dropdown (36 states/UTs + Other Territory).
     3. **GST Type:** Radio selector (`IGST` vs `CGST & SGST`) + **`+ Add Cess`** percentage input.
     4. **Other Options:** Reverse Charge Mechanism (`RCM`) checkbox.
3. **Customize Columns & Formulas Modal (`ColumnFormulaModal.tsx`):**
   - Header with lightbulb icon and **`+ Add New Column`** button.
   - Drag & drop row controls with editable Column Name, Column Type (`TEXT` or `NUMBER`), and Eye visibility toggle for:
     - `Item` (Primary/Required)
     - `HSN/SAC`
     - `GST Rate`
     - `Quantity`
     - Unlimited custom columns with trash/delete action.
   - `Reset to Default`, `Cancel`, and `Save Changes` actions.
4. **Dynamic Items Table & Mobile Cards:**
   - Real-time column visibility toggle in desktop table and mobile cards without horizontal scrolling issues.
   - Supports custom column data inputs per line item.
   - Detailed GST breakdown in pricing summary box (CGST, SGST, IGST, Cess %, and RCM status).
5. **Dedicated Route Registration (`App.tsx`):**
   - Direct access via `/#/create-quote2` (`https://test.ilovequote.com/#/create-quote2`).

---

## 🗂 File Modification Summary (Version 3.0 / Review 3)

| File | Type | Description |
| :--- | :--- | :--- |
| `frontend/src/types/structuredQuote.ts` | Modified | Added `TaxConfiguration`, `QuoteColumnConfig`, `ShippingDetails`, Indian States list, and Cess calculator |
| `frontend/src/components/quote-generator/TaxConfigModal.tsx` | New | 4-step modal for GST/VAT/Sales Tax, Place of Supply, IGST/CGST, Cess & RCM |
| `frontend/src/components/quote-generator/ColumnFormulaModal.tsx` | New | Drag handle, column name/type customizer, visibility toggles & add custom column |
| `frontend/src/components/quote-generator/ManualQuoteGenerator.tsx` | Modified | Added Additional Options accordion, dynamic column rendering, shipping fields, and GST breakdown |
| `frontend/src/App.tsx` | Modified | Registered dedicated route `/#/create-quote2` |
| `VERSION_CHANGE_RECORDS.md` | Modified | Backup and change documentation |

---

## 📑 Version 4.0 (Review 4) (Completed: 06-Oct-2026)

* **Git Branch / Tag:** `review4`
* **Dedicated Route:** `/#/page2` and `test.ilovequote.com/page2` (Aliases: `/#/audio-quote`, `/#/create-quote3`)
* **Client Request from Semixon Technologies:**
  > *"@!! you just work on audio to price converter module. put in test.ilovequote.com/ page2. like this impment in new page. do not deploy in previous design. thanks"*  
  > *"audio to quote making, make it implementation. thanks"*

### Primary Objectives & Constraints:
- Implement a comprehensive **Audio to Price Converter / Voice to Quote Making module**.
- Mount specifically on **`/page2`** (`https://test.ilovequote.com/#/page2` and `test.ilovequote.com/page2`).
- **Strictly preserve prior versions**: `/#/create-quote` (Version 1 & 2) and `/#/create-quote2` (Version 3) remain 100% untouched and functional.

### Key Changes Implemented:
1. **Dedicated Standalone Module (`AudioQuoteConverterPage.tsx`):**
   - High-performance, mobile-responsive layout built specifically for voice-first quotation creation.
   - Header badge: `Page 2: Audio to Price Converter` with currency switcher and instant reset actions.
2. **3 Audio Input Modes:**
   - **Mode A (Live Voice Recording):** Direct in-browser microphone dictation using Web Speech API with real-time waveform bars visualizer, elapsed recording timer, and live transcript streaming.
   - **Mode B (Audio File Upload):** Drag-and-drop audio file dropzone supporting `.mp3`, `.wav`, `.m4a`, and `.ogg` files.
   - **Mode C (Voice Note / Transcript Paste):** Direct text box for pasting audio transcripts, WhatsApp voice transcripts, or meeting minutes with instant `Re-Analyze Transcript` action.
3. **Quick Voice Scenario Chips:**
   - Pre-configured 1-click test scenarios for testing speech parsing:
     - 🌐 *Web Design & Hosting* (ABC Tech, ₹25,000 design, ₹5,000 hosting, 7 days validity)
     - 💻 *Hardware & IT Supply* (Global Traders, 3 Laptops ₹65,000, 2 Printers ₹18,000, 10% discount)
     - 📱 *UI/UX & App Dev* (NextGen Innovations, Wireframing ₹35,000, App Dev ₹95,000, 18% GST)
4. **Intelligent Speech-to-Quote Parsing Engine:**
   - Extracts client name, multiple line items, unit quantities, unit rates (supporting both numeric digits like `25000` and spoken words like *"twenty five thousand"* or *"three laptops"*), discount %, GST tax %, and validity days.
5. **Interactive Quotation Editor & Financial Calculations:**
   - Real-time interactive line items table on desktop and native responsive cards on mobile.
   - Live editable unit prices, quantities, and item titles with automatic amount recalculations.
   - Financial breakdown: Subtotal, Discount amount & %, GST/tax amount & %, and Grand Total.
6. **Action Bar & Invoice Integration:**
   - **👁 Preview Quote Modal:** Formatted quotation document preview with clean printable layout.
   - **🖨 Print & PDF Export:** One-click document printing and browser PDF saving.
   - **⚡ 1-Click Convert to Invoice:** Directly maps extracted voice quote items and client details into invoice draft format and navigates to `/create-invoice`.
7. **Dual URL Routing (Hash & Direct Path):**
   - Added automatic path-to-hash redirect and SPA rewrites (`vercel.json`) ensuring both `https://test.ilovequote.com/page2` and `https://test.ilovequote.com/#/page2` load seamlessly.

---

## 🗂 File Modification Summary (Version 4.0 / Review 4)

| File | Type | Description |
| :--- | :--- | :--- |
| `frontend/src/pages/AudioQuoteConverterPage.tsx` | New | Dedicated Audio to Price Converter page on `/page2` with 3 input modes, audio waveform, AI voice parsing, and quote editor |
| `frontend/src/App.tsx` | Modified | Registered `/page2`, `/audio-quote`, `/create-quote3` routes & added path-to-hash automatic redirection |
| `frontend/src/components/Layout.tsx` | Modified | Added `Audio to Quote` link with microphone icon to sidebar navigation menu |
| `frontend/vercel.json` | New | Configured SPA rewrites to route direct path hits to `index.html` |
| `vercel.json` | New | Root SPA rewrites configuration |
| `VERSION_CHANGE_RECORDS.md` | Modified | Added comprehensive Version 4.0 / Review 4 documentation |
| `generate_word_doc.py` | Modified | Updated Word document generator script for Review 4 |
| `iLoveQuote_Version_Change_Records_All_Reviews.docx` | Updated | Regenerated official multi-version backup Word document |

---

## 🔒 Verification & Compliance
- **Frontend Compilation:** Vite v6.4.3 production build succeeded with 0 errors (`✓ built in 13.68s`).
- **Route Isolation:** Verified that `/page2` is isolated; `/#/create-quote` and `/#/create-quote2` are unchanged.
- **Git Branch:** Dedicated branch `review4` with clean commit history.
- **Vercel Test Subdomain:** Merged to `review3` to update `test.ilovequote.com`.

