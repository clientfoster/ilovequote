import { BusinessFormValues, ClientFormValues, ItemQuoteItem, ItemQuotationMeta } from './types';
import { TermItem } from './modules/items-module/components/TermsAndConditions';
import { createQuote, StoredQuote } from './quoteApi';
import { AuthUser, getScopedStorageKey, getUserScope } from './auth';
import {
  BUSINESS_DRAFT_KEY as BUSINESS_DRAFT_KEY_BASE,
  CLIENT_DRAFT_KEY as CLIENT_DRAFT_KEY_BASE,
  CLIENT_LOGO_KEY as CLIENT_LOGO_KEY_BASE,
  EDITING_QUOTE_ID_KEY as EDITING_QUOTE_ID_KEY_BASE,
  ITEMS_DRAFT_KEY as ITEMS_DRAFT_KEY_BASE,
  ITEMS_META_KEY as ITEMS_META_KEY_BASE,
  SETTINGS_STORAGE_KEY as SETTINGS_STORAGE_KEY_BASE,
} from './wizard/WizardState';

export const PENDING_QUOTE_SAVE_KEY = 'ilovequote_pending_quote_save';
export const TERMS_STORAGE_KEY_BASE = 'ilovequote_draft_terms_list';
export const FLASH_TOAST_KEY = 'ilovequote_flash_toast';

export interface PendingDraftState {
  businessData: BusinessFormValues;
  clientData: ClientFormValues;
  itemsData: ItemQuoteItem[];
  quotationMeta: ItemQuotationMeta;
  termsList: TermItem[];
  logoUrl: string | null;
  taxRate: number;
  termsAndConditions: string;
  editingQuoteId: string | null;
  currentStep?: number;
}

export interface PendingQuoteSave {
  intent: 'draft' | 'final';
  payload: any;
  draftState?: PendingDraftState;
  returnUrl?: string;
  sourceUrl?: string;
  suggestedEmail?: string;
  suggestedName?: string;
  createdAt: number;
}

export function savePendingQuote(pending: PendingQuoteSave): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(pending);
    localStorage.setItem(PENDING_QUOTE_SAVE_KEY, serialized);
    sessionStorage.setItem(PENDING_QUOTE_SAVE_KEY, serialized);
  } catch (err) {
    console.error('Failed to save pending quote', err);
  }
}

export function getPendingQuote(): PendingQuoteSave | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PENDING_QUOTE_SAVE_KEY) || sessionStorage.getItem(PENDING_QUOTE_SAVE_KEY);
    return raw ? (JSON.parse(raw) as PendingQuoteSave) : null;
  } catch {
    return null;
  }
}

export function clearPendingQuote(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(PENDING_QUOTE_SAVE_KEY);
    sessionStorage.removeItem(PENDING_QUOTE_SAVE_KEY);
  } catch {
    // ignore
  }
}

export function clearGuestDrafts(): void {
  if (typeof window === 'undefined') return;
  const guestScope = 'guest';
  try {
    localStorage.removeItem(getScopedStorageKey(BUSINESS_DRAFT_KEY_BASE, guestScope));
    localStorage.removeItem(getScopedStorageKey(CLIENT_DRAFT_KEY_BASE, guestScope));
    localStorage.removeItem(getScopedStorageKey(ITEMS_DRAFT_KEY_BASE, guestScope));
    localStorage.removeItem(getScopedStorageKey(ITEMS_META_KEY_BASE, guestScope));
    localStorage.removeItem(getScopedStorageKey(TERMS_STORAGE_KEY_BASE, guestScope));
    localStorage.removeItem(getScopedStorageKey(CLIENT_LOGO_KEY_BASE, guestScope));
    localStorage.removeItem(getScopedStorageKey(EDITING_QUOTE_ID_KEY_BASE, guestScope));
    localStorage.removeItem(getScopedStorageKey(SETTINGS_STORAGE_KEY_BASE, guestScope));
  } catch {
    // ignore
  }
}

export function clearUserDrafts(user?: AuthUser | string | null): void {
  if (typeof window === 'undefined') return;
  const scope = getUserScope(user);
  try {
    localStorage.removeItem(getScopedStorageKey(BUSINESS_DRAFT_KEY_BASE, scope));
    localStorage.removeItem(getScopedStorageKey(CLIENT_DRAFT_KEY_BASE, scope));
    localStorage.removeItem(getScopedStorageKey(ITEMS_DRAFT_KEY_BASE, scope));
    localStorage.removeItem(getScopedStorageKey(ITEMS_META_KEY_BASE, scope));
    localStorage.removeItem(getScopedStorageKey(TERMS_STORAGE_KEY_BASE, scope));
    localStorage.removeItem(getScopedStorageKey(CLIENT_LOGO_KEY_BASE, scope));
    localStorage.removeItem(getScopedStorageKey(EDITING_QUOTE_ID_KEY_BASE, scope));
  } catch {
    // ignore
  }
}

export function migrateGuestDraftsToUser(user?: AuthUser | string | null, editingQuoteId?: string | null): void {
  if (typeof window === 'undefined') return;
  const guestScope = 'guest';
  const targetScope = getUserScope(user);
  if (!targetScope || targetScope === 'guest') return;

  const copyKey = (baseKey: string) => {
    const guestKey = getScopedStorageKey(baseKey, guestScope);
    const userKey = getScopedStorageKey(baseKey, targetScope);
    const val = localStorage.getItem(guestKey);
    if (val && !localStorage.getItem(userKey)) {
      localStorage.setItem(userKey, val);
    }
  };

  try {
    copyKey(BUSINESS_DRAFT_KEY_BASE);
    copyKey(CLIENT_DRAFT_KEY_BASE);
    copyKey(ITEMS_DRAFT_KEY_BASE);
    copyKey(ITEMS_META_KEY_BASE);
    copyKey(TERMS_STORAGE_KEY_BASE);
    copyKey(CLIENT_LOGO_KEY_BASE);

    const userEditingKey = getScopedStorageKey(EDITING_QUOTE_ID_KEY_BASE, targetScope);
    if (editingQuoteId) {
      localStorage.setItem(userEditingKey, editingQuoteId);
    } else {
      const guestEditing = localStorage.getItem(getScopedStorageKey(EDITING_QUOTE_ID_KEY_BASE, guestScope));
      if (guestEditing && !localStorage.getItem(userEditingKey)) {
        localStorage.setItem(userEditingKey, guestEditing);
      }
    }
  } catch (err) {
    console.error('Failed to migrate guest drafts to user', err);
  }
}

export function saveDraftStateToUser(
  state: PendingDraftState,
  user?: AuthUser | string | null,
  editingQuoteId?: string | null,
): void {
  if (typeof window === 'undefined') return;
  const targetScope = getUserScope(user);
  if (!targetScope || targetScope === 'guest') return;

  try {
    localStorage.setItem(
      getScopedStorageKey(BUSINESS_DRAFT_KEY_BASE, targetScope),
      JSON.stringify(state.businessData),
    );
    localStorage.setItem(
      getScopedStorageKey(CLIENT_DRAFT_KEY_BASE, targetScope),
      JSON.stringify(state.clientData),
    );
    localStorage.setItem(
      getScopedStorageKey(ITEMS_DRAFT_KEY_BASE, targetScope),
      JSON.stringify(state.itemsData),
    );
    localStorage.setItem(
      getScopedStorageKey(ITEMS_META_KEY_BASE, targetScope),
      JSON.stringify(state.quotationMeta),
    );
    localStorage.setItem(
      getScopedStorageKey(TERMS_STORAGE_KEY_BASE, targetScope),
      JSON.stringify(state.termsList),
    );

    if (state.logoUrl) {
      localStorage.setItem(getScopedStorageKey(CLIENT_LOGO_KEY_BASE, targetScope), state.logoUrl);
    }

    const effectiveEditingId = editingQuoteId || state.editingQuoteId;
    if (effectiveEditingId) {
      localStorage.setItem(
        getScopedStorageKey(EDITING_QUOTE_ID_KEY_BASE, targetScope),
        effectiveEditingId,
      );
    }
  } catch (err) {
    console.error('Failed to save draft state to user', err);
  }
}

export async function processPendingQuoteAfterAuth(user: AuthUser): Promise<{
  savedQuote?: StoredQuote;
  redirectUrl: string;
  message?: string;
}> {
  const pending = getPendingQuote();

  if (!pending) {
    // No explicit quote save was queued, but if the guest had an in-progress draft, migrate it
    const guestBusiness = localStorage.getItem(getScopedStorageKey(BUSINESS_DRAFT_KEY_BASE, 'guest'));
    const guestItems = localStorage.getItem(getScopedStorageKey(ITEMS_DRAFT_KEY_BASE, 'guest'));
    if (guestBusiness || guestItems) {
      migrateGuestDraftsToUser(user);
      clearGuestDrafts();
    }
    return {
      redirectUrl: '/dashboard',
    };
  }

  const intent = pending.intent || 'final';
  const status = intent === 'draft' ? 'Draft' : 'Completed';
  const rawPayload = pending.payload || {};

  const quotePayload = {
    ...rawPayload,
    status,
    quoteNumber:
      rawPayload.quoteNumber?.trim() ||
      `QT-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
  };

  try {
    const response = await createQuote(quotePayload);
    const savedQuote = response.quote;

    clearPendingQuote();
    clearGuestDrafts();

    if (intent === 'final') {
      clearUserDrafts(user);
      const message = `Quote ${savedQuote.quoteNumber} has been saved to your account!`;
      try {
        sessionStorage.setItem(FLASH_TOAST_KEY, message);
      } catch {
        // ignore
      }
      return {
        savedQuote,
        redirectUrl: '/quotes',
        message,
      };
    } else {
      if (pending.draftState) {
        saveDraftStateToUser(pending.draftState, user, savedQuote.id);
      } else {
        migrateGuestDraftsToUser(user, savedQuote.id);
      }
      const message = `Quote draft ${savedQuote.quoteNumber} has been saved to your account!`;
      try {
        sessionStorage.setItem(FLASH_TOAST_KEY, message);
      } catch {
        // ignore
      }
      return {
        savedQuote,
        redirectUrl: pending.returnUrl || '/quotes',
        message,
      };
    }
  } catch (saveError) {
    console.error('Failed to create pending quote on server after login:', saveError);
    // Even if server call fails, preserve draft in user's scoped keys so no work is lost
    if (pending.draftState) {
      saveDraftStateToUser(pending.draftState, user);
    } else {
      migrateGuestDraftsToUser(user);
    }
    clearPendingQuote();
    clearGuestDrafts();

    return {
      redirectUrl: '/create-quote',
      message: 'Your quotation was saved locally. You can finalize it now.',
    };
  }
}
