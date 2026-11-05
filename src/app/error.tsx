'use client';

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 px-4 py-20 text-center">
      <h1 className="text-2xl font-semibold text-[#f0f6fc]">Something went wrong</h1>
      <button onClick={reset} className="h-8 rounded-md border border-[rgba(240,246,252,0.1)] bg-[#238636] px-3 text-sm font-medium text-white hover:bg-[#2ea043]">Try again</button>
    </main>
  );
}
