export interface FeeComponentInput {
  name: string;
  feeType: string;
  amount: number;
  frequency: string;
  isMandatory: boolean;
  dueDate?: Date;
  allowPartialPayment?: boolean;
  lateFeeApplicable?: boolean;
  lateFeeAmount?: number;
  lateFeePercentage?: number;
  displayOrder?: number;
}

export interface FeeStructureInput {
  name: string;
  description?: string;
  academicYearId: string;
  academicUnitId?: string;
  courseId?: string;
  components: FeeComponentInput[];
}

export interface DiscountInput {
  name: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  reason: string;
  applicableComponents?: string[];
}

export interface PaymentInput {
  amount: number;
  paymentMethod: string;
  transactionId?: string;
  transactionDate?: Date;
  referenceNumber?: string;
  bankName?: string;
  branchName?: string;
  remarks?: string;
}

export class FeeValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FeeValidationError';
  }
}

export function validateFeeStructure(input: FeeStructureInput): void {
  if (!input.name || input.name.trim().length === 0) {
    throw new FeeValidationError('Fee structure name is required');
  }

  if (!input.academicYearId) {
    throw new FeeValidationError('Academic year is required');
  }

  if (!input.components || input.components.length === 0) {
    throw new FeeValidationError('At least one fee component is required');
  }

  input.components.forEach((component, index) => {
    if (!component.name || component.name.trim().length === 0) {
      throw new FeeValidationError(`Fee component ${index + 1}: Name is required`);
    }

    if (!component.feeType) {
      throw new FeeValidationError(`Fee component ${index + 1}: Fee type is required`);
    }

    if (component.amount === undefined || component.amount === null || component.amount < 0) {
      throw new FeeValidationError(`Fee component ${index + 1}: Valid amount is required`);
    }

    if (!component.frequency) {
      throw new FeeValidationError(`Fee component ${index + 1}: Frequency is required`);
    }

    if (component.lateFeeApplicable) {
      if (!component.lateFeeAmount && !component.lateFeePercentage) {
        throw new FeeValidationError(`Fee component ${index + 1}: Late fee amount or percentage is required when late fee is applicable`);
      }
    }
  });
}

export function validateDiscount(input: DiscountInput, totalAmount: number): number {
  if (!input.name || input.name.trim().length === 0) {
    throw new FeeValidationError('Discount name is required');
  }

  if (!input.reason || input.reason.trim().length === 0) {
    throw new FeeValidationError('Discount reason is required');
  }

  if (!input.discountType) {
    throw new FeeValidationError('Discount type is required');
  }

  if (input.discountValue === undefined || input.discountValue === null || input.discountValue < 0) {
    throw new FeeValidationError('Valid discount value is required');
  }

  let discountAmount = 0;

  if (input.discountType === 'PERCENTAGE') {
    if (input.discountValue > 100) {
      throw new FeeValidationError('Discount percentage cannot exceed 100%');
    }
    discountAmount = (totalAmount * input.discountValue) / 100;
  } else {
    if (input.discountValue > totalAmount) {
      throw new FeeValidationError('Discount amount cannot exceed total fee amount');
    }
    discountAmount = input.discountValue;
  }

  return discountAmount;
}

export function validatePayment(input: PaymentInput, balanceAmount: number): void {
  if (input.amount === undefined || input.amount === null || input.amount <= 0) {
    throw new FeeValidationError('Valid payment amount is required');
  }

  if (input.amount > balanceAmount) {
    throw new FeeValidationError('Payment amount cannot exceed balance amount');
  }

  if (!input.paymentMethod) {
    throw new FeeValidationError('Payment method is required');
  }

  const validPaymentMethods = ['CASH', 'CHEQUE', 'DEMAND_DRAFT', 'BANK_TRANSFER', 'ONLINE', 'UPI', 'CARD', 'NET_BANKING'];
  if (!validPaymentMethods.includes(input.paymentMethod)) {
    throw new FeeValidationError('Invalid payment method');
  }

  if (['CHEQUE', 'DEMAND_DRAFT'].includes(input.paymentMethod) && !input.referenceNumber) {
    throw new FeeValidationError(`Reference number is required for ${input.paymentMethod} payment`);
  }

  if (['BANK_TRANSFER', 'ONLINE', 'UPI', 'CARD', 'NET_BANKING'].includes(input.paymentMethod) && !input.transactionId) {
    throw new FeeValidationError(`Transaction ID is required for ${input.paymentMethod} payment`);
  }
}

export function calculateFeeBreakdown(
  components: Array<{ amount: number }>,
  discountAmount: number = 0,
  scholarshipAmount: number = 0,
  taxPercentage: number = 0
): {
  totalAmount: number;
  discountAmount: number;
  scholarshipAmount: number;
  taxAmount: number;
  finalAmount: number;
} {
  const totalAmount = components.reduce((sum, component) => sum + component.amount, 0);
  const subtotal = totalAmount - discountAmount - scholarshipAmount;
  const taxAmount = (subtotal * taxPercentage) / 100;
  const finalAmount = subtotal + taxAmount;

  return {
    totalAmount,
    discountAmount,
    scholarshipAmount,
    taxAmount,
    finalAmount: Math.max(0, finalAmount)
  };
}

export function generateReceiptNumber(prefix: string, currentNumber: number): string {
  const paddedNumber = String(currentNumber).padStart(6, '0');
  return `${prefix}${paddedNumber}`;
}

export function generateInvoiceNumber(prefix: string, currentNumber: number): string {
  const paddedNumber = String(currentNumber).padStart(6, '0');
  return `${prefix}${paddedNumber}`;
}

export function isOverdue(dueDate: Date): boolean {
  return new Date() > new Date(dueDate);
}

export function calculateLateFee(
  amount: number,
  dueDate: Date,
  lateFeeType: 'FIXED' | 'PERCENTAGE',
  lateFeeValue: number,
  graceDays: number = 0
): number {
  const today = new Date();
  const due = new Date(dueDate);
  
  const graceEndDate = new Date(due);
  graceEndDate.setDate(graceEndDate.getDate() + graceDays);

  if (today <= graceEndDate) {
    return 0;
  }

  if (lateFeeType === 'FIXED') {
    return lateFeeValue;
  } else {
    return (amount * lateFeeValue) / 100;
  }
}
