import { type FormEvent, useMemo, useState } from "react";

import { associationCorpus } from "./corpus.js";
import "./AssociationPanel.css";
import { runAssociationWorkflow } from "./associationWorkflow.js";

interface AssociationPanelProps {
  onClose: () => void;
}

const EXAMPLE_SEED = "A research note about DIY microscopy, wet labs, handmade sensors, and community repair.";

export function AssociationPanel({ onClose }: AssociationPanelProps) {
  const [seed, setSeed] = useState(EXAMPLE_SEED);
  const [submittedSeed, setSubmittedSeed] = useState(EXAMPLE_SEED);
  const workflow = useMemo(
    () => runAssociationWorkflow(submittedSeed, associationCorpus),
    [submittedSeed],
  );
  const report = workflow.step1.report;
  const researchTopics = workflow.step3.researchTopics;
  const publicArtifact = workflow.step4.publicArtifact;

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const nextSeed = seed.trim();
    if (!nextSeed) return;
    setSubmittedSeed(nextSeed);
  }

  return (
    <section className="association-panel" aria-label="Seed-to-Future panel">
      <div className="association-panel-header">
        <div>
          <p className="association-kicker">Seed-to-Future</p>
          <h2>Public Writing Engine</h2>
          <p>這個東西的未來可以變成什麼？ 使用公開的 association corpus 生成一份可讀、可測試、可修正的小誌草圖。</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close writing panel">
          Close
        </button>
      </div>

      <form className="association-seed-form" onSubmit={handleSubmit}>
        <label htmlFor="association-seed">Input: poem, song, artwork text, curatorial note, or research note</label>
        <textarea
          id="association-seed"
          value={seed}
          onChange={(event) => setSeed(event.target.value)}
          rows={5}
        />
        <button type="submit">Generate Futures</button>
      </form>

      <div className="association-meta">
        <span>MVP mode: using a tiny checked-in sample corpus.</span>
        <span>{report.corpusSummary}</span>
        <span>keywords: {report.keywords.join(", ") || "none"}</span>
        <span>depth score: {report.depthMetrics.depthScore}/100</span>
        <span>linked pages: {report.depthMetrics.linkedExpansions}</span>
        <span>second-layer texts: {report.depthMetrics.deepReadExpansions}</span>
        <span>research topics: {researchTopics.length}</span>
        <span>public artifact: {publicArtifact.approvedForPublicLayout ? "approved" : "blocked"}</span>
      </div>

      <div className="association-columns">
        <div>
          <h3>Matching Source Cards</h3>
          <ol className="association-card-list">
            {report.matchedCards.slice(0, 5).map((card) => (
              <li key={card.id}>
                <strong>{card.title}</strong>
                <span>{card.id}</span>
              </li>
            ))}
          </ol>
        </div>

        <div>
          <h3>Graph Links</h3>
          <ol className="association-card-list">
            {report.expandedCards.slice(0, 5).map((card) => (
              <li key={card.id}>
                <strong>{card.title}</strong>
                <span>{card.id}</span>
              </li>
            ))}
          </ol>
        </div>

        <div>
          <h3>Recursive Linked Pages</h3>
          <ol className="association-card-list">
            {report.linkedCards.slice(0, 6).map((trail) => (
              <li key={`${trail.card.id}-${trail.depth}`}>
                <strong>{trail.card.title}</strong>
                <span>depth {trail.depth} · {trail.card.id}</span>
              </li>
            ))}
          </ol>
        </div>

        <div>
          <h3>Depth Gate</h3>
          <ol className="association-card-list">
            {report.depthMetrics.warnings.length > 0 ? report.depthMetrics.warnings.map((warning) => (
              <li key={warning}>
                <strong>{warning}</strong>
                <span>publish caveat</span>
              </li>
            )) : (
              <li>
                <strong>Evidence depth passed</strong>
                <span>{report.depthMetrics.averageExcerptChars} avg excerpt chars</span>
              </li>
            )}
          </ol>
        </div>
      </div>

      <div className="association-futures">
        <h3>Public Artifact / Layout Contract</h3>
        <article className="association-future-card" data-confidence={publicArtifact.approvedForPublicLayout ? "high" : "low"}>
          <div className="association-future-title-row">
            <h4>{publicArtifact.title}</h4>
            <span>{publicArtifact.approvedForPublicLayout ? "ready for public layout" : "blocked"}</span>
          </div>
          <p>{publicArtifact.subtitle}</p>
          <p>{publicArtifact.opening}</p>
          <p className="association-caveat">{publicArtifact.proposition}</p>
          {publicArtifact.sections.map((section) => (
            <section key={section.id}>
              <h5>{section.title}</h5>
              <p>{section.body}</p>
            </section>
          ))}
        </article>

        <h3>Research Topics / Step 3</h3>
        {researchTopics.map((topic) => (
          <article key={topic.title} className="association-future-card" data-confidence={topic.maturityScore >= 70 ? "high" : topic.maturityScore >= 45 ? "medium" : "low"}>
            <div className="association-future-title-row">
              <h4>{topic.title}</h4>
              <span>{Math.round(topic.maturityScore)}/100 · {topic.relationPattern}</span>
            </div>
            <p>{topic.researchQuestion}</p>
            <p className="association-caveat">Systems: {topic.knowledgeSystems.join(" / ")}</p>
            <p className="association-citations">Evidence: {topic.evidenceTrail.map((card) => `${card.id} (${card.title})`).join("; ")}</p>
          </article>
        ))}

        <h3>Futures / Step 4 output frames</h3>
        {report.futures.map((future) => (
          <article key={future.title} className="association-future-card" data-confidence={future.confidence}>
            <div className="association-future-title-row">
              <h4>{future.title}</h4>
              <span>{future.confidence} confidence</span>
            </div>
            <p>{future.scenario}</p>
            {future.caveat && <p className="association-caveat">Caveat: {future.caveat}</p>}
            {future.citations.length > 0 && (
              <p className="association-citations">
                Sources: {future.citations.map((card) => `${card.id} (${card.title})`).join("; ")}
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
