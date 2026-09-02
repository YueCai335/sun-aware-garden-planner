"use client";

import { useEffect, useState } from "react";

import { loadRuntimeConfig } from "@/lib/gardenWorkspaceApi";

type Feature = "care-note" | "plant-health" | "plant-knowledge";

const featureNames: Record<Feature, string> = {
  "care-note": "AI Garden Note",
  "plant-health": "Plant Health",
  "plant-knowledge": "Plant Knowledge",
};

export function usePortfolioDemoMode() {
  const [isPortfolioDemo, setIsPortfolioDemo] = useState<boolean>();

  useEffect(() => {
    let active = true;
    void loadRuntimeConfig()
      .then((config) => {
        if (active) setIsPortfolioDemo(Boolean(config.portfolioDemo));
      })
      .catch(() => {
        if (active) setIsPortfolioDemo(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return isPortfolioDemo;
}

export function PortfolioFeaturePreview({ feature }: { feature: Feature }) {
  const content = previewContent(feature);

  return (
    <section className="operations-content season-planner portfolio-feature-preview" aria-labelledby={`${feature}-preview-heading`}>
      <div className="section-header">
        <div>
          <p className="section-eyebrow">Local AI feature</p>
          <h2 id={`${feature}-preview-heading`}>{content.heading}</h2>
          <p className="section-context">{content.description}</p>
        </div>
      </div>
      <section className="feature-preview-sample" aria-labelledby={`${feature}-sample-heading`}>
        <p className="section-eyebrow">Sample review state</p>
        <h3 id={`${feature}-sample-heading`}>{content.sampleTitle}</h3>
        {content.body}
      </section>
    </section>
  );
}

export function PortfolioFeatureLoading({ feature }: { feature: Feature }) {
  const featureName = featureNames[feature];
  return (
    <section className="operations-content season-planner portfolio-feature-preview" aria-labelledby={`${feature}-loading-heading`}>
      <p className="section-eyebrow">Garden feature</p>
      <h2 id={`${feature}-loading-heading`}>Loading {featureName}</h2>
      <p className="section-context">Checking the public demo feature settings.</p>
    </section>
  );
}

function previewContent(feature: Feature) {
  if (feature === "care-note") {
    return {
      heading: "AI Garden Note runs in the local app",
      description: "The local Ollama workflow turns a Chinese or English care note into a draft that the gardener reviews before saving.",
      sampleTitle: "Completed care note",
      body: <>
        <p className="feature-preview-label">Note</p>
        <p>今天给后院菜床的番茄浇水。</p>
        <dl className="feature-preview-details">
          <div><dt>Care type</dt><dd>Watering</dd></div>
          <div><dt>Target</dt><dd>Back garden · Tomato group</dd></div>
          <div><dt>Review</dt><dd>Every extracted field remains editable before it reaches Care History.</dd></div>
        </dl>
      </>,
    };
  }

  if (feature === "plant-health") {
    return {
      heading: "Plant Health runs in the local app",
      description: "The local workflow keeps photos and written observations together, then presents a cautious assessment for review.",
      sampleTitle: "Leaf observation",
      body: <>
        <p className="feature-preview-label">Observation</p>
        <p>西葫芦叶子上有白色粉末状物质。</p>
        <dl className="feature-preview-details">
          <div><dt>Possible issue</dt><dd>Powdery mildew</dd></div>
          <div><dt>Suggested next step</dt><dd>Check leaf surfaces, airflow, and recent humidity before taking action.</dd></div>
          <div><dt>Confidence</dt><dd>Medium</dd></div>
        </dl>
      </>,
    };
  }

  return {
    heading: "Plant Knowledge runs in the local app",
    description: "The local retrieval workflow searches reviewed source cards and shows the evidence used for a bilingual answer.",
    sampleTitle: "Cited garden question",
    body: <>
      <p className="feature-preview-label">Question</p>
      <p>我的西葫芦叶子上有很多白色的粉，是病了吗？</p>
      <p className="feature-preview-label">Answer</p>
      <p>白色粉末状物质可能是粉状霉菌。先观察叶片正反面、黄化或卷曲情况，以及近期浇水和湿度，再决定下一步处理。</p>
      <p className="feature-preview-source">Sample source: University of Minnesota Extension · Growing summer squash and zucchini in home gardens</p>
    </>,
  };
}
