import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CommunityPulse } from "@/components/brief/sections/CommunityPulse";
import { PainPoints } from "@/components/brief/sections/PainPoints";
import { CompetitiveTeardown } from "@/components/brief/sections/CompetitiveTeardown";
import { MotherInsight } from "@/components/brief/sections/MotherInsight";
import { MVPIdea } from "@/components/brief/sections/MVPIdea";
import { HypothesisRoadmap } from "@/components/brief/sections/HypothesisRoadmap";
import { BuildSignal } from "@/components/brief/sections/BuildSignal";
import { demoBrief } from "@/tests/fixtures";

describe("section smoke tests", () => {
  it("renders each section with fixture data", () => {
    render(
      <div>
        <CommunityPulse data={demoBrief.sections.communityPulse} />
        <PainPoints data={demoBrief.sections.painPoints} />
        <CompetitiveTeardown data={demoBrief.sections.competitiveTeardown} />
        <MotherInsight data={demoBrief.sections.motherInsight} />
        <MVPIdea data={demoBrief.sections.mvpIdea} />
        <HypothesisRoadmap data={demoBrief.sections.hypothesisRoadmap} />
        <BuildSignal data={demoBrief.sections.buildSignal} />
      </div>,
    );

    expect(screen.getAllByText("Community Pulse").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Pain Points").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Competitive Teardown").length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText("The Mother Insight").length).toBeGreaterThan(0);
    expect(screen.getAllByText("MVP Idea").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Hypothesis Roadmap").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Build Signal").length).toBeGreaterThan(0);
  });

  it("renders skeleton state for each section when data is missing", () => {
    const { container } = render(
      <div>
        <CommunityPulse />
        <PainPoints />
        <CompetitiveTeardown />
        <MotherInsight />
        <MVPIdea />
        <HypothesisRoadmap />
        <BuildSignal />
      </div>,
    );

    expect(container.querySelectorAll(".skeleton-line").length).toBeGreaterThan(
      0,
    );
  });
});
