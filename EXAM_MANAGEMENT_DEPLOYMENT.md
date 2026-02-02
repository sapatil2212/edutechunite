# Exam Management System - Deployment Guide

## Prerequisites

Before deploying the Exam Management system, ensure you have:

1. ✅ Database schema updated in `prisma/schema.prisma`
2. ✅ API routes created in `app/api/exams/`
3. ✅ Node.js and npm installed
4. ✅ Database connection configured in `.env`

---

## Step-by-Step Deployment

### Step 1: Generate Prisma Client

The Prisma client needs to be regenerated to include the new models and enums.

```bash
# Navigate to project root
cd "g:\Education SAAS"

# Generate Prisma client
npx prisma generate
```

**Expected Output:**
```
✔ Generated Prisma Client (X.X.X) to ./node_modules/@prisma/client
```

### Step 2: Create Database Migration

Create a migration file for the new exam management schema.

```bash
# Create migration
npx prisma migrate dev --name add_exam_management_system
```

This will:
- Create a new migration file in `prisma/migrations/`
- Apply the migration to your development database
- Update the Prisma client

**Expected Output:**
```
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
Datasource "db": MySQL database "education_saas" at "localhost:3306"

Applying migration `20260201_add_exam_management_system`

The following migration(s) have been created and applied from new schema changes:

migrations/
  └─ 20260201_add_exam_management_system/
    └─ migration.sql

Your database is now in sync with your schema.
```

### Step 3: Verify Database Schema

Check that all tables were created successfully:

```sql
-- Connect to your database and run:
SHOW TABLES LIKE '%exam%';

-- Expected tables:
-- exams
-- exam_schedules
-- exam_results
-- marks_corrections
-- marks_entry_logs
-- report_cards
-- exam_analytics
```

### Step 4: Seed Initial Data (Optional)

If you want to test with sample data, create a seed file:

```bash
# Create seed file
touch prisma/seed-exams.ts
```

**Sample Seed Data:**

```typescript
// prisma/seed-exams.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get first school and academic year
  const school = await prisma.school.findFirst();
  const academicYear = await prisma.academicYear.findFirst({
    where: { isCurrent: true }
  });

  if (!school || !academicYear) {
    console.log('No school or academic year found');
    return;
  }

  // Create sample exam
  const exam = await prisma.exam.create({
    data: {
      schoolId: school.id,
      academicYearId: academicYear.id,
      name: 'Mid-Term Examination 2025-26',
      code: 'MID-2025',
      examType: 'MID_TERM',
      startDate: new Date('2025-03-01'),
      endDate: new Date('2025-03-15'),
      evaluationType: 'MARKS_BASED',
      examMode: 'OFFLINE',
      targetClasses: [],
      overallPassingPercentage: 33,
      subjectWisePassing: true,
      showRank: true,
      showPercentage: true,
      showGrade: true,
      status: 'DRAFT',
    },
  });

  console.log('Sample exam created:', exam);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Run the seed:

```bash
npx ts-node prisma/seed-exams.ts
```

### Step 5: Test API Endpoints

Test the API endpoints to ensure they're working correctly.

#### Test 1: Create Exam

```bash
curl -X POST http://localhost:3000/api/exams \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Final Examination 2025-26",
    "code": "FINAL-2025",
    "examType": "FINAL",
    "academicYearId": "YOUR_ACADEMIC_YEAR_ID",
    "targetClasses": ["CLASS_ID_1", "CLASS_ID_2"],
    "startDate": "2025-05-01",
    "endDate": "2025-05-15",
    "evaluationType": "MARKS_BASED",
    "examMode": "OFFLINE",
    "overallPassingPercentage": 33,
    "subjectWisePassing": true
  }'
```

#### Test 2: Get Exams

```bash
curl http://localhost:3000/api/exams \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Test 3: Create Schedule

```bash
curl -X POST http://localhost:3000/api/exams/EXAM_ID/schedules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "subjectId": "SUBJECT_ID",
    "academicUnitId": "CLASS_ID",
    "examDate": "2025-05-01",
    "startTime": "09:00",
    "endTime": "12:00",
    "maxMarks": 100,
    "passingMarks": 33
  }'
```

### Step 6: Deploy to Production

#### For Production Database:

```bash
# Set production database URL
export DATABASE_URL="your_production_database_url"

# Run migration
npx prisma migrate deploy

# Generate client
npx prisma generate
```

#### For Vercel/Netlify Deployment:

1. Add environment variables in deployment platform:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`

2. Add build commands:
   ```json
   {
     "scripts": {
       "build": "prisma generate && next build",
       "postinstall": "prisma generate"
     }
   }
   ```

3. Deploy:
   ```bash
   git add .
   git commit -m "Add exam management system"
   git push origin main
   ```

---

## Troubleshooting

### Issue 1: TypeScript Errors

**Problem:** TypeScript shows errors about missing properties.

**Solution:** Regenerate Prisma client:
```bash
npx prisma generate
```

### Issue 2: Migration Fails

**Problem:** Migration fails due to existing data.

**Solution:** 
1. Backup your database
2. Review the migration SQL
3. Apply manually if needed:
```bash
npx prisma migrate resolve --applied "MIGRATION_NAME"
```

### Issue 3: API Routes Return 500 Error

**Problem:** API routes fail with internal server error.

**Solution:**
1. Check server logs
2. Verify Prisma client is generated
3. Check database connection
4. Verify authentication middleware

### Issue 4: Prisma Client Not Found

**Problem:** `Cannot find module '@prisma/client'`

**Solution:**
```bash
npm install @prisma/client
npx prisma generate
```

---

## Verification Checklist

After deployment, verify:

- [ ] All exam-related tables exist in database
- [ ] API endpoint `/api/exams` returns 200 status
- [ ] Can create a new exam via API
- [ ] Can create exam schedules
- [ ] Can enter marks
- [ ] Can publish results
- [ ] Can generate report cards
- [ ] Can view analytics
- [ ] Role-based access control works
- [ ] Audit logs are being created

---

## Performance Optimization

### Database Indexes

The schema includes indexes on frequently queried fields:
- `examId` on all related tables
- `studentId` on results
- `academicUnitId` on schedules
- `status` on exams

### Query Optimization

Use Prisma's `include` and `select` to fetch only needed data:

```typescript
// Good - fetch only needed fields
const exams = await prisma.exam.findMany({
  select: {
    id: true,
    name: true,
    status: true,
  },
});

// Better - use pagination
const exams = await prisma.exam.findMany({
  take: 10,
  skip: 0,
  orderBy: { createdAt: 'desc' },
});
```

### Caching Strategy

Consider caching for:
- Published exam results (cache for 24 hours)
- Analytics data (cache for 1 hour)
- Report cards (cache indefinitely, invalidate on regeneration)

---

## Monitoring

### Key Metrics to Monitor

1. **API Response Times**
   - `/api/exams` - should be < 500ms
   - `/api/exams/[id]/marks-entry` - should be < 1s
   - `/api/exams/[id]/results/publish` - may take 5-10s for large datasets

2. **Database Performance**
   - Query execution time
   - Connection pool usage
   - Slow query log

3. **Error Rates**
   - 4xx errors (client errors)
   - 5xx errors (server errors)
   - Failed transactions

### Logging

All critical operations are logged via `MarksEntryLog`:
- Marks entry
- Marks updates
- Marks submission
- Results publishing
- Marks corrections

Query logs:
```typescript
const logs = await prisma.marksEntryLog.findMany({
  where: {
    examId: 'EXAM_ID',
    action: 'MARKS_SUBMITTED',
  },
  orderBy: { performedAt: 'desc' },
});
```

---

## Security Considerations

### 1. Authentication

All API routes require authentication:
```typescript
const session = await getServerSession(authOptions);
if (!session?.user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### 2. Authorization

Role-based access control:
- **SUPER_ADMIN**: Full access
- **SCHOOL_ADMIN**: School-level access
- **TEACHER**: Limited to assigned subjects
- **STUDENT**: Read-only, own data
- **PARENT**: Read-only, child's data

### 3. Data Validation

All inputs validated using Zod schemas:
```typescript
const schema = z.object({
  name: z.string().min(1),
  examType: z.enum([...]),
});
```

### 4. SQL Injection Prevention

Prisma ORM prevents SQL injection by using parameterized queries.

### 5. Rate Limiting

Consider implementing rate limiting for:
- Marks entry endpoints
- Report card generation
- Analytics queries

---

## Backup and Recovery

### Database Backup

Schedule regular backups:
```bash
# MySQL backup
mysqldump -u username -p database_name > backup.sql

# Restore
mysql -u username -p database_name < backup.sql
```

### Data Export

Export exam data for archival:
```typescript
// Export exam results to JSON
const results = await prisma.examResult.findMany({
  where: { examId: 'EXAM_ID' },
  include: { student: true, subject: true },
});

fs.writeFileSync('exam-results.json', JSON.stringify(results, null, 2));
```

---

## Maintenance

### Regular Tasks

1. **Weekly**
   - Review error logs
   - Check database performance
   - Monitor API response times

2. **Monthly**
   - Archive old exams (status: ARCHIVED)
   - Clean up draft exams
   - Review and optimize slow queries

3. **Quarterly**
   - Database maintenance (OPTIMIZE TABLE)
   - Review and update indexes
   - Performance audit

### Archiving Old Data

```typescript
// Archive exams older than 2 years
const twoYearsAgo = new Date();
twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

await prisma.exam.updateMany({
  where: {
    endDate: { lt: twoYearsAgo },
    status: 'RESULTS_PUBLISHED',
  },
  data: { status: 'ARCHIVED' },
});
```

---

## Support and Documentation

### Resources

- **API Documentation**: See `EXAM_MANAGEMENT_COMPLETE.md`
- **Database Schema**: `prisma/schema.prisma`
- **API Routes**: `app/api/exams/`
- **Type Definitions**: Generated in `node_modules/@prisma/client`

### Getting Help

1. Check this deployment guide
2. Review error logs
3. Check Prisma documentation: https://www.prisma.io/docs
4. Review Next.js documentation: https://nextjs.org/docs

---

## Post-Deployment Tasks

### 1. User Training

Train users on:
- Creating exams
- Scheduling exams
- Entering marks
- Publishing results
- Generating report cards
- Viewing analytics

### 2. Documentation

Create user guides for:
- Admin users
- Teachers
- Students
- Parents

### 3. Feedback Collection

Collect feedback on:
- Ease of use
- Performance
- Missing features
- Bug reports

---

## Success Criteria

The deployment is successful when:

✅ All API endpoints are functional
✅ Database migrations are applied
✅ Users can create and manage exams
✅ Teachers can enter marks
✅ Results can be published
✅ Report cards can be generated
✅ Analytics are accurate
✅ No critical errors in logs
✅ Performance meets requirements
✅ Security measures are in place

---

**Deployment Checklist Complete**: ✅
**System Status**: Ready for Production
**Last Updated**: February 1, 2026
