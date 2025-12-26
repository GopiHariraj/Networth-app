export class CreateTransactionDto {
  amount: number;
  description?: string;
  categoryId?: string;
  source: string; // 'MANUAL' | 'SMS'
  date?: string; // ISO String
  merchant?: string;
  type?: 'INCOME' | 'EXPENSE';
}

export class ParseSmsDto {
  text: string;
}
