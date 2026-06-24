import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Quote } from '../types';
import { apiRequest } from '../api';
import PreviewStep from '../components/PreviewStep';
import { ItemQuoteItem } from '../types';
import { buildPdfDownloadUrl } from '../url';

function mapQuoteItems(items: Quote['items']): ItemQuoteItem[] {
  return (items || []).map((item) => ({
    id: item.id,
    name: item.description || 'Item',
    description: item.description || '',
    price: Number(item.unitPrice || 0),
    complimentary: false,
    quantity: Number(item.quantity || 1),
    unit: 'Unit',
    discountType: item.discountType || 'None',
    discountValue: Number(item.discountValue || 0),
    gstRate: Number(item.gstRate || 0),
    taxInclusive: Boolean(item.taxInclusive),
    icon: item.icon || 'FileText',
  }));
}

export default function QuoteExportPage() {
  const { id = '' } = useParams();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadQuote() {
      try {
        setLoading(true);
        const payload = await apiRequest<{ quote: Quote }>(`/api/quotes/${encodeURIComponent(id)}`, { method: 'GET' });
        if (active) {
          setQuote(payload.quote);
          setError('');
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Could not load quote');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    if (id) {
      loadQuote();
    } else {
      setError('Missing quote id.');
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [id]);

  const businessDetails = quote?.businessDetails || ({} as Quote['businessDetails']);
  const clientDetails = quote?.clientDetails || ({} as Quote['clientDetails']);
  const itemList = useMemo(() => mapQuoteItems(quote?.items || []), [quote]);

  if (loading) {
    return <div className="min-h-screen bg-[#F8FAFC] p-6 text-slate-700">Loading quote preview...</div>;
  }

  if (error || !quote) {
    return <div className="min-h-screen bg-[#F8FAFC] p-6 text-red-600">{error || 'Quote not found.'}</div>;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="mx-auto max-w-[1100px] px-4 py-4">
        <PreviewStep
          businessName={businessDetails.companyName || ''}
          businessEmail={businessDetails.email || ''}
          businessPhone={businessDetails.phone || ''}
          businessWebsite={businessDetails.website || ''}
          businessAddress={businessDetails.address || ''}
          businessLogo={businessDetails.logo || ''}
          clientLogo={quote.clientLogo || ''}
          businessSlug={businessDetails.businessSlug || ''}
          clientName={clientDetails.name || ''}
          clientContactPerson=""
          clientEmail={clientDetails.email || ''}
          clientPhone={clientDetails.phone || ''}
          clientAddress={clientDetails.address || ''}
          quoteNumber={quote.quoteNumber}
          issueDate={quote.date}
          expiryDate={quote.expiryDate}
          items={itemList}
          terms={quote.terms || ''}
          remarks=""
          onSaveDraft={() => {}}
          onCopyLink={() => {}}
          onPrint={() => window.print()}
          onDownloadPDF={() => window.open(buildPdfDownloadUrl(quote.id), '_blank', 'noopener,noreferrer')}
          onSendToClient={async () => {}}
          onPrev={() => window.history.back()}
        />
      </div>
    </div>
  );
}
