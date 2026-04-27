import type { PropsWithChildren } from 'react';

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff7e8_0%,#ffffff_100%)] text-zinc-900">
      <main className="mx-auto w-full max-w-4xl p-4 pt-10">{children}</main>
    </div>
  );
}
