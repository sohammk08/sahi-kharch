import CTA from "../components/CTA";
import Hero from "../components/Hero";
import Problems from "../components/Problems";
import TechStrip from "../components/TechStrip";
import HowItWorks from "../components/HowItWorks";
import Differentiators from "../components/Differentiators";

function Landing() {
  return (
    <main>
      <Hero />
      <Problems />
      <HowItWorks />
      <Differentiators />
      <TechStrip />
      <CTA />
    </main>
  );
}

export default Landing;
