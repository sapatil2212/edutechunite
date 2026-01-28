import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReceiptData {
  receiptNumber: string;
  receiptDate: Date;
  studentName: string;
  admissionNumber: string;
  className: string;
  academicYear: string;
  feeComponents: Array<{
    name: string;
    amount: number;
  }>;
  totalAmount: number;
  discountAmount: number;
  scholarshipAmount: number;
  finalAmount: number;
  amountPaid: number;
  pendingAmount: number;
  paymentMethod: string;
  transactionId?: string;
  collectedBy: string;
  institutionName: string;
  institutionAddress: string;
  institutionPhone: string;
  institutionEmail: string;
  institutionLogo?: string;
}

export async function generatePDFReceipt(data: ReceiptData): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  let yPos = 20;

  if (data.institutionLogo) {
    try {
      doc.addImage(data.institutionLogo, 'PNG', 15, yPos, 30, 30);
      yPos += 10;
    } catch (error) {
      console.error('Error adding logo:', error);
    }
  }

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(data.institutionName, pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(data.institutionAddress, pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;
  doc.text(`Phone: ${data.institutionPhone} | Email: ${data.institutionEmail}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  doc.setLineWidth(0.5);
  doc.line(15, yPos, pageWidth - 15, yPos);
  yPos += 10;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('FEE RECEIPT', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Receipt No: ${data.receiptNumber}`, 15, yPos);
  doc.text(`Date: ${new Date(data.receiptDate).toLocaleDateString()}`, pageWidth - 15, yPos, { align: 'right' });
  yPos += 10;

  doc.setFont('helvetica', 'bold');
  doc.text('Student Details:', 15, yPos);
  yPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${data.studentName}`, 15, yPos);
  yPos += 5;
  doc.text(`Admission No: ${data.admissionNumber}`, 15, yPos);
  doc.text(`Class: ${data.className}`, pageWidth / 2, yPos);
  yPos += 5;
  doc.text(`Academic Year: ${data.academicYear}`, 15, yPos);
  yPos += 10;

  const tableData = data.feeComponents.map(component => [
    component.name,
    `₹${component.amount.toFixed(2)}`
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Fee Component', 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 60, halign: 'right' }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  const summaryData = [
    ['Total Amount', `₹${data.totalAmount.toFixed(2)}`],
    ['Discount', `- ₹${data.discountAmount.toFixed(2)}`],
    ['Scholarship', `- ₹${data.scholarshipAmount.toFixed(2)}`],
    ['Final Amount', `₹${data.finalAmount.toFixed(2)}`],
    ['Amount Paid', `₹${data.amountPaid.toFixed(2)}`],
    ['Pending Amount', `₹${data.pendingAmount.toFixed(2)}`]
  ];

  autoTable(doc, {
    startY: yPos,
    body: summaryData,
    theme: 'plain',
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 120, fontStyle: 'bold' },
      1: { cellWidth: 60, halign: 'right', fontStyle: 'bold' }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  doc.setFont('helvetica', 'bold');
  doc.text('Payment Details:', 15, yPos);
  yPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`Payment Method: ${data.paymentMethod}`, 15, yPos);
  yPos += 5;
  if (data.transactionId) {
    doc.text(`Transaction ID: ${data.transactionId}`, 15, yPos);
    yPos += 5;
  }
  doc.text(`Collected By: ${data.collectedBy}`, 15, yPos);
  yPos += 15;

  doc.setLineWidth(0.3);
  doc.line(15, yPos, pageWidth - 15, yPos);
  yPos += 8;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('This is a computer-generated receipt and does not require a signature.', pageWidth / 2, yPos, { align: 'center' });
  yPos += 4;
  doc.text('Please preserve this receipt for future reference.', pageWidth / 2, yPos, { align: 'center' });

  return doc.output('blob');
}

export async function generateExcelReceipt(data: ReceiptData): Promise<Blob> {
  const rows: string[][] = [];
  
  rows.push([data.institutionName]);
  rows.push([data.institutionAddress]);
  rows.push([`Phone: ${data.institutionPhone} | Email: ${data.institutionEmail}`]);
  rows.push([]);
  rows.push(['FEE RECEIPT']);
  rows.push([]);
  rows.push(['Receipt No:', data.receiptNumber, 'Date:', new Date(data.receiptDate).toLocaleDateString()]);
  rows.push([]);
  rows.push(['Student Details:']);
  rows.push(['Name:', data.studentName]);
  rows.push(['Admission No:', data.admissionNumber, 'Class:', data.className]);
  rows.push(['Academic Year:', data.academicYear]);
  rows.push([]);
  rows.push(['Fee Component', 'Amount']);
  
  data.feeComponents.forEach(component => {
    rows.push([component.name, `₹${component.amount.toFixed(2)}`]);
  });
  
  rows.push([]);
  rows.push(['Total Amount', `₹${data.totalAmount.toFixed(2)}`]);
  rows.push(['Discount', `₹${data.discountAmount.toFixed(2)}`]);
  rows.push(['Scholarship', `₹${data.scholarshipAmount.toFixed(2)}`]);
  rows.push(['Final Amount', `₹${data.finalAmount.toFixed(2)}`]);
  rows.push(['Amount Paid', `₹${data.amountPaid.toFixed(2)}`]);
  rows.push(['Pending Amount', `₹${data.pendingAmount.toFixed(2)}`]);
  rows.push([]);
  rows.push(['Payment Method:', data.paymentMethod]);
  if (data.transactionId) {
    rows.push(['Transaction ID:', data.transactionId]);
  }
  rows.push(['Collected By:', data.collectedBy]);

  const csvContent = rows.map(row => row.join(',')).join('\n');
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

export async function generateWordReceipt(data: ReceiptData): Promise<Blob> {
  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 5px 0; font-size: 12px; }
        .receipt-title { text-align: center; font-size: 20px; font-weight: bold; margin: 20px 0; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 10px; }
        .info-row { display: flex; justify-content: space-between; margin: 5px 0; }
        .section-title { font-weight: bold; margin-top: 20px; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #000; padding: 8px; text-align: left; }
        th { background-color: #2980b9; color: white; }
        .summary { margin-top: 20px; }
        .summary-row { display: flex; justify-content: space-between; padding: 5px 0; }
        .summary-row.total { font-weight: bold; border-top: 2px solid #000; padding-top: 10px; }
        .footer { margin-top: 40px; text-align: center; font-size: 10px; font-style: italic; border-top: 1px solid #000; padding-top: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${data.institutionName}</h1>
        <p>${data.institutionAddress}</p>
        <p>Phone: ${data.institutionPhone} | Email: ${data.institutionEmail}</p>
      </div>
      
      <div class="receipt-title">FEE RECEIPT</div>
      
      <div class="info-row">
        <span><strong>Receipt No:</strong> ${data.receiptNumber}</span>
        <span><strong>Date:</strong> ${new Date(data.receiptDate).toLocaleDateString()}</span>
      </div>
      
      <div class="section-title">Student Details:</div>
      <div class="info-row">
        <span><strong>Name:</strong> ${data.studentName}</span>
      </div>
      <div class="info-row">
        <span><strong>Admission No:</strong> ${data.admissionNumber}</span>
        <span><strong>Class:</strong> ${data.className}</span>
      </div>
      <div class="info-row">
        <span><strong>Academic Year:</strong> ${data.academicYear}</span>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Fee Component</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${data.feeComponents.map(component => `
            <tr>
              <td>${component.name}</td>
              <td style="text-align: right;">₹${component.amount.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="summary">
        <div class="summary-row">
          <span><strong>Total Amount:</strong></span>
          <span>₹${data.totalAmount.toFixed(2)}</span>
        </div>
        <div class="summary-row">
          <span><strong>Discount:</strong></span>
          <span>- ₹${data.discountAmount.toFixed(2)}</span>
        </div>
        <div class="summary-row">
          <span><strong>Scholarship:</strong></span>
          <span>- ₹${data.scholarshipAmount.toFixed(2)}</span>
        </div>
        <div class="summary-row total">
          <span><strong>Final Amount:</strong></span>
          <span>₹${data.finalAmount.toFixed(2)}</span>
        </div>
        <div class="summary-row">
          <span><strong>Amount Paid:</strong></span>
          <span>₹${data.amountPaid.toFixed(2)}</span>
        </div>
        <div class="summary-row">
          <span><strong>Pending Amount:</strong></span>
          <span>₹${data.pendingAmount.toFixed(2)}</span>
        </div>
      </div>
      
      <div class="section-title">Payment Details:</div>
      <div class="info-row">
        <span><strong>Payment Method:</strong> ${data.paymentMethod}</span>
      </div>
      ${data.transactionId ? `
      <div class="info-row">
        <span><strong>Transaction ID:</strong> ${data.transactionId}</span>
      </div>
      ` : ''}
      <div class="info-row">
        <span><strong>Collected By:</strong> ${data.collectedBy}</span>
      </div>
      
      <div class="footer">
        <p>This is a computer-generated receipt and does not require a signature.</p>
        <p>Please preserve this receipt for future reference.</p>
      </div>
    </body>
    </html>
  `;

  return new Blob([htmlContent], { type: 'application/msword' });
}
