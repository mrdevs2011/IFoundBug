import { BugIcon } from '@/components/icons';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
      <div className="flex flex-col items-center space-y-3">
        <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 p-0.5 shadow-xl animate-pulse">
          <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
            <BugIcon className="w-6 h-6 text-emerald-400 animate-spin" />
          </div>
        </div>
        <span className="text-xs font-mono text-zinc-400 tracking-wider">
          IFoundBug yuklanmoqda...
        </span>
      </div>
    </div>
  );
}
