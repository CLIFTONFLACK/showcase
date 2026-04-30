import { Logo } from "@/components/ui/Logo";

export function Footer() {
  return (
    <footer className="border-t border-teal-100 bg-teal-50 py-10">
      <div className="container-x flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <Logo />
        </div>
        <div className="text-xs text-teal-900/70">
          <p>
            © {new Date().getFullYear()} Vance Medical Foods Ltd. All rights reserved.
          </p>
          <p className="mt-1 max-w-2xl">
            Products described on this website are medical foods (Foods for
            Special Medical Purposes) for the dietary management of specific
            conditions and must be used under medical supervision. This website
            does not provide medical advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
