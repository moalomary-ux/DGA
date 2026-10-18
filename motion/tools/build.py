#!/usr/bin/env python3
"""Assemble the page. Reads ../audio/out/anchors.json and ../audio/out/mix.m4a when they exist.
   out/page.html      -> the interactive player (published as the Artifact; audio embedded when --embed-audio)
   build/render.html  -> the same page without web fonts, used to render video frames locally"""
import base64, json, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(ROOT, "src/index.html"), encoding="utf-8").read()
hero = base64.b64encode(open(os.path.join(ROOT, "src/hero.jpg"), "rb").read()).decode()
emblem = open(os.path.join(ROOT, "src/emblem.js"), encoding="utf-8").read().replace("if(typeof module!=='undefined')module.exports=EM2;", "")
anchors_path = os.path.join(ROOT, "audio/out/anchors.json")
mix_path = os.path.join(ROOT, "audio/out/mix.m4a")
audio_js = ""
if os.path.exists(anchors_path):
    a = json.load(open(anchors_path))
    audio_js += f"window.__ANCHORS={json.dumps(a['anchors'])};window.__DURATION={a['duration']};"
    print("anchors:", len(a["anchors"]), "duration:", a["duration"])
page = src.replace("__HERO__", "data:image/jpeg;base64," + hero).replace("/*__EM2__*/", emblem)
os.makedirs(os.path.join(ROOT, "out"), exist_ok=True); os.makedirs(os.path.join(ROOT, "build"), exist_ok=True)
embed = "--embed-audio" in sys.argv and os.path.exists(mix_path)
art_js = audio_js
if embed:
    art_js += "window.__AUDIO='data:audio/mp4;base64," + base64.b64encode(open(mix_path, "rb").read()).decode() + "';"
open(os.path.join(ROOT, "out/page.html"), "w", encoding="utf-8").write(page.replace("/*__AUDIO__*/", art_js))
r = re.sub(r'<link[^>]*fonts\.(googleapis|gstatic)\.com[^>]*>\n?', "", page.replace("/*__AUDIO__*/", audio_js))
r = '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' + r
open(os.path.join(ROOT, "build/render.html"), "w", encoding="utf-8").write(r)
print("page.html", os.path.getsize(os.path.join(ROOT, "out/page.html")) // 1024, "KB", "(audio embedded)" if embed else "")
