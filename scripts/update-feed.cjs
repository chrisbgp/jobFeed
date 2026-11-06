const { chromium } = require('playwright');
const { SOURCE_URL, buildFeed, writeFeeds } = require('./feed.cjs');

async function collectRows(page) {
  await page.getByRole('table').waitFor();
  const heading = await page.getByRole('heading', { level: 1 }).innerText();
  const match = heading.match(/([\d.]+)\s+Angebote?/);
  if (!match) throw new Error(`Cannot read result count: ${heading}`);
  const expected = Number(match[1].replace(/\./g, ''));
  if (expected > 5000) throw new Error(`Unexpectedly large result count: ${expected}`);
  const readRows = () => page.locator('table tbody tr').evaluateAll(trs => trs.flatMap(tr => {
    const cells = [...tr.querySelectorAll('td')].map(td => td.innerText.trim().replace(/\s+/g, ' '));
    const id = cells[0]?.match(/^(\d+)\b/)?.[1];
    return id ? [{ id, cells }] : [];
  }));
  let rows = await readRows();
  const unique = new Map(rows.map(row => [row.id, row]));
  for (let step = 0; unique.size < expected; step++) {
    if (step >= 500) throw new Error('Pagination safety limit reached');
    const more = page.getByRole('button', { name: 'mehr laden', exact: true });
    if (!await more.isVisible()) throw new Error(`Incomplete results: ${unique.size}/${expected}`);
    const before = rows.length;
    await more.click();
    await page.waitForFunction(previous => {
      const rows = [...document.querySelectorAll('table tbody tr')].filter(tr => /^\d+\b/.test(tr.innerText.trim()));
      return rows.length > previous;
    }, before, { timeout: 30000 });
    rows = await readRows();
    const oldSize = unique.size;
    for (const row of rows) unique.set(row.id, row);
    if (unique.size <= oldSize) throw new Error('Pagination did not add new jobs');
  }
  if (unique.size !== expected) throw new Error(`Result count changed: ${unique.size}/${expected}; retry the run`);
  return [...unique.values()];
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1400 } });
    page.setDefaultTimeout(30000);
    await page.goto(SOURCE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const cookieButton = page.getByRole('button', { name: 'Cookies akzeptieren', exact: true });
    if (await cookieButton.isVisible()) await cookieButton.click();
    // Accessible names are assigned after the site's initial JS setup.
    // Choose by the visible adjacent label, avoiding volatile Wicket IDs/values.
    for (const label of ['IT und Telekommunikation', 'Beamte', 'Tarifbeschäftigte']) {
      const input = page.locator('input[type="checkbox"]').filter({ visible: true });
      const id = await input.evaluateAll((elements, text) => {
        const matches = elements.filter(e => e.parentElement.innerText.trim() === text);
        if (matches.length !== 1) throw new Error(`Cannot uniquely locate checkbox: ${text}`);
        return matches[0].id;
      }, label);
      await page.locator(`[id="${id}"]`).check();
      if (label === 'Beamte') await page.getByRole('group', { name: 'Parameter Beamte', exact: true }).waitFor();
      if (label === 'Tarifbeschäftigte') await page.getByRole('group', { name: 'Parameter Tarifbeschäftigte', exact: true }).waitFor();
    }
    await page.locator('input[name="stellensucheFilterAttributes.plzDistance:PLZ"]').fill('');
    await page.locator('input[name="stellensucheFilterAttributes.plzDistance:stellensucheFilterAttributes.maxEntfernung"]').fill('');
    await page.getByRole('button', { name: 'Detailsuche', exact: true }).click();
    const rows = await collectRows(page);
    const feed = buildFeed(rows);
    // A national empty result probably indicates a broken filter/site, not zero IT jobs.
    if (!rows.length) throw new Error('No national IT results; keeping previous feeds');
    const baseUrl = process.env.FEED_BASE_URL || 'https://chrisbgp.github.io/InteramtFeed';
    writeFeeds(feed, baseUrl);
    console.log(`Created feeds: ${feed.jobs.length} NRW jobs from ${rows.length} national IT offers`);
  } finally {
    await browser.close();
  }
}
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { collectRows, main };
