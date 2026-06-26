import express from 'express';
import { createHash, pbkdf2Sync, randomBytes, randomInt, randomUUID, timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync, inflateSync } from 'node:zlib';
import { MongoClient } from 'mongodb';
import { Resend } from 'resend';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const STORE_FILE = path.join(DATA_DIR, 'quotes.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function loadLocalEnv() {
  const envPath = path.join(__dirname, '.env');

  try {
    const content = readFileSync(envPath, 'utf8');
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      const separatorIndex = line.indexOf('=');
      if (separatorIndex === -1) continue;

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, '');
      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch {
    // Local .env is optional; deployed environments usually provide process.env directly.
  }
}

loadLocalEnv();

function cleanEnvValue(value = '') {
  return String(value).trim().replace(/^["']|["']$/g, '');
}

function getMongoUriFromEnv() {
  const rawValue = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGO_URL || '';
  let value = cleanEnvValue(rawValue);

  // This recovers from accidentally pasting "MONGODB_URI=mongodb+srv://..." into the Render value box.
  if (/^MONGODB_URI\s*=/.test(value)) {
    value = cleanEnvValue(value.replace(/^MONGODB_URI\s*=/, ''));
  }

  return value;
}

const PORT = Number(process.env.PORT || 3001);
const RAW_MONGODB_URI = getMongoUriFromEnv();
const hasValidMongoScheme = /^mongodb(?:\+srv)?:\/\//.test(RAW_MONGODB_URI);
const MONGODB_URI = hasValidMongoScheme ? RAW_MONGODB_URI : 'mongodb://127.0.0.1:27017';
const mongoConfigSource = hasValidMongoScheme ? 'env' : RAW_MONGODB_URI ? 'invalid-env' : 'default-localhost';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'ilovequote';
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`;
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || PUBLIC_BASE_URL;
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const OTP_TTL_MS = 10 * 60 * 1000;
const VERIFICATION_TTL_MS = 15 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;

const app = express();
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;
const mongoClient = new MongoClient(MONGODB_URI);
let mongoDb = null;
let usersCollection = null;
let quotesCollection = null;
let mongoReady = false;
let mongoDisabled = false;
let mongoLastError = mongoConfigSource === 'invalid-env'
  ? 'Invalid MONGODB_URI scheme. It must start with mongodb:// or mongodb+srv://.'
  : '';
let quotes = [];
let users = [];
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
  companyName: '',
  tagline: '',
  email: '',
  phone: '',
  website: '',
  logo: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  country: '',
  taxType: 'GSTIN',
  taxId: '',
  socialLinks: [],
  businessSlug: '',
};

const DEMO_CLIENT = {
  name: '',
  email: '',
  phone: '',
  address: '',
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

function normalizePhone(value) {
  return String(value || '').trim().replace(/[^\d+]/g, '');
}

function normalizeLoginIdentifier(value) {
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

function hashResetToken(token) {
  return createHash('sha256').update(String(token)).digest('hex');
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

async function sendPasswordResetEmail({ email, resetToken }) {
  if (!resend) {
    return { provider: 'dev', skipped: true };
  }

  const resetUrl = `${FRONTEND_BASE_URL.replace(/\/$/, '')}/#/login?mode=login&resetToken=${encodeURIComponent(resetToken)}`;
  const { data, error } = await resend.emails.send({
    from: RESEND_FROM_EMAIL,
    to: [email],
    subject: 'Reset your ilovequote password',
    html: `
      <div style="font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.6;color:#0f172a">
        <h2 style="margin:0 0 12px;color:#1d4ed8">Reset your password</h2>
        <p style="margin:0 0 16px">Click the button below to choose a new password for your account.</p>
        <p style="margin:0 0 20px">
          <a href="${resetUrl}" style="display:inline-block;padding:12px 18px;border-radius:12px;background:#2563eb;color:#fff;text-decoration:none;font-weight:700">Reset password</a>
        </p>
        <p style="margin:0;color:#64748b">This link expires in 30 minutes. If you did not request it, you can safely ignore this email.</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(error.message || 'Resend failed to send password reset email');
  }

  return { provider: 'resend', id: data?.id || null, resetUrl };
}

async function ensureMongo() {
  if (mongoDisabled) {
    return false;
  }

  if (mongoReady && mongoDb && usersCollection && quotesCollection) {
    return true;
  }

  try {
    if (!mongoDb) {
      await mongoClient.connect();
    }

    mongoDb = mongoClient.db(MONGODB_DB_NAME);
    usersCollection = mongoDb.collection('users');
    quotesCollection = mongoDb.collection('quotes');
    await Promise.all([
      usersCollection.createIndex({ email: 1 }, { unique: true }),
      quotesCollection.createIndex({ ownerUserId: 1 }),
      quotesCollection.createIndex({ shareToken: 1 }, { unique: true }),
      quotesCollection.createIndex({ quoteNumber: 1 }),
    ]);
    mongoReady = true;
    return true;
  } catch (error) {
    mongoLastError = error?.message || String(error);
    console.log('Mongo unavailable, using local JSON storage fallback:', mongoLastError);
    mongoReady = false;
    mongoDisabled = true;
    mongoDb = null;
    usersCollection = null;
    quotesCollection = null;
    return false;
  }
}

function stripMongoId(doc) {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return rest;
}

async function readLegacyJsonArray(filePath, key) {
  try {
    const raw = await readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed) ? parsed : parsed?.[key];
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

async function writeLegacyJsonArray(filePath, key, items) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(filePath, JSON.stringify({ [key]: items }, null, 2), 'utf8');
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
    companyName: source.companyName || source.businessName || '',
    tagline: source.tagline || source.businessTagline || '',
    email: source.email || '',
    phone: source.phone || '',
    website: source.website || '',
    logo: source.logo || '',
    address: source.address || '',
    city: source.city || '',
    state: source.state || '',
    zipCode: source.zipCode || '',
    country: source.country || '',
    taxType: source.taxType || 'GSTIN',
    taxId: source.taxId || '',
    socialLinks: Array.isArray(source.socialLinks) ? source.socialLinks : [],
    businessSlug: slugify(source.businessSlug || source.companyName || source.businessName || 'business'),
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
    name: source.companyName || source.name || '',
    contactPerson: source.contactPerson || '',
    email: source.email || '',
    phone: source.phone || '',
    website: source.website || '',
    address: source.address || addressParts.join('\n') || '',
    logo: source.logo || source.clientLogo || '',
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

function buildQuoteFromPayload(payload = {}, ownerUserId = null) {
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
    clientLogo: payload.clientLogo || clientDetails.logo || '',
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
    ownerUserId,
  };
}

async function loadQuotes() {
  const canUseMongo = await ensureMongo();
  if (canUseMongo) {
    const storedQuotes = await quotesCollection.find({}).sort({ createdAt: -1 }).toArray();
    if (storedQuotes.length > 0) {
      quotes = storedQuotes.map(stripMongoId);
      return quotes;
    }

    const legacyQuotes = await readLegacyJsonArray(STORE_FILE, 'quotes');
    if (legacyQuotes.length > 0) {
      quotes = legacyQuotes;
      await quotesCollection.insertMany(legacyQuotes);
      return quotes;
    }
  }

  quotes = await readLegacyJsonArray(STORE_FILE, 'quotes');
  return quotes;
}

quotes = await loadQuotes();
const pendingOtps = new Map();
const verificationTokens = new Map();
const passwordResetTokens = new Map();
const authTokens = new Map();

async function loadUsers() {
  const canUseMongo = await ensureMongo();
  if (canUseMongo) {
    const storedUsers = await usersCollection.find({}).sort({ createdAt: 1 }).toArray();
    if (storedUsers.length > 0) {
      users = storedUsers.map(stripMongoId);
      return users;
    }

    const legacyUsers = await readLegacyJsonArray(USERS_FILE, 'users');
    if (legacyUsers.length > 0) {
      users = legacyUsers;
      await usersCollection.insertMany(legacyUsers);
      return users;
    }
  }

  users = await readLegacyJsonArray(USERS_FILE, 'users');
  return users;
}

await loadUsers();

async function refreshUsers() {
  return loadUsers();
}

async function persistQuotes() {
  const canUseMongo = await ensureMongo();
  if (canUseMongo) {
    await quotesCollection.deleteMany({});
    if (quotes.length > 0) {
      await quotesCollection.insertMany(quotes);
    }
    return;
  }

  await writeLegacyJsonArray(STORE_FILE, 'quotes', quotes);
}

async function persistUsers() {
  const canUseMongo = await ensureMongo();
  if (canUseMongo) {
    await usersCollection.deleteMany({});
    if (users.length > 0) {
      await usersCollection.insertMany(users);
    }
    return;
  }

  await writeLegacyJsonArray(USERS_FILE, 'users', users);
}

function makePublicUser(user) {
  const username = user.username || user.phone || user.email || user.name || '';
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone || '',
    username,
    authMethod: user.authMethod || (user.phone ? 'phone' : 'email'),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    loginActivity: Array.isArray(user.loginActivity) ? user.loginActivity.slice(0, 10) : [],
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

function recordUserActivity(userId, type, req, details = {}) {
  const user = users.find((entry) => entry.id === userId);
  if (!user) return;

  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '');
  const userAgent = String(req.headers['user-agent'] || '');
  const nextActivity = Array.isArray(user.loginActivity) ? user.loginActivity.slice() : [];
  nextActivity.unshift({
    id: randomUUID(),
    type,
    at: new Date().toISOString(),
    ip,
    userAgent,
    details,
  });
  user.loginActivity = nextActivity.slice(0, 10);
  user.updatedAt = new Date().toISOString();
}

function revokeAuthTokensForUser(userId) {
  for (const [token, session] of authTokens.entries()) {
    if (session.userId === userId) {
      authTokens.delete(token);
    }
  }
}

function publicShareUrl(req, quote) {
  return `${getBaseUrl(req)}/share/${quote.shareToken}`;
}

function findQuoteById(id, ownerUserId = null) {
  return quotes.find((quote) => {
    const matchesId = quote.id === id || quote.shareToken === id || quote.quoteNumber === id;
    const matchesOwner = !quote.ownerUserId || !ownerUserId || quote.ownerUserId === ownerUserId;
    return matchesId && matchesOwner;
  });
}

function findOwnedQuoteById(id, ownerUserId) {
  if (!ownerUserId) return null;
  return quotes.find((quote) => {
    const matchesId = quote.id === id || quote.shareToken === id || quote.quoteNumber === id;
    return matchesId && quote.ownerUserId === ownerUserId;
  }) || null;
}

function findQuoteByToken(token) {
  return quotes.find((quote) => quote.shareToken === token || quote.id === token || quote.quoteNumber === token);
}

function quoteSummary(quote, req) {
  return {
    id: quote.id,
    shareToken: quote.shareToken,
    shareUrl: publicShareUrl(req, quote),
    pdfUrl: `${FRONTEND_BASE_URL.replace(/\/$/, '')}/#/quote-export/${encodeURIComponent(quote.id)}?download=1`,
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

function fitPdfText(text, maxChars) {
  const value = String(text ?? '').trim();
  if (!maxChars || value.length <= maxChars) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`;
}

function pdfTextFit(x, y, size, text, color = '0 0 0', maxChars = 0) {
  return pdfText(x, y, size, fitPdfText(text, maxChars), color);
}

function estimatePdfTextWidth(text, size) {
  return String(text ?? '').length * size * 0.52;
}

function pdfTextRight(xRight, y, size, text, color = '0 0 0', maxChars = 0) {
  const fitted = fitPdfText(text, maxChars);
  const x = Math.max(0, xRight - estimatePdfTextWidth(fitted, size));
  return pdfText(x, y, size, fitted, color);
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

function parsePdfDataUrl(dataUrl) {
  if (typeof dataUrl !== 'string') return null;
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/i);
  if (!match) return null;
  return {
    mimeType: match[1].toLowerCase(),
    buffer: Buffer.from(match[2], 'base64'),
  };
}

function getJpegDimensions(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
  while (offset < buffer.length) {
    while (offset < buffer.length && buffer[offset] !== 0xff) offset++;
    while (offset < buffer.length && buffer[offset] === 0xff) offset++;
    const marker = buffer[offset++];
    if (marker === 0xd9 || marker === 0xda) break;
    if (offset + 1 >= buffer.length) break;
    const length = buffer.readUInt16BE(offset);
    if (length < 2 || offset + length > buffer.length) break;
    if (
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf)
    ) {
      return {
        height: buffer.readUInt16BE(offset + 3),
        width: buffer.readUInt16BE(offset + 5),
      };
    }
    offset += length;
  }
  return null;
}

function decodePngToRgb(buffer) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buffer.length < 8 || !buffer.slice(0, 8).equals(signature)) return null;

  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idatParts = [];

  let offset = 8;
  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd > buffer.length) break;

    const chunk = buffer.slice(dataStart, dataEnd);
    if (type === 'IHDR') {
      width = chunk.readUInt32BE(0);
      height = chunk.readUInt32BE(4);
      bitDepth = chunk[8];
      colorType = chunk[9];
    } else if (type === 'IDAT') {
      idatParts.push(chunk);
    } else if (type === 'IEND') {
      break;
    }

    offset = dataEnd + 4;
  }

  if (!width || !height || bitDepth !== 8) return null;

  const channelsByColorType = {
    0: 1,
    2: 3,
    4: 2,
    6: 4,
  };
  const channels = channelsByColorType[colorType];
  if (!channels) return null;

  const inflated = inflateSync(Buffer.concat(idatParts));
  const rowLength = width * channels;
  const bpp = channels;
  const raw = Buffer.alloc(width * height * channels);
  let src = 0;
  let dst = 0;
  let previousRow = Buffer.alloc(rowLength);

  for (let y = 0; y < height; y++) {
    const filter = inflated[src++];
    const row = inflated.subarray(src, src + rowLength);
    src += rowLength;
    const recon = Buffer.alloc(rowLength);

    for (let x = 0; x < rowLength; x++) {
      const left = x >= bpp ? recon[x - bpp] : 0;
      const up = previousRow[x] || 0;
      const upLeft = x >= bpp ? previousRow[x - bpp] || 0 : 0;
      const current = row[x];

      let value = current;
      if (filter === 1) {
        value = (current + left) & 0xff;
      } else if (filter === 2) {
        value = (current + up) & 0xff;
      } else if (filter === 3) {
        value = (current + Math.floor((left + up) / 2)) & 0xff;
      } else if (filter === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        const predictor = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
        value = (current + predictor) & 0xff;
      }

      recon[x] = value;
    }

    recon.copy(raw, dst);
    previousRow = recon;
    dst += rowLength;
  }

  const rgb = Buffer.alloc(width * height * 3);
  if (channels === 1) {
    for (let i = 0, j = 0; i < raw.length; i++, j += 3) {
      const v = raw[i];
      rgb[j] = v;
      rgb[j + 1] = v;
      rgb[j + 2] = v;
    }
  } else if (channels === 2) {
    for (let i = 0, j = 0; i < raw.length; i += 2, j += 3) {
      const v = raw[i];
      rgb[j] = v;
      rgb[j + 1] = v;
      rgb[j + 2] = v;
    }
  } else if (channels === 3) {
    raw.copy(rgb);
  } else if (channels === 4) {
    for (let i = 0, j = 0; i < raw.length; i += 4, j += 3) {
      rgb[j] = raw[i];
      rgb[j + 1] = raw[i + 1];
      rgb[j + 2] = raw[i + 2];
    }
  }

  return { width, height, data: rgb };
}

function createPdfImageObject(sourceUrl, addObject, imageName) {
  const parsed = parsePdfDataUrl(sourceUrl);
  if (!parsed) return null;

  if (parsed.mimeType.includes('jpeg') || parsed.mimeType.includes('jpg')) {
    const dimensions = getJpegDimensions(parsed.buffer);
    if (!dimensions) return null;
    const header = Buffer.from(`<< /Type /XObject /Subtype /Image /Width ${dimensions.width} /Height ${dimensions.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${parsed.buffer.length} >>\nstream\n`, 'utf8');
    const footer = Buffer.from('\nendstream', 'utf8');
    const objectNumber = addObject(Buffer.concat([header, parsed.buffer, footer]));
    return {
      name: imageName,
      objectNumber,
      width: dimensions.width,
      height: dimensions.height,
    };
  }

  if (parsed.mimeType.includes('png')) {
    const image = decodePngToRgb(parsed.buffer);
    if (!image) return null;
    const compressed = deflateSync(image.data);
    const header = Buffer.from(`<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${compressed.length} >>\nstream\n`, 'utf8');
    const footer = Buffer.from('\nendstream', 'utf8');
    const objectNumber = addObject(Buffer.concat([header, compressed, footer]));
    return {
      name: imageName,
      objectNumber,
      width: image.width,
      height: image.height,
    };
  }

  return null;
}

function buildPdfBuffer(quote) {
  const width = 595.28;
  const height = 841.89;
  const margin = 34;

  const objects = [];
  const addObject = (body) => {
    objects.push(body);
    return objects.length;
  };
  const lines = [];
  const push = (chunk) => lines.push(chunk);
  const imageResources = [];
  const addImage = (sourceUrl, imageName, x, y, w, h) => {
    const image = createPdfImageObject(sourceUrl, addObject, imageName);
    if (!image) return;
    imageResources.push(image);
    push(`q\n${w} 0 0 ${h} ${x} ${y} cm\n/${imageName} Do\nQ`);
  };

  // Header band.
  push(pdfRect(0, height - 115, width, 115, '0.05 0.11 0.27', '0.05 0.11 0.27', 1));
  if (quote.businessDetails.logo) {
    push(pdfRect(width - 108, height - 102, 66, 66, '1 1 1', '1 1 1', 0.8));
    addImage(quote.businessDetails.logo, 'Im1', width - 102, height - 96, 54, 54);
  }
  push(pdfText(46, height - 52, 24, quote.businessDetails.companyName, '1 1 1'));
  push(pdfText(46, height - 78, 11, quote.businessDetails.tagline || '', '0.84 0.9 1'));

  let y = height - 145;
  push(pdfText(margin, y, 18, 'Price Quote', '0.05 0.29 0.87'));
  push(pdfTextRight(width - margin, y, 14, quote.quoteNumber, '0.05 0.29 0.87', 18));
  y -= 18;
  push(pdfTextRight(width - margin, y, 10, `Date: ${quote.date}`, '0.26 0.31 0.4', 22));
  y -= 14;
  push(pdfTextRight(width - margin, y, 10, `Valid Until: ${quote.expiryDate}`, '0.26 0.31 0.4', 28));

  y -= 28;
  push(pdfText(margin, y, 11, 'Prepared For', '0.26 0.31 0.4'));
  y -= 22;
  if (quote.clientLogo) {
    push(pdfRect(margin, y - 54, 54, 54, '1 1 1', '0.84 0.87 0.92', 0.6));
    addImage(quote.clientLogo, 'Im2', margin + 4, y - 50, 46, 46);
    y -= 60;
  }
  push(pdfTextFit(margin, y, 16, quote.clientDetails.name, '0.08 0.12 0.22', 30));
  y -= 18;
  push(pdfTextFit(margin, y, 10, quote.clientDetails.contactPerson || '', '0.18 0.21 0.29', 40));
  y -= 16;
  push(pdfTextFit(margin, y, 10, quote.clientDetails.email || '', '0.18 0.21 0.29', 42));
  y -= 16;
  push(pdfTextFit(margin, y, 10, quote.clientDetails.phone || '', '0.18 0.21 0.29', 24));
  y -= 16;
  push(pdfTextFit(margin, y, 10, quote.clientDetails.address || '', '0.18 0.21 0.29', 48));

  y -= 28;
  push(pdfLine(margin, y, width - margin, y));
  y -= 20;
  push(pdfTextFit(margin, y, 12, `Business: ${quote.businessDetails.companyName}`, '0.08 0.12 0.22', 46));
  y -= 16;
  push(pdfTextFit(margin, y, 10, `Email: ${quote.businessDetails.email}`, '0.18 0.21 0.29', 52));
  y -= 16;
  push(pdfTextFit(margin, y, 10, `Phone: ${quote.businessDetails.phone}`, '0.18 0.21 0.29', 30));
  y -= 16;
  push(pdfTextFit(margin, y, 10, `Website: ${quote.businessDetails.website}`, '0.18 0.21 0.29', 54));
  y -= 24;
  push(pdfTextFit(margin, y, 10, `Tax ID: ${quote.businessDetails.taxType} ${quote.businessDetails.taxId || ''}`, '0.18 0.21 0.29', 48));

  y -= 34;
  const tableTop = y;
  const col = { num: 26, desc: 162, qty: 34, rate: 74, tax: 64, amount: 117 };
  const tableX = margin;
  const tableW = width - margin * 2;
  const headerH = 24;
  const rowH = 48;

  push(pdfRect(tableX, tableTop - headerH, tableW, headerH, '0.11 0.29 0.88', '0.11 0.29 0.88', 0.8));
  push(pdfText(tableX + 8, tableTop - 16, 8.5, '#', '1 1 1'));
  push(pdfText(tableX + col.num + 8, tableTop - 16, 8.5, 'Item / Description', '1 1 1'));
  push(pdfText(tableX + col.num + col.desc + 8, tableTop - 16, 8.5, 'Qty', '1 1 1'));
  push(pdfText(tableX + col.num + col.desc + col.qty + 8, tableTop - 16, 8.5, 'Rate', '1 1 1'));
  push(pdfText(tableX + col.num + col.desc + col.qty + col.rate + 8, tableTop - 16, 8.5, 'Tax', '1 1 1'));
  push(pdfText(tableX + col.num + col.desc + col.qty + col.rate + col.tax + 8, tableTop - 16, 8.5, 'Amount', '1 1 1'));

  let rowY = tableTop - headerH;
  quote.items.forEach((item, index) => {
    const rowBottom = rowY - rowH;
    push(pdfRect(tableX, rowBottom, tableW, rowH, '1 1 1', '0.84 0.87 0.92', 0.5));
    push(pdfText(tableX + 8, rowY - 24, 9.5, String(index + 1), '0.12 0.16 0.24'));
    push(pdfTextFit(tableX + col.num + 8, rowY - 18, 8.5, item.description, '0.12 0.16 0.24', 28));
    push(pdfTextRight(tableX + col.num + col.desc + col.qty - 8, rowY - 24, 9.5, String(item.quantity), '0.12 0.16 0.24', 4));
    push(pdfTextRight(tableX + col.num + col.desc + col.qty + col.rate - 8, rowY - 24, 9.5, moneyLabel(item.unitPrice), '0.12 0.16 0.24', 11));
    push(pdfTextRight(tableX + col.num + col.desc + col.qty + col.rate + col.tax - 8, rowY - 18, 8.5, item.gstRate ? `${item.gstRate}% GST` : 'No Tax', '0.12 0.16 0.24', 10));
    push(pdfTextRight(tableX + tableW - 8, rowY - 24, 9.5, moneyLabel(item.total), '0.12 0.16 0.24', 11));
    if (item.discountAmount > 0) {
      push(pdfTextFit(tableX + col.num + 8, rowY - 34, 7.5, `Discount: ${item.discountType === 'Percentage' ? `${item.discountValue}%` : moneyLabel(item.discountValue)}`, '0.08 0.5 0.15', 30));
    }
    rowY = rowBottom;
  });

  const summaryTop = rowY - 20;
  push(pdfRect(tableX, summaryTop - 92, tableW, 92, '0.99 0.99 1', '0.84 0.87 0.92', 0.7));
  const summaryLeft = tableX + tableW - 190;
  push(pdfText(summaryLeft, summaryTop - 18, 9.5, 'Sub Total', '0.08 0.12 0.22'));
  push(pdfTextRight(tableX + tableW - 8, summaryTop - 18, 9.5, moneyLabel(quote.subtotal), '0.08 0.12 0.22', 12));
  push(pdfText(summaryLeft, summaryTop - 38, 9.5, 'Total Discount', '0.08 0.12 0.22'));
  push(pdfTextRight(tableX + tableW - 8, summaryTop - 38, 9.5, `- ${moneyLabel(quote.items.reduce((sum, item) => sum + (item.discountAmount || 0), 0))}`, '0.0 0.62 0.2', 12));
  push(pdfText(summaryLeft, summaryTop - 58, 9.5, quote.taxAmount > 0 ? 'Tax (18%)' : 'No Tax', '0.08 0.12 0.22'));
  push(pdfTextRight(tableX + tableW - 8, summaryTop - 58, 9.5, quote.taxAmount > 0 ? moneyLabel(quote.taxAmount) : '-', '0.08 0.12 0.22', 12));
  push(pdfLine(tableX, summaryTop - 66, tableX + tableW, summaryTop - 66, 0.6, '0.82 0.86 0.92'));
  push(pdfText(tableX + 190, summaryTop - 84, 11, 'Total', '0.08 0.12 0.22'));
  push(pdfTextRight(tableX + tableW - 8, summaryTop - 84, 13, moneyLabel(quote.totalAmount), '0.05 0.29 0.88', 14));

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

  const fontObj = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const contentObj = addObject(`<< /Length ${Buffer.byteLength(contentStream, 'utf8')} >>\nstream\n${contentStream}\nendstream`);
  const xObjectEntries = imageResources.length > 0
    ? ` /XObject << ${imageResources.map((image) => `/${image.name} ${image.objectNumber} 0 R`).join(' ')} >>`
    : '';
  const pageObj = addObject(`<< /Type /Page /Parent 4 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 ${fontObj} 0 R >>${xObjectEntries} >> /Contents ${contentObj} 0 R >>`);
  const pagesObj = addObject(`<< /Type /Pages /Kids [${pageObj} 0 R] /Count 1 >>`);
  const catalogObj = addObject(`<< /Type /Catalog /Pages ${pagesObj} 0 R >>`);

  const header = '%PDF-1.4\n';
  const chunks = [Buffer.from(header, 'utf8')];
  const offsets = [0];
  let offset = Buffer.byteLength(header, 'utf8');

  objects.forEach((body, index) => {
    const objectNumber = index + 1;
    const bodyBuffer = Buffer.isBuffer(body) ? body : Buffer.from(body, 'utf8');
    const serialized = Buffer.concat([
      Buffer.from(`${objectNumber} 0 obj\n`, 'utf8'),
      bodyBuffer,
      Buffer.from('\nendobj\n', 'utf8'),
    ]);
    offsets.push(offset);
    const buf = serialized;
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
  const pdfUrl = `${FRONTEND_BASE_URL.replace(/\/$/, '')}/#/quote-export/${encodeURIComponent(quote.id)}?download=1`;
  const pdfDownloadUrl = pdfUrl;
  const whatsappText = encodeURIComponent(`Hello! Here is your quotation from ${quote.businessDetails.companyName || 'our team'}. Quote Number: ${quote.quoteNumber}. Open it here: ${shareUrl}`);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${whatsappText}`;
  const businessLogoHtml = quote.businessDetails?.logo
    ? `<img src="${escapeHtml(quote.businessDetails.logo)}" alt="${escapeHtml(quote.businessDetails.companyName)} logo" class="logo" />`
    : `<div class="logo-fallback">${escapeHtml((quote.businessDetails?.companyName || 'B').slice(0, 1).toUpperCase())}</div>`;
  const clientLogoHtml = quote.clientLogo
    ? `<img src="${escapeHtml(quote.clientLogo)}" alt="${escapeHtml(quote.clientDetails?.name || 'Client')} logo" class="client-logo" />`
    : `<div class="client-fallback">${escapeHtml((quote.clientDetails?.name || 'C').slice(0, 1).toUpperCase())}</div>`;
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
    .brand-head {
      display: flex;
      align-items: center;
      gap: 14px;
      position: relative;
      z-index: 1;
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
    .logo,
    .logo-fallback,
    .client-logo,
    .client-fallback {
      display: block;
      object-fit: contain;
      background: white;
      box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
    }
    .logo,
    .logo-fallback {
      width: 72px;
      height: 72px;
      padding: 8px;
      border-radius: 18px;
    }
    .logo-fallback,
    .client-fallback {
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--brand);
      font-weight: 900;
    }
    .client-logo,
    .client-fallback {
      width: 88px;
      height: 88px;
      padding: 10px;
      border-radius: 20px;
      border: 1px solid rgba(148,163,184,0.18);
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
        <div class="brand-head">
          ${businessLogoHtml}
          <div>
            <h1>${escapeHtml(quote.businessDetails.companyName)}</h1>
            <p>${escapeHtml(quote.businessDetails.tagline || '')}</p>
          </div>
        </div>
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
          <a class="btn primary" href="${escapeHtml(pdfUrl)}">Open PDF</a>
          <a class="btn ghost" href="${escapeHtml(pdfDownloadUrl)}">Download PDF</a>
          <a class="btn ghost" href="${escapeHtml(whatsappUrl)}" target="_blank" rel="noopener noreferrer">WhatsApp</a>
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
          <div style="margin:14px 0 16px;">${clientLogoHtml}</div>
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

app.get('/api/health', async (_req, res) => {
  const canUseMongo = await ensureMongo();
  res.json({
    ok: true,
    service: 'quote-backend',
    storage: canUseMongo ? 'mongodb' : 'local-json',
    mongoReady: canUseMongo,
    mongoConfigSource,
    mongoError: canUseMongo ? null : mongoLastError || null,
    emailProvider: resend ? 'resend' : 'dev',
    quotes: quotes.length,
  });
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
    await refreshUsers();
    const email = normalizeEmail(req.body?.email);
    const phone = normalizePhone(req.body?.phone);
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
          phone: phone || existing.phone || '',
          username: existing.username || (existing.phone || phone || email),
          authMethod: existing.authMethod || (existing.phone || phone ? 'phone' : 'email'),
          passwordHash: passwordState.hash,
          passwordSalt: passwordState.salt,
          updatedAt: new Date().toISOString(),
          emailVerifiedAt: new Date().toISOString(),
        }
      : {
          id: randomUUID(),
          email,
          name: name || email.split('@')[0],
          phone: phone || '',
          username: phone || email,
          authMethod: phone ? 'phone' : 'email',
          passwordHash: passwordState.hash,
          passwordSalt: passwordState.salt,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          emailVerifiedAt: new Date().toISOString(),
          loginActivity: [],
        };

    users = existing ? users.map((entry) => (entry.email === email ? user : entry)) : [user, ...users];
    recordUserActivity(user.id, 'register', req, { via: user.authMethod });
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

app.post('/api/auth/request-password-reset', async (req, res) => {
  try {
    await refreshUsers();
    const email = normalizeEmail(req.body?.email);

    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }

    const user = users.find((entry) => entry.email === email);
    if (!user) {
      res.json({
        ok: true,
        message: 'If an account exists for that email, we sent a password reset link.',
      });
      return;
    }

    const resetToken = randomBytes(24).toString('hex');
    const resetTokenHash = hashResetToken(resetToken);
    const resetExpiresAt = Date.now() + PASSWORD_RESET_TTL_MS;
    passwordResetTokens.set(resetToken, {
      email,
      userId: user.id,
      expiresAt: resetExpiresAt,
    });
    user.passwordResetTokenHash = resetTokenHash;
    user.passwordResetExpiresAt = resetExpiresAt;
    user.updatedAt = new Date().toISOString();
    await persistUsers();

    const delivery = await sendPasswordResetEmail({ email, resetToken });
    console.log(`[auth] password reset link for ${email} via ${delivery.provider}`);

    res.json({
      ok: true,
      message: 'If an account exists for that email, we sent a password reset link.',
      devResetToken: resend ? undefined : resetToken,
      emailProvider: delivery.provider,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Unable to create password reset request',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/api/auth/confirm-password-reset', async (req, res) => {
  try {
    await refreshUsers();
    const resetToken = String(req.body?.resetToken || '').trim();
    const password = String(req.body?.password || '');
    let tokenState = passwordResetTokens.get(resetToken);
    let user = null;

    if (!tokenState) {
      const resetTokenHash = hashResetToken(resetToken);
      user = users.find((entry) => entry.passwordResetTokenHash === resetTokenHash);
      if (user) {
        tokenState = {
          email: user.email,
          userId: user.id,
          expiresAt: Number(user.passwordResetExpiresAt || 0),
        };
      }
    }

    if (!tokenState || tokenState.expiresAt < Date.now()) {
      passwordResetTokens.delete(resetToken);
      if (user) {
        delete user.passwordResetTokenHash;
        delete user.passwordResetExpiresAt;
        user.updatedAt = new Date().toISOString();
        await persistUsers();
      }
      res.status(400).json({ error: 'Reset link expired. Please request a new password reset email.' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }

    user = user || users.find((entry) => entry.id === tokenState.userId && entry.email === tokenState.email);
    if (!user) {
      passwordResetTokens.delete(resetToken);
      res.status(404).json({ error: 'Account not found for this reset link.' });
      return;
    }

    const passwordState = hashPassword(password);
    user.passwordHash = passwordState.hash;
    user.passwordSalt = passwordState.salt;
    delete user.passwordResetTokenHash;
    delete user.passwordResetExpiresAt;
    user.updatedAt = new Date().toISOString();

    passwordResetTokens.delete(resetToken);
    revokeAuthTokensForUser(user.id);
    recordUserActivity(user.id, 'password_reset', req, { via: 'email' });
    await persistUsers();

    const authToken = createAuthToken(user.id);
    res.json({
      ok: true,
      user: makePublicUser(user),
      authToken,
      message: 'Password reset successfully.',
    });
  } catch (error) {
    res.status(500).json({
      error: 'Unable to reset password',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    await refreshUsers();
    const rawIdentifier = String(req.body?.identifier || req.body?.email || req.body?.phone || '').trim();
    const identifier = normalizeEmail(rawIdentifier);
    const password = String(req.body?.password || '');
    const phoneCandidate = normalizePhone(req.body?.phone || rawIdentifier);
    const loginCandidate = normalizeLoginIdentifier(rawIdentifier);
    const user = users.find((entry) => {
      const entryEmail = normalizeEmail(entry.email);
      const entryPhone = normalizePhone(entry.phone || '');
      const entryUsername = normalizeLoginIdentifier(entry.username || '');
      return (
        (identifier && entryEmail === identifier) ||
        (phoneCandidate && entryPhone === phoneCandidate) ||
        (loginCandidate && (entryUsername === loginCandidate || entryEmail === loginCandidate || normalizeLoginIdentifier(entryPhone) === loginCandidate))
      );
    });

    if (!user) {
      res.status(404).json({ error: 'No account found for that email address or phone number.' });
      return;
    }

    if (!user.passwordHash || !user.passwordSalt || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
      res.status(401).json({ error: 'Incorrect password.' });
      return;
    }

    recordUserActivity(user.id, 'login', req, { via: user.authMethod || (user.phone ? 'phone' : 'email') });
    await persistUsers();
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

app.get('/api/auth/me', async (req, res) => {
  await refreshUsers();
  const user = getAuthenticatedUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not signed in.' });
    return;
  }

  res.json({ ok: true, user: makePublicUser(user) });
});

app.get('/api/account/activity', async (req, res) => {
  await refreshUsers();
  const user = getAuthenticatedUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not signed in.' });
    return;
  }

  res.json({
    ok: true,
    items: Array.isArray(user.loginActivity) ? user.loginActivity : [],
  });
});

app.patch('/api/account/profile', async (req, res) => {
  try {
    await refreshUsers();
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Not signed in.' });
      return;
    }

    if (typeof req.body?.name === 'string' && req.body.name.trim()) {
      user.name = req.body.name.trim();
    }

    if (typeof req.body?.phone === 'string') {
      user.phone = normalizePhone(req.body.phone);
    }

    if (!user.username) {
      user.username = user.phone || user.email;
    }

    user.updatedAt = new Date().toISOString();
    recordUserActivity(user.id, 'profile_update', req, { fields: Object.keys(req.body || {}) });
    await persistUsers();

    res.json({ ok: true, user: makePublicUser(user) });
  } catch (error) {
    res.status(400).json({
      error: 'Unable to update profile',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/api/account/change-password', async (req, res) => {
  try {
    await refreshUsers();
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Not signed in.' });
      return;
    }

    const currentPassword = String(req.body?.currentPassword || '');
    const newPassword = String(req.body?.newPassword || '');
    if (!user.passwordHash || !user.passwordSalt || !verifyPassword(currentPassword, user.passwordSalt, user.passwordHash)) {
      res.status(400).json({ error: 'Current password is incorrect.' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters long.' });
      return;
    }

    const passwordState = hashPassword(newPassword);
    user.passwordHash = passwordState.hash;
    user.passwordSalt = passwordState.salt;
    user.updatedAt = new Date().toISOString();
    recordUserActivity(user.id, 'password_change', req, {});
    await persistUsers();

    res.json({ ok: true, message: 'Password changed successfully.' });
  } catch (error) {
    res.status(400).json({
      error: 'Unable to change password',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/account/export', async (req, res) => {
  await refreshUsers();
  const user = getAuthenticatedUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not signed in.' });
    return;
  }

  const ownedQuotes = quotes.filter((quote) => quote.ownerUserId === user.id);
  recordUserActivity(user.id, 'export_data', req, { quoteCount: ownedQuotes.length });
  await persistUsers();

  const payload = {
    user: makePublicUser(user),
    quotes: ownedQuotes,
    exportedAt: new Date().toISOString(),
  };
  const filename = `ilovequote-account-data-${slugify(user.username || user.email || user.id)}.json`;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(JSON.stringify(payload, null, 2));
});

app.delete('/api/account', async (req, res) => {
  try {
    await refreshUsers();
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Not signed in.' });
      return;
    }

    const userId = user.id;
    users = users.filter((entry) => entry.id !== userId);
    quotes = quotes.filter((quote) => quote.ownerUserId !== userId);
    revokeAuthTokensForUser(userId);
    await Promise.all([persistUsers(), persistQuotes()]);
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({
      error: 'Unable to delete account',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/quotes', (req, res) => {
  const user = getAuthenticatedUser(req);
  const visibleQuotes = user
    ? quotes.filter((quote) => quote.ownerUserId === user.id)
    : [];
  res.json({
    items: visibleQuotes,
  });
});

app.post('/api/quotes', async (req, res) => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Please log in or sign up to save quotes.' });
      return;
    }

    const quote = buildQuoteFromPayload(req.body || {}, user?.id || null);
    const existingIndex = quotes.findIndex((entry) => {
      if (entry.ownerUserId === user.id && (entry.id === quote.id || entry.shareToken === quote.shareToken)) {
        return true;
      }

      if (quote.status === 'Draft' && user?.id && entry.ownerUserId === user.id && entry.quoteNumber === quote.quoteNumber) {
        return true;
      }

      return false;
    });

    let storedQuote = quote;
    if (existingIndex >= 0) {
      const existing = quotes[existingIndex];
      quote.id = existing.id;
      quote.shareToken = existing.shareToken;
      quote.createdAt = existing.createdAt || quote.createdAt;
      quote.updatedAt = new Date().toISOString();
      storedQuote = quotes[existingIndex] = {
        ...existing,
        ...quote,
        ownerUserId: existing.ownerUserId || quote.ownerUserId || user?.id || null,
      };
    } else {
      storedQuote = quote;
      quotes = [
        quote,
        ...quotes.filter((entry) => entry.id !== quote.id && entry.shareToken !== quote.shareToken),
      ];
    }
    await persistQuotes();
    res.status(201).json({
      quote: storedQuote,
      shareUrl: publicShareUrl(req, storedQuote),
      pdfUrl: `${FRONTEND_BASE_URL.replace(/\/$/, '')}/#/quote-export/${encodeURIComponent(storedQuote.id)}?download=1`,
    });
  } catch (error) {
    res.status(400).json({
      error: 'Unable to create quote',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/api/quotes/preview-pdf', async (req, res) => {
  try {
    const quote = buildQuoteFromPayload(req.body || {}, null);
    quote.status = quote.status || 'Draft';
    quotes = [
      quote,
      ...quotes.filter((entry) => entry.id !== quote.id && entry.shareToken !== quote.shareToken),
    ];
    await persistQuotes();

    const pdfUrl = `${FRONTEND_BASE_URL.replace(/\/$/, '')}/#/quote-export/${encodeURIComponent(quote.id)}?download=1`;
    res.status(201).json({
      ok: true,
      quote,
      pdfUrl,
      downloadUrl: pdfUrl,
    });
  } catch (error) {
    res.status(400).json({
      error: 'Unable to prepare preview PDF',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.patch('/api/quotes/:id', async (req, res) => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Please log in or sign up to save quotes.' });
      return;
    }

    const quote = findOwnedQuoteById(req.params.id, user.id);
    if (!quote) {
      res.status(404).json({ error: 'Quote not found' });
      return;
    }

    if (typeof req.body?.quoteNumber === 'string' && req.body.quoteNumber.trim()) {
      quote.quoteNumber = req.body.quoteNumber.trim();
    }

    if (typeof req.body?.status === 'string') {
      quote.status = req.body.status;
    }

    if (req.body?.businessDetails) {
      quote.businessDetails = { ...quote.businessDetails, ...req.body.businessDetails };
    }

    if (req.body?.clientDetails) {
      quote.clientDetails = { ...quote.clientDetails, ...req.body.clientDetails };
    }

    if (Array.isArray(req.body?.items)) {
      quote.items = req.body.items;
    }

    if (typeof req.body?.terms === 'string') {
      quote.terms = req.body.terms;
    }

    if (typeof req.body?.date === 'string') {
      quote.date = req.body.date;
    }

    if (typeof req.body?.expiryDate === 'string') {
      quote.expiryDate = req.body.expiryDate;
    }

    if (typeof req.body?.taxRate === 'number') {
      quote.taxRate = req.body.taxRate;
    }

    quote.updatedAt = new Date().toISOString();
    await persistQuotes();
    res.json({ ok: true, quote });
  } catch (error) {
    res.status(400).json({
      error: 'Unable to update quote',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/quotes/:id', (req, res) => {
  const user = getAuthenticatedUser(req);
  const quote = findOwnedQuoteById(req.params.id, user?.id || null);
  if (!quote) {
    res.status(404).json({ error: 'Quote not found' });
    return;
  }

  res.json({
    quote,
    shareUrl: publicShareUrl(req, quote),
    pdfUrl: `${FRONTEND_BASE_URL.replace(/\/$/, '')}/#/quote-export/${encodeURIComponent(quote.id)}?download=1`,
  });
});

app.delete('/api/quotes/:id', async (req, res) => {
  const user = getAuthenticatedUser(req);
  const quote = findOwnedQuoteById(req.params.id, user?.id || null);
  if (!quote) {
    res.status(404).json({ error: 'Quote not found' });
    return;
  }

  quotes = quotes.filter((entry) => entry.id !== quote.id);
  await persistQuotes();
  res.json({ ok: true });
});

app.post('/api/quotes/:id/share', (req, res) => {
  const user = getAuthenticatedUser(req);
  const quote = findOwnedQuoteById(req.params.id, user?.id || null);
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
  const user = getAuthenticatedUser(req);
  const quote = findOwnedQuoteById(req.params.id, user?.id || null);
  if (!quote) {
    res.status(404).json({ error: 'Quote not found' });
    return;
  }

  const frontendPdfUrl = `${FRONTEND_BASE_URL.replace(/\/$/, '')}/#/quote-export/${encodeURIComponent(quote.id)}?download=1`;
  res.redirect(302, frontendPdfUrl);
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
    <p>No saved quote is loaded yet. Create a quote to generate a share link.</p>
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
