# Mobile App Assignment Evaluation - 500 Error Fix

## Issue

Assignment evaluation was failing with 500 Internal Server Error when accessed from the mobile app:
```
POST /api/institution/assignments/cml3pwadn0002agfhwenefu7b/evaluate
Status: 500 (Internal Server Error)
```

---

## Root Cause

**Line 62** in the evaluate endpoint was using `session.user.schoolId` instead of the combined `user.schoolId`:

```typescript
const assignment = await prisma.assignment.findFirst({
  where: {
    id: assignmentId,
    schoolId: session.user.schoolId, // ❌ Error: session is null for JWT
  },
})
```

### Why This Caused 500 Error

1. Mobile app uses **JWT authentication** (not NextAuth session)
2. `session` is `null` for JWT requests
3. Trying to access `session.user.schoolId` throws: `Cannot read property 'user' of null`
4. Server returns 500 error

---

## Solution

Use the combined `user` object (which works for both NextAuth and JWT):

```typescript
const assignment = await prisma.assignment.findFirst({
  where: {
    id: assignmentId,
    schoolId: user.schoolId, // ✅ Works for both session and JWT
  },
})
```

---

## Changes Made

### File: `app/api/institution/assignments/[id]/evaluate/route.ts`

**Fixed line 62:**
```typescript
// Before
schoolId: session.user.schoolId,

// After
schoolId: user.schoolId,
```

---

## How It Works Now

### Authentication Flow

```typescript
// Try NextAuth session first, then JWT
const session = await getServerSession(authOptions)
const jwtUser = await getJWTUser(req)

const user = session?.user || jwtUser // Combined auth

// Use 'user' everywhere, not 'session.user'
if (!user?.schoolId) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// ✅ Works for both web and mobile
const assignment = await prisma.assignment.findFirst({
  where: {
    id: assignmentId,
    schoolId: user.schoolId,
  },
})
```

---

## Testing

### Test Evaluation from Mobile App

1. Ensure Next.js server is running: `npm run dev`
2. Run mobile app: `flutter run` → Select Chrome
3. Login as teacher
4. Navigate to an assignment with submissions
5. Evaluate a submission (add marks, feedback)
6. **Should now work without 500 error** ✅

### Expected Behavior

- **POST** `/api/institution/assignments/{id}/evaluate` → 200 OK
- Evaluation saved successfully
- Submission status updated to "EVALUATED"

---

## Files Modified

1. **`app/api/institution/assignments/[id]/evaluate/route.ts`**
   - Fixed line 62: `session.user.schoolId` → `user.schoolId`

---

## Summary

Assignment evaluation now works from mobile app:
- ✅ Fixed 500 error caused by null session
- ✅ Uses combined authentication (NextAuth + JWT)
- ✅ Works on both web and mobile platforms
- ✅ Consistent with other fixed endpoints

This was the same type of issue we fixed in other endpoints - using `session.user` instead of the combined `user` object.
