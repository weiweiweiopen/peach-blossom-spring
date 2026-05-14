import type { QuestionDossier } from './types.js';

interface DossierPanelProps {
  dossier: QuestionDossier;
  onCreateMockReview?: () => void;
  onCreateProposalDraft?: () => void;
}

export function DossierPanel({ dossier, onCreateMockReview, onCreateProposalDraft }: DossierPanelProps) {
  const latestProposal = dossier.proposalVersions.at(-1);

  return (
    <section className="pet-detail-section" aria-label="Question dossier">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="type-label pet-detail-kicker">Question Dossier</p>
          <h3 className="type-subheading">{dossier.maturityStage.replaceAll('_', ' ')}</h3>
        </div>
        <span className="type-micro border border-[var(--palette-blue)] px-2 py-1">
          local-only
        </span>
      </div>

      <p className="type-caption mt-3 opacity-80">
        Safe producer slice: local dossier plus optional mock council review. No LLM,
        external search, or council automation is connected yet.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {dossier.councilReviews.length === 0 && onCreateMockReview && (
          <button
            className="border border-[var(--palette-blue)] px-3 py-2 text-left type-caption hover:bg-white/10"
            type="button"
            onClick={onCreateMockReview}
          >
            Add mock commons review
          </button>
        )}
        {dossier.councilReviews.length > 0 && dossier.proposalVersions.length === 0 && onCreateProposalDraft && (
          <button
            className="border border-[var(--palette-blue)] px-3 py-2 text-left type-caption hover:bg-white/10"
            type="button"
            onClick={onCreateProposalDraft}
          >
            Create guarded proposal draft
          </button>
        )}
      </div>

      <div className="mt-4 grid gap-2 text-sm">
        <p><strong>Evidence items:</strong> {dossier.evidenceItems.length}</p>
        <p><strong>Council reviews:</strong> {dossier.councilReviews.length}</p>
        <p><strong>Resource cards:</strong> {dossier.resourceCards.length}</p>
        <p><strong>Proposal versions:</strong> {dossier.proposalVersions.length}</p>
      </div>

      {dossier.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {dossier.tags.map((tag) => (
            <span key={tag} className="type-micro border border-[var(--palette-blue)] px-2 py-1">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4">
        <p className="type-label pet-detail-kicker">Evidence separation</p>
        {dossier.evidenceItems.map((item) => (
          <article key={item.id} className="mt-2 border-l-2 border-[var(--palette-blue)] pl-3">
            <p className="type-micro">{item.evidenceType}</p>
            <p className="type-caption">{item.summary}</p>
          </article>
        ))}
      </div>

      <div className="mt-4">
        <p className="type-label pet-detail-kicker">Council review shell</p>
        {dossier.councilReviews.length === 0 ? (
          <p className="type-caption mt-2 opacity-80">
            No review yet. Use the mock review button to test the producer data flow without an LLM.
          </p>
        ) : (
          dossier.councilReviews.map((review) => (
            <article key={review.id} className="mt-2 border-l-2 border-[var(--palette-blue)] pl-3">
              <p className="type-micro">{review.kind} · {review.evidenceType}</p>
              <p className="type-caption font-semibold">{review.summary}</p>
              <p className="type-caption mt-1">{review.critique}</p>
              {review.suggestedRevision && (
                <p className="type-caption mt-1 opacity-80">↳ {review.suggestedRevision}</p>
              )}
            </article>
          ))
        )}
      </div>

      <div className="mt-4">
        <p className="type-label pet-detail-kicker">Risk checks</p>
        {dossier.riskChecks.map((risk) => (
          <article key={risk.id} className="mt-2 border-l-2 border-[var(--palette-orange,var(--palette-blue))] pl-3">
            <p className="type-micro">{risk.category} · {risk.level}</p>
            <p className="type-caption">{risk.question}</p>
          </article>
        ))}
      </div>

      {latestProposal ? (
        <div className="mt-4">
          <p className="type-label pet-detail-kicker">Latest proposal · {latestProposal.evidenceType}</p>
          <article className="mt-2 border-l-2 border-[var(--palette-blue)] pl-3">
            <p className="type-caption font-semibold">{latestProposal.title}</p>
            <p className="type-caption mt-2"><strong>How to make:</strong> {latestProposal.howToMake}</p>
            <p className="type-caption mt-2"><strong>For / with:</strong> {latestProposal.whoForAndWith}</p>
            <p className="type-caption mt-2"><strong>Commons contribution:</strong> {latestProposal.commonsContribution}</p>
            <p className="type-caption mt-2"><strong>Next experiment:</strong> {latestProposal.nextExperiment}</p>
            <ul className="mt-2 list-disc pl-4 type-caption">
              {latestProposal.openQuestions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ul>
            <p className="type-micro mt-2 opacity-80">
              linked evidence: {latestProposal.evidenceItemIds.length} · linked risks: {latestProposal.riskCheckIds.length}
            </p>
          </article>
        </div>
      ) : (
        <p className="type-caption mt-4 opacity-80">
          No proposal yet. Add a mock commons review, then create a guarded local draft from reviewed dossier data.
        </p>
      )}
    </section>
  );
}
