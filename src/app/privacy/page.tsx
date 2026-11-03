import Link from "next/link";

export const metadata = { title: "Privacy Policy | British Streaming" };

// Placeholder copy: have counsel replace this before launch.
export default function Page() {
  return (
    <main className="mx-auto min-h-dvh max-w-2xl bg-ws-bg px-6 py-16 text-ws-text">
      <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
      <p className="mt-4">This is placeholder text. Replace it with your reviewed legal copy before accepting real users.</p>
      <p className="mt-8"><Link href="/" className="text-white underline underline-offset-2">← Back to British Streaming</Link></p>
    </main>
  );
}
