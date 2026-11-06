# INTERAMT – IT-Stellen rund um Dortmund

Täglich aktualisierte IT-Stellen im öffentlichen Dienst im Umkreis von **100 km Luftlinie um 44135 Dortmund**, Deutschland.

- **RSS abonnieren:** https://chrisbgp.github.io/InteramtFeed/feed.xml
- [JSON](https://chrisbgp.github.io/InteramtFeed/feed.json) · [Markdown](https://chrisbgp.github.io/InteramtFeed/feed.md)
- [Stellen im Repository](feed.md) · [Workflow / manuell aktualisieren](https://github.com/chrisbgp/InteramtFeed/actions/workflows/interamt-feed.yml)

## Suche

INTERAMT wird mit folgenden Filtern durchsucht:

| Filter | Wert |
| --- | --- |
| Bereich | IT und Telekommunikation |
| Dienstverhältnis | Beamte oder Tarifbeschäftigte |
| Mittelpunkt | 44135 Dortmund |
| Entfernung | 100 km Luftlinie |

Dortmund dient als zentral gelegener Ausgangspunkt für die Suche in NRW. Die Begrenzung ist ein Suchradius, keine Bundeslandgrenze: Orte außerhalb von NRW können enthalten sein, weiter entfernte Teile von NRW fehlen. Die Entfernungen und die Zuordnung zur IT-Kategorie stammen von INTERAMT. Es gibt keine zusätzliche PLZ-Liste und keinen nachträglichen Bundeslandfilter. Gehalt, Abschluss, Arbeitszeit und Dienstort (Homeoffice, hybrid, vor Ort) sind nicht eingeschränkt.

Der Workflow lädt über „mehr laden“ alle Treffer, entfernt doppelte INTERAMT-IDs und erstellt `feed.json`, `feed.md` und `feed.xml`. Bei unvollständiger Erfassung oder unerwartetem Tabellenformat wird der Lauf abgebrochen, bevor die Feeds veröffentlicht werden.

## Eine Workflow-Datei

Installation, Browser-Suche, JSON-/Markdown-/RSS-Erzeugung, XML-Prüfung und Veröffentlichung laufen vollständig in [.github/workflows/interamt-feed.yml](.github/workflows/interamt-feed.yml). Es werden keine separaten Skripte aus dem Repository aufgerufen. Playwright wird in einer festgelegten Version im temporären Verzeichnis des Runners installiert. Ein `package.json` oder eine lokale Datendatei ist nicht erforderlich.

Um den Mittelpunkt oder Radius zu ändern, die Konstante `CENTER` im eingebetteten Node-Code anpassen. Standard: `{ city: 'Dortmund', postal_code: '44135', radius_km: 100 }`. Die drei Werte werden für die Suchmaske und die Feed-Metadaten verwendet.

GitHub Actions aktualisiert die Feeds täglich um **05:45 UTC** (06:45 Uhr Berlin im Winter, 07:45 Uhr im Sommer). Änderungen an der Workflow-Datei starten ebenfalls einen Lauf. Ein manueller Start ist unter **Actions → INTERAMT IT NRW Feed → Run workflow** möglich; bei einer neuen Gabelung müssen Workflows gegebenenfalls zuerst aktiviert werden.

Für die Pages-URLs muss **Settings → Pages → Source: GitHub Actions** aktiviert sein. Der Workflow versucht die Aktivierung automatisch. Alternativ ist die RSS-Datei direkt aus dem Repository abrufbar: https://raw.githubusercontent.com/chrisbgp/InteramtFeed/main/feed.xml

## RSS

`feed.xml` verwendet RSS 2.0 mit direkten Stellenlinks und stabilen GUIDs je INTERAMT-ID. Die Beschreibungen enthalten Arbeitgeber, Standort, Entfernung, Dienstort, Vergütung und Bewerbungsfrist. Das Einstelldatum wird als `pubDate` verwendet (00:00 UTC, da INTERAMT keine Uhrzeit angibt); fehlende oder ungültige Daten werden ausgelassen. Der Feed enthält die aktuell gefundenen Stellen, kein dauerhaftes Archiv.

Quelle der Stellen und Entfernungen: [INTERAMT](https://interamt.de/koop/app/stellensuche).
