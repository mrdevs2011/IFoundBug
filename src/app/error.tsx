'use client';

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 px-4 py-20 text-center">
      <h1 className="text-xl font-bold text-white">Something went wrong</h1>
      <button onClick={reset} className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-black">Try again</button>
    </main>
  );
}
