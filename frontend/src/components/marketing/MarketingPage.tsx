import { Navbar } from "./Navbar";
import { Hero } from "./Hero";
import { KnowledgeExperience } from "./KnowledgeExperience";
import { RAGExperience } from "./RAGExperience";
import { ConversationExperience } from "./ConversationExperience";
import { WidgetExperience } from "./WidgetExperience";
import { EcosystemExperience } from "./EcosystemExperience";
import { ScaleSection } from "./ScaleSection";
import { FinalCTA } from "./FinalCTA";
import { Footer } from "./Footer";

export function MarketingPage() {
  return (
    <>
      <div className="grain" />
      <Navbar />
      <main>
        <Hero />
        <KnowledgeExperience />
        <RAGExperience />
        <ConversationExperience />
        <WidgetExperience />
        <EcosystemExperience />
        <ScaleSection />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
