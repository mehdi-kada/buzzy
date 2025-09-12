"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  UploadCloud,
  Scissors,
  FileText,
  Sparkles,
  Zap,
  Play,
  Download,
  ShieldCheck,
  Wand2,
  Settings2,
  Star
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/projects');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* decorative background orbs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-amber-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 -left-16 h-72 w-72 rounded-full bg-yellow-300/20 blur-3xl animate-pulse" />
      </div>
      {/* Top bar */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">Buzzler</Link>
          <div className="flex gap-3">
            <Link 
              href="/auth/login" 
              className="px-4 py-2 rounded-md text-amber-800 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-200"
            >
              Login
            </Link>
            <Link 
              href="/auth/register" 
              className="px-4 py-2 rounded-md bg-amber-600 text-white hover:bg-amber-700 shadow-sm ring-1 ring-amber-300/60"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <section className="relative text-center pt-6 sm:pt-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/80 dark:bg-amber-900/20 ring-1 ring-amber-200 dark:ring-amber-900/40 text-xs text-amber-800 dark:text-amber-200">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
            Turn long videos into viral clips
          </div>
          <h1 className="mt-6 text-4xl font-extrabold sm:text-5xl lg:text-6xl bg-gradient-to-r from-amber-700 to-yellow-700 bg-clip-text text-transparent">
            AI-Powered Clip Extraction with Burned-in Subtitles
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-amber-900/80 dark:text-amber-200/80">
            Upload long videos. Get short, shareable clips with crisp subtitles and downloadable transcripts (SRT) in minutes.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/auth/register"
              className="px-6 py-3 bg-amber-600 text-white font-medium rounded-md hover:bg-amber-700 shadow-sm ring-1 ring-amber-300/60"
            >
              Get Started
            </Link>
            <Link
              href="/auth/login"
              className="px-6 py-3 bg-white dark:bg-gray-900 text-amber-800 dark:text-amber-200 font-medium rounded-md border border-amber-200 dark:border-amber-900/40 hover:bg-amber-50 dark:hover:bg-amber-900/30"
            >
              Sign In
            </Link>
          </div>


        </section>

        {/* Trusted by */}
        <section className="mt-16" data-reveal>
          <div className="flex flex-wrap items-center justify-center gap-6 opacity-90">
            <span className="text-sm text-amber-900/70 dark:text-amber-300/70">Trusted by creators and teams</span>
            <div className="flex gap-8 text-amber-700/70 dark:text-amber-300/60">
              <span className="font-semibold">CreatorHub</span>
              <span className="font-semibold">Streamly</span>
              <span className="font-semibold">ReelLabs</span>
              <span className="font-semibold">ClipForge</span>
            </div>
          </div>
        </section>

        {/* Core capabilities (truthful) */}
        <section className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" data-reveal>
          {/* Upload or Import */}
          <div className="bg-white dark:bg-gray-900 overflow-hidden shadow-sm rounded-xl p-6 border border-amber-100 dark:border-amber-900/40">
            <div className="flex items-center justify-center w-12 h-12 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 5 17 10" />
                <line x1="12" x2="12" y1="5" y2="21" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-amber-900 dark:text-amber-100">Upload or import</h3>
            <p className="mt-2 text-amber-800/80 dark:text-amber-300/80">Bring videos from your device or paste a link to import from supported platforms.</p>
          </div>

          {/* Clip extraction (keep generic, no overpromise) */}
          <div className="bg-white dark:bg-gray-900 overflow-hidden shadow-sm rounded-xl p-6 border border-amber-100 dark:border-amber-900/40">
            <div className="flex items-center justify-center w-12 h-12 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="M8 12h8" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-amber-900 dark:text-amber-100">Clip extraction</h3>
            <p className="mt-2 text-amber-800/80 dark:text-amber-300/80">Generate shorter segments from long videos to share across social platforms.</p>
          </div>

          {/* Subtitles & transcripts */}
          <div className="bg-white dark:bg-gray-900 overflow-hidden shadow-sm rounded-xl p-6 border border-amber-100 dark:border-amber-900/40">
            <div className="flex items-center justify-center w-12 h-12 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-amber-900 dark:text-amber-100">Subtitles & SRT</h3>
            <p className="mt-2 text-amber-800/80 dark:text-amber-300/80">Burn captions into your clips and download the transcript as an SRT file.</p>
          </div>
        </section>

        {/* How it works */}
        <section className="mt-20" data-reveal>
          <h2 className="text-center text-2xl sm:text-3xl font-bold bg-gradient-to-r from-amber-700 to-yellow-700 bg-clip-text text-transparent">How it works</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              { icon: UploadCloud, title: 'Upload', desc: 'Upload your long-form video in a few clicks.' },
              { icon: Scissors, title: 'We cut', desc: 'Our AI finds the highlights and creates multiple short clips.' },
              { icon: FileText, title: 'Subtitles & SRT', desc: 'Burned-in subtitles and downloadable SRT transcripts included.' },
            ].map((step, idx) => (
              <div key={idx} className="relative overflow-hidden rounded-xl border border-amber-100 dark:border-amber-900/40 bg-white dark:bg-gray-900 p-6 shadow-sm group transition-transform duration-300 hover:-translate-y-1">
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-400/10 blur-2xl" />
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                    {step.icon && <step.icon className="h-5 w-5" />}
                  </span>
                  <span className="text-sm font-semibold text-amber-900 dark:text-amber-100">Step {idx + 1}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-amber-900 dark:text-amber-100">{step.title}</h3>
                <p className="mt-1 text-amber-800/80 dark:text-amber-300/80">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Keep messaging realistic: optional section with tips instead of unimplemented features */}
        <section className="mt-20 grid gap-6 sm:grid-cols-2" data-reveal>
          <div className="rounded-xl border border-amber-100 dark:border-amber-900/40 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-100 font-semibold">
              <Wand2 className="h-5 w-5 text-amber-700 dark:text-amber-300" /> Clean, creator-first workflow
            </div>
            <p className="mt-2 text-amber-800/80 dark:text-amber-300/80">Simple steps: upload or import, generate clips, burn subtitles, download. No clutter.</p>
            <div className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/40 p-4 text-sm text-amber-900 dark:text-amber-100">
              Start with a single long video and export a few highlight clips.
            </div>
          </div>
          <div className="rounded-xl border border-amber-100 dark:border-amber-900/40 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-100 font-semibold">
              <Settings2 className="h-5 w-5 text-amber-700 dark:text-amber-300" /> Practical outputs
            </div>
            <p className="mt-2 text-amber-800/80 dark:text-amber-300/80">Export clips ready for socials and grab the accompanying SRT file for captions.</p>
            <div className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/40 p-4 text-sm text-amber-900 dark:text-amber-100">
              Keep your workflow flexible: share, schedule, or edit elsewhere.
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="mt-20" data-reveal>
          <h2 className="text-center text-2xl sm:text-3xl font-bold bg-gradient-to-r from-amber-700 to-yellow-700 bg-clip-text text-transparent">Loved by creators</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: 'Amina', role: 'YouTuber', text: 'Buzzler cut my editing time in half. Subtitles look perfect out of the box.' },
              { name: 'Jon', role: 'Content Lead', text: 'We built a short-form pipeline overnight. Massive time saver.' },
              { name: 'Sara', role: 'Streamer', text: 'My best moments auto-clipped and ready to post. Unreal.' },
            ].map((t, idx) => (
              <div key={idx} className="rounded-xl border border-amber-100 dark:border-amber-900/40 bg-white dark:bg-gray-900 p-6 shadow-sm">
                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-300">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-3 text-amber-900 dark:text-amber-100">“{t.text}”</p>
                <div className="mt-3 text-sm text-amber-800/80 dark:text-amber-300/80">{t.name} — {t.role}</div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-20" data-reveal>
          <h2 className="text-center text-2xl sm:text-3xl font-bold bg-gradient-to-r from-amber-700 to-yellow-700 bg-clip-text text-transparent">Frequently asked questions</h2>
          <div className="mt-6 max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="rounded-xl border border-amber-100 dark:border-amber-900/40 bg-white dark:bg-gray-900 p-2">
              <AccordionItem value="item-1">
                <AccordionTrigger>Can I download SRT files?</AccordionTrigger>
                <AccordionContent>Yes. Every project comes with downloadable SRT, and subtitles can be burned-in automatically.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>What video formats are supported?</AccordionTrigger>
                <AccordionContent>Common formats like MP4 and MOV are supported. Large files are handled with resumable uploads.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>Can I upload or import from any platform?</AccordionTrigger>
                <AccordionContent>
                  You can upload files directly from your device. Importing via link is supported for select platforms and will expand over time. If a link isn’t supported yet, you can always download the video and upload the file instead.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* CTA banner */}
        <section className="mt-20" data-reveal>
          <div className="relative overflow-hidden rounded-2xl border border-amber-100 dark:border-amber-900/40 bg-gradient-to-r from-amber-500 to-yellow-500 p-8 text-center shadow-sm">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.3),transparent_50%)]" />
            <h3 className="relative text-2xl font-bold text-white">Create your first viral clip today</h3>
            <p className="relative mt-2 text-white/90">Start for free. No credit card required.</p>
            <div className="relative mt-6 flex justify-center gap-3">
              <Link href="/auth/register" className="px-6 py-3 bg-white text-amber-700 font-medium rounded-md hover:bg-amber-50">Get Started</Link>
              <Link href="/auth/login" className="px-6 py-3 bg-black/20 text-white font-medium rounded-md border border-white/30 hover:bg-black/30">Sign In</Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-amber-100 dark:border-amber-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-amber-800/80 dark:text-amber-300/80">© {new Date().getFullYear()} Buzzler. All rights reserved.</div>
          <div className="flex items-center gap-4 text-amber-800/80 dark:text-amber-300/80">
            <span className="inline-flex items-center gap-1"><ShieldCheck className="h-4 w-4" /> Privacy</span>
            <span className="inline-flex items-center gap-1"><Download className="h-4 w-4" /> Resources</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
