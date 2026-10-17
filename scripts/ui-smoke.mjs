#!/usr/bin/env node
// Browser-driven smoke test of the main user journeys against a running server.
// Usage: CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" BASE_URL=http://localhost:3000 node scripts/ui-smoke.mjs
// Run against a development/preview deployment (no AI key = instant preview generation).
import puppeteer from 'puppeteer-core';
const B = process.env.BASE_URL ?? 'http://localhost:3000';
const launch = () => puppeteer.launch({ executablePath: process.env.CHROME_PATH, args: process.env.CHROME_ARGS?.split(' ').filter(Boolean) ?? [], headless: true, defaultViewport: { width: 1366, height: 900 } });
const browser = await launch();
const page = await browser.newPage();
const errors = [];
const log = (m) => console.log(m);
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && !/404|Failed to load resource/.test(m.text()) && errors.push(m.text()));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitText = async (text, timeout = 15000) => page.waitForFunction((t) => document.body.innerText.includes(t), { timeout }, text);
let failed = 0;
async function step(name, fn) { try { await fn(); log(`PASS  ${name}`); } catch (e) { failed++; log(`FAIL  ${name}: ${e.message.split('\n')[0]}`); } }

const email = `ui${Date.now()}@example.com`;
await step('signup form creates account and lands on brief', async () => {
  await page.goto(`${B}/signup?next=%2Fapp%2Fbrief`, { waitUntil: 'load' });
  await page.type('input[name=name]', 'Uma Test');
  await page.type('input[name=email]', email);
  await page.type('input[name=password]', 'a very good passphrase');
  await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), page.click('button[type=submit]')]);
  if (!page.url().includes('/app/brief')) throw new Error(page.url());
});
await step('brief validation blocks empty required fields', async () => {
  await page.click('.wizard-foot .btn-primary');
  await waitText('Add your business name');
});
await step('brief autosaves and moves through steps', async () => {
  await page.type('#brief-name', 'Kettle & Field');
  await page.type('#brief-desc', 'Single-estate loose-leaf tea sourced directly from small farms and shipped with a brewing card for each tea.');
  await waitText('All changes saved');
  await page.click('.wizard-foot .btn-primary');
  await waitText('Who do you sell to?');
  await page.evaluate(() => [...document.querySelectorAll('.choice')].find((c) => c.textContent.includes('Consumers (B2C)')).click());
  await page.click('.wizard-foot .btn-primary');
  await waitText('What stage are you at?');
  await page.evaluate(() => [...document.querySelectorAll('.choice')].find((c) => c.textContent.includes('Pre-launch')).click());
  await page.evaluate(() => [...document.querySelectorAll('.choice')].find((c) => c.textContent.includes('Get our first customers')).click());
  await page.click('.wizard-foot .btn-primary');
  await waitText('Where do you market today?');
  await page.click('.wizard-foot .btn-primary');
  await waitText('Build my strategy');
});
await step('answers survive a reload (autosave + step restore)', async () => {
  await sleep(900);
  await page.reload({ waitUntil: 'load' });
  await waitText('Kettle & Field');
});
await step('generating a strategy shows progress and finishes', async () => {
  await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Build my strategy').click())]);
  await waitText('11 of 11 sections ready', 30000);
  await waitText('This is preview output');
});
await step('editing a section saves and marks it edited', async () => {
  await page.evaluate(() => [...document.querySelectorAll('#sec-context button')].find((b) => b.textContent.includes('Edit')).click());
  await page.waitForSelector('#sec-context textarea');
  await page.evaluate(() => { const ta = document.querySelector('#sec-context textarea'); const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set; set.call(ta, 'Owner-written summary for the tea shop.'); ta.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.evaluate(() => [...document.querySelectorAll('#sec-context button')].find((b) => b.textContent.includes('Save section')).click());
  await waitText('Owner-written summary for the tea shop.');
  await page.waitForFunction(() => document.querySelector('#sec-context')?.innerText.includes('Edited'));
});
await step('regenerating an edited section asks for confirmation', async () => {
  await page.evaluate(() => [...document.querySelectorAll('#sec-context button')].find((b) => b.textContent.includes('Regenerate')).click());
  await waitText('Keep my edits');
  await page.keyboard.press('Escape');
});
await step('share dialog creates a link', async () => {
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Share').click());
  await waitText('Share a read-only link');
  await page.evaluate(() => [...document.querySelectorAll('[role=dialog] button')].find((b) => b.textContent.includes('Create link')).click());
  await waitText('Your new link');
  await page.keyboard.press('Escape');
});
await step('assistant answers a question and applies a suggested revision', async () => {
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Ask').click());
  await page.waitForSelector('.dialog-drawer #assist-input');
  await page.type('#assist-input', 'What should I do first this week?');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelector('.assist-a:not(.assist-pending)'), { timeout: 20000 });
  await page.select('.assist-controls select', 'positioning');
  await page.evaluate(() => [...document.querySelectorAll('.segmented button')].find((b) => b.textContent.includes('Revise')).click());
  await page.type('#assist-input', 'Make it shorter.');
  await page.keyboard.press('Enter');
  await waitText('Apply to section', 20000);
  await page.evaluate(() => [...document.querySelectorAll('.dialog-drawer button')].find((b) => b.textContent.includes('Apply to section')).click());
  await waitText('Revision applied');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('.dialog-drawer'));
  await page.waitForFunction(() => document.querySelector('#sec-positioning')?.innerText.includes('Edited'));
});
await step('experiments go to the action plan and move by keyboard', async () => {
  await page.evaluate(() => document.querySelector('button[aria-label="More actions"]').click());
  await page.evaluate(() => [...document.querySelectorAll('[role=menuitem]')].find((b) => b.textContent.includes('action plan')).click());
  await waitText('to your action plan');
  await page.goto(`${B}/app/plan`, { waitUntil: 'load' });
  await page.waitForSelector('.board-card select');
  const first = await page.$eval('.board-card select', (s) => s.id);
  await page.select(`#${first}`, 'doing');
  await page.waitForFunction(() => document.querySelector('#col-doing')?.textContent.includes('1'));
});
await step('command palette opens with ⌘K and finds the strategy', async () => {
  await page.keyboard.down('Control'); await page.keyboard.press('k'); await page.keyboard.up('Control');
  await page.waitForSelector('.palette input');
  await page.type('.palette input', 'Kettle');
  await waitText('Kettle & Field marketing strategy');
  await page.keyboard.press('Escape');
});
await step('in-app tool is pre-filled from the brief and saves output', async () => {
  await page.goto(`${B}/app/tools/slogan-generator`, { waitUntil: 'load' });
  const v = await page.$eval('#tool-business', (t) => t.value);
  if (!v.includes('Kettle & Field')) throw new Error('not prefilled: ' + v);
  await page.click('.tool-submit .btn-primary');
  await waitText('Slogan options', 15000);
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Save to workspace')).click());
  await waitText('Saved');
});
await step('calculator updates live and shows formulas', async () => {
  await page.goto(`${B}/tools/marketing-budget-calculator`, { waitUntil: 'load' });
  await waitText('Budget for 3 months');
  await page.$eval('#calc-percentOfRevenue', (i) => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, '10'); i.dispatchEvent(new Event('input', { bubbles: true })); });
  await waitText('$12,000');
});
await browser.close();


{
const browser = await launch();
const page = await browser.newPage();
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && !/404|Failed to load resource/.test(m.text()) && errors.push(m.text()));
const waitText2 = async (text, timeout = 15000) => page.waitForFunction((t) => document.body.innerText.includes(t), { timeout }, text);
await step('anonymous visitor can run a tool with an example', async () => {
  await page.goto(`${B}/tools/elevator-pitch-generator`, { waitUntil: 'load' });
  await page.waitForSelector('.tool-examples .chip');
  await page.click('.tool-examples .chip');
  await page.click('.tool-submit .btn-primary');
  await waitText2('Preview output');
  await waitText2('free generations left today');
});
await step('save prompts sign-up and keeps the run', async () => {
  await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Save (free account)')).click())]);
  if (!page.url().includes('/signup?next=')) throw new Error(page.url());
  await page.type('input[name=email]', `anon${Date.now()}@example.com`);
  await page.type('input[name=password]', 'a very good passphrase');
  await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), page.click('button[type=submit]')]);
  await waitText2('Saved to your workspace');
});
await step('mobile menu opens and closes', async () => {
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(`${B}/`, { waitUntil: 'load' });
  await page.click('.mobile-toggle');
  await page.waitForSelector('#site-drawer');
  await page.click('#site-drawer button[aria-label="Close menu"]');
  await page.waitForFunction(() => !document.querySelector('#site-drawer'));
});
await step('keyboard: skip link and focus ring', async () => {
  await page.setViewport({ width: 1366, height: 900 });
  await page.goto(`${B}/pricing`, { waitUntil: 'load' });
  await page.keyboard.press('Tab');
  const active = await page.evaluate(() => document.activeElement?.textContent);
  if (!active?.includes('Skip to content')) throw new Error(`first tab stop: ${active}`);
});
await browser.close();
}
console.log(errors.length ? `Runtime errors:\n${errors.join('\n')}` : 'No runtime errors');
process.exit(failed || errors.length ? 1 : 0);
