import { Reveal } from "@/components/ui/Reveal";

const pillars = [
  {
    title: "What are medical foods?",
    body:
      "Medical foods — in the UK and EU, Foods for Special Medical Purposes (FSMP) — are a regulated category formulated for patients with specific conditions. They are used under medical supervision, distinct from supplements and medicines.",
  },
  {
    title: "Why gastroenterology?",
    body:
      "The gut is central to absorption, immunity and systemic health. In many GI conditions, targeted nutrition can meaningfully support symptom management and disease-related nutritional needs alongside conventional care.",
  },
  {
    title: "Our approach",
    body:
      "We select nutrients with a recognised physiological role, formulate to a clinically relevant specification, and partner with healthcare professionals to ensure safe, appropriate use.",
  },
];

export function Science() {
  return (
    <section id="science" className="bg-white py-20 md:py-28">
      <div className="container-x">
        <Reveal className="max-w-3xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
            Science &amp; category
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-teal-900 md:text-4xl">
            Targeted nutrition, used under medical supervision.
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {pillars.map((p, i) => (
            <Reveal
              key={p.title}
              delay={i * 120}
              className="card-lift  bg-teal-50 p-8 ring-1 ring-teal-100"
            >
              <h3 className="text-lg font-semibold text-teal-900">{p.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-teal-900/80">{p.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
