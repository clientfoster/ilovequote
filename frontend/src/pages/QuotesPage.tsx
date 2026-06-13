import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Trash2, 
  Edit3, 
  Eye, 
  Search, 
  PlusCircle, 
  Calendar, 
  DollarSign, 
  Printer, 
  X, 
  XSquare, 
  HelpCircle,
  Building,
  User,
  Tags,
  CheckCircle,
  Globe,
  Mail,
  Phone,
  Percent
} from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Quote } from '../types';

const QUOTES_STORAGE_KEY = 'ilovequote_saved_quotes';
const BUSINESS_DRAFT_KEY = 'ilovequote_business_draft';

interface QuotesPageProps {
  onTriggerToast?: (message: string) => void;
}

export default function QuotesPage({ onTriggerToast: propTriggerToast }: QuotesPageProps) {
  const context = useOutletContext<{ onTriggerToast: (msg: string) => void }>();
  const onTriggerToast = propTriggerToast || context?.onTriggerToast || (() => {});
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const navigate = useNavigate();

  // Load quotes from Local Storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(QUOTES_STORAGE_KEY);
      if (saved) {
        setQuotes(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Error reading saved quotes", e);
    }
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this quote permanently?')) {
      const updated = quotes.filter(q => q.id !== id);
      setQuotes(updated);
      try {
        localStorage.setItem(QUOTES_STORAGE_KEY, JSON.stringify(updated));
        onTriggerToast('Quote deleted successfully');
      } catch (err) {
        onTriggerToast('Error deleting quote');
      }
    }
  };

  const handleEdit = (quote: Quote, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // Pack the editing quote into the active draft key
      // We also save a special key representing editing mode so we know which quote is being edited rather than creating a new copy
      localStorage.setItem('ilovequote_editing_quote_id', quote.id);
      
      const draftFormValues = {
        ...quote.businessDetails,
        // Carry along the client details, items, etc. in specialized keys so the wizard page can parse and reload them!
        _clientName: quote.clientDetails.name,
        _clientEmail: quote.clientDetails.email,
        _clientPhone: quote.clientDetails.phone,
        _clientAddress: quote.clientDetails.address,
        _quoteNumber: quote.quoteNumber,
        _items: JSON.stringify(quote.items),
        _date: quote.date,
        _expiryDate: quote.expiryDate,
        _taxRate: quote.taxRate,
        _terms: quote.terms
      };
      
      localStorage.setItem(BUSINESS_DRAFT_KEY, JSON.stringify(draftFormValues));
      onTriggerToast(`Editing ${quote.quoteNumber}`);
      navigate('/create-quote');
    } catch (err) {
      console.error(err);
      onTriggerToast('Unable to edit quote');
    }
  };

  // Filter quotes based on search query
  const filteredQuotes = quotes.filter(q => {
    const qnum = (q.quoteNumber || '').toLowerCase();
    const bname = (q.businessDetails?.companyName || '').toLowerCase();
    const cname = (q.clientDetails?.name || '').toLowerCase();
    const status = (q.status || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return qnum.includes(query) || bname.includes(query) || cname.includes(query) || status.includes(query);
  });

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-4 md:p-8" id="quotes-page-wrapper">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* UPPER TITLE ROW */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#1D4ED8]" />
              My Saved Quotes
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-medium">Manage and view standard quotes made in your offline environment.</p>
          </div>
          
          <div>
            <button
              onClick={() => {
                localStorage.removeItem('ilovequote_editing_quote_id'); // Clear editing state
                navigate('/create-quote');
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1D4ED8] hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-blue-100 active:scale-95 transform hover:-translate-y-0.5"
            >
              <PlusCircle className="w-4 h-4" />
              Create New Quote
            </button>
          </div>
        </div>

        {/* SEARCH FILTER */}
        <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search quotes by number, business name or client name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none text-xs text-slate-800 font-semibold focus:outline-hidden"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* LIST TABLE OR EMPTY GRID */}
        {filteredQuotes.length === 0 ? (
          <div className="bg-white border border-slate-155 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-350 flex items-center justify-center">
              <FileText className="w-8 h-8 stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-800">No Quotes Found</h3>
              <p className="text-xs text-slate-450 font-medium max-w-sm mx-auto">
                {searchQuery ? "No results match your current search constraints." : "You haven't saved any quotation proposals yet. Click Create New Quote to begin!"}
              </p>
            </div>
            {!searchQuery && (
              <button
                onClick={() => navigate('/create-quote')}
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-[#1D4ED8] text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Create First Quote Now
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white border border-slate-150 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="py-4 px-6">Quote Number</th>
                    <th className="py-4 px-6">Business Name</th>
                    <th className="py-4 px-6">Client Name</th>
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6">Total Amount</th>
                    <th className="py-4 px-6 text-center">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                  {filteredQuotes.map((quote) => (
                    <tr 
                      key={quote.id} 
                      className="hover:bg-slate-50/40 transition-colors group cursor-pointer"
                      onClick={() => setSelectedQuote(quote)}
                    >
                      <td className="py-4 px-6 text-[#1D4ED8] font-mono font-bold">
                        {quote.quoteNumber}
                      </td>
                      <td className="py-4 px-6 text-slate-900 font-extrabold">
                        {quote.businessDetails?.companyName || 'N/A'}
                      </td>
                      <td className="py-4 px-6 font-semibold flex items-center gap-1.5 matches-client">
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] uppercase font-black">
                          {(quote.clientDetails?.name || 'C').charAt(0)}
                        </div>
                        {quote.clientDetails?.name || 'N/A'}
                      </td>
                      <td className="py-4 px-6 text-slate-450 font-medium">
                        {quote.date}
                      </td>
                      <td className="py-4 px-6 text-slate-900 font-black">
                        ${quote.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                          quote.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${quote.status === 'Completed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          {quote.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedQuote(quote)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                            title="View Quote PDF"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleEdit(quote, e)}
                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all cursor-pointer"
                            title="Edit Quote"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(quote.id, e)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                            title="Delete Quote"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DETAILED MODAL PREVIEW FOR SELECTED QUOTE */}
        {selectedQuote && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full border border-slate-150 overflow-hidden flex flex-col my-8 animate-fade-in max-h-[90vh]">
              
              {/* MODAL TITLE HEADER BAR */}
              <div className="bg-slate-50 border-b border-slate-150 px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#1D4ED8]" />
                  <span className="font-extrabold text-[#1D4ED8] font-mono">{selectedQuote.quoteNumber}</span>
                  <span className="text-xs text-slate-400">({selectedQuote.status} Document)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="p-2 text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer shadow-xs"
                  >
                    <Printer className="w-4 h-4" />
                    Print / PDF
                  </button>
                  <button
                    onClick={() => setSelectedQuote(null)}
                    className="p-2 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* DETAILED PRINTABLE PROPOSAL SHEET BODY */}
              <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-8 font-sans" id="print-area">
                
                {/* 1. BRAND HEADER BLOCK */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-6 pb-6 border-b border-slate-100">
                  <div className="space-y-3.5">
                    {selectedQuote.businessDetails?.logo ? (
                      <div className="w-16 h-16 bg-white border border-slate-100 rounded-2xl flex items-center justify-center overflow-hidden shadow-xs">
                        <img 
                          src={selectedQuote.businessDetails.logo} 
                          alt="Logo" 
                          className="max-h-full max-w-full object-contain p-2"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-[#1D4ED8] rounded-xl flex items-center justify-center text-white text-lg font-black font-mono shadow-md">
                        {selectedQuote.businessDetails?.companyName?.slice(0, 2).toUpperCase() || 'IQ'}
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">
                        {selectedQuote.businessDetails?.companyName || 'Semixon Ltd'}
                      </h3>
                      {selectedQuote.businessDetails?.tagline && (
                        <p className="text-[11px] text-slate-500 italic mt-0.5">{selectedQuote.businessDetails.tagline}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 text-left md:text-right text-xs text-slate-505 font-medium">
                    <span className="inline-block bg-[#1D4ED8]/10 text-[#1D4ED8] uppercase text-[10px] font-black tracking-widest px-3 py-1 rounded-full mb-2">
                      Quotation Proposal
                    </span>
                    <p className="font-extrabold text-slate-800">Quote #: {selectedQuote.quoteNumber}</p>
                    <p>Date: {selectedQuote.date}</p>
                    <p>Expiry: {selectedQuote.expiryDate || 'N/A'}</p>
                  </div>
                </div>

                {/* 2. TWO-COLUMN ADRESS DETAILS: FROM vs TO */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs leading-relaxed font-semibold">
                  {/* From Business Address */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prepared By:</h4>
                    <div className="space-y-1 text-slate-700">
                      <p className="font-extrabold text-slate-900">{selectedQuote.businessDetails?.companyName}</p>
                      {selectedQuote.businessDetails?.address && <p>{selectedQuote.businessDetails.address}</p>}
                      <p>
                        {[selectedQuote.businessDetails?.city, selectedQuote.businessDetails?.state, selectedQuote.businessDetails?.zipCode].filter(Boolean).join(', ')}
                      </p>
                      {selectedQuote.businessDetails?.email && <p>Email: {selectedQuote.businessDetails.email}</p>}
                      {selectedQuote.businessDetails?.phone && <p>Phone: {selectedQuote.businessDetails.phone}</p>}
                      {selectedQuote.businessDetails?.taxId && (
                        <p className="font-mono text-slate-500 text-[11px] font-bold">
                          {selectedQuote.businessDetails.taxType || 'GSTIN'}: {selectedQuote.businessDetails.taxId}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* To Client Address */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prepared For:</h4>
                    <div className="space-y-1 text-slate-700">
                      <p className="font-extrabold text-slate-900">{selectedQuote.clientDetails?.name || 'N/A'}</p>
                      {selectedQuote.clientDetails?.address && <p className="whitespace-pre-line">{selectedQuote.clientDetails.address}</p>}
                      {selectedQuote.clientDetails?.email && <p>Email: {selectedQuote.clientDetails.email}</p>}
                      {selectedQuote.clientDetails?.phone && <p>Phone: {selectedQuote.clientDetails.phone}</p>}
                    </div>
                  </div>
                </div>

                {/* 3. ITEMIZATION LINES TABLE */}
                <div className="border border-slate-150 rounded-2xl overflow-hidden mt-4">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-150 bg-slate-50/70 font-black text-slate-400 uppercase tracking-widest">
                        <th className="py-3 px-4">#</th>
                        <th className="py-3 px-4">Item Description</th>
                        <th className="py-3 px-4 text-center">Qty</th>
                        <th className="py-3 px-4 text-right">Unit Price</th>
                        <th className="py-3 px-4 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 font-bold text-slate-700">
                      {(selectedQuote.items || []).map((item, index) => (
                        <tr key={index}>
                          <td className="py-3 px-4 text-slate-400 font-mono">{index + 1}</td>
                          <td className="py-3 px-4 text-slate-905 font-extrabold whitespace-pre-line">{item.description}</td>
                          <td className="py-3 px-4 text-center">{item.quantity}</td>
                          <td className="py-3 px-4 text-right">${item.unitPrice.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right text-slate-900 font-black">${item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 4. TOTALS CALCULATION BOX */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-4 text-xs">
                  {/* Terms Notes */}
                  <div className="flex-1 space-y-2">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5" />
                      Invoice Terms & Guidelines:
                    </h4>
                    <p className="text-[11px] text-slate-505 leading-relaxed font-medium whitespace-pre-line bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                      {selectedQuote.terms || '--'}
                    </p>
                  </div>

                  {/* Calculations breakdown */}
                  <div className="w-full sm:w-64 space-y-2 shrink-0 font-bold text-slate-650">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="text-slate-900">${selectedQuote.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (GST ({selectedQuote.taxRate}%))</span>
                      <span className="text-slate-900">${selectedQuote.taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="w-full h-[1px] bg-slate-150 my-1" />
                    <div className="flex justify-between text-sm text-[#1D4ED8] font-black">
                      <span>Total Amount</span>
                      <span>${selectedQuote.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
