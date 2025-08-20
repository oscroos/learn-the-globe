// app/privacy/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy – Learn the Globe',
  description:
    'How Learn the Globe collects, uses, and protects your data, including account details, gameplay stats, analytics, and ads.',
}

export default function PrivacyPage() {
  const updated = new Date().toLocaleDateString()
  return (
    <main className="min-h-dvh bg-black">
      <div className="mx-auto max-w-3xl p-4 md:p-8">
        <article className="bg-white text-slate-900 rounded-2xl shadow-xl p-6 md:p-10">
          <header className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Privacy Policy</h1>
            <p className="mt-1 text-sm text-slate-500">Last updated: {updated}</p>
          </header>

          <div className="space-y-8 text-[15px] leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold">Who we are</h2>
              <p className="mt-2">
                Learn the Globe (“we”, “us”) provides geography quizzes at
                {' '}
                <a
                  href="https://learntheglobe.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-slate-700"
                >
                  learntheglobe.com
                </a>.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">What we collect</h2>
              <ul className="mt-2 list-disc pl-6 space-y-1">
                <li><span className="font-medium">Account data</span> (if you sign in): name, email, optional home country.</li>
                <li><span className="font-medium">Gameplay data</span>: sessions (mode, regions, counts, errors, time) and unlocked achievements.</li>
                <li><span className="font-medium">Device/usage data</span> via analytics and ads (see below).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold">How we use data</h2>
              <ul className="mt-2 list-disc pl-6 space-y-1">
                <li>Authenticate your account and sync your progress.</li>
                <li>Show achievements and personalize the experience.</li>
                <li>Measure usage (Google Analytics 4) and show ads (Google AdSense).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold">Cookies &amp; similar technologies</h2>
              <p className="mt-2">
                We use essential cookies for authentication and site functionality. If enabled, we also use
                analytics and advertising cookies. Users in the EU/EEA/UK will see a consent dialog where
                they can choose their preferences.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">Third-party services</h2>
              <ul className="mt-2 list-disc pl-6 space-y-1">
                <li><span className="font-medium">Firebase</span> (Auth &amp; Firestore) – account and gameplay storage.</li>
                <li><span className="font-medium">Vercel</span> – hosting and logs.</li>
                <li><span className="font-medium">Google Analytics 4</span> – usage measurement (with Consent Mode where applicable).</li>
                <li><span className="font-medium">Google AdSense</span> – ads (non-personalized if consent is declined in the EU/EEA/UK).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold">Data retention</h2>
              <p className="mt-2">
                We keep your account and gameplay data while your account is active. If you delete your
                account, associated data will be removed or anonymized within a reasonable period.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">Your choices</h2>
              <ul className="mt-2 list-disc pl-6 space-y-1">
                <li>Update cookie/consent settings via the consent banner (where shown).</li>
                <li>Request account deletion or data access by contacting us.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold">Contact</h2>
              <p className="mt-2">
                For privacy questions or requests, email:
                {' '}
                <a href="mailto:osroo0091@student.nord.no" className="underline hover:text-slate-700">
                  osroo0091@student.nord.no
                </a>
              </p>
            </section>
          </div>
        </article>
      </div>
    </main>
  )
}
