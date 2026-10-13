type BioDetailTerm = {
  label: string;
  publicPattern: RegExp;
  evidencePattern: RegExp;
};

const BIO_DETAIL_TERMS: BioDetailTerm[] = [
  { label: "NCBI", publicPattern: /\bNCBI\b/i, evidencePattern: /\bNCBI\b/i },
  { label: "16S", publicPattern: /\b16S\b/i, evidencePattern: /\b16S\b/i },
  { label: "rRNA", publicPattern: /\brRNA\b/i, evidencePattern: /\brRNA\b/i },
  { label: "lacZ", publicPattern: /\blacZ\b/i, evidencePattern: /\blacZ\b/i },
  { label: "Phred", publicPattern: /\bPhred\b/i, evidencePattern: /\bPhred\b/i },
  { label: "E. coli", publicPattern: /\bE\.?\s*coli\b/i, evidencePattern: /\bE\.?\s*coli\b|\bEscherichia\s+coli\b|大腸桿菌/i },
  { label: "大腸桿菌", publicPattern: /大腸桿菌/i, evidencePattern: /大腸桿菌|\bE\.?\s*coli\b|\bEscherichia\s+coli\b/i },
];

export function findUnsupportedBioDetailTerms(publicText: string, evidenceText: string): string[] {
  return BIO_DETAIL_TERMS
    .filter((term) => term.publicPattern.test(publicText) && !term.evidencePattern.test(evidenceText))
    .map((term) => term.label);
}
