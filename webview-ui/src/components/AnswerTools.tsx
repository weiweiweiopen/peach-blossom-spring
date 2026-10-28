import { useState } from 'react';
import { ANSWER_COPY, exportAnswerJson, exportAnswerMarkdown, sourceSnapshotUrl, type AnswerRecord } from '../evidence/answerRecord.js';
import { sanitizeRealPersonReferences } from '../privacy.js';

export function AnswerBody({ record, text, speaker }: { record?: AnswerRecord; text: string; speaker: string }) {
  if (!record?.research) return <p className="m-0"><span className="text-accent-bright">{speaker}: </span>{text}</p>;
  const copy = ANSWER_COPY[record.language];
  return <div className="answer-research" data-research-answer="true">
    <p className="answer-speaker text-accent-bright">{speaker}</p>
    {record.research.sections.map((section, index) => <section key={`${section.kind}-${index}`} data-research-section={section.kind}>
      <h3 data-ui-part="subtitle">{sanitizeRealPersonReferences(section.title)}</h3>
      {section.items.map((item) => <p key={item.id} className={`answer-item answer-item--${item.role}`} data-answer-item={item.id}>
        {item.role !== 'fact' && <span className="answer-kind" data-ui-part="caption">{copy[item.role]} · </span>}
        {sanitizeRealPersonReferences(item.text)}{' '}
        {record.sources.filter((source) => source.quotations.some((quote) => quote.supportsItemId === item.id)).map((source) => <a key={source.sourceId} className="answer-citation" href={`#${record.id}-source-${source.index}`} aria-label={`${copy.sources} ${source.index}`}>[{source.index}]</a>)}
      </p>)}
    </section>)}
  </div>;
}

function download(record: AnswerRecord, format: 'md' | 'json') {
  const content = format === 'md' ? exportAnswerMarkdown(record) : exportAnswerJson(record);
  const url = URL.createObjectURL(new Blob([content], { type: format === 'md' ? 'text/markdown;charset=utf-8' : 'application/json;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `pbs-${record.id}.${format}`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function AnswerTools({ record }: { record: AnswerRecord }) {
  const copy = ANSWER_COPY[record.language];
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('');
  return <div className="answer-tools" data-answer-record={record.id}>
    {record.sources.length > 0 && <details className="answer-sources">
      <summary data-ui-part="caption">{copy.sources} ({record.sources.length})</summary>
      <ol>{record.sources.map((source) => <li key={source.sourceId} id={`${record.id}-source-${source.index}`}>
        <div className="answer-source-heading"><a href={source.url || sourceSnapshotUrl(source, record.evidencePacket)} target="_blank" rel="noopener noreferrer">[{source.index}] {sanitizeRealPersonReferences(source.title)}</a>
          <small data-ui-part="micro">{(() => { try { return source.url ? new URL(source.url).hostname.replace(/^www\./, '') : copy.evidence; } catch { return copy.evidence; } })()}</small></div>
        <div className="answer-source-actions">
          {sourceSnapshotUrl(source, record.evidencePacket) && <a href={sourceSnapshotUrl(source, record.evidencePacket)} target="_blank" rel="noopener noreferrer" data-ui-part="caption">{copy.snapshot}</a>}
          <details className="answer-quotations"><summary data-ui-part="caption">{copy.quotes} ({new Set(source.quotations.map((quote) => quote.quote)).size})</summary>
            {[...new Set(source.quotations.map((quote) => quote.quote))].map((quote, index) => <blockquote key={index} data-ui-part="caption">{quote}</blockquote>)}
          </details>
        </div>
      </li>)}</ol>
    </details>}
    {record.related.length > 0 && <details className="answer-related"><summary data-ui-part="caption">{copy.related} ({record.related.length})</summary>
      <ul>{record.related.map((source) => <li key={source.sourceId}><a href={source.url || sourceSnapshotUrl(source, record.evidencePacket)} target="_blank" rel="noopener noreferrer">{sanitizeRealPersonReferences(source.title)}</a></li>)}</ul>
    </details>}
    <button type="button" className="answer-export-button" data-export-answer="true" data-ui-control="text-button" data-ui-part="button-label" aria-expanded={open} onClick={() => setOpen(!open)}>↗ {copy.export}</button>
    {open && <div className="answer-export-menu" role="group" aria-label={copy.export}>
      <p data-ui-part="caption">{copy.scope}</p>
      <button type="button" data-export-format="md" data-ui-control="text-button" data-ui-part="button-label" onClick={() => download(record, 'md')}>{copy.markdown}</button>
      <button type="button" data-export-format="json" data-ui-control="text-button" data-ui-part="button-label" onClick={() => download(record, 'json')}>{copy.json}</button>
      <button type="button" data-ui-control="text-button" data-ui-part="button-label" onClick={() => {
        if (!navigator.clipboard) { setStatus(copy.copyFailed); return; }
        void navigator.clipboard.writeText(exportAnswerMarkdown(record)).then(() => setStatus(copy.copied), () => setStatus(copy.copyFailed));
      }}>{copy.copy}</button>
      {status && <p role="status" data-ui-part="caption">{status}</p>}
    </div>}
  </div>;
}
