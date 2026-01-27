import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Hero } from '@/components/sections/hero'
import { TrustedBy } from '@/components/sections/trusted-by'
import { Features } from '@/components/sections/features'
import { Analytics } from '@/components/sections/analytics'
import { Testimonials } from '@/components/sections/testimonials'
import { FAQ } from '@/components/sections/faq'
import { Newsletter } from '@/components/sections/newsletter'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <TrustedBy />
      <Features />
      <Analytics />
      <Testimonials />
      <FAQ />
      <Newsletter />
      <Footer />
    </main>
  )
}
