import { Reveal } from "@/components/ui/Reveal";

export function Contact() {
  return (
    <section
      id="contact"
      className="relative overflow-hidden bg-teal-900 py-20 text-white md:py-28"
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            "radial-gradient(600px 300px at 80% 10%, #78BFBF 0%, transparent 60%), radial-gradient(500px 300px at 10% 90%, #AEDBDB 0%, transparent 60%)",
        }}
      />
      <div className="container-x relative grid gap-12 md:grid-cols-2">
        <Reveal>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-teal-300">
            Get in touch
          </p>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            For healthcare professionals and partners.
          </h2>
          <p className="mt-5 max-w-lg text-lg text-teal-100">
            Clinicians, pharmacists and partners can contact us for clinical
            information, supply enquiries and partnership opportunities.
          </p>
        </Reveal>

        <Reveal delay={140} className="card-lift  bg-white/5 p-8 ring-1 ring-white/10 backdrop-blur">
          <dl className="space-y-6">
            <Row label="General enquiries">
              <a
                href="mailto:info@vancemedical.co.uk"
                className="font-semibold text-white underline decoration-teal-300 underline-offset-4 hover:text-teal-100"
              >
                info@vancemedical.co.uk
              </a>
            </Row>
            <Row label="Medical information">
              <a
                href="mailto:medical@vancemedical.co.uk"
                className="font-semibold text-white underline decoration-teal-300 underline-offset-4 hover:text-teal-100"
              >
                medical@vancemedical.co.uk
              </a>
            </Row>
            <Row label="Address">
              <span className="text-teal-100">
                Vance Medical Foods Ltd, United Kingdom
              </span>
            </Row>
            <Row label="Group">
              <a
                href="https://www.slapharma.com"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-white underline decoration-teal-300 underline-offset-4 hover:text-teal-100"
              >
                Part of the SLA Pharma group
              </a>
            </Row>
          </dl>
        </Reveal>
      </div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-baseline gap-4 border-b border-white/10 pb-4 last:border-0 last:pb-0">
      <dt className="text-xs font-semibold uppercase tracking-wider text-teal-300">
        {label}
      </dt>
      <dd className="text-base">{children}</dd>
    </div>
  );
}
