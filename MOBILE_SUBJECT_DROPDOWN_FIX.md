# Mobile App Subject Dropdown - Final Fix

## Issue Identified

The subject dropdown wasn't showing subjects because the teacher classes data had **duplicate class IDs** with different roles:

```json
{
  "classTeacherClasses": [
    {
      "id": "cmkxv4m5j000gijjg50nyclvq",  // Same ID
      "name": "Class 1 - Test Section name",
      "role": "CLASS_TEACHER"
      // No subjects
    }
  ],
  "subjectTeacherClasses": [
    {
      "id": "cmkxv4m5j000gijjg50nyclvq",  // Same ID
      "name": "Class 1 - Test Section name",
      "role": "SUBJECT_TEACHER",
      "subjects": [
        {"id": "xxx", "name": "Geography", "code": "G1"}
      ]
    }
  ]
}
```

**Problem:** When we concatenated both arrays, we had two entries for the same class. When selecting the class, `firstWhere()` would find the first match (class teacher entry with no subjects), so the subject dropdown remained empty.

---

## Solution

**Merge classes by ID** and combine their subjects:

### Before (Incorrect)
```dart
// Just concatenate - creates duplicates
final List<dynamic> allClasses = [
  ...(data['classTeacherClasses'] ?? []),
  ...(data['subjectTeacherClasses'] ?? []),
];
// Result: Two entries with same ID, first one has no subjects
```

### After (Correct)
```dart
// Merge by ID and combine subjects
final Map<String, dynamic> classMap = {};

// Add class teacher classes first
for (var cls in (data['classTeacherClasses'] ?? [])) {
  classMap[cls['id']] = {
    ...cls,
    'subjects': <dynamic>[], // Initialize empty subjects
  };
}

// Add/merge subject teacher classes
for (var cls in (data['subjectTeacherClasses'] ?? [])) {
  if (classMap.containsKey(cls['id'])) {
    // Class already exists, add subjects
    classMap[cls['id']]!['subjects'] = cls['subjects'] ?? [];
  } else {
    // New class
    classMap[cls['id']] = cls;
  }
}

final List<dynamic> mergedClasses = classMap.values.toList();
// Result: One entry per class with combined subjects
```

---

## How It Works Now

### Data Flow

1. **API Returns:**
   - Class Teacher Classes (may not have subjects)
   - Subject Teacher Classes (have subjects)
   - Same class can appear in both lists

2. **Mobile App Merges:**
   - Creates a map with class ID as key
   - Adds class teacher classes first (with empty subjects)
   - Merges subject teacher classes (adds subjects to existing entry)
   - Converts map to list

3. **Result:**
   - One entry per unique class
   - Each entry has all assigned subjects
   - No duplicates

### Example

**Input:**
```
classTeacherClasses: [Class A (no subjects)]
subjectTeacherClasses: [Class A (Geography, Math)]
```

**Output:**
```
mergedClasses: [Class A (Geography, Math)]
```

---

## Changes Made

### File: `mobile_app/lib/screens/teacher/create_assignment_screen.dart`

**1. Replaced simple concatenation with merge logic:**
```dart
// Merge classes by ID and combine subjects
final Map<String, dynamic> classMap = {};

for (var cls in (data['classTeacherClasses'] ?? [])) {
  classMap[cls['id']] = {
    ...cls,
    'subjects': <dynamic>[],
  };
}

for (var cls in (data['subjectTeacherClasses'] ?? [])) {
  if (classMap.containsKey(cls['id'])) {
    classMap[cls['id']]!['subjects'] = cls['subjects'] ?? [];
  } else {
    classMap[cls['id']] = cls;
  }
}

final List<dynamic> mergedClasses = classMap.values.toList();
```

**2. Removed debug logging** (no longer needed)

---

## Testing

### Test Subject Dropdown
1. Run mobile app on Chrome
2. Login as teacher
3. Navigate to Create Assignment
4. Select a class
5. **Subject dropdown should now show "Geography"** ✅
6. Can select subject and create assignment

### Expected Behavior

| Teacher Role | Subjects Shown |
|--------------|----------------|
| Only Class Teacher | No subjects (empty dropdown) |
| Only Subject Teacher | Assigned subjects |
| Both Class & Subject Teacher | Assigned subjects |

---

## Files Modified

1. **`mobile_app/lib/screens/teacher/create_assignment_screen.dart`**
   - Changed class merging logic
   - Removed debug logging

---

## Summary

Subject dropdown now works correctly:
- ✅ Merges duplicate classes by ID
- ✅ Combines subjects from both class teacher and subject teacher roles
- ✅ Shows only subjects assigned to the teacher for selected class
- ✅ No duplicate classes in the list

The teacher can now select subjects when creating assignments in the mobile app.
