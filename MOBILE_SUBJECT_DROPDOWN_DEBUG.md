# Mobile App Subject Dropdown - Debug Guide

## Issue

Subject dropdown is not showing subjects assigned to the teacher when creating an assignment.

## Debug Steps Added

I've added console logging to track the data flow. Now run the mobile app and check the browser console:

### 1. Run Mobile App
```bash
flutter run
# Select Chrome
```

### 2. Open Browser Console
- Press F12 in Chrome
- Go to Console tab

### 3. Test Subject Dropdown
1. Login as teacher
2. Navigate to Create Assignment
3. **Check console for:** `Teacher Classes Response: {...}`
   - This shows what the API returned
4. Select a class from the dropdown
5. **Check console for:**
   - `Selected Class ID: xxx`
   - `Teacher Classes List: [...]`
   - `Found Teacher Class: {...}`
   - `Subjects from teacher class: [...]` OR `No subjects found for this class`

## What to Look For

### Expected Data Structure

The teacher classes API should return:
```json
{
  "success": true,
  "data": {
    "classTeacherClasses": [
      {
        "id": "class-id",
        "name": "Class 1 - Section A",
        "type": "CLASS",
        "studentCount": 10,
        "role": "CLASS_TEACHER"
      }
    ],
    "subjectTeacherClasses": [
      {
        "id": "class-id",
        "name": "Class 1 - Section A",
        "type": "CLASS",
        "studentCount": 10,
        "subjects": [
          {"id": "sub-1", "name": "Mathematics", "code": "MATH", "color": "#3B82F6"},
          {"id": "sub-2", "name": "Science", "code": "SCI", "color": "#10B981"}
        ],
        "role": "SUBJECT_TEACHER"
      }
    ],
    "academicYear": "2026-2027"
  }
}
```

### Key Points

1. **Class Teacher Classes** - Don't have subjects (teacher is class teacher, not subject teacher)
2. **Subject Teacher Classes** - Have `subjects` array with assigned subjects
3. The mobile app combines both lists into `_teacherClasses`

## Possible Issues

### Issue 1: No Subject Teacher Classes
If console shows:
```
subjectTeacherClasses: []
```

**Cause:** Teacher is not assigned to teach any subjects
**Solution:** Assign teacher to subjects in the admin panel

### Issue 2: Subjects Array is Empty
If console shows:
```
Found Teacher Class: {id: xxx, name: xxx, subjects: []}
```

**Cause:** Class exists but no subjects assigned to teacher for that class
**Solution:** Check teacher-subject assignments in database

### Issue 3: Wrong Class Selected
If console shows:
```
Found Teacher Class: null
```

**Cause:** Selected class ID doesn't match any teacher class ID
**Solution:** The regular classes list and teacher classes list have different IDs

## Expected Behavior

When teacher selects a class:
1. If teacher is **only class teacher** for that class → No subjects (can't create assignment)
2. If teacher is **subject teacher** for that class → Subjects dropdown shows assigned subjects
3. If teacher is **both** → Subjects dropdown shows assigned subjects

## Next Steps Based on Console Output

### If you see subjects in the data but dropdown is empty:
- Issue is in the UI rendering
- Check if `_subjects` state is being set correctly

### If you don't see subjects in the API response:
- Issue is in the backend
- Check teacher-subject assignments in database
- Verify `/api/institution/teachers/my-classes` endpoint

### If class IDs don't match:
- Issue is in how we're matching classes
- May need to use a different matching strategy

## Share Console Output

After testing, share the console output so we can identify the exact issue.
