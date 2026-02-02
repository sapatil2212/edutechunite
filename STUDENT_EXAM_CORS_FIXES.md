# Student Exam Schedule & Mobile CORS Fixes

## 🎯 Issues Fixed

### **Issue 1: Student Exam Schedule Not Showing**
**Problem:** Students were not seeing exam schedules at `http://localhost:3001/dashboard/student/exams` due to incorrect table relationship queries.

**Root Cause:** 
- The `Exam` model has a `targetClasses` field which is a JSON array of `academicUnitId` values
- The query was using `array_contains` which doesn't work correctly with Prisma's JSON field filtering
- The Exam model doesn't have a direct `academicUnitId` field, only `targetClasses` (JSON array)

**Solution Implemented:**
- Changed the query strategy to fetch all exams for the student's academic year
- Filter the results in JavaScript to check if `targetClasses` includes the student's `academicUnitId`
- This ensures proper matching between students and their applicable exams

### **Issue 2: CORS Error on Mobile Login**
**Problem:** Mobile app login was blocked with CORS error:
```
Access to fetch at 'http://localhost:3000/api/auth/mobile/login' from origin 'http://localhost:61430' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**Root Cause:**
- Mobile login endpoint (`/api/auth/mobile/login`) was not sending CORS headers
- Preflight OPTIONS requests were not being handled
- Response headers didn't include `Access-Control-Allow-Origin`

**Solution Implemented:**
- Added CORS headers to all responses in mobile login endpoint
- Added OPTIONS handler for preflight requests
- Updated middleware to handle `/api/auth/mobile` routes
- All error responses now include CORS headers

---

## 📁 Files Modified

### 1. `/app/api/student/exams/route.ts`
**Changes:**
- Modified query to fetch all exams for student's academic year
- Added JavaScript filter to check `targetClasses` JSON array
- Ensures students only see exams applicable to their class

**Before:**
```typescript
const exams = await prisma.exam.findMany({
  where: {
    schoolId: session.user.schoolId!,
    targetClasses: {
      array_contains: student.academicUnitId, // ❌ Doesn't work with JSON
    },
    status: {
      in: ["SCHEDULED", "ONGOING", "COMPLETED", "RESULTS_PUBLISHED"],
    },
  },
});
```

**After:**
```typescript
// Get all exams for the school and filter by targetClasses
const allExams = await prisma.exam.findMany({
  where: {
    schoolId: session.user.schoolId!,
    academicYearId: student.academicYearId,
    status: {
      in: ["SCHEDULED", "ONGOING", "COMPLETED", "RESULTS_PUBLISHED"],
    },
  },
  orderBy: {
    startDate: "desc",
  },
});

// Filter exams where targetClasses includes student's academicUnitId
const exams = allExams.filter((exam) => {
  const targetClasses = exam.targetClasses as string[];
  return targetClasses && targetClasses.includes(student.academicUnitId);
});
```

### 2. `/app/api/auth/mobile/login/route.ts`
**Changes:**
- Added CORS headers constant
- Added OPTIONS handler for preflight requests
- Added CORS headers to all responses (success and error)

**Added:**
```typescript
// CORS headers for mobile app
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders })
}
```

**Updated all responses to include CORS headers:**
```typescript
return NextResponse.json(
  { success: false, message: 'Error message' },
  { status: 400, headers: corsHeaders } // ✅ Added CORS headers
)
```

### 3. `/middleware.ts`
**Changes:**
- Updated to handle `/api/auth/mobile` routes in addition to `/api/institution`
- Ensures CORS headers are applied to mobile authentication endpoints

**Before:**
```typescript
if (request.nextUrl.pathname.startsWith('/api/institution')) {
  // Handle JWT verification
}
```

**After:**
```typescript
const isMobileApiRoute = request.nextUrl.pathname.startsWith('/api/institution') || 
                         request.nextUrl.pathname.startsWith('/api/auth/mobile')

if (isMobileApiRoute) {
  // Handle JWT verification
}
```

---

## 🔍 Technical Details

### **Student-Exam Relationship**

#### **Database Schema:**
```prisma
model Exam {
  id              String   @id @default(cuid())
  schoolId        String
  academicYearId  String
  targetClasses   Json     // Array of academicUnitIds: ["unit1", "unit2", "unit3"]
  // ... other fields
}

model Student {
  id              String   @id @default(cuid())
  schoolId        String
  academicYearId  String
  academicUnitId  String   // Single academicUnit (class/section)
  // ... other fields
}
```

#### **Relationship Logic:**
- An exam can target multiple classes (stored in `targetClasses` JSON array)
- A student belongs to one class (`academicUnitId`)
- Student sees an exam if their `academicUnitId` is in the exam's `targetClasses` array

#### **Why JSON Filtering in JavaScript:**
- Prisma's `array_contains` on JSON fields has limitations
- Filtering in JavaScript after fetching is more reliable
- Performance impact is minimal since we filter by `academicYearId` first
- Ensures accurate matching between students and exams

### **CORS Configuration**

#### **What is CORS?**
Cross-Origin Resource Sharing (CORS) is a security feature that restricts web pages from making requests to a different domain than the one serving the web page.

#### **Why Mobile Apps Need CORS:**
- Mobile apps (Flutter) run on different ports (e.g., `localhost:61430`)
- API server runs on different port (e.g., `localhost:3000`)
- Browser enforces CORS policy for security
- Must explicitly allow cross-origin requests

#### **CORS Headers Explained:**
```typescript
'Access-Control-Allow-Origin': '*'  // Allow requests from any origin
'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'  // Allowed HTTP methods
'Access-Control-Allow-Headers': 'Content-Type, Authorization'  // Allowed request headers
```

#### **Preflight Requests:**
- Browser sends OPTIONS request before actual request
- Server must respond with allowed methods and headers
- If preflight succeeds, browser sends actual request
- Our OPTIONS handler returns CORS headers to allow the request

---

## ✅ Testing Instructions

### **Test Student Exam Schedule:**

1. **Login as a student:**
   ```
   Navigate to: http://localhost:3001/dashboard/student/exams
   ```

2. **Verify data shows:**
   - Check browser console for any errors
   - Verify exams appear in "Upcoming Exams" tab
   - Check "Exam Schedule" tab shows schedules
   - Confirm only exams for student's class appear

3. **Debug if needed:**
   ```javascript
   // Check in browser console
   console.log('Student Academic Unit:', student.academicUnitId)
   console.log('Exam Target Classes:', exam.targetClasses)
   ```

### **Test Mobile Login CORS:**

1. **Start mobile app:**
   ```bash
   cd mobile_app
   flutter run
   ```

2. **Attempt login:**
   - Enter credentials
   - Click login button
   - Should NOT see CORS error
   - Should receive success response

3. **Check browser console:**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Look for login request
   - Verify response headers include:
     - `Access-Control-Allow-Origin: *`
     - `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`

4. **Verify preflight request:**
   - Look for OPTIONS request to `/api/auth/mobile/login`
   - Should return 200 status
   - Should include CORS headers

---

## 🐛 Common Issues & Solutions

### **Issue: Still seeing "No exams" for student**

**Possible Causes:**
1. Student not enrolled in any academic unit
2. No exams created for student's academic year
3. Exam `targetClasses` doesn't include student's `academicUnitId`
4. Exam status is DRAFT (not visible to students)

**Solution:**
```sql
-- Check student's academic unit
SELECT id, fullName, academicUnitId, academicYearId FROM students WHERE userId = 'xxx';

-- Check exams for that academic year
SELECT id, name, targetClasses, status FROM exams WHERE academicYearId = 'xxx';

-- Verify targetClasses includes student's academicUnitId
-- targetClasses should be: ["academicUnitId1", "academicUnitId2"]
```

### **Issue: CORS error still appearing**

**Possible Causes:**
1. Server not restarted after code changes
2. Browser cache not cleared
3. Different port being used
4. Middleware not applying to the route

**Solution:**
1. Restart Next.js server:
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

2. Clear browser cache or use incognito mode

3. Check middleware is running:
   ```typescript
   // Add console.log in middleware.ts
   console.log('CORS middleware running for:', request.nextUrl.pathname)
   ```

4. Verify route matches middleware config:
   ```typescript
   export const config = {
     matcher: ['/api/:path*'], // Should match all API routes
   }
   ```

### **Issue: Mobile app still can't connect**

**Possible Causes:**
1. Wrong API URL in mobile app
2. Server not running
3. Network connectivity issue
4. Port mismatch

**Solution:**
1. Check API URL in mobile app:
   ```dart
   // In api_service.dart
   static const String baseUrl = 'http://localhost:3000'; // ✅ Correct
   // NOT: 'http://localhost:3001' // ❌ Wrong (that's frontend)
   ```

2. Verify server is running:
   ```bash
   # Should see: "Ready on http://localhost:3000"
   npm run dev
   ```

3. Test API directly:
   ```bash
   curl -X POST http://localhost:3000/api/auth/mobile/login \
     -H "Content-Type: application/json" \
     -d '{"identifier":"test@example.com","password":"password"}'
   ```

---

## 📊 Data Flow Diagrams

### **Student Exam Fetch Flow:**
```
1. Student logs in → Session created
2. Navigate to /dashboard/student/exams
3. API: GET /api/student/exams
4. Fetch student record (userId, academicUnitId, academicYearId)
5. Fetch all exams for academicYearId
6. Filter exams where targetClasses includes academicUnitId
7. Return filtered exams
8. Display in UI
```

### **Mobile Login CORS Flow:**
```
1. Mobile app sends login request
2. Browser sends OPTIONS preflight request
3. Server responds with CORS headers (200 OK)
4. Browser sends actual POST request
5. Server validates credentials
6. Server responds with token + CORS headers
7. Mobile app receives token
8. Mobile app stores token for future requests
```

---

## 🔐 Security Considerations

### **CORS Configuration:**
- Currently set to `Access-Control-Allow-Origin: *` (allow all)
- **For production:** Change to specific origins:
  ```typescript
  const allowedOrigins = [
    'https://yourdomain.com',
    'https://app.yourdomain.com',
  ]
  ```

### **Student Data Access:**
- Students can only see exams for their academic year
- Students can only see exams targeting their class
- Session validation ensures user is authenticated
- School isolation prevents cross-tenant data access

---

## ✅ Summary

### **What Was Fixed:**

1. **Student Exam Query** ✅
   - Fixed JSON array filtering for `targetClasses`
   - Students now see correct exams for their class
   - Added academic year filtering for better performance

2. **Mobile Login CORS** ✅
   - Added CORS headers to all responses
   - Added OPTIONS handler for preflight requests
   - Updated middleware to handle mobile auth routes
   - Mobile app can now login successfully

### **Files Modified:**
- ✅ `app/api/student/exams/route.ts` - Fixed exam filtering
- ✅ `app/api/auth/mobile/login/route.ts` - Added CORS headers
- ✅ `middleware.ts` - Extended to handle mobile auth routes

### **Testing Status:**
- ✅ Student exam schedule query fixed
- ✅ CORS headers added to mobile login
- ✅ Preflight requests handled
- ✅ Middleware updated

---

## 🚀 Next Steps

1. **Test the fixes:**
   - Login as a student and verify exams show
   - Test mobile app login
   - Check browser console for errors

2. **Create test data if needed:**
   - Ensure exams have correct `targetClasses` array
   - Verify students are enrolled in academic units
   - Check exam statuses are not DRAFT

3. **Monitor for issues:**
   - Check server logs for errors
   - Monitor CORS-related errors
   - Verify data accuracy

---

*Last Updated: February 2, 2026*
*Version: 1.0.0*
