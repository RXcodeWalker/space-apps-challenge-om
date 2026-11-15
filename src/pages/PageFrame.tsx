import type { ReactNode } from 'react';

/** Shared heading block + centered column for the content pages (data, teachers, settings). */
export default function PageFrame({ eyebrow, title, lead, children }: { eyebrow: string; title: string; lead: string; children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-[1040px] flex-1 flex-col gap-4 px-4 pb-16 pt-8">
      <header className="mb-2 flex animate-[oc-in_480ms_var(--oc-ease-out)_both] flex-col gap-2">
        <span className="oc-type-code text-oc-text-3">{eyebrow}</span>
        <h1 className="oc-type-display m-0">{title}</h1>
        <p className="oc-type-body m-0 max-w-[640px] text-oc-text-2 text-pretty">{lead}</p>
      </header>
      {children}
    </main>
  );
}
