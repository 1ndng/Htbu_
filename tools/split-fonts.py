# 把字體依「常用程度」切成小檔，配合 @font-face 的 unicode-range，瀏覽器只會下載畫面上用到的那幾份
# 用法（在專案根目錄）：pip install fonttools && python3 tools/split-fonts.py .
#   產生 fonts/*.ttf 與 fonts.css；第一份（00）＝英數標點＋App 介面用到的字，接著是 Big5 常用字、次常用字、其他
#   換字體或改了很多介面文字後重跑一次即可（原始 .ttf 留在專案根目錄）
import sys,os,re,json
from fontTools.ttLib import TTFont
from fontTools import subset
OUT=sys.argv[1] if len(sys.argv)>1 else '.';SRC=OUT.rstrip('/')+'/';FLAV=sys.argv[2] if len(sys.argv)>2 else None
os.makedirs(OUT+'/fonts',exist_ok=True)
html=open(SRC+'index.html',encoding='utf-8').read()
ui=set(ord(c) for c in html if ord(c)>0x7F)
def big5(lo,hi):
    out=[]
    for b1 in range(lo>>8,(hi>>8)+1):
        for b2 in list(range(0x40,0x7F))+list(range(0xA1,0xFF)):
            code=(b1<<8)|b2
            if code<lo or code>hi:continue
            try:out.append(ord(bytes([b1,b2]).decode('big5')))
            except Exception:pass
    return out
L1=big5(0xA440,0xC67E);L2=big5(0xC940,0xF9D5)
BASIC=set(range(0x20,0x7F))|set(range(0xA0,0x100))|set(range(0x2000,0x2070))|set(range(0x3000,0x3040))|set(range(0xFF00,0xFFF0))|set(range(0x2190,0x2200))|set(range(0x25A0,0x2700))
def ranges(cps):
    cps=sorted(cps);out=[];i=0
    while i<len(cps):
        j=i
        while j+1<len(cps) and cps[j+1]==cps[j]+1:j+=1
        out.append(f'U+{cps[i]:X}' if i==j else f'U+{cps[i]:X}-{cps[j]:X}');i=j+1
    return ','.join(out)
FONTS=[('Cubic 11','Cubic_11.ttf','c'),('cwTeXMing','cwTeXMing.ttf','m')]
css=[];man={}
for fam,fn,key in FONTS:
    f=TTFont(SRC+fn,lazy=True);have=set(f.getBestCmap());f.close()
    core=sorted((BASIC|ui)&have);used=set(core)
    groups=[core]
    def chunk(lst,n):
        lst=[c for c in lst if c in have and c not in used];used.update(lst)
        return [sorted(lst[i:i+n]) for i in range(0,len(lst),n)]
    groups+=chunk(L1,600)+chunk(L2,1200)
    rest=sorted(have-used);groups+=[rest[i:i+2000] for i in range(0,len(rest),2000)]
    files=[]
    for gi,g in enumerate(groups):
        if not g:continue
        name=f'fonts/{key}{gi:02d}'+('.woff2' if FLAV=='woff2' else '.woff' if FLAV=='woff' else '.ttf')
        opt=subset.Options();opt.layout_features=['*'];opt.notdef_outline=True;opt.name_IDs=['*'];opt.glyph_names=False;opt.hinting=True;opt.flavor=FLAV
        opt.drop_tables+=['DSIG']
        ft=TTFont(SRC+fn);s=subset.Subsetter(opt);s.populate(unicodes=g);s.subset(ft);subset.save_font(ft,OUT+'/'+name,opt)
        css.append(f'@font-face{{font-family:"{fam}";src:url("./{name}") format("{FLAV or "truetype"}");font-weight:400;font-style:normal;font-display:swap;unicode-range:{ranges(g)}}}')
        files.append((name,len(g),os.path.getsize(OUT+'/'+name)))
    man[fam]=files
    print(fam,len(files),'chunks, core',files[0][2]//1024,'KB, total',sum(x[2] for x in files)//1024,'KB')
open(OUT+'/fonts.css','w').write('\n'.join(css)+'\n')
print('css KB',len('\n'.join(css))//1024)
