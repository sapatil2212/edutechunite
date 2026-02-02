# Student Dashboard Features - Complete Guide

## Overview
Students have access to a comprehensive dashboard for viewing their exam schedules, downloading hall tickets, and checking exam results.

---

## 📋 Available Features

### 1. **My Exams Dashboard** (`/dashboard/student/exams`)
Centralized hub for all exam-related information.

**Features:**
- ✅ View upcoming and completed exams
- ✅ See exam schedules with dates and times
- ✅ Download hall tickets/admit cards
- ✅ View published exam results
- ✅ Tabbed interface for easy navigation

**Tabs Available:**
1. **Upcoming Exams** - Shows scheduled and ongoing exams
2. **Exam Schedule** - Detailed timetable with subjects, dates, and venues
3. **Hall Tickets** - Download admit cards for exams
4. **Results** - View published exam results with grades

---

## 🎯 Feature Details

### **Upcoming Exams Tab**
View all upcoming and ongoing examinations.

**Information Shown:**
- Exam name and code
- Exam type (Mid Term, Final, etc.)
- Start and end dates
- Current status
- View details button

**Statuses:**
- 🟢 SCHEDULED - Exam is scheduled
- 🟡 ONGOING - Exam is currently in progress
- ⚪ COMPLETED - Exam has finished
- 🔵 RESULTS_PUBLISHED - Results are available

---

### **Exam Schedule Tab**
Detailed examination timetable for the student.

**Information Shown:**
- Exam date
- Subject name and code
- Time (start and end)
- Venue (room and center)

**Features:**
- Sortable by date
- Shows only student's class/section schedules
- Real-time updates

---

### **Hall Tickets Tab**
Download official admit cards for examinations.

**Information Shown:**
- Exam name
- Hall ticket number
- Exam center
- Room number
- Seat number
- Reporting time

**Features:**
- ✅ One-click download
- ✅ PDF/HTML format
- ✅ Professional A4 format
- ✅ Includes student photo
- ✅ QR code for verification
- ✅ Complete exam schedule
- ✅ Important instructions

**Hall Ticket Contents:**
- School logo and information
- Student details (name, admission number, roll number, photo)
- Exam information (name, code, dates)
- Venue details (center, room, seat)
- Complete subject-wise schedule
- Important exam instructions
- Signature sections

---

### **Results Tab**
View published examination results.

**Information Shown:**
- Subject name and code
- Marks obtained / Maximum marks
- Percentage
- Grade
- Pass/Fail status

**Features:**
- Color-coded status (Green = Passed, Red = Failed)
- Shows only published results
- Subject-wise breakdown
- Percentage calculation

---

## 🔐 Access Control

### Student Permissions
| Feature | Access Level |
|---------|-------------|
| View Own Exams | ✅ Yes |
| View Own Schedule | ✅ Yes |
| Download Own Hall Tickets | ✅ Yes |
| View Own Results | ✅ Only published |
| View Other Students' Data | ❌ No |
| Edit Exam Data | ❌ No |

**Security:**
- Students can only see their own data
- Results visible only after admin publishes
- Hall tickets available only when generated
- All APIs require authentication

---

## 📱 Navigation

### From Student Dashboard:
```
Dashboard → Exams
├── Upcoming Exams (default tab)
├── Exam Schedule
├── Hall Tickets
└── Results
```

### Direct URL:
```
http://localhost:3002/dashboard/student/exams
```

---

## 🛠️ API Reference

### Student Exam APIs

#### 1. Get Student Exams
```http
GET /api/student/exams
```

**Authentication:** Required (Student role)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "exam_id",
      "name": "Mid Term Examination",
      "code": "MTE2026",
      "examType": "MID_TERM",
      "startDate": "2026-02-15",
      "endDate": "2026-02-25",
      "status": "SCHEDULED"
    }
  ]
}
```

**Filters:**
- Only exams for student's academic year
- Only exams targeting student's class
- Statuses: SCHEDULED, ONGOING, COMPLETED, RESULTS_PUBLISHED

---

#### 2. Get Exam Schedules
```http
GET /api/student/exam-schedules
```

**Authentication:** Required (Student role)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "schedule_id",
      "examDate": "2026-02-15",
      "startTime": "10:00",
      "endTime": "12:00",
      "room": "Room 101",
      "center": "Main Building",
      "subject": {
        "name": "Mathematics",
        "code": "MATH101"
      },
      "exam": {
        "name": "Mid Term",
        "code": "MTE2026"
      }
    }
  ]
}
```

**Filters:**
- Only student's class/section
- Only scheduled and ongoing exams
- Ordered by exam date (ascending)

---

#### 3. Get Hall Tickets
```http
GET /api/student/hall-tickets
```

**Authentication:** Required (Student role)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "ticket_id",
      "hallTicketNumber": "HT2026001",
      "examCenter": "Main Campus",
      "roomNumber": "101",
      "seatNumber": "A-15",
      "reportingTime": "2026-02-15T09:00:00Z",
      "isGenerated": true,
      "exam": {
        "name": "Mid Term",
        "code": "MTE2026",
        "startDate": "2026-02-15",
        "endDate": "2026-02-25"
      }
    }
  ]
}
```

**Filters:**
- Only student's hall tickets
- Only generated tickets (isGenerated: true)
- Ordered by creation date (descending)

---

#### 4. Download Hall Ticket
```http
GET /api/student/hall-tickets/[hallTicketId]/download
```

**Authentication:** Required (Student role)

**Response:** HTML document (can be printed as PDF)

**Features:**
- Professional A4 format
- Includes all exam details
- Student photo
- QR code for verification
- Complete schedule table
- Important instructions
- Signature sections

**Tracking:**
- Marks ticket as downloaded
- Records download timestamp
- Increments download count

---

#### 5. Get Exam Results
```http
GET /api/student/exam-results
```

**Authentication:** Required (Student role)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "result_id",
      "marksObtained": 85,
      "percentage": 85.0,
      "grade": "A",
      "isPassed": true,
      "subject": {
        "name": "Mathematics",
        "code": "MATH101"
      },
      "examSchedule": {
        "maxMarks": 100,
        "exam": {
          "name": "Mid Term"
        }
      }
    }
  ]
}
```

**Filters:**
- Only student's results
- Only final results (isDraft: false)
- Only published results (exam status: RESULTS_PUBLISHED)
- Ordered by creation date (descending)

---

## ✅ Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Exams Page | ✅ Implemented | Fully functional |
| Upcoming Exams Tab | ✅ Implemented | Working |
| Schedule Tab | ✅ Implemented | Working |
| Hall Tickets Tab | ✅ Implemented | Working |
| Results Tab | ✅ Implemented | Working |
| Exams API | ✅ Implemented | Fixed prisma import |
| Schedules API | ✅ Implemented | Fixed prisma import |
| Hall Tickets API | ✅ Implemented | Fixed prisma import |
| Download API | ✅ Implemented | Fixed prisma import |
| Results API | ✅ Implemented | Fixed prisma import |

---

## 🔧 Recent Fixes

### Prisma Import Issues (Fixed)
**Problem:** Student APIs were using incorrect prisma import
```typescript
// ❌ Wrong
import { prisma } from "@/lib/prisma";

// ✅ Correct
import prisma from "@/lib/prisma";
```

**Files Fixed:**
- `/api/student/exams/route.ts`
- `/api/student/exam-schedules/route.ts`
- `/api/student/hall-tickets/route.ts`
- `/api/student/exam-results/route.ts`
- `/api/student/hall-tickets/[hallTicketId]/download/route.ts`

---

## 🚀 Testing

### Test as Student:
1. Login as student role
2. Navigate to `/dashboard/student/exams`
3. Verify all tabs load correctly
4. Check upcoming exams display
5. View exam schedule
6. Download hall ticket (if available)
7. View results (if published)

### Test URLs (Port 3002):
- Main Dashboard: `http://localhost:3002/dashboard/student/exams`

### Expected Behavior:
- ✅ All tabs should load without errors
- ✅ Data should be filtered to student's class/year
- ✅ Hall tickets should download as HTML
- ✅ Results should show only published exams
- ✅ No access to other students' data

---

## 🐛 Troubleshooting

### Issue: No exams showing
**Possible Causes:**
- No exams created for student's academic year
- Student not assigned to any class
- Exams not targeting student's class

**Solution:**
- Verify student has academicYearId and academicUnitId
- Check exam targetClasses includes student's class
- Ensure exam status is SCHEDULED or later

---

### Issue: Hall tickets not available
**Possible Causes:**
- Hall tickets not generated by admin
- isGenerated flag is false

**Solution:**
- Admin must generate hall tickets
- Check examHallTicket table for student records
- Verify isGenerated = true

---

### Issue: Results not showing
**Possible Causes:**
- Results not published
- Exam status not RESULTS_PUBLISHED
- Results still in draft mode

**Solution:**
- Admin must publish results
- Change exam status to RESULTS_PUBLISHED
- Ensure isDraft = false for results

---

### Issue: API returns 401 Unauthorized
**Possible Causes:**
- Not logged in
- Session expired
- Wrong user role

**Solution:**
- Login as student
- Refresh session
- Verify user has STUDENT role

---

### Issue: API returns 404 Student not found
**Possible Causes:**
- Student record not created
- userId doesn't match session
- schoolId mismatch

**Solution:**
- Create student record in database
- Link student.userId to user.id
- Verify student.schoolId matches user.schoolId

---

## 📝 Data Flow

### Exam Viewing Flow:
```
Student Login
    ↓
Dashboard → Exams
    ↓
API: GET /api/student/exams
    ↓
Filter by academicYearId + targetClasses
    ↓
Display in Upcoming Exams tab
```

### Hall Ticket Download Flow:
```
Student clicks Download
    ↓
API: GET /api/student/hall-tickets/[id]/download
    ↓
Verify student ownership
    ↓
Generate HTML admit card
    ↓
Track download (isDownloaded, downloadedAt, downloadCount)
    ↓
Return HTML for printing/saving
```

### Results Viewing Flow:
```
Admin publishes results
    ↓
Exam status → RESULTS_PUBLISHED
    ↓
Student navigates to Results tab
    ↓
API: GET /api/student/exam-results
    ↓
Filter: isDraft=false, status=RESULTS_PUBLISHED
    ↓
Display results with grades
```

---

## 🎨 UI Features

### Responsive Design
- ✅ Mobile-friendly layout
- ✅ Tablet optimized
- ✅ Desktop full-width

### **My Subjects** (`/dashboard/student/subjects`)
- View all subjects assigned to student's class
- Subject details (name, code, description, type)
- Weekly periods/credits information
- Assigned teachers for each subject
- Color-coded subject cards
- Elective subject indicators
- Subject type badges (Core, Elective, Language, Activity)

### **All Other Pages**
- Consistent UI with sidebar and header
- Proper dark mode support
- Loading states
- Placeholder content (ready for API integration)
- Responsive design theming

### Accessibility
- ✅ Semantic HTML
- ✅ ARIA labels
- ✅ Keyboard navigation
- ✅ Screen reader friendly

---

## 📞 Support

### For Students:
- Check this documentation first
- Verify you're logged in as student
- Ensure your profile is complete
- Contact school admin if data is missing

### For Administrators:
- Ensure students are properly enrolled
- Generate hall tickets before exam dates
- Publish results after marks entry
- Monitor API logs for errors

---

**Last Updated:** February 2, 2026
**Version:** 1.0.0
**Status:** All features implemented and working
