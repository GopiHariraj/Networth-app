import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class OpenAiService {
  private openai: OpenAI;

  constructor() {
    // Only initialize OpenAI if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  async parseExpenseText(text: string): Promise<any> {
    try {
      const apiKey = process.env.OPENAI_API_KEY;

      if (!apiKey) {
        throw new Error(
          'OPENAI_API_KEY is not configured. Please add it to your environment variables.',
        );
      }

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expense extraction assistant. Extract expense information from user text and return ONLY valid JSON.
            
Categories: Groceries, Restaurants, Transport, Fuel, Utilities (DEWA), Rent/EMI, School Fees, Insurance, Self-care, Shopping, Entertainment, Medical, Travel, Misc

Return format:
{
  "items": [
    {
      "date": "YYYY-MM-DD",
      "amount": number,
      "currency": "AED" (or detected currency),
      "category": "one of the categories above",
      "merchant": "string",
      "paymentMethod": "cash" | "bank" | "credit_card",
      "notes": "original text snippet",
      "confidence": 0.0-1.0
    }
  ]
}

If date is relative (today, yesterday), convert to actual date.
If no currency mentioned, assume AED.
Assign appropriate category based on merchant and context.
Confidence: 1.0 for explicit data, 0.7-0.9 for inferred data, 0.5-0.7 for guessed data.`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0].message.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }
      const result = JSON.parse(content);
      return result;
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to parse expense text with AI');
    }
  }
}
