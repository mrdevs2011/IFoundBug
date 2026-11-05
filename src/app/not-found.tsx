import Link from 'next/link';
import { Nav } from '@/components/Nav';

export default function NotFound() {
  return (
    <>
      <Nav />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 px-4 py-20 text-center">
        <h1 className="text-xl font-bold text-white">Sahifa topilmadi</h1>
        <p className="text-sm text-zinc-500">Havola noto‘g‘ri yoki sahifa o‘chirilgan.</p>
        <Link href="/" className="text-sm font-semibold text-emerald-300 hover:underline">Bosh sahifaga</Link>
      </main>
    </>
  );
}
