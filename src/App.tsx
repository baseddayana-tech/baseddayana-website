import { Header } from './components/layout/Header'
import { Hero } from './components/Hero'
import { WhyInvest } from './components/WhyInvest'
import { Tokenomics } from './components/Tokenomics'
import { Security } from './components/Security'
import { Airdrop } from './components/Airdrop'

import { Partners } from './components/Partners'
import { Footer } from './components/layout/Footer'

function App() {
  return (
    <div className="min-h-screen bg-black selection:bg-orange-500/30 selection:text-orange-500">
      <Header />
      <main>
        <Hero />
        <WhyInvest />
        <Tokenomics />
        <Security />

        <Airdrop />
        <Partners />
      </main>
      <Footer />

      {/* Scroll to top decorative element */}
      <div className="fixed bottom-8 right-8 z-40">
        <div className="h-12 w-12 bg-gray-900 border border-white/5 rounded-full flex items-center justify-center hover:bg-orange-500 hover:text-black transition-all cursor-pointer shadow-2xl">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </div>
      </div>
    </div>
  )
}

export default App
