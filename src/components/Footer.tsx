import React from 'react';
import { Logo } from '@/components/Logo';

/** GitHub-style page footer: mark + copyright, centered under a hairline. */
export function Footer() {
  return (
    <footer className="mt-auto w-full px-4 pb-10 pt-10 md:px-6">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-[#3d444d] pt-8 text-xs text-[#9198a1]">
        <span className="inline-flex items-center gap-2"><Logo size={24} /><span>© {new Date().getFullYear()} IFoundBug, Inc.</span></span>
      </div>
    </footer>
  );
}
