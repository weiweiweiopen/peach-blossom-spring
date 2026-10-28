import { useEffect, useState } from 'react';
import type { LanguageCode } from '../i18n.js';
import { savedPublications } from '../association/evidencePublication.js';

const COPY: Record<LanguageCode, string> = { 'zh-TW': '本機小誌書架', en: 'Saved zines on this browser', id: 'Zine tersimpan di peramban ini', de: 'Zines in diesem Browser', ja: 'このブラウザの小誌', th: 'ซีนที่บันทึกในเบราว์เซอร์นี้' };
export function SavedZines({ language }: { language: LanguageCode }) {
  const [items, setItems] = useState(savedPublications);
  useEffect(() => {
    const update = () => setItems(savedPublications());
    window.addEventListener('pbs:publications-updated', update);
    window.addEventListener('storage', update);
    return () => { window.removeEventListener('pbs:publications-updated', update); window.removeEventListener('storage', update); };
  }, []);
  const [urls, setUrls] = useState<Record<string, string>>({});
  useEffect(() => {
    const next = Object.fromEntries(items.map((item) => [item.id, URL.createObjectURL(new Blob([item.html], { type: 'text/html;charset=utf-8' }))]));
    setUrls(next);
    return () => Object.values(next).forEach((url) => URL.revokeObjectURL(url));
  }, [items]);
  if (!items.length) return null;
  return <details className="pbs-publication-shelf"><summary data-ui-part="caption">📚 {COPY[language]} ({items.length})</summary><ul>{items.map((item) => <li key={item.id}><a href={urls[item.id]} target="_blank" rel="noopener noreferrer">{item.title}</a><small>{new Date(item.createdAt).toLocaleDateString(language)}</small></li>)}</ul></details>;
}
