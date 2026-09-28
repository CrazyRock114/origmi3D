#!/bin/bash
# 用法: fetch-tut.sh <urls文件> <输出目录>
# 下载图片并用 PIL 拼成 2×2 的高清联系表，便于逐图分析折法
set -e
URLS_FILE="$1"
OUT="$2"
mkdir -p "$OUT"
i=1
while read -r url; do
  [ -z "$url" ] && continue
  curl -s -L -o "$OUT/img_$(printf %02d $i).png" -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" "$url"
  i=$((i+1))
done < "$URLS_FILE"

python3 - "$OUT" <<'EOF'
import sys, os, glob
from PIL import Image
out = sys.argv[1]
imgs = sorted(glob.glob(os.path.join(out, 'img_*.png')))
ok = []
for p in imgs:
    try:
        im = Image.open(p).convert('RGB')
        ok.append((p, im))
    except Exception as e:
        print('skip', p, e)
# 联系表：2×2
tile_w, tile_h = 900, 1200
per = 4
for s in range(0, len(ok), per):
    batch = ok[s:s+per]
    sheet = Image.new('RGB', (tile_w*2, tile_h*2), (40, 40, 40))
    for idx, (p, im) in enumerate(batch):
        im = im.resize((tile_w, tile_h))
        sheet.paste(im, ((idx % 2) * tile_w, (idx // 2) * tile_h))
    name = os.path.join(out, f'sheet_{s//per+1:02d}.png')
    sheet.save(name)
    print('sheet', name, len(batch))
print('total imgs:', len(ok))
EOF
