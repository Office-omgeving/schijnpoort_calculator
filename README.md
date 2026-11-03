# Schijnpoort-calculator

Zelfstandige statische kopie van de bestaande Schijnpoort-offertebouwer, aangepast voor bezoekers die al een leadformulier hebben ingevuld.

Huidige online versie: https://schijnpoort-calculator-review.development802324.chatgpt.site/

## Gedrag

- Start direct bij de aantallen ramen en deuren; geen keuze voor zelf opmeten of bellen.
- Drie stappen: ramen/deuren → woningvragen → totale richtprijs.
- Geen tweede contactregistratie.
- Alleen een totale indicatieve prijsvork inclusief btw, zonder detailprijzen, kostenopbouw of premieblokken.
- Ondergrens: 85% van de berekende totaalprijs. Bovengrens: 100%. Voor weergave wordt naar buiten afgerond op hele euro’s.
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

Bron: `Offertebouwer_berekeningen.xlsx`, gelezen op 3 november 2026. De tarieven en formules komen uit **Schrijnwerk**, **Diensten** en **Overzicht**. Er wordt gerekend zonder de extra maatcorrectie uit de oorspronkelijke website. De algemene factor 1,10 uit de sheet wordt ook bij de poort toegepast.

De snelle calculator gebruikt standaardmaten uit de oorspronkelijke offertebouwer:

| Type | Standaardmaat |
| --- | --- |
| Vast raam | 1100 × 1400 mm |
| Draai/kiepraam | 1200 × 1450 mm |
| Dubbel raam | 2200 × 1450 mm |
| Drievoudig raam | 3300 × 1450 mm |
| Deur | 1000 × 2200 mm |
| Deur met zijlicht | 1600 × 2200 mm |
| Schuifraam | 3600 × 2200 mm |
| Garagepoort | 2600 × 2200 mm |

Uitgangspunten zijn wit PVC, dubbel glas en MDF-afwerking, inclusief demontage, recyclage, plaatsing en siliconeren. Dubbel en drievoudig raam worden als één volledig draai/kiepraam van de totale maat geprijsd. De deur met zijlicht gebruikt de volledige maat voor de raamtoeslag. Bij de poort wordt ook MDF gerekend.

Deze configuraties zijn aannames uit de oorspronkelijke bouwer, geen afzonderlijk goedgekeurde productconfiguraties in de sheet. Schijnpoort moet ze nog bevestigen. De marge van −15% is een ingestelde commerciële bandbreedte, geen statistisch onderbouwde afwijkingsmarge. De woningvraag kiest 6% of 21% voor de indicatie; de definitieve fiscale toepasselijkheid moet worden bevestigd.

## Controles

Node.js 18 of nieuwer volstaat; er zijn geen npm-afhankelijkheden:

```sh
npm test
npm run check
```

De prijscontrole vergelijkt zes kostenposten per producttype, aantallen 1/2/5 bij beide btw-tarieven en een gemengd project: 97 vergelijkingen. De bovengrens wordt eveneens gecontroleerd op 100% van de berekende totaalprijs. Dit bevestigt de rekenkundige aansluiting onder de beschreven standaardconfiguraties.

## Gegevens en koppelingen

Projectkeuzes worden lokaal in de browser bewaard. Er zijn geen mail-, CRM- of afspraak-API’s aangesloten en er wordt niets automatisch verzonden. De oorspronkelijke code bevat nog ongebruikte schermen en functies voor de uitgebreide bouwer; de configuratie toont uitsluitend de snelle route.

Google Fonts levert het lettertype. De optionele taalwisselaar kan Google Translate laden. De oorspronkelijke analytics- en afspraak-scripts zijn niet opgenomen.
