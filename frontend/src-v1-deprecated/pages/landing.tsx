import { NavBar } from "@/components/landing/nav-bar";
import { Hero } from "@/components/landing/hero";
import { Marquee } from "@/components/landing/marquee";
import { Statement } from "@/components/landing/statement";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Features } from "@/components/landing/features";
import { Pricing } from "@/components/landing/pricing";
import { Testimonials } from "@/components/landing/testimonials";
import { ComingSoon } from "@/components/landing/coming-soon";
import { FinalCta } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg">
      <NavBar />
      <Hero />
      <Statement />
      <HowItWorks />
      <Features />
      <Marquee />
      <Pricing />
      <Testimonials />
      <ComingSoon />
      <FinalCta />
      <Footer />
    </div>
  );
}
