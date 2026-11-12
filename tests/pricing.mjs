// Toetst de prijsvorken van de snelle calculator aan het bericht van Wannes (Wrike, 11/11/2026):
// prijs van Igor = middelpunt, vork = middelpunt -10% / +10%, alles excl. btw.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const src = fs.readFileSync('script.js', 'utf8');

// Onafhankelijke verwachting: letterlijk overgenomen uit Wannes' bericht (middelpunt en vork).
const expected = {
  'fixed-window':        { mid: 1010, low: '€ 909',      high: '€ 1.111' },
  'single-window':       { mid: 900,  low: '€ 810',      high: '€ 990' },
  'double-window':       { mid: 1205, low: '€ 1.084,50', high: '€ 1.325,50' },
  'triple-window':       { mid: 1575, low: '€ 1.417,50', high: '€ 1.732,50' },
  'single-door':         { mid: 1510, low: '€ 1.359',    high: '€ 1.661' },
  'door-with-sidelight': { mid: 2370, low: '€ 2.133',    high: '€ 2.607' },
  'sliding-window':      { mid: 3420, low: '€ 3.078',    high: '€ 3.762' },
  'garage-door':         { mid: 2450, low: '€ 2.205',    high: '€ 2.695' }
};
const note = 'Allemaal inclusief standaard witte kleur PVC dubbel glas, hoogrendementsbeglazing + veiligheidsglas, afbraak, plaatsing, siliconeren, afwerking binnen (MDF) en alles excl. btw.';

const names = ['effectiveItemDimensionsCm','isWindowDoorType','areaInM2','perimeterInLm','finishingPerimeterLm','isAluminiumSystem','isTripleWeightSystem','windowFormulaBasePrice','colorMultiplier','openingMultiplier','glassPriceMultiplier','elementUnitBasePrice','legacyElementUnitPrice','elementUnitBaseCost','elementUnitPrice','linePrice','effectiveFinishing','finishingEntriesForItem','mdfFinishingTier','pvcFinishingTier','plasterFinishingTier','shutterUnitPrice','formulaWeightKg','itemWeightKg','pickTierByWeight','montageTierForItem','itemDirectCostParts','simpleItemSpec','simpleItemUnitBreakdown','simpleElementTypeBreakdown','formatSimpleRange','calculateSimpleEstimate','formatCustomerEuro','customerPriceBounds'];
const funcs = names.map((name) => {
  const m = src.match(new RegExp('^function ' + name + '\\([^]*?^}', 'm'));
  assert.ok(m, name);
  return m[0];
}).join('\n');
const constants = src.slice(src.indexOf('const MIN_ITEM_DIMENSION_MM'), src.indexOf('const clientForm'));
const typesSource = src.slice(src.indexOf('const simpleElementTypes = ['), src.indexOf('function simpleElementQuantityField'));
const context = vm.createContext({});
vm.runInContext(fs.readFileSync('config.js', 'utf8').replace('window.QUOTE_BUILDER_CONFIG', 'globalThis.config'), context);
vm.runInContext('const quoteBuilderConfig=config;function isFacadeRenovationActive(){return false}function sealantRatePerLm(){return 7}function formatCurrency(n){return Number(n).toFixed(2)}function currentSimpleSelection(){return globalThis.selection}function simpleSupportBreakdown(){return {combinedRows:[],premiumRows:[],loanRows:[]}}function simpleSupportIncomeNote(){return ""}\n' + constants + '\n' + typesSource + '\n' + funcs + '\nglobalThis.SIMPLE_INCLUSIONS_NOTE=SIMPLE_INCLUSIONS_NOTE;globalThis.simpleMidpointPrices=simpleMidpointPrices;', context);

const types = vm.runInContext('simpleElementTypes', context);
const euro = (v) => vm.runInContext(`formatCustomerEuro(${v})`, context).replace(/ /g, ' ');
const close = (a, b) => Math.abs(a - b) < 1e-6;
let checks = 0;

assert.equal(JSON.stringify(types.map((t) => t.key).sort()), JSON.stringify(Object.keys(expected).sort()), 'zelfde 8 producttypes');
assert.equal(context.SIMPLE_INCLUSIONS_NOTE, note); checks++;

for (const type of types) {
  const e = expected[type.key];
  assert.equal(context.simpleMidpointPrices[type.key], e.mid, `middelpunt ${type.key}`); checks++;
  for (const oldHouse of [true, false, null]) for (const qty of [1, 2, 5]) {
    context.selection = { modules: { items: true }, oldHouse, elementQuantities: { [type.key]: qty } };
    const est = vm.runInContext('calculateSimpleEstimate()', context);
    assert.equal(est.vatRate, 0, 'geen btw meer'); 
    assert.ok(close(est.totalLowInclRaw, e.mid * qty * 0.9), `${type.key} x${qty} laag`);
    assert.ok(close(est.totalHighInclRaw, e.mid * qty * 1.1), `${type.key} x${qty} hoog`);
    context.lo = est.totalLowInclRaw; context.hi = est.totalHighInclRaw;
    const b = vm.runInContext('customerPriceBounds(lo, hi)', context);
    assert.ok(close(b.lower, est.totalLowInclRaw) && close(b.upper, est.totalHighInclRaw));
    if (qty === 1) {
      assert.equal(euro(b.lower), e.low, `${type.key} getoonde ondergrens`);
      assert.equal(euro(b.upper), e.high, `${type.key} getoonde bovengrens`);
    }
    checks += 3;
  }
}

// Gemengd project: 1 van elk type t.e.m. 8 van het laatste.
context.selection = { modules: { items: true }, oldHouse: false, elementQuantities: Object.fromEntries(types.map((t, i) => [t.key, i + 1])) };
const mixed = vm.runInContext('calculateSimpleEstimate()', context);
const mixedMid = types.reduce((s, t, i) => s + expected[t.key].mid * (i + 1), 0);
assert.ok(close(mixed.totalLowInclRaw, mixedMid * 0.9) && close(mixed.totalHighInclRaw, mixedMid * 1.1), 'gemengd project'); checks++;

// Geen selectie: 0.
context.selection = { modules: { items: true }, oldHouse: false, elementQuantities: {} };
const empty = vm.runInContext('calculateSimpleEstimate()', context);
assert.equal(empty.totalHighInclRaw, 0); checks++;

console.log(`PASS: ${checks} controles; 8 types, aantallen 1/2/5, leeftijd woning zonder invloed, getoonde vorken = Wannes, gemengd project.`);
