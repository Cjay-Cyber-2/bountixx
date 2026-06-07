import { LandingNav } from "@/components/landing/LandingNav";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Categories } from "@/components/landing/Categories";
import { AIEngine } from "@/components/landing/AIEngine";
import { RankShowcase } from "@/components/landing/RankShowcase";
import { CoinEconomy } from "@/components/landing/CoinEconomy";
import { Stats } from "@/components/landing/Stats";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <main className="bg-cosmos text-haze">
      <LandingNav />
      <Hero />
      <HowItWorks />
      <Categories />
      <AIEngine />
      <RankShowcase />
      <CoinEconomy />
      <Stats />
      <FinalCTA />
      <Footer />
    </main>
  );
}
