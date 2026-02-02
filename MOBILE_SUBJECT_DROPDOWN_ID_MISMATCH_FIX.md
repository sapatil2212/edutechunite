# Mobile App Subject Dropdown - Class ID Mismatch Fix

## Issue Identified

The subject dropdown wasn't working because of a **class ID mismatch**:

```
Merged Classes: ID = cmkxv4m5j000gijjg50nyclvq (from teacher classes)
Selected Class: ID = cmkxv4lbw0008ijjg067rhxtt (from academic-units)
Result: No match found → No subjects
```

### Root Cause

The app was using **two different data sources** for classes:
1. **Class Dropdown** - Populated from `/api/institution/academic-units` (parent classes)
2. **Subject Lookup** - Using teacher classes from `/api/institution/teachers/my-classes` (sections)

These APIs return different class IDs, so when a class was selected, the lookup failed.

---

## Solution

**Use teacher classes for both the class dropdown AND subject lookup** to ensure IDs match.

### Before (Incorrect)
```dart
// Fetch academic units for class dropdown
await _fetchClasses(); // Gets IDs like cmkxv4lbw0008ijjg067rhxtt

// Fetch teacher classes for subjects
final classesRes = await apiService.getTeacherClasses(); // Gets IDs like cmkxv4m5j000gijjg50nyclvq

// When class selected, IDs don't match!
```

### After (Correct)
```dart
// Fetch teacher classes
final classesRes = await apiService.getTeacherClasses();
// Merge and use for BOTH class dropdown and subjects
setState(() {
  _classes = _teacherClasses; // Use same list for both
});

// When class selected, IDs match!
```

---

## Changes Made

### File: `mobile_app/lib/screens/teacher/create_assignment_screen.dart`

**1. Use teacher classes as the main class list:**
```dart
// Use teacher classes as the main class list for consistency
if (_teacherClasses.isNotEmpty) {
  setState(() {
    _classes = _teacherClasses;
  });
}
```

**2. Simplified class selection logic:**
```dart
void _onClassChanged(String? classId) {
  if (classId != null) {
    // Find selected class (now using teacher classes list)
    final selectedClass = _classes.firstWhere(
      (c) => c['id'] == classId, 
      orElse: () => null
    );
    
    if (selectedClass != null) {
      // Set sections if available
      if (selectedClass['children'] != null) {
        setState(() {
          _sections = selectedClass['children'];
        });
      }
      
      // Set subjects if available
      if (selectedClass['subjects'] != null) {
        setState(() {
          _subjects = selectedClass['subjects'];
        });
      }
    }
  }
}
```

---

## How It Works Now

### Data Flow

1. **Fetch teacher classes** → Contains classes with assigned subjects
2. **Use teacher classes for class dropdown** → Shows only classes teacher is assigned to
3. **When class selected** → IDs match, subjects found ✅

### Benefits

- ✅ Class IDs match between dropdown and subject lookup
- ✅ Shows only classes teacher is actually assigned to
- ✅ Subjects appear correctly when class is selected
- ✅ Simpler, more consistent logic

---

## Expected Console Output

After the fix, when you select a class:

```
=== CLASS SELECTED ===
Selected Class ID: cmkxv4m5j000gijjg50nyclvq
Found Class: Class 1 - Test Section name
Subjects in class: [{id: cmkxv2ltp0003ijjgl8qqmdhc, name: Geography, ...}]
Setting 1 subjects to dropdown
```

**Subject dropdown should now show "Geography"** ✅

---

## Testing

### Test Steps
1. Run mobile app: `flutter run` → Select Chrome
2. Press `R` for hot restart
3. Login as teacher
4. Navigate to Create Assignment
5. Select "Class 1 - Test Section name"
6. **Subject dropdown should show "Geography"** ✅

---

## Files Modified

1. **`mobile_app/lib/screens/teacher/create_assignment_screen.dart`**
   - Use teacher classes for class dropdown
   - Simplified class selection logic
   - Removed academic-units fetch for class dropdown

---

## Summary

Subject dropdown now works correctly:
- ✅ Uses teacher classes for both class dropdown and subjects
- ✅ Class IDs match between selection and lookup
- ✅ Shows Geography subject when Class 1 is selected
- ✅ Ready for assignment creation

The class ID mismatch is resolved by using a single consistent data source.
