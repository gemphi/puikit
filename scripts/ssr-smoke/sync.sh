#!/bin/bash
set -e
cd ~/ssr
rm -rf pui/src app/src book/src phlick/src work/pui/src work/app/src work/book/src work/phlick/src work/out
mkdir -p pui app book phlick
(cd pui && tar xzf /mnt/user-data/uploads/puijs/_stage/pui_src.tgz)
(cd app && tar xzf /mnt/user-data/uploads/puijs/_stage/chanel_src.tgz)
(cd book && tar xzf /mnt/user-data/uploads/puijs/_stage/book_src.tgz)
(cd phlick && tar xzf /mnt/user-data/uploads/puijs/_stage/phlick_src.tgz)
cp -r pui/src work/pui/src && cp -r app/src work/app/src && cp -r book/src work/book/src && cp -r phlick/src work/phlick/src
find work/pui work/app work/book work/phlick -name "*.test.ts*" -delete
find work/pui work/app work/book work/phlick -name "*.stories.tsx" -delete
python3 - <<'PY'
import io, os, re
for root in ['work/pui/src','work/app/src','work/book/src','work/phlick/src']:
    for dp,dns,fns in os.walk(root):
        for fn in fns:
            if not fn.endswith(('.ts','.tsx')): continue
            p=os.path.join(dp,fn); s=o=io.open(p,encoding='utf-8').read()
            def repl(m):
                names=[x.strip() for x in m.group(1).split(',') if x.strip()]
                types=[x[5:].strip() for x in names if x.startswith('type ')]
                values=[x for x in names if not x.startswith('type ')]
                out=[]
                if types: out.append("import type { %s } from 'lucide-react';" % ', '.join(types))
                if values:
                    out.append("import __icons from 'lucide-react';")
                    out.append("const { %s } = __icons as any;" % ', '.join(values))
                return '\n'.join(out)
            s=re.sub(r"^import \{([^}]*)\} from 'lucide-react';", repl, s, flags=re.M)
            if s!=o: io.open(p,'w',encoding='utf-8',newline='\n').write(s)
PY
npx tsc -p work/tsconfig.json > /dev/null 2>&1 || true
node build-css.js 2>&1 | grep -v "WARNING\|^$" | tail -2
