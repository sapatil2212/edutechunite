# Admin Exam Management Operations Guide

## 🎯 Overview

Admins have full CRUD (Create, Read, Update, Delete) access to all exam-related features in the system. This guide covers all available operations and their safety checks.

---

## 📋 Table of Contents

1. [Exam Management](#exam-management)
2. [Exam Timetable Management](#exam-timetable-management)
3. [Safety Checks & Permissions](#safety-checks--permissions)
4. [API Reference](#api-reference)

---

## 1. Exam Management

### **Create Exam**

**UI Path:** Dashboard → Exams → Create Exam

**Features:**
- Set exam name, code, and description
- Choose exam type (Unit Test, Mid-Term, Final, etc.)
- Select target classes
- Configure dates (start/end)
- Set evaluation type (Marks, Grade, Percentage, etc.)
- Configure passing criteria
- Set grading system
- Add instructions

**API Endpoint:**
```http
POST /api/exams
```

**Required Fields:**
- `name` - Exam name
- `academicYearId` - Academic year ID
- `examType` - Type of exam
- `startDate` - Start date
- `endDate` - End date

---

### **View Exam**

**UI Path:** Dashboard → Exams → Click Eye Icon

**Features:**
- View complete exam details
- See all schedules
- View results count
- Check report cards generated
- See academic year and target classes

**API Endpoint:**
```http
GET /api/exams/[examId]
```

**Response Includes:**
- Exam details
- Academic year info
- All schedules with subjects and classes
- Counts (schedules, results, report cards)

---

### **Update Exam**

**UI Path:** Dashboard → Exams → Click Edit Icon

**Features:**
- Modify exam name, code, description
- Change exam type
- Update target classes
- Adjust dates
- Modify evaluation settings
- Update grading system
- Change instructions

**API Endpoint:**
```http
PATCH /api/exams/[examId]
```

**Restrictions:**
- ❌ Cannot update after results are published
- ✅ Can update DRAFT, SCHEDULED, ONGOING exams

**Updatable Fields:**
- `name` - Exam name
- `code` - Exam code
- `description` - Description
- `examType` - Type
- `targetClasses` - Target classes
- `startDate` - Start date
- `endDate` - End date
- `evaluationType` - Evaluation type
- `examMode` - Mode (Offline/Online/Hybrid)
- `overallPassingPercentage` - Passing %
- `subjectWisePassing` - Subject-wise passing
- `gradingSystem` - Grading system
- `showRank` - Show rank flag
- `showPercentage` - Show percentage flag
- `showGrade` - Show grade flag
- `allowMarksCorrection` - Allow corrections
- `correctionDeadline` - Correction deadline
- `weightage` - Weightage
- `instructions` - Instructions

---

### **Delete Exam**

**UI Path:** Dashboard → Exams → Click Delete Icon (Red Trash)

**Features:**
- Permanent deletion of exam
- Confirmation dialog required
- Safety checks enforced

**API Endpoint:**
```http
DELETE /api/exams/[examId]
```

**Safety Checks:**
1. ❌ **Cannot delete if results exist**
   - Error: "Cannot delete exam with existing results. Archive it instead."
   
2. ❌ **Cannot delete if marks entry started**
   - Status: `MARKS_ENTRY_IN_PROGRESS` or `MARKS_ENTRY_COMPLETED`
   - Error: "Cannot delete exam after marks entry has started"

3. ✅ **Can delete if:**
   - Status is `DRAFT` or `SCHEDULED`
   - No results entered
   - No marks entry started

**What Gets Deleted:**
- Exam record
- All schedules (cascading delete)
- Related notifications
- Related hall tickets

**What's Protected:**
- Exams with results
- Exams with marks entry in progress

---

## 2. Exam Timetable Management

### **Create Timetable**

**UI Path:** Dashboard → Exams → Exam Timetable → Create Timetable

**Features:**
- Set exam name and description
- Select academic year and class
- Define start and end dates
- Add multiple exam slots dynamically
- Configure each slot (date, time, subject, supervisor, room)
- Add break slots
- Save as draft or publish immediately

**API Endpoint:**
```http
POST /api/exams/timetable
```

**Required Fields:**
- `academicYearId` - Academic year
- `academicUnitId` - Class/Section
- `examName` - Timetable name
- `startDate` - Start date
- `endDate` - End date
- `slots` - Array of exam slots

**Slot Fields:**
- `slotOrder` - Order number
- `examDate` - Date of exam
- `startTime` - Start time (HH:MM)
- `endTime` - End time (HH:MM)
- `subjectId` - Subject ID (optional for breaks)
- `maxMarks` - Maximum marks
- `minMarks` - Minimum marks
- `supervisorId` - Supervisor teacher ID
- `type` - "EXAM" or "BREAK"
- `room` - Room number
- `instructions` - Special instructions

---

### **View Timetable**

**UI Path:** Dashboard → Exams → Exam Timetable → Click View

**Features:**
- View complete timetable details
- See all exam slots
- Check admit cards generated
- View creator and publisher info
- See notification status

**API Endpoint:**
```http
GET /api/exams/timetable/[timetableId]
```

**Response Includes:**
- Timetable details
- Academic year and unit info
- All slots with subjects and supervisors
- Admit cards count
- Creator and publisher details
- Published date

---

### **Update Timetable**

**UI Path:** Dashboard → Exams → Exam Timetable → Click Edit (Draft only)

**Features:**
- Modify timetable details
- Update exam name and description
- Change dates
- Add/remove/edit slots

**API Endpoint:**
```http
PUT /api/exams/timetable/[timetableId]
```

**Restrictions:**
- ✅ Can only edit DRAFT timetables
- ❌ Cannot edit PUBLISHED timetables

**Updatable Fields:**
- `examName` - Timetable name
- `description` - Description
- `startDate` - Start date
- `endDate` - End date

---

### **Delete Timetable**

**UI Path:** Dashboard → Exams → Exam Timetable → Click Delete (Draft only)

**Features:**
- Permanent deletion of timetable
- Confirmation dialog required
- Safety checks enforced

**API Endpoint:**
```http
DELETE /api/exams/timetable/[timetableId]
```

**Safety Checks:**
1. ❌ **Cannot delete if exam has started**
   - Checks if current date >= start date
   - Error: "Cannot delete timetable after exam has started"

2. ❌ **Cannot delete if published**
   - Status: `PUBLISHED` or `COMPLETED`
   - Must unpublish first

3. ✅ **Can delete if:**
   - Status is `DRAFT`
   - Exam hasn't started yet

**What Gets Deleted:**
- Timetable record
- All exam slots (cascading delete)
- All admit cards (cascading delete)
- All notifications (cascading delete)
- Audit logs remain for tracking

---

### **Publish Timetable**

**UI Path:** Dashboard → Exams → Exam Timetable → Click "Publish & Notify"

**Features:**
- Changes status from DRAFT to PUBLISHED
- Auto-generates admit cards for all students
- Sends notifications to all stakeholders
- Records publisher and publish date

**API Endpoint:**
```http
POST /api/exams/timetable/[timetableId]/publish
```

**What Happens:**
1. **Status Update**: DRAFT → PUBLISHED
2. **Admit Cards**: Auto-generated for all students in the class
3. **Notifications Sent To:**
   - ✅ All students in the class
   - ✅ All parents of those students
   - ✅ All teachers teaching the class
   - ✅ All assigned supervisors
4. **Audit Log**: Complete action logged
5. **Email Notifications**: Sent (if configured)

**Notification Details:**
- Type: `EXAM_TIMETABLE_SCHEDULED`
- Title: "Exam Timetable Published"
- Message: Includes exam name, dates, and instructions
- Channels: In-app, Email, SMS (if configured)

---

## 3. Safety Checks & Permissions

### **Role-Based Access Control**

#### **Admins (SCHOOL_ADMIN, SUPER_ADMIN)**
✅ Create exams and timetables  
✅ View all exams and timetables  
✅ Update exams and timetables  
✅ Delete exams and timetables (with restrictions)  
✅ Publish timetables  
✅ Manage schedules  
✅ Enter marks  
✅ Publish results  

#### **Teachers**
✅ View assigned exams  
✅ Enter marks for their subjects  
✅ View results  
❌ Cannot create/delete exams  
❌ Cannot publish results  

#### **Students**
✅ View published timetables  
✅ Download admit cards  
✅ View results (when published)  
❌ Cannot access admin features  

---

### **Deletion Safety Matrix**

| Entity | Can Delete When | Cannot Delete When |
|--------|----------------|-------------------|
| **Exam** | DRAFT, SCHEDULED, No results | Has results, Marks entry started, RESULTS_PUBLISHED |
| **Timetable** | DRAFT, Before start date | PUBLISHED, After start date, COMPLETED |
| **Schedule** | Before exam date | After exam date, Has results |
| **Results** | DRAFT marks | PUBLISHED results |

---

### **Update Restrictions**

| Entity | Can Update When | Cannot Update When |
|--------|----------------|-------------------|
| **Exam** | DRAFT, SCHEDULED, ONGOING | RESULTS_PUBLISHED |
| **Timetable** | DRAFT | PUBLISHED, COMPLETED |
| **Marks** | Before submission | After verification |
| **Results** | DRAFT | PUBLISHED |

---

## 4. API Reference

### **Exam APIs**

#### **List All Exams**
```http
GET /api/exams
```

**Query Parameters:**
- `academicYearId` (optional) - Filter by academic year
- `status` (optional) - Filter by status

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "exam_id",
      "name": "Mid-Term Exam 2024",
      "code": "MTE2024",
      "examType": "MID_TERM",
      "status": "SCHEDULED",
      "startDate": "2024-03-01T00:00:00Z",
      "endDate": "2024-03-15T00:00:00Z",
      "academicYear": { "name": "2024-2025" },
      "_count": {
        "schedules": 10,
        "results": 0
      }
    }
  ]
}
```

#### **Get Exam Details**
```http
GET /api/exams/[examId]
```

#### **Create Exam**
```http
POST /api/exams
Content-Type: application/json

{
  "name": "Final Exam 2024",
  "code": "FE2024",
  "academicYearId": "year_id",
  "examType": "FINAL",
  "targetClasses": ["class_id_1", "class_id_2"],
  "startDate": "2024-05-01",
  "endDate": "2024-05-20",
  "evaluationType": "MARKS_BASED",
  "examMode": "OFFLINE",
  "overallPassingPercentage": 40,
  "subjectWisePassing": true
}
```

#### **Update Exam**
```http
PATCH /api/exams/[examId]
Content-Type: application/json

{
  "name": "Updated Exam Name",
  "description": "Updated description",
  "startDate": "2024-05-05"
}
```

#### **Delete Exam**
```http
DELETE /api/exams/[examId]
```

---

### **Timetable APIs**

#### **List All Timetables**
```http
GET /api/exams/timetable
```

**Query Parameters:**
- `academicYearId` (optional)
- `academicUnitId` (optional)
- `status` (optional) - DRAFT, PUBLISHED, COMPLETED

#### **Get Timetable Details**
```http
GET /api/exams/timetable/[timetableId]
```

#### **Create Timetable**
```http
POST /api/exams/timetable
Content-Type: application/json

{
  "academicYearId": "year_id",
  "academicUnitId": "class_id",
  "examName": "First Term Exam",
  "description": "First term examination",
  "startDate": "2024-03-01",
  "endDate": "2024-03-15",
  "status": "DRAFT",
  "slots": [
    {
      "slotOrder": 1,
      "examDate": "2024-03-01",
      "startTime": "09:00",
      "endTime": "12:00",
      "subjectId": "subject_id",
      "maxMarks": 100,
      "minMarks": 33,
      "supervisorId": "teacher_id",
      "type": "EXAM",
      "room": "Room 101",
      "instructions": "Bring calculator"
    }
  ]
}
```

#### **Update Timetable**
```http
PUT /api/exams/timetable/[timetableId]
Content-Type: application/json

{
  "examName": "Updated Exam Name",
  "description": "Updated description"
}
```

#### **Delete Timetable**
```http
DELETE /api/exams/timetable/[timetableId]
```

#### **Publish Timetable**
```http
POST /api/exams/timetable/[timetableId]/publish
```

---

## 🔐 Security Features

### **Authentication**
- All endpoints require valid session
- JWT token validation
- School context verification

### **Authorization**
- Role-based access control
- Admin-only operations enforced
- School-level data isolation

### **Audit Logging**
- All create/update/delete operations logged
- User ID and IP address tracked
- Timestamp recorded
- Old and new values stored

### **Data Validation**
- Zod schema validation
- Type checking
- Required field validation
- Date range validation

---

## 📊 Status Flow

### **Exam Status Flow**
```
DRAFT → SCHEDULED → ONGOING → MARKS_ENTRY_IN_PROGRESS → 
MARKS_ENTRY_COMPLETED → RESULTS_PUBLISHED
```

### **Timetable Status Flow**
```
DRAFT → PUBLISHED → ONGOING → COMPLETED
```

---

## ⚠️ Important Notes

1. **Always confirm before deleting** - Deletions are permanent
2. **Check safety restrictions** - Some operations are blocked for data integrity
3. **Use draft mode** - Test configurations before publishing
4. **Verify notifications** - Ensure email service is configured
5. **Monitor audit logs** - Track all administrative actions
6. **Backup before bulk operations** - Protect against accidental data loss

---

## 🆘 Troubleshooting

### **Cannot Delete Exam**
**Problem:** Delete button disabled or error message  
**Solution:** Check if exam has results or marks entry started. Archive instead of delete.

### **Cannot Update Timetable**
**Problem:** Edit button not visible  
**Solution:** Timetable must be in DRAFT status. Unpublish first if needed.

### **Notifications Not Sent**
**Problem:** Publish successful but no notifications  
**Solution:** Check email service configuration in `.env` file.

### **Delete Confirmation Not Showing**
**Problem:** Click delete but nothing happens  
**Solution:** Check browser console for errors. Ensure JavaScript is enabled.

---

## 📞 Support

For issues or questions:
1. Check audit logs for action history
2. Review browser console for errors
3. Verify user permissions
4. Check database constraints

---

**Last Updated:** February 2, 2026  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
