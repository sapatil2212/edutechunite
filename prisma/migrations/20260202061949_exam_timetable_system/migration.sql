-- CreateTable
CREATE TABLE `schools` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(20) NOT NULL,
    `institutionType` ENUM('SCHOOL', 'INSTITUTE', 'COLLEGE', 'COACHING') NOT NULL,
    `schoolType` ENUM('PRESCHOOL', 'PRIMARY', 'MIDDLE', 'SECONDARY', 'SENIOR_SECONDARY', 'INTEGRATED') NULL,
    `name` VARCHAR(255) NOT NULL,
    `address` TEXT NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `state` VARCHAR(100) NOT NULL,
    `district` VARCHAR(100) NULL,
    `pincode` VARCHAR(10) NULL,
    `email` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `website` VARCHAR(255) NULL,
    `logo` VARCHAR(500) NULL,
    `status` ENUM('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'INACTIVE') NOT NULL DEFAULT 'PENDING_VERIFICATION',
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `verifiedAt` DATETIME(3) NULL,
    `maxStudents` INTEGER NOT NULL DEFAULT 100,
    `maxTeachers` INTEGER NOT NULL DEFAULT 20,
    `maxStaff` INTEGER NOT NULL DEFAULT 10,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `schools_schoolId_key`(`schoolId`),
    UNIQUE INDEX `schools_email_key`(`email`),
    INDEX `schools_institutionType_idx`(`institutionType`),
    INDEX `schools_state_city_idx`(`state`, `city`),
    INDEX `schools_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `username` VARCHAR(50) NULL,
    `password` VARCHAR(255) NOT NULL,
    `mustChangePassword` BOOLEAN NOT NULL DEFAULT false,
    `fullName` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `avatar` VARCHAR(500) NULL,
    `role` ENUM('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'STAFF') NOT NULL DEFAULT 'SCHOOL_ADMIN',
    `status` ENUM('PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE') NOT NULL DEFAULT 'PENDING',
    `emailVerified` BOOLEAN NOT NULL DEFAULT false,
    `emailVerifiedAt` DATETIME(3) NULL,
    `verificationToken` VARCHAR(255) NULL,
    `verificationExpiry` DATETIME(3) NULL,
    `resetToken` VARCHAR(255) NULL,
    `resetTokenExpiry` DATETIME(3) NULL,
    `schoolId` VARCHAR(191) NULL,
    `lastLoginAt` DATETIME(3) NULL,
    `lastLoginIp` VARCHAR(50) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_verificationToken_key`(`verificationToken`),
    UNIQUE INDEX `users_resetToken_key`(`resetToken`),
    INDEX `users_role_idx`(`role`),
    INDEX `users_status_idx`(`status`),
    INDEX `users_schoolId_idx`(`schoolId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `id` VARCHAR(191) NOT NULL,
    `sessionToken` VARCHAR(255) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `sessions_sessionToken_key`(`sessionToken`),
    INDEX `sessions_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `verification_tokens` (
    `identifier` VARCHAR(255) NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `verification_tokens_token_key`(`token`),
    UNIQUE INDEX `verification_tokens_identifier_token_key`(`identifier`, `token`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `login_logs` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `ipAddress` VARCHAR(50) NULL,
    `userAgent` TEXT NULL,
    `status` VARCHAR(20) NOT NULL,
    `reason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `login_logs_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `password_reset_otps` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `otp` VARCHAR(10) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `isUsed` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `password_reset_otps_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `courses` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `code` VARCHAR(50) NULL,
    `description` TEXT NULL,
    `type` ENUM('ACADEMIC', 'CERTIFICATION', 'TRAINING', 'COACHING') NOT NULL DEFAULT 'ACADEMIC',
    `durationValue` INTEGER NULL,
    `durationUnit` VARCHAR(20) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `courses_schoolId_idx`(`schoolId`),
    INDEX `courses_status_idx`(`status`),
    UNIQUE INDEX `courses_schoolId_name_key`(`schoolId`, `name`),
    UNIQUE INDEX `courses_schoolId_code_key`(`schoolId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `academic_years` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `isCurrent` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `academic_years_schoolId_isActive_idx`(`schoolId`, `isActive`),
    INDEX `academic_years_schoolId_isCurrent_idx`(`schoolId`, `isCurrent`),
    UNIQUE INDEX `academic_years_schoolId_name_key`(`schoolId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `academic_units` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `parentId` VARCHAR(191) NULL,
    `name` VARCHAR(100) NOT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `type` ENUM('CLASS', 'SEMESTER', 'BATCH', 'YEAR', 'TERM') NOT NULL DEFAULT 'CLASS',
    `courseId` VARCHAR(191) NULL,
    `academicYearId` VARCHAR(191) NOT NULL,
    `maxStudents` INTEGER NOT NULL DEFAULT 40,
    `currentStudents` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `academic_units_schoolId_academicYearId_idx`(`schoolId`, `academicYearId`),
    INDEX `academic_units_schoolId_type_idx`(`schoolId`, `type`),
    INDEX `academic_units_parentId_idx`(`parentId`),
    INDEX `academic_units_isActive_idx`(`isActive`),
    INDEX `academic_units_courseId_idx`(`courseId`),
    UNIQUE INDEX `academic_units_schoolId_academicYearId_parentId_name_key`(`schoolId`, `academicYearId`, `parentId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teachers` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `employeeId` VARCHAR(50) NOT NULL,
    `fullName` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(20) NULL,
    `qualification` VARCHAR(255) NULL,
    `specialization` VARCHAR(255) NULL,
    `maxPeriodsPerDay` INTEGER NOT NULL DEFAULT 6,
    `maxPeriodsPerWeek` INTEGER NOT NULL DEFAULT 30,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `currentPeriodsPerWeek` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `teachers_userId_key`(`userId`),
    INDEX `teachers_schoolId_isActive_idx`(`schoolId`, `isActive`),
    UNIQUE INDEX `teachers_schoolId_employeeId_key`(`schoolId`, `employeeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teacher_subjects` (
    `id` VARCHAR(191) NOT NULL,
    `teacherId` VARCHAR(191) NOT NULL,
    `subjectId` VARCHAR(191) NOT NULL,
    `academicUnitIds` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `teacher_subjects_teacherId_idx`(`teacherId`),
    INDEX `teacher_subjects_subjectId_idx`(`subjectId`),
    UNIQUE INDEX `teacher_subjects_teacherId_subjectId_key`(`teacherId`, `subjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subjects` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `description` TEXT NULL,
    `type` ENUM('CORE', 'ELECTIVE', 'LANGUAGE', 'PRACTICAL', 'ACTIVITY') NOT NULL DEFAULT 'CORE',
    `courseId` VARCHAR(191) NULL,
    `color` VARCHAR(20) NULL,
    `icon` VARCHAR(50) NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `creditsPerWeek` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `subjects_schoolId_isActive_idx`(`schoolId`, `isActive`),
    INDEX `subjects_schoolId_type_idx`(`schoolId`, `type`),
    INDEX `subjects_courseId_idx`(`courseId`),
    UNIQUE INDEX `subjects_schoolId_code_key`(`schoolId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `academic_unit_subjects` (
    `id` VARCHAR(191) NOT NULL,
    `academicUnitId` VARCHAR(191) NOT NULL,
    `subjectId` VARCHAR(191) NOT NULL,
    `isElective` BOOLEAN NOT NULL DEFAULT false,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `academic_unit_subjects_academicUnitId_idx`(`academicUnitId`),
    INDEX `academic_unit_subjects_subjectId_idx`(`subjectId`),
    UNIQUE INDEX `academic_unit_subjects_academicUnitId_subjectId_key`(`academicUnitId`, `subjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `timetable_templates` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `periodsPerDay` INTEGER NOT NULL DEFAULT 8,
    `periodDuration` INTEGER NOT NULL DEFAULT 45,
    `workingDays` JSON NOT NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `timetable_templates_schoolId_isActive_idx`(`schoolId`, `isActive`),
    UNIQUE INDEX `timetable_templates_schoolId_name_key`(`schoolId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `period_timings` (
    `id` VARCHAR(191) NOT NULL,
    `templateId` VARCHAR(191) NOT NULL,
    `periodNumber` INTEGER NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `startTime` VARCHAR(10) NOT NULL,
    `endTime` VARCHAR(10) NOT NULL,
    `isBreak` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `period_timings_templateId_idx`(`templateId`),
    UNIQUE INDEX `period_timings_templateId_periodNumber_key`(`templateId`, `periodNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `timetables` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `templateId` VARCHAR(191) NOT NULL,
    `academicUnitId` VARCHAR(191) NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `publishedAt` DATETIME(3) NULL,
    `publishedBy` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `effectiveFrom` DATETIME(3) NULL,
    `effectiveTo` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `timetables_schoolId_status_idx`(`schoolId`, `status`),
    INDEX `timetables_academicUnitId_status_idx`(`academicUnitId`, `status`),
    UNIQUE INDEX `timetables_templateId_academicUnitId_version_key`(`templateId`, `academicUnitId`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `timetable_slots` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `timetableId` VARCHAR(191) NOT NULL,
    `templateId` VARCHAR(191) NOT NULL,
    `academicUnitId` VARCHAR(191) NOT NULL,
    `subjectId` VARCHAR(191) NULL,
    `teacherId` VARCHAR(191) NULL,
    `dayOfWeek` ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY') NOT NULL,
    `periodNumber` INTEGER NOT NULL,
    `slotType` ENUM('REGULAR', 'BREAK', 'FREE', 'ASSEMBLY', 'ACTIVITY', 'LAB', 'COMBINED', 'SPECIAL') NOT NULL DEFAULT 'REGULAR',
    `room` VARCHAR(50) NULL,
    `combinedWith` JSON NULL,
    `notes` VARCHAR(255) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `timetable_slots_schoolId_idx`(`schoolId`),
    INDEX `timetable_slots_timetableId_idx`(`timetableId`),
    INDEX `timetable_slots_templateId_academicUnitId_idx`(`templateId`, `academicUnitId`),
    INDEX `timetable_slots_teacherId_dayOfWeek_periodNumber_idx`(`teacherId`, `dayOfWeek`, `periodNumber`),
    INDEX `timetable_slots_subjectId_idx`(`subjectId`),
    UNIQUE INDEX `timetable_slots_timetableId_dayOfWeek_periodNumber_key`(`timetableId`, `dayOfWeek`, `periodNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `students` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `admissionNumber` VARCHAR(50) NOT NULL,
    `admissionDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `firstName` VARCHAR(100) NOT NULL,
    `middleName` VARCHAR(100) NULL,
    `lastName` VARCHAR(100) NOT NULL,
    `fullName` VARCHAR(255) NOT NULL,
    `dateOfBirth` DATETIME(3) NOT NULL,
    `gender` ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL,
    `bloodGroup` ENUM('A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE') NULL,
    `nationality` VARCHAR(100) NULL,
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(20) NULL,
    `emergencyContact` VARCHAR(20) NULL,
    `address` TEXT NULL,
    `city` VARCHAR(100) NULL,
    `state` VARCHAR(100) NULL,
    `pincode` VARCHAR(10) NULL,
    `profilePhoto` VARCHAR(500) NULL,
    `academicYearId` VARCHAR(191) NOT NULL,
    `academicUnitId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NULL,
    `stream` VARCHAR(50) NULL,
    `program` VARCHAR(100) NULL,
    `rollNumber` VARCHAR(50) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'ALUMNI', 'TRANSFERRED', 'EXPELLED', 'DROPPED_OUT') NOT NULL DEFAULT 'ACTIVE',
    `previousSchool` VARCHAR(255) NULL,
    `previousClass` VARCHAR(100) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `students_userId_key`(`userId`),
    INDEX `students_schoolId_status_idx`(`schoolId`, `status`),
    INDEX `students_schoolId_academicYearId_idx`(`schoolId`, `academicYearId`),
    INDEX `students_schoolId_academicUnitId_idx`(`schoolId`, `academicUnitId`),
    INDEX `students_courseId_idx`(`courseId`),
    INDEX `students_userId_idx`(`userId`),
    UNIQUE INDEX `students_schoolId_admissionNumber_key`(`schoolId`, `admissionNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_enrollments` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `academicYearId` VARCHAR(191) NOT NULL,
    `academicUnitId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NULL,
    `enrollmentDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `exitDate` DATETIME(3) NULL,
    `rollNumber` VARCHAR(50) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'ALUMNI', 'TRANSFERRED', 'EXPELLED', 'DROPPED_OUT') NOT NULL DEFAULT 'ACTIVE',
    `exitReason` VARCHAR(255) NULL,
    `isPromoted` BOOLEAN NULL,
    `promotedTo` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `student_enrollments_studentId_idx`(`studentId`),
    INDEX `student_enrollments_academicYearId_idx`(`academicYearId`),
    INDEX `student_enrollments_academicUnitId_idx`(`academicUnitId`),
    INDEX `student_enrollments_courseId_idx`(`courseId`),
    UNIQUE INDEX `student_enrollments_studentId_academicYearId_key`(`studentId`, `academicYearId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `guardians` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `fullName` VARCHAR(255) NOT NULL,
    `relationship` ENUM('FATHER', 'MOTHER', 'GUARDIAN', 'OTHER') NOT NULL DEFAULT 'GUARDIAN',
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(20) NOT NULL,
    `alternatePhone` VARCHAR(20) NULL,
    `address` TEXT NULL,
    `occupation` VARCHAR(100) NULL,
    `organization` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `guardians_userId_key`(`userId`),
    INDEX `guardians_schoolId_idx`(`schoolId`),
    INDEX `guardians_userId_idx`(`userId`),
    INDEX `guardians_phone_idx`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_guardians` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `guardianId` VARCHAR(191) NOT NULL,
    `relationship` ENUM('FATHER', 'MOTHER', 'GUARDIAN', 'OTHER') NOT NULL DEFAULT 'GUARDIAN',
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `canPickup` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `student_guardians_studentId_idx`(`studentId`),
    INDEX `student_guardians_guardianId_idx`(`guardianId`),
    UNIQUE INDEX `student_guardians_studentId_guardianId_key`(`studentId`, `guardianId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_documents` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `documentType` ENUM('BIRTH_CERTIFICATE', 'TRANSFER_CERTIFICATE', 'IDENTITY_CARD', 'PASSPORT_PHOTO', 'MEDICAL_CERTIFICATE', 'PREVIOUS_MARKSHEET', 'MIGRATION_CERTIFICATE', 'OTHER') NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `fileUrl` VARCHAR(500) NOT NULL,
    `fileSize` INTEGER NULL,
    `mimeType` VARCHAR(100) NULL,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `verifiedBy` VARCHAR(191) NULL,
    `verifiedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `student_documents_studentId_idx`(`studentId`),
    INDEX `student_documents_documentType_idx`(`documentType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendance_configs` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `mode` ENUM('DAILY', 'PERIOD_WISE', 'BATCH_SLOT') NOT NULL DEFAULT 'DAILY',
    `enableLate` BOOLEAN NOT NULL DEFAULT true,
    `enableHalfDay` BOOLEAN NOT NULL DEFAULT true,
    `enableExcused` BOOLEAN NOT NULL DEFAULT true,
    `cutoffTime` VARCHAR(10) NULL,
    `lateThresholdMinutes` INTEGER NOT NULL DEFAULT 15,
    `defaultStatus` ENUM('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE', 'EXCUSED', 'HOLIDAY') NOT NULL DEFAULT 'PRESENT',
    `autoMarkHolidays` BOOLEAN NOT NULL DEFAULT true,
    `allowCorrection` BOOLEAN NOT NULL DEFAULT true,
    `correctionRequiresApproval` BOOLEAN NOT NULL DEFAULT true,
    `correctionDeadlineDays` INTEGER NOT NULL DEFAULT 7,
    `workingDays` JSON NOT NULL,
    `notifyParentOnAbsent` BOOLEAN NOT NULL DEFAULT true,
    `lowAttendanceThreshold` INTEGER NOT NULL DEFAULT 75,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `attendance_configs_schoolId_key`(`schoolId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendances` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `academicYearId` VARCHAR(191) NOT NULL,
    `academicUnitId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `status` ENUM('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE', 'EXCUSED', 'HOLIDAY') NOT NULL DEFAULT 'PRESENT',
    `periodNumber` INTEGER NULL,
    `subjectId` VARCHAR(191) NULL,
    `arrivalTime` VARCHAR(10) NULL,
    `remarks` VARCHAR(255) NULL,
    `markedBy` VARCHAR(191) NULL,
    `markedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isModified` BOOLEAN NOT NULL DEFAULT false,
    `originalStatus` ENUM('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE', 'EXCUSED', 'HOLIDAY') NULL,
    `leaveRequestId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `attendances_schoolId_date_idx`(`schoolId`, `date`),
    INDEX `attendances_studentId_date_idx`(`studentId`, `date`),
    INDEX `attendances_academicUnitId_date_idx`(`academicUnitId`, `date`),
    INDEX `attendances_academicYearId_date_idx`(`academicYearId`, `date`),
    INDEX `attendances_markedBy_idx`(`markedBy`),
    UNIQUE INDEX `attendances_studentId_date_periodNumber_key`(`studentId`, `date`, `periodNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attendance_corrections` (
    `id` VARCHAR(191) NOT NULL,
    `attendanceId` VARCHAR(191) NOT NULL,
    `previousStatus` ENUM('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE', 'EXCUSED', 'HOLIDAY') NOT NULL,
    `newStatus` ENUM('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE', 'EXCUSED', 'HOLIDAY') NOT NULL,
    `reason` TEXT NOT NULL,
    `correctedBy` VARCHAR(191) NOT NULL,
    `correctedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `requiresApproval` BOOLEAN NOT NULL DEFAULT false,
    `approvalStatus` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `approvedBy` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `rejectionReason` VARCHAR(255) NULL,

    INDEX `attendance_corrections_attendanceId_idx`(`attendanceId`),
    INDEX `attendance_corrections_correctedBy_idx`(`correctedBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `daily_attendance_summaries` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `academicYearId` VARCHAR(191) NOT NULL,
    `academicUnitId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `totalPeriods` INTEGER NOT NULL DEFAULT 0,
    `presentPeriods` INTEGER NOT NULL DEFAULT 0,
    `absentPeriods` INTEGER NOT NULL DEFAULT 0,
    `latePeriods` INTEGER NOT NULL DEFAULT 0,
    `overallStatus` ENUM('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE', 'EXCUSED', 'HOLIDAY') NOT NULL DEFAULT 'PRESENT',
    `attendancePercentage` DOUBLE NOT NULL DEFAULT 100,
    `calculatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `daily_attendance_summaries_schoolId_date_idx`(`schoolId`, `date`),
    INDEX `daily_attendance_summaries_studentId_academicYearId_idx`(`studentId`, `academicYearId`),
    UNIQUE INDEX `daily_attendance_summaries_studentId_date_key`(`studentId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leave_requests` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `startDate` DATE NOT NULL,
    `endDate` DATE NOT NULL,
    `reason` TEXT NOT NULL,
    `leaveType` VARCHAR(50) NULL,
    `attachmentUrl` VARCHAR(500) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `approvedBy` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `rejectionReason` VARCHAR(255) NULL,
    `submittedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `leave_requests_schoolId_status_idx`(`schoolId`, `status`),
    INDEX `leave_requests_studentId_idx`(`studentId`),
    INDEX `leave_requests_startDate_endDate_idx`(`startDate`, `endDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `homeworks` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `academicYearId` VARCHAR(191) NOT NULL,
    `academicUnitId` VARCHAR(191) NOT NULL,
    `subjectId` VARCHAR(191) NOT NULL,
    `teacherId` VARCHAR(191) NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `instructions` TEXT NULL,
    `assignedDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dueDate` DATETIME(3) NOT NULL,
    `attachments` JSON NULL,
    `maxMarks` INTEGER NULL,
    `allowLateSubmission` BOOLEAN NOT NULL DEFAULT false,
    `requiresSubmission` BOOLEAN NOT NULL DEFAULT true,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `homeworks_schoolId_status_idx`(`schoolId`, `status`),
    INDEX `homeworks_academicUnitId_subjectId_idx`(`academicUnitId`, `subjectId`),
    INDEX `homeworks_teacherId_idx`(`teacherId`),
    INDEX `homeworks_dueDate_idx`(`dueDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `homework_submissions` (
    `id` VARCHAR(191) NOT NULL,
    `homeworkId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `submissionText` TEXT NULL,
    `attachments` JSON NULL,
    `status` ENUM('PENDING', 'SUBMITTED', 'LATE_SUBMITTED', 'EVALUATED', 'RETURNED') NOT NULL DEFAULT 'PENDING',
    `submittedAt` DATETIME(3) NULL,
    `marksObtained` DOUBLE NULL,
    `feedback` TEXT NULL,
    `evaluatedBy` VARCHAR(191) NULL,
    `evaluatedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `homework_submissions_homeworkId_idx`(`homeworkId`),
    INDEX `homework_submissions_studentId_idx`(`studentId`),
    INDEX `homework_submissions_status_idx`(`status`),
    UNIQUE INDEX `homework_submissions_homeworkId_studentId_key`(`homeworkId`, `studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exams` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `academicYearId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NULL,
    `targetClasses` JSON NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `code` VARCHAR(50) NULL,
    `description` TEXT NULL,
    `examType` ENUM('UNIT_TEST', 'MONTHLY_TEST', 'MID_TERM', 'FINAL', 'PRACTICAL', 'ORAL', 'VIVA', 'PROJECT', 'ASSIGNMENT', 'MOCK_TEST', 'ENTRANCE_TEST', 'INTERNAL_ASSESSMENT', 'SEMESTER_EXAM', 'LAB_EXAM', 'ACTIVITY_BASED', 'WEEKLY_TEST', 'PRACTICE_TEST', 'COMPETITIVE_PATTERN') NOT NULL DEFAULT 'MID_TERM',
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `evaluationType` ENUM('MARKS_BASED', 'GRADE_BASED', 'PERCENTAGE_BASED', 'CREDIT_BASED', 'PASS_FAIL', 'DESCRIPTIVE') NOT NULL DEFAULT 'MARKS_BASED',
    `examMode` ENUM('OFFLINE', 'ONLINE', 'HYBRID') NOT NULL DEFAULT 'OFFLINE',
    `overallPassingPercentage` DOUBLE NULL DEFAULT 33,
    `subjectWisePassing` BOOLEAN NOT NULL DEFAULT true,
    `status` ENUM('DRAFT', 'SCHEDULED', 'ONGOING', 'COMPLETED', 'MARKS_ENTRY_IN_PROGRESS', 'MARKS_ENTRY_COMPLETED', 'RESULTS_PUBLISHED', 'CANCELLED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `publishedAt` DATETIME(3) NULL,
    `publishedBy` VARCHAR(191) NULL,
    `resultsPublishedAt` DATETIME(3) NULL,
    `resultsPublishedBy` VARCHAR(191) NULL,
    `gradingSystem` JSON NULL,
    `showRank` BOOLEAN NOT NULL DEFAULT false,
    `showPercentage` BOOLEAN NOT NULL DEFAULT true,
    `showGrade` BOOLEAN NOT NULL DEFAULT true,
    `allowMarksCorrection` BOOLEAN NOT NULL DEFAULT false,
    `correctionDeadline` DATETIME(3) NULL,
    `weightage` DOUBLE NULL DEFAULT 100,
    `instructions` TEXT NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `exams_schoolId_academicYearId_idx`(`schoolId`, `academicYearId`),
    INDEX `exams_status_idx`(`status`),
    UNIQUE INDEX `exams_schoolId_academicYearId_code_key`(`schoolId`, `academicYearId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_schedules` (
    `id` VARCHAR(191) NOT NULL,
    `examId` VARCHAR(191) NOT NULL,
    `subjectId` VARCHAR(191) NOT NULL,
    `academicUnitId` VARCHAR(191) NOT NULL,
    `examDate` DATE NOT NULL,
    `startTime` VARCHAR(10) NOT NULL,
    `endTime` VARCHAR(10) NOT NULL,
    `duration` INTEGER NULL,
    `room` VARCHAR(50) NULL,
    `center` VARCHAR(100) NULL,
    `maxMarks` INTEGER NOT NULL DEFAULT 100,
    `passingMarks` INTEGER NOT NULL DEFAULT 33,
    `theoryMarks` INTEGER NULL,
    `practicalMarks` INTEGER NULL,
    `supervisorId` VARCHAR(191) NULL,
    `invigilators` JSON NULL,
    `isCompleted` BOOLEAN NOT NULL DEFAULT false,
    `marksEntryStatus` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `marksEntryLockedAt` DATETIME(3) NULL,
    `marksEntryLockedBy` VARCHAR(191) NULL,
    `instructions` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `exam_schedules_examId_idx`(`examId`),
    INDEX `exam_schedules_academicUnitId_idx`(`academicUnitId`),
    INDEX `exam_schedules_examDate_idx`(`examDate`),
    INDEX `exam_schedules_marksEntryStatus_idx`(`marksEntryStatus`),
    UNIQUE INDEX `exam_schedules_examId_subjectId_academicUnitId_key`(`examId`, `subjectId`, `academicUnitId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_results` (
    `id` VARCHAR(191) NOT NULL,
    `examId` VARCHAR(191) NOT NULL,
    `examScheduleId` VARCHAR(191) NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `subjectId` VARCHAR(191) NOT NULL,
    `maxMarks` INTEGER NOT NULL DEFAULT 100,
    `marksObtained` DOUBLE NULL,
    `theoryMarks` DOUBLE NULL,
    `practicalMarks` DOUBLE NULL,
    `percentage` DOUBLE NULL,
    `grade` VARCHAR(10) NULL,
    `isPassed` BOOLEAN NULL,
    `classRank` INTEGER NULL,
    `overallRank` INTEGER NULL,
    `isAbsent` BOOLEAN NOT NULL DEFAULT false,
    `remarks` VARCHAR(255) NULL,
    `teacherRemarks` TEXT NULL,
    `enteredBy` VARCHAR(191) NULL,
    `enteredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isDraft` BOOLEAN NOT NULL DEFAULT true,
    `submittedAt` DATETIME(3) NULL,
    `submittedBy` VARCHAR(191) NULL,
    `verifiedBy` VARCHAR(191) NULL,
    `verifiedAt` DATETIME(3) NULL,
    `isCorrected` BOOLEAN NOT NULL DEFAULT false,
    `correctionCount` INTEGER NOT NULL DEFAULT 0,
    `lastCorrectedAt` DATETIME(3) NULL,
    `lastCorrectedBy` VARCHAR(191) NULL,
    `graceMarks` DOUBLE NULL DEFAULT 0,
    `graceReason` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `exam_results_examId_idx`(`examId`),
    INDEX `exam_results_studentId_idx`(`studentId`),
    INDEX `exam_results_subjectId_idx`(`subjectId`),
    INDEX `exam_results_isDraft_idx`(`isDraft`),
    INDEX `exam_results_isPassed_idx`(`isPassed`),
    UNIQUE INDEX `exam_results_examId_studentId_subjectId_key`(`examId`, `studentId`, `subjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `marks_corrections` (
    `id` VARCHAR(191) NOT NULL,
    `examResultId` VARCHAR(191) NOT NULL,
    `previousMarks` DOUBLE NULL,
    `previousTheoryMarks` DOUBLE NULL,
    `previousPracticalMarks` DOUBLE NULL,
    `previousGrade` VARCHAR(10) NULL,
    `newMarks` DOUBLE NULL,
    `newTheoryMarks` DOUBLE NULL,
    `newPracticalMarks` DOUBLE NULL,
    `newGrade` VARCHAR(10) NULL,
    `reason` TEXT NOT NULL,
    `correctionType` VARCHAR(50) NOT NULL,
    `requestedBy` VARCHAR(191) NOT NULL,
    `requestedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `approvalStatus` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `approvedBy` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `rejectionReason` TEXT NULL,

    INDEX `marks_corrections_examResultId_idx`(`examResultId`),
    INDEX `marks_corrections_approvalStatus_idx`(`approvalStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `marks_entry_logs` (
    `id` VARCHAR(191) NOT NULL,
    `examId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(50) NOT NULL,
    `entityType` VARCHAR(50) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `metadata` JSON NULL,
    `performedBy` VARCHAR(191) NOT NULL,
    `performedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ipAddress` VARCHAR(50) NULL,

    INDEX `marks_entry_logs_examId_performedAt_idx`(`examId`, `performedAt`),
    INDEX `marks_entry_logs_performedBy_idx`(`performedBy`),
    INDEX `marks_entry_logs_action_idx`(`action`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_cards` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `examId` VARCHAR(191) NULL,
    `examIds` JSON NULL,
    `timetableId` VARCHAR(191) NULL,
    `academicYearId` VARCHAR(191) NOT NULL,
    `academicUnitId` VARCHAR(191) NOT NULL,
    `reportCardType` ENUM('EXAM_WISE', 'TERM_WISE', 'ANNUAL', 'PROGRESS_REPORT', 'TRANSCRIPT') NOT NULL DEFAULT 'EXAM_WISE',
    `title` VARCHAR(255) NOT NULL,
    `reportPeriod` VARCHAR(100) NOT NULL,
    `resultsData` JSON NOT NULL,
    `attendanceData` JSON NULL,
    `remarksData` JSON NULL,
    `fileUrl` VARCHAR(500) NULL,
    `fileSize` INTEGER NULL,
    `status` ENUM('DRAFT', 'GENERATED', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `generatedAt` DATETIME(3) NULL,
    `generatedBy` VARCHAR(191) NULL,
    `publishedAt` DATETIME(3) NULL,
    `publishedBy` VARCHAR(191) NULL,
    `downloadCount` INTEGER NOT NULL DEFAULT 0,
    `lastDownloadedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `report_cards_schoolId_studentId_idx`(`schoolId`, `studentId`),
    INDEX `report_cards_examId_idx`(`examId`),
    INDEX `report_cards_timetableId_idx`(`timetableId`),
    INDEX `report_cards_academicYearId_idx`(`academicYearId`),
    INDEX `report_cards_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_analytics` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `examId` VARCHAR(191) NOT NULL,
    `academicUnitId` VARCHAR(191) NULL,
    `subjectId` VARCHAR(191) NULL,
    `totalStudents` INTEGER NOT NULL DEFAULT 0,
    `appearedStudents` INTEGER NOT NULL DEFAULT 0,
    `absentStudents` INTEGER NOT NULL DEFAULT 0,
    `passedStudents` INTEGER NOT NULL DEFAULT 0,
    `failedStudents` INTEGER NOT NULL DEFAULT 0,
    `highestMarks` DOUBLE NULL,
    `lowestMarks` DOUBLE NULL,
    `averageMarks` DOUBLE NULL,
    `medianMarks` DOUBLE NULL,
    `gradeDistribution` JSON NULL,
    `above90` INTEGER NOT NULL DEFAULT 0,
    `between75And90` INTEGER NOT NULL DEFAULT 0,
    `between60And75` INTEGER NOT NULL DEFAULT 0,
    `between33And60` INTEGER NOT NULL DEFAULT 0,
    `below33` INTEGER NOT NULL DEFAULT 0,
    `previousExamAverage` DOUBLE NULL,
    `improvementPercentage` DOUBLE NULL,
    `calculatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `exam_analytics_schoolId_examId_idx`(`schoolId`, `examId`),
    UNIQUE INDEX `exam_analytics_examId_academicUnitId_subjectId_key`(`examId`, `academicUnitId`, `subjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_attendance` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `examId` VARCHAR(191) NOT NULL,
    `examScheduleId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `isPresent` BOOLEAN NOT NULL DEFAULT false,
    `arrivalTime` DATETIME(3) NULL,
    `departureTime` DATETIME(3) NULL,
    `lateArrival` BOOLEAN NOT NULL DEFAULT false,
    `earlyDeparture` BOOLEAN NOT NULL DEFAULT false,
    `remarks` TEXT NULL,
    `markedBy` VARCHAR(191) NOT NULL,
    `markedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `exam_attendance_examId_studentId_idx`(`examId`, `studentId`),
    INDEX `exam_attendance_examScheduleId_idx`(`examScheduleId`),
    INDEX `exam_attendance_markedBy_idx`(`markedBy`),
    UNIQUE INDEX `exam_attendance_examScheduleId_studentId_key`(`examScheduleId`, `studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_exam_summaries` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `examId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `subjectId` VARCHAR(191) NULL,
    `overallPerformance` VARCHAR(50) NOT NULL,
    `strengths` TEXT NULL,
    `weaknesses` TEXT NULL,
    `recommendations` TEXT NULL,
    `behaviorRemarks` TEXT NULL,
    `preparednessRating` SMALLINT NULL,
    `participationRating` SMALLINT NULL,
    `disciplineRating` SMALLINT NULL,
    `teacherId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `student_exam_summaries_examId_teacherId_idx`(`examId`, `teacherId`),
    INDEX `student_exam_summaries_studentId_idx`(`studentId`),
    UNIQUE INDEX `student_exam_summaries_examId_studentId_subjectId_key`(`examId`, `studentId`, `subjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_notifications` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `examId` VARCHAR(191) NULL,
    `type` ENUM('SCHEDULE_PUBLISHED', 'SCHEDULE_UPDATED', 'EXAM_REMINDER', 'MARKS_PUBLISHED', 'RESULT_PUBLISHED', 'REPORT_CARD_READY', 'EXAM_CANCELLED', 'EXAM_RESCHEDULED', 'ATTENDANCE_MARKED') NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `recipientType` VARCHAR(50) NOT NULL,
    `recipientId` VARCHAR(191) NULL,
    `academicUnitId` VARCHAR(191) NULL,
    `sendEmail` BOOLEAN NOT NULL DEFAULT true,
    `sendInApp` BOOLEAN NOT NULL DEFAULT true,
    `sendSMS` BOOLEAN NOT NULL DEFAULT false,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `readAt` DATETIME(3) NULL,
    `emailSent` BOOLEAN NOT NULL DEFAULT false,
    `emailSentAt` DATETIME(3) NULL,
    `smsSent` BOOLEAN NOT NULL DEFAULT false,
    `smsSentAt` DATETIME(3) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `scheduledFor` DATETIME(3) NULL,

    INDEX `exam_notifications_schoolId_recipientId_isRead_idx`(`schoolId`, `recipientId`, `isRead`),
    INDEX `exam_notifications_examId_idx`(`examId`),
    INDEX `exam_notifications_type_createdAt_idx`(`type`, `createdAt`),
    INDEX `exam_notifications_scheduledFor_idx`(`scheduledFor`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_hall_tickets` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `examId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `hallTicketNumber` VARCHAR(50) NOT NULL,
    `examCenter` VARCHAR(255) NULL,
    `roomNumber` VARCHAR(100) NULL,
    `seatNumber` VARCHAR(50) NULL,
    `instructions` TEXT NULL,
    `reportingTime` DATETIME(3) NULL,
    `isGenerated` BOOLEAN NOT NULL DEFAULT false,
    `generatedAt` DATETIME(3) NULL,
    `isDownloaded` BOOLEAN NOT NULL DEFAULT false,
    `downloadedAt` DATETIME(3) NULL,
    `downloadCount` INTEGER NOT NULL DEFAULT 0,
    `qrCode` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `exam_hall_tickets_hallTicketNumber_key`(`hallTicketNumber`),
    INDEX `exam_hall_tickets_hallTicketNumber_idx`(`hallTicketNumber`),
    INDEX `exam_hall_tickets_examId_idx`(`examId`),
    UNIQUE INDEX `exam_hall_tickets_examId_studentId_key`(`examId`, `studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_question_papers` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `examId` VARCHAR(191) NOT NULL,
    `examScheduleId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `paperCode` VARCHAR(50) NULL,
    `setNumber` VARCHAR(10) NULL,
    `fileUrl` TEXT NOT NULL,
    `fileName` VARCHAR(255) NOT NULL,
    `fileSize` INTEGER NULL,
    `fileType` VARCHAR(50) NULL,
    `isConfidential` BOOLEAN NOT NULL DEFAULT true,
    `password` VARCHAR(255) NULL,
    `uploadedBy` VARCHAR(191) NOT NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    `approvedBy` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,

    INDEX `exam_question_papers_examScheduleId_idx`(`examScheduleId`),
    INDEX `exam_question_papers_examId_idx`(`examId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_answer_sheets` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `examId` VARCHAR(191) NOT NULL,
    `examScheduleId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `sheetNumber` VARCHAR(50) NULL,
    `fileUrl` TEXT NULL,
    `fileName` VARCHAR(255) NULL,
    `fileSize` INTEGER NULL,
    `isSubmitted` BOOLEAN NOT NULL DEFAULT false,
    `submittedAt` DATETIME(3) NULL,
    `submissionMode` VARCHAR(50) NULL,
    `assignedTo` VARCHAR(191) NULL,
    `assignedAt` DATETIME(3) NULL,
    `evaluationStatus` VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    `evaluatedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `exam_answer_sheets_examId_studentId_idx`(`examId`, `studentId`),
    INDEX `exam_answer_sheets_assignedTo_evaluationStatus_idx`(`assignedTo`, `evaluationStatus`),
    UNIQUE INDEX `exam_answer_sheets_examScheduleId_studentId_key`(`examScheduleId`, `studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `grading_schemes` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `boundaries` JSON NOT NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `applicableExamTypes` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `grading_schemes_schoolId_isActive_idx`(`schoolId`, `isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_performance_comparisons` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `subjectId` VARCHAR(191) NOT NULL,
    `currentExamId` VARCHAR(191) NOT NULL,
    `currentMarks` DOUBLE NOT NULL,
    `currentPercentage` DOUBLE NOT NULL,
    `previousExamId` VARCHAR(191) NULL,
    `previousMarks` DOUBLE NULL,
    `previousPercentage` DOUBLE NULL,
    `marksImprovement` DOUBLE NULL,
    `percentageImprovement` DOUBLE NULL,
    `rankImprovement` INTEGER NULL,
    `trend` VARCHAR(20) NOT NULL,
    `performanceLevel` VARCHAR(50) NOT NULL,
    `recommendations` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `exam_performance_comparisons_schoolId_studentId_idx`(`schoolId`, `studentId`),
    INDEX `exam_performance_comparisons_currentExamId_idx`(`currentExamId`),
    UNIQUE INDEX `exam_performance_comparisons_studentId_subjectId_currentExam_key`(`studentId`, `subjectId`, `currentExamId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_seating_arrangements` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `examId` VARCHAR(191) NOT NULL,
    `venueName` VARCHAR(255) NOT NULL,
    `roomNumber` VARCHAR(100) NOT NULL,
    `capacity` INTEGER NOT NULL,
    `rowsCount` INTEGER NOT NULL,
    `seatsPerRow` INTEGER NOT NULL,
    `seatingPlan` JSON NOT NULL,
    `alternateSeating` BOOLEAN NOT NULL DEFAULT true,
    `randomSeating` BOOLEAN NOT NULL DEFAULT false,
    `isGenerated` BOOLEAN NOT NULL DEFAULT false,
    `generatedAt` DATETIME(3) NULL,
    `generatedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `exam_seating_arrangements_examId_idx`(`examId`),
    INDEX `exam_seating_arrangements_schoolId_idx`(`schoolId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invigilator_duties` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `examScheduleId` VARCHAR(191) NOT NULL,
    `teacherId` VARCHAR(191) NOT NULL,
    `dutyType` VARCHAR(50) NOT NULL,
    `venueName` VARCHAR(255) NULL,
    `roomNumber` VARCHAR(100) NULL,
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NOT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'ASSIGNED',
    `confirmedAt` DATETIME(3) NULL,
    `specialInstructions` TEXT NULL,
    `remarks` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `invigilator_duties_teacherId_status_idx`(`teacherId`, `status`),
    INDEX `invigilator_duties_examScheduleId_idx`(`examScheduleId`),
    UNIQUE INDEX `invigilator_duties_examScheduleId_teacherId_key`(`examScheduleId`, `teacherId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_preferences` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `emailEnabled` BOOLEAN NOT NULL DEFAULT true,
    `emailExamSchedule` BOOLEAN NOT NULL DEFAULT true,
    `emailExamReminder` BOOLEAN NOT NULL DEFAULT true,
    `emailMarksPublished` BOOLEAN NOT NULL DEFAULT true,
    `emailResultPublished` BOOLEAN NOT NULL DEFAULT true,
    `emailReportCard` BOOLEAN NOT NULL DEFAULT true,
    `inAppEnabled` BOOLEAN NOT NULL DEFAULT true,
    `inAppExamSchedule` BOOLEAN NOT NULL DEFAULT true,
    `inAppExamReminder` BOOLEAN NOT NULL DEFAULT true,
    `inAppMarksPublished` BOOLEAN NOT NULL DEFAULT true,
    `inAppResultPublished` BOOLEAN NOT NULL DEFAULT true,
    `smsEnabled` BOOLEAN NOT NULL DEFAULT false,
    `smsExamReminder` BOOLEAN NOT NULL DEFAULT false,
    `smsResultPublished` BOOLEAN NOT NULL DEFAULT false,
    `reminderDaysBefore` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `notification_preferences_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_insights` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `examId` VARCHAR(191) NOT NULL,
    `insightType` VARCHAR(100) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `metrics` JSON NOT NULL,
    `severity` VARCHAR(50) NULL,
    `recommendations` TEXT NULL,
    `isActionable` BOOLEAN NOT NULL DEFAULT false,
    `isResolved` BOOLEAN NOT NULL DEFAULT false,
    `resolvedAt` DATETIME(3) NULL,
    `generatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `exam_insights_examId_insightType_idx`(`examId`, `insightType`),
    INDEX `exam_insights_schoolId_isResolved_idx`(`schoolId`, `isResolved`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `resources` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `academicYearId` VARCHAR(191) NULL,
    `academicUnitId` VARCHAR(191) NULL,
    `subjectId` VARCHAR(191) NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `resourceType` ENUM('PDF', 'VIDEO', 'LINK', 'DOCUMENT', 'IMAGE', 'AUDIO', 'OTHER') NOT NULL DEFAULT 'PDF',
    `fileUrl` VARCHAR(500) NOT NULL,
    `thumbnailUrl` VARCHAR(500) NULL,
    `fileSize` INTEGER NULL,
    `mimeType` VARCHAR(100) NULL,
    `chapter` VARCHAR(100) NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `tags` JSON NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT false,
    `allowDownload` BOOLEAN NOT NULL DEFAULT true,
    `uploadedBy` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `resources_schoolId_isActive_idx`(`schoolId`, `isActive`),
    INDEX `resources_academicUnitId_idx`(`academicUnitId`),
    INDEX `resources_subjectId_idx`(`subjectId`),
    INDEX `resources_resourceType_idx`(`resourceType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notices` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `content` TEXT NOT NULL,
    `noticeType` ENUM('GENERAL', 'ACADEMIC', 'EVENT', 'HOLIDAY', 'FEE_REMINDER', 'EXAM', 'EMERGENCY', 'ADMINISTRATIVE') NOT NULL DEFAULT 'GENERAL',
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
    `targetType` ENUM('ALL', 'STUDENTS', 'PARENTS', 'TEACHERS', 'CLASS', 'INDIVIDUAL') NOT NULL DEFAULT 'ALL',
    `targetIds` JSON NULL,
    `academicYearId` VARCHAR(191) NULL,
    `attachments` JSON NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT false,
    `publishedAt` DATETIME(3) NULL,
    `publishedBy` VARCHAR(191) NULL,
    `scheduledFor` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `notices_schoolId_isPublished_idx`(`schoolId`, `isPublished`),
    INDEX `notices_schoolId_noticeType_idx`(`schoolId`, `noticeType`),
    INDEX `notices_publishedAt_idx`(`publishedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `channel` ENUM('IN_APP', 'EMAIL', 'SMS', 'PUSH') NOT NULL DEFAULT 'IN_APP',
    `referenceType` VARCHAR(50) NULL,
    `referenceId` VARCHAR(191) NULL,
    `actionUrl` VARCHAR(500) NULL,
    `status` ENUM('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `sentAt` DATETIME(3) NULL,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_userId_status_idx`(`userId`, `status`),
    INDEX `notifications_schoolId_createdAt_idx`(`schoolId`, `createdAt`),
    INDEX `notifications_userId_readAt_idx`(`userId`, `readAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fee_structures` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `academicYearId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NULL,
    `academicUnitId` VARCHAR(191) NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isLocked` BOOLEAN NOT NULL DEFAULT false,
    `createdBy` VARCHAR(191) NULL,
    `approvedBy` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `fee_structures_schoolId_academicYearId_idx`(`schoolId`, `academicYearId`),
    INDEX `fee_structures_academicUnitId_idx`(`academicUnitId`),
    INDEX `fee_structures_isActive_idx`(`isActive`),
    UNIQUE INDEX `fee_structures_schoolId_academicYearId_name_key`(`schoolId`, `academicYearId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fee_components` (
    `id` VARCHAR(191) NOT NULL,
    `feeStructureId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `feeType` ENUM('TUITION', 'ADMISSION', 'EXAMINATION', 'LIBRARY', 'LABORATORY', 'TRANSPORT', 'HOSTEL', 'ACTIVITY', 'UNIFORM', 'BOOKS', 'SPORTS', 'MISCELLANEOUS', 'OTHER') NOT NULL DEFAULT 'TUITION',
    `description` TEXT NULL,
    `amount` DOUBLE NOT NULL,
    `frequency` ENUM('ONE_TIME', 'MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUAL', 'CUSTOM') NOT NULL DEFAULT 'ONE_TIME',
    `isMandatory` BOOLEAN NOT NULL DEFAULT true,
    `dueDate` DATETIME(3) NULL,
    `allowPartialPayment` BOOLEAN NOT NULL DEFAULT true,
    `lateFeeApplicable` BOOLEAN NOT NULL DEFAULT false,
    `lateFeeAmount` DOUBLE NULL,
    `lateFeePercentage` DOUBLE NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `fee_components_feeStructureId_idx`(`feeStructureId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fee_installments` (
    `id` VARCHAR(191) NOT NULL,
    `feeComponentId` VARCHAR(191) NOT NULL,
    `installmentNumber` INTEGER NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `dueDate` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fee_installments_feeComponentId_idx`(`feeComponentId`),
    UNIQUE INDEX `fee_installments_feeComponentId_installmentNumber_key`(`feeComponentId`, `installmentNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_fees` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `feeStructureId` VARCHAR(191) NOT NULL,
    `academicYearId` VARCHAR(191) NOT NULL,
    `totalAmount` DOUBLE NOT NULL,
    `discountAmount` DOUBLE NOT NULL DEFAULT 0,
    `scholarshipAmount` DOUBLE NOT NULL DEFAULT 0,
    `taxAmount` DOUBLE NOT NULL DEFAULT 0,
    `finalAmount` DOUBLE NOT NULL,
    `paidAmount` DOUBLE NOT NULL DEFAULT 0,
    `balanceAmount` DOUBLE NOT NULL,
    `status` ENUM('PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'WAIVED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `dueDate` DATETIME(3) NULL,
    `isCustomPlan` BOOLEAN NOT NULL DEFAULT false,
    `customPlanDetails` JSON NULL,
    `assignedBy` VARCHAR(191) NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isOverridden` BOOLEAN NOT NULL DEFAULT false,
    `overrideReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `student_fees_schoolId_idx`(`schoolId`),
    INDEX `student_fees_studentId_idx`(`studentId`),
    INDEX `student_fees_status_idx`(`status`),
    INDEX `student_fees_academicYearId_idx`(`academicYearId`),
    INDEX `student_fees_dueDate_idx`(`dueDate`),
    UNIQUE INDEX `student_fees_studentId_feeStructureId_key`(`studentId`, `feeStructureId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `studentFeeId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `paymentMethod` ENUM('CASH', 'CHEQUE', 'DEMAND_DRAFT', 'BANK_TRANSFER', 'ONLINE', 'UPI', 'CARD', 'NET_BANKING') NOT NULL DEFAULT 'CASH',
    `transactionId` VARCHAR(100) NULL,
    `transactionDate` DATETIME(3) NULL,
    `referenceNumber` VARCHAR(100) NULL,
    `bankName` VARCHAR(100) NULL,
    `branchName` VARCHAR(100) NULL,
    `gatewayStatus` ENUM('INITIATED', 'PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED') NULL,
    `gatewayResponse` JSON NULL,
    `receiptNumber` VARCHAR(50) NOT NULL,
    `receiptUrl` VARCHAR(500) NULL,
    `receiptGeneratedAt` DATETIME(3) NULL,
    `allocationDetails` JSON NULL,
    `lateFeeAmount` DOUBLE NOT NULL DEFAULT 0,
    `paidAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `recordedBy` VARCHAR(191) NULL,
    `requiresApproval` BOOLEAN NOT NULL DEFAULT false,
    `approvalStatus` VARCHAR(20) NULL,
    `approvedBy` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `isReconciled` BOOLEAN NOT NULL DEFAULT false,
    `reconciledBy` VARCHAR(191) NULL,
    `reconciledAt` DATETIME(3) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
    `remarks` TEXT NULL,
    `isReversed` BOOLEAN NOT NULL DEFAULT false,
    `reversalReason` TEXT NULL,
    `reversedBy` VARCHAR(191) NULL,
    `reversedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payments_receiptNumber_key`(`receiptNumber`),
    INDEX `payments_schoolId_idx`(`schoolId`),
    INDEX `payments_studentFeeId_idx`(`studentFeeId`),
    INDEX `payments_studentId_idx`(`studentId`),
    INDEX `payments_paidAt_idx`(`paidAt`),
    INDEX `payments_receiptNumber_idx`(`receiptNumber`),
    INDEX `payments_status_idx`(`status`),
    INDEX `payments_paymentMethod_idx`(`paymentMethod`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fee_discounts` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `studentFeeId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `discountType` ENUM('PERCENTAGE', 'FIXED_AMOUNT') NOT NULL DEFAULT 'PERCENTAGE',
    `discountValue` DOUBLE NOT NULL,
    `discountAmount` DOUBLE NOT NULL,
    `applicableComponents` JSON NULL,
    `isRecurring` BOOLEAN NOT NULL DEFAULT false,
    `recurringMonths` INTEGER NULL,
    `reason` TEXT NOT NULL,
    `approvedBy` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `fee_discounts_schoolId_idx`(`schoolId`),
    INDEX `fee_discounts_studentFeeId_idx`(`studentFeeId`),
    INDEX `fee_discounts_studentId_idx`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fee_scholarships` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `studentFeeId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `scholarshipType` ENUM('PERCENTAGE', 'FIXED_AMOUNT') NOT NULL DEFAULT 'PERCENTAGE',
    `scholarshipValue` DOUBLE NOT NULL,
    `scholarshipAmount` DOUBLE NOT NULL,
    `provider` VARCHAR(255) NULL,
    `referenceNumber` VARCHAR(100) NULL,
    `validFrom` DATETIME(3) NOT NULL,
    `validTo` DATETIME(3) NULL,
    `applicableComponents` JSON NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `appliedBy` VARCHAR(191) NULL,
    `appliedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `approvedBy` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `rejectionReason` TEXT NULL,
    `documents` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `fee_scholarships_schoolId_idx`(`schoolId`),
    INDEX `fee_scholarships_studentFeeId_idx`(`studentFeeId`),
    INDEX `fee_scholarships_studentId_idx`(`studentId`),
    INDEX `fee_scholarships_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refunds` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `paymentId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `refundAmount` DOUBLE NOT NULL,
    `refundReason` TEXT NOT NULL,
    `refundType` VARCHAR(50) NOT NULL,
    `refundMethod` ENUM('CASH', 'CHEQUE', 'DEMAND_DRAFT', 'BANK_TRANSFER', 'ONLINE', 'UPI', 'CARD', 'NET_BANKING') NOT NULL DEFAULT 'BANK_TRANSFER',
    `accountHolderName` VARCHAR(255) NULL,
    `accountNumber` VARCHAR(50) NULL,
    `ifscCode` VARCHAR(20) NULL,
    `bankName` VARCHAR(100) NULL,
    `transactionId` VARCHAR(100) NULL,
    `transactionDate` DATETIME(3) NULL,
    `status` ENUM('INITIATED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'PROCESSED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'INITIATED',
    `initiatedBy` VARCHAR(191) NOT NULL,
    `initiatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `approvedBy` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `processedBy` VARCHAR(191) NULL,
    `processedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `rejectionReason` TEXT NULL,
    `rejectedBy` VARCHAR(191) NULL,
    `rejectedAt` DATETIME(3) NULL,
    `documents` JSON NULL,
    `remarks` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `refunds_schoolId_idx`(`schoolId`),
    INDEX `refunds_paymentId_idx`(`paymentId`),
    INDEX `refunds_studentId_idx`(`studentId`),
    INDEX `refunds_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoices` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `studentFeeId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `invoiceNumber` VARCHAR(50) NOT NULL,
    `invoiceDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dueDate` DATETIME(3) NULL,
    `subtotal` DOUBLE NOT NULL,
    `discountAmount` DOUBLE NOT NULL DEFAULT 0,
    `taxAmount` DOUBLE NOT NULL DEFAULT 0,
    `totalAmount` DOUBLE NOT NULL,
    `paidAmount` DOUBLE NOT NULL DEFAULT 0,
    `balanceAmount` DOUBLE NOT NULL,
    `taxPercentage` DOUBLE NULL,
    `taxNumber` VARCHAR(50) NULL,
    `lineItems` JSON NOT NULL,
    `status` ENUM('DRAFT', 'GENERATED', 'SENT', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED') NOT NULL DEFAULT 'GENERATED',
    `pdfUrl` VARCHAR(500) NULL,
    `pdfGeneratedAt` DATETIME(3) NULL,
    `sentTo` VARCHAR(255) NULL,
    `sentAt` DATETIME(3) NULL,
    `generatedBy` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `termsConditions` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `invoices_invoiceNumber_key`(`invoiceNumber`),
    INDEX `invoices_schoolId_idx`(`schoolId`),
    INDEX `invoices_studentFeeId_idx`(`studentFeeId`),
    INDEX `invoices_studentId_idx`(`studentId`),
    INDEX `invoices_invoiceNumber_idx`(`invoiceNumber`),
    INDEX `invoices_status_idx`(`status`),
    INDEX `invoices_invoiceDate_idx`(`invoiceDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `finance_settings` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `receiptPrefix` VARCHAR(10) NOT NULL DEFAULT 'RCP',
    `receiptStartNumber` INTEGER NOT NULL DEFAULT 1,
    `currentReceiptNumber` INTEGER NOT NULL DEFAULT 1,
    `invoicePrefix` VARCHAR(10) NOT NULL DEFAULT 'INV',
    `invoiceStartNumber` INTEGER NOT NULL DEFAULT 1,
    `currentInvoiceNumber` INTEGER NOT NULL DEFAULT 1,
    `enableGST` BOOLEAN NOT NULL DEFAULT false,
    `gstNumber` VARCHAR(50) NULL,
    `gstPercentage` DOUBLE NULL,
    `enableLateFee` BOOLEAN NOT NULL DEFAULT true,
    `lateFeeType` VARCHAR(20) NULL,
    `lateFeeAmount` DOUBLE NULL,
    `lateFeePercentage` DOUBLE NULL,
    `lateFeeGraceDays` INTEGER NOT NULL DEFAULT 0,
    `enableOnlinePayment` BOOLEAN NOT NULL DEFAULT false,
    `paymentGateway` VARCHAR(50) NULL,
    `gatewayConfig` JSON NULL,
    `enablePaymentReminders` BOOLEAN NOT NULL DEFAULT true,
    `reminderDaysBefore` JSON NULL,
    `reminderDaysAfter` JSON NULL,
    `requirePaymentApproval` BOOLEAN NOT NULL DEFAULT false,
    `requireRefundApproval` BOOLEAN NOT NULL DEFAULT true,
    `requireDiscountApproval` BOOLEAN NOT NULL DEFAULT true,
    `institutionName` VARCHAR(255) NULL,
    `institutionAddress` TEXT NULL,
    `institutionPhone` VARCHAR(20) NULL,
    `institutionEmail` VARCHAR(255) NULL,
    `institutionLogo` VARCHAR(500) NULL,
    `bankAccounts` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `finance_settings_schoolId_key`(`schoolId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `finance_audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(50) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `paymentId` VARCHAR(191) NULL,
    `refundId` VARCHAR(191) NULL,
    `discountId` VARCHAR(191) NULL,
    `scholarshipId` VARCHAR(191) NULL,
    `action` VARCHAR(50) NOT NULL,
    `description` TEXT NOT NULL,
    `previousData` JSON NULL,
    `newData` JSON NULL,
    `userId` VARCHAR(191) NOT NULL,
    `userName` VARCHAR(255) NOT NULL,
    `userRole` VARCHAR(50) NOT NULL,
    `ipAddress` VARCHAR(50) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `finance_audit_logs_schoolId_createdAt_idx`(`schoolId`, `createdAt`),
    INDEX `finance_audit_logs_entityType_entityId_idx`(`entityType`, `entityId`),
    INDEX `finance_audit_logs_userId_idx`(`userId`),
    INDEX `finance_audit_logs_paymentId_idx`(`paymentId`),
    INDEX `finance_audit_logs_refundId_idx`(`refundId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assignments` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `academicYearId` VARCHAR(191) NOT NULL,
    `academicUnitId` VARCHAR(191) NOT NULL,
    `sectionId` VARCHAR(191) NULL,
    `subjectId` VARCHAR(191) NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `instructions` TEXT NULL,
    `type` ENUM('HOMEWORK', 'PRACTICE', 'PROJECT', 'ACTIVITY', 'ASSESSMENT') NOT NULL DEFAULT 'HOMEWORK',
    `category` ENUM('INDIVIDUAL', 'GROUP') NOT NULL DEFAULT 'INDIVIDUAL',
    `submissionMode` ENUM('ONLINE', 'OFFLINE', 'BOTH') NOT NULL DEFAULT 'ONLINE',
    `maxMarks` INTEGER NULL,
    `dueDate` DATETIME(3) NOT NULL,
    `dueTime` VARCHAR(10) NULL,
    `status` ENUM('DRAFT', 'SCHEDULED', 'PUBLISHED', 'CLOSED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `publishedAt` DATETIME(3) NULL,
    `scheduledFor` DATETIME(3) NULL,
    `allowLateSubmission` BOOLEAN NOT NULL DEFAULT false,
    `allowResubmission` BOOLEAN NOT NULL DEFAULT false,
    `resubmissionDeadline` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `assignments_schoolId_status_idx`(`schoolId`, `status`),
    INDEX `assignments_academicYearId_idx`(`academicYearId`),
    INDEX `assignments_academicUnitId_idx`(`academicUnitId`),
    INDEX `assignments_subjectId_idx`(`subjectId`),
    INDEX `assignments_createdById_idx`(`createdById`),
    INDEX `assignments_dueDate_idx`(`dueDate`),
    INDEX `assignments_status_publishedAt_idx`(`status`, `publishedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assignment_attachments` (
    `id` VARCHAR(191) NOT NULL,
    `assignmentId` VARCHAR(191) NOT NULL,
    `type` ENUM('FILE', 'LINK', 'IMAGE') NOT NULL DEFAULT 'FILE',
    `url` VARCHAR(500) NOT NULL,
    `fileName` VARCHAR(255) NULL,
    `fileSize` INTEGER NULL,
    `mimeType` VARCHAR(100) NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `assignment_attachments_assignmentId_idx`(`assignmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assignment_submissions` (
    `id` VARCHAR(191) NOT NULL,
    `assignmentId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NULL,
    `groupId` VARCHAR(191) NULL,
    `submittedAt` DATETIME(3) NULL,
    `status` ENUM('PENDING', 'SUBMITTED', 'LATE', 'EVALUATED', 'RETURNED') NOT NULL DEFAULT 'PENDING',
    `isLate` BOOLEAN NOT NULL DEFAULT false,
    `remarks` TEXT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `previousSubmissionId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `assignment_submissions_assignmentId_idx`(`assignmentId`),
    INDEX `assignment_submissions_studentId_idx`(`studentId`),
    INDEX `assignment_submissions_groupId_idx`(`groupId`),
    INDEX `assignment_submissions_status_idx`(`status`),
    INDEX `assignment_submissions_submittedAt_idx`(`submittedAt`),
    UNIQUE INDEX `assignment_submissions_assignmentId_studentId_version_key`(`assignmentId`, `studentId`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `submission_attachments` (
    `id` VARCHAR(191) NOT NULL,
    `submissionId` VARCHAR(191) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `fileName` VARCHAR(255) NULL,
    `fileSize` INTEGER NULL,
    `mimeType` VARCHAR(100) NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `submission_attachments_submissionId_idx`(`submissionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assignment_evaluations` (
    `id` VARCHAR(191) NOT NULL,
    `submissionId` VARCHAR(191) NOT NULL,
    `evaluatedById` VARCHAR(191) NOT NULL,
    `marksObtained` DOUBLE NULL,
    `feedback` TEXT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `evaluatedAt` DATETIME(3) NULL,
    `evaluatedAttachments` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `assignment_evaluations_submissionId_key`(`submissionId`),
    INDEX `assignment_evaluations_evaluatedById_idx`(`evaluatedById`),
    INDEX `assignment_evaluations_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assignment_groups` (
    `id` VARCHAR(191) NOT NULL,
    `assignmentId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `leaderId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `assignment_groups_assignmentId_idx`(`assignmentId`),
    UNIQUE INDEX `assignment_groups_assignmentId_name_key`(`assignmentId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_group_members` (
    `id` VARCHAR(191) NOT NULL,
    `groupId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `student_group_members_groupId_idx`(`groupId`),
    INDEX `student_group_members_studentId_idx`(`studentId`),
    UNIQUE INDEX `student_group_members_groupId_studentId_key`(`groupId`, `studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `class_teachers` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `academicYearId` VARCHAR(191) NOT NULL,
    `academicUnitId` VARCHAR(191) NOT NULL,
    `teacherId` VARCHAR(191) NOT NULL,
    `isPrimary` BOOLEAN NOT NULL DEFAULT true,
    `effectiveFrom` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `effectiveTo` DATETIME(3) NULL,
    `assignedBy` VARCHAR(191) NULL,
    `notes` VARCHAR(500) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `class_teachers_schoolId_academicYearId_idx`(`schoolId`, `academicYearId`),
    INDEX `class_teachers_teacherId_academicYearId_idx`(`teacherId`, `academicYearId`),
    INDEX `class_teachers_academicUnitId_isActive_idx`(`academicUnitId`, `isActive`),
    INDEX `class_teachers_academicUnitId_academicYearId_isPrimary_idx`(`academicUnitId`, `academicYearId`, `isPrimary`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teacher_class_assignments` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `academicYearId` VARCHAR(191) NOT NULL,
    `teacherId` VARCHAR(191) NOT NULL,
    `subjectId` VARCHAR(191) NOT NULL,
    `academicUnitId` VARCHAR(191) NOT NULL,
    `assignmentType` ENUM('REGULAR', 'TEAM_TEACHING', 'SUBSTITUTE', 'GUEST', 'ASSISTANT', 'LAB_INSTRUCTOR', 'ACTIVITY') NOT NULL DEFAULT 'REGULAR',
    `isPrimary` BOOLEAN NOT NULL DEFAULT true,
    `effectiveFrom` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `effectiveTo` DATETIME(3) NULL,
    `periodsPerWeek` INTEGER NULL,
    `assignedBy` VARCHAR(191) NULL,
    `notes` VARCHAR(500) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `teacher_class_assignments_schoolId_academicYearId_idx`(`schoolId`, `academicYearId`),
    INDEX `teacher_class_assignments_teacherId_academicYearId_idx`(`teacherId`, `academicYearId`),
    INDEX `teacher_class_assignments_subjectId_academicYearId_idx`(`subjectId`, `academicYearId`),
    INDEX `teacher_class_assignments_academicUnitId_isActive_idx`(`academicUnitId`, `isActive`),
    INDEX `teacher_class_assignments_academicUnitId_subjectId_teacherId_idx`(`academicUnitId`, `subjectId`, `teacherId`, `academicYearId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teacher_assignment_history` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `assignmentCategory` VARCHAR(20) NOT NULL,
    `assignmentId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(20) NOT NULL,
    `previousData` JSON NULL,
    `newData` JSON NULL,
    `changeReason` VARCHAR(500) NULL,
    `changedBy` VARCHAR(191) NOT NULL,
    `changedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `teacher_assignment_history_schoolId_assignmentId_idx`(`schoolId`, `assignmentId`),
    INDEX `teacher_assignment_history_schoolId_changedAt_idx`(`schoolId`, `changedAt`),
    INDEX `teacher_assignment_history_assignmentCategory_assignmentId_idx`(`assignmentCategory`, `assignmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_timetables` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `academicYearId` VARCHAR(191) NOT NULL,
    `academicUnitId` VARCHAR(191) NOT NULL,
    `examName` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    `publishedAt` DATETIME(3) NULL,
    `publishedBy` VARCHAR(191) NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `exam_timetables_schoolId_academicYearId_idx`(`schoolId`, `academicYearId`),
    INDEX `exam_timetables_academicUnitId_status_idx`(`academicUnitId`, `status`),
    INDEX `exam_timetables_startDate_endDate_idx`(`startDate`, `endDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_timetable_slots` (
    `id` VARCHAR(191) NOT NULL,
    `timetableId` VARCHAR(191) NOT NULL,
    `slotOrder` INTEGER NOT NULL,
    `examDate` DATETIME(3) NOT NULL,
    `startTime` VARCHAR(10) NOT NULL,
    `endTime` VARCHAR(10) NOT NULL,
    `subjectId` VARCHAR(191) NULL,
    `maxMarks` INTEGER NULL,
    `minMarks` INTEGER NULL,
    `supervisorId` VARCHAR(191) NULL,
    `supervisorName` VARCHAR(255) NULL,
    `type` VARCHAR(20) NOT NULL,
    `room` VARCHAR(100) NULL,
    `instructions` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `exam_timetable_slots_timetableId_slotOrder_idx`(`timetableId`, `slotOrder`),
    INDEX `exam_timetable_slots_examDate_idx`(`examDate`),
    INDEX `exam_timetable_slots_subjectId_idx`(`subjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admit_cards` (
    `id` VARCHAR(191) NOT NULL,
    `timetableId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `hallTicketNo` VARCHAR(50) NOT NULL,
    `examCenter` VARCHAR(255) NULL,
    `roomNumber` VARCHAR(50) NULL,
    `seatNumber` VARCHAR(50) NULL,
    `reportingTime` VARCHAR(10) NULL,
    `instructions` TEXT NULL,
    `pdfUrl` VARCHAR(500) NULL,
    `generatedAt` DATETIME(3) NULL,
    `downloadCount` INTEGER NOT NULL DEFAULT 0,
    `lastDownloadAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `admit_cards_hallTicketNo_key`(`hallTicketNo`),
    INDEX `admit_cards_timetableId_idx`(`timetableId`),
    INDEX `admit_cards_studentId_idx`(`studentId`),
    INDEX `admit_cards_hallTicketNo_idx`(`hallTicketNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_slot_attendance` (
    `id` VARCHAR(191) NOT NULL,
    `slotId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `photoUrl` VARCHAR(500) NULL,
    `markedBy` VARCHAR(191) NOT NULL,
    `remarks` VARCHAR(500) NULL,
    `markedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `exam_slot_attendance_slotId_idx`(`slotId`),
    INDEX `exam_slot_attendance_studentId_idx`(`studentId`),
    INDEX `exam_slot_attendance_status_idx`(`status`),
    UNIQUE INDEX `exam_slot_attendance_slotId_studentId_key`(`slotId`, `studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_timetable_notifications` (
    `id` VARCHAR(191) NOT NULL,
    `timetableId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `sentViaApp` BOOLEAN NOT NULL DEFAULT false,
    `sentViaEmail` BOOLEAN NOT NULL DEFAULT false,
    `sentViaSMS` BOOLEAN NOT NULL DEFAULT false,
    `emailSentAt` DATETIME(3) NULL,
    `emailStatus` VARCHAR(20) NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `exam_timetable_notifications_userId_isRead_idx`(`userId`, `isRead`),
    INDEX `exam_timetable_notifications_timetableId_idx`(`timetableId`),
    INDEX `exam_timetable_notifications_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `marks_change_requests` (
    `id` VARCHAR(191) NOT NULL,
    `resultId` VARCHAR(191) NOT NULL,
    `requestedBy` VARCHAR(191) NOT NULL,
    `oldMarks` DOUBLE NOT NULL,
    `newMarks` DOUBLE NOT NULL,
    `reason` TEXT NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `approvedBy` VARCHAR(191) NULL,
    `approvalRemarks` TEXT NULL,
    `approvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `marks_change_requests_resultId_idx`(`resultId`),
    INDEX `marks_change_requests_requestedBy_idx`(`requestedBy`),
    INDEX `marks_change_requests_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(50) NOT NULL,
    `entityId` VARCHAR(255) NOT NULL,
    `action` VARCHAR(50) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `oldValue` JSON NULL,
    `newValue` JSON NULL,
    `ipAddress` VARCHAR(50) NULL,
    `userAgent` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_schoolId_entityType_entityId_idx`(`schoolId`, `entityType`, `entityId`),
    INDEX `audit_logs_userId_idx`(`userId`),
    INDEX `audit_logs_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `institution_signatures` (
    `id` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `teacherId` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(500) NOT NULL,
    `uploadedBy` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `institution_signatures_schoolId_type_isActive_idx`(`schoolId`, `type`, `isActive`),
    INDEX `institution_signatures_teacherId_idx`(`teacherId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `login_logs` ADD CONSTRAINT `login_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `password_reset_otps` ADD CONSTRAINT `password_reset_otps_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `courses` ADD CONSTRAINT `courses_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `academic_years` ADD CONSTRAINT `academic_years_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `academic_units` ADD CONSTRAINT `academic_units_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `academic_units` ADD CONSTRAINT `academic_units_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `academic_units`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `academic_units` ADD CONSTRAINT `academic_units_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `academic_units` ADD CONSTRAINT `academic_units_academicYearId_fkey` FOREIGN KEY (`academicYearId`) REFERENCES `academic_years`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teachers` ADD CONSTRAINT `teachers_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teachers` ADD CONSTRAINT `teachers_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_subjects` ADD CONSTRAINT `teacher_subjects_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `teachers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_subjects` ADD CONSTRAINT `teacher_subjects_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subjects` ADD CONSTRAINT `subjects_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subjects` ADD CONSTRAINT `subjects_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `academic_unit_subjects` ADD CONSTRAINT `academic_unit_subjects_academicUnitId_fkey` FOREIGN KEY (`academicUnitId`) REFERENCES `academic_units`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `academic_unit_subjects` ADD CONSTRAINT `academic_unit_subjects_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timetable_templates` ADD CONSTRAINT `timetable_templates_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `period_timings` ADD CONSTRAINT `period_timings_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `timetable_templates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timetables` ADD CONSTRAINT `timetables_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timetables` ADD CONSTRAINT `timetables_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `timetable_templates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timetables` ADD CONSTRAINT `timetables_academicUnitId_fkey` FOREIGN KEY (`academicUnitId`) REFERENCES `academic_units`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timetable_slots` ADD CONSTRAINT `timetable_slots_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timetable_slots` ADD CONSTRAINT `timetable_slots_timetableId_fkey` FOREIGN KEY (`timetableId`) REFERENCES `timetables`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timetable_slots` ADD CONSTRAINT `timetable_slots_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `timetable_templates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timetable_slots` ADD CONSTRAINT `timetable_slots_academicUnitId_fkey` FOREIGN KEY (`academicUnitId`) REFERENCES `academic_units`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timetable_slots` ADD CONSTRAINT `timetable_slots_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timetable_slots` ADD CONSTRAINT `timetable_slots_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `teachers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_academicYearId_fkey` FOREIGN KEY (`academicYearId`) REFERENCES `academic_years`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_academicUnitId_fkey` FOREIGN KEY (`academicUnitId`) REFERENCES `academic_units`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_enrollments` ADD CONSTRAINT `student_enrollments_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_enrollments` ADD CONSTRAINT `student_enrollments_academicYearId_fkey` FOREIGN KEY (`academicYearId`) REFERENCES `academic_years`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_enrollments` ADD CONSTRAINT `student_enrollments_academicUnitId_fkey` FOREIGN KEY (`academicUnitId`) REFERENCES `academic_units`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_enrollments` ADD CONSTRAINT `student_enrollments_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `guardians` ADD CONSTRAINT `guardians_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `guardians` ADD CONSTRAINT `guardians_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_guardians` ADD CONSTRAINT `student_guardians_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_guardians` ADD CONSTRAINT `student_guardians_guardianId_fkey` FOREIGN KEY (`guardianId`) REFERENCES `guardians`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_documents` ADD CONSTRAINT `student_documents_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance_configs` ADD CONSTRAINT `attendance_configs_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_academicYearId_fkey` FOREIGN KEY (`academicYearId`) REFERENCES `academic_years`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_academicUnitId_fkey` FOREIGN KEY (`academicUnitId`) REFERENCES `academic_units`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance_corrections` ADD CONSTRAINT `attendance_corrections_attendanceId_fkey` FOREIGN KEY (`attendanceId`) REFERENCES `attendances`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_requests` ADD CONSTRAINT `leave_requests_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_requests` ADD CONSTRAINT `leave_requests_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `homeworks` ADD CONSTRAINT `homeworks_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `homeworks` ADD CONSTRAINT `homeworks_academicYearId_fkey` FOREIGN KEY (`academicYearId`) REFERENCES `academic_years`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `homeworks` ADD CONSTRAINT `homeworks_academicUnitId_fkey` FOREIGN KEY (`academicUnitId`) REFERENCES `academic_units`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `homeworks` ADD CONSTRAINT `homeworks_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `homeworks` ADD CONSTRAINT `homeworks_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `teachers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `homework_submissions` ADD CONSTRAINT `homework_submissions_homeworkId_fkey` FOREIGN KEY (`homeworkId`) REFERENCES `homeworks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `homework_submissions` ADD CONSTRAINT `homework_submissions_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exams` ADD CONSTRAINT `exams_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exams` ADD CONSTRAINT `exams_academicYearId_fkey` FOREIGN KEY (`academicYearId`) REFERENCES `academic_years`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_schedules` ADD CONSTRAINT `exam_schedules_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `exams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_schedules` ADD CONSTRAINT `exam_schedules_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_schedules` ADD CONSTRAINT `exam_schedules_academicUnitId_fkey` FOREIGN KEY (`academicUnitId`) REFERENCES `academic_units`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_results` ADD CONSTRAINT `exam_results_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `exams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_results` ADD CONSTRAINT `exam_results_examScheduleId_fkey` FOREIGN KEY (`examScheduleId`) REFERENCES `exam_schedules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_results` ADD CONSTRAINT `exam_results_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_results` ADD CONSTRAINT `exam_results_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `marks_corrections` ADD CONSTRAINT `marks_corrections_examResultId_fkey` FOREIGN KEY (`examResultId`) REFERENCES `exam_results`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `marks_entry_logs` ADD CONSTRAINT `marks_entry_logs_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `exams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_cards` ADD CONSTRAINT `report_cards_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_cards` ADD CONSTRAINT `report_cards_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_cards` ADD CONSTRAINT `report_cards_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `exams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_cards` ADD CONSTRAINT `report_cards_timetableId_fkey` FOREIGN KEY (`timetableId`) REFERENCES `exam_timetables`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_cards` ADD CONSTRAINT `report_cards_academicYearId_fkey` FOREIGN KEY (`academicYearId`) REFERENCES `academic_years`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_cards` ADD CONSTRAINT `report_cards_generatedBy_fkey` FOREIGN KEY (`generatedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_attendance` ADD CONSTRAINT `exam_attendance_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_attendance` ADD CONSTRAINT `exam_attendance_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `exams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_attendance` ADD CONSTRAINT `exam_attendance_examScheduleId_fkey` FOREIGN KEY (`examScheduleId`) REFERENCES `exam_schedules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_attendance` ADD CONSTRAINT `exam_attendance_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_exam_summaries` ADD CONSTRAINT `student_exam_summaries_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_exam_summaries` ADD CONSTRAINT `student_exam_summaries_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `exams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_exam_summaries` ADD CONSTRAINT `student_exam_summaries_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_exam_summaries` ADD CONSTRAINT `student_exam_summaries_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_exam_summaries` ADD CONSTRAINT `student_exam_summaries_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `teachers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_notifications` ADD CONSTRAINT `exam_notifications_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_notifications` ADD CONSTRAINT `exam_notifications_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `exams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_hall_tickets` ADD CONSTRAINT `exam_hall_tickets_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_hall_tickets` ADD CONSTRAINT `exam_hall_tickets_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `exams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_hall_tickets` ADD CONSTRAINT `exam_hall_tickets_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_question_papers` ADD CONSTRAINT `exam_question_papers_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_question_papers` ADD CONSTRAINT `exam_question_papers_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `exams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_question_papers` ADD CONSTRAINT `exam_question_papers_examScheduleId_fkey` FOREIGN KEY (`examScheduleId`) REFERENCES `exam_schedules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_answer_sheets` ADD CONSTRAINT `exam_answer_sheets_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_answer_sheets` ADD CONSTRAINT `exam_answer_sheets_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `exams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_answer_sheets` ADD CONSTRAINT `exam_answer_sheets_examScheduleId_fkey` FOREIGN KEY (`examScheduleId`) REFERENCES `exam_schedules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_answer_sheets` ADD CONSTRAINT `exam_answer_sheets_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grading_schemes` ADD CONSTRAINT `grading_schemes_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_performance_comparisons` ADD CONSTRAINT `exam_performance_comparisons_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_performance_comparisons` ADD CONSTRAINT `exam_performance_comparisons_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_performance_comparisons` ADD CONSTRAINT `exam_performance_comparisons_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_performance_comparisons` ADD CONSTRAINT `exam_performance_comparisons_currentExamId_fkey` FOREIGN KEY (`currentExamId`) REFERENCES `exams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_performance_comparisons` ADD CONSTRAINT `exam_performance_comparisons_previousExamId_fkey` FOREIGN KEY (`previousExamId`) REFERENCES `exams`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_seating_arrangements` ADD CONSTRAINT `exam_seating_arrangements_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_seating_arrangements` ADD CONSTRAINT `exam_seating_arrangements_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `exams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invigilator_duties` ADD CONSTRAINT `invigilator_duties_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invigilator_duties` ADD CONSTRAINT `invigilator_duties_examScheduleId_fkey` FOREIGN KEY (`examScheduleId`) REFERENCES `exam_schedules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invigilator_duties` ADD CONSTRAINT `invigilator_duties_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `teachers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification_preferences` ADD CONSTRAINT `notification_preferences_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_insights` ADD CONSTRAINT `exam_insights_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_insights` ADD CONSTRAINT `exam_insights_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `exams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resources` ADD CONSTRAINT `resources_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resources` ADD CONSTRAINT `resources_academicYearId_fkey` FOREIGN KEY (`academicYearId`) REFERENCES `academic_years`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resources` ADD CONSTRAINT `resources_academicUnitId_fkey` FOREIGN KEY (`academicUnitId`) REFERENCES `academic_units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resources` ADD CONSTRAINT `resources_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notices` ADD CONSTRAINT `notices_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notices` ADD CONSTRAINT `notices_academicYearId_fkey` FOREIGN KEY (`academicYearId`) REFERENCES `academic_years`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_structures` ADD CONSTRAINT `fee_structures_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_structures` ADD CONSTRAINT `fee_structures_academicYearId_fkey` FOREIGN KEY (`academicYearId`) REFERENCES `academic_years`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_structures` ADD CONSTRAINT `fee_structures_academicUnitId_fkey` FOREIGN KEY (`academicUnitId`) REFERENCES `academic_units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_components` ADD CONSTRAINT `fee_components_feeStructureId_fkey` FOREIGN KEY (`feeStructureId`) REFERENCES `fee_structures`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_installments` ADD CONSTRAINT `fee_installments_feeComponentId_fkey` FOREIGN KEY (`feeComponentId`) REFERENCES `fee_components`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_fees` ADD CONSTRAINT `student_fees_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_fees` ADD CONSTRAINT `student_fees_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_fees` ADD CONSTRAINT `student_fees_feeStructureId_fkey` FOREIGN KEY (`feeStructureId`) REFERENCES `fee_structures`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_studentFeeId_fkey` FOREIGN KEY (`studentFeeId`) REFERENCES `student_fees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_discounts` ADD CONSTRAINT `fee_discounts_studentFeeId_fkey` FOREIGN KEY (`studentFeeId`) REFERENCES `student_fees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_scholarships` ADD CONSTRAINT `fee_scholarships_studentFeeId_fkey` FOREIGN KEY (`studentFeeId`) REFERENCES `student_fees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refunds` ADD CONSTRAINT `refunds_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `payments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_studentFeeId_fkey` FOREIGN KEY (`studentFeeId`) REFERENCES `student_fees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `finance_audit_logs` ADD CONSTRAINT `finance_audit_logs_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `payments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `finance_audit_logs` ADD CONSTRAINT `finance_audit_logs_refundId_fkey` FOREIGN KEY (`refundId`) REFERENCES `refunds`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `finance_audit_logs` ADD CONSTRAINT `finance_audit_logs_discountId_fkey` FOREIGN KEY (`discountId`) REFERENCES `fee_discounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `finance_audit_logs` ADD CONSTRAINT `finance_audit_logs_scholarshipId_fkey` FOREIGN KEY (`scholarshipId`) REFERENCES `fee_scholarships`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_academicYearId_fkey` FOREIGN KEY (`academicYearId`) REFERENCES `academic_years`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_academicUnitId_fkey` FOREIGN KEY (`academicUnitId`) REFERENCES `academic_units`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `academic_units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `teachers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignment_attachments` ADD CONSTRAINT `assignment_attachments_assignmentId_fkey` FOREIGN KEY (`assignmentId`) REFERENCES `assignments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignment_submissions` ADD CONSTRAINT `assignment_submissions_assignmentId_fkey` FOREIGN KEY (`assignmentId`) REFERENCES `assignments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignment_submissions` ADD CONSTRAINT `assignment_submissions_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignment_submissions` ADD CONSTRAINT `assignment_submissions_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `assignment_groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `submission_attachments` ADD CONSTRAINT `submission_attachments_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `assignment_submissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignment_evaluations` ADD CONSTRAINT `assignment_evaluations_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `assignment_submissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignment_evaluations` ADD CONSTRAINT `assignment_evaluations_evaluatedById_fkey` FOREIGN KEY (`evaluatedById`) REFERENCES `teachers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignment_groups` ADD CONSTRAINT `assignment_groups_assignmentId_fkey` FOREIGN KEY (`assignmentId`) REFERENCES `assignments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_group_members` ADD CONSTRAINT `student_group_members_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `assignment_groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_group_members` ADD CONSTRAINT `student_group_members_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_teachers` ADD CONSTRAINT `class_teachers_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_teachers` ADD CONSTRAINT `class_teachers_academicYearId_fkey` FOREIGN KEY (`academicYearId`) REFERENCES `academic_years`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_teachers` ADD CONSTRAINT `class_teachers_academicUnitId_fkey` FOREIGN KEY (`academicUnitId`) REFERENCES `academic_units`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_teachers` ADD CONSTRAINT `class_teachers_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `teachers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_class_assignments` ADD CONSTRAINT `teacher_class_assignments_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_class_assignments` ADD CONSTRAINT `teacher_class_assignments_academicYearId_fkey` FOREIGN KEY (`academicYearId`) REFERENCES `academic_years`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_class_assignments` ADD CONSTRAINT `teacher_class_assignments_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `teachers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_class_assignments` ADD CONSTRAINT `teacher_class_assignments_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_class_assignments` ADD CONSTRAINT `teacher_class_assignments_academicUnitId_fkey` FOREIGN KEY (`academicUnitId`) REFERENCES `academic_units`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_timetables` ADD CONSTRAINT `exam_timetables_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_timetables` ADD CONSTRAINT `exam_timetables_academicYearId_fkey` FOREIGN KEY (`academicYearId`) REFERENCES `academic_years`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_timetables` ADD CONSTRAINT `exam_timetables_academicUnitId_fkey` FOREIGN KEY (`academicUnitId`) REFERENCES `academic_units`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_timetables` ADD CONSTRAINT `exam_timetables_publishedBy_fkey` FOREIGN KEY (`publishedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_timetables` ADD CONSTRAINT `exam_timetables_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_timetable_slots` ADD CONSTRAINT `exam_timetable_slots_timetableId_fkey` FOREIGN KEY (`timetableId`) REFERENCES `exam_timetables`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_timetable_slots` ADD CONSTRAINT `exam_timetable_slots_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_timetable_slots` ADD CONSTRAINT `exam_timetable_slots_supervisorId_fkey` FOREIGN KEY (`supervisorId`) REFERENCES `teachers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admit_cards` ADD CONSTRAINT `admit_cards_timetableId_fkey` FOREIGN KEY (`timetableId`) REFERENCES `exam_timetables`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admit_cards` ADD CONSTRAINT `admit_cards_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_slot_attendance` ADD CONSTRAINT `exam_slot_attendance_slotId_fkey` FOREIGN KEY (`slotId`) REFERENCES `exam_timetable_slots`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_slot_attendance` ADD CONSTRAINT `exam_slot_attendance_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_slot_attendance` ADD CONSTRAINT `exam_slot_attendance_markedBy_fkey` FOREIGN KEY (`markedBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_timetable_notifications` ADD CONSTRAINT `exam_timetable_notifications_timetableId_fkey` FOREIGN KEY (`timetableId`) REFERENCES `exam_timetables`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_timetable_notifications` ADD CONSTRAINT `exam_timetable_notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `marks_change_requests` ADD CONSTRAINT `marks_change_requests_resultId_fkey` FOREIGN KEY (`resultId`) REFERENCES `exam_results`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `marks_change_requests` ADD CONSTRAINT `marks_change_requests_requestedBy_fkey` FOREIGN KEY (`requestedBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `marks_change_requests` ADD CONSTRAINT `marks_change_requests_approvedBy_fkey` FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `institution_signatures` ADD CONSTRAINT `institution_signatures_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `schools`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `institution_signatures` ADD CONSTRAINT `institution_signatures_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `teachers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `institution_signatures` ADD CONSTRAINT `institution_signatures_uploadedBy_fkey` FOREIGN KEY (`uploadedBy`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
