import { Injectable } from '@nestjs/common';

interface ParsedTransaction {
  type: 'EXPENSE' | 'GOLD' | 'STOCK' | 'BOND';
  amount: number;
  merchant?: string;
  category?: string;
  date: Date;
  description: string;
  source: string;
  // Gold-specific
  weight?: number;
  purity?: string;
  ornamentName?: string;
  // Stock-specific
  stockSymbol?: string;
  units?: number;
  unitPrice?: number;
  market?: string;
  // Bond-specific
  bondName?: string;
  interestRate?: number;
  maturityDate?: string;
}

@Injectable()
export class OpenAIService {
  constructor() {}

  async parseSMS(smsText: string): Promise<ParsedTransaction> {
    console.log('Parsing SMS:', smsText);

    // Detect transaction type based on keywords
    const type = this.detectTransactionType(smsText);

    // Extract amount (common to all)
    const amount = this.extractAmount(smsText);

    // Parse based on type
    switch (type) {
      case 'GOLD':
        return this.parseGoldTransaction(smsText, amount);
      case 'STOCK':
        return this.parseStockTransaction(smsText, amount);
      case 'BOND':
        return this.parseBondTransaction(smsText, amount);
      default:
        return this.parseExpenseTransaction(smsText, amount);
    }
  }

  private detectTransactionType(
    smsText: string,
  ): 'EXPENSE' | 'GOLD' | 'STOCK' | 'BOND' {
    const text = smsText.toLowerCase();

    // Gold keywords
    if (
      text.match(
        /\b(gold|jewel|ornament|necklace|ring|chain|bracelet|24k|22k|18k|karat)\b/i,
      )
    ) {
      return 'GOLD';
    }

    // Stock keywords
    if (
      text.match(
        /\b(stock|share|equity|nasdaq|nyse|bought.*shares|portfolio)\b/i,
      )
    ) {
      return 'STOCK';
    }

    // Bond keywords
    if (
      text.match(/\b(bond|treasury|government bond|corporate bond|maturity)\b/i)
    ) {
      return 'BOND';
    }

    // Default to expense
    return 'EXPENSE';
  }

  private extractAmount(smsText: string): number {
    const amountMatch = smsText.match(
      /(?:Rs\.?|INR|AED|USD|\$|€)\s*([\d,]+(?:\.\d{2})?)/i,
    );
    return amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;
  }

  private parseGoldTransaction(
    smsText: string,
    amount: number,
  ): ParsedTransaction {
    // Extract weight (grams)
    const weightMatch = smsText.match(/([\d.]+)\s*(?:g|grams?|gm)/i);
    const weight = weightMatch ? parseFloat(weightMatch[1]) : 0;

    // Extract purity
    const purityMatch = smsText.match(/\b(24k|22k|18k|14k|10k)\b/i);
    const purity = purityMatch ? purityMatch[1].toUpperCase() : '22K';

    // Extract ornament type
    const ornamentMatch = smsText.match(
      /\b(necklace|ring|chain|bracelet|earring|bangle|coin|bar)\b/i,
    );
    const ornamentName = ornamentMatch ? ornamentMatch[1] : 'Gold Item';

    // Extract merchant
    const merchantMatch = smsText.match(
      /(?:at|from)\s+([A-Za-z\s]+?)(?:\s|$)/i,
    );
    const merchant = merchantMatch ? merchantMatch[1].trim() : 'Gold Shop';

    return {
      type: 'GOLD',
      amount,
      weight,
      purity,
      ornamentName,
      merchant,
      date: new Date(),
      description: `Gold purchase: ${ornamentName} ${weight}g ${purity}`,
      source: 'SMS',
    };
  }

  private parseStockTransaction(
    smsText: string,
    amount: number,
  ): ParsedTransaction {
    // Extract stock symbol
    const symbolMatch = smsText.match(/\b([A-Z]{2,5})\b/);
    const stockSymbol = symbolMatch ? symbolMatch[1] : 'UNKNOWN';

    // Extract units
    const unitsMatch = smsText.match(/([\d.]+)\s*(?:shares?|units?)/i);
    const units = unitsMatch ? parseFloat(unitsMatch[1]) : 1;

    // Calculate unit price
    const unitPrice = units > 0 ? amount / units : amount;

    // Extract market
    const marketMatch = smsText.match(/\b(nasdaq|nyse|dfm|adx|lse|bse|nse)\b/i);
    const market = marketMatch ? marketMatch[1].toUpperCase() : 'NASDAQ';

    return {
      type: 'STOCK',
      amount,
      stockSymbol,
      units,
      unitPrice,
      market,
      date: new Date(),
      description: `Bought ${units} shares of ${stockSymbol} at ${unitPrice}`,
      source: 'SMS',
    };
  }

  private parseBondTransaction(
    smsText: string,
    amount: number,
  ): ParsedTransaction {
    // Extract bond name
    const bondMatch = smsText.match(/(?:in|of)\s+([A-Za-z\s]+?bond)/i);
    const bondName = bondMatch
      ? bondMatch[0].replace(/^(?:in|of)\s+/i, '').trim()
      : 'Bond Investment';

    // Extract interest rate
    const rateMatch = smsText.match(/([\d.]+)%/);
    const interestRate = rateMatch ? parseFloat(rateMatch[1]) : 0;

    // Extract maturity year
    const maturityMatch = smsText.match(/\b(20\d{2})\b/);
    const maturityDate = maturityMatch ? `${maturityMatch[1]}-12-31` : '';

    return {
      type: 'BOND',
      amount,
      bondName,
      interestRate,
      maturityDate,
      date: new Date(),
      description: `Bond investment: ${bondName}`,
      source: 'SMS',
    };
  }

  private parseExpenseTransaction(
    smsText: string,
    amount: number,
  ): ParsedTransaction {
    // Extract merchant
    const merchantMatch = smsText.match(
      /(?:at|to|via)\s+([A-Za-z0-9\s]+?)(?:\son|$|\.)/i,
    );
    const merchant = merchantMatch
      ? merchantMatch[1].trim()
      : 'Unknown Merchant';

    // Random category for demo (in real app, use AI or mapping)
    const categories = ['Food', 'Fuel', 'Grocery', 'Shopping', 'Entertainment'];
    const category = categories[Math.floor(Math.random() * categories.length)];

    return {
      type: 'EXPENSE',
      amount,
      merchant,
      category,
      date: new Date(),
      description: `Spent at ${merchant}`,
      source: 'SMS',
    };
  }
}
