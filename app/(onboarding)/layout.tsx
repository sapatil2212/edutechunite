'use client'

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-dark-900 dark:via-dark-900 dark:to-emerald-950/20">
      {children}
    </div>
  )
}

