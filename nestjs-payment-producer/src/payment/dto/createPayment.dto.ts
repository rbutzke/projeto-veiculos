export class CreatePaymentDto {
  amount: number;
  currency: string;
  description: string;
  clientId: string;
}