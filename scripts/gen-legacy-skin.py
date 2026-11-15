"""Generate src/ui/legacy.css: remaps old Tailwind palette/radius/gradient/shadow classes
(still used by pre-v3 components) onto Flight Panel v3 tokens. Run: python scripts/gen-legacy-skin.py"""
import re, glob, colorsys
toks = set()
files = [f for f in glob.glob('src/**/*.tsx', recursive=True) if 'ui' not in re.split(r'[/\\]', f)]
TOK = re.compile(r'(?<![A-Za-z0-9_\-/\[\]#])((?:(?:[a-z0-9]+):)*)(bg|text|border(?:-[trblxy])?|ring|from|fill|stroke)-(slate|gray|zinc|neutral|stone|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|teal|emerald|green|lime|amber|yellow|orange|red|rose)-(\d{2,3})(?:/(\d{1,3}))?(?![A-Za-z0-9\-/\]])')
RAD = re.compile(r'(?<![A-Za-z0-9_\-/\[\]#:])rounded(?:-[trbl]{1,2})?-(?:md|lg|xl|2xl|3xl)(?![A-Za-z0-9\-])')
HEX = re.compile(r'(?<![A-Za-z0-9_\-/\[\]#])((?:[a-z0-9]+:)*)bg-\[#([0-9A-Fa-f]{6})\](?:/(\d{1,3}))?(?![A-Za-z0-9\-/\]])')
for f in files:
    s = open(f, encoding='utf8').read()
    for m in TOK.finditer(s): toks.add(m.group(0))
hexes = set()
for f in files:
    s = open(f, encoding='utf8').read()
    for m in HEX.finditer(s): hexes.add(m.group(0))
HUE = {}
for h in 'cyan sky blue indigo violet purple fuchsia pink teal'.split(): HUE[h]='accent'
for h in 'emerald green lime'.split(): HUE[h]='nominal'
for h in 'amber yellow orange'.split(): HUE[h]='caution'
for h in 'red rose'.split(): HUE[h]='critical'
for h in 'slate gray zinc neutral stone'.split(): HUE[h]='neutral'
def col(kind, hue, shade):
    g = HUE[hue]; n = int(shade)
    if kind == 'from' and g == 'neutral': kind = 'bg'
    if g != 'neutral' and n >= 800:
        # very dark saturated shades (backgrounds/borders of old tinted panels) -> quiet tint, never a solid signal fill
        if kind in ('bg', 'from'):
            sig = {'accent': 'var(--oc-accent)', 'nominal': 'var(--oc-bar-nominal)', 'caution': 'var(--oc-caution)', 'critical': 'var(--oc-critical)'}[g]
            return f'color-mix(in srgb, {sig} 12%, var(--oc-bg-panel))'
        if kind.startswith('border') or kind == 'ring':
            return 'var(--oc-line-strong)'
    if g=='accent': return 'var(--oc-accent)'
    if g=='caution': return 'var(--oc-caution)'
    if g=='critical': return 'var(--oc-critical)'
    if g=='nominal': return 'var(--oc-bar-nominal)'
    # neutral
    if kind=='bg':
        return 'var(--oc-bg-void)' if n>=950 else 'var(--oc-bg-panel)' if n>=900 else 'var(--oc-bg-raised)' if n>=800 else 'var(--oc-bg-raised-hover)' if n>=700 else 'var(--oc-line-strong)' if n>=600 else 'var(--oc-text-3)' if n>=400 else 'var(--oc-text-2)'
    if kind.startswith('border') or kind in('ring',):
        return 'var(--oc-line)' if n>=700 else 'var(--oc-line-strong)'
    if kind=='text' or kind in('fill','stroke'):
        return 'var(--oc-text-1)' if n<=200 else 'var(--oc-text-2)' if n<=400 else 'var(--oc-accent-ink)' if n>=800 else 'var(--oc-text-3)'
    return 'var(--oc-bg-raised)'
BP = {'sm':640,'md':768,'lg':1024,'xl':1280}
PS = {'hover':':hover','focus':':focus','active':':active','disabled':':disabled','focus-visible':':focus-visible'}
SKIP = {'group-hover','peer','data','aria','dark','print','placeholder','file','before','after','first','last','odd','even'}
def sel(variants):
    pseudo=''; bp=None
    for v in variants:
        if v in BP: bp=BP[v]
        elif v in PS: pseudo+=PS[v]
        else: return None
    return pseudo,bp
def mix(c, a):
    return c if a is None else f'color-mix(in srgb, {c} {a}%, transparent)'
out=[]
def emit(token, props, pseudo, bp):
    rule = f'[class~="{token}"]{pseudo}:not(.oc-doc, .oc-doc *){{{props}}}'
    out.append(f'@media (min-width:{bp}px){{{rule}}}' if bp else rule)
PROP={'bg':'background-color','text':'color','fill':'fill','stroke':'stroke','ring':'--tw-ring-color'}
for t in sorted(toks):
    m = TOK.fullmatch(t); pre,kind,hue,shade,alpha = m.groups()
    variants=[v for v in pre.split(':') if v]
    r = sel(variants)
    if r is None: continue
    pseudo,bp=r
    if kind=='from':
        c=mix(col('from',hue,shade), alpha)
        dark = int(shade) >= 800
        extra = '' if dark else ';color:var(--oc-accent-ink)' if HUE[hue]=='accent' else ';color:var(--oc-critical-ink)' if HUE[hue]=='critical' else ''
        emit(t, f'background-color:{c}{extra}', pseudo,bp); continue
    c=mix(col(kind,hue,shade), alpha)
    if kind.startswith('border'):
        side = kind[len('border'):]
        mp={'':'border-color','-t':'border-top-color','-b':'border-bottom-color','-l':'border-left-color','-r':'border-right-color','-x':'border-left-color:%s;border-right-color'%c,'-y':'border-top-color:%s;border-bottom-color'%c}
        emit(t, f'{mp[side]}:{c}', pseudo,bp)
    else:
        emit(t, f'{PROP[kind]}:{c}', pseudo,bp)
for h in sorted(hexes):
    m = HEX.fullmatch(h); pre,hx,alpha = m.groups()
    r,g,b=[int(hx[i:i+2],16)/255 for i in (0,2,4)]
    l=colorsys.rgb_to_hls(r,g,b)[1]
    if l>0.3: continue
    v=sel([x for x in pre.split(':') if x]); 
    if v is None: continue
    emit(h, f'background-color:{mix("var(--oc-bg-panel)", alpha)}', *v)
body = '\n'.join(out)
css = f'''/* GENERATED by scripts/gen-legacy-skin.py — do not edit by hand.
   Maps the pre-v3 Tailwind palette used by older components onto Flight Panel tokens
   (3 signal colours, 2/4px radii, no gradients/glows). .oc-doc = printable paper, left untouched. */
{body}

/* Shape: radii, gradients, glow, blur */
[class*="rounded-md"],[class*="rounded-lg"],[class*="rounded-xl"],[class*="rounded-2xl"],[class*="rounded-3xl"] {{ border-radius: var(--oc-radius-2, 4px); }}
[class~="rounded-full"][class*="px-"] {{ border-radius: var(--oc-radius-2, 4px); }}
[class*="bg-gradient-to-"]:not(.oc-doc, .oc-doc *) {{ background-image: none; }}
[class*="shadow-"]:not(.oc-doc, .oc-doc *):not([class*="shadow-oc"]) {{ box-shadow: none; }}
[class*="backdrop-blur"]:not(.oc-doc, .oc-doc *) {{ backdrop-filter: none; }}
[class*="drop-shadow"]:not(.oc-doc, .oc-doc *) {{ filter: none; }}
[class~="font-mono"]:not(.oc-doc, .oc-doc *) {{ font-family: var(--oc-font-data); }}
[class~="font-black"],[class~="font-extrabold"] {{ font-weight: 600; }}
input[type="range"]:not(.oc-range) {{ accent-color: var(--oc-accent); }}
'''
open('src/ui/legacy.css','w',encoding='utf8').write(css)
print(len(out),'rules')
