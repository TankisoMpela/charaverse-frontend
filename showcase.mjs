import { chromium } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'fs';

const URL = 'https://charaverse-frontend.vercel.app';
const OUT = 'showcase-output';

mkdirSync(OUT, { recursive: true });

const scenes = [];
let start;

function scene(action, element, description, narration, duration) {
  scenes.push({
    scene: scenes.length + 1,
    elapsed: ((Date.now() - start) / 1000).toFixed(1) + 's',
    action,
    element,
    description,
    narration_suggestion: narration || '',
    suggested_duration_seconds: duration || 0,
    ai_response: '',
  });
  const s = scenes.at(-1);
  console.log(`[${s.elapsed}] ${action}${element ? ': ' + element : ''}`);
  if (narration) console.log(`   🎙 ${narration}`);
}

async function screenshot(name) {
  await page.screenshot({ path: `${OUT}/${name}.png` });
}

async function moveAndClick(page, selector, moveMs = 600) {
  const el = page.locator(selector).first();
  await el.waitFor({ state: 'visible', timeout: 5000 });
  const box = await el.boundingBox();
  if (!box) throw new Error(`Cannot find ${selector}`);
  const steps = 12;
  const fromX = 250, fromY = 300;
  const toX = box.x + box.width / 2;
  const toY = box.y + box.height / 2;
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(
      fromX + (toX - fromX) * (i / steps),
      fromY + (toY - fromY) * (i / steps)
    );
    await new Promise(r => setTimeout(r, moveMs / steps));
  }
  await page.mouse.click(toX, toY);
}

async function typeSlowly(page, selector, text) {
  const el = page.locator(selector).first();
  await el.click();
  await new Promise(r => setTimeout(r, 300));
  for (const char of text) {
    await page.keyboard.type(char);
    await new Promise(r => setTimeout(r, 50 + Math.random() * 40));
  }
}

async function waitForAI(page, timeoutMs = 45000) {
  const deadline = Date.now() + timeoutMs;
  let last = '';
  let stable = 0;
  let hasContent = false;
  while (Date.now() < deadline) {
    const text = await page.evaluate(() => {
      const msgs = document.querySelectorAll('.ci-msg--assistant');
      if (!msgs.length) return '';
      const lastEl = msgs[msgs.length - 1];
      const bubble = lastEl.querySelector('.ci-bubble');
      if (!bubble) return '';
      const t = bubble.textContent?.trim() || '';
      return t;
    });
    if (!text) { await sleep(400); continue; }
    if (!hasContent && text.length > 5) hasContent = true;
    if (text === last && hasContent) {
      stable++;
      if (stable >= 6) return text;
    } else if (text !== last) {
      stable = 0;
      last = text;
    }
    await sleep(400);
  }
  return last;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ──────────────────────────────────────────────
const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: OUT, size: { width: 1440, height: 900 } },
});

const page = await context.newPage();
start = Date.now();

// ──────────────────────────────────────────────
// 1 — LOAD HOMEPAGE
// ──────────────────────────────────────────────
scene('navigate', URL,
  'Opens the Charaverse homepage',
  'Welcome to the Charaverse — a collection of AI-powered professional companions powered by Mpela Co. The homepage features a hero section with the tagline "Your Professional Companions" and a clean, modern design with gold and navy brand colors.',
  5
);
await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 });
await sleep(3000);
await screenshot('01-home-hero');

// ──────────────────────────────────────────────
// 2 — SCROLL TO COMPANION GRID
// ──────────────────────────────────────────────
scene('scroll', 'companion grid',
  'Scrolling down to the professional grid section',
  'Below the hero sits a grid of five companion cards. Each features an avatar, a category badge, the consultant\'s name and title, a short description, and the Mpela Co. branding. Users browse and click to start a conversation.',
  5
);
await page.evaluate(() => {
  document.querySelector('.professional-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
await sleep(2500);
await screenshot('02-companion-grid');

// ──────────────────────────────────────────────
// 3 — CLICK THABO MOLEFE
// ──────────────────────────────────────────────
scene('move+click', 'Thabo Molefe card',
  'Moving cursor to the first companion',
  'We start with Thabo Molefe, the Legal Counsel. His card shows a bronze-toned avatar, the "Legal" category badge, his name, and a summary of his expertise in South African contract law, compliance, and intellectual property.',
  4
);
await moveAndClick(page, '.professional-card:nth-child(1)', 800);
await sleep(3000);
await screenshot('03-thabo-intro');
scene('pause', 'Thabo intro popup', 'Intro popup appears',
  'A modal introduces Thabo properly — full avatar, name, title, description, and an important AI disclaimer. Users must acknowledge this before starting the conversation.',
  4
);

await moveAndClick(page, '.ci-intro-btn', 500);
await sleep(1500);
await screenshot('04-thabo-chat');
scene('pause', 'Thabo chat interface', 'Chat interface loaded with greeting',
  'The chat interface opens. A warm greeting from Thabo appears, and below the input bar are five suggestion chips — preset questions to help users get started quickly.',
  5
);

// ──────────────────────────────────────────────
// 4 — CLICK SUGGESTION, CAPTURE AI RESPONSE
// ──────────────────────────────────────────────
const chip1 = page.locator('.ci-suggestion-chip').first();
const chip1Text = await chip1.textContent();
await moveAndClick(page, '.ci-suggestion-chip:first-child', 500);
scene('click', `suggestion: "${chip1Text}"`,
  `Clicked suggestion chip "${chip1Text}"`,
  `The user taps the "${chip1Text}" suggestion. The AI immediately begins streaming its response — text appears word by word with a blinking cursor, giving a feel of real-time conversation.`,
  3
);
const ai1 = await waitForAI(page);
await sleep(2000);
await screenshot('05-thabo-response');
scenes[scenes.length - 1].ai_response = ai1;
scene('ai_response', 'Thabo first response',
  'First AI response complete',
  `Thabo responds with legal perspective. The response is concise and conversational — not a wall of text. This showcases the new system prompt behavior we tuned.`,
  8
);
console.log(`   📝 AI: ${ai1.substring(0, 200)}...`);

// ──────────────────────────────────────────────
// 5 — TYPE FOLLOW-UP
// ──────────────────────────────────────────────
scene('move', 'input field',
  'Moving cursor to type a follow-up question',
  'The user follows up naturally, continuing the conversation. This shows the chat interface supports multi-turn dialogue.',
  3
);
await sleep(1000);
await typeSlowly(page, '.ci-text-input', "That's helpful. What kind of contracts do you handle most often?");
await sleep(1500);
await screenshot('06-thabo-typing');
scene('pause', 'typing complete',
  'Follow-up typed and ready to send',
  'The follow-up question appears in the input field. The send button is active.',
  4
);

await moveAndClick(page, '.ci-btn--send', 400);
scene('wait', 'second AI response',
  'Waiting for second response to stream',
  'The AI receives the follow-up and begins streaming its second response — showing the assistant can maintain context across a conversation.',
  3
);
const ai2 = await waitForAI(page);
await sleep(2000);
await screenshot('07-thabo-second-response');
scenes[scenes.length - 1].ai_response = ai2;
scene('ai_response', 'Thabo second response complete',
  'Second response rendered',
  `Thabo continues the conversation naturally. The back-and-forth demonstrates the conversational flow — no long monologues, just helpful dialogue.`,
  8
);
console.log(`   📝 AI: ${ai2.substring(0, 200)}...`);

// ──────────────────────────────────────────────
// 6 — BACK TO HOME
// ──────────────────────────────────────────────
await sleep(6000);
scene('move+click', 'Back button',
  'Navigating back to the homepage',
  'The user clicks the back arrow. A smooth page transition animation plays — the chat fades and slides out as the homepage enters.',
  5
);
await moveAndClick(page, '.ci-back', 600);
await sleep(2500);
await screenshot('08-back-home');

// ──────────────────────────────────────────────
// 7 — CLICK AMARA DLAMINI
// ──────────────────────────────────────────────
scene('move+click', 'Amara Dlamini card',
  'Moving to the second companion',
  'Next we visit Amara Dlamini, the Therapeutic Counsellor. Her card features a warm-toned avatar and the "Wellness" category — a different personality and specialty from Thabo.',
  4
);
await moveAndClick(page, '.professional-card:nth-child(2)', 800);
await sleep(3000);
await screenshot('09-amara-intro');
scene('pause', 'Amara intro popup', 'Amara intro popup shown',
  'Amara\'s intro modal appears — different imagery, different tone. Each companion has a unique greeting and personality.',
  4
);

await moveAndClick(page, '.ci-intro-btn', 500);
await sleep(1500);

// ──────────────────────────────────────────────
// 8 — AMARA SUGGESTION
// ──────────────────────────────────────────────
const chip2 = page.locator('.ci-suggestion-chip').first();
const chip2Text = await chip2.textContent();
await moveAndClick(page, '.ci-suggestion-chip:first-child', 500);
scene('click', `suggestion: "${chip2Text}"`,
  `Clicked Amara suggestion "${chip2Text}"`,
  `Amara receives the "${chip2Text}" prompt. Her response is warm, empathetic, and conversational — showing the distinct personality we designed for each companion.`,
  3
);
const ai3 = await waitForAI(page);
await sleep(2000);
await screenshot('10-amara-response');
scenes[scenes.length - 1].ai_response = ai3;
scene('ai_response', 'Amara response complete',
  'Amara response rendered',
  `Amara responds in her counselling voice — warm, supportive, and inviting. This contrast between companions shows the range of the Charaverse.`,
  8
);
console.log(`   📝 AI: ${ai3.substring(0, 200)}...`);

// ──────────────────────────────────────────────
// 9 — FINAL SHOT
// ──────────────────────────────────────────────
await sleep(6000);
scene('move+click', 'Back button',
  'Returning to the homepage for closing shot',
  'One more back navigation to return to the homepage. The page transition plays again.',
  4
);
await moveAndClick(page, '.ci-back', 600);
await sleep(2500);
await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
await sleep(2000);
await screenshot('11-final-hero');
scene('complete', '',
  'Showcase complete',
  'The Charaverse showcase concludes back at the hero section. All companions are available and ready — each with their own expertise, personality, and conversational style. Powered by Mpela Co.',
  6
);

// ──────────────────────────────────────────────
await sleep(1500);
console.log('\n=== DONE ===');

// Write narration data
const output = {
  title: 'Charaverse — Product Showcase Narration Guide',
  url: URL,
  total_duration_seconds: ((Date.now() - start) / 1000).toFixed(1),
  scenes,
};
writeFileSync(`${OUT}/narration-log.json`, JSON.stringify(output, null, 2));

console.log(`\n📁 Video:     ${await page.video().path()}`);
console.log(`📁 Screens:   ${OUT}/*.png (${scenes.filter(s => s.action === 'pause' || s.action === 'ai_response').length} screenshots)`);
console.log(`📁 Narration: ${OUT}/narration-log.json`);
console.log(`   Total:     ${output.total_duration_seconds}s across ${scenes.length} scenes`);
console.log(`   AI responses captured: ${[ai1, ai2, ai3].filter(Boolean).length}`);

await browser.close();
