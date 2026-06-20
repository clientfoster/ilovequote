import express from 'express';
import { pbkdf2Sync, randomBytes, randomInt, randomUUID, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resend } from 'resend';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const STORE_FILE = path.join(DATA_DIR, 'quotes.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PORT = Number(process.env.PORT || 3001);
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`;
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const OTP_TTL_MS = 10 * 60 * 1000;
const VERIFICATION_TTL_MS = 15 * 60 * 1000;

const app = express();
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;
app.use(express.json({ limit: '5mb' }));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

const DEFAULT_TERMS = [
  'This quote is valid for 30 days from the date above.',
  '50% advance payment is required to start the project.',
  'Payment once made is non-refundable.',
];

const DEMO_BUSINESS = {
  companyName: 'Semixon Technologies',
  tagline: 'We build digital solutions that help businesses grow.',
  email: 'hello@semixon.com',
  phone: '+91 98765 43210',
  website: 'https://www.semixon.com',
  logo: '',
  address: '123, Digital Tower',
  city: 'Kozhikode',
  state: 'Kerala',
  zipCode: '673006',
  country: 'India',
  taxType: 'GSTIN',
  taxId: '32ABCDE1234F1Z5',
  socialLinks: [
    { platform: 'LinkedIn', url: 'https://www.linkedin.com/company/semixon' },
    { platform: 'Instagram', url: 'https://www.instagram.com/semixon' },
  ],
  businessSlug: 'semixon-technologies',
};

const DEMO_CLIENT = {
  name: 'Swanish Healthcare Pvt. Ltd.',
  email: 'info@swanishhealthcare.com',
  phone: '+91 98462 68462',
  address: 'Kozhikode, Kerala, India\n673006, India',
};

function formatMoney(value) {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function moneyLabel(value) {
  return `INR ${formatMoney(value)}`;
}

function slugify(value) {
  return String(value || 'quote')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'quote';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizePdfText(value) {
  return String(value ?? '')
    .replace(/\r/g, '')
    .replace(/₹/g, 'INR ')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '?');
}

function escapePdfText(value) {
  return sanitizePdfText(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function hexToRgb(hex) {
  const normalized = hex.replace('#', '');
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16) / 255,
    g: Number.parseInt(normalized.slice(2, 4), 16) / 255,
    b: Number.parseInt(normalized.slice(4, 6), 16) / 255,
  };
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toIsoDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString().slice(0, 10) : date.toISOString().slice(0, 10);
}

function currentIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function randomToken(prefix) {
  return `${prefix}-${randomBytes(4).toString('hex')}`;
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const derived = pbkdf2Sync(String(password), salt, 120000, 32, 'sha256').toString('hex');
  return { salt, hash: derived };
}

function verifyPassword(password, salt, hash) {
  const candidate = pbkdf2Sync(String(password), salt, 120000, 32, 'sha256');
  const expected = Buffer.from(String(hash), 'hex');
  return expected.length === candidate.length && timingSafeEqual(candidate, expected);
}

function generateOtp() {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

async function sendOtpEmail({ email, otp }) {
  if (!resend) {
    return { provider: 'dev', skipped: true };
  }

  const { data, error } = await resend.emails.send({
    from: RESEND_FROM_EMAIL,
    to: [email],
    subject: 'Your login code for ilovequote',
    html: `
      <div style="font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.6;color:#0f172a">
        <h2 style="margin:0 0 12px;color:#1d4ed8">Your login code</h2>
        <p style="margin:0 0 16px">Use this one-time code to finish signing in:</p>
        <div style="display:inline-block;padding:14px 18px;border-radius:14px;background:#eff6ff;font-size:28px;font-weight:800;letter-spacing:0.3em">${otp}</div>
        <p style="margin:16px 0 0;color:#64748b">This code expires in 10 minutes.</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(error.message || 'Resend failed to send OTP email');
  }

  return { provider: 'resend', id: data?.id || null };
}

function getBaseUrl(req) {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const proto = Array.isArray(forwardedProto)
    ? forwardedProto[0]
    : forwardedProto || req.protocol || 'http';
  const host = req.get('host') || `localhost:${PORT}`;
  return `${proto}://${host}`;
}

function computeLineItem(item) {
  const quantity = Math.max(1, Number(item.quantity ?? 1) || 1);
  const unitPrice = Number(item.unitPrice ?? item.price ?? 0) || 0;
  const discountType = item.discountType || 'None';
  const discountValue = Number(item.discountValue ?? 0) || 0;
  const gstRate = Number(item.gstRate ?? item.taxRate ?? 0) || 0;
  const complimentary = Boolean(item.complimentary);
  const taxInclusive = Boolean(item.taxInclusive);
  const baseAmount = complimentary ? 0 : quantity * unitPrice;

  let discountAmount = 0;
  if (!complimentary) {
    if (discountType === 'Percentage') {
      discountAmount = baseAmount * (discountValue / 100);
    } else if (discountType === 'Flat') {
      discountAmount = Math.min(baseAmount, discountValue);
    }
  }

  const netAmount = Math.max(0, baseAmount - discountAmount);
  let taxAmount = 0;
  if (gstRate > 0) {
    taxAmount = taxInclusive ? netAmount - netAmount / (1 + gstRate / 100) : netAmount * (gstRate / 100);
  }

  const grandAmount = taxInclusive ? netAmount : netAmount + taxAmount;

  return {
    id: item.id || randomToken('line'),
    name: item.name || item.description || 'Item',
    description: item.description || item.name || '',
    quantity,
    unitPrice,
    complimentary,
    discountType,
    discountValue,
    gstRate,
    taxInclusive,
    icon: item.icon || 'FileText',
    lineBase: baseAmount,
    discountAmount,
    taxableAmount: netAmount,
    taxAmount,
    total: Number(grandAmount.toFixed(2)),
  };
}

function summarizeItems(items) {
  const normalized = (items || []).map(computeLineItem);
  const subtotal = normalized.reduce((sum, item) => sum + item.lineBase, 0);
  const discountTotal = normalized.reduce((sum, item) => sum + item.discountAmount, 0);
  const taxTotal = normalized.reduce((sum, item) => sum + item.taxAmount, 0);
  const totalAmount = normalized.reduce((sum, item) => sum + item.total, 0);

  return {
    items: normalized,
    subtotal: Number(subtotal.toFixed(2)),
    discountTotal: Number(discountTotal.toFixed(2)),
    taxTotal: Number(taxTotal.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2)),
  };
}

function buildBusinessDetails(source = {}) {
  return {
    companyName: source.companyName || source.businessName || DEMO_BUSINESS.companyName,
    tagline: source.tagline || source.businessTagline || DEMO_BUSINESS.tagline,
    email: source.email || DEMO_BUSINESS.email,
    phone: source.phone || DEMO_BUSINESS.phone,
    website: source.website || DEMO_BUSINESS.website,
    logo: source.logo || '',
    address: source.address || DEMO_BUSINESS.address,
    city: source.city || DEMO_BUSINESS.city,
    state: source.state || DEMO_BUSINESS.state,
    zipCode: source.zipCode || DEMO_BUSINESS.zipCode,
    country: source.country || DEMO_BUSINESS.country,
    taxType: source.taxType || DEMO_BUSINESS.taxType,
    taxId: source.taxId || DEMO_BUSINESS.taxId,
    socialLinks: Array.isArray(source.socialLinks) ? source.socialLinks : DEMO_BUSINESS.socialLinks,
    businessSlug: slugify(source.businessSlug || source.companyName || DEMO_BUSINESS.businessSlug),
  };
}

function buildClientDetails(source = {}) {
  const addressParts = [];
  if (source.billingAddress) addressParts.push(source.billingAddress);
  const cityState = [source.city, source.state].filter(Boolean).join(', ');
  const postalCountry = [source.zipCode, source.country].filter(Boolean).join(', ');
  if (cityState) addressParts.push(cityState);
  if (postalCountry) addressParts.push(postalCountry);

  return {
    name: source.companyName || source.name || DEMO_CLIENT.name,
    contactPerson: source.contactPerson || '',
    email: source.email || DEMO_CLIENT.email,
    phone: source.phone || DEMO_CLIENT.phone,
    website: source.website || '',
    address: source.address || addressParts.join('\n') || DEMO_CLIENT.address,
    taxIdType: source.taxIdType || 'GSTIN',
    taxId: source.taxId || '',
    poNumber: source.poNumber || '',
  };
}

function buildQuotationMeta(source = {}, businessDetails, clientDetails) {
  const date = source.date || currentIsoDate();
  const validUntil = source.validUntil || toIsoDate(addDays(new Date(date), 30));

  return {
    quotationNumber: source.quotationNumber || source.quoteNumber || `Q-${new Date(date).getFullYear()}-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`,
    clientName: source.clientName || clientDetails.name,
    clientEmail: source.clientEmail || clientDetails.email,
    businessName: source.businessName || businessDetails.companyName,
    businessEmail: source.businessEmail || businessDetails.email,
    date,
    validUntil,
    currency: source.currency || 'INR',
  };
}

function buildQuoteFromPayload(payload = {}) {
  const isWizardPayload = Array.isArray(payload.itemsData) || payload.businessData || payload.clientData || payload.quotationMeta;

  const businessDetails = buildBusinessDetails(payload.businessDetails || payload.businessData || payload);
  const clientDetails = buildClientDetails(payload.clientDetails || payload.clientData || payload);
  const itemSource = payload.items || payload.itemsData || [];
  const totals = summarizeItems(itemSource);
  const quotationMeta = buildQuotationMeta(payload.quotationMeta || payload, businessDetails, clientDetails);
  const taxRate = Number(payload.taxRate ?? payload.defaultGstPercent ?? 0) || 0;
  const terms = payload.terms || payload.termsAndConditions || DEFAULT_TERMS.join('\n');
  const id = payload.id || `quote_${randomUUID()}`;
  const quoteNumber = quotationMeta.quotationNumber;
  const shareToken = payload.shareToken || randomToken(slugify(quoteNumber));
  const status = payload.status || 'Completed';

  return {
    id,
    shareToken,
    quoteNumber,
    date: quotationMeta.date,
    expiryDate: quotationMeta.validUntil,
    status,
    businessDetails,
    clientDetails,
    items: totals.items.map((item) => ({
      id: item.id,
      description: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
      discountType: item.discountType,
      discountValue: item.discountValue,
      gstRate: item.gstRate,
      complimentary: item.complimentary,
      taxInclusive: item.taxInclusive,
      icon: item.icon,
      lineBase: item.lineBase,
      discountAmount: item.discountAmount,
      taxableAmount: item.taxableAmount,
      taxAmount: item.taxAmount,
    })),
    subtotal: totals.subtotal,
    taxRate,
    taxAmount: Number((payload.taxAmount ?? totals.taxTotal).toFixed(2)),
    totalAmount: Number((payload.totalAmount ?? totals.totalAmount).toFixed(2)),
    terms,
    quotationMeta,
    createdAt: payload.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: isWizardPayload ? 'wizard' : 'api',
  };
}

function buildSeedQuotes() {
  const standard = buildQuoteFromPayload({
    id: 'quote_standard_semixon',
    shareToken: 'semixon-standard-2024',
    status: 'Completed',
    businessDetails: DEMO_BUSINESS,
    clientDetails: DEMO_CLIENT,
    quotationMeta: {
      quotationNumber: 'Q-2024-001',
      clientName: DEMO_CLIENT.name,
      clientEmail: DEMO_CLIENT.email,
      businessName: DEMO_BUSINESS.companyName,
      businessEmail: DEMO_BUSINESS.email,
      date: '2024-05-16',
      validUntil: '2024-05-30',
      currency: 'INR',
    },
    items: [
      { id: 'item-1', name: 'Website Design & Development', unitPrice: 25000, quantity: 1, discountType: 'Percentage', discountValue: 10, gstRate: 18 },
      { id: 'item-2', name: 'Domain & Hosting', unitPrice: 2500, quantity: 1, discountType: 'None', discountValue: 0, gstRate: 18 },
      { id: 'item-3', name: 'SEO Setup', unitPrice: 8000, quantity: 1, discountType: 'Percentage', discountValue: 5, gstRate: 18 },
    ],
    taxRate: 18,
    terms: DEFAULT_TERMS.join('\n'),
  });
  standard.taxAmount = 5868;
  standard.totalAmount = 34468;

  const noTax = buildQuoteFromPayload({
    id: 'quote_no_tax_semixon',
    shareToken: 'semixon-no-tax-2024',
    status: 'Completed',
    businessDetails: DEMO_BUSINESS,
    clientDetails: DEMO_CLIENT,
    quotationMeta: {
      quotationNumber: 'Q-2024-002',
      clientName: DEMO_CLIENT.name,
      clientEmail: DEMO_CLIENT.email,
      businessName: DEMO_BUSINESS.companyName,
      businessEmail: DEMO_BUSINESS.email,
      date: '2024-05-16',
      validUntil: '2024-05-30',
      currency: 'INR',
    },
    items: [
      { id: 'item-1', name: 'Website Design & Development', unitPrice: 25000, quantity: 1 },
      { id: 'item-2', name: 'Domain & Hosting (1 Year)', unitPrice: 2500, quantity: 1 },
      { id: 'item-3', name: 'SEO Setup', unitPrice: 8000, quantity: 1 },
    ],
    taxRate: 0,
    terms: DEFAULT_TERMS.join('\n'),
  });
  noTax.totalAmount = 35500;
  noTax.taxAmount = 0;

  const noDiscount = buildQuoteFromPayload({
    id: 'quote_no_discount_semixon',
    shareToken: 'semixon-no-discount-2024',
    status: 'Completed',
    businessDetails: DEMO_BUSINESS,
    clientDetails: DEMO_CLIENT,
    quotationMeta: {
      quotationNumber: 'Q-2024-003',
      clientName: DEMO_CLIENT.name,
      clientEmail: DEMO_CLIENT.email,
      businessName: DEMO_BUSINESS.companyName,
      businessEmail: DEMO_BUSINESS.email,
      date: '2024-05-16',
      validUntil: '2024-05-30',
      currency: 'INR',
    },
    items: [
      { id: 'item-1', name: 'Website Design & Development', unitPrice: 25000, quantity: 1, gstRate: 18 },
      { id: 'item-2', name: 'Domain & Hosting (1 Year)', unitPrice: 2500, quantity: 1, gstRate: 18 },
      { id: 'item-3', name: 'SEO Setup', unitPrice: 8000, quantity: 1, gstRate: 18 },
    ],
    taxRate: 18,
    terms: DEFAULT_TERMS.join('\n'),
  });
  noDiscount.taxAmount = 6390;
  noDiscount.totalAmount = 41890;

  return [standard, noTax, noDiscount];
}

async function loadQuotes() {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await readFile(STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    const quotes = Array.isArray(parsed) ? parsed : parsed.quotes;
    if (Array.isArray(quotes) && quotes.length > 0) {
      return quotes;
    }
  } catch {
    // fall through to seed data
  }

  const seedQuotes = buildSeedQuotes();
  await writeFile(STORE_FILE, JSON.stringify(seedQuotes, null, 2), 'utf8');
  return seedQuotes;
}

let quotes = await loadQuotes();
let users = [];
const pendingOtps = new Map();
const verificationTokens = new Map();
const authTokens = new Map();

async function loadUsers() {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await readFile(USERS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    const storedUsers = Array.isArray(parsed) ? parsed : parsed.users;
    if (Array.isArray(storedUsers)) {
      users = storedUsers;
      return;
    }
  } catch {
    // fall through to empty store
  }

  users = [];
  await writeFile(USERS_FILE, JSON.stringify({ users }, null, 2), 'utf8');
}

await loadUsers();

async function persistQuotes() {
  await writeFile(STORE_FILE, JSON.stringify(quotes, null, 2), 'utf8');
}

async function persistUsers() {
  await writeFile(USERS_FILE, JSON.stringify({ users }, null, 2), 'utf8');
}

function makePublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  };
}

function createAuthToken(userId) {
  const token = randomBytes(24).toString('hex');
  authTokens.set(token, {
    userId,
    createdAt: new Date().toISOString(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });
  return token;
}

function getAuthenticatedUser(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const session = authTokens.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (token) authTokens.delete(token);
    return null;
  }

  return users.find((user) => user.id === session.userId) || null;
}

function publicShareUrl(req, quote) {
  return `${getBaseUrl(req)}/share/${quote.shareToken}`;
}

function findQuoteById(id) {
  return quotes.find((quote) => quote.id === id || quote.shareToken === id || quote.quoteNumber === id);
}

function findQuoteByToken(token) {
  return quotes.find((quote) => quote.shareToken === token || quote.id === token || quote.quoteNumber === token);
}

function quoteSummary(quote, req) {
  return {
    id: quote.id,
    shareToken: quote.shareToken,
    shareUrl: publicShareUrl(req, quote),
    pdfUrl: `${getBaseUrl(req)}/api/quotes/${encodeURIComponent(quote.id)}/pdf`,
    quoteNumber: quote.quoteNumber,
    date: quote.date,
    expiryDate: quote.expiryDate,
    status: quote.status,
    businessName: quote.businessDetails?.companyName || '',
    clientName: quote.clientDetails?.name || '',
    subtotal: quote.subtotal,
    taxAmount: quote.taxAmount,
    totalAmount: quote.totalAmount,
    itemCount: Array.isArray(quote.items) ? quote.items.length : 0,
  };
}

function pdfText(x, y, size, text, color = '0 0 0') {
  return `BT\n${color} rg\n/F1 ${size} Tf\n1 0 0 1 ${x} ${y} Tm\n(${escapePdfText(text)}) Tj\nET`;
}

function pdfLine(x1, y1, x2, y2, width = 0.6, color = '0.83 0.87 0.93') {
  return `${width} w\n${color} RG\n${x1} ${y1} m\n${x2} ${y2} l\nS`;
}

function pdfRect(x, y, width, height, fill = null, stroke = null, lineWidth = 1) {
  const parts = [`${lineWidth} w`];
  if (fill) {
    parts.push(`${fill} rg`);
  }
  if (stroke) {
    parts.push(`${stroke} RG`);
  }
  parts.push(`${x} ${y} ${width} ${height} re`);
  if (fill && stroke) return `${parts.join('\n')}\nB`;
  if (fill) return `${parts.join('\n')}\nf`;
  if (stroke) return `${parts.join('\n')}\nS`;
  return `${parts.join('\n')}\nS`;
}

function buildPdfBuffer(quote) {
  const width = 595.28;
  const height = 841.89;
  const margin = 42;

  const lines = [];
  const push = (chunk) => lines.push(chunk);

  // Header band.
  push(pdfRect(0, height - 115, width, 115, '0.05 0.11 0.27', '0.05 0.11 0.27', 1));
  push(pdfText(46, height - 52, 24, quote.businessDetails.companyName, '1 1 1'));
  push(pdfText(46, height - 78, 11, quote.businessDetails.tagline || '', '0.84 0.9 1'));
  push(pdfText(width - 210, height - 52, 12, 'QUOTE PREVIEW', '0.79 0.87 1'));
  push(pdfText(width - 210, height - 74, 10, `Share: ${quote.shareToken}`, '0.79 0.87 1'));

  let y = height - 145;
  push(pdfText(margin, y, 18, 'Price Quote', '0.05 0.29 0.87'));
  push(pdfText(width - 180, y, 14, quote.quoteNumber, '0.05 0.29 0.87'));
  y -= 18;
  push(pdfText(width - 155, y, 10, `Date: ${quote.date}`, '0.26 0.31 0.4'));
  y -= 14;
  push(pdfText(width - 155, y, 10, `Valid Until: ${quote.expiryDate}`, '0.26 0.31 0.4'));

  y -= 28;
  push(pdfText(margin, y, 11, 'Prepared For', '0.26 0.31 0.4'));
  y -= 22;
  push(pdfText(margin, y, 16, quote.clientDetails.name, '0.08 0.12 0.22'));
  y -= 18;
  push(pdfText(margin, y, 10, quote.clientDetails.contactPerson || '', '0.18 0.21 0.29'));
  y -= 16;
  push(pdfText(margin, y, 10, quote.clientDetails.email || '', '0.18 0.21 0.29'));
  y -= 16;
  push(pdfText(margin, y, 10, quote.clientDetails.phone || '', '0.18 0.21 0.29'));
  y -= 16;
  push(pdfText(margin, y, 10, quote.clientDetails.address || '', '0.18 0.21 0.29'));

  y -= 28;
  push(pdfLine(margin, y, width - margin, y));
  y -= 20;
  push(pdfText(margin, y, 12, `Business: ${quote.businessDetails.companyName}`, '0.08 0.12 0.22'));
  y -= 16;
  push(pdfText(margin, y, 10, `Email: ${quote.businessDetails.email}`, '0.18 0.21 0.29'));
  y -= 16;
  push(pdfText(margin, y, 10, `Phone: ${quote.businessDetails.phone}`, '0.18 0.21 0.29'));
  y -= 16;
  push(pdfText(margin, y, 10, `Website: ${quote.businessDetails.website}`, '0.18 0.21 0.29'));
  y -= 24;
  push(pdfText(margin, y, 10, `Tax ID: ${quote.businessDetails.taxType} ${quote.businessDetails.taxId || ''}`, '0.18 0.21 0.29'));

  y -= 34;
  const tableTop = y;
  const col = { num: 56, desc: 208, qty: 50, rate: 88, tax: 88, amount: 83 };
  const tableX = margin;
  const tableW = width - margin * 2;
  const headerH = 24;
  const rowH = 40;
  const totalCols = col.num + col.desc + col.qty + col.rate + col.tax + col.amount;

  push(pdfRect(tableX, tableTop - headerH, tableW, headerH, '0.11 0.29 0.88', '0.11 0.29 0.88', 0.8));
  push(pdfText(tableX + 10, tableTop - 16, 9, '#', '1 1 1'));
  push(pdfText(tableX + col.num + 10, tableTop - 16, 9, 'Item / Description', '1 1 1'));
  push(pdfText(tableX + col.num + col.desc + 10, tableTop - 16, 9, 'Qty', '1 1 1'));
  push(pdfText(tableX + col.num + col.desc + col.qty + 10, tableTop - 16, 9, 'Rate', '1 1 1'));
  push(pdfText(tableX + col.num + col.desc + col.qty + col.rate + 10, tableTop - 16, 9, 'Tax', '1 1 1'));
  push(pdfText(tableX + col.num + col.desc + col.qty + col.rate + col.tax + 10, tableTop - 16, 9, 'Amount', '1 1 1'));

  let rowY = tableTop - headerH;
  quote.items.forEach((item, index) => {
    const rowBottom = rowY - rowH;
    push(pdfRect(tableX, rowBottom, tableW, rowH, '1 1 1', '0.84 0.87 0.92', 0.5));
    push(pdfText(tableX + 10, rowY - 22, 10, String(index + 1), '0.12 0.16 0.24'));
    push(pdfText(tableX + col.num + 10, rowY - 16, 9, item.description, '0.12 0.16 0.24'));
    push(pdfText(tableX + col.num + col.desc + 10, rowY - 22, 10, String(item.quantity), '0.12 0.16 0.24'));
    push(pdfText(tableX + col.num + col.desc + col.qty + 10, rowY - 22, 10, moneyLabel(item.unitPrice), '0.12 0.16 0.24'));
    push(pdfText(tableX + col.num + col.desc + col.qty + col.rate + 10, rowY - 16, 9, item.gstRate ? `${item.gstRate}% GST` : 'No Tax', '0.12 0.16 0.24'));
    push(pdfText(tableX + col.num + col.desc + col.qty + col.rate + col.tax + 10, rowY - 22, 10, moneyLabel(item.total), '0.12 0.16 0.24'));
    if (item.discountAmount > 0) {
      push(pdfText(tableX + col.num + 10, rowY - 31, 8, `Discount: ${item.discountType === 'Percentage' ? `${item.discountValue}%` : moneyLabel(item.discountValue)}`, '0.08 0.5 0.15'));
    }
    rowY = rowBottom;
  });

  const summaryTop = rowY - 20;
  push(pdfRect(tableX, summaryTop - 92, tableW, 92, '0.99 0.99 1', '0.84 0.87 0.92', 0.7));
  const summaryLeft = tableX + tableW - 210;
  push(pdfText(summaryLeft, summaryTop - 18, 10, 'Sub Total', '0.08 0.12 0.22'));
  push(pdfText(summaryLeft + 110, summaryTop - 18, 10, moneyLabel(quote.subtotal), '0.08 0.12 0.22'));
  push(pdfText(summaryLeft, summaryTop - 38, 10, 'Total Discount', '0.08 0.12 0.22'));
  push(pdfText(summaryLeft + 110, summaryTop - 38, 10, `- ${moneyLabel(quote.items.reduce((sum, item) => sum + (item.discountAmount || 0), 0))}`, '0.0 0.62 0.2'));
  push(pdfText(summaryLeft, summaryTop - 58, 10, quote.taxAmount > 0 ? 'Tax (18%)' : 'No Tax', '0.08 0.12 0.22'));
  push(pdfText(summaryLeft + 110, summaryTop - 58, 10, quote.taxAmount > 0 ? moneyLabel(quote.taxAmount) : '-', '0.08 0.12 0.22'));
  push(pdfLine(tableX, summaryTop - 66, tableX + tableW, summaryTop - 66, 0.6, '0.82 0.86 0.92'));
  push(pdfText(tableX + 205, summaryTop - 84, 12, 'Total', '0.08 0.12 0.22'));
  push(pdfText(tableX + tableW - 130, summaryTop - 84, 14, moneyLabel(quote.totalAmount), '0.05 0.29 0.88'));

  const termsTop = summaryTop - 124;
  push(pdfText(margin, termsTop, 12, 'Terms & Conditions', '0.08 0.12 0.22'));
  const terms = String(quote.terms || '').split('\n').map((line) => line.trim()).filter(Boolean);
  let termsY = termsTop - 18;
  terms.slice(0, 5).forEach((term) => {
    push(pdfText(margin + 8, termsY, 9, `- ${term}`, '0.18 0.21 0.29'));
    termsY -= 14;
  });

  push(pdfText(margin, 40, 8, 'Generated by ilovequote.com backend', '0.45 0.48 0.55'));

  const contentStream = lines.join('\n');
  const objects = [];
  const addObject = (body) => {
    objects.push(body);
    return objects.length;
  };

  const fontObj = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const contentObj = addObject(`<< /Length ${Buffer.byteLength(contentStream, 'utf8')} >>\nstream\n${contentStream}\nendstream`);
  const pageObj = addObject(`<< /Type /Page /Parent 4 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 ${fontObj} 0 R >> >> /Contents ${contentObj} 0 R >>`);
  const pagesObj = addObject(`<< /Type /Pages /Kids [${pageObj} 0 R] /Count 1 >>`);
  const catalogObj = addObject(`<< /Type /Catalog /Pages ${pagesObj} 0 R >>`);

  const header = '%PDF-1.4\n';
  const chunks = [Buffer.from(header, 'utf8')];
  const offsets = [0];
  let offset = Buffer.byteLength(header, 'utf8');

  objects.forEach((body, index) => {
    const objectNumber = index + 1;
    const serialized = `${objectNumber} 0 obj\n${body}\nendobj\n`;
    offsets.push(offset);
    const buf = Buffer.from(serialized, 'utf8');
    chunks.push(buf);
    offset += buf.length;
  });

  const xrefOffset = offset;
  const xref = [
    'xref',
    `0 ${objects.length + 1}`,
    '0000000000 65535 f ',
    ...offsets.slice(1).map((entry) => String(entry).padStart(10, '0') + ' 00000 n '),
    'trailer',
    `<< /Size ${objects.length + 1} /Root ${catalogObj} 0 R >>`,
    'startxref',
    String(xrefOffset),
    '%%EOF',
  ].join('\n');
  chunks.push(Buffer.from(xref, 'utf8'));

  return Buffer.concat(chunks);
}

function renderSharePage(quote, req) {
  const shareUrl = publicShareUrl(req, quote);
  const pdfUrl = `${getBaseUrl(req)}/api/quotes/${encodeURIComponent(quote.id)}/pdf`;
  const itemsHtml = quote.items.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(item.description)}</td>
      <td>${item.quantity}</td>
      <td>${escapeHtml(moneyLabel(item.unitPrice))}</td>
      <td>${item.gstRate ? `${item.gstRate}%` : 'No Tax'}</td>
      <td>${escapeHtml(moneyLabel(item.total))}</td>
    </tr>
  `).join('');
  const termsHtml = String(quote.terms || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(quote.quoteNumber)} - ${escapeHtml(quote.businessDetails.companyName)}</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f3f7ff;
      --card: rgba(255,255,255,0.9);
      --border: rgba(37, 99, 235, 0.12);
      --brand: #1d4ed8;
      --ink: #0f172a;
      --muted: #51607a;
      --good: #16a34a;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background:
        radial-gradient(circle at top left, rgba(29,78,216,0.12), transparent 25%),
        radial-gradient(circle at top right, rgba(34,197,94,0.08), transparent 22%),
        linear-gradient(180deg, #ffffff 0%, var(--bg) 100%);
      color: var(--ink);
    }
    .wrap {
      max-width: 1180px;
      margin: 0 auto;
      padding: 24px;
    }
    .hero {
      display: grid;
      grid-template-columns: 1.6fr 1fr;
      gap: 20px;
      align-items: stretch;
    }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 24px;
      box-shadow: 0 14px 40px rgba(15, 23, 42, 0.06);
      backdrop-filter: blur(14px);
    }
    .brand {
      padding: 24px;
      min-height: 220px;
      background: linear-gradient(135deg, #091a3a, #1d4ed8);
      color: white;
      position: relative;
      overflow: hidden;
    }
    .brand::after {
      content: '';
      position: absolute;
      inset: auto -40px -40px auto;
      width: 180px;
      height: 180px;
      border-radius: 50%;
      background: rgba(255,255,255,0.12);
      filter: blur(8px);
    }
    .brand h1 {
      margin: 0 0 8px;
      font-size: 30px;
      line-height: 1.05;
      letter-spacing: -0.03em;
    }
    .brand p, .brand a {
      color: rgba(255,255,255,0.88);
      text-decoration: none;
      margin: 0;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.16);
      border-radius: 999px;
      padding: 8px 12px;
      margin-bottom: 18px;
      font-size: 13px;
    }
    .share {
      padding: 24px;
      display: grid;
      gap: 14px;
    }
    .share h2, .section h2 {
      margin: 0;
      font-size: 22px;
      letter-spacing: -0.02em;
    }
    .share .url {
      background: rgba(29,78,216,0.06);
      border: 1px solid rgba(29,78,216,0.14);
      border-radius: 16px;
      padding: 12px 14px;
      word-break: break-all;
      font-size: 13px;
      color: var(--muted);
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
    .btn {
      appearance: none;
      border: none;
      border-radius: 14px;
      padding: 13px 16px;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 48px;
    }
    .btn.primary { background: linear-gradient(135deg, #1d4ed8, #2563eb); color: white; }
    .btn.ghost { background: white; color: var(--brand); border: 1px solid rgba(29,78,216,0.24); }
    .grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 16px;
      margin-top: 20px;
    }
    .metric {
      padding: 18px;
    }
    .metric .label { font-size: 12px; color: var(--muted); margin-bottom: 8px; }
    .metric .value { font-size: 24px; font-weight: 800; letter-spacing: -0.03em; }
    .section {
      margin-top: 20px;
      padding: 24px;
    }
    .section p, .section li {
      color: var(--muted);
      line-height: 1.6;
    }
    .split {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
      margin-top: 16px;
    }
    .panel {
      background: rgba(255,255,255,0.72);
      border: 1px solid rgba(148,163,184,0.22);
      border-radius: 18px;
      padding: 18px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 14px;
    }
    th, td {
      text-align: left;
      padding: 14px 12px;
      border-bottom: 1px solid rgba(148,163,184,0.18);
      vertical-align: top;
    }
    th {
      color: white;
      background: linear-gradient(135deg, #1d4ed8, #2563eb);
      font-size: 13px;
    }
    tbody tr:nth-child(even) td { background: rgba(239, 246, 255, 0.5); }
    .totals {
      display: grid;
      justify-content: end;
      gap: 6px;
      margin-top: 14px;
      color: var(--ink);
      font-weight: 700;
    }
    .total-amount {
      font-size: 28px;
      color: var(--brand);
    }
    @media (max-width: 900px) {
      .hero, .split, .grid { grid-template-columns: 1fr; }
      .wrap { padding: 16px; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="hero">
      <div class="card brand">
        <div class="chip">Share Link Ready</div>
        <h1>${escapeHtml(quote.businessDetails.companyName)}</h1>
        <p>${escapeHtml(quote.businessDetails.tagline || '')}</p>
        <div style="height: 18px"></div>
        <p>${escapeHtml(quote.businessDetails.address)}</p>
        <p>${escapeHtml(quote.businessDetails.city)}, ${escapeHtml(quote.businessDetails.state)} ${escapeHtml(quote.businessDetails.zipCode)}</p>
        <p>${escapeHtml(quote.businessDetails.email)} | ${escapeHtml(quote.businessDetails.phone)}</p>
      </div>
      <div class="card share">
        <h2>Quote Share Link</h2>
        <p>This backend generates a unique URL for each quote and a matching PDF download endpoint.</p>
        <div class="url" id="share-url">${escapeHtml(shareUrl)}</div>
        <div class="actions">
          <a class="btn primary" href="${escapeHtml(pdfUrl)}">Download PDF</a>
          <button class="btn ghost" type="button" id="copy-btn">Copy Link</button>
        </div>
        <p style="margin:0;color:var(--good);font-weight:700;">Client: ${escapeHtml(quote.clientDetails.name)}</p>
      </div>
    </div>

    <div class="grid">
      <div class="card metric"><div class="label">Quote Number</div><div class="value">${escapeHtml(quote.quoteNumber)}</div></div>
      <div class="card metric"><div class="label">Subtotal</div><div class="value">${escapeHtml(moneyLabel(quote.subtotal))}</div></div>
      <div class="card metric"><div class="label">Tax</div><div class="value">${quote.taxAmount > 0 ? escapeHtml(moneyLabel(quote.taxAmount)) : 'No Tax'}</div></div>
      <div class="card metric"><div class="label">Total</div><div class="value">${escapeHtml(moneyLabel(quote.totalAmount))}</div></div>
    </div>

    <div class="card section">
      <h2>Quote Details</h2>
      <div class="split">
        <div class="panel">
          <p><strong>Prepared For</strong></p>
          <p>${escapeHtml(quote.clientDetails.name)}</p>
          <p>${escapeHtml(quote.clientDetails.contactPerson || '')}</p>
          <p>${escapeHtml(quote.clientDetails.email)}</p>
          <p>${escapeHtml(quote.clientDetails.phone)}</p>
          <p style="white-space:pre-line">${escapeHtml(quote.clientDetails.address)}</p>
        </div>
        <div class="panel">
          <p><strong>Prepared By</strong></p>
          <p>${escapeHtml(quote.businessDetails.companyName)}</p>
          <p>${escapeHtml(quote.businessDetails.email)}</p>
          <p>${escapeHtml(quote.businessDetails.phone)}</p>
          <p>${escapeHtml(quote.businessDetails.website)}</p>
          <p>${escapeHtml(quote.businessDetails.taxType)} ${escapeHtml(quote.businessDetails.taxId || '')}</p>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width:60px">#</th>
            <th>Item / Description</th>
            <th style="width:100px">Qty</th>
            <th style="width:140px">Rate</th>
            <th style="width:120px">Tax</th>
            <th style="width:140px">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      <div class="totals">
        <div>Sub Total: ${escapeHtml(moneyLabel(quote.subtotal))}</div>
        <div>Total Discount: ${escapeHtml(moneyLabel(quote.items.reduce((sum, item) => sum + (item.discountAmount || 0), 0)))}</div>
        <div>Tax: ${quote.taxAmount > 0 ? escapeHtml(moneyLabel(quote.taxAmount)) : 'No Tax'}</div>
        <div class="total-amount">${escapeHtml(moneyLabel(quote.totalAmount))}</div>
      </div>
    </div>

    <div class="card section">
      <h2>Terms & Conditions</h2>
      <ul>${termsHtml}</ul>
    </div>
  </div>
  <script>
    const shareUrl = ${JSON.stringify(shareUrl)};
    const copyBtn = document.getElementById('copy-btn');
    copyBtn?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(shareUrl);
        copyBtn.textContent = 'Copied';
        setTimeout(() => copyBtn.textContent = 'Copy Link', 1200);
      } catch {
        window.prompt('Copy this link', shareUrl);
      }
    });
  </script>
</body>
</html>`;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'quote-backend', quotes: quotes.length });
});

app.post('/api/auth/request-otp', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }

    const otp = generateOtp();
    const sessionId = randomUUID();
    pendingOtps.set(sessionId, {
      email,
      otp,
      attempts: 0,
      expiresAt: Date.now() + OTP_TTL_MS,
    });

    const delivery = await sendOtpEmail({ email, otp });
    console.log(`[auth] OTP for ${email}: ${otp} via ${delivery.provider}`);

    res.json({
      ok: true,
      sessionId,
      expiresInSeconds: Math.floor(OTP_TTL_MS / 1000),
      message: 'OTP sent to your email address.',
      devOtp: resend ? undefined : otp,
      emailProvider: delivery.provider,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Unable to create OTP session',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  const sessionId = String(req.body?.sessionId || '');
  const email = normalizeEmail(req.body?.email);
  const otp = String(req.body?.otp || '').trim();
  const session = pendingOtps.get(sessionId);

  if (!session || session.expiresAt < Date.now()) {
    pendingOtps.delete(sessionId);
    res.status(400).json({ error: 'OTP session expired. Please request a new code.' });
    return;
  }

  if (session.email !== email) {
    res.status(400).json({ error: 'This OTP session does not match the email address.' });
    return;
  }

  session.attempts += 1;
  if (session.attempts > 5) {
    pendingOtps.delete(sessionId);
    res.status(429).json({ error: 'Too many attempts. Please request a fresh OTP.' });
    return;
  }

  if (session.otp !== otp) {
    res.status(400).json({ error: 'Incorrect OTP. Please try again.' });
    return;
  }

  const verificationToken = randomBytes(24).toString('hex');
  verificationTokens.set(verificationToken, {
    email,
    sessionId,
    expiresAt: Date.now() + VERIFICATION_TTL_MS,
  });
  pendingOtps.delete(sessionId);

  res.json({
    ok: true,
    verificationToken,
    message: 'OTP verified successfully.',
  });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');
    const name = String(req.body?.name || '').trim();
    const verificationToken = String(req.body?.verificationToken || '');
    const verification = verificationTokens.get(verificationToken);

    if (!verification || verification.expiresAt < Date.now()) {
      verificationTokens.delete(verificationToken);
      res.status(400).json({ error: 'Verification expired. Please verify the OTP again.' });
      return;
    }

    if (verification.email !== email) {
      res.status(400).json({ error: 'Verification token does not match this email address.' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }

    const existing = users.find((user) => user.email === email);
    const passwordState = hashPassword(password);
    const user = existing
      ? {
          ...existing,
          name: name || existing.name || email.split('@')[0],
          passwordHash: passwordState.hash,
          passwordSalt: passwordState.salt,
          updatedAt: new Date().toISOString(),
          emailVerifiedAt: new Date().toISOString(),
        }
      : {
          id: randomUUID(),
          email,
          name: name || email.split('@')[0],
          passwordHash: passwordState.hash,
          passwordSalt: passwordState.salt,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          emailVerifiedAt: new Date().toISOString(),
        };

    users = existing ? users.map((entry) => (entry.email === email ? user : entry)) : [user, ...users];
    await persistUsers();
    verificationTokens.delete(verificationToken);

    const authToken = createAuthToken(user.id);
    res.status(201).json({
      ok: true,
      user: makePublicUser(user),
      authToken,
      message: 'Account created successfully.',
    });
  } catch (error) {
    res.status(500).json({
      error: 'Unable to register account',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');
    const user = users.find((entry) => entry.email === email);

    if (!user) {
      res.status(404).json({ error: 'No account found for that email address.' });
      return;
    }

    if (!user.passwordHash || !user.passwordSalt || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
      res.status(401).json({ error: 'Incorrect password.' });
      return;
    }

    const authToken = createAuthToken(user.id);
    res.json({
      ok: true,
      user: makePublicUser(user),
      authToken,
      message: 'Signed in successfully.',
    });
  } catch (error) {
    res.status(500).json({
      error: 'Unable to sign in',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/auth/me', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not signed in.' });
    return;
  }

  res.json({ ok: true, user: makePublicUser(user) });
});

app.get('/api/quotes', (req, res) => {
  res.json({
    items: quotes.map((quote) => quoteSummary(quote, req)),
  });
});

app.post('/api/quotes', async (req, res) => {
  try {
    const quote = buildQuoteFromPayload(req.body || {});
    quotes = [quote, ...quotes.filter((entry) => entry.id !== quote.id && entry.shareToken !== quote.shareToken)];
    await persistQuotes();
    res.status(201).json({
      quote,
      shareUrl: publicShareUrl(req, quote),
      pdfUrl: `${getBaseUrl(req)}/api/quotes/${encodeURIComponent(quote.id)}/pdf`,
    });
  } catch (error) {
    res.status(400).json({
      error: 'Unable to create quote',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/quotes/:id', (req, res) => {
  const quote = findQuoteById(req.params.id);
  if (!quote) {
    res.status(404).json({ error: 'Quote not found' });
    return;
  }

  res.json({
    quote,
    shareUrl: publicShareUrl(req, quote),
    pdfUrl: `${getBaseUrl(req)}/api/quotes/${encodeURIComponent(quote.id)}/pdf`,
  });
});

app.post('/api/quotes/:id/share', (req, res) => {
  const quote = findQuoteById(req.params.id);
  if (!quote) {
    res.status(404).json({ error: 'Quote not found' });
    return;
  }

  if (req.body?.forceNewToken) {
    quote.shareToken = randomToken(slugify(quote.quoteNumber));
    quote.updatedAt = new Date().toISOString();
  }

  res.json({
    shareToken: quote.shareToken,
    shareUrl: publicShareUrl(req, quote),
    quote,
  });
});

app.get('/share/:token', (req, res) => {
  const quote = findQuoteByToken(req.params.token);
  if (!quote) {
    res.status(404).send('<h1>Quote not found</h1>');
    return;
  }

  res.type('html').send(renderSharePage(quote, req));
});

app.get('/api/quotes/:id/pdf', (req, res) => {
  const quote = findQuoteById(req.params.id);
  if (!quote) {
    res.status(404).json({ error: 'Quote not found' });
    return;
  }

  const pdf = buildPdfBuffer(quote);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${slugify(quote.quoteNumber)}.pdf"`);
  res.setHeader('Content-Length', String(pdf.length));
  res.send(pdf);
});

app.get('/', (req, res) => {
  res.type('html').send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Quote Backend</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 32px; background: #f8fbff; color: #0f172a; }
    a { color: #1d4ed8; }
    code { background: #eaf1ff; padding: 2px 6px; border-radius: 6px; }
    .card { max-width: 760px; background: white; border: 1px solid #dbe6f5; border-radius: 18px; padding: 24px; box-shadow: 0 12px 32px rgba(15,23,42,.06); }
  </style>
</head>
<body>
  <div class="card">
    <h1>Quote backend is running</h1>
    <p>Use <code>/api/quotes</code> to list quotes, <code>/share/:token</code> for the share page, and <code>/api/quotes/:id/pdf</code> for the PDF download.</p>
    <p>Open the seeded demo quote here: <a href="/share/${encodeURIComponent(quotes[0]?.shareToken || '')}">/share/${escapeHtml(quotes[0]?.shareToken || '')}</a></p>
  </div>
</body>
</html>`);
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Quote backend running on ${PUBLIC_BASE_URL}`);
    console.log(`Seeded quotes: ${quotes.length}`);
  });
}

export default app;
