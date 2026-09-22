import { LandingNav } from "@/components/landing/landing-nav";
import { HeroSection } from "@/components/landing/hero-section";
import { MarqueeSection } from "@/components/landing/marquee-section";
import { StatementSection } from "@/components/landing/statement-section";
import { HowItWorksSection } from "@/components/landing/how-it-works";
import { FeaturesSection } from "@/components/landing/features-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { ComingSoonSection } from "@/components/landing/coming-soon-section";
import { CtaSection } from "@/components/landing/cta-section";
import { LandingFooter } from "@/components/landing/landing-footer";

export default function LandingPage() {
  return (
    <div className="overflow-x-hidden bg-bg-deep font-sans">
      <LandingNav />
      <HeroSection />
      <StatementSection />
      <HowItWorksSection />
      <FeaturesSection />
      <PricingSection />
      <TestimonialsSection />
      <ComingSoonSection />
      <CtaSection />
      <MarqueeSection />
      <LandingFooter />
    </div>
  );
}
