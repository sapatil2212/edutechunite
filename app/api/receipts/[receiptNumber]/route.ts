import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { receiptNumber: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the payment by receipt number
    const payment = await prisma.payment.findFirst({
      where: {
        receiptNumber: params.receiptNumber,
      },
      include: {
        studentFee: {
          include: {
            feeStructure: {
              select: {
                name: true,
                components: {
                  select: {
                    name: true,
                    feeType: true,
                    amount: true,
                    frequency: true,
                  },
                  orderBy: { displayOrder: "asc" },
                },
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }

    // For students, verify they own this receipt
    if (session.user.role === "STUDENT") {
      const student = await prisma.student.findFirst({
        where: {
          userId: session.user.id,
        },
      });

      if (!student || payment.studentId !== student.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    // Fetch student details
    const student = await prisma.student.findUnique({
      where: { id: payment.studentId },
      select: {
        id: true,
        fullName: true,
        admissionNumber: true,
        academicUnit: {
          select: {
            name: true,
            parent: {
              select: { name: true },
            },
          },
        },
        academicYear: {
          select: { name: true },
        },
      },
    });

    // Get school details
    const school = await prisma.school.findUnique({
      where: { id: payment.schoolId },
      select: {
        name: true,
        address: true,
        city: true,
        state: true,
        pincode: true,
        phone: true,
        email: true,
        logo: true,
      },
    });

    // Get the user who collected the payment
    let collectedByName = "Admin";
    if (payment.recordedBy) {
      const collector = await prisma.user.findUnique({
        where: { id: payment.recordedBy },
        select: { fullName: true },
      });
      if (collector) {
        collectedByName = collector.fullName;
      }
    }

    // Generate PDF HTML
    const receiptHtml = generateReceiptHTML({
      receiptNumber: payment.receiptNumber,
      paymentDate: payment.paidAt?.toISOString() || payment.createdAt.toISOString(),
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId,
      amount: payment.amount,
      student: student,
      studentFee: payment.studentFee,
      school: school || {
        name: "Institution",
        address: "",
        city: "",
        state: "",
        pincode: "",
        phone: "",
        email: "",
        logo: null,
      },
      collectedBy: collectedByName,
    });

    // Return HTML that can be printed as PDF
    return new NextResponse(receiptHtml, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Error generating receipt:", error);
    return NextResponse.json(
      { error: "Failed to generate receipt" },
      { status: 500 }
    );
  }
}

function generateReceiptHTML(data: any) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Fee Receipt - ${data.receiptNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      background: white;
    }
    .receipt {
      max-width: 800px;
      margin: 0 auto;
      border: 2px solid #333;
      padding: 30px;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #333;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
    .school-name {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .school-details {
      font-size: 12px;
      color: #666;
    }
    .receipt-title {
      font-size: 20px;
      font-weight: bold;
      text-align: center;
      margin: 20px 0;
      text-decoration: underline;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 20px;
    }
    .info-item {
      display: flex;
      gap: 10px;
    }
    .info-label {
      font-weight: bold;
      min-width: 120px;
    }
    .info-value {
      flex: 1;
    }
    .amount-section {
      background: #f5f5f5;
      padding: 15px;
      margin: 20px 0;
      border: 1px solid #ddd;
    }
    .amount-row {
      display: flex;
      justify-content: space-between;
      margin: 10px 0;
    }
    .amount-label {
      font-weight: bold;
    }
    .total-amount {
      font-size: 20px;
      font-weight: bold;
      border-top: 2px solid #333;
      padding-top: 10px;
      margin-top: 10px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
    }
    .signature-section {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
    }
    .signature-box {
      text-align: center;
    }
    .signature-line {
      border-top: 1px solid #333;
      width: 200px;
      margin-top: 50px;
      padding-top: 5px;
    }
    @media print {
      body {
        padding: 0;
      }
      .receipt {
        border: none;
      }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div class="school-name">${data.school.name}</div>
      <div class="school-details">
        ${data.school.address ? data.school.address + ", " : ""}
        ${data.school.city ? data.school.city + ", " : ""}
        ${data.school.state ? data.school.state + " - " : ""}
        ${data.school.pincode || ""}<br>
        ${data.school.phone ? "Phone: " + data.school.phone : ""}
        ${data.school.email ? " | Email: " + data.school.email : ""}
      </div>
    </div>

    <div class="receipt-title">FEE RECEIPT</div>

    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Receipt No:</span>
        <span class="info-value">${data.receiptNumber}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Date:</span>
        <span class="info-value">${formatDate(data.paymentDate)}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Student Name:</span>
        <span class="info-value">${data.student?.fullName || "N/A"}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Admission No:</span>
        <span class="info-value">${data.student?.admissionNumber || "N/A"}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Class:</span>
        <span class="info-value">${data.student?.academicUnit?.name || "N/A"}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Academic Year:</span>
        <span class="info-value">${data.student?.academicYear?.name || "N/A"}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Payment Method:</span>
        <span class="info-value">${data.paymentMethod}</span>
      </div>
      ${data.transactionId ? `
      <div class="info-item">
        <span class="info-label">Transaction ID:</span>
        <span class="info-value">${data.transactionId}</span>
      </div>
      ` : ""}
    </div>

    <div class="amount-section">
      <div class="amount-row">
        <span class="amount-label">Fee Structure:</span>
        <span>${data.studentFee?.feeStructure?.name || "N/A"}</span>
      </div>
      <div class="amount-row total-amount">
        <span>Amount Paid:</span>
        <span>${formatCurrency(data.amount)}</span>
      </div>
    </div>

    ${data.studentFee?.feeStructure?.components && data.studentFee.feeStructure.components.length > 0 ? `
    <div style="margin: 20px 0;">
      <strong>Fee Components:</strong>
      <table style="width: 100%; margin-top: 10px; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 1px solid #ddd;">
            <th style="text-align: left; padding: 8px;">Component</th>
            <th style="text-align: left; padding: 8px;">Type</th>
            <th style="text-align: right; padding: 8px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${data.studentFee.feeStructure.components.map((comp: any) => `
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 8px;">${comp.name}</td>
              <td style="padding: 8px;">${comp.feeType}</td>
              <td style="text-align: right; padding: 8px;">${formatCurrency(comp.amount)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
    ` : ""}

    <div class="footer">
      <div style="margin-bottom: 10px;">
        <strong>Collected By:</strong> ${data.collectedBy}
      </div>
      <div style="font-size: 12px; color: #666; margin-top: 20px;">
        This is a computer-generated receipt and does not require a signature.
      </div>
    </div>

    <div class="signature-section">
      <div class="signature-box">
        <div class="signature-line">Student/Parent Signature</div>
      </div>
      <div class="signature-box">
        <div class="signature-line">Authorized Signature</div>
      </div>
    </div>
  </div>

  <script>
    // Auto-print when loaded
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
  `;
}
