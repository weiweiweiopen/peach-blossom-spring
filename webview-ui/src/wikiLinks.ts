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
  wikiById.set(data.intervieweeId, {
    ...data,
    links: prioritizeCommunityWikiLinks(data.links),
  });
}

function isWikiLink(link: WikiLink): boolean {
  const text = `${link.title} ${link.url}`.toLowerCase();
  return text.includes('wiki') || text.includes('wikipedia.org');
}

function isPersonalProfileLink(link: WikiLink): boolean {
  const text = `${link.title} ${link.url}`.toLowerCase();
  if (isWikiLink(link)) return false;
  return [
    ' personal ',
    ' official website',
    ' about',
    ' profile',
    ' linkedin',
    ' researchgate',
    ' academia.edu',
    'author page',
    'users/',
    'students/',
    'interview',
  ].some((term) => ` ${text} `.includes(term));
}

function prioritizeCommunityWikiLinks(links: WikiLink[]): WikiLink[] {
  return links
    .filter((link) => !isPersonalProfileLink(link))
    .sort((a, b) => Number(isWikiLink(b)) - Number(isWikiLink(a)));
}

export function getWikiLinksForInterviewee(intervieweeId: string): IntervieweeWikiLinks {
  return wikiById.get(intervieweeId) ?? { intervieweeId, links: [] };
}
