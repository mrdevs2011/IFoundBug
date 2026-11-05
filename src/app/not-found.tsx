import Link from 'next/link';
import { Nav } from '@/components/Nav';

export default function NotFound() {
  return (
    <>
      <Nav />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 px-4 py-20 text-center">
        <h1 className="text-xl font-bold text-white">Page not found</h1>
        <p className="text-sm text-[#9198a1]">The URL is invalid or this page no longer exists.</p>
        <Link href="/" className="text-sm font-semibold text-[#3fb950] hover:underline">Go to dashboard</Link>
      </main>
    </>
  );
}
