"""Optional: run `npm install` first, then `python3 build-preview.py`. Builds preview.html: bundles the real src/ files (react-router-dom aliased to a hash router) with esbuild, inlines React, so no CDN React/Babel is needed."""
import subprocess,re,os
G=os.environ.get('NODE_GLOBAL','')
js=subprocess.run(['node_modules/.bin/esbuild','preview/entry.jsx','--bundle','--minify','--format=iife','--jsx=automatic','--target=es2019','--define:process.env.NODE_ENV="production"','--define:import.meta.env={}','--alias:react-router-dom=./preview/router.jsx','--alias:@supabase/supabase-js=./preview/supabase-stub.js'],capture_output=True,text=True,check=True).stdout.replace('</script','<\\/script')
css=open('src/index.css').read().replace('@tailwind base;@tailwind components;@tailwind utilities;','')
cfg="tailwind.config={theme:{extend:{colors:{cream:{50:'#fffdf7',100:'#faf5e8',200:'#f2e9d0'},sage:{50:'#f1f5ee',100:'#dfe9d8',300:'#a9c19c',500:'#6f9262',600:'#587a4c',700:'#46613d',900:'#26361f'}},fontFamily:{display:['Georgia','serif']}}}}"
open('preview.html','w').write(f'''<!doctype html><html lang="en"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/><title>PawConnect – Find your forever friend</title>
<script src="https://cdn.tailwindcss.com/3.4.17"></script><script>{cfg}</script>
<style>:root{{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}}html{{scroll-padding-top:env(safe-area-inset-top,0px)}}body{{margin:0;background:#fffdf7;color:#26361f;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}}</style>
<style type="text/tailwindcss">{css}</style></head>
<body><div id="root"></div><script>{js}</script></body></html>''')
print(os.path.getsize('preview.html'))
