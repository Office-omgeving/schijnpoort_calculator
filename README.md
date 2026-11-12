# Schijnpoort-calculator

Zelfstandige statische kopie van de bestaande Schijnpoort-offertebouwer, aangepast voor bezoekers die al een leadformulier hebben ingevuld.

Huidige online versie: https://schijnpoort-calculator-review.development802324.chatgpt.site/

## Gedrag

- Start direct bij de aantallen ramen en deuren; geen keuze voor zelf opmeten of bellen.
- Drie stappen: ramen/deuren → woningvragen → totale richtprijs.
- Geen tweede contactregistratie.
- Alleen een totale indicatieve prijsvork excl. btw, zonder detailprijzen, kostenopbouw of premieblokken.
- Prijsvork per producttype: vaste prijs van Igor (Schijnpoort) als middelpunt, ondergrens −10%, bovengrens +10% (Wannes, Wrike 11/11/2026). Bedragen worden getoond in hele euro's, met centen alleen waar nodig (bv. € 1.084,50).
- Op mobiel blijven de actieknoppen onderaan zichtbaar. Snel tikken op plus/min activeert geen dubbel-tikzoom; zoomen met twee vingers blijft mogelijk.
- **Gratis advies aan huis** opent https://schijnpoort.be/contact.
- **Opnieuw berekenen** brengt de bezoeker terug naar de productselectie met behoud van de gekozen aantallen.

## Lokaal openen

Er is geen installatie of build nodig. Start vanuit de hoofdmap een statische webserver:

```sh
python3 -m http.server 8000
```

Open vervolgens http://localhost:8000.

## Hosten

Publiceer de hoofdmap als statische website. Er is geen backend of buildcommando nodig. `index.html` is de startpagina. De `.openai`-hostingconfiguratie van de bestaande Sites-publicatie hoort niet bij deze repo.

Gebruik de uiteindelijke URL als bestemming na het bestaande formulier of als link in de opvolging. Bij verhuizen naar een andere host kan `siteUrl` in `config.js` worden aangepast; de huidige calculator gebruikt dit veld niet voor doorverwijzingen of API-verzoeken.

Een GitHub-push publiceert de bestaande Sites-versie niet automatisch; die publicatie heeft een eigen bronrepository en deploymentproces.

## Bestanden

| Bestand | Functie |
| --- | --- |
| `index.html` | Originele schermstructuur en advieslink |
| `styles.css` | Overgenomen Schijnpoort-vormgeving |
| `standalone.css` | Aanpassingen voor klantresultaat en mobiel |
| `script.js` | Prijsberekening en stappen |
| `config.js` | Snelle route, titel en schrijnwerkmarge |
| `assets/window-door-elements/` | Acht originele productafbeeldingen |
| `tests/pricing.mjs` | Onafhankelijke vergelijking met de sheetregels |
| `tests/fixtures/prices-from-sheet.json` | Uitgelezen relevante tabbladen uit de aangeleverde Excel |

## Prijzen en aannames

Bron: prijzen van Igor (Schijnpoort), doorgegeven door Wannes in Wrike op 11 november 2026. Ze vervangen de eerdere sheetberekening (sheetprijs als bovengrens, −15%, 6% of 21% btw).

| Type | Maat (informatief) | Middelpunt excl. btw | Vork excl. btw |
| --- | --- | --- | --- |
| Vast raam | 1500 × 1500 mm | € 1.010 | € 909 – € 1.111 |
| Draai/kiepraam | 1000 × 1500 mm | € 900 | € 810 – € 990 |
| Dubbel raam | 1800 × 1500 mm | € 1.205 | € 1.084,50 – € 1.325,50 |
| Drievoudig raam | 2500 × 1500 mm | € 1.575 | € 1.417,50 – € 1.732,50 |
| Deur | 1000 × 2200 mm | € 1.510 | € 1.359 – € 1.661 |
| Deur met zijlicht | 1600 × 2200 mm | € 2.370 | € 2.133 – € 2.607 |
| Schuifraam | 2500 × 2200 mm | € 3.420 | € 3.078 – € 3.762 |
| Garagepoort (alu sectionaal, elektrisch) | 2600 × 2200 mm | € 2.450 | € 2.205 – € 2.695 |

Bij meerdere elementen worden de middelpunten opgeteld (× aantal) en wordt op het totaal −10% / +10% genomen. Onder de prijs staat: "Allemaal inclusief standaard witte kleur PVC dubbel glas, hoogrendementsbeglazing + veiligheidsglas, afbraak, plaatsing, siliconeren, afwerking binnen (MDF) en alles excl. btw." De woningvraag (ouder/jonger dan 10 jaar) blijft als leadinformatie, maar heeft geen invloed op de prijs. De sheetfuncties staan nog in `script.js` maar bepalen de klantprijs niet meer.

## Controles

Node.js 18 of nieuwer volstaat; er zijn geen npm-afhankelijkheden:

```sh
npm test
npm run check
```

De prijscontrole toetst per producttype het middelpunt, de vork bij aantallen 1/2/5 (met elk antwoord op de woningvraag), de getoonde bedragen tegen Wannes' vorken, een gemengd project en een lege selectie: 227 controles.

## Gegevens en koppelingen

Projectkeuzes worden lokaal in de browser bewaard. Er zijn geen mail-, CRM- of afspraak-API’s aangesloten en er wordt niets automatisch verzonden. De oorspronkelijke code bevat nog ongebruikte schermen en functies voor de uitgebreide bouwer; de configuratie toont uitsluitend de snelle route.

Google Fonts levert het lettertype. De optionele taalwisselaar kan Google Translate laden. De oorspronkelijke analytics- en afspraak-scripts zijn niet opgenomen.
