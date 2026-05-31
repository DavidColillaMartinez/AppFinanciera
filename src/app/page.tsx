export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-10">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">
          Base tecnica inicial
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Finanzas Personales
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Proyecto preparado con Next.js, TypeScript, TailwindCSS, shadcn/ui,
          PWA y las dependencias principales. La logica de producto empezara
          despues de tu confirmacion.
        </p>
      </section>
    </main>
  );
}
