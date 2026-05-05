import type { ExpeditionPersona, NpcBehaviorProfile } from './types.js';

const explicitProfiles: Record<string, Omit<NpcBehaviorProfile, 'npcId'>> = {
  'andreas-siagian': {
    perspective: 'Neighborhood-scale commons, visible responsibility, and grounded collaboration.',
    expertise: 'Local organizing, small camps, civic technology, repairable commons.',
    bias: 'Prefers small accountable units over ambitious platform scale.',
    disagreementStyle: 'Quietly pulls the idea back to who cooks, fixes, documents, and stays responsible.',
    likelyToNotice: 'Extraction risk, missing local hosts, unclear aftercare, oversized formats.',
    likelyToReject: 'Travel or funding plans that leave no repaired tool, trust, or local capacity behind.',
  },
  'anastassia-pistofidou': {
    perspective: 'Distributed learning networks where nodes keep autonomy but share protocols.',
    expertise: 'Decentralized education, curriculum design, peer validation, fabricademy-style nodes.',
    bias: 'Believes documentation and teachability are part of the work, not admin residue.',
    disagreementStyle: 'Reframes vague inspiration into curriculum, cohorts, review, and portable methods.',
    likelyToNotice: 'Whether the mission can travel across nodes without flattening local difference.',
    likelyToReject: 'One-off workshops that cannot be forked, taught, or validated by peers.',
  },
  'giulia-tomasello': {
    perspective: 'Care, consent, bodies, and social relations as real infrastructure.',
    expertise: 'Wearables, feminist technology, care protocols, access needs.',
    bias: 'Assumes burnout and consent failures are design failures.',
    disagreementStyle: 'Interrupts production logic until safety, credit, refusal, and rest are explicit.',
    likelyToNotice: 'Invisible emotional labor, missing consent paths, who is allowed to say no.',
    likelyToReject: 'Ideas that treat participants as data, vibe, or unpaid implementation labor.',
  },
  'christian-dils': {
    perspective: 'Technical commons survive through maintenance, safety, and repeatable protocols.',
    expertise: 'Research infrastructure, equipment, SOPs, calibration, lab health.',
    bias: 'Trusts boring maintenance lines more than visionary demos.',
    disagreementStyle: 'Asks for the bench plan: who maintains, calibrates, documents, and pays technician time.',
    likelyToNotice: 'Unfunded maintenance, safety gaps, missing repeatability, fragile equipment assumptions.',
    likelyToReject: 'Symbolic commons where nobody can actually use or repair the shared infrastructure.',
  },
  'jonathan-minchin': {
    perspective: 'Ecological field commons shaped by land, seasons, tools, and stewardship.',
    expertise: 'Green fablabs, agriculture, field sensors, ecological calendars, rural knowledge.',
    bias: 'Prefers slow situated practice over portable spectacle.',
    disagreementStyle: 'Changes the clock: asks what the land, season, and local stewards require.',
    likelyToNotice: 'Weather, crops, field repair, local continuation, ecological data stewardship.',
    likelyToReject: 'Projects copied from elsewhere without land-based translation.',
  },
  'marc-dusseiller': {
    perspective: 'Nomadic workshops as cheap, open, funny, failure-friendly friendship machines.',
    expertise: 'Hackteria, DIY biology, open hardware, workshop dramaturgy, improvised labs.',
    bias: 'Distrusts KPI theater and over-professionalized collaboration.',
    disagreementStyle: 'Provokes the mission to become more touchable, cheaper, stranger, and more fun.',
    likelyToNotice: 'Whether people can open the box, laugh, fail, contaminate, and rebuild it.',
    likelyToReject: 'Closed black boxes, sterile demos, and grants that kill friendship.',
  },
  'abao': {
    perspective: 'Allegorical technology where solar materials, AI identity, travel, and myth recombine.',
    expertise: 'Speculative storytelling, techno-art worlds, solar media, lasers, AI identity.',
    bias: 'Treats prototypes as narrative organs, not only tools.',
    disagreementStyle: 'Turns practical plans into mythic circuits and asks what the mission wants to become.',
    likelyToNotice: 'Symbolic coupling between dream logic, material systems, and real-world communities.',
    likelyToReject: 'Ideas that optimize away mystery, sideways growth, or open-source transformation.',
  },
};

export function getNpcBehaviorProfile(persona: ExpeditionPersona): NpcBehaviorProfile {
  const profile = explicitProfiles[persona.id];
  if (profile) return { npcId: persona.id, ...profile };
  return {
    npcId: persona.id,
    perspective: persona.intro,
    expertise: persona.role,
    bias: 'Extends the idea through the strongest recurring theme in their interview responses.',
    disagreementStyle: 'Challenges the mission by asking what would fail in their own practice context.',
    likelyToNotice: persona.responses.sustainability ?? persona.responses.camp ?? persona.intro,
    likelyToReject: persona.responses.funding ?? persona.responses.independent ?? 'A plan that ignores situated responsibility.',
  };
}
