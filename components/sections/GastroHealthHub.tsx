import { Reveal } from "@/components/ui/Reveal";

export function GastroHealthHub() {
  return (
    <section
      id="gastrohealthhub"
      className="relative overflow-hidden bg-teal-50 py-20 md:py-28"
    >
      <div className="container-x grid items-center gap-12 md:grid-cols-12">
        <Reveal className="md:col-span-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
            Community · Free to access
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-teal-900 md:text-4xl">
            GastroHealthHub — knowledge for patients and practitioners.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-teal-900/80">
            Vance Medical proudly supports{" "}
            <a
              href="https://www.gastrohealthhub.com"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-teal-700 underline decoration-teal-300 underline-offset-4 hover:text-teal-900"
            >
              GastroHealthHub.com
            </a>{" "}
            — a free, open knowledge platform for people living with
            inflammatory bowel disease (IBD) and associated gastrointestinal
            conditions, and for the clinicians who care for them.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-teal-900/80">
            The Hub brings together patient-friendly explainers, the latest
            clinical evidence, practical guidance on diet and nutrition, and a
            growing community where lived experience and professional expertise
            meet.
          </p>

          <ul className="mt-8 space-y-3">
            <Item>Plain-language guides to IBD, IBS, SIBO and related conditions</Item>
            <Item>Curated clinical content for healthcare professionals</Item>
            <Item>Evidence-informed nutrition and lifestyle resources</Item>
            <Item>A space to share experience, questions and learning</Item>
          </ul>

          <div className="mt-8">
            <a
              href="https://www.gastrohealthhub.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center  bg-teal-700 px-6 py-3 text-sm font-semibold text-white shadow-card transition-colors hover:bg-teal-900"
            >
              Visit GastroHealthHub.com
              <span aria-hidden className="ml-2">→</span>
            </a>
          </div>
        </Reveal>

        <Reveal delay={150} className="md:col-span-6">
          <div className="relative">
            <div className="card-lift relative  bg-gradient-to-br from-teal-100 to-teal-300 p-8 shadow-card ring-1 ring-teal-300">
              <div className=" bg-white p-6 ring-1 ring-teal-100">
                <div className="flex items-center justify-between border-b border-teal-100 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5  bg-teal-300" />
                    <span className="h-2.5 w-2.5  bg-teal-500" />
                    <span className="h-2.5 w-2.5  bg-teal-700" />
                  </div>
                  <span className="text-xs font-semibold text-teal-700">
                    gastrohealthhub.com
                  </span>
                </div>
                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-3  bg-teal-50 p-3">
                    <Dot />
                    <div>
                      <p className="text-sm font-semibold text-teal-900">
                        Understanding ulcerative colitis
                      </p>
                      <p className="text-xs text-teal-900/60">Patient guide · 6 min read</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3  bg-teal-50 p-3">
                    <Dot />
                    <div>
                      <p className="text-sm font-semibold text-teal-900">
                        Short-chain fatty acids and the gut barrier
                      </p>
                      <p className="text-xs text-teal-900/60">HCP resource · Evidence review</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3  bg-teal-50 p-3">
                    <Dot />
                    <div>
                      <p className="text-sm font-semibold text-teal-900">
                        Nutrition in IBD: what the evidence says
                      </p>
                      <p className="text-xs text-teal-900/60">Community discussion</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div aria-hidden className="animate-float-slow absolute -right-6 -top-6 h-24 w-24  bg-teal-500/50 blur-2xl" />
            <div aria-hidden className="animate-float-slow absolute -bottom-8 -left-6 h-32 w-32  bg-teal-300 blur-3xl" style={{ animationDelay: "1.5s" }} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Item({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-base text-teal-900/85">
      <span
        aria-hidden
        className="mt-2 inline-block h-1.5 w-1.5 shrink-0  bg-teal-700"
      />
      {children}
    </li>
  );
}

function Dot() {
  return (
    <span
      aria-hidden
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center  bg-teal-700 text-white"
    >
      <span className="h-2 w-2  bg-white" />
    </span>
  );
}
