#!/usr/bin/env python3
"""
Voice-over + score + sound effects for the "بالغوا بالدفاع عن وطنكم" motion graphic, built with ElevenLabs.

What it does
  1. Picks the newest Arabic-capable TTS model on the account (eleven_v4 first) and an Arabic voice.
  2. Speaks each line with character-level timestamps, so every spoken word has an exact time.
  3. Places the lines on a timeline and writes out/anchors.json: pairs [audio second, design second]
     that make the animation hit its beats on the spoken words (the page warps its own clock with them).
  4. Composes the score section by section so its changes land on the scene changes, then adds sound effects.
  5. Mixes voice (ducking the music under it), music and effects into out/mix.m4a.

Usage (key stays in the environment, never in chat or files):
  export ELEVENLABS_API_KEY=...            # from the environment's secrets
  python3 make_audio.py --list-voices      # shows Arabic voices on the account
  python3 make_audio.py --voice-id <id>    # generate everything
  python3 make_audio.py --mock             # offline dry run with synthetic audio, to test the plumbing
Useful flags: --takes 3 --auto-pick, --pick L3=2, --tags (prefix audio tags, for models that support them),
              --plain (no diacritics), --no-closing, --only vo|music|sfx|mix, --force
"""
import argparse, base64, json, math, os, shutil, subprocess, sys, urllib.error, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "out")
API = "https://api.elevenlabs.io"


# ----------------------------------------------------------------------------- http
def key():
    k = os.environ.get("ELEVENLABS_API_KEY")
    if not k:
        sys.exit("ELEVENLABS_API_KEY is not set. Add it as an environment secret (see ../README.md).")
    return k


def http(method, path, body=None, query=None, binary=False, timeout=300):
    url = API + path + ("?" + urllib.parse.urlencode(query, doseq=True) if query else "")
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method,
                                 headers={"xi-api-key": key(), "Content-Type": "application/json", "Accept": "*/*"})
    for attempt in range(6):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                raw = r.read()
                return raw if binary else json.loads(raw.decode() or "{}")
        except urllib.error.HTTPError as e:
            msg = e.read().decode(errors="replace")[:1200]
            if e.code in (409, 429) and attempt < 5:  # busy: too many requests at once
                import time; time.sleep(2 + 3 * attempt); continue
            raise RuntimeError(f"{method} {path} -> HTTP {e.code}: {msg}")


def sh(cmd, **kw):
    r = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if r.returncode:
        sys.exit("command failed: " + " ".join(cmd[:6]) + " ...\n" + r.stderr[-1500:])
    return r.stdout


def dur_of(path):
    return float(sh(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", path]).strip())


# ----------------------------------------------------------------------------- models and voices
def pick_model(pref, forced=None):
    if forced:
        return forced
    models = http("GET", "/v1/models")
    tts = [m for m in models if m.get("can_do_text_to_speech")]
    ids = [m["model_id"] for m in tts]
    print("TTS models on this account:", ", ".join(ids))
    for p in pref:
        if p in ids:
            return p
    arabic = [m["model_id"] for m in tts if any(l.get("language_id") == "ar" for l in m.get("languages", []))]
    if not arabic:
        sys.exit("No Arabic-capable TTS model found on this account.")
    return arabic[0]


def list_voices(limit=40):
    out, token = [], None
    for _ in range(5):
        q = {"page_size": 100, "language": "ar", "include_total_count": "false"}
        if token:
            q["next_page_token"] = token
        d = http("GET", "/v2/voices", query=q)
        out += d.get("voices", [])
        token = d.get("next_page_token")
        if not d.get("has_more"):
            break
    if not out:  # fall back to a text search
        d = http("GET", "/v2/voices", query={"search": "arabic", "page_size": 100})
        out = d.get("voices", [])
    return out[:limit]


def show_voices(voices):
    for v in voices:
        lb = v.get("labels", {})
        print(f"  {v['voice_id']}  {v.get('name','?'):<26} {lb.get('gender','')}/{lb.get('age','')}/{lb.get('accent','')}  {lb.get('descriptive','')}  {lb.get('use_case','')}")


def choose_voice(voices):
    def score(v):
        lb = {k: str(x).lower() for k, x in v.get("labels", {}).items()}
        s = 0
        s += 3 if lb.get("gender") == "male" else 0
        s += 2 if any(w in lb.get("descriptive", "") + lb.get("use_case", "") for w in ("deep", "narrat", "authorit", "calm", "documentary", "epic")) else 0
        s += 2 if any(w in lb.get("accent", "") for w in ("saudi", "gulf", "arab", "standard")) else 0
        return s
    return max(voices, key=score) if voices else None


# ----------------------------------------------------------------------------- speech
def words_from_alignment(al):
    ch, t0, t1 = al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]
    words, cur, tag = [], None, False
    for c, a, b in zip(ch, t0, t1):
        if c == "[":  # audio tags such as [proud] direct the delivery and are not spoken
            tag = True
        if tag:
            tag = c != "]"
            continue
        if c.isspace():
            if cur:
                words.append(cur); cur = None
            continue
        if cur is None:
            cur = {"text": c, "t0": a, "t1": b}
        else:
            cur["text"] += c; cur["t1"] = b
    if cur:
        words.append(cur)
    return words


def speak(line, prev_text, next_text, voice_id, model, settings, take, args):
    base = os.path.join(OUT, "vo", f"{line['id']}_t{take}")
    if os.path.exists(base + ".mp3") and os.path.exists(base + ".json") and not args.force:
        return json.load(open(base + ".json")), base + ".mp3"
    text = line["plain"] if args.plain or line.get("use_plain") else line["text"]
    if args.tags:
        text = line["tags"] + " " + text
    body = {"text": text, "model_id": model, "voice_settings": settings, "seed": 1000 * take + int(line["id"][1:]),
            "language_code": "ar", "apply_text_normalization": "auto"}
    prev_text = prev_text or line.get("lead_in")  # unspoken context, so the first line is not rushed
    if prev_text: body["previous_text"] = prev_text
    if next_text: body["next_text"] = next_text
    last = None
    for fmt in ("mp3_44100_192", "mp3_44100_128"):
        try:
            d = http("POST", f"/v1/text-to-speech/{voice_id}/with-timestamps", body=body, query={"output_format": fmt})
            break
        except RuntimeError as e:
            last = e
            if "language_code" in str(e):
                body.pop("language_code", None)
    else:
        raise last
    os.makedirs(os.path.dirname(base), exist_ok=True)
    open(base + ".mp3", "wb").write(base64.b64decode(d["audio_base64"]))
    al = d.get("alignment") or d.get("normalized_alignment")
    meta = {"text": text, "words": words_from_alignment(al), "alignment": al}
    json.dump(meta, open(base + ".json", "w"), ensure_ascii=False, indent=1)
    return meta, base + ".mp3"


def manual_speak(line, take):
    """Use a voice-over file recorded in the ElevenLabs web app (out/vo/L1_t1.mp3 ...). Word times are estimated
    from the speech span (silence trimmed) in proportion to each word's letters."""
    import re
    base = os.path.join(OUT, "vo", f"{line['id']}_t{take}")
    path = base + ".mp3"
    if not os.path.exists(path):
        for ext in (".wav", ".m4a", ".ogg"):
            if os.path.exists(base + ext):
                path = base + ext; break
        else:
            sys.exit(f"--manual: put the recording for {line['id']} at {base}.mp3")
    total = dur_of(path)
    r = subprocess.run(["ffmpeg", "-i", path, "-af", "silencedetect=noise=-38dB:d=0.15", "-f", "null", "-"], capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", r)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", r)]
    t0 = ends[0] if ends and starts and starts[0] < 0.05 else 0.0
    t1 = starts[-1] if starts and (not ends or starts[-1] > (ends[-1] if ends else 0)) and starts[-1] > total * 0.5 else total
    words = line["plain"].split()
    weights = [max(1, len(re.sub(r"[^\u0621-\u064A]", "", w))) + (2 if re.search(r"[…،:.!]", w) else 0) for w in words]
    cur, out = t0, []
    for w, k in zip(words, weights):
        span = (t1 - t0) * k / sum(weights)
        out.append({"text": w, "t0": cur, "t1": cur + span * 0.92}); cur += span
    meta = {"text": line["plain"], "words": out, "estimated": True}
    json.dump(meta, open(base + ".json", "w"), ensure_ascii=False, indent=1)
    return meta, path


def mock_speak(line, take, args):
    base = os.path.join(OUT, "vo", f"{line['id']}_t{take}")
    n = len(line["plain"].split())
    per = 0.5 + (0.04 * (n > 8))
    words = [{"text": w, "t0": 0.15 + i * per, "t1": 0.15 + (i + 1) * per - 0.06} for i, w in enumerate(line["plain"].split())]
    total = 0.15 + n * per + 0.25
    os.makedirs(os.path.dirname(base), exist_ok=True)
    expr = "0.25*sin(2*PI*(170+25*sin(2*PI*2.1*t))*t)*(0.6+0.4*sin(2*PI*3.1*t))"
    sh(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", f"aevalsrc={expr}:s=44100:d={total:.3f}", "-c:a", "libmp3lame", "-b:a", "128k", base + ".mp3"])
    meta = {"text": line["plain"], "words": words}
    json.dump(meta, open(base + ".json", "w"), ensure_ascii=False, indent=1)
    return meta, base + ".mp3"


# ----------------------------------------------------------------------------- choosing takes
def _norm_ar(s):
    import re
    s = re.sub(r"\[[^\]]*\]", "", s)
    s = re.sub(r"[\u064B-\u0652\u0670]", "", s)
    s = re.sub("[إأآا]", "ا", s).replace("ة", "ه").replace("ى", "ي")
    return " ".join(re.sub(r"[^\u0621-\u064A ]", " ", s).split())


def transcribe(path):
    import uuid
    b = "----el" + uuid.uuid4().hex
    parts = [f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode() for k, v in
             (("model_id", "scribe_v2"), ("language_code", "ara"))]
    parts.append(f'--{b}\r\nContent-Disposition: form-data; name="file"; filename="a.mp3"\r\nContent-Type: audio/mpeg\r\n\r\n'.encode()
                 + open(path, "rb").read() + b"\r\n")
    req = urllib.request.Request(API + "/v1/speech-to-text", data=b"".join(parts) + f"--{b}--\r\n".encode(), method="POST",
                                 headers={"xi-api-key": key(), "Content-Type": f"multipart/form-data; boundary={b}"})
    with urllib.request.urlopen(req, timeout=300) as r:
        d = json.loads(r.read().decode())
    lp = [w["logprob"] for w in d.get("words", []) if w.get("type") == "word" and w.get("logprob") is not None]
    return d.get("text", ""), (sum(lp) / len(lp) if lp else -9.0)


def pitch_range(path):
    """Spread of the voice's pitch in semitones (5th to 95th percentile of voiced frames), a proxy for expressiveness."""
    import numpy as np
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True).stdout
    x, sr = np.frombuffer(raw, np.int16).astype(np.float32) / 32768, 16000
    n, h, lo, hi, f0 = 640, 160, 16000 // 320, 16000 // 60, []
    for i in range(0, len(x) - n, h):
        f = x[i:i + n] - x[i:i + n].mean()
        if (f * f).mean() < 1e-4:
            continue
        d = np.array([np.sum((f[:n - hi] - f[t:t + n - hi]) ** 2) for t in range(hi + 1)])
        cm = np.concatenate([[1], d[1:] * np.arange(1, hi + 1) / np.maximum(np.cumsum(d[1:]), 1e-12)])
        c = np.where(cm[lo:hi] < 0.15)[0]
        if len(c):
            f0.append(sr / (c[0] + lo))
    if len(f0) < 10:
        return 0.0
    st = 12 * np.log2(np.array(f0) / np.median(f0))
    return float(np.percentile(st, 95) - np.percentile(st, 5))


VOWEL_MARKS = set(chr(c) for c in range(0x064B, 0x0653))


def _lpc(x, order):
    import numpy as np
    r = np.correlate(x, x, "full")[len(x) - 1:len(x) + order]
    a, e = np.zeros(order + 1), r[0]
    a[0] = 1
    for i in range(1, order + 1):
        k = -(r[i] + np.dot(a[1:i], r[i - 1:0:-1])) / e
        a[1:i + 1] = a[1:i + 1] + k * np.concatenate([a[i - 1:0:-1], [1]])
        e *= 1 - k * k
    return a


def vowel_formants(path, t0, t1):
    """Median F1/F2 (Hz) of the voiced frames between t0 and t1, by LPC."""
    import numpy as np
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True).stdout
    x = np.frombuffer(raw, np.int16).astype(np.float64) / 32768
    sr, n, h = 16000, 400, 80
    x = np.append(x[0], x[1:] - 0.63 * x[:-1])
    F = []
    for st in range(int(t0 * sr), max(int(t0 * sr) + 1, int(t1 * sr) - n), h):
        f = x[st:st + n]
        if len(f) < n or (f * f).mean() < 1e-6:
            continue
        roots = [z for z in np.roots(_lpc(f * np.hamming(n), 14)) if np.imag(z) >= 0.01]
        fr = sorted((np.angle(z) * sr / (2 * np.pi), -sr / np.pi * np.log(abs(z))) for z in roots)
        fr = [q for q, bw in fr if q > 180 and bw < 450]
        if len(fr) >= 2 and fr[0] < 900 and 700 < fr[1] < 3000:
            F.append(fr[:2])
    if not F:
        return None
    F = np.array(F)
    return float(np.median(F[:, 0])), float(np.median(F[:, 1]))


def check_vowels(path, meta, checks):
    """Each check is [word, consonant, vowel]: the vowel after that consonant in that word must measure as written.
    i: F2 >= 1900 Hz; a: F2 1300-1800; u: F2 < 1300. A pausal reading with no vowel at all is not an error."""
    al = meta.get("alignment")
    if not al or not checks:
        return []
    ch, s0 = al["characters"], al["character_start_times_seconds"]
    joined = "".join(ch)
    out = []
    for word, cons, want in checks:
        wi = joined.find(word)
        if wi < 0:
            out.append((word, None, "?", False)); continue
        ci = wi + word.index(cons)
        # the vowel ends at the next consonant or at the end of the word, whichever comes first
        nxt = next((k for k in range(ci + 1, len(ch)) if ch[k] not in VOWEL_MARKS), None)
        t1 = s0[nxt] if nxt is not None else s0[ci] + 0.12
        f = vowel_formants(path, s0[ci], max(t1, s0[ci] + 0.06))
        # pharyngeal, uvular and emphatic neighbours pull F2 down, so a kasra there sits lower
        dark = cons in "عحغخقصضطظ" or (nxt is not None and ch[nxt] in "عحغخقصضطظ")
        ti = 1700 if dark else 1900
        got = "?" if not f else ("i" if f[1] >= ti else "a" if 1300 <= f[1] < ti else "u")
        # at the end of a word no vowel at all is the pausal form, which is correct; a wrong vowel is not
        final = nxt is None or ch[nxt].isspace() or ch[nxt] in "،.:!؟"
        out.append((word, f, got, got == want or (final and got == "?")))
    return out


def judge_line(l, take_ids):
    """Keep the takes whose transcript matches the script exactly and whose checked vowels measure as written,
    then take the clearest one: the highest mean word confidence from the recogniser."""
    import difflib
    ref, rows = _norm_ar(l["plain"]), []
    for t in take_ids:
        p = os.path.join(OUT, "vo", f"{l['id']}_t{t}.mp3")
        if not os.path.exists(p):
            continue
        heard, clarity = transcribe(p)
        heard = _norm_ar(heard)
        acc = difflib.SequenceMatcher(None, ref, heard).ratio()
        meta = json.load(open(p[:-4] + ".json", encoding="utf-8"))
        vc = check_vowels(p, meta, l.get("vowel_checks", []))
        rows.append((t, acc, pitch_range(p), heard, clarity, vc))
    exact = [r for r in rows if r[1] >= 0.995]
    ok = [r for r in exact if all(v[3] for v in r[5])]
    t = max(ok or exact or rows, key=lambda r: (r[1], r[4]))[0]
    for r in rows:
        vs = "  ".join(f"{w}:{g}{'' if f is None else f'({f[0]:.0f}/{f[1]:.0f})'}{'' if okv else '!'}" for w, f, g, okv in r[5])
        print(f"  {l['id']} take {r[0]}: accuracy {r[1]:.2f}  clarity {r[4]:6.3f}  {vs}{'  <- chosen' if r[0] == t else ''}  | {r[3]}")
    return t, bool(ok)


def auto_pick(lines, takes, max_takes, speak_take):
    """Judge every line; a line with no clean take gets new takes, one at a time, up to max_takes."""
    pick, failed = {}, []
    for l in lines:
        t, ok = judge_line(l, range(1, takes + 1))
        n = takes
        while not ok and n < max_takes:
            n += 1
            print(f"  {l['id']}: no clean take yet, recording take {n}")
            speak_take(l, n)
            tn, ok = judge_line(l, [n])
            if ok:
                t = tn
        pick[l["id"]] = t
        if not ok:
            failed.append(l["id"])
    json.dump(pick, open(os.path.join(OUT, "picks.json"), "w"))
    if failed:
        print("  !! no take passed every check for:", ", ".join(failed), "- best effort used; listen to these lines")
    return pick


# ----------------------------------------------------------------------------- timeline
def build_timeline(lines, takes_pick, args, voice_id, model, settings, anchors=()):
    """Lay the lines end to end. A line whose first word has an anchor starts where its scene starts (design time),
    so the music carries the pauses and the animation keeps its own pace; `gap` is the minimum pause before it."""
    starts = {a["l"]: a["d"] for a in anchors if a["w"] == 0 and not a.get("ref") and not a.get("o")}
    clips, cursor = [], 0.0
    for i, l in enumerate(lines):
        take = takes_pick.get(l["id"], 1)
        prev_t = (lines[i - 1]["plain"] if args.plain else lines[i - 1]["text"]) if i else None
        next_t = (lines[i + 1]["plain"] if args.plain else lines[i + 1]["text"]) if i + 1 < len(lines) else None
        if args.mock:
            meta, path = mock_speak(l, take, args)
        elif args.manual:
            meta, path = manual_speak(l, take)
        else:
            meta, path = speak(l, prev_t, next_t, voice_id, model, settings, take, args)
        d = dur_of(path)
        start = cursor + l["gap"]
        if i in starts and meta["words"]:
            start = max(start, starts[i] - meta["words"][0]["t0"])
        clips.append({"id": l["id"], "path": path, "start": start, "dur": d, "words": meta["words"]})
        cursor = start + d
        print(f"  {l['id']}: start {start:5.2f}s  length {d:4.2f}s  words {len(meta['words'])}")
    return clips


def make_anchors(script, clips):
    pairs = []
    for a in script["anchors"]:
        if a["l"] >= len(clips):
            continue
        ws = clips[a["l"]]["words"]
        if a["w"] >= len(ws):
            print(f"  ! anchor d={a['d']}: line {a['l']} has only {len(ws)} words, skipped"); continue
        w = ws[a["w"]]
        t = clips[a["l"]]["start"] + (w["t1"] if a.get("ref") == "end" else w["t0"]) + a.get("o", 0)
        pairs.append([round(t, 3), a["d"]])
    pairs.sort(key=lambda p: p[1])
    clean = []
    for p in pairs:  # both clocks must be strictly increasing
        if not clean or (p[0] > clean[-1][0] + 0.08 and p[1] > clean[-1][1] + 0.08):
            clean.append(p)
        else:
            print(f"  ! anchor design {p[1]} -> audio {p[0]} breaks ordering, dropped")
    if clean and clean[0][0] > 0.3 and clean[0][1] > 0.3 and 0.6 < clean[0][1] / clean[0][0] < 1.7:
        clean.insert(0, [0.0, 0.0])
    for (a0, d0), (a1, d1) in zip(clean, clean[1:]):
        r = (d1 - d0) / (a1 - a0)
        flag = "  <-- stretches/squashes a lot" if r < 0.5 or r > 2.0 else ""
        print(f"    design {d0:5.1f}->{d1:5.1f}  audio {a0:5.2f}->{a1:5.2f}  speed x{r:4.2f}{flag}")
    last_a, last_d = clean[-1]
    duration = round(last_a + (script["design_end"] - last_d), 2)
    return clean, duration


def d2a(pairs, d):
    if d <= pairs[0][1]:
        return pairs[0][0] + (d - pairs[0][1])
    for (a0, d0), (a1, d1) in zip(pairs, pairs[1:]):
        if d <= d1:
            return a0 + (a1 - a0) * (d - d0) / (d1 - d0)
    return pairs[-1][0] + (d - pairs[-1][1])


# ----------------------------------------------------------------------------- music and effects
def music_plan(script, pairs, duration):
    m = script["music"]
    bounds = [0.0] + [d2a(pairs, b) for b in script["scene_boundaries_design"]] + [duration]
    secs = []
    for i, s in enumerate(m["sections"]):
        ms = max(3000, int(round((bounds[i + 1] - bounds[i]) * 1000)))
        secs.append((s, ms))
    neg = [x.strip() for x in m["negative"].split(",")]
    glob = [x.strip() for x in m["global"].split(",")]
    v2 = {"chunks": [{"text": f"[{s['name']}]\n{{{s['style']}}}", "duration_ms": ms,
                      "positive_styles": ([m["global"]] if i == 0 else []) + [s["style"]],
                      "negative_styles": neg} for i, (s, ms) in enumerate(secs)]}
    v1 = {"positive_global_styles": glob, "negative_global_styles": neg,
          "sections": [{"section_name": s["name"], "positive_local_styles": [x.strip() for x in s["style"].split(",")],
                        "negative_local_styles": [], "duration_ms": ms, "lines": []} for s, ms in secs]}
    prompt = m["global"] + ". Structure with exact timings: " + "; ".join(
        f"{s['name']} for {ms/1000:.0f} seconds ({s['style']})" for s, ms in secs)
    return v2, v1, prompt, sum(ms for _, ms in secs)


def make_music(script, pairs, duration, args):
    path = os.path.join(OUT, "music.mp3")
    if os.path.exists(path) and not args.force:
        return path
    if args.mock:
        sh(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i",
            f"aevalsrc=0.18*sin(2*PI*55*t)+0.1*sin(2*PI*82.4*t)+0.06*sin(2*PI*220*t)*(0.5+0.5*sin(2*PI*0.1*t)):s=44100:d={duration:.2f}",
            "-c:a", "libmp3lame", "-b:a", "128k", path])
        return path
    v2, v1, prompt, total = music_plan(script, pairs, duration)
    if script["music"].get("prompt"):  # one continuous piece: a single prompt, no sections
        one = {"prompt": script["music"]["prompt"], "music_length_ms": int(round((duration + 0.3) * 1000)), "force_instrumental": True}
        attempts = [(m, one) for m in ("music_v2_5", "music_v2", "music_v1")]
    else:
        attempts = [("music_v2_5", {"composition_plan": v2}), ("music_v2", {"composition_plan": v2}),
                    ("music_v1", {"composition_plan": v1}),
                    ("music_v1", {"prompt": prompt, "music_length_ms": min(600000, max(3000, total)), "force_instrumental": True})]
    last = None
    for model, extra in attempts:
        try:
            audio = http("POST", "/v1/music", body={**extra, "model_id": model}, query={"output_format": "mp3_44100_192"}, binary=True, timeout=900)
            open(path, "wb").write(audio)
            print(f"  music: {model} ({'plan' if 'composition_plan' in extra else 'prompt'}) -> {dur_of(path):.1f}s")
            return path
        except RuntimeError as e:
            last = e; print("  music attempt failed:", str(e)[:200])
    raise last


def make_sfx(script, pairs, args):
    items, cache = [], {}
    for ev in script["sfx_events"]:
        kind = ev["kind"]
        if kind not in cache:
            p = os.path.join(OUT, "sfx", f"{kind}.mp3")
            os.makedirs(os.path.dirname(p), exist_ok=True)
            if args.mock:
                sh(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", "aevalsrc=0.5*sin(2*PI*90*t)*exp(-3*t):s=44100:d=1.2", "-c:a", "libmp3lame", p])
            elif not os.path.exists(p) or args.force:
                sp = script["sfx_prompts"][kind]
                audio = http("POST", "/v1/sound-generation", body={"text": sp["text"], "duration_seconds": sp["dur"], "prompt_influence": 0.55}, binary=True)
                open(p, "wb").write(audio)
            cache[kind] = p
        items.append((cache[kind], d2a(pairs, ev["d"]), kind))
    return items


GAIN = {"boom": 0.95, "riser": 0.6, "whoosh": 0.55, "shield": 0.8, "swell": 0.55, "sting": 0.95}


def mix(clips, music, sfx, duration):
    inputs, fl = [], []
    for c in clips:
        inputs += ["-i", c["path"]]
    n_vo = len(clips)
    for i, c in enumerate(clips):
        ms = int(round(c["start"] * 1000))
        fl.append(f"[{i}:a]aformat=sample_rates=44100:channel_layouts=stereo,adelay={ms}|{ms}[v{i}]")
    fl.append("".join(f"[v{i}]" for i in range(n_vo)) + f"amix=inputs={n_vo}:normalize=0:dropout_transition=0,"
              "highpass=f=80,equalizer=f=220:t=q:w=1:g=-1.5,equalizer=f=4200:t=q:w=1:g=2.5,"
              "acompressor=threshold=0.12:ratio=3:attack=8:release=140:makeup=2.2,"
              f"apad=whole_dur={duration:.2f},asplit=2[voa][vosc]")  # full length, or the ducked music stops with the last word
    # level the score into an even bed first, in its own pass: inside the graph, loudnorm's 3 s look-ahead
    # was never flushed into sidechaincompress, which cut the last 3 s of music
    bed = os.path.join(OUT, "music_bed.wav")
    sh(["ffmpeg", "-y", "-loglevel", "error", "-i", music, "-af",
        f"aformat=sample_rates=44100:channel_layouts=stereo,atrim=0:{duration:.2f},apad=whole_dur={duration:.2f},"
        "loudnorm=I=-30:LRA=6:TP=-8,aresample=44100", bed])  # an even bed, about 12 LU under the voice
    inputs += ["-i", bed]
    mi = n_vo
    fl.append(f"[{mi}:a]aformat=sample_rates=44100:channel_layouts=stereo[m0]")
    fl.append("[m0][vosc]sidechaincompress=threshold=0.02:ratio=6:attack=15:release=520:makeup=1.3[md]")
    labels = ["[md]", "[voa]"]
    for j, (p, t, kind) in enumerate(sfx):
        inputs += ["-i", p]
        idx = mi + 1 + j
        ms = max(0, int(round(t * 1000)))
        fl.append(f"[{idx}:a]aformat=sample_rates=44100:channel_layouts=stereo,adelay={ms}|{ms},volume={GAIN.get(kind,0.7)}[s{j}]")
        labels.append(f"[s{j}]")
    fl.append("".join(labels) + f"amix=inputs={len(labels)}:normalize=0:dropout_transition=0,"
              f"atrim=0:{duration:.2f},afade=t=out:st={duration-1.5:.2f}:d=1.5,alimiter=limit=0.95,loudnorm=I=-14:TP=-1.5:LRA=11[out]")
    outp = os.path.join(OUT, "mix.m4a")
    sh(["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex", ";".join(fl), "-map", "[out]", "-c:a", "aac", "-b:a", "256k", outp])
    return outp


# ----------------------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--voice-id"); ap.add_argument("--model"); ap.add_argument("--list-voices", action="store_true")
    ap.add_argument("--takes", type=int, default=1); ap.add_argument("--pick", default="")
    ap.add_argument("--auto-pick", action="store_true", help="choose each line's take: transcribe every take (Scribe), keep the accurate ones, then the clearest")
    ap.add_argument("--tags", action="store_true"); ap.add_argument("--plain", action="store_true")
    ap.add_argument("--no-closing", action="store_true"); ap.add_argument("--no-sfx", action="store_true")
    ap.add_argument("--only", choices=["vo", "music", "sfx", "mix"]); ap.add_argument("--force", action="store_true")
    ap.add_argument("--mock", action="store_true"); ap.add_argument("--out", help="output folder (default audio/out)")
    ap.add_argument("--max-takes", type=int, default=8, help="with --auto-pick: record more takes for a line until one passes every check")
    ap.add_argument("--manual", action="store_true", help="use recordings made in the ElevenLabs web app (no API key needed for the voice)")
    args = ap.parse_args()
    if args.out:
        global OUT
        OUT = os.path.abspath(args.out)
    os.makedirs(OUT, exist_ok=True)
    script = json.load(open(os.path.join(ROOT, "script.json"), encoding="utf-8"))
    if args.list_voices:
        show_voices(list_voices()); return
    lines = [l for l in script["lines"] if not (l.get("optional") and args.no_closing)]
    if args.no_closing:  # drop anchors that point past the last line
        script["anchors"] = [a for a in script["anchors"] if a["l"] < len(lines)]
    pick = {kv.split("=")[0]: int(kv.split("=")[1]) for kv in args.pick.split(",") if "=" in kv}

    voice_id, model = args.voice_id or os.environ.get("ELEVENLABS_VOICE_ID") or script["tts"].get("voice_id"), None
    if not args.mock and not args.manual:
        model = pick_model(script["tts"]["model_preference"], args.model)
        print("TTS model:", model)
        if not voice_id:
            vs = list_voices()
            v = choose_voice(vs)
            if not v:
                sys.exit("No Arabic voices on the account. Add one from the Voice Library, then pass --voice-id.")
            voice_id = v["voice_id"]
            print("Voice (auto):", v.get("name"), voice_id, "- override with --voice-id; candidates:"); show_voices(vs[:12])
    settings = dict(script["tts"]["voice_settings"])
    if model and model.startswith(("eleven_v3", "eleven_v4")):  # these models ignore style and speaker boost
        settings = {k: v for k, v in settings.items() if k in ("stability", "similarity_boost", "speed")}

    print("Voice-over:")
    if args.takes > 1 and not args.mock and not args.manual:
        for t in range(2, args.takes + 1):
            for i, l in enumerate(lines):
                prev_t = lines[i - 1]["text"] if i else None
                next_t = lines[i + 1]["text"] if i + 1 < len(lines) else None
                speak(l, prev_t, next_t, voice_id, model, settings, t, args)
        if args.auto_pick:
            build_timeline(lines, {}, args, voice_id, model, settings, script["anchors"])  # make sure take 1 exists
            def speak_take(l, n):
                i = lines.index(l)
                speak(l, lines[i - 1]["text"] if i else None, lines[i + 1]["text"] if i + 1 < len(lines) else None,
                      voice_id, model, settings, n, args)
            pick = {**auto_pick(lines, args.takes, max(args.max_takes, args.takes), speak_take), **pick}
        else:
            print(f"  extra takes written to out/vo/ (listen, then re-run with --pick L1=2,L3=3, or use --auto-pick)")
    clips = build_timeline(lines, pick, args, voice_id, model, settings, script["anchors"])
    pairs, duration = make_anchors(script, clips)
    json.dump({"anchors": pairs, "duration": duration}, open(os.path.join(OUT, "anchors.json"), "w"), indent=1)
    print(f"anchors.json written, total duration {duration:.2f}s")
    if args.only == "vo":
        return
    print("Music:"); music = make_music(script, pairs, duration, args)
    if args.only == "music":
        return
    sfx = [] if args.no_sfx or not script.get("sfx_enabled", True) else make_sfx(script, pairs, args)
    if args.only == "sfx":
        return
    print("Mix:"); out = mix(clips, music, sfx, duration)
    print("done ->", out)


if __name__ == "__main__":
    main()
