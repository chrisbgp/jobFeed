# INTERAMT – IT-Stellen in Nordrhein-Westfalen

Täglich aktualisierter Feed für IT-Fachkräfte im öffentlichen Dienst in **Nordrhein-Westfalen, Deutschland**.

- **RSS abonnieren:** https://chrisbgp.github.io/InteramtFeed/feed.xml
- [JSON](https://chrisbgp.github.io/InteramtFeed/feed.json) · [Markdown](https://chrisbgp.github.io/InteramtFeed/feed.md)
- [Aktuelle Stellen im Repository](feed.md) · [Workflow / manuell aktualisieren](https://github.com/chrisbgp/InteramtFeed/actions/workflows/interamt-feed.yml)

## Auswahl der Stellen

Der Scraper wählt auf INTERAMT den Bereich **IT und Telekommunikation** und die Dienstverhältnisse **Beamte** und **Tarifbeschäftigte**. Er lädt die vollständige bundesweite Trefferliste über „mehr laden“ und übernimmt Angebote mit mindestens einer NRW-Postleitzahl im angezeigten Standort. Es gibt keinen Radius um eine einzelne Stadt und keine Einschränkung nach Gehalt, Abschluss, Arbeitszeit oder Homeoffice.

Die Zuordnung zu NRW verwendet die in [data/nrw-postcodes.json](data/nrw-postcodes.json) gespeicherten vollständigen Postleitzahlen. Dadurch werden Nachbarländer nicht pauschal durch PLZ-Präfixe oder einen Suchradius eingeschlossen. Stellen ohne auswertbare NRW-PLZ (z. B. nur „bundesweit“ oder „Home Office“) werden nicht aufgenommen. Bei mehreren Standorten muss eine NRW-PLZ sichtbar sein. Die Einordnung als IT-Stelle folgt der Kategorie des Arbeitgebers auf INTERAMT; falsch kategorisierte oder nur im Beschreibungstext erwähnte Standorte können damit nicht erkannt werden. Ausbildungsangebote werden nicht gezielt gesucht; die Dienstverhältnis-Einstufung stammt ebenfalls von INTERAMT.

## RSS

`feed.xml` ist RSS 2.0 in UTF-8 mit direkten Stellenlinks, stabilen GUIDs je INTERAMT-ID und Arbeitgeber, Ort, Vergütung, Dienstort und Bewerbungsfrist in der Beschreibung. `pubDate` verwendet das auf INTERAMT angezeigte Einstelldatum (00:00 UTC, da keine Uhrzeit angegeben wird). Fehlende oder ungültige Daten werden ausgelassen. Der Feed enthält die aktuell gefundenen Stellen, kein dauerhaftes Archiv. Bereits gelesene Einträge werden über ihre GUID wiedererkannt.

GitHub Actions aktualisiert JSON, Markdown und RSS täglich um **05:45 UTC** (06:45 Uhr Berlin im Winter, 07:45 Uhr im Sommer). Ein manueller Lauf ist unter **Actions → INTERAMT IT NRW Feed → Run workflow** möglich. Änderungen am Scraper lösen ebenfalls einen Lauf aus. Bei fehlerhafter oder unvollständiger Erfassung schlägt der Lauf fehl, bevor die bisherigen Feeds ersetzt oder veröffentlicht werden.

Für die Pages-URLs muss GitHub Pages unter **Settings → Pages → Source: GitHub Actions** aktiviert sein. Der Workflow versucht die Aktivierung automatisch. Die RSS-Datei ist alternativ direkt aus dem Repository abrufbar: https://raw.githubusercontent.com/chrisbgp/InteramtFeed/main/feed.xml

## Lokal ausführen

Voraussetzungen: Node.js 22+, npm und Python 3 für die zusätzliche XML-Prüfung im Workflow.

```sh
npm ci
npx playwright install chromium --with-deps
npm test
npm run update-feed
```

Mit `FEED_BASE_URL` kann die öffentliche Basis-URL geändert werden. Ohne diese Variable wird `https://chrisbgp.github.io/InteramtFeed` verwendet. Der Workflow leitet sie aus dem Repositorynamen ab. Ein Lauf braucht Internetzugang zu INTERAMT. Die PLZ-Liste ist bereits enthalten und erfordert keinen weiteren Geodaten-Dienst zur Laufzeit.

## Datenquellen

Stellenanzeigen: [INTERAMT](https://www.interamt.de/koop/app/stellensuche), einschließlich der Verlinkung zur vollständigen Originalanzeige.

PLZ-Zuordnung: [GeoNames, Deutschland-Postleitzahlen](https://download.geonames.org/export/zip/DE.zip), abgerufen am 6. November 2026, Bundesland-Code `NW`. © [GeoNames](https://www.geonames.org/), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Die Liste lässt sich bei Änderungen aus den eindeutigen PLZ der TSV-Zeilen mit Bundesland-Code `NW` neu erzeugen.
