import { chromium } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'fs';

const URL = 'https://charaverse-frontend.vercel.app';
const OUT = 'showcase-output';
mkdirSync(OUT, { recursive: true });

let start, page;

const scenes = [];
function rec(type, action, element, intent, tone, script, dur) {
  scenes.push({
    scene: scenes.length + 1,
    elapsed: ((Date.now() - start) / 1000).toFixed(1) + 's',
    elapsed_seconds: Number(((Date.now() - start) / 1000).toFixed(1)),
    duration_seconds: dur,
    scene_type: type,
    action,
    element_description: element || '',
    url: page ? page.url() : URL,
    ui_state: { visible: [], modals: [], animations: [], cursor_position: '' },
    visual_changes: '',
    user_intent: intent,
    emotional_tone: tone,
    element_text: '',
    ai_response: '',
    screenshot: '',
    narration_script: script,
  });
  console.log(`\n[${scenes.at(-1).elapsed}] ${action} ${element ? '// ' + element : ''}`);
  console.log(`   🎯 ${intent} · ${tone}`);
  console.log(`   🎙 ${script.substring(0, 140)}...`);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function snap(page, name) {
  const s = scenes.at(-1);
  if (name) {
    await page.screenshot({ path: `${OUT}/${name}.png` });
    s.screenshot = `${name}.png`;
  }
  s.ui_state = await page.evaluate(() => {
    const v = [];
    document.querySelectorAll('.site-header, .hero, .professional-grid, .professional-card, .ci-layout, .ci-container, .ci-header, .ci-messages, .ci-input-area, .ci-sidebar, .ci-intro-overlay, .ci-suggestions, .ci-back, .ci-sidebar-toggle, .ci-theme-toggle').forEach(el => {
      if (el.offsetParent !== null) v.push(el.className.split(' ')[0]);
    });
    return {
      visible: [...new Set(v)],
      modals: document.querySelector('.ci-intro-overlay') ? ['intro popup'] : [],
      animations: [],
      cursor_position: '',
    };
  });
  try {
    const t = await page.locator('.ci-bubble').first().textContent({ timeout: 800 }).catch(() => '');
    if (t) s.element_text = t.substring(0, 200);
  } catch {}
  s.visual_changes = name ? `📸 ${name}` : `state: ${s.ui_state.visible.join(', ')}`;
}

async function humanClick(page, selector, desc) {
  const el = page.locator(selector).first();
  await el.waitFor({ state: 'visible', timeout: 5000 });
  const box = await el.boundingBox();
  if (!box) throw new Error(`Cannot find ${selector}`);
  const ms = 500 + Math.random() * 300;
  const steps = 8 + Math.floor(Math.random() * 4);
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(100 + 300 * (i / steps), 200 + 400 * (i / steps));
    await sleep(ms / steps);
  }
  await sleep(200 + Math.random() * 300);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  if (scenes.length) scenes.at(-1).ui_state.cursor_position = desc;
}

async function humanType(page, selector, text) {
  await page.locator(selector).first().click();
  await sleep(400);
  for (const c of text) { await page.keyboard.type(c); await sleep(60 + Math.random() * 50); }
}

async function waitForAI(page, timeoutMs = 45000) {
  const deadline = Date.now() + timeoutMs;
  let last = '', stable = 0, hasContent = false;
  while (Date.now() < deadline) {
    const text = await page.evaluate(() => {
      const els = document.querySelectorAll('.ci-msg--assistant');
      if (!els.length) return '';
      const b = els[els.length - 1].querySelector('.ci-bubble');
      return b ? (b.textContent?.trim() || '') : '';
    });
    if (!text || text.length < 3) { await sleep(400); continue; }
    if (!hasContent && text.length > 5) hasContent = true;
    if (text === last && hasContent) { stable++; if (stable >= 5) return text; }
    else if (text !== last) { stable = 0; last = text; }
    await sleep(400);
  }
  return last;
}

// ── LAUNCH ──
const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome', headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: OUT, size: { width: 1440, height: 900 } },
});
page = await context.newPage();
start = Date.now();

// ══════ 1 — HOMEPAGE ══════
rec('establishing', 'navigate', '',
  'first look at Charaverse', 'welcoming, intrigued',
  "Welcome to Charaverse. I'm landing on the homepage for the first time and immediately the branding catches my eye — Mpela Co. paired with a rich gold and navy colour scheme. The tagline 'Your Professional Companions' tells me this is a place where I can find expert AI consultants. Let me take it all in before I explore further.",
  8
);
await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 });
await sleep(3000);
await snap(page, '01-home-hero');

// ══════ 2 — SCROLL GRID ══════
rec('scroll', 'scroll down to companion grid', '',
  'see what professionals are available', 'curious, exploratory',
  "I'm scrolling down now. The page feels smooth and responsive. Below the hero I see a row of professional cards — five companions, each with a unique avatar and category badge. Let me take a closer look.",
  7
);
await page.evaluate(() => document.querySelector('.professional-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
await sleep(3000);
await snap(page, '02-companion-grid');

// ══════ 3 — HOVER THABO ══════
rec('hover', 'move cursor to Thabo Molefe', 'Thabo Molefe card — Legal Counsel',
  'check out the Legal Counsel first', 'interested, deliberate',
  'Thabo Molefe catches my attention first — Legal Counsel. His description mentions South African contract law, business compliance, and intellectual property. I move my cursor over to his card.',
  5
);
await humanClick(page, '.professional-card:nth-child(1)', 'hovering Thabo Molefe');
await sleep(2000);
await snap(page, '03-thabo-clicked');

// ══════ 4 — INTRO POPUP ══════
rec('page_transition', 'navigate to Thabo chat', 'intro popup visible',
  'see the chat interface', 'attentive, impressed',
  "The page transitions smoothly into Thabo's chat. Before I can type, a modal introduces him — full profile and an AI disclaimer. I appreciate the transparency.",
  6
);
await sleep(3000);
scenes.at(-1).url = page.url();
scenes.at(-1).ui_state.modals = ['intro popup'];
await snap(page, '04-thabo-intro');

// ══════ 5 — DISMISS INTRO ══════
rec('interaction', 'click Start Chat', 'Start Chat button',
  'dismiss intro and start talking', 'ready, engaged',
  "I click 'Start Chat'. The modal slides away and I see the full chat interface. Thabo's greeting appears, and below are five suggestion chips — preset questions tailored to legal expertise. A nice touch.",
  6
);
await humanClick(page, '.ci-intro-btn', 'Start Chat button');
await sleep(2500);
await snap(page, '05-thabo-chat');

// ══════ 6 — READ SUGGESTIONS ══════
const chip1 = await page.locator('.ci-suggestion-chip').first().textContent();
rec('reading', `read suggestion: "${chip1}"`, chip1,
  'find a good starting question', 'thoughtful, considering',
  `I scan the suggestions. "${chip1}" sounds like a great starting point. This is much better than staring at a blank input.`,
  5
);
await sleep(3000);
await snap(page, '06-thabo-suggestions');

// ══════ 7 — CLICK SUGGESTION + STREAM ══════
rec('interaction', `click "${chip1}"`, chip1,
  'see how Thabo handles my question', 'curious, expectant',
  `I click "${chip1}". Thabo starts responding immediately — text streams in word by word with a blinking cursor. Feels like a real conversation.`,
  4
);
await humanClick(page, '.ci-suggestion-chip:first-child', chip1);
const ai1 = await waitForAI(page);
await sleep(1000);
scenes.at(-1).ai_response = ai1;
await snap(page, '07-thabo-streaming-done');

// ══════ 8 — REACT ══════
rec('reaction', 'reading Thabo response', ai1.substring(0, 100),
  'absorb what he said', 'satisfied, engaged',
  `Thabo's response is concise — he asks me about my situation instead of dumping information. This is exactly the conversational behavior I wanted.`,
  8
);
if (ai1) console.log(`   📝 "${ai1.substring(0, 200)}..."`);
await sleep(6000);
await snap(page, '08-thabo-response-read');

// ══════ 9 — TYPE FOLLOW-UP ══════
rec('typing', 'type follow-up question', 'input field',
  'ask about his speciality', 'curious, conversational',
  "I follow up naturally — asking what contracts he handles most. Slow typing shows genuine engagement, not a rushed demo.",
  10
);
await humanType(page, '.ci-text-input', "That makes sense. What kind of contracts do you handle most often in your practice?");
await sleep(1500);
await snap(page, '09-thabo-typing');

// ══════ 10 — SEND + STREAM ══════
rec('interaction', 'send follow-up', 'Send button',
  'hear his answer', 'expectant, engaged',
  "I send the question. Thabo streams his second response — more specific this time, talking about various contract types he works with.",
  5
);
await humanClick(page, '.ci-btn--send', 'Send button');
const ai2 = await waitForAI(page);
await sleep(1000);
scenes.at(-1).ai_response = ai2;
await snap(page, '10-thabo-followup-done');

// ══════ 11 — REFLECT ══════
rec('reaction', 'reading second response', ai2.substring(0, 100),
  'absorb the conversation flow', 'impressed, thoughtful',
  "Service agreements, partnership contracts, IP licensing — clear and practical. He keeps it concise and invites me to share more. The back-and-forth feels natural.",
  8
);
if (ai2) console.log(`   📝 "${ai2.substring(0, 200)}..."`);
await sleep(6000);
await snap(page, '11-thabo-second-read');

// ══════ 12 — BACK TO HOME ══════
rec('transition', 'click Back', 'Back button',
  'explore other companions', 'curious, transitioning',
  "Great conversation with Thabo, but I want to see who else is here. I click Back — smooth page transition back to the homepage.",
  5
);
await sleep(2000);
await humanClick(page, '.ci-back', 'Back button');
await sleep(2500);
scenes.at(-1).url = page.url();
await snap(page, '12-back-home');

// ══════ 13 — FIND AMARA ══════
rec('scroll', 'scroll to Amara Dlamini', 'companion grid',
  'try a different type — wellness', 'curious, open-minded',
  "Back on the grid, I scan for Amara Dlamini — Therapeutic Counsellor. After the legal chat, let's see what a wellness companion feels like. The contrast should show the range here.",
  5
);
await page.evaluate(() => document.querySelector('.professional-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
await sleep(2500);
await snap(page, '13-amara-card');

// ══════ 14 — CLICK AMARA ══════
rec('interaction', 'click Amara Dlamini', 'Amara Dlamini card',
  'start a conversation with the counsellor', 'interested, seeking',
  "I click Amara's card. Smooth transition to her chat. Her intro modal is noticeably warmer — different tone from Thabo. The experience feels different already.",
  5
);
await humanClick(page, '.professional-card:nth-child(2)', 'Amara Dlamini card');
await sleep(3000);
scenes.at(-1).url = page.url();
scenes.at(-1).ui_state.modals = ['intro popup'];
await snap(page, '14-amara-intro');

// ══════ 15 — DISMISS + SUGGESTION ══════
const chip2 = await page.locator('.ci-suggestion-chip').first().textContent().catch(() => '');
rec('interaction', `dismiss intro, click "${chip2}"`, chip2,
  'see how Amara responds to emotion', 'curious, receptive',
  `I dismiss the intro and Amara's greeting is warmer than Thabo's. I choose "${chip2}" — let's see how her therapeutic tone differs.`,
  5
);
await humanClick(page, '.ci-intro-btn', 'Start Chat button');
await sleep(1000);
await humanClick(page, '.ci-suggestion-chip:first-child', chip2);
const ai3 = await waitForAI(page);
await sleep(1000);
scenes.at(-1).ai_response = ai3;
await snap(page, '15-amara-response');

// ══════ 16 — REACT TO AMARA ══════
rec('reaction', 'reading Amara response', ai3 ? ai3.substring(0, 100) : '',
  'experience the different personality', 'impressed, reflective',
  `Completely different from Thabo. Amara is warm and empathetic — she acknowledges my feelings first before gently asking a follow-up. This is what I'd want from a counsellor. The personality design is thoughtful.`,
  8
);
if (ai3) console.log(`   📝 "${ai3.substring(0, 200)}..."`);
await sleep(6000);
await snap(page, '16-amara-read');

// ══════ 17 — BACK ══════
rec('transition', 'click Back', 'Back button',
  'return to homepage for closing', 'satisfied, concluding',
  "One more back navigation. The transition plays again — consistent across the app. All five companions are there, each with a unique expertise.",
  4
);
await sleep(2000);
await humanClick(page, '.ci-back', 'Back button');
await sleep(2000);

// ══════ 18 — SCROLL UP ══════
rec('scroll', 'scroll to hero', 'hero section',
  'end where I started', 'satisfied, reflective',
  "I scroll back up. The hero section greets me again — 'Your Professional Companions'. Now that tagline carries more weight after experiencing it first-hand.",
  6
);
await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
await sleep(3000);
await snap(page, '18-final-hero');

// ══════ 19 — OUTRO ══════
rec('closing', 'showcase complete', '',
  'wrap up the tour', 'satisfied, impressed',
  "That's the Charaverse. Distinct personalities, natural streaming responses, smooth transitions. Each companion feels real in their own way. Whether legal, wellness, business, career, or finance — there's someone here to help. Powered by Mpela Co.",
  6
);
await sleep(2000);

// ══════ WRITE OUTPUT ══════
const total = Number(((Date.now() - start) / 1000).toFixed(1));
const output = {
  title: 'Charaverse — Product Showcase Narration Guide',
  description: 'Full narration log for AI voiceover. Each scene includes timing, user intent, emotional tone, and first-person narration script. The voiceover should read narration_script naturally, matching the emotional_tone.',
  url: URL,
  total_duration_seconds: total,
  total_scenes: scenes.length,
  scenes,
};
writeFileSync(`${OUT}/narration-log.json`, JSON.stringify(output, null, 2));

console.log(`\n${'═'.repeat(50)}`);
console.log(`✅ DONE · ${Math.floor(total / 60)}m ${Math.round(total % 60)}s · ${scenes.length} scenes`);
console.log(`📁 Video: ${await page.video().path()}`);
console.log(`📁 Log:   ${OUT}/narration-log.json`);

await browser.close();
