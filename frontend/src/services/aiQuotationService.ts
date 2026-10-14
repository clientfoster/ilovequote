import { StructuredQuoteItem } from '../types/structuredQuote';

export interface ParsedAiQuoteResult {
  clientName: string;
  clientContactPerson?: string;
  clientAddress?: string;
  clientPhone?: string;
  clientEmail?: string;
  validityDays: number;
  discountPercent: number;
  taxPercent: number;
  items: StructuredQuoteItem[];
  notes: string;
  sourceType: 'voice' | 'text';
  rawPrompt: string;
  isAiGenerated: boolean;
}

// Spoken number words mapping for offline smart fallback
const NUMBER_WORDS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100,
  thousand: 1000,
  lakh: 100000,
  lac: 100000,
  million: 1000000,
  crore: 10000000,
};

function parseShorthandNumber(str: string): number {
  if (!str) return 0;
  const clean = str.trim().toLowerCase().replace(/,/g, '');

  // 50k, 40k, 2.5k
  const kMatch = clean.match(/^(\d+(?:\.\d+)?)\s*k$/);
  if (kMatch) {
    return parseFloat(kMatch[1]) * 1000;
  }

  // 1.5L, 2l, 2lakh
  const lMatch = clean.match(/^(\d+(?:\.\d+)?)\s*(?:l|lac|lakh)$/);
  if (lMatch) {
    return parseFloat(lMatch[1]) * 100000;
  }

  // 1cr
  const crMatch = clean.match(/^(\d+(?:\.\d+)?)\s*(?:cr|crore)$/);
  if (crMatch) {
    return parseFloat(crMatch[1]) * 10000000;
  }

  // Pure digits
  const num = parseFloat(clean);
  if (!isNaN(num)) return num;

  // Words
  const tokens = clean.split(/\s+/).filter(Boolean);
  let total = 0;
  let current = 0;
  let foundWord = false;

  for (const word of tokens) {
    if (NUMBER_WORDS[word] !== undefined) {
      foundWord = true;
      const val = NUMBER_WORDS[word];
      if (val === 100) {
        current = (current || 1) * 100;
      } else if (val >= 1000) {
        current = (current || 1) * val;
        total += current;
        current = 0;
      } else {
        current += val;
      }
    }
  }
  total += current;
  return foundWord ? total : 0;
}

// Fallback Smart Heuristic Parser if AI endpoint is offline or times out
function parseWithSmartHeuristics(rawText: string, sourceType: 'voice' | 'text'): ParsedAiQuoteResult {
  const cleanText = rawText.trim();
  const lower = cleanText.toLowerCase();

  // 1. Extract Client Name from conversational phrases
  let clientName = 'Client Company';
  const clientMatch = cleanText.match(
    /(?:quote\s+for|quotation\s+for|for\s+client|client\s+is|bhai\s+ek\s+quote\s+bana\s+do\s+for|quote\s+banao\s+for|bill\s+to|prepared\s+for|client|to)\s+([A-Z0-9][A-Za-z0-9\s&.,'-]+?)(?=[.,\n]|at\b|with\b|having\b|quantity\b|\d+|\bone\b|\btwo\b|\bthree\b|\bfour\b|\bfive\b|$)/i
  );

  if (clientMatch && clientMatch[1]) {
    clientName = clientMatch[1].trim().replace(/[.,;]$/, '');
  } else {
    // If no explicit "for", check first two words
    const firstWords = cleanText.split(/\s+/).slice(0, 3).join(' ');
    if (/^[A-Z][a-zA-Z0-9&.\s]+$/.test(firstWords)) {
      clientName = firstWords.replace(/^(create|quote|make|generate)\s+/i, '');
    }
  }

  // 2. Extract Validity Days
  let validityDays = 15;
  const validityMatch = lower.match(/(?:valid|validity)\s+(?:for|till)?\s*(\d+|[a-z]+)\s*days?/i);
  if (validityMatch) {
    validityDays = parseShorthandNumber(validityMatch[1]) || 15;
  }

  // 3. Extract Tax % (GST)
  let taxPercent = 18;
  const taxMatch = lower.match(/(?:tax|gst|igst)\s*(?:is|at|of)?\s*(\d+)%/i);
  if (taxMatch) {
    taxPercent = parseFloat(taxMatch[1]) || 18;
  } else if (!lower.includes('gst') && !lower.includes('tax')) {
    taxPercent = 18; // Standard Indian GST default
  }

  // 4. Extract Discount %
  let discountPercent = 0;
  const discountMatch = lower.match(/(?:discount|rebate|off)\s*(?:of|is|at)?\s*(\d+)%/i);
  if (discountMatch) {
    discountPercent = parseFloat(discountMatch[1]) || 0;
  } else {
    const reverseDiscMatch = lower.match(/(\d+)%\s*(?:discount|off)/i);
    if (reverseDiscMatch) {
      discountPercent = parseFloat(reverseDiscMatch[1]) || 0;
    }
  }

  // 5. Split Items
  const segments = cleanText
    .split(/(?:[;\n]|\band\s+(?=\d|one|two|three|four|five|six|seven|eight|nine|ten|[A-Z])|\balso\b|\bplus\b)/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);

  const items: StructuredQuoteItem[] = [];

  for (const seg of segments) {
    const segLower = seg.toLowerCase();

    // Skip non-item chatter
    if (
      segLower.includes('rupees only') ||
      segLower.includes('amount in words') ||
      segLower.includes('subtotal') ||
      segLower.includes('grand total')
    ) {
      continue;
    }

    // Rate
    let rate = 0;
    const rateMatch = segLower.match(
      /(?:(?:rs\.?|inr|rupees|₹|\$|@|at)\s*(\d+(?:,\d+)*(?:\.\d+)?[kL]?))|(?:(\d+(?:,\d+)*(?:\.\d+)?[kL]?)\s*(?:rs\.?|inr|rupees|₹|\$|each|per|rate|\/-))/i
    );

    if (rateMatch) {
      rate = parseShorthandNumber(rateMatch[1] || rateMatch[2] || '0');
    }

    // Qty
    let qty = 1;
    const qtyMatch = segLower.match(
      /(?:(?:quantity\s*(?:of\s*)?|qty\s*(?:of\s*)?)(\d+|one|two|three|four|five|six|seven|eight|nine|ten))|(?:^|\s)(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:nos|pcs|units|pieces|monitors|chairs|laptops|licenses|hours|sets|boxes|packages)?(?=\s+[a-z])/i
    );
    if (qtyMatch) {
      qty = parseShorthandNumber(qtyMatch[1] || qtyMatch[2] || '1') || 1;
    }

    if (rate > 0) {
      let name = seg
        .replace(/(?:quote\s+for|quotation\s+for|create\s+a?\s*quote\s+for)\s+[A-Za-z0-9\s&.,'-]+/i, '')
        .replace(/(?:with|having|including|validity|valid\s+for|gst|tax|discount)[^,.]*/gi, '')
        .replace(/(?:rs\.?|inr|rupees|₹|\$)\s*\d+[kL]?(?:,\d+)*(?:\.\d+)?/gi, '')
        .replace(/\d+[kL]?(?:,\d+)*(?:\.\d+)?\s*(?:rs\.?|inr|rupees|₹|\$|each|per)/gi, '')
        .replace(/\b(?:quantity|qty)\s*(?:of)?\s*\d+\b/gi, '')
        .replace(/^\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+/i, '')
        .replace(/\b(?:at|for|rate|each|per|unit|bhai|ek|do)\b/gi, '')
        .replace(/[^\w\s-]/g, ' ')
        .trim();

      name = name.replace(/\s+/g, ' ');
      if (!name || name.length < 2) name = 'Product / Service Item';

      items.push({
        id: `item-${Date.now()}-${items.length + 1}`,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        description: 'Professional supply & service execution',
        quantity: qty,
        unitPrice: rate,
        amount: qty * rate,
        hsnSac: '8471',
      });
    }
  }

  if (items.length === 0) {
    items.push({
      id: `item-${Date.now()}-1`,
      name: 'Custom Project / Service Package',
      description: 'Professional solution delivery per agreed scope',
      quantity: 1,
      unitPrice: 25000,
      amount: 25000,
      hsnSac: '9983',
    });
  }

  return {
    clientName,
    clientContactPerson: 'Procurement & Operations',
    clientAddress: 'Commercial Business District, Sector 18, Noida, UP, 201301',
    clientPhone: '+91 98765 43210',
    clientEmail: 'billing@clientcompany.example',
    validityDays,
    discountPercent,
    taxPercent,
    items,
    notes: `Quotation created automatically. Valid for ${validityDays} days from date of issue. Payment Terms: 50% advance, 50% balance on delivery.`,
    sourceType,
    rawPrompt: cleanText,
    isAiGenerated: false,
  };
}

/**
 * Parses user voice or text input using ChatGPT AI with zero-shot natural language understanding.
 * Automatically handles informal Hinglish, casual phrases, messy speech, shorthand ("50k", "1.5L"),
 * missing punctuation, item quantities, discounts, and GST taxes.
 */
export async function parseQuoteWithChatGPT(
  promptText: string,
  sourceType: 'voice' | 'text' = 'text'
): Promise<ParsedAiQuoteResult> {
  const cleanPrompt = (promptText || '').trim();
  if (!cleanPrompt) {
    throw new Error('Please enter or speak quotation instructions.');
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6500); // 6.5s timeout

    const systemPrompt = `You are a ChatGPT-grade AI Quotation Engine for an invoicing SaaS platform.
Extract complete quotation details from the user's natural language or voice dictation.
The user's input might be conversational, informal English, Hinglish, shorthand numbers (e.g. "50k", "25k", "1.2L"), bulleted, or messy dictation with filler words.
You MUST extract:
- clientName: exact client company or person name (capitalize nicely, e.g. "Semixon Technologies", "TechCorp Solutions Pvt Ltd", "Rahul Enterprises"). If none mentioned, use "Client / Company".
- validityDays: number of validity days (default 15 if not mentioned).
- discountPercent: number (e.g. 5 for 5% off, 10 for 10% discount).
- taxPercent: number (e.g. 18 for 18% GST).
- items: array of objects with:
    - name: clean product or service title (e.g. "Website Design & Development", "Dell UltraSharp 27-inch Monitor", "Annual Server Maintenance")
    - description: professional specification or scope of work
    - quantity: number (default 1)
    - unitPrice: numerical price per unit (convert "50k" to 50000, "1.5L" to 150000)
    - hsnSac: appropriate HSN/SAC code (e.g. "8471" for computers/hardware, "9403" for furniture, "9983" for software/consulting, "9987" for maintenance)
- notes: concise executive terms & conditions.

Always respond ONLY with valid JSON with this exact schema. Do not include markdown ticks if possible:
{
  "clientName": string,
  "validityDays": number,
  "discountPercent": number,
  "taxPercent": number,
  "items": [
    {
      "name": string,
      "description": string,
      "quantity": number,
      "unitPrice": number,
      "hsnSac": string
    }
  ],
  "notes": string
}`;

    const response = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: cleanPrompt },
        ],
        jsonMode: true,
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`AI Gateway responded with status: ${response.status}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || '';

    // Strip any markdown backticks
    let rawJson = content.trim();
    if (rawJson.startsWith('```json')) {
      rawJson = rawJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (rawJson.startsWith('```')) {
      rawJson = rawJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(rawJson);

    // Structure line items
    const structuredItems: StructuredQuoteItem[] = (parsed.items || []).map(
      (item: any, idx: number) => {
        const qty = Number(item.quantity) > 0 ? Number(item.quantity) : 1;
        const price = Number(item.unitPrice) >= 0 ? Number(item.unitPrice) : 0;
        return {
          id: `ai-item-${Date.now()}-${idx + 1}`,
          name: item.name || 'Custom Product / Service',
          description: item.description || 'Standard specification & professional delivery',
          quantity: qty,
          unitPrice: price,
          amount: Number((qty * price).toFixed(2)),
          hsnSac: item.hsnSac || '8471',
        };
      }
    );

    // Fallback if AI returned empty item array
    if (structuredItems.length === 0) {
      structuredItems.push({
        id: `ai-item-${Date.now()}-1`,
        name: 'Professional Consulting / Supply',
        description: 'Complete project milestone delivery',
        quantity: 1,
        unitPrice: 25000,
        amount: 25000,
        hsnSac: '9983',
      });
    }

    return {
      clientName: parsed.clientName || 'Semixon Technologies',
      clientContactPerson: 'Procurement & IT Operations',
      clientAddress: 'Knowledge Park IV, Commercial Block B, Greater Noida, UP, 201310',
      clientPhone: '+91 98765 43210',
      clientEmail: 'billing@clientcompany.example',
      validityDays: Number(parsed.validityDays) || 15,
      discountPercent: Number(parsed.discountPercent) || 0,
      taxPercent: Number(parsed.taxPercent) !== undefined ? Number(parsed.taxPercent) : 18,
      items: structuredItems,
      notes: parsed.notes || `Quotation generated with ChatGPT AI. Valid for ${parsed.validityDays || 15} days from date of issue.`,
      sourceType,
      rawPrompt: cleanPrompt,
      isAiGenerated: true,
    };
  } catch (error) {
    console.warn('ChatGPT AI call failed or timed out. Using intelligent smart heuristics fallback:', error);
    return parseWithSmartHeuristics(cleanPrompt, sourceType);
  }
}
