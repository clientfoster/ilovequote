import os
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, hex_color):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def add_callout(doc, title, text, border_color="4F46E5", bg_color="F8FAFC"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    set_cell_background(cell, bg_color)
    set_cell_margins(cell, top=140, bottom=140, left=200, right=200)
    
    # Left border styling
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>\n'
        f'  <w:left w:val="single" w:sz="36" w:space="0" w:color="{border_color}"/>\n'
        f'  <w:top w:val="none"/>\n'
        f'  <w:right w:val="none"/>\n'
        f'  <w:bottom w:val="none"/>\n'
        f'</w:tcBorders>'
    )
    tcPr.append(tcBorders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    run_t = p.add_run(f"{title}: ")
    run_t.bold = True
    run_t.font.name = "Arial"
    run_t.font.size = Pt(10)
    run_t.font.color.rgb = RGBColor(30, 41, 59)
    
    run_c = p.add_run(text)
    run_c.font.name = "Arial"
    run_c.font.size = Pt(9.5)
    run_c.font.color.rgb = RGBColor(71, 85, 105)
    doc.add_paragraph().paragraph_format.space_after = Pt(4)

def format_table_header(row, col_widths, headers, bg_color="1E293B"):
    for idx, header in enumerate(headers):
        cell = row.cells[idx]
        cell.width = col_widths[idx]
        set_cell_background(cell, bg_color)
        set_cell_margins(cell, top=120, bottom=120, left=150, right=150)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(header)
        r.bold = True
        r.font.name = "Arial"
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

def format_table_row(row, col_widths, values, is_even=False):
    bg = "F1F5F9" if is_even else "FFFFFF"
    for idx, val in enumerate(values):
        cell = row.cells[idx]
        cell.width = col_widths[idx]
        set_cell_background(cell, bg)
        set_cell_margins(cell, top=100, bottom=100, left=150, right=150)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(str(val))
        r.font.name = "Arial"
        r.font.size = Pt(9)
        r.font.color.rgb = RGBColor(51, 65, 85)

def build_word_document(output_path):
    doc = Document()
    
    # Page setup - 0.8 in margins
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)
    
    # Document Header Title
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(2)
    r_title = title_p.add_run("iLoveQuote – Version Release & Review Records")
    r_title.bold = True
    r_title.font.name = "Arial"
    r_title.font.size = Pt(22)
    r_title.font.color.rgb = RGBColor(30, 41, 59)
    
    # Subtitle
    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_after = Pt(14)
    r_sub = sub_p.add_run("Comprehensive Engineering & Deployment Record across All Versions (Preview 1, Preview 2, and Review 3)")
    r_sub.font.name = "Arial"
    r_sub.font.size = Pt(11)
    r_sub.font.color.rgb = RGBColor(100, 116, 139)
    
    # Metadata Block Table
    meta_tbl = doc.add_table(rows=4, cols=2)
    meta_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    col_w = [Inches(2.2), Inches(4.7)]
    meta_data = [
        ("Client Organization", "Semixon Technologies"),
        ("Project Application", "iLoveQuote (Quotation & Invoicing SaaS)"),
        ("Current Active Test Target", "https://test.ilovequote.com/#/create-quote2"),
        ("Documentation Date", "30-September-2026"),
    ]
    for idx, (k, v) in enumerate(meta_data):
        row = meta_tbl.rows[idx]
        cell_k, cell_v = row.cells[0], row.cells[1]
        cell_k.width, cell_v.width = col_w[0], col_w[1]
        set_cell_background(cell_k, "F8FAFC")
        set_cell_background(cell_v, "FFFFFF")
        set_cell_margins(cell_k, top=60, bottom=60, left=100, right=100)
        set_cell_margins(cell_v, top=60, bottom=60, left=100, right=100)
        
        pk = cell_k.paragraphs[0]
        pk.paragraph_format.space_before = Pt(0)
        pk.paragraph_format.space_after = Pt(0)
        rk = pk.add_run(k)
        rk.bold = True
        rk.font.name = "Arial"
        rk.font.size = Pt(9)
        rk.font.color.rgb = RGBColor(71, 85, 105)
        
        pv = cell_v.paragraphs[0]
        pv.paragraph_format.space_before = Pt(0)
        pv.paragraph_format.space_after = Pt(0)
        rv = pv.add_run(v)
        rv.font.name = "Arial"
        rv.font.size = Pt(9.5)
        rv.font.color.rgb = RGBColor(15, 23, 42)
        if "http" in v:
            rv.bold = True
            rv.font.color.rgb = RGBColor(79, 70, 229)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(10)
    
    # ----------------------------------------------------
    # SECTION 1: ARCHITECTURE & BACKUP STRATEGY
    # ----------------------------------------------------
    h1 = doc.add_paragraph()
    h1.paragraph_format.space_before = Pt(14)
    h1.paragraph_format.space_after = Pt(4)
    rh1 = h1.add_run("1. Version Control & Backup Architecture")
    rh1.bold = True
    rh1.font.name = "Arial"
    rh1.font.size = Pt(14)
    rh1.font.color.rgb = RGBColor(30, 41, 59)
    
    add_callout(
        doc,
        "Zero-Risk Backup Guarantee",
        "Every change requested is built on a distinct Git branch with dedicated version tags. No version overwrites previous work. All historical iterations (Version 1, Version 2, and Review 3) remain 100% accessible and deployable.",
        border_color="10B981",
        bg_color="F0FDF4"
    )
    
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    r = p.add_run(
        "To satisfy the client requirement for complete version records and separate rollback capabilities, the system uses a dual-layer backup mechanism:\n"
        "• Git Branch Isolation: Dedicated branches (preview1, preview2, and preview3/review3) ensure complete code history.\n"
        "• Subdomain Routing: Test deployments run under https://test.ilovequote.com, while production remains safe under www.ilovequote.com.\n"
        "• Route Isolation: Routes such as /#/create-quote and /#/create-quote2 allow side-by-side visual and functional testing."
    )
    r.font.name = "Arial"
    r.font.size = Pt(9.5)
    r.font.color.rgb = RGBColor(51, 65, 85)
    
    # ----------------------------------------------------
    # SECTION 2: VERSION 1.0 (PREVIEW 1)
    # ----------------------------------------------------
    h2 = doc.add_paragraph()
    h2.paragraph_format.space_before = Pt(14)
    h2.paragraph_format.space_after = Pt(4)
    rh2 = h2.add_run("2. Version 1.0 (Preview 1 / 'preview1')")
    rh2.bold = True
    rh2.font.name = "Arial"
    rh2.font.size = Pt(14)
    rh2.font.color.rgb = RGBColor(30, 41, 59)
    
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    r = p.add_run(
        "• Release Date: 16-September-2026\n"
        "• Git Branch: preview1 / preview (Commit: 0d88a9d)\n"
        "• Primary Focus: Quotation creation redesign matching AFTER mockup, permanent left sidebar, live preview board, and mobile icon adjustments."
    )
    r.font.name = "Arial"
    r.font.size = Pt(9.5)
    r.font.color.rgb = RGBColor(51, 65, 85)
    
    v1_items = [
        ("Permanent Desktop Sidebar (Layout.tsx)", "Added permanent left sidebar (w-60 / w-64) with BrandMark, '+ New Quote' action, complete navigation list, collapse toggle, and user profile pill."),
        ("4-Step Quotation Wizard (QuoteWizard.tsx)", "Added top stepper [1 Business] ── [2 Client] ── [3 Items] ── [4 Preview] with auto-save badge and draft ID."),
        ("Step 1 Business Module (BusinessModule.tsx)", "Added saved business profile quick-picker, vertical logo upload zone, collapsible accordions for Business Address, GSTIN tax settings, and social links."),
        ("Live Preview Board (LivePreviewBoard.tsx)", "Integrated dual-card real-time preview board displaying business profile card with QR code and live quotation sheet."),
        ("Mobile Landing Page Optimization", "Minimized tool icons on mobile devices from 64px to 36px, container box from 96px to 52px, card width to 185px to eliminate layout squishing."),
    ]
    
    v1_tbl = doc.add_table(rows=len(v1_items) + 1, cols=2)
    v1_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    col_w_v1 = [Inches(2.5), Inches(4.4)]
    format_table_header(v1_tbl.rows[0], col_w_v1, ["Component / Area", "Key Enhancements Implemented"], bg_color="334155")
    for idx, (comp, desc) in enumerate(v1_items):
        format_table_row(v1_tbl.rows[idx + 1], col_w_v1, [comp, desc], is_even=(idx % 2 == 1))
        
    doc.add_paragraph().paragraph_format.space_after = Pt(10)
    
    # ----------------------------------------------------
    # SECTION 3: VERSION 2.0 (PREVIEW 2)
    # ----------------------------------------------------
    h3 = doc.add_paragraph()
    h3.paragraph_format.space_before = Pt(14)
    h3.paragraph_format.space_after = Pt(4)
    rh3 = h3.add_run("3. Version 2.0 (Preview 2 / 'preview2')")
    rh3.bold = True
    rh3.font.name = "Arial"
    rh3.font.size = Pt(14)
    rh3.font.color.rgb = RGBColor(30, 41, 59)
    
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    r = p.add_run(
        "• Release Date: 25-September-2026\n"
        "• Git Branch: preview2 (Commit: 87c9d20)\n"
        "• Primary Focus: Single-page Figma Quote Generator model (node-id=1003-9), multi-currency selector, Photo & Audio AI review workflows, structured JSON document schema, and 1-click conversion to invoice."
    )
    r.font.name = "Arial"
    r.font.size = Pt(9.5)
    r.font.color.rgb = RGBColor(51, 65, 85)
    
    v2_items = [
        ("Instant Quote Model (ManualQuoteGenerator.tsx)", "Full single-page price quote generator matching Figma design with header brandmark, guest creation flow, and printable PDF preview modal."),
        ("Multi-Currency Selector", "Top currency picker supporting INR (₹), USD ($), EUR (€), GBP (£), AED (AED), AUD (A$), CAD (C$), and SGD (S$) with real-time recalculations."),
        ("5 Structured Collapsible Accordions", "Accordion 1: Your Business | Accordion 2: Client Details | Accordion 3: Quote Details | Accordion 4: Items & Summary | Accordion 5: Notes & Terms."),
        ("Structured Data Schema (structuredQuote.ts)", "100% typed structured JSON document model (StructuredQuote) storing all line items, rates, taxes, and metadata rather than unstructured blocks."),
        ("1-Click Convert to Invoice", "Added convertQuoteToInvoiceDraft() and POST /api/quotes/:id/convert-to-invoice to map quotes directly to Invoices with 0 data re-entry."),
        ("Photo → Quote Review Workflow", "PhotoQuoteExtractor.tsx: Camera capture / photo upload with OCR parsing and pre-population review & edit table."),
        ("Audio → Quote Review Workflow", "AudioQuoteExtractor.tsx: Live voice recording with waveform visualization, audio upload, speech-to-text, and quote item review screen."),
        ("Dual Model Switcher Banner", "Added top switcher banner in CreateQuotePage.tsx allowing 1-click switching between Instant Model and Classic 4-Step Wizard."),
    ]
    
    v2_tbl = doc.add_table(rows=len(v2_items) + 1, cols=2)
    v2_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    format_table_header(v2_tbl.rows[0], col_w_v1, ["Component / Area", "Key Enhancements Implemented"], bg_color="4338CA")
    for idx, (comp, desc) in enumerate(v2_items):
        format_table_row(v2_tbl.rows[idx + 1], col_w_v1, [comp, desc], is_even=(idx % 2 == 1))
        
    doc.add_paragraph().paragraph_format.space_after = Pt(10)
    
    # ----------------------------------------------------
    # SECTION 4: VERSION 3.0 (REVIEW 3 / PREVIEW 3)
    # ----------------------------------------------------
    h4 = doc.add_paragraph()
    h4.paragraph_format.space_before = Pt(14)
    h4.paragraph_format.space_after = Pt(4)
    rh4 = h4.add_run("4. Version 3.0 (Review 3 / 'review3' & 'preview3')")
    rh4.bold = True
    rh4.font.name = "Arial"
    rh4.font.size = Pt(14)
    rh4.font.color.rgb = RGBColor(30, 41, 59)
    
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    r = p.add_run(
        "• Release Date: 30-September-2026\n"
        "• Git Branches: review3 & preview3 & preview (Commits: b9e58ed, 8c629ec)\n"
        "• Target Test URL: https://test.ilovequote.com/#/create-quote2\n"
        "• Primary Focus: 'Additional Options' Section, Shipping Details, Refrens Tax Configuration Modal, Column & Formula Customization Modal, and Dynamic Item Table."
    )
    r.font.name = "Arial"
    r.font.size = Pt(9.5)
    r.font.color.rgb = RGBColor(51, 65, 85)
    
    add_callout(
        doc,
        "Dedicated Route Accessibility",
        "Version 3.0 is served directly on route /#/create-quote2 (https://test.ilovequote.com/#/create-quote2), allowing the client to test all tax, shipping, and column customizer features without disrupting the base /#/create-quote workflow.",
        border_color="7C3AED",
        bg_color="FAF5FF"
    )
    
    v3_items = [
        ("Additional Options Accordion", "Inserted between Quote Details and Items & Summary. Features a clean card with settings badge, Add Shipping Details toggle, '% Edit GST' button, and 'Edit Columns/Formulas' button."),
        ("Shipping Details Expandable Sub-module", "When checked, expands Shipped From Address, Shipped To Name & Address, Transport Mode dropdown (Road, Rail, Air, Sea, Courier), Transporter Name, and Vehicle/Tracking Number."),
        ("Configure Tax Modal (TaxConfigModal.tsx)", "Refrens 4-step modal: 1. Tax Type (GST, VAT, Sales Tax, None) | 2. Place of Supply (36 Indian States/UTs + Other Territory) | 3. GST Type (IGST vs CGST & SGST + '+ Add Cess' rate input) | 4. Other Options (Reverse Charge Mechanism - RCM checkbox)."),
        ("Customize Columns & Formulas Modal (ColumnFormulaModal.tsx)", "Lightbulb header with '+ Add New Column', 6-dot drag handles, column name input, type selector (TEXT / NUMBER), eye visibility toggles for Item, HSN/SAC, GST Rate, Quantity, plus custom column deletion."),
        ("Dynamic Desktop Table & Mobile Cards", "Desktop table and mobile cards dynamically reflect configured columns in real-time. Full support for custom column inputs on every line item with zero horizontal overflow."),
        ("GST & Tax Calculation Summary", "Summary calculation card computes subtotal, discounts, CGST & SGST 50/50 split, IGST, Cess % amounts, and displays Reverse Charge (RCM) status badge."),
        ("Enhanced Preview & PDF Export", "Printable preview modal renders dispatch shipping addresses, transporter information, GST breakdowns, and visible dynamic table columns."),
    ]
    
    v3_tbl = doc.add_table(rows=len(v3_items) + 1, cols=2)
    v3_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    format_table_header(v3_tbl.rows[0], col_w_v1, ["Component / Area", "Key Enhancements Implemented"], bg_color="6D28D9")
    for idx, (comp, desc) in enumerate(v3_items):
        format_table_row(v3_tbl.rows[idx + 1], col_w_v1, [comp, desc], is_even=(idx % 2 == 1))
        
    doc.add_paragraph().paragraph_format.space_after = Pt(10)
    
    # ----------------------------------------------------
    # SECTION 5: FEATURE COMPARISON MATRIX ACROSS VERSIONS
    # ----------------------------------------------------
    h5 = doc.add_paragraph()
    h5.paragraph_format.space_before = Pt(14)
    h5.paragraph_format.space_after = Pt(4)
    rh5 = h5.add_run("5. Cross-Version Feature Comparison Matrix")
    rh5.bold = True
    rh5.font.name = "Arial"
    rh5.font.size = Pt(14)
    rh5.font.color.rgb = RGBColor(30, 41, 59)
    
    matrix_cols = [Inches(2.5), Inches(1.4), Inches(1.5), Inches(1.5)]
    matrix_headers = ["Capability / Feature", "Version 1.0", "Version 2.0", "Review 3.0"]
    matrix_data = [
        ("Generation Model", "4-Step Stepper Wizard", "Single-Page Instant", "Single-Page Instant"),
        ("Multi-Currency Selector", "INR only", "8 Currencies (₹, $, €, £...)", "8 Currencies (₹, $, €, £...)"),
        ("Photo → Quote (AI Review)", "Not available", "Included (OCR Review)", "Included (OCR Review)"),
        ("Voice → Quote (Audio AI)", "Not available", "Included (Mic waveform)", "Included (Mic waveform)"),
        ("1-Click Invoice Conversion", "Manual entry", "1-Click Auto-Mapping", "1-Click Auto-Mapping"),
        ("Shipping Details Section", "Not available", "Not available", "Included (5 Fields)"),
        ("GST / Tax Config Modal", "Standard Tax % only", "Standard Tax % only", "Full (IGST/CGST/Cess/RCM)"),
        ("Custom Columns & Formulas", "Fixed columns", "Fixed columns", "Dynamic Customizer + Eye Toggle"),
        ("Dedicated URL Route", "/#/create-quote", "/#/create-quote", "/#/create-quote2"),
        ("Active Test Subdomain", "test.ilovequote.com", "test.ilovequote.com", "test.ilovequote.com"),
    ]
    
    matrix_tbl = doc.add_table(rows=len(matrix_data) + 1, cols=4)
    matrix_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    format_table_header(matrix_tbl.rows[0], matrix_cols, matrix_headers, bg_color="0F172A")
    for idx, row_vals in enumerate(matrix_data):
        format_table_row(matrix_tbl.rows[idx + 1], matrix_cols, row_vals, is_even=(idx % 2 == 1))
        
    doc.add_paragraph().paragraph_format.space_after = Pt(10)
    
    # ----------------------------------------------------
    # SECTION 6: FILE INVENTORY & DEPLOYMENT DIRECTORY
    # ----------------------------------------------------
    h6 = doc.add_paragraph()
    h6.paragraph_format.space_before = Pt(14)
    h6.paragraph_format.space_after = Pt(4)
    rh6 = h6.add_run("6. File Modification Summary & Deployment Links")
    rh6.bold = True
    rh6.font.name = "Arial"
    rh6.font.size = Pt(14)
    rh6.font.color.rgb = RGBColor(30, 41, 59)
    
    files_cols = [Inches(2.6), Inches(1.1), Inches(3.2)]
    files_headers = ["File Path", "Action", "Description"]
    files_data = [
        ("frontend/src/components/quote-generator/TaxConfigModal.tsx", "Created", "4-step modal for GST/VAT/Sales Tax, Place of Supply, IGST/CGST, Cess & RCM."),
        ("frontend/src/components/quote-generator/ColumnFormulaModal.tsx", "Created", "Drag handle, column name/type customizer, visibility toggles & add custom column."),
        ("frontend/src/components/quote-generator/ManualQuoteGenerator.tsx", "Modified", "Added Additional Options accordion, dynamic column rendering, shipping fields, and GST breakdown."),
        ("frontend/src/types/structuredQuote.ts", "Modified", "Added TaxConfiguration, QuoteColumnConfig, ShippingDetails, Indian States list, and Cess calculator."),
        ("frontend/src/App.tsx", "Modified", "Registered dedicated route /#/create-quote2."),
        ("VERSION_CHANGE_RECORDS.md", "Modified", "Backup logs and cross-version documentation."),
    ]
    
    files_tbl = doc.add_table(rows=len(files_data) + 1, cols=3)
    files_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    format_table_header(files_tbl.rows[0], files_cols, files_headers, bg_color="1E293B")
    for idx, row_vals in enumerate(files_data):
        format_table_row(files_tbl.rows[idx + 1], files_cols, row_vals, is_even=(idx % 2 == 1))
        
    doc.add_paragraph().paragraph_format.space_after = Pt(10)
    
    # Footer Links Callout
    add_callout(
        doc,
        "Live Deployment & Access Links",
        "• Active Test Subdomain: https://test.ilovequote.com/#/create-quote2\n"
        "• Vercel Direct Preview: https://ilovequote-txou-git-preview-venkateswarlu-kataris-projects.vercel.app/#/create-quote2\n"
        "• Git Repository: https://github.com/clientfoster/ilovequote\n"
        "• Backup Branches: preview1 (V1), preview2 (V2), preview3 (V3), review3 (Active V3 Test).",
        border_color="4F46E5",
        bg_color="EEF2FF"
    )
    
    doc.save(output_path)
    print(f"Successfully generated Word document at: {output_path}")

if __name__ == "__main__":
    out_dir = r"C:\Users\Admin\.gemini\antigravity\scratch\ilovequote"
    doc_path = os.path.join(out_dir, "iLoveQuote_Version_Change_Records_All_Reviews.docx")
    build_word_document(doc_path)
