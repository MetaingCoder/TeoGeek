from pathlib import Path
import json, re
from datetime import datetime, timezone
from email.utils import formatdate

ROOT=Path(__file__).resolve().parents[1]
POSTS=ROOT/"posts"

def fm(text):
    m=re.match(r"^---\s*\n(.*?)\n---\s*\n?",text,re.S)
    if not m:return {}
    d={}
    for line in m.group(1).splitlines():
        if ":" not in line:continue
        k,v=line.split(":",1);k=k.strip();v=v.strip()
        if v.startswith("[") and v.endswith("]"):
            try:v=json.loads(v.replace("'",'"'))
            except:v=[x.strip().strip('"\'') for x in v[1:-1].split(",") if x.strip()]
        d[k]=v
    return d

def xml(s):
    return str(s).replace("&","&amp;").replace("<","&lt;").replace(">","&gt;").replace('"',"&quot;").replace("'","&apos;")

items=[]
for p in POSTS.glob("*.md"):
    m=fm(p.read_text(encoding="utf-8"))
    if m.get("title"):
        tags=m.get("tags",[])
        if not isinstance(tags,list):tags=[str(tags)]
        items.append({"title":str(m["title"]),"date":str(m.get("date","")),"tags":tags,"description":str(m.get("description","")),"slug":p.stem,"path":"/posts/"+p.name})
items.sort(key=lambda x:x["date"],reverse=True)
(POSTS/"index.json").write_text(json.dumps(items,ensure_ascii=False,indent=2),encoding="utf-8")

SITE="https://example.com"
rss=[]
for x in items:
    try:dt=datetime.strptime(x["date"],"%Y-%m-%d").replace(tzinfo=timezone.utc);pub=formatdate(dt.timestamp(),usegmt=True)
    except:pub=formatdate(usegmt=True)
    rss.append(f'<item><title>{xml(x["title"])}</title><link>{SITE}/post.html?slug={x["slug"]}</link><guid>{SITE}/post.html?slug={x["slug"]}</guid><pubDate>{pub}</pubDate><description>{xml(x["description"])}</description></item>')
(ROOT/"rss.xml").write_text('<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>TeoGeek</title><link>'+SITE+'</link><description>记录开发与折腾，分享科技背后的思考与创造。</description>'+''.join(rss)+'</channel></rss>',encoding="utf-8")
print("Generated",len(items),"posts")
