const fs = require('node:fs');
const path = require('node:path');
const postcodes = require('../data/nrw-postcodes.json');
const NRW_POSTCODES = new Set(postcodes.postal_codes);
const FEED_TITLE = 'INTERAMT – IT-Stellen in Nordrhein-Westfalen';
const SOURCE_URL = 'https://interamt.de/koop/app/stellensuche';

function isInNrw(location) {
  // Use whole postal codes, not prefixes or a radius crossing state borders.
  return [...location.matchAll(/\b\d{5}\b/g)].some(([code]) => NRW_POSTCODES.has(code));
}

function parseRow({ id, cells: c }) {
  if (!/^\d+$/.test(id) || ![9, 10].includes(c.length)) {
    throw new Error(`Unexpected INTERAMT row layout for ${id}: ${c.length} cells`);
  }
  const hasDistance = c.length === 10;
  if (!c[1] || !c[2] || !c[5]) throw new Error(`Incomplete INTERAMT row: ${id}`);
  return {
    id, url: `https://www.interamt.de/koop/app/stelle?id=${id}`,
    employer: c[1], title: c[2], grade: c[3], pay: c[4], location: c[5],
    distance: hasDistance ? c[6] : '', workplace: c[hasDistance ? 7 : 6],
    posted: c[hasDistance ? 8 : 7], deadline: c[hasDistance ? 9 : 8],
    row_text: c.join(' | '),
  };
}

function dateFromGerman(value) {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value);
  if (!m) return null;
  const date = new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
  return date.getUTCFullYear() === +m[3] && date.getUTCMonth() === +m[2] - 1 &&
    date.getUTCDate() === +m[1] ? date : null;
}

function buildFeed(rows, generatedAt = new Date().toISOString()) {
  const unique = new Map();
  for (const row of rows) {
    const job = parseRow(row);
    if (isInNrw(job.location)) unique.set(job.id, job);
  }
  const jobs = [...unique.values()].sort((a, b) =>
    (dateFromGerman(b.posted)?.getTime() || 0) - (dateFromGerman(a.posted)?.getTime() || 0) ||
    b.id.localeCompare(a.id, 'en', { numeric: true }));
  return {
    source: 'INTERAMT',
    search: {
      country: 'DE', state: 'Nordrhein-Westfalen', state_code: 'DE-NW',
      category: 'IT und Telekommunikation',
      employment_types: ['Beamte', 'Tarifbeschäftigte'],
      location_filter: 'GeoNames postal codes in Nordrhein-Westfalen',
    },
    generated_at: generatedAt, source_results: new Set(rows.map(row => row.id)).size,
    visible_results: jobs.length, jobs,
  };
}

function escapeXml(value) {
  return String(value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
const escapeMd = value => String(value).replace(/[\\`*_{}\[\]<>]/g, '\\$&').replace(/[\r\n]+/g, ' ');

function renderRss(feed, baseUrl) {
  const base = baseUrl.replace(/\/$/, '');
  const items = feed.jobs.map(job => {
    const details = [
      ['Arbeitgeber', job.employer], ['Ort', job.location], ['Dienstort', job.workplace],
      ['Besoldung', job.grade], ['Entgelt', job.pay], ['Eingestellt', job.posted], ['Bewerbungsfrist', job.deadline],
    ].map(([label, value]) => `${label}: ${value || '–'}`).join('\n');
    const date = dateFromGerman(job.posted);
    return `    <item>
      <title>${escapeXml(`${job.title} – ${job.location}`)}</title>
      <link>${escapeXml(job.url)}</link>
      <guid isPermaLink="true">${escapeXml(job.url)}</guid>
      <description>${escapeXml(details)}</description>
      <category>IT und Telekommunikation</category>
      ${date ? `<pubDate>${date.toUTCString()}</pubDate>` : ''}
    </item>`;
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(FEED_TITLE)}</title>
    <link>${escapeXml(`${base}/`)}</link>
    <description>IT-Stellen für Berufstätige im öffentlichen Dienst in Nordrhein-Westfalen, Deutschland. Quelle: INTERAMT.</description>
    <language>de-DE</language>
    <lastBuildDate>${new Date(feed.generated_at).toUTCString()}</lastBuildDate>
    <ttl>1440</ttl>
    <atom:link href="${escapeXml(`${base}/feed.xml`)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
}

function renderMarkdown(feed) {
  let md = `# ${FEED_TITLE}\n\nLetzte Aktualisierung: ${feed.generated_at}\n\n`;
  md += `Treffer in NRW: ${feed.jobs.length} (von ${feed.source_results} IT-Angeboten bundesweit)\n\n`;
  md += `Bereich: IT und Telekommunikation. Dienstverhältnis: Beamte oder Tarifbeschäftigte.\n\n`;
  for (const job of feed.jobs) {
    md += `## [${job.id} – ${escapeMd(job.title)}](${job.url})\n\n`;
    for (const [key, label] of Object.entries({employer:'Arbeitgeber',grade:'Besoldung',pay:'Entgelt',location:'Ort',workplace:'Dienstort',posted:'Eingestellt',deadline:'Bewerbungsfrist'})) {
      md += `- ${label}: ${escapeMd(job[key] || '–')}\n`;
    }
    md += '\n';
  }
  return md;
}

function writeFeeds(feed, baseUrl, outputDir = '.') {
  // Serialize all formats before replacing any previous feed.
  const files = {
    'feed.json': JSON.stringify(feed, null, 2) + '\n',
    'feed.md': renderMarkdown(feed), 'feed.xml': renderRss(feed, baseUrl),
  };
  for (const [name, content] of Object.entries(files)) fs.writeFileSync(path.join(outputDir, name), content);
}
module.exports = { FEED_TITLE, SOURCE_URL, isInNrw, parseRow, dateFromGerman, buildFeed, renderRss, renderMarkdown, writeFeeds };
