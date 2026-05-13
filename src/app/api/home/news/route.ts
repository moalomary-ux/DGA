import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 600;

type FeedItem = { title: string; link: string; pubDate: string; source: string; score: number };

// Focused tech + AI + innovation sources
// Dropped: Wired (luxury/fashion), Ars Technica (geopolitics drift)
const FEEDS = [
  { url: 'https://techcrunch.com/feed/',                       source: 'TechCrunch' },
  { url: 'https://www.theverge.com/rss/index.xml',             source: 'The Verge' },
  { url: 'https://www.technologyreview.com/feed/',             source: 'MIT Tech Review' },
  { url: 'https://venturebeat.com/category/ai/feed/',          source: 'VentureBeat AI' },
  { url: 'https://www.artificialintelligence-news.com/feed/',  source: 'AI News' },
  { url: 'https://hnrss.org/frontpage?points=150',             source: 'Hacker News' },
];

// REJECT: politics, geopolitics, violence, death, lifestyle, scandals
const BAD = /\b(war|wars|killed|kills|killing|death|deaths|dies|died|dying|murder|murdered|attack|attacks|attacked|missile|missiles|weapon|weapons|bomb|bombing|terror|terrorist|terrorism|invasion|invaded|troops|airstrike|warship|hamas|hezbollah|isis|taliban|iran|iranian|tehran|israel|israeli|netanyahu|gaza|palestinian|palestine|hostage|russia|russian|moscow|kremlin|ukraine|ukrainian|kyiv|putin|zelensky|trump|biden|harris|kamala|election|elections|senate|congress|democrat|democrats|republican|republicans|impeach|hong kong|north korea|kim jong|venezuela|maduro|cuba|lawsuit|sued|sues|suing|scam|scams|fraud|fraudulent|fashion|piguet|swatch|rolex|sneaker|perfume|luxury|celebrity|celebrities|porn|gossip|royal family|kardashian|jenner|drugs|overdose|opioid|rape|raped|sexual assault)\b/i;

// PREFER: tech, AI, products, startups, innovation, digital transformation
const GOOD = /\b(artificial intelligence|machine learning|deep learning|generative|ai|llm|llms|gpt|chatgpt|claude|gemini|copilot|anthropic|openai|mistral|neural|transformer|agent|agents|agentic|model|models|inference|training|fine[- ]?tune|fine[- ]?tuning|dataset|datasets|robot|robotics|robotic|automation|automate|automated|startup|startups|funding|raises|raised|seed|ipo|acquires|acquired|acquisition|cloud|saas|platform|api|sdk|chip|chipmaker|chips|semiconductor|gpu|cpu|tpu|processor|nvidia|amd|intel|tsmc|algorithm|algorithms|code|coding|programming|developer|developers|software|launches|launched|releases|released|announces|announced|unveils|debuts|innovation|breakthrough|digital transformation|govtech|fintech|edtech|biotech|healthtech|quantum|cybersecurity|encryption|5g|6g|broadband|fiber|vr|ar|xr|metaverse|tesla|apple|google|microsoft|meta|amazon|aws|azure|oracle|salesforce|databricks|snowflake|stripe|shopify|figma|notion|github|gitlab|chrome|firefox|ios|android|linux|kernel|open[- ]source|kubernetes|docker|database|postgres|graphql|typescript|javascript|python|rust|wasm|webassembly|protocol|wifi|bluetooth|sensor|iot|smartphone|tablet|laptop|macbook|iphone|pixel|self[- ]driving|autonomous|ev|electric vehicle|battery|fusion|spacex|starlink|satellite|reusable rocket|crypto|blockchain|defi|web3|decentralized)\b/i;

async function fetchRSS(url: string, source: string): Promise<FeedItem[]> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; QudratokBot/1.0)' },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const items: FeedItem[] = [];
    const itemRe = /<item[\s>][\s\S]*?<\/item>|<entry[\s>][\s\S]*?<\/entry>/g;
    let m;
    while ((m = itemRe.exec(xml)) !== null && items.length < 10) {
      const block = m[0];
      const titleM = block.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
      const linkM = block.match(/<link[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/) || block.match(/<link[^>]+href="([^"]+)"/);
      const pubM = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || block.match(/<published>([\s\S]*?)<\/published>/);
      const descM = block.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/) || block.match(/<summary[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/summary>/);
      const t = titleM ? titleM[1].trim().replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>') : '';
      const l = linkM ? linkM[1].trim() : '';
      const d = descM ? descM[1].trim().replace(/<[^>]+>/g, '').substring(0, 200) : '';
      if (!t || !l) continue;
      const combined = `${t} ${d}`;
      if (BAD.test(combined)) continue;
      const score = GOOD.test(combined) ? 2 : 1;
      items.push({ title: t, link: l, pubDate: pubM ? pubM[1].trim() : '', source, score });
    }
    return items;
  } catch (e) { return []; }
}

export async function GET() {
  const all = (await Promise.all(FEEDS.map(f => fetchRSS(f.url, f.source)))).flat();
  const seen = new Set<string>();
  const unique = all.filter(it => {
    if (seen.has(it.link) || seen.has(it.title)) return false;
    seen.add(it.link); seen.add(it.title); return true;
  });
  // Sort: score desc (GOOD match first), then pubDate desc
  unique.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (new Date(b.pubDate).getTime() || 0) - (new Date(a.pubDate).getTime() || 0);
  });
  const items = unique.slice(0, 6).map(it => ({
    title: it.title, link: it.link, source: it.source, pubDate: it.pubDate,
    label: 'تقنية', color: '#8B5CF6',
  }));
  return NextResponse.json({ ok: true, items, fetched_at: new Date().toISOString() });
}
