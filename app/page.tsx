import { Header } from "@/components/sections/Header";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Products } from "@/components/sections/Products";
import { Science } from "@/components/sections/Science";
import { GastroHealthHub } from "@/components/sections/GastroHealthHub";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/sections/Footer";

export default function Page() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <Products />
        <Science />
        <GastroHealthHub />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
