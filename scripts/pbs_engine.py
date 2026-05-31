#!/usr/bin/env python3
import argparse, html, json, os, re, sqlite3, sys, time, urllib.parse, urllib.request
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCES_CFG = ROOT / 'pbs_sources.json'
KNOW = ROOT / 'obsidian-vault' / 'Knowledge'
DB = KNOW / 'pbs_source_first.sqlite'
REGISTRY = KNOW / 'source-registry.jsonl'
DRAFTS = ROOT / 'obsidian-vault' / 'Review' / 'compiled-note-drafts'
WIKI = ROOT / 'obsidian-vault' / 'Wiki'
UA = 'PBS-source-first-memory/0.1 (+local research; respectful crawl)'

TAG_RE = re.compile(r'<[^>]+>')
TITLE_RE = re.compile(r'^#\s+(.+)$', re.M)
WORD_RE = re.compile(r'[A-Za-z0-9_\-\u00c0-\uffff]{2,}')
SPACE_RE = re.compile(r'\s+')

def now(): return datetime.now().isoformat(timespec='seconds')

def load_cfg(): return json.loads(SOURCES_CFG.read_text())['sources']

def fetch_json(url, params=None):
    if params:
        url += ('&' if '?' in url else '?') + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'application/json'})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode('utf-8', errors='ignore'))

def strip_html(s):
    s = re.sub(r'<(script|style).*?</\1>', ' ', s, flags=re.S|re.I)
    s = re.sub(r'<br\s*/?>', '\n', s, flags=re.I)
    s = re.sub(r'</p\s*>', '\n\n', s, flags=re.I)
    s = re.sub(r'</h[1-6]\s*>', '\n\n', s, flags=re.I)
    s = TAG_RE.sub(' ', s)
    s = html.unescape(s)
    return SPACE_RE.sub(' ', s).strip()

def slugify(s, maxlen=90):
    words = WORD_RE.findall(html.unescape(s).lower())[:12]
    slug = '-'.join(words) or 'untitled'
    slug = re.sub(r'[^\w\-\u00c0-\uffff]+', '-', slug).strip('-')
    return slug[:maxlen]

def safe_write(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding='utf-8')

def frontmatter(meta):
    lines = ['---']
    for k,v in meta.items():
        if isinstance(v, list):
            lines.append(f'{k}:')
            for item in v: lines.append(f'  - {json.dumps(item, ensure_ascii=False)}')
        else:
            lines.append(f'{k}: {json.dumps(v, ensure_ascii=False)}')
    lines.append('---')
    return '\n'.join(lines)

def append_registry(rec):
    KNOW.mkdir(parents=True, exist_ok=True)
    with REGISTRY.open('a', encoding='utf-8') as f:
        f.write(json.dumps(rec, ensure_ascii=False) + '\n')

def mediawiki_allpages(api, limit):
    pages=[]; cont={}
    while len(pages)<limit:
        params={'action':'query','list':'allpages','apnamespace':0,'aplimit':min(50, limit-len(pages)),'format':'json'}
        params.update(cont)
        data=fetch_json(api, params)
        pages += [p['title'] for p in data.get('query',{}).get('allpages',[])]
        if 'continue' not in data or len(pages)>=limit: break
        cont=data['continue']
        time.sleep(0.15)
    return pages[:limit]

def mediawiki_parse(api, title):
    data=fetch_json(api, {'action':'parse','page':title,'prop':'text|links|categories','format':'json','redirects':1})
    p=data.get('parse',{})
    html_text=p.get('text',{}).get('*','')
    links=[l.get('*') for l in p.get('links',[]) if l.get('ns')==0 and l.get('*')]
    cats=[c.get('*') for c in p.get('categories',[]) if c.get('*')]
    return strip_html(html_text), links[:80], cats[:40], p.get('title',title)

def crawl_mediawiki(name, spec, limit):
    out=ROOT/spec['out']; out.mkdir(parents=True, exist_ok=True)
    titles=['Main Page']
    # Prefer links from Main Page so first crawl is source-shaped, not alphabetic/spam-shaped.
    try:
        _, main_links, _, _ = mediawiki_parse(spec['api'], 'Main Page')
        titles += [t for t in main_links if t != 'Main Page']
    except Exception as e:
        print(f'WARN main links failed for {name}: {e}', file=sys.stderr)
    if len(titles) < limit:
        try:
            titles += [t for t in mediawiki_allpages(spec['api'], max(0,limit-len(titles))) if t not in titles]
        except Exception as e:
            print(f'WARN allpages failed for {name}: {e}', file=sys.stderr)
    count=0
    for title in titles[:limit]:
        try:
            text, links, cats, real_title = mediawiki_parse(spec['api'], title)
            if not text: continue
            rel = out / f'{slugify(real_title)}.md'
            url = spec['main'].rsplit('/wiki/',1)[0] + '/wiki/' + urllib.parse.quote(real_title.replace(' ','_'))
            body = frontmatter({'type':'raw-source','sourceFamily':name,'title':real_title,'url':url,'fetched':now(),'links':links,'categories':cats})
            body += f'\n\n# {real_title}\n\n{text}\n'
            safe_write(rel, body)
            append_registry({'sourceFamily':name,'title':real_title,'url':url,'path':str(rel.relative_to(ROOT)),'fetched':now(),'bytes':len(body.encode())})
            count+=1; time.sleep(0.2)
        except Exception as e:
            print(f'WARN parse failed {name}:{title}: {e}', file=sys.stderr)
    print(f'crawled {count} {name} pages')

def crawl_wordpress(name, spec, limit):
    out=ROOT/spec['out']; out.mkdir(parents=True, exist_ok=True)
    per=min(100,limit); page=1; count=0
    while count<limit:
        try:
            posts=fetch_json(spec['api'], {'per_page':per,'page':page,'_fields':'id,date,link,title,excerpt,content,categories,tags'})
        except Exception as e:
            print(f'WARN wp fetch failed page {page}: {e}', file=sys.stderr); break
        if not posts: break
        for post in posts:
            if count>=limit: break
            title=strip_html(post.get('title',{}).get('rendered','untitled')) or 'untitled'
            excerpt=strip_html(post.get('excerpt',{}).get('rendered',''))
            content=strip_html(post.get('content',{}).get('rendered',''))
            text=(excerpt+'\n\n'+content).strip()
            if not text: continue
            rel=out/f'{post.get("id")}-{slugify(title)}.md'
            body=frontmatter({'type':'raw-source','sourceFamily':name,'title':title,'url':post.get('link',''),'date':post.get('date',''),'fetched':now()})
            body += f'\n\n# {title}\n\n{text}\n'
            safe_write(rel, body)
            append_registry({'sourceFamily':name,'title':title,'url':post.get('link',''),'path':str(rel.relative_to(ROOT)),'fetched':now(),'bytes':len(body.encode())})
            count+=1
        page+=1; time.sleep(0.2)
    print(f'crawled {count} {name} posts')

def cmd_crawl(args):
    if REGISTRY.exists() and args.reset_registry: REGISTRY.unlink()
    cfg=load_cfg()
    targets=args.source or list(cfg.keys())
    for name in targets:
        spec=cfg[name]
        if spec['kind']=='mediawiki': crawl_mediawiki(name,spec,args.limit)
        elif spec['kind']=='wordpress': crawl_wordpress(name,spec,args.limit)

def connect():
    KNOW.mkdir(parents=True, exist_ok=True)
    con=sqlite3.connect(DB)
    con.execute('pragma journal_mode=wal')
    con.execute('create table if not exists docs(id integer primary key, path text unique, title text, family text, url text, mtime real, bytes integer)')
    con.execute('create virtual table if not exists docs_fts using fts5(title, body, path unindexed, family unindexed, url unindexed)')
    return con

def title_for(path,text):
    m=TITLE_RE.search(text[:3000]); return m.group(1).strip() if m else path.stem

def parse_meta(text):
    meta={}
    if text.startswith('---'):
        end=text.find('\n---',3)
        if end!=-1:
            fm=text[3:end]
            for line in fm.splitlines():
                if ':' in line and not line.startswith(' '):
                    k,v=line.split(':',1); meta[k.strip()]=v.strip().strip('"')
    return meta

def cmd_index(args):
    con=connect(); con.execute('delete from docs'); con.execute('delete from docs_fts')
    count=0
    for p in (ROOT/'Sources'/'Raw').rglob('*.md'):
        text=p.read_text(encoding='utf-8', errors='ignore')
        if not text.strip(): continue
        meta=parse_meta(text); title=meta.get('title') or title_for(p,text)
        family=meta.get('sourceFamily') or p.parent.name; url=meta.get('url','')
        st=p.stat(); cur=con.execute('insert into docs(path,title,family,url,mtime,bytes) values(?,?,?,?,?,?)',(str(p.relative_to(ROOT)),title,family,url,st.st_mtime,st.st_size))
        con.execute('insert into docs_fts(rowid,title,body,path,family,url) values(?,?,?,?,?,?)',(cur.lastrowid,title,text,str(p.relative_to(ROOT)),family,url))
        count+=1
    con.commit(); con.close(); print(f'indexed {count} raw source docs into {DB}')

def search_rows(query, limit, family=None):
    con=connect(); where='docs_fts match ?'; params=[query]
    if family: where+=' and family = ?'; params.append(family)
    sql=f"""select rowid,title,path,family,url,bm25(docs_fts) score,
           snippet(docs_fts,1,'[',']',' … ',32) snippet
           from docs_fts where {where} order by score limit ?"""
    params.append(limit)
    rows=con.execute(sql,params).fetchall(); con.close(); return rows

def cmd_search(args):
    rows=search_rows(args.query,args.limit,args.family)
    for i,(_,title,path,family,url,score,snippet) in enumerate(rows,1):
        print(f'## {i}. {title}')
        print(f'family: {family}')
        print(f'path: {path}')
        if url: print(f'url: {url}')
        print(f'bm25: {score:.4f}')
        print(snippet.replace('\n',' ')[:1200]); print()

def cmd_draft(args):
    rows=search_rows(args.query,args.limit,args.family)
    DRAFTS.mkdir(parents=True, exist_ok=True)
    out=DRAFTS/f'{slugify(args.query)}.md'
    lines=['---','type: compiled-note-draft','status: review',f'category: {args.category}',f'query: {json.dumps(args.query,ensure_ascii=False)}',f'created: {now()}','sourceRefs:']
    for _,_,path,_,url,_,_ in rows:
        lines.append(f'  - {json.dumps(path, ensure_ascii=False)}')
    lines += ['---','',f'# {args.query}','', '## Draft instruction', 'Use the evidence below to write a reviewed durable Wiki note. Do not promote until source context is checked.', '', '## Evidence snippets']
    for i,(_,title,path,family,url,score,snippet) in enumerate(rows,1):
        lines += ['',f'### {i}. {title}',f'- family: `{family}`',f'- sourceRef: `{path}`']
        if url: lines.append(f'- url: {url}')
        lines += [f'- bm25: `{score:.4f}`','',snippet.replace('\n',' ')[:1400]]
    lines += ['', '## Proposed durable-note fields', '', '- summary:', '- evidence:', '- relatedConcepts:', '- relatedMethods:', '- relatedMaterials:', '- relatedSocialForms:', '- relatedProjects:', '- openQuestions:']
    out.write_text('\n'.join(lines), encoding='utf-8')
    print(out)

def cmd_promote(args):
    src = Path(args.draft)
    if not src.is_absolute():
        src = ROOT / src
    if not src.exists():
        raise SystemExit(f'draft not found: {src}')
    text = src.read_text(encoding='utf-8', errors='ignore')
    category = args.category
    if not category:
        m = re.search(r'^category:\s*(.+)$', text, re.M)
        category = (m.group(1).strip() if m else 'Concepts')
    title = args.title
    if not title:
        m = re.search(r'^#\s+(.+)$', text, re.M)
        title = (m.group(1).strip() if m else src.stem)
    out_dir = WIKI / category
    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / f'{slugify(title)}.md'
    promoted = text.replace('type: compiled-note-draft', 'type: compiled-wiki-note').replace('status: review', 'status: active')
    promoted += f"\n\n## Promotion Log\n\nPromoted from `{src.relative_to(ROOT)}` at {now()}. Review evidence before treating as final prose.\n"
    out.write_text(promoted, encoding='utf-8')
    # update index and log conservatively
    idx = WIKI / 'index.md'
    idx_text = idx.read_text(encoding='utf-8', errors='ignore') if idx.exists() else '# PBS Source-First Wiki Index\n'
    link = f'- [[{category}/{out.stem}|{title}]]'
    if link not in idx_text:
        idx_text += f"\n{link}\n"
        idx.write_text(idx_text, encoding='utf-8')
    log = WIKI / 'log.md'
    with log.open('a', encoding='utf-8') as f:
        f.write(f"\n## [{datetime.now().date()}] promote | {title}\n- Promoted `{src.relative_to(ROOT)}` to `{out.relative_to(ROOT)}`.\n")
    print(out)

def cmd_export_game_index(args):
    out = Path(args.target)
    if not out.is_absolute():
        out = ROOT / out
    items = []
    fm_re = re.compile(r'^---\n(.*?)\n---\n', re.S)
    for p in sorted((ROOT/'Sources'/'Raw').rglob('*.md')):
        text = p.read_text(encoding='utf-8', errors='ignore')
        meta = parse_meta(text)
        body = fm_re.sub('', text).strip()
        title = meta.get('title') or title_for(p, body)
        items.append({
            'title': title,
            'url': meta.get('url',''),
            'sourceFamily': meta.get('sourceFamily') or p.parent.name,
            'path': str(p.relative_to(ROOT)),
            'description': re.sub(r'\s+', ' ', body).strip()[:620],
        })
    payload = {'version':'source-first-2026-05-31','name':'PBS local memory source-first index','count':len(items),'items':items}
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'exported {len(items)} items to {out}')

def cmd_status(args):
    print('root:', ROOT)
    print('raw files:', len(list((ROOT/'Sources'/'Raw').rglob('*.md'))))
    print('db exists:', DB.exists(), DB)
    if DB.exists():
        con=connect(); print('indexed docs:', con.execute('select count(*) from docs').fetchone()[0]); con.close()
    print('drafts:', len(list(DRAFTS.glob('*.md'))) if DRAFTS.exists() else 0)

def main():
    ap=argparse.ArgumentParser(description='PBS source-first memory engine: crawl -> index -> search -> draft')
    sub=ap.add_subparsers(dest='cmd', required=True)
    p=sub.add_parser('crawl'); p.add_argument('--limit',type=int,default=30); p.add_argument('--source',action='append',choices=['hackteria','sgmk','htgwyw']); p.add_argument('--reset-registry',action='store_true'); p.set_defaults(func=cmd_crawl)
    p=sub.add_parser('index'); p.set_defaults(func=cmd_index)
    p=sub.add_parser('search'); p.add_argument('query'); p.add_argument('--limit',type=int,default=10); p.add_argument('--family'); p.set_defaults(func=cmd_search)
    p=sub.add_parser('draft-note'); p.add_argument('query'); p.add_argument('--category',default='Concepts'); p.add_argument('--limit',type=int,default=10); p.add_argument('--family'); p.set_defaults(func=cmd_draft)
    p=sub.add_parser('promote-note'); p.add_argument('draft'); p.add_argument('--category'); p.add_argument('--title'); p.set_defaults(func=cmd_promote)
    p=sub.add_parser('export-game-index'); p.add_argument('--target', required=True); p.set_defaults(func=cmd_export_game_index)
    p=sub.add_parser('status'); p.set_defaults(func=cmd_status)
    args=ap.parse_args(); args.func(args)
if __name__=='__main__': main()
