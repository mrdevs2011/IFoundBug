import { Suspense } from 'react';
import { AuthForm } from '@/components/AuthForm';

export default function Page() {
  return (
    <main className="flex flex-1 items-start justify-center px-4 pb-12 pt-10">
      <Suspense fallback={null}><AuthForm mode="signup" /></Suspense>
    </main>
  );
}
