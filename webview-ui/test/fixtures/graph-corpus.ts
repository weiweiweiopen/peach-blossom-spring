import type { AssociationCorpus } from '../../src/association/engine.js';

// Library tests require a graph larger than the eight-card direct-match window.
// Keep this fixture independent of the public source collection and deployment.
export const graphCorpus: AssociationCorpus = {
  cards: Array.from({ length: 12 }, (_, index) => ({
    id: `fixture-${index}`, title: `DIY microscopy community lab ${index}`,
    excerpt: 'A synthetic test document about DIY microscopy, wetlab experiments, community workshops, wearable sensors and textile circuit documentation.',
    keywords: ['diy', 'microscopy', 'lab', 'community', 'workshop', 'sensor', 'textile'],
    source: index % 2 ? 'sgmk' : 'hackteria',
    tags: ['documentation', 'workshop'], categories: ['community lab'],
    url: `https://example.org/fixture-${index}`, outgoingLinks: [`fixture-${(index + 8) % 12}`],
  })),
  edges: Array.from({ length: 12 }, (_, index) => ({ source: `fixture-${index}`, target: `fixture-${(index + 8) % 12}`, relation: 'test link', weight: 1 })),
  manifest: { schemaVersion: 'synthetic-library-test-v1', counts: { sourceCards: 12, graphEdges: 12 } },
};
