'use client';
import { useEffect, useState } from 'react';

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
let deferred: InstallEvent | null = null;
export const INSTALLABLE_EVENT = 'ifb:installable';

export function canPromptInstall() { return deferred !== null; }
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  const e = deferred; deferred = null;
  await e.prompt();
  const { outcome } = await e.userChoice;
  window.dispatchEvent(new Event(INSTALLABLE_EVENT));
  return outcome === 'accepted';
}
export function isIosSafariNotInstalled() {
  if (typeof window === 'undefined') return false;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return ios && !standalone;
}

/** Registers the service worker, captures the install prompt and announces new versions. */
export function PwaClient() {
  const [updated, setUpdated] = useState(false);
  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); deferred = e as InstallEvent; window.dispatchEvent(new Event(INSTALLABLE_EVENT)); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    if (!('serviceWorker' in navigator)) return () => window.removeEventListener('beforeinstallprompt', onPrompt);
    const hadController = Boolean(navigator.serviceWorker.controller);
    const onChange = () => { if (hadController) setUpdated(true); };
    navigator.serviceWorker.addEventListener('controllerchange', onChange);
    navigator.serviceWorker.register('/sw.js').then((reg) => reg.update()).catch(() => {});
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); navigator.serviceWorker.removeEventListener('controllerchange', onChange); };
  }, []);
  if (!updated) return null;
  return (
    <div role="status" className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-md border border-[#3d444d] bg-[#151b23] px-4 py-2.5 text-sm text-[#f0f6fc] shadow-2xl">
      A new version of IFoundBug is available.
      <button className="rounded-md bg-[#238636] px-3 py-1 font-medium text-white hover:bg-[#29903b]" onClick={() => location.reload()}>Reload</button>
    </div>
  );
}
