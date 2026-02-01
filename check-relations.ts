
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Hardcoded IDs from previous context - verify these are still valid or update them
  // School ID: cml2cl1nw0000100us8owgdfp
  // Academic Year ID: cml2e83ax0001660ghyrq9iix (2026-2027)
  // Teacher ID: cml2clmd60003l8yr72rgo3aj (Mobile Test Teacher)

  const schoolId = 'cml2cl1nw0000100us8owgdfp'
  const yearId = 'cml2e83ax0001660ghyrq9iix'
  const teacherId = 'cml2clmd60003l8yr72rgo3aj'

  console.log('--- Verifying Data Relations ---')

  // 1. Check Academic Year
  const year = await prisma.academicYear.findUnique({
    where: { id: yearId }
  })

  if (!year) {
    console.error('❌ Academic Year not found!')
  } else {
    console.log(`✅ Academic Year found: ${year.name}`)
    console.log(`   School ID match: ${year.schoolId === schoolId} (Expected: ${schoolId}, Actual: ${year.schoolId})`)
    console.log(`   Is Current: ${year.isCurrent}`)
  }

  // 2. Check Teacher
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    include: { user: true }
  })

  if (!teacher) {
    console.error('❌ Teacher not found!')
  } else {
    console.log(`✅ Teacher found: ${teacher.user.name} (${teacher.user.email})`)
    console.log(`   School ID match: ${teacher.schoolId === schoolId}`)
  }

  // 3. Check Class Teacher Assignments
  const assignments = await prisma.classTeacher.findMany({
    where: {
      teacherId: teacherId,
      academicYearId: yearId
    },
    include: {
      academicUnit: true
    }
  })

  console.log(`\n--- Class Assignments (${assignments.length}) ---`)
  if (assignments.length === 0) {
    console.warn('⚠️ No assignments found for this teacher and academic year.')
  } else {
    assignments.forEach(a => {
      console.log(`✅ Class: ${a.academicUnit.name} (ID: ${a.academicUnitId})`)
      console.log(`   Is Active: ${a.isActive}`)
      console.log(`   Academic Year ID: ${a.academicYearId}`)
    })
  }

  // 4. Check Subject Teacher Assignments (if any)
  const subjectAssignments = await prisma.teacherClassAssignment.findMany({
    where: {
      teacherId: teacherId,
      academicYearId: yearId
    },
    include: {
      academicUnit: true,
      subject: true
    }
  })

  console.log(`\n--- Subject Assignments (${subjectAssignments.length}) ---`)
  subjectAssignments.forEach(a => {
    console.log(`✅ Class: ${a.academicUnit.name} | Subject: ${a.subject.name}`)
  })

}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
