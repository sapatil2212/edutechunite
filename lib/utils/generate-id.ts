import { customAlphabet } from 'nanoid'

// Create a custom alphabet without ambiguous characters
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

// Generate a school ID in format: EDU-XXXX-XXXX
export function generateSchoolId(): string {
  const nanoid = customAlphabet(alphabet, 4)
  return `EDU-${nanoid()}-${nanoid()}`
}

// Generate a verification token
export function generateVerificationToken(): string {
  const nanoid = customAlphabet(alphabet + 'abcdefghjklmnpqrstuvwxyz', 32)
  return nanoid()
}

// Generate a reset token
export function generateResetToken(): string {
  const nanoid = customAlphabet(alphabet + 'abcdefghjklmnpqrstuvwxyz', 32)
  return nanoid()
}

export function generateAdmissionNumber(prefix: string = 'EDU'): string {
  const year = new Date().getFullYear()
  const nanoid = customAlphabet('0123456789', 5)
  return `${prefix}${year}-${nanoid()}`
}

export function generateOTP(): string {
  const nanoid = customAlphabet('0123456789', 6)
  return nanoid()
}

