import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { hallTicketId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { hallTicketId } = params;

    // Fetch hall ticket with all details
    const hallTicket = await prisma.examHallTicket.findUnique({
      where: { id: hallTicketId },
      include: {
        student: {
          include: {
            academicUnit: true,
            academicYear: true,
          },
        },
        exam: {
          include: {
            schedules: {
              where: {
                academicUnitId: {
                  equals: prisma.examHallTicket.fields.student.fields.academicUnitId,
                },
              },
              include: {
                subject: true,
              },
              orderBy: {
                examDate: "asc",
              },
            },
          },
        },
        school: {
          select: {
            name: true,
            logo: true,
            address: true,
            city: true,
            state: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    if (!hallTicket) {
      return NextResponse.json({ error: "Hall ticket not found" }, { status: 404 });
    }

    // Verify student access
    if (session.user.role === "STUDENT") {
      const student = await prisma.student.findFirst({
        where: {
          userId: session.user.id,
          id: hallTicket.studentId,
        },
      });

      if (!student) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Track download
    await prisma.examHallTicket.update({
      where: { id: hallTicketId },
      data: {
        isDownloaded: true,
        downloadedAt: new Date(),
        downloadCount: {
          increment: 1,
        },
      },
    });

    // Generate HTML for PDF (A4 format)
    const html = generateAdmitCardHTML(hallTicket);

    // Return HTML that can be converted to PDF on client side
    // Or use a PDF generation library like puppeteer/jsPDF
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="admit-card-${hallTicket.hallTicketNumber}.html"`,
      },
    });
  } catch (error) {
    console.error("Error downloading hall ticket:", error);
    return NextResponse.json(
      { error: "Failed to download hall ticket" },
      { status: 500 }
    );
  }
}

function generateAdmitCardHTML(hallTicket: any): string {
  const student = hallTicket.student;
  const exam = hallTicket.exam;
  const school = hallTicket.school;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Admit Card - ${hallTicket.hallTicketNumber}</title>
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', sans-serif;
      width: 210mm;
      height: 297mm;
      padding: 15mm;
      background: white;
    }
    
    .admit-card {
      border: 3px solid #2563eb;
      padding: 20px;
      height: 100%;
      position: relative;
    }
    
    .header {
      text-align: center;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    
    .school-logo {
      width: 80px;
      height: 80px;
      margin: 0 auto 10px;
    }
    
    .school-name {
      font-size: 24px;
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 5px;
    }
    
    .school-address {
      font-size: 12px;
      color: #666;
      margin-bottom: 3px;
    }
    
    .admit-card-title {
      font-size: 20px;
      font-weight: bold;
      color: #2563eb;
      margin-top: 15px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    
    .content {
      display: flex;
      gap: 20px;
      margin-top: 20px;
    }
    
    .left-section {
      flex: 1;
    }
    
    .right-section {
      width: 150px;
      text-align: center;
    }
    
    .student-photo {
      width: 140px;
      height: 160px;
      border: 2px solid #2563eb;
      object-fit: cover;
      margin-bottom: 10px;
    }
    
    .info-section {
      margin-bottom: 20px;
    }
    
    .section-title {
      font-size: 14px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 1px solid #ddd;
    }
    
    .info-row {
      display: flex;
      padding: 8px 0;
      border-bottom: 1px dotted #ddd;
    }
    
    .info-label {
      width: 180px;
      font-weight: 600;
      color: #333;
    }
    
    .info-value {
      flex: 1;
      color: #666;
    }
    
    .exam-schedule-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    
    .exam-schedule-table th {
      background: #2563eb;
      color: white;
      padding: 10px;
      text-align: left;
      font-size: 12px;
    }
    
    .exam-schedule-table td {
      padding: 8px 10px;
      border: 1px solid #ddd;
      font-size: 11px;
    }
    
    .exam-schedule-table tr:nth-child(even) {
      background: #f9fafb;
    }
    
    .instructions {
      margin-top: 20px;
      padding: 15px;
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
    }
    
    .instructions-title {
      font-weight: bold;
      color: #92400e;
      margin-bottom: 8px;
    }
    
    .instructions ul {
      margin-left: 20px;
      color: #78350f;
      font-size: 11px;
    }
    
    .instructions li {
      margin-bottom: 5px;
    }
    
    .footer {
      position: absolute;
      bottom: 20px;
      left: 20px;
      right: 20px;
      display: flex;
      justify-content: space-between;
      padding-top: 15px;
      border-top: 2px solid #2563eb;
    }
    
    .signature {
      text-align: center;
    }
    
    .signature-line {
      width: 150px;
      border-top: 1px solid #333;
      margin-top: 40px;
      padding-top: 5px;
      font-size: 11px;
      color: #666;
    }
    
    .qr-code {
      width: 100px;
      height: 100px;
      border: 1px solid #ddd;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: #999;
    }
    
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 80px;
      color: rgba(37, 99, 235, 0.05);
      font-weight: bold;
      z-index: -1;
      pointer-events: none;
    }
    
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      
      .admit-card {
        page-break-after: always;
      }
    }
  </style>
</head>
<body>
  <div class="admit-card">
    <div class="watermark">ADMIT CARD</div>
    
    <!-- Header -->
    <div class="header">
      ${school.logo ? `<img src="${school.logo}" alt="School Logo" class="school-logo" />` : ''}
      <div class="school-name">${school.name}</div>
      <div class="school-address">${school.address}, ${school.city}, ${school.state}</div>
      <div class="school-address">Phone: ${school.phone} | Email: ${school.email}</div>
      <div class="admit-card-title">Examination Admit Card</div>
    </div>
    
    <!-- Content -->
    <div class="content">
      <div class="left-section">
        <!-- Student Information -->
        <div class="info-section">
          <div class="section-title">Student Information</div>
          <div class="info-row">
            <div class="info-label">Admit Card Number:</div>
            <div class="info-value"><strong>${hallTicket.hallTicketNumber}</strong></div>
          </div>
          <div class="info-row">
            <div class="info-label">Student Name:</div>
            <div class="info-value"><strong>${student.fullName}</strong></div>
          </div>
          <div class="info-row">
            <div class="info-label">Admission Number:</div>
            <div class="info-value">${student.admissionNumber}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Roll Number:</div>
            <div class="info-value">${student.rollNumber || 'N/A'}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Class/Section:</div>
            <div class="info-value">${student.academicUnit.name}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Date of Birth:</div>
            <div class="info-value">${new Date(student.dateOfBirth).toLocaleDateString()}</div>
          </div>
        </div>
        
        <!-- Exam Information -->
        <div class="info-section">
          <div class="section-title">Examination Information</div>
          <div class="info-row">
            <div class="info-label">Examination Name:</div>
            <div class="info-value"><strong>${exam.name}</strong></div>
          </div>
          <div class="info-row">
            <div class="info-label">Exam Code:</div>
            <div class="info-value">${exam.code}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Exam Period:</div>
            <div class="info-value">${new Date(exam.startDate).toLocaleDateString()} to ${new Date(exam.endDate).toLocaleDateString()}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Exam Center:</div>
            <div class="info-value"><strong>${hallTicket.examCenter}</strong></div>
          </div>
          <div class="info-row">
            <div class="info-label">Room Number:</div>
            <div class="info-value">${hallTicket.roomNumber || 'N/A'}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Seat Number:</div>
            <div class="info-value"><strong>${hallTicket.seatNumber}</strong></div>
          </div>
          <div class="info-row">
            <div class="info-label">Reporting Time:</div>
            <div class="info-value"><strong>${new Date(hallTicket.reportingTime).toLocaleTimeString()}</strong></div>
          </div>
        </div>
      </div>
      
      <div class="right-section">
        ${student.profilePhoto 
          ? `<img src="${student.profilePhoto}" alt="Student Photo" class="student-photo" />`
          : `<div class="student-photo" style="display: flex; align-items: center; justify-content: center; background: #f3f4f6; color: #9ca3af;">No Photo</div>`
        }
        <div class="qr-code">
          QR Code<br/>${hallTicket.hallTicketNumber}
        </div>
      </div>
    </div>
    
    <!-- Exam Schedule -->
    <div class="info-section" style="margin-top: 20px;">
      <div class="section-title">Examination Schedule</div>
      <table class="exam-schedule-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Subject</th>
            <th>Time</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          ${exam.schedules.map((schedule: any) => `
            <tr>
              <td>${new Date(schedule.examDate).toLocaleDateString()}</td>
              <td>${schedule.subject.name} (${schedule.subject.code})</td>
              <td>${schedule.startTime} - ${schedule.endTime}</td>
              <td>${schedule.duration || 'N/A'} mins</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    
    <!-- Instructions -->
    <div class="instructions">
      <div class="instructions-title">Important Instructions:</div>
      <ul>
        <li>Students must report to the examination center 30 minutes before the scheduled time.</li>
        <li>Bring this admit card along with a valid photo ID proof.</li>
        <li>Mobile phones, calculators, and electronic devices are strictly prohibited in the examination hall.</li>
        <li>Students must occupy only the allotted seat number mentioned on this admit card.</li>
        <li>Follow all instructions given by the invigilator during the examination.</li>
        <li>Any form of malpractice will lead to cancellation of the examination.</li>
        ${hallTicket.instructions ? `<li>${hallTicket.instructions}</li>` : ''}
      </ul>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <div class="signature">
        <div class="signature-line">Student Signature</div>
      </div>
      <div class="signature">
        <div class="signature-line">Principal/Authorized Signatory</div>
      </div>
    </div>
  </div>
  
  <script>
    // Auto-print on load (optional)
    // window.onload = function() { window.print(); }
  </script>
</body>
</html>
  `;
}
