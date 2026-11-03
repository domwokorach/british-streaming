import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

export interface LegalSection {
  id: string;
  heading: string;
  body: React.ReactNode;
}

/** Marks text a lawyer or accessibility auditor must replace before launch. */
export function Placeholder({ children }: { children: React.ReactNode }) {
  return <mark className="rounded-sm bg-ws-blue/20 px-1 text-[#ffb3b3]">[Placeholder: {children}]</mark>;
}

/** Shared long-form layout: heading, dates, an in-page contents nav and numbered sections. Public, server-rendered. */
export function LegalPage({ title, intro, meta, sections }: { title: string; intro: React.ReactNode; meta: React.ReactNode; sections: LegalSection[] }) {
  return (
    <main className="min-h-dvh overflow-x-hidden bg-ws-bg text-ws-text">
      <Navbar />
      <div className="mx-auto w-full max-w-6xl px-4 pt-28 pb-16 sm:px-8">
        <header className="max-w-3xl">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">{title}</h1>
          <p className="mt-3 text-sm text-ws-text">{meta}</p>
          <div className="mt-4 text-base leading-7">{intro}</div>
        </header>
        <div className="mt-10 grid gap-10 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <nav aria-label={`${title} contents`} className="lg:sticky lg:top-28 lg:self-start">
            <p className="mb-3 text-sm font-semibold tracking-wide text-white uppercase">Contents</p>
            <ol className="space-y-1 text-sm">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="block rounded-sm py-1 text-ws-text transition-colors hover:text-ws-lavender focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ws-lavender">
                    {i + 1}. {s.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="min-w-0 max-w-3xl space-y-10">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="scroll-mt-28">
                <h2 id={`${s.id}-h`} className="mb-3 text-xl font-semibold text-white sm:text-2xl">{i + 1}. {s.heading}</h2>
                <div className="space-y-3 text-base leading-7 [&_a]:text-white [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-ws-lavender [&_li]:ml-5 [&_ul]:list-disc">{s.body}</div>
              </section>
            ))}
            <p><Link href="/" className="text-white underline underline-offset-2 hover:text-ws-lavender">← Back to British Streaming</Link></p>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
