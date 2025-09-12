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

          {/* Demo mock player */}
          <div className="mt-12 mx-auto max-w-3xl" data-reveal>
            <div className="relative rounded-2xl overflow-hidden border border-amber-100 dark:border-amber-900/40 shadow-sm bg-black">
              <div className="aspect-[16/9] relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50/10 to-yellow-50/10 dark:from-gray-800 dark:to-gray-900" />
                <button className="absolute inset-0 m-auto h-16 w-16 rounded-full bg-amber-600 text-white hover:bg-amber-700 shadow-lg flex items-center justify-center">
                  <Play className="h-7 w-7 ml-1" />
                </button>
                <div className="absolute bottom-3 right-3 text-xs text-white/90 bg-black/60 px-2 py-1 rounded">00:42</div>
              </div>
            </div>
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

        {/* Features */}
        <section className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" data-reveal>
          <div className="bg-white dark:bg-gray-900 overflow-hidden shadow-sm rounded-xl p-6 border border-amber-100 dark:border-amber-900/40">
            <div className="flex items-center justify-center w-12 h-12 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-amber-900 dark:text-amber-100">Automatic Clip Detection</h3>
            <p className="mt-2 text-amber-800/80 dark:text-amber-300/80">
              Our AI analyzes sentiment and content to identify the most engaging moments in your videos.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-900 overflow-hidden shadow-sm rounded-xl p-6 border border-amber-100 dark:border-amber-900/40">
            <div className="flex items-center justify-center w-12 h-12 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-amber-900 dark:text-amber-100">Burned-in Subtitles</h3>
            <p className="mt-2 text-amber-800/80 dark:text-amber-300/80">
              Automatically burn subtitles directly into your video clips for better accessibility and engagement.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-900 overflow-hidden shadow-sm rounded-xl p-6 border border-amber-100 dark:border-amber-900/40">
            <div className="flex items-center justify-center w-12 h-12 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-amber-900 dark:text-amber-100">Easy Download</h3>
            <p className="mt-2 text-amber-800/80 dark:text-amber-300/80">
              Download your processed clips with a single click and share them on your favorite platforms.
            </p>
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

        {/* Stats */}
        <section className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-4" data-reveal>
          {[
            { label: 'Clips generated', value: '120K+' },
            { label: 'Avg. time saved', value: '8h/wk' },
            { label: 'Languages', value: '30+' },
            { label: 'Uptime', value: '99.9%' },
          ].map((s, i) => (
            <div key={i} className="rounded-xl border border-amber-100 dark:border-amber-900/40 bg-white/70 dark:bg-gray-900/70 backdrop-blur p-4 text-center">
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{s.value}</div>
              <div className="text-xs text-amber-800/80 dark:text-amber-300/80">{s.label}</div>
            </div>
          ))}
        </section>

        {/* Advanced features */}
        <section className="mt-20 grid gap-6 sm:grid-cols-2" data-reveal>
          <div className="rounded-xl border border-amber-100 dark:border-amber-900/40 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-100 font-semibold">
              <Wand2 className="h-5 w-5 text-amber-700 dark:text-amber-300" /> Smart scene detection
            </div>
            <p className="mt-2 text-amber-800/80 dark:text-amber-300/80">Automatically detects jump-cuts and high-energy segments to build compelling clips.</p>
            <div className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/40 p-4 text-sm text-amber-900 dark:text-amber-100">
              Fine-tune with thresholds and let Buzzler handle the rest.
            </div>
          </div>
          <div className="rounded-xl border border-amber-100 dark:border-amber-900/40 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-100 font-semibold">
              <Settings2 className="h-5 w-5 text-amber-700 dark:text-amber-300" /> Custom templates
            </div>
            <p className="mt-2 text-amber-800/80 dark:text-amber-300/80">Choose aspect ratios, caption styles, and safe margins for perfect platform-ready clips.</p>
            <div className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/40 p-4 text-sm text-amber-900 dark:text-amber-100">
              Save templates to reuse across projects.
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
              <AccordionItem value="item-3">
                <AccordionTrigger>Do you support different aspect ratios?</AccordionTrigger>
                <AccordionContent>Yes, pick 9:16, 1:1, or 16:9 and more using templates.</AccordionContent>
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
