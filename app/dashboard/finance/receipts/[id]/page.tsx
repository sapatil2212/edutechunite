'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ReceiptData {
  receiptNumber: string;
  paymentDate: string;
  paymentMethod: string;
  transactionId: string | null;
  amount: number;
  student: {
    fullName: string;
    admissionNumber: string;
    academicUnit: { name: string; parent?: { name: string } | null };
    academicYear: { name: string };
  };
  studentFee: {
    totalAmount: number;
    discountAmount: number;
    finalAmount: number;
    paidAmount: number;
    balanceAmount: number;
    feeStructure: {
      name: string;
      components: Array<{
        name: string;
        feeType: string;
        amount: number;
        frequency: string;
      }>;
    };
  };
  school: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    email: string;
    logo: string | null;
  };
  collectedBy: string;
}

export default function ReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchReceiptData();
  }, [params.id]);

  const fetchReceiptData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/institution/finance/receipts/${params.id}`);
      const data = await res.json();
      
      if (data.receipt) {
        setReceipt(data.receipt);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching receipt:', error);
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;
    
    setDownloading(true);
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;
      
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`Receipt_${params.id}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Receipt Not Found</h1>
          <p className="text-gray-600 mb-4">The receipt you're looking for doesn't exist.</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const className = receipt.student.academicUnit.parent 
    ? `${receipt.student.academicUnit.parent.name} - ${receipt.student.academicUnit.name}`
    : receipt.student.academicUnit.name;

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:py-0 print:bg-white">
      {/* Action Buttons - Hidden on print */}
      <div className="max-w-4xl mx-auto px-4 mb-6 print:hidden">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.push('/dashboard/students')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button onClick={handleDownloadPDF} disabled={downloading}>
              <Download className="w-4 h-4 mr-2" />
              {downloading ? 'Generating...' : 'Download PDF'}
            </Button>
          </div>
        </div>
      </div>

      {/* Receipt Template */}
      <div className="max-w-4xl mx-auto px-4 print:px-0 print:max-w-none">
        <div 
          ref={receiptRef}
          className="bg-white shadow-lg print:shadow-none"
          style={{ minHeight: '297mm', padding: '20mm' }}
        >
          {/* Header with Logo */}
          <div className="border-b-2 border-gray-800 pb-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {receipt.school.logo ? (
                  <img 
                    src={receipt.school.logo} 
                    alt={receipt.school.name}
                    className="w-20 h-20 object-contain"
                  />
                ) : (
                  <div className="w-20 h-20 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-3xl font-bold text-primary">
                      {receipt.school.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{receipt.school.name}</h1>
                  <p className="text-sm text-gray-600">{receipt.school.address}</p>
                  <p className="text-sm text-gray-600">
                    {receipt.school.city}, {receipt.school.state} - {receipt.school.pincode}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-bold text-gray-900 mb-2">FEE RECEIPT</h2>
                <p className="text-sm text-gray-600">Receipt No: <span className="font-semibold text-gray-900">{receipt.receiptNumber}</span></p>
                <p className="text-sm text-gray-600">Date: <span className="font-semibold text-gray-900">{formatDate(receipt.paymentDate)}</span></p>
              </div>
            </div>
          </div>

          {/* Student Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Student Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Student Name</p>
                <p className="font-semibold text-gray-900">{receipt.student.fullName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Admission Number</p>
                <p className="font-semibold text-gray-900">{receipt.student.admissionNumber}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Class / Section</p>
                <p className="font-semibold text-gray-900">{className}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Academic Year</p>
                <p className="font-semibold text-gray-900">{receipt.student.academicYear.name}</p>
              </div>
            </div>
          </div>

          {/* Fee Details Table */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Fee Details</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-800 text-white">
                  <th className="border border-gray-800 px-4 py-3 text-left text-sm font-semibold">S.No</th>
                  <th className="border border-gray-800 px-4 py-3 text-left text-sm font-semibold">Fee Component</th>
                  <th className="border border-gray-800 px-4 py-3 text-left text-sm font-semibold">Type</th>
                  <th className="border border-gray-800 px-4 py-3 text-left text-sm font-semibold">Frequency</th>
                  <th className="border border-gray-800 px-4 py-3 text-right text-sm font-semibold">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {receipt.studentFee.feeStructure.components.map((component, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-300 px-4 py-3 text-sm">{index + 1}</td>
                    <td className="border border-gray-300 px-4 py-3 text-sm font-medium">{component.name}</td>
                    <td className="border border-gray-300 px-4 py-3 text-sm">{component.feeType}</td>
                    <td className="border border-gray-300 px-4 py-3 text-sm">{component.frequency}</td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-right font-medium">
                      {component.amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100">
                  <td colSpan={4} className="border border-gray-300 px-4 py-3 text-sm font-semibold text-right">
                    Total Fee Amount:
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-sm text-right font-bold">
                    {receipt.studentFee.totalAmount.toLocaleString('en-IN')}
                  </td>
                </tr>
                {receipt.studentFee.discountAmount > 0 && (
                  <tr className="bg-green-50">
                    <td colSpan={4} className="border border-gray-300 px-4 py-3 text-sm font-semibold text-right text-green-700">
                      Discount Applied:
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-right font-bold text-green-700">
                      - {receipt.studentFee.discountAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                )}
                <tr className="bg-gray-200">
                  <td colSpan={4} className="border border-gray-300 px-4 py-3 text-sm font-bold text-right">
                    Net Payable Amount:
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-sm text-right font-bold">
                    {receipt.studentFee.finalAmount.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Payment Details */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-green-800 mb-3 uppercase tracking-wide">Payment Details</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-green-600">Amount Paid</p>
                <p className="text-2xl font-bold text-green-800">{formatCurrency(receipt.amount)}</p>
              </div>
              <div>
                <p className="text-xs text-green-600">Payment Method</p>
                <p className="font-semibold text-green-800">{receipt.paymentMethod}</p>
              </div>
              {receipt.transactionId && (
                <div>
                  <p className="text-xs text-green-600">Transaction ID</p>
                  <p className="font-semibold text-green-800">{receipt.transactionId}</p>
                </div>
              )}
            </div>
            {receipt.studentFee.balanceAmount > 0 && (
              <div className="mt-4 pt-4 border-t border-green-200">
                <p className="text-sm text-orange-700">
                  <span className="font-semibold">Balance Due:</span> {formatCurrency(receipt.studentFee.balanceAmount)}
                </p>
              </div>
            )}
          </div>

          {/* Collected By */}
          <div className="flex justify-between items-end mb-12">
            <div>
              <p className="text-xs text-gray-500">Collected By</p>
              <p className="font-semibold text-gray-900">{receipt.collectedBy}</p>
            </div>
            <div className="text-center">
              <div className="w-40 border-t border-gray-400 pt-2">
                <p className="text-xs text-gray-500">Authorized Signature</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-300 pt-4 mt-auto">
            <div className="flex justify-between items-center text-xs text-gray-500">
              <div>
                <p>This is a computer-generated receipt and does not require a physical signature.</p>
              </div>
              <div className="text-right">
                <p>Phone: {receipt.school.phone}</p>
                <p>Email: {receipt.school.email}</p>
              </div>
            </div>
            <div className="text-center mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-400">
                Thank you for your payment. For any queries, please contact the school office.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
