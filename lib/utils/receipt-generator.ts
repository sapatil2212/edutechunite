import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ReceiptData {
  receiptNumber: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  academicYear: string;
  paymentDate: Date;
  paymentMethod: string;
  transactionId?: string;
  feeComponents: Array<{
    name: string;
    amount: number;
  }>;
  totalAmount: number;
  discountAmount: number;
  amountPaid: number;
  balanceAmount: number;
  institutionName: string;
  institutionAddress?: string;
  institutionPhone?: string;
  institutionEmail?: string;
  collectedBy: string;
}

export function generateReceiptPDF(data: ReceiptData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(data.institutionName, pageWidth / 2, 20, { align: 'center' });
  
  if (data.institutionAddress) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(data.institutionAddress, pageWidth / 2, 28, { align: 'center' });
  }
  
  if (data.institutionPhone || data.institutionEmail) {
    const contact = [data.institutionPhone, data.institutionEmail].filter(Boolean).join(' | ');
    doc.text(contact, pageWidth / 2, 34, { align: 'center' });
  }
  
  // Receipt Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('FEE RECEIPT', pageWidth / 2, 45, { align: 'center' });
  
  // Receipt Number and Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Receipt No: ${data.receiptNumber}`, 20, 55);
  doc.text(`Date: ${formatDate(data.paymentDate)}`, pageWidth - 20, 55, { align: 'right' });
  
  // Student Details
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Student Details:', 20, 65);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Name: ${data.studentName}`, 20, 72);
  doc.text(`Admission No: ${data.admissionNumber}`, 20, 79);
  doc.text(`Class: ${data.className}`, 20, 86);
  doc.text(`Academic Year: ${data.academicYear}`, 20, 93);
  
  // Fee Details Table
  const tableData = data.feeComponents.map(comp => [
    comp.name,
    formatCurrency(comp.amount)
  ]);
  
  (doc as any).autoTable({
    startY: 105,
    head: [['Fee Component', 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 50, halign: 'right' }
    }
  });
  
  // Summary
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFont('helvetica', 'normal');
  doc.text('Total Amount:', pageWidth - 90, finalY);
  doc.text(formatCurrency(data.totalAmount), pageWidth - 20, finalY, { align: 'right' });
  
  if (data.discountAmount > 0) {
    doc.text('Discount:', pageWidth - 90, finalY + 7);
    doc.setTextColor(0, 150, 0);
    doc.text(`- ${formatCurrency(data.discountAmount)}`, pageWidth - 20, finalY + 7, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  }
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  const netY = data.discountAmount > 0 ? finalY + 14 : finalY + 7;
  doc.text('Amount Paid:', pageWidth - 90, netY);
  doc.text(formatCurrency(data.amountPaid), pageWidth - 20, netY, { align: 'right' });
  
  if (data.balanceAmount > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(255, 100, 0);
    doc.text('Balance Due:', pageWidth - 90, netY + 7);
    doc.text(formatCurrency(data.balanceAmount), pageWidth - 20, netY + 7, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  }
  
  // Payment Details
  const paymentY = netY + 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Payment Details:', 20, paymentY);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Payment Method: ${data.paymentMethod}`, 20, paymentY + 7);
  if (data.transactionId) {
    doc.text(`Transaction ID: ${data.transactionId}`, 20, paymentY + 14);
  }
  doc.text(`Collected By: ${data.collectedBy}`, 20, paymentY + (data.transactionId ? 21 : 14));
  
  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 30;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text('This is a computer-generated receipt and does not require a signature.', pageWidth / 2, footerY, { align: 'center' });
  doc.text('Please keep this receipt for your records.', pageWidth / 2, footerY + 5, { align: 'center' });
  
  // Watermark
  doc.setFontSize(50);
  doc.setTextColor(200, 200, 200);
  doc.setFont('helvetica', 'bold');
  doc.text('PAID', pageWidth / 2, doc.internal.pageSize.getHeight() / 2, { 
    align: 'center',
    angle: 45
  });
  
  return doc;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
