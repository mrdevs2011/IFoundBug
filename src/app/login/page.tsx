import { Suspense } from 'react';
import { Nav } from '@/components/Nav';
import { AuthForm } from '@/components/AuthForm';

export default function Page() {
  return (
    <>
      <Nav />
      <main className="flex flex-1 items-center px-4 py-12">
        <Suspense fallback={null}><AuthForm mode="login" /></Suspense>
      </main>
    </>
  );
}
