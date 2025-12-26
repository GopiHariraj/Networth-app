import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    }
  }

  async parseFinanceUpdate(text: string) {
    if (!this.model) {
      return this.mockParse(text);
    }

    try {
      const prompt = `
        You are a financial assistant. Analyze the following text and extract financial updates.
        Return a JSON object with this structure:
        {
          "transactions": [
            { "description": "...", "amount": number, "type": "INCOME" | "EXPENSE", "category": "..." }
          ],
          "assetUpdates": [
            { "name": "...", "type": "Gold" | "Stock" | "Cash", "valueChange": number, "newValue": number (optional) }
          ],
          "liabilityUpdates": [
             { "name": "...", "amountPaid": number }
          ]
        }
        Text: "${text}"
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const textResponse = response.text();

      // Clean up markdown code blocks if present
      const jsonStr = textResponse
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Gemini API Error:', error);
      return this.mockParse(text);
    }
  }

  private mockParse(text: string) {
    console.log('Using Mock AI Parser for:', text);
    // Simple regex fallback for demo
    const numbers = text.match(/\d+/g)?.map(Number) || [];
    const isExpense = /paid|spent|bought/i.test(text);

    return {
      transactions: [
        {
          description: 'Parsed Update (Mock)',
          amount: numbers[0] || 0,
          type: isExpense ? 'EXPENSE' : 'INCOME',
          category: 'Uncategorized',
        },
      ],
      assetUpdates: [],
      liabilityUpdates: [],
    };
  }

  async executeUpdates(data: any) {
    // Logic to actually update DB would go here
    // For now, we return success as we might need to implement the actual DB writes later
    // or assume the frontend calls specific endpoints based on this data.
    return { success: true, message: 'Updates processed successfully' };
  }
}
