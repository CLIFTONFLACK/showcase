import { Reveal } from "@/components/ui/Reveal";

type Product = {
  name: string;
  tag: string;
  status: "Coming soon" | "In development";
  summary: string;
  bullets: string[];
};

const products: Product[] = [
  {
    name: "EPAVANCE",
    tag: "Omega-3 (EPA) medical food",
    status: "Coming soon",
    summary:
      "A medical food providing a clinically relevant dose of highly purified eicosapentaenoic acid (EPA), for the dietary management of specific gastrointestinal conditions under medical supervision.",
    bullets: [
      "Highly purified EPA formulation",
      "Designed for daily, long-term use",
      "For use under medical supervision",
    ],
  },
  {
    name: "BVANCE",
    tag: "Butyrate capsule",
    status: "In development",
    summary:
      "A forthcoming butyrate capsule designed to deliver a short-chain fatty acid with a well-established role in gut epithelial health. BVANCE is being developed for the dietary management of conditions where butyrate availability is a therapeutic target.",
    bullets: [
      "Butyrate — a key short-chain fatty acid",
      "Convenient oral capsule format",
      "Targeted for gastrointestinal indications",
    ],
  },
];

export function Products() {
  return (
    <section id="products" className="bg-teal-100 py-20 md:py-28">
      <div className="container-x">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
            Products
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-teal-900 md:text-4xl">
            Medical foods designed with the gut in mind.
          </h2>
          <p className="mt-5 text-lg text-teal-900/80">
            Our portfolio brings together established nutritional science and a
            growing pipeline of targeted medical foods.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {products.map((p, i) => (
            <Reveal
              key={p.name}
              delay={i * 140}
              className="card-lift flex flex-col  bg-white p-8 shadow-card ring-1 ring-teal-300"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
                  {p.tag}
                </span>
                <Badge status={p.status} />
              </div>
              <h3 className="mt-4 text-3xl font-bold tracking-tight text-teal-900">
                {p.name}
              </h3>
              <p className="mt-4 text-teal-900/80">{p.summary}</p>
              <ul className="mt-6 space-y-2">
                {p.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-sm text-teal-900/80">
                    <span
                      aria-hidden
                      className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0  bg-teal-700"
                    />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="mt-8 border-t border-teal-100 pt-6">
                <a
                  href="#contact"
                  className="inline-flex items-center text-sm font-semibold text-teal-700 transition-colors hover:text-teal-900"
                >
                  Request clinical information
                  <span aria-hidden className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                </a>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Badge({ status }: { status: Product["status"] }) {
  const styles =
    status === "Coming soon"
      ? "bg-teal-700 text-white"
      : "bg-white text-teal-700 ring-1 ring-teal-700";
  return (
    <span
      className={`inline-flex items-center  px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${styles}`}
    >
      {status}
    </span>
  );
}
