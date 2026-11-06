const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isInNrw, parseRow, buildFeed, dateFromGerman, renderRss } = require('../scripts/feed.cjs');
const row = (id='1509803', location='40213 Düsseldorf') => ({ id,
  cells: [id, 'Behörde & <IT>', 'Entwickler*in "Software"', 'A13', 'TV-L E 13', location, 'Hybrid', '05.11.2026', '03.12.2026'],
});

test('NRW postal codes include all regions and reject neighbouring states', () => {
  for (const location of ['40213 Düsseldorf','53127 Bonn','45127 Essen','48143 Münster','33602 Bielefeld','34431 Marsberg','37671 Höxter','57072 Siegen','52062 Aachen']) assert.ok(isInNrw(location), location);
  for (const location of ['10999 Berlin','49074 Osnabrück','57610 Altenkirchen','34454 Bad Arolsen','37691 Boffzen','49808 Lingen','Home Office','Düsseldorf']) assert.equal(isInNrw(location), false, location);
  assert.ok(isInNrw('10999 Berlin; 53127 Bonn'));
});

test('parses both national and radius-search table layouts', () => {
  const normal = parseRow(row());
  const radius = row(); radius.cells.splice(6, 0, '5 km');
  assert.equal(normal.workplace, 'Hybrid');
  assert.equal(normal.posted, '05.11.2026');
  assert.equal(normal.deadline, '03.12.2026');
  assert.equal(normal.distance, '');
  assert.deepEqual(parseRow(radius), { ...normal, distance:'5 km', row_text:radius.cells.join(' | ') });
  assert.throws(() => parseRow({id:'12',cells:[]}), /layout/);
});

test('deduplicates and filters before generating feeds', () => {
  const feed = buildFeed([row(), row(), row('1000000','10999 Berlin')], '2026-11-06T10:00:00Z');
  assert.equal(feed.visible_results, 1);
  assert.equal(feed.source_results, 2);
  assert.equal(feed.jobs[0].url, 'https://www.interamt.de/koop/app/stelle?id=1509803');
});

test('RSS escapes user content, preserves GUIDs and uses source dates', () => {
  const feed = buildFeed([row()], '2026-11-06T10:00:00Z');
  const rss = renderRss(feed, 'https://chrisbgp.github.io/InteramtFeed/');
  assert.match(rss, /Behörde &amp; &lt;IT&gt;/);
  assert.match(rss, /&quot;Software&quot;/);
  assert.match(rss, /<pubDate>Thu, 05 Nov 2026 00:00:00 GMT<\/pubDate>/);
  assert.match(rss, /href="https:\/\/chrisbgp.github.io\/InteramtFeed\/feed.xml"/);
  const guid = rss.match(/<guid.*?<\/guid>/)[0];
  feed.generated_at = '2026-11-07T10:00:00Z';
  assert.ok(renderRss(feed,'https://example.com').includes(guid));
  assert.equal(dateFromGerman('31.02.2026'), null);
  assert.equal(dateFromGerman(''), null);
  feed.jobs[0].posted = '';
  assert.ok(!renderRss(feed,'https://example.com').includes('<pubDate>'));
  assert.ok(!renderRss(buildFeed([]),'https://example.com').includes('<item>'));
});
