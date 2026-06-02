DROP TABLE IF EXISTS memory;
CREATE VIRTUAL TABLE memory USING fts5(
  title,
  body,
  path UNINDEXED,
  source_family UNINDEXED,
  url UNINDEXED,
  tokenize='unicode61 remove_diacritics 2'
);
