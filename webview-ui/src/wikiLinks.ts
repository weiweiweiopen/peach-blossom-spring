export interface WikiLink {
  title: string;
  url: string;
  description: string;
}

export interface IntervieweeWikiLinks {
  intervieweeId: string;
  links: WikiLink[];
}

const wikiModules = import.meta.glob('../../data/wiki/interviewees/*/links.json', {
  import: 'default',
  eager: true,
}) as Record<string, IntervieweeWikiLinks>;

const wikiById = new Map<string, IntervieweeWikiLinks>();
for (const data of Object.values(wikiModules)) {
  wikiById.set(data.intervieweeId, data);
}

export function getWikiLinksForInterviewee(intervieweeId: string): IntervieweeWikiLinks {
  return wikiById.get(intervieweeId) ?? { intervieweeId, links: [] };
}
