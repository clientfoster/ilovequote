import { getScopedStorageKey } from './auth';
import { fetchCustomers } from './customerApi';
import { fetchUserQuotes } from './quoteApi';
import { BusinessFormValues, ClientFormValues, Customer, Quote } from './types';

export const BUSINESS_LIBRARY_KEY = 'ilovequote_invoice_business_library';

export type ProfileOption<TPatch = Record<string, unknown>> = {
  id: string;
  label: string;
  patch: TPatch;
};

export function buildProfileKey(parts: Array<string | undefined | null>) {
  return parts
    .map((part) => part?.trim().toLowerCase() || '')
    .join('|');
}

export function buildBusinessProfileOption(
  id: string,
  source: Partial<BusinessFormValues> & {
    companyName?: string;
    email?: string;
    address?: string;
    city?: string;
    country?: string;
    zipCode?: string;
    taxType?: string;
    taxId?: string;
  },
): ProfileOption<Partial<BusinessFormValues>> {
  const label = [source.companyName || 'Business Profile', source.phone, source.email, source.city].filter(Boolean).join(' | ');
  return {
    id,
    label,
    patch: {
      companyName: source.companyName?.trim() || '',
      tagline: source.tagline?.trim() || '',
      email: source.email?.trim() || '',
      phone: source.phone?.trim() || '',
      website: source.website?.trim() || '',
      logo: source.logo?.trim() || '',
      address: source.address?.trim() || '',
      city: source.city?.trim() || '',
      state: source.state?.trim() || '',
      zipCode: source.zipCode?.trim() || '',
      country: source.country?.trim() || '',
      taxType: source.taxType || 'GSTIN',
      taxId: source.taxId?.trim() || '',
      socialLinks: Array.isArray(source.socialLinks) ? source.socialLinks : [],
    },
  };
}

export function buildClientProfileOption(
  id: string,
  source: Partial<ClientFormValues> & {
    name?: string;
    address?: string;
    email?: string;
    phone?: string;
  },
): ProfileOption<Partial<ClientFormValues>> {
  const label = [source.companyName || source.name || 'Client Profile', source.phone, source.email].filter(Boolean).join(' | ');
  return {
    id,
    label,
    patch: {
      companyName: source.companyName?.trim() || source.name?.trim() || '',
      contactPerson: source.contactPerson?.trim() || '',
      email: source.email?.trim() || '',
      phone: source.phone?.trim() || '',
      website: source.website?.trim() || '',
      taxIdType: source.taxIdType || 'GSTIN',
      taxId: source.taxId?.trim() || '',
      poNumber: source.poNumber?.trim() || '',
      billingAddress: source.billingAddress?.trim() || source.address?.trim() || '',
      city: source.city?.trim() || '',
      state: source.state?.trim() || '',
      zipCode: source.zipCode?.trim() || '',
      country: source.country?.trim() || '',
    },
  };
}

export async function loadQuoteAutofillProfiles({
  businessDraftStorageKey,
  clientDraftStorageKey,
}: {
  businessDraftStorageKey: string;
  clientDraftStorageKey: string;
}) {
  const nextBusinessProfiles: Array<ProfileOption<Partial<BusinessFormValues>>> = [];
  const nextClientProfiles: Array<ProfileOption<Partial<ClientFormValues>>> = [];
  const seenBusinessKeys = new Set<string>();
  const seenClientKeys = new Set<string>();

  const pushBusinessProfile = (profile: ProfileOption<Partial<BusinessFormValues>>, key: string) => {
    if (!key || seenBusinessKeys.has(key)) return;
    seenBusinessKeys.add(key);
    nextBusinessProfiles.push(profile);
  };

  const pushClientProfile = (profile: ProfileOption<Partial<ClientFormValues>>, key: string) => {
    if (!key || seenClientKeys.has(key)) return;
    seenClientKeys.add(key);
    nextClientProfiles.push(profile);
  };

  try {
    const businessLibraryRaw = localStorage.getItem(getScopedStorageKey(BUSINESS_LIBRARY_KEY));
    if (businessLibraryRaw) {
      const parsed = JSON.parse(businessLibraryRaw) as Array<Partial<BusinessFormValues>>;
      parsed.forEach((entry, index) => {
        if (entry.companyName?.trim()) {
          pushBusinessProfile(
            buildBusinessProfileOption(`business-library-${index}`, entry),
            buildProfileKey([
              entry.companyName,
              entry.phone,
              entry.email,
              entry.address,
              entry.city,
              entry.country,
              entry.zipCode,
            ]),
          );
        }
      });
    }
  } catch {
    // Ignore malformed business library data.
  }

  try {
    const businessDraftRaw = localStorage.getItem(businessDraftStorageKey);
    if (businessDraftRaw) {
      const parsed = JSON.parse(businessDraftRaw) as Partial<BusinessFormValues>;
      if (parsed.companyName?.trim()) {
        pushBusinessProfile(
          buildBusinessProfileOption('business-draft', parsed),
          buildProfileKey([
            parsed.companyName,
            parsed.phone,
            parsed.email,
            parsed.address,
            parsed.city,
            parsed.country,
            parsed.zipCode,
          ]),
        );
      }
    }
  } catch {
    // Ignore malformed business drafts.
  }

  try {
    const clientDraftRaw = localStorage.getItem(clientDraftStorageKey);
    if (clientDraftRaw) {
      const parsed = JSON.parse(clientDraftRaw) as Partial<ClientFormValues>;
      if (parsed.companyName?.trim() || parsed.contactPerson?.trim()) {
        pushClientProfile(
          buildClientProfileOption('client-draft', parsed),
          buildProfileKey([
            parsed.companyName,
            parsed.contactPerson,
            parsed.email,
            parsed.phone,
            parsed.billingAddress,
            parsed.city,
            parsed.country,
          ]),
        );
      }
    }
  } catch {
    // Ignore malformed client drafts.
  }

  try {
    const savedCustomers = await fetchCustomers();
    savedCustomers.forEach((customer: Customer) => {
      if (customer.companyName?.trim() || customer.contactPerson?.trim()) {
        pushClientProfile(
          buildClientProfileOption(`customer-${customer.id}`, customer),
          buildProfileKey([
            customer.companyName,
            customer.contactPerson,
            customer.email,
            customer.phone,
            customer.billingAddress,
            customer.city,
            customer.country,
          ]),
        );
      }
    });
  } catch {
    // Continue with manual client entry if customer history is unavailable.
  }

  try {
    const quotes = await fetchUserQuotes();
    quotes.forEach((quote: Quote) => {
      if (quote.businessDetails.companyName?.trim()) {
        pushBusinessProfile(
          buildBusinessProfileOption(`quote-business-${quote.id}`, quote.businessDetails),
          buildProfileKey([
            quote.businessDetails.companyName,
            quote.businessDetails.phone,
            quote.businessDetails.email,
            quote.businessDetails.address,
            quote.businessDetails.city,
            quote.businessDetails.country,
            quote.businessDetails.zipCode,
          ]),
        );
      }
    });
  } catch {
    // Continue with manual business entry if quote history is unavailable.
  }

  return {
    businessProfiles: nextBusinessProfiles,
    clientProfiles: nextClientProfiles,
  };
}
