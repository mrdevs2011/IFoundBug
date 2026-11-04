import Link from 'next/link';
import { BugIcon } from '@/components/icons';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white p-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
          <BugIcon className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold">404 — Sahifa Topilmadi</h2>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Siz qidirayotgan sahifa yoki xatolik hisoboti mavjud emas yoki o‘chirilgan.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-block w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs py-2.5 rounded-xl transition"
          >
            Bosh sahifaga qaytish
          </Link>
        </div>
      </div>
    </div>
  );
}
