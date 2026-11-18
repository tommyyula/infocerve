#!/usr/bin/env python3
"""Infocerve 商业计划 v2 构建脚本。

用法：python3 build_v2.py --audience investor|internal [--src content_v2.html] [--out 输出.html] [--check]
两个版本共用 content_v2.html；章节用 aud=both|internal|investor 区分，节内用 <!--@only 版本--> … <!--@end-->。
财务数字只在下面的 FIN 里，逐格照抄交接单 handoff-v2.md 第 5 节（v4.3 原稿），不要重算。
输出按 Artifact 的页面约定：没有 doctype/html/head/body，只有 title、style 和正文。
"""
import argparse, re, sys, os

HERE = os.path.dirname(os.path.abspath(__file__))
YEARS = ["Y1 · 2027", "Y2 · 2028", "Y3 · 2029", "Y4 · 2030", "Y5 · 2031"]

# ---- 财务数字：交接单第 5 节，逐格照抄（字符串，原样显示） ----
FIN = [
    ("客户数（期末）",              ["22", "60", "130", "230", "370"]),
    ("混合 ACV（$K）",              ["260", "290", "330", "370", "410"]),
    ("期末 ARR（$M）",              ["5.7", "17.4", "42.9", "85.1", "151.7"]),
    ("ARR 同比增速",                ["—", "204%", "147%", "98%", "78%"]),
    ("确认收入（$M，ARR 均值法）",  ["2.9", "11.6", "30.2", "64.0", "118.4"]),
    ("毛利率",                      ["62%", "66%", "70%", "73%", "76%"]),
    ("毛利（$M）",                  ["1.8", "7.6", "21.1", "46.7", "90.0"]),
    ("研发（$M）",                  ["10.0", "13.5", "17.5", "22.0", "26.5"]),
    ("销售与市场（$M）",            ["6.5", "13.0", "20.5", "28.0", "36.5"]),
    ("管理与行政（$M）",            ["3.5", "5.0", "7.0", "9.0", "11.0"]),
    ("运营费用合计（$M）",          ["20.0", "31.5", "45.0", "59.0", "74.0"]),
    ("EBITDA（$M）",                ["-18.2", "-23.9", "-23.9", "-12.3", "+16.0"]),
    ("EBITDA 率",                   ["—", "—", "-79%", "-19%", "+14%"]),
    ("员工数",                      ["78", "120", "180", "245", "310"]),
    ("累计消耗（$M）",              ["-18.2", "-42.1", "-66.0", "-78.3", "-62.3"]),
    ("期末现金（$M）",              ["16.8", "52.9", "29.0", "16.7", "32.7"]),
]
F = dict(FIN)
STRONG = {"期末 ARR（$M）", "确认收入（$M，ARR 均值法）", "EBITDA（$M）", "期末现金（$M）"}

def cell(v):
    """显示用：ASCII 减号换成排版减号，正负数着色。数值本身不动。"""
    if v.startswith("-"):
        return f'<span class="neg">−{v[1:]}</span>'
    if v.startswith("+"):
        return f'<span class="pos">{v}</span>'
    return v

def table(tid, head, labels, relabel=None):
    relabel = relabel or {}
    ths = "".join(f'<th scope="col">{h}</th>' for h in [head] + YEARS)
    rows = ""
    for lb in labels:
        cls = ' class="strong"' if lb in STRONG else ""
        tds = "".join(f"<td>{cell(v)}</td>" for v in F[lb])
        rows += f'<tr{cls} data-row="{lb}"><th scope="row">{relabel.get(lb, lb)}</th>{tds}</tr>'
    return f'<div class="tw"><table class="num" id="{tid}"><thead><tr>{ths}</tr></thead><tbody>{rows}</tbody></table></div>'

def bars():
    arr = [float(x) for x in F["期末 ARR（$M）"]]
    mx = max(arr)
    return "".join(
        f'<div class="bar"><div class="val">{F["期末 ARR（$M）"][i]}</div>'
        f'<div class="stack" style="height:{arr[i] / mx * 180:.0f}px"></div>'
        f'<div class="yr">{YEARS[i]}</div></div>' for i in range(5))

def tables():
    return {
        "T_ENGINE": table("t-engine", "收入引擎", ["客户数（期末）", "混合 ACV（$K）", "期末 ARR（$M）", "ARR 同比增速"]),
        "T_PNL": table("t-pnl", "损益", ["确认收入（$M，ARR 均值法）", "毛利率", "毛利（$M）", "研发（$M）", "销售与市场（$M）",
                                        "管理与行政（$M）", "运营费用合计（$M）", "EBITDA（$M）", "EBITDA 率", "员工数"]),
        "T_CASH": table("t-cash", "现金", ["EBITDA（$M）", "累计消耗（$M）", "期末现金（$M）"],
                        {"EBITDA（$M）": "当年 EBITDA（$M）",
                         "期末现金（$M）": "期末现金（$M，种子 $18M + A $17M + B $60M）"}),
        "BARS": bars(),
    }

# ---- 两个版本各自的封面、页脚、标题 ----
META = {
    "investor": dict(
        title="Infocerve 商业计划 投资人版",
        cover="""
<header class="cover">
  <div class="docline"><span>商业计划</span><span>2026 年 11 月</span></div>
  <h1>Infocerve<br>给每一家公司配一支 AI 员工团队</h1>
  <p class="lede">一套已经在生产环境里干活的 AI 员工：接待客户、处理后台杂事、记住公司的做事方法。在我们熟悉的行业，直接交付开箱即用的整套方案；在其他行业，提供平台，和企业共建。</p>
  <dl class="facts">
    <div><dt>三轮融资合计</dt><dd>$95M</dd></div>
    <div><dt>第 5 年期末 ARR</dt><dd>$151.7M</dd></div>
    <div><dt>第 5 年毛利率</dt><dd>76%</dd></div>
    <div><dt>单月 EBITDA 打平</dt><dd>第 4 年 Q4</dd></div>
  </dl>
  <div class="chips">
    <span class="chip ok">物流与供应链 · 已在生产环境运行</span><span class="chip">客服中心 · 早期客户运行中</span>
    <span class="chip">餐饮</span><span class="chip">物业管理</span><span class="chip">专业服务</span><span class="chip">零售电商</span><span class="chip">制造</span>
  </div>
</header>""",
        footer="Infocerve · 商业计划 · 2026 年 11 月 · 文中财务数字为预测，基于所列假设",
    ),
    "internal": dict(
        title="Infocerve 商业计划 内部讨论版",
        cover="""
<div class="banner">内部讨论版 · 含内部产品名、人名和未定事项 · 请勿外传</div>
<header class="cover">
  <span class="draft">v2.1 · 2026-11-18 · 供内部讨论</span>
  <h1>Infocerve 商业计划<br>内部讨论版</h1>
  <p class="lede">和投资人版用同一份内容生成。多出三节：公司架构、产品方向、待确认与决策记录。正文里带“讨论中”“建议，未定”“待确认”标注的地方都还没定。</p>
  <div class="chips">
    <span class="chip st-chip ok">已定：两条腿、母公司结构、三轮融资、数字口径、成熟度</span>
    <span class="chip st-chip">讨论中：五个产品组和负责人、客户订单换股的做法</span>
    <span class="chip st-chip warn">待确认：见最后一节</span>
  </div>
</header>""",
        footer="Infocerve · 商业计划 v2.1 内部讨论版 · 2026-11-18 · 财务数字照 v4.3 原稿 · 仅供内部讨论",
    ),
}

CSS = r"""
/* Layout idea: a long plan read top to bottom. One reading column, section numbers in mono, figures in mono.
   The investor edition is the plain document; the internal edition adds a sunrise banner and status pills. */
:root{
  --paper:#F6F8FB; --surface:#FFFFFF; --ink:#14213D; --slate:#5B6478; --line:#DCE2EC;
  --cobalt:#2B4BFF; --cobalt-soft:#E9EDFF; --mint:#0B8474; --mint-soft:#E2F6F3; --sunrise:#A8650C; --sunrise-soft:#FFF1DD;
  --display:"IBM Plex Sans","Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif;
  --body:"IBM Plex Sans","Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif;
  --mono:"IBM Plex Mono",ui-monospace,Menlo,monospace;
}
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){
    --paper:#0D1426; --surface:#141D36; --ink:#EEF2FA; --slate:#A3ADC2; --line:#2A3555;
    --cobalt:#8EA2FF; --cobalt-soft:#1D2A5C; --mint:#4FD3C1; --mint-soft:#11352F; --sunrise:#FFB45C; --sunrise-soft:#3A2A12;
    color-scheme:dark;
  }
}
:root[data-theme="dark"]{
  --paper:#0D1426; --surface:#141D36; --ink:#EEF2FA; --slate:#A3ADC2; --line:#2A3555;
  --cobalt:#8EA2FF; --cobalt-soft:#1D2A5C; --mint:#4FD3C1; --mint-soft:#11352F; --sunrise:#FFB45C; --sunrise-soft:#3A2A12;
  color-scheme:dark;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
@media (prefers-reduced-motion: reduce){html{scroll-behavior:auto}}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--body);font-size:16px;line-height:1.75}
a{color:var(--cobalt)}
a:focus-visible{outline:2px solid var(--cobalt);outline-offset:2px}
.wrap{max-width:1040px;margin:0 auto;padding-left:max(20px, env(safe-area-inset-left, 0px));padding-right:max(20px, env(safe-area-inset-right, 0px))}
.banner{background:var(--sunrise-soft);color:var(--sunrise);font-family:var(--mono);font-size:12.5px;letter-spacing:.04em;padding:10px 16px;border-radius:0 0 8px 8px;border:1px solid var(--sunrise);border-top:0}
header.cover{padding-block:52px 36px;border-bottom:1px solid var(--line)}
.docline{display:flex;gap:18px;font-family:var(--mono);font-size:12px;letter-spacing:.14em;color:var(--cobalt)}
.draft{display:inline-flex;font-family:var(--mono);font-size:12px;letter-spacing:.06em;color:var(--sunrise);background:var(--sunrise-soft);padding:5px 12px;border-radius:999px}
h1{font-family:var(--display);font-weight:700;font-size:clamp(30px,5vw,48px);line-height:1.2;margin:22px 0 14px;text-wrap:balance}
.lede{font-size:18px;color:var(--slate);max-width:40em;margin:0}
.facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:0;margin:28px 0 0;border-top:1px solid var(--ink);border-bottom:1px solid var(--line)}
.facts div{padding:14px 16px 14px 0}
.facts dt{font-size:13px;color:var(--slate)}
.facts dd{margin:2px 0 0;font-family:var(--mono);font-weight:500;font-size:24px;font-variant-numeric:tabular-nums}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:24px}
.chip{font-size:13px;border:1px solid var(--line);background:var(--surface);border-radius:999px;padding:4px 12px;color:var(--slate)}
.chip.ok{border-color:var(--mint);color:var(--mint);background:var(--mint-soft)}
.chip.warn{border-color:var(--sunrise);color:var(--sunrise);background:var(--sunrise-soft)}
nav.toc{display:flex;flex-wrap:wrap;gap:6px 16px;padding-block:18px;border-bottom:1px solid var(--line);font-size:13.5px}
nav.toc a{text-decoration:none;color:var(--slate)}
nav.toc a:hover{color:var(--cobalt)}
nav.toc b{font-family:var(--mono);font-weight:500;color:var(--cobalt);margin-right:4px}
nav.toc a.int b{color:var(--sunrise)}
section{padding-block:48px;border-bottom:1px solid var(--line)}
.eyebrow{font-family:var(--mono);font-size:12px;letter-spacing:.14em;color:var(--cobalt);margin-bottom:10px}
section.int .eyebrow{color:var(--sunrise)}
h2{font-family:var(--display);font-weight:700;font-size:clamp(22px,3.2vw,30px);line-height:1.3;margin:0 0 14px;text-wrap:balance;max-width:26em}
h3{font-family:var(--display);font-weight:600;font-size:16px;margin:0 0 6px;line-height:1.4}
h3.sub{font-size:18px;margin:34px 0 10px}
p{margin:0 0 14px;max-width:44em}
.muted{color:var(--slate)}
.grid{display:grid;gap:14px;margin:22px 0}
.grid > *{min-width:0}
.g2{grid-template-columns:repeat(auto-fit,minmax(min(280px,100%),1fr))}
.g3{grid-template-columns:repeat(auto-fit,minmax(min(230px,100%),1fr))}
.g4{grid-template-columns:repeat(auto-fit,minmax(min(190px,100%),1fr))}
.card{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:18px}
.card p{font-size:14px;color:var(--slate);margin:0;line-height:1.65;overflow-wrap:anywhere}
.card p + p{margin-top:8px}
.card.leg{border-color:var(--cobalt)}
.card.leg h3{font-size:18px}
.kpi .v{font-family:var(--mono);font-weight:500;font-size:26px;line-height:1.15;color:var(--cobalt);font-variant-numeric:tabular-nums}
.kpi .s{font-family:var(--mono);font-size:11.5px;color:var(--slate);margin:6px 0}
.card.round .kpi{margin-bottom:10px}
.tag{display:inline-block;font-family:var(--mono);font-size:11px;padding:2px 8px;border-radius:4px;background:var(--cobalt-soft);color:var(--cobalt);margin-bottom:8px}
.tag.live{background:var(--mint-soft);color:var(--mint)}
.tag.plan{background:var(--sunrise-soft);color:var(--sunrise)}
.st{display:inline-block;font-family:var(--mono);font-size:11.5px;font-weight:400;padding:2px 9px;border-radius:999px;border:1px solid var(--line);color:var(--slate);background:var(--surface);vertical-align:2px;margin-left:6px}
p > .st:first-child{margin-left:0;margin-right:6px}
.st.ok{border-color:var(--mint);color:var(--mint);background:var(--mint-soft)}
.st.warn{border-color:var(--sunrise);color:var(--sunrise);background:var(--sunrise-soft)}
.note{border-left:3px solid var(--cobalt);background:var(--cobalt-soft);padding:14px 18px;border-radius:0 8px 8px 0;margin:22px 0;max-width:52em;font-size:15px}
.note.warn{border-color:var(--sunrise);background:var(--sunrise-soft)}
.note b{color:var(--cobalt)} .note.warn b{color:var(--sunrise)}
.src{font-family:var(--mono);font-size:11.5px;color:var(--slate);line-height:1.6;margin-top:16px;max-width:none}
.tw{overflow-x:auto;margin:20px 0}
table{border-collapse:collapse;width:100%;min-width:620px;font-size:14px}
th,td{padding:9px 12px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}
thead th{font-family:var(--mono);font-weight:500;font-size:11.5px;letter-spacing:.06em;color:var(--cobalt);border-bottom:1px solid var(--cobalt)}
tbody th{font-weight:600}
table.num td,table.num thead th:not(:first-child){text-align:right;font-family:var(--mono);font-variant-numeric:tabular-nums;white-space:nowrap}
tr.strong{background:var(--cobalt-soft)}
.pos{color:var(--mint)} .neg{color:var(--sunrise)}
.chart{display:flex;align-items:flex-end;gap:18px;height:250px;padding:10px 4px 0;max-width:640px}
.bar{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;min-width:0}
.bar .val{font-family:var(--mono);font-size:12px;margin-bottom:4px}
.bar .stack{width:62%;background:var(--cobalt);border-radius:4px 4px 0 0;min-height:3px}
.bar .yr{font-family:var(--mono);font-size:11px;color:var(--slate);margin-top:6px;white-space:nowrap}
.legend{display:flex;gap:18px;font-size:13px;color:var(--slate);margin-top:10px;flex-wrap:wrap}
.legend i{display:inline-block;width:12px;height:12px;border-radius:2px;margin-right:6px;vertical-align:-1px;background:var(--cobalt)}
.org{margin:24px 0 10px;display:grid;gap:0}
.org-top{justify-self:center;background:var(--ink);color:var(--paper);border-radius:10px;padding:14px 26px;text-align:center}
.org-top p,.org-subs p{margin:0;font-size:13.5px}
.org-top p{opacity:.85}
.org::after{content:"";order:1;justify-self:center;width:1px;height:22px;background:var(--slate)}
.org-top{order:0}
.org-subs{order:2;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(230px,100%),1fr));gap:14px;border-top:1px solid var(--slate);padding-top:18px}
.org-subs > div{background:var(--surface);border:1px dashed var(--sunrise);border-radius:10px;padding:14px 16px;min-width:0}
.org-subs p{color:var(--slate);font-family:var(--mono);font-size:12.5px;overflow-wrap:anywhere}
ol.todo{padding-left:22px;max-width:50em} ol.todo li{margin-bottom:10px}
td,th{overflow-wrap:anywhere}
footer{padding-block:28px 60px;font-family:var(--mono);font-size:12px;color:var(--slate)}
"""

SEC_RE = re.compile(r"<!--@section\s+(.*?)-->")
ONLY_RE = re.compile(r"<!--@only (\w+)-->(.*?)<!--@end-->", re.S)

def parse(src):
    parts = SEC_RE.split(src)[1:]  # [attrs, body, attrs, body, …]
    out = []
    for attrs, body in zip(parts[0::2], parts[1::2]):
        a = dict(kv.split("=", 1) for kv in attrs.split())
        a["body"] = body
        out.append(a)
    return out

def build(aud, src_path):
    src = open(src_path, encoding="utf-8").read()
    secs = [s for s in parse(src) if s["aud"] in ("both", aud)]
    num = {s["id"]: f"{i + 1:02d}" for i, s in enumerate(secs)}
    T = tables()
    toc, body = "", ""
    for s in secs:
        b = ONLY_RE.sub(lambda m: m.group(2) if m.group(1) == aud else "", s["body"])
        b = b.replace("{{N}}", num[s["id"]])
        for k, v in T.items():
            b = b.replace("{{" + k + "}}", v)
        b = re.sub(r"\{\{REF_([\w-]+)\}\}", lambda m: num[m.group(1)], b)
        cls = ' class="int"' if s["aud"] == "internal" else ""
        toc += f'<a href="#{s["id"]}"{cls}><b>{num[s["id"]]}</b>{s["nav"]}</a>'
        body += f'<section id="{s["id"]}"{cls}>{b.rstrip()}\n</section>\n'
    m = META[aud]
    html = (
        f'<title>{m["title"]}</title>\n'
        '<meta name="claude:viewport-fit-sides" content="cover">\n'
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;700&display=swap">\n'
        f"<style>{CSS}</style>\n"
        f'<div class="wrap {aud}">\n{m["cover"]}\n'
        f'<nav class="toc" aria-label="目录">{toc}</nav>\n{body}'
        f'<footer>{m["footer"]}</footer>\n</div>\n'
    )
    assert "{{" not in html and "<!--@" not in html, "有未替换的占位符或标记"
    return html

# ---- 发布前检查 ----
NAMES = ["Xiang", "Hui", "Quinn", "Andy", "Eason", "lingge", "Eric", "Torin", "Taylor", "Weichi", "Bruce", "Tom", "Lixin"]
INTERNAL_PRODUCTS = ["OMS", "PIM", "AIOP", "MKP", "WMS", "WCS", "WES", "YMS", "Ontology", "AgentFactory", "Agent Factory",
                     "ObjectDatabase", "FDE", "VideoStudio", "Genesys", "v4.3", "github", "首稿", "待定"]

def check(aud, html):
    problems = []
    # 1) 财务表逐格对照 FIN
    for lb, vals in FIN:
        rows = re.findall(r'<tr[^>]*data-row="' + re.escape(lb) + r'">(.*?)</tr>', html)
        if not rows:
            problems.append(f"财务表缺行：{lb}")
        for r in rows:
            got = [re.sub(r"<[^>]+>", "", c).replace("−", "-") for c in re.findall(r"<td>(.*?)</td>", r)]
            if got != vals:
                problems.append(f"财务表不一致：{lb} {got} != {vals}")
    # 2) 投资人版禁用词
    if aud == "investor":
        text = html.replace(CSS, "")
        for pat in [r"ITEM", r"Item[A-Z]"] + [r"\b" + n + r"\b" for n in NAMES] + [re.escape(p) for p in INTERNAL_PRODUCTS]:
            hits = re.findall(pat, text)
            if hits:
                problems.append(f"投资人版出现禁用内容：{pat} × {len(hits)}")
        n = text.count("待确认")
        if n != 1:
            problems.append(f"投资人版“待确认”出现 {n} 次，应只有资金拆分一处")
    return problems

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--audience", required=True, choices=["investor", "internal"])
    ap.add_argument("--src", default=os.path.join(HERE, "content_v2.html"))
    ap.add_argument("--out")
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    html = build(a.audience, a.src)
    out = a.out or os.path.join(HERE, f"{a.audience}.html")
    open(out, "w", encoding="utf-8").write(html)
    print(out, len(html))
    if a.check:
        ps = check(a.audience, html)
        print("检查：", "通过" if not ps else "\n".join(ps))
        sys.exit(1 if ps else 0)
