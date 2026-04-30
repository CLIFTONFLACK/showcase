import { Logo } from "@/components/ui/Logo";

const nav = [
  { href: "#about", label: "About" },
  { href: "#products", label: "Products" },
  { href: "#science", label: "Science" },
  { href: "#gastrohealthhub", label: "GastroHealthHub" },
  { href: "#contact", label: "Contact" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-teal-100 bg-teal-50/80 backdrop-blur">
      <div className="container-x flex h-20 items-center justify-between md:h-28">
        <a href="#top" aria-label="Vance Medical home">
          <Logo />
        </a>
        <nav className="hidden md:block">
          <ul className="flex items-center gap-8 text-sm font-medium text-teal-900">
            {nav.map((n) => (
              <li key={n.href}>
                <a href={n.href} className="hover:text-teal-700 transition-colors">
                  {n.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href="#contact"
                className="inline-flex items-center  bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-900 transition-colors"
              >
                Healthcare professionals
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
