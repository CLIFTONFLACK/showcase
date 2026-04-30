import Image from "next/image";

export function Hero() {
  return (
    <section
      id="top"
      className="relative h-[72vh] min-h-[520px] max-h-[760px] w-full overflow-hidden"
    >
      <Image
        src="/hero-gi.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-teal-900/70 via-teal-900/40 to-teal-900/80" />
      <div className="absolute inset-0 bg-[radial-gradient(700px_400px_at_80%_20%,rgba(120,191,191,0.35),transparent_60%)]" />

      <div className="relative flex h-full items-center">
        <div className="container-x">
          <div className="max-w-2xl animate-fade-in-up">
            <p className="mb-5 inline-block  border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white backdrop-blur">
              Medical foods · Gastrointestinal health
            </p>
            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-white drop-shadow-lg sm:text-5xl md:text-6xl">
              <span className="block text-teal-300">Targeted nutrition</span>
              <span className="block text-white">for gastrointestinal health.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/90 drop-shadow md:text-lg">
              Vance Medical develops medical foods for the dietary management of
              gastrointestinal conditions — built on more than two decades of
              specialist gastroenterology expertise from our sister company,
              SLA Pharma.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#products"
                className="inline-flex items-center  bg-white px-6 py-3 text-sm font-semibold text-teal-900 shadow-card transition-colors hover:bg-teal-100"
              >
                Explore our pipeline
                <span aria-hidden className="ml-2">→</span>
              </a>
              <a
                href="#gastrohealthhub"
                className="inline-flex items-center  border border-white/60 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
              >
                Visit GastroHealthHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
