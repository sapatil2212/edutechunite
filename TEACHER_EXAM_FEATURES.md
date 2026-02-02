# Teacher Exam Features - Complete Guide

## Overview
Teachers have access to exam-related features for managing exam schedules, entering marks, and viewing results for their assigned subjects and classes.

---

## 📋 Available Features

### 1. **Exam Schedule** (`/dashboard/teacher/exams/schedule`)
View all exam schedules assigned to the teacher.

**Features:**
- ✅ View upcoming and past exam schedules
- ✅ Filter by exam status (all, upcoming, completed)
- ✅ See exam details (date, time, room, subject, class)
- ✅ View marks entry status
- ✅ Navigate to marks entry page

**API Endpoint:** `GET /api/teacher/exam-schedules`

**Access:** Teachers can only see schedules for:
- Subjects they teach
- Classes they are assigned to

---

### 2. **Marks Entry** (`/dashboard/teacher/exams/marks-entry`)
Enter and manage student marks for assigned exams.

**Features:**
- ✅ Enter marks for each student
- ✅ Mark students as absent
- ✅ Save as draft
- ✅ Submit final marks
- ✅ Lock marks after submission
- ✅ Validation for marks (0 to max marks)

**API Endpoints:**
- `GET /api/teacher/exam-schedules/[scheduleId]/students` - Get student list
- `POST /api/teacher/exam-schedules/[scheduleId]/marks` - Save marks (draft)
- `POST /api/teacher/exam-schedules/[scheduleId]/submit` - Submit final marks
- `POST /api/teacher/exam-schedules/[scheduleId]/lock` - Lock marks

**Access:** Teachers can only enter marks for:
- Exams they are assigned to
- Subjects they teach

**Validation:**
- Marks must be between 0 and maxMarks
- Cannot edit after marks are locked
- Cannot submit without entering all marks (unless absent)

---

### 3. **Exam Results** (`/dashboard/teacher/exams/results`)
View exam results and analytics for assigned subjects.

**Features:**
- ✅ View result statistics (pass/fail/absent)
- ✅ See average, highest, lowest marks
- ✅ View pass percentage
- ✅ Filter by exam and subject
- ✅ Download result reports

**API Endpoint:** `GET /api/teacher/exam-results`

**Statistics Shown:**
- Total students
- Students appeared
- Students passed/failed
- Absent students
- Average marks
- Highest/lowest marks
- Pass percentage

---

## 🔐 Role-Based Access Control

### Teacher Permissions
| Feature | Access Level |
|---------|-------------|
| View Exam Schedules | ✅ Own subjects only |
| Enter Marks | ✅ Assigned exams only |
| View Results | ✅ Own subjects only |
| Create Exams | ❌ Admin only |
| Create Timetables | ❌ Admin only |
| Publish Results | ❌ Admin only |

---

## 📱 Navigation

### From Teacher Dashboard:
```
Dashboard → Exams → [Select Feature]
├── Schedule (View exam schedule)
├── Marks Entry (Enter student marks)
└── Results (View exam results)
```

### Direct URLs:
- Schedule: `http://localhost:3002/dashboard/teacher/exams/schedule`
- Marks Entry: `http://localhost:3002/dashboard/teacher/exams/marks-entry?scheduleId=xxx`
- Results: `http://localhost:3002/dashboard/teacher/exams/results`

---

## 🔄 Workflow

### Marks Entry Workflow:
1. **View Schedule** → Teacher sees assigned exam schedules
2. **Select Exam** → Click on exam to enter marks
3. **Enter Marks** → Fill in marks for each student
4. **Save Draft** → Save progress (can edit later)
5. **Submit** → Submit final marks (cannot edit)
6. **Lock** → Admin locks marks (permanent)

### Status Flow:
```
PENDING → DRAFT → SUBMITTED → LOCKED
```

---

## 🛠️ API Reference

### Teacher Exam APIs

#### 1. Get Exam Schedules
```http
GET /api/teacher/exam-schedules
```

**Response:**
```json
{
  "success": true,
  "schedules": [
    {
      "id": "schedule_id",
      "examDate": "2026-02-15",
      "startTime": "10:00",
      "endTime": "12:00",
      "maxMarks": 100,
      "passingMarks": 33,
      "marksEntryStatus": "PENDING",
      "subject": { "name": "Mathematics", "code": "MATH101" },
      "academicUnit": { "name": "Class 10-A" },
      "exam": { "name": "Mid Term", "status": "ACTIVE" }
    }
  ]
}
```

#### 2. Get Students for Marks Entry
```http
GET /api/teacher/exam-schedules/[scheduleId]/students
```

**Response:**
```json
{
  "success": true,
  "schedule": { /* schedule details */ },
  "students": [
    {
      "id": "student_id",
      "fullName": "John Doe",
      "admissionNumber": "2024001",
      "rollNumber": "1",
      "result": {
        "marksObtained": 85,
        "isAbsent": false,
        "isDraft": true
      }
    }
  ]
}
```

#### 3. Save Marks (Draft)
```http
POST /api/teacher/exam-schedules/[scheduleId]/marks
Content-Type: application/json

{
  "marks": [
    {
      "studentId": "student_id",
      "marksObtained": 85,
      "isAbsent": false
    }
  ],
  "isDraft": true
}
```

#### 4. Submit Final Marks
```http
POST /api/teacher/exam-schedules/[scheduleId]/submit
Content-Type: application/json

{
  "marks": [
    {
      "studentId": "student_id",
      "marksObtained": 85,
      "isAbsent": false
    }
  ]
}
```

#### 5. Get Exam Results
```http
GET /api/teacher/exam-results
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "id": "result_id",
      "exam": { "name": "Mid Term", "code": "MT2026" },
      "subject": { "name": "Mathematics", "code": "MATH101" },
      "academicUnit": { "name": "Class 10-A" },
      "stats": {
        "totalStudents": 40,
        "appeared": 38,
        "passed": 32,
        "failed": 6,
        "absent": 2,
        "averageMarks": 68.5,
        "highestMarks": 98,
        "lowestMarks": 25,
        "passPercentage": 84.21
      }
    }
  ]
}
```

---

## ✅ Current Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Exam Schedule Page | ✅ Implemented | Fully functional |
| Marks Entry Page | ✅ Implemented | Fully functional |
| Results Page | ✅ Implemented | Fully functional |
| Schedule API | ✅ Implemented | Working |
| Marks Entry API | ✅ Implemented | Working |
| Results API | ✅ Implemented | Working |
| Role-Based Access | ✅ Implemented | Teachers see only their data |

---

## 🚀 Testing

### Test as Teacher:
1. Login as teacher role
2. Navigate to `/dashboard/teacher/exams/schedule`
3. Verify you see only your assigned exam schedules
4. Click on an exam to enter marks
5. Enter marks for students
6. Save as draft
7. Submit final marks
8. View results in results page

### Test URLs (Port 3002):
- Schedule: `http://localhost:3002/dashboard/teacher/exams/schedule`
- Results: `http://localhost:3002/dashboard/teacher/exams/results`

---

## 📝 Notes

### What Teachers CAN Do:
- ✅ View their assigned exam schedules
- ✅ Enter marks for their subjects
- ✅ View results for their subjects
- ✅ Download result reports
- ✅ Save marks as draft before submitting

### What Teachers CANNOT Do:
- ❌ Create or edit exams
- ❌ Create or edit exam timetables
- ❌ View other teachers' exams
- ❌ Edit marks after submission
- ❌ Publish exam results
- ❌ Delete exams or schedules

### Security:
- All APIs verify teacher authentication
- Teachers can only access their assigned subjects/classes
- Marks cannot be edited after submission
- Only admins can lock/unlock marks

---

## 🐛 Troubleshooting

### Issue: Teacher cannot see exam schedules
**Solution:** Verify teacher is assigned to subjects and classes in the system.

### Issue: Cannot enter marks
**Solution:** Check if marks entry status is PENDING or DRAFT. Cannot edit if SUBMITTED or LOCKED.

### Issue: API returns 403 Forbidden
**Solution:** Verify teacher is logged in and has correct role. Check if teacher is assigned to the exam.

### Issue: Marks validation error
**Solution:** Ensure marks are between 0 and maxMarks. Check if student is marked as absent.

---

## 📞 Support

For issues or questions:
1. Check this documentation
2. Verify teacher role and assignments
3. Check API logs for errors
4. Contact system administrator

---

**Last Updated:** February 2, 2026
**Version:** 1.0.0
