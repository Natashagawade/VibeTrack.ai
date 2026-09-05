import { LandingNav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { Modalities } from "@/components/landing/modalities";
import { Features } from "@/components/landing/features";
import { Pricing } from "@/components/landing/pricing";
import { FAQ } from "@/components/landing/faq";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <>
      <LandingNav />
      <main>
        <Hero />
        <Modalities />
        <Features />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
