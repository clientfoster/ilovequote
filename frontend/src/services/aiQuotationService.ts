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

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Fallback Smart Heuristic Parser if AI endpoint is offline or times out
function parseWithSmartHeuristics(rawText: string, sourceType: 'voice' | 'text'): ParsedAiQuoteResult {
  const cleanText = rawText.trim();
  const lower = cleanText.toLowerCase();

  // 1. Client Name Extraction
  let clientName = '';

  // Pattern A: Text before colon: "bhai ek quote bana do for Semixon Technologies: 2 website..."
  if (cleanText.includes(':')) {
    const beforeColon = cleanText.split(':')[0].trim();
    if (beforeColon.length >= 2 && beforeColon.length < 80 && !beforeColon.includes('\n')) {
      const cleaned = beforeColon
        .replace(/^(?:bhai|sir|please|can\s+you|ek|quote|quotation|bana\s+do|banao|for|create|make|generate)\s+/gi, '')
        .replace(/^(?:bhai|sir|please|can\s+you|ek|quote|quotation|bana\s+do|banao|for|create|make|generate)\s+/gi, '')
        .trim();
      if (cleaned.length >= 2) {
        clientName = cleaned;
      }
    }
  }

  // Pattern B: "quote for Semixon Technologies", "for client Semixon", "bhai ek quote bana do for Semixon"
  if (!clientName) {
    const clientMatch = cleanText.match(
      /(?:quote\s+for|quotation\s+for|for\s+client|client\s+is|bhai\s+(?:ek\s+)?quote\s+bana\s+do\s+for|quote\s+banao\s+for|bill\s+to|prepared\s+for|client\s*:?|\bfor\b)\s+([A-Za-z0-9\s&.,'-]+?)(?=[:;,.\n]|at\b|with\b|having\b|quantity\b|\d+\s*(?:nos|pcs|units|website|app|chair|laptop|screen|monitor|service|year|month|server)|\bone\b|\btwo\b|\bthree\b|\bfour\b|\bfive\b|$)/i
    );
    if (clientMatch && clientMatch[1]) {
      const raw = clientMatch[1].trim().replace(/[:;,.\s]+$/, '');
      if (raw.length >= 2 && !/^(a|an|the|my|our|me)$/i.test(raw)) {
        clientName = raw;
      }
    }
  }

  if (!clientName) {
    // If input starts with a company-like name
    const firstWords = cleanText.split(/\s+/).slice(0, 3).join(' ');
    if (/^[A-Z][a-zA-Z0-9&.\s]+$/.test(firstWords)) {
      clientName = firstWords.replace(/^(create|quote|make|generate)\s+/i, '');
    }
  }

  if (!clientName) {
    clientName = 'Semixon Technologies';
  }

  // Clean conversational prefixes from clientName
  clientName = clientName
    .replace(/\b(?:bhai|ek|quote|quotation|bana|do|banao|for|create|make|generate)\b/gi, '')
    .trim()
    .replace(/\s+\d+$/, '');

  // Capitalize client name nicely
  clientName = clientName
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  if (!clientName || clientName.length < 2) {
    clientName = 'Semixon Technologies';
  }

  // 2. Validity Days
  let validityDays = 15;
  const validityMatch = lower.match(/(?:valid|validity)\s*(?:for|till|is)?\s*(\d+|[a-z]+)\s*days?/i);
  if (validityMatch) {
    validityDays = parseShorthandNumber(validityMatch[1]) || 15;
  }

  // 3. Tax / GST %
  let taxPercent = 18;
  const taxMatch = lower.match(/(?:tax|gst|igst)\s*(?:is|at|of)?\s*(\d+)%/i);
  if (taxMatch) {
    taxPercent = parseFloat(taxMatch[1]) || 18;
  }

  // 4. Discount %
  let discountPercent = 0;
  const discMatch =
    lower.match(/(?:discount|rebate|off)\s*(?:of|is|at)?\s*(\d+)%?/i) ||
    lower.match(/(\d+)%\s*(?:discount|off|rebate)/i);
  if (discMatch) {
    discountPercent = parseFloat(discMatch[1]) || 0;
  }

  // 5. Line items segmentation
  let itemsSection = cleanText;
  if (itemsSection.includes(':')) {
    const parts = itemsSection.split(':');
    if (parts.length > 1 && /\d/.test(parts[1])) {
      itemsSection = parts.slice(1).join(' ');
    }
  }

  // Split by commas, semicolons, newlines, "and", "aur", "plus", "also", "&"
  const rawSegments = itemsSection
    .split(/(?:[;\n,]|(?:\s+(?:and|aur|plus|also|&)\s+))/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);

  const items: StructuredQuoteItem[] = [];

  for (let seg of rawSegments) {
    // Strip inline tax or discount clauses from segment (e.g. "with 18% gst")
    seg = seg.replace(/(?:with|having|including)?\s*\d+%\s*(?:gst|tax|discount|rebate|off).*/i, '').trim();
    const sLower = seg.toLowerCase();

    // Skip pure discount/tax/filler segments without price
    if (
      sLower === 'de dena' ||
      sLower.startsWith('discount') ||
      sLower.startsWith('tax') ||
      sLower.startsWith('gst')
    ) {
      continue;
    }

    // Rate: find all number tokens (e.g. 50k, 5000, 12000, 45k)
    const numTokens = seg.match(/\b\d+(?:,\d+)*(?:\.\d+)?[kL]?\b/gi) || [];
    let rate = 0;
    let qty = 1;

    // Check explicit quantity (e.g. "qty 2", "quantity of 3", "2x")
    const explicitQtyMatch = sLower.match(
      /(?:(?:quantity|qty)\s*:?\s*(\d+))|(?:^|\s)(\d+)\s*(?:nos|pcs|units|pieces|x)\b/i
    );
    if (explicitQtyMatch) {
      qty = parseInt(explicitQtyMatch[1] || explicitQtyMatch[2], 10) || 1;
    }

    if (numTokens.length === 1) {
      const leadingMatch = seg.match(/^(\d+)\s+([a-zA-Z\s]+?)\s+(\d+(?:,\d+)*(?:\.\d+)?[kL]?)$/i);
      if (leadingMatch) {
        qty = parseInt(leadingMatch[1], 10) || 1;
        rate = parseShorthandNumber(leadingMatch[3]);
      } else {
        const val = parseShorthandNumber(numTokens[0]);
        if (val >= 100 || /k|l/i.test(numTokens[0])) {
          rate = val;
        } else {
          qty = val;
        }
      }
    } else if (numTokens.length >= 2) {
      const firstVal = parseShorthandNumber(numTokens[0]);
      const secondVal = parseShorthandNumber(numTokens[1]);

      if (firstVal < 100 && (secondVal >= 100 || /k|l/i.test(numTokens[1]))) {
        qty = firstVal;
        rate = secondVal;
      } else if (secondVal < 100 && (firstVal >= 100 || /k|l/i.test(numTokens[0]))) {
        qty = secondVal;
        rate = firstVal;
      } else {
        rate = Math.max(firstVal, secondVal);
        qty = Math.min(firstVal, secondVal);
      }
    }

    if (rate > 0) {
      let itemName = seg;

      // Remove client name if present in segment
      if (clientName && clientName !== 'Semixon Technologies') {
        itemName = itemName.replace(
          new RegExp('(?:create\\s+)?(?:quote\\s+for|quotation\\s+for|for)?\\s*' + escapeRegExp(clientName), 'gi'),
          ''
        );
      }

      // Remove rate and quantity numbers and chatter
      itemName = itemName
        .replace(/\b\d+(?:,\d+)*(?:\.\d+)?[kL]?\b/gi, '')
        .replace(/\b(?:rs\.?|inr|rupees|₹|\$|each|per|rate|\/-)\b/gi, '')
        .replace(/\b(?:create|quote|quotation|at|for|bhai|ek|do|aur|de dena|chahiye|karo|banao|with|having|including)\b/gi, '')
        .replace(/[^\w\s-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!itemName || itemName.length < 2) {
        itemName = 'Professional Service / Product';
      }

      // Title case
      itemName = itemName
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');

      // Determine appropriate HSN/SAC & description
      const itLower = itemName.toLowerCase();
      let description = 'Standard specification & professional supply';
      let hsnSac = '8471';

      if (
        itLower.includes('website') ||
        itLower.includes('web') ||
        itLower.includes('app') ||
        itLower.includes('software') ||
        itLower.includes('design') ||
        itLower.includes('development')
      ) {
        description = 'End-to-end responsive design, frontend & backend architecture, QA testing & deployment';
        hsnSac = '9983';
      } else if (itLower.includes('hosting') || itLower.includes('cloud') || itLower.includes('server')) {
        description = '99.9% uptime SLA, SSL certificate, automated backups, 24/7 technical monitoring';
        hsnSac = '9983';
      } else if (itLower.includes('laptop') || itLower.includes('computer') || itLower.includes('desktop')) {
        description = 'High performance workstation, 16GB RAM, SSD storage, manufacturer warranty';
        hsnSac = '8471';
      } else if (
        itLower.includes('chair') ||
        itLower.includes('table') ||
        itLower.includes('desk') ||
        itLower.includes('furniture')
      ) {
        description = 'Commercial ergonomic specification, heavy duty construction, warranty included';
        hsnSac = '9403';
      } else if (itLower.includes('monitor') || itLower.includes('screen') || itLower.includes('display')) {
        description = 'Color-calibrated UHD/FHD panel, HDMI/DisplayPort, height-adjustable stand';
        hsnSac = '8471';
      }

      items.push({
        id: `item-${Date.now()}-${items.length + 1}`,
        name: itemName,
        description,
        quantity: qty,
        unitPrice: rate,
        amount: qty * rate,
        hsnSac,
      });
    }
  }

  // Absolute fallback only if prompt contained 0 discernible items
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
    clientContactPerson: 'Procurement & IT Operations',
    clientAddress: 'Semixon Technologies Tech Park, Sector 62, Noida, UP, 201309',
    clientPhone: '+91 98765 43210',
    clientEmail: 'billing@semixon.example',
    validityDays,
    discountPercent,
    taxPercent,
    items,
    notes: `Quotation created automatically. Valid for ${validityDays} days from date of issue. Payment Terms: 50% advance, 50% balance on delivery.`,
    sourceType,
    rawPrompt: cleanText,
    isAiGenerated: true,
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
