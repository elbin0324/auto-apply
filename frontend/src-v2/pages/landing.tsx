import { LandingNav } from "@/components/landing/landing-nav";
import { HeroSection } from "@/components/landing/hero-section";
import { TickerSection } from "@/components/landing/ticker-section";
import { SocialSection } from "@/components/landing/social-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works";
import { PricingSection } from "@/components/landing/pricing-section";
import { CtaSection } from "@/components/landing/cta-section";
import { LandingFooter } from "@/components/landing/landing-footer";

export default function LandingPage() {
  return (
    <div className="overflow-x-hidden bg-bg-deep font-sans">
      <LandingNav />
      <HeroSection />
      <TickerSection />
      <SocialSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <CtaSection />
      <LandingFooter />
    </div>
  );
}
