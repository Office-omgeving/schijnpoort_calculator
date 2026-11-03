const quoteBuilderConfig = window.QUOTE_BUILDER_CONFIG || {};
const forcedMeasurementMode = ["simple", "self", "appointment"].includes(
  String(quoteBuilderConfig.forcedMeasurementMode || "").toLowerCase()
)
  ? String(quoteBuilderConfig.forcedMeasurementMode).toLowerCase()
  : "";
const showPricesImmediately = quoteBuilderConfig.showPricesImmediately === true;

if (quoteBuilderConfig.siteTitle) {
  document.title = String(quoteBuilderConfig.siteTitle);
}

const facadeRates = {
  area: {
    "10": 190,
    "12": 200,
    "14": 210
  },
  windowLm: 85,
  gutter: 300,
  downpipe: 250,
  sillAlu: 100,
  sillStone: 300,
  plinthStone: 400,
  plinthCrepi: 250
};

const roofRates = {
  systems: {
    "flat-epdm": 145,
    "flat-roofing": 130,
    "sloped-tiles": 175,
    "sloped-slate": 195,
    "plat-epdm": 145,
    "plat-bitumen": 130,
    "hellend-pannen": 175,
    "hellend-leien": 195
  },
  structureReplacement: 90,
  insulation: 45,
  gutterLm: 45,
  upstandLm: 35,
  solarPanels: 4500,
  homeBattery: 5500
};

const supportRules2026 = {
  incomeExtraPerDependent: 4420,
  single: {
    category4Max: 24750,
    category3Max: 43240,
    category2Max: 55020
  },
  family: {
    category4Max: 37110,
    category3Max: 60520,
    category2Max: 78610
  },
  premium: {
    items: {
      category4: { rate: 0.5, invoiceCap: 10500, max: 5250 },
      category3: { rate: 0.35, invoiceCap: 10500, max: 3675 }
    },
    facade: {
      category4: { rate: 0.5, invoiceCap: 10000, max: 5000 },
      category3: { rate: 0.35, invoiceCap: 10000, max: 3500 }
    },
    roof: {
      category4: { rate: 0.5, invoiceCap: 11500, max: 5750 },
      category3: { rate: 0.35, invoiceCap: 11500, max: 4025 }
    }
  },
  loan: {
    min: 4000,
    max: 60000,
    maxYears: 25,
    rates: {
      category4: 0,
      category3: 0.005,
      category2: 0.015
    }
  }
};

const itemTypeLabels = {
  raam: "Raam",
  schuifraam: "Schuifraam",
  deur: "Deur",
  "deur-zijlicht": "Deur + zijlicht",
  "deur-element": "Deur + koppeling",
  "deur-dubbel": "Dubbele deur",
  poort: "Poort"
};

const finishingLabels = {
  none: "Geen",
  mdf: "MDF",
  pleister: "Pleister",
  pvc: "PVC"
};

const colorLabels = {
  standard: "Standaard",
  single: "Kleur 1 kant",
  double: "Kleur 2 kanten"
};

const openingLabels = {
  vast: "Vast",
  draaikiep: "Draai/kiep"
};

function itemDisplayTypeLabel(item) {
  if (item?.type === "raam") {
    return item?.opening === "draaikiep" ? "Draai/kiep raam" : "Vast raam";
  }
  return itemTypeLabels[item?.type] || item?.type || "Element";
}

const glassLabels = {
  pvc_double: "PVC Isolatie (dubbelglas)",
  pvc_triple: "PVC Hoogrendement (driedubbelglas)",
  alu_double: "Aluminium Isolatie (dubbelglas)",
  alu_triple: "Aluminium Hoogrendement (driedubbelglas)",
  alu_passive: "Aluminium Passief (energieneutraal)",
  panel: "Geïsoleerd paneel"
};

const facadeFinishLabels = {
  crepi: "Crepi (sierpleister)",
  steenstrips: "Steenstrips"
};

const insulationLabels = {
  "10": "10 cm",
  "12": "12 cm",
  "14": "14 cm"
};

const shutterLabels = {
  none: "Geen",
  rolluik: "Rolluik",
  zonnewering: "Zonnewering"
};

const roofTypeLabels = {
  flat: "Plat dak",
  sloped: "Schuin dak",
  plat: "Plat dak",
  hellend: "Schuin dak"
};

const roofSystemLabels = {
  "flat-epdm": "EPDM",
  "flat-roofing": "Roofing",
  "sloped-tiles": "Dakpannen",
  "sloped-slate": "Leien",
  "plat-epdm": "EPDM",
  "plat-bitumen": "Roofing",
  "hellend-pannen": "Dakpannen",
  "hellend-leien": "Leien"
};

const roofSolarLabels = {
  none: "Geen zonnepanelen",
  panels: "Zonnepanelen",
  "panels-battery": "Zonnepanelen met batterij"
};

const roofInsulationLabels = {
  none: "Geen isolatie",
  "mineral-wool": "Minerale wol",
  pu: "PU"
};

const storageKey = "schijnpoortStandaloneQuoteV1";
const MIN_ITEM_DIMENSION_MM = 350;
const SHUTTER_RATE_PER_LM = 350;
const SILICONE_RATE_PER_LM = 7;
const ZWELBAND_RATE_PER_LM = 6;
const RECYCLING_RATE_PER_1000KG = 350;
const ELEMENT_BASE_DISCOUNT_FACTOR = 0.95;
const WINDOW_DOOR_BASE_PRICE_MULTIPLIER = 1.1;
// Instelbaar prijsmodel voor schrijnwerk. Bij 35% marge is de verkoopprijs
// exact 75% van het vorige prijsmodel. De basisprijs blijft stabiel wanneer
// CARPENTRY_MARGIN_RATE later wordt aangepast.
const configuredCarpentryMarginRate = Number(quoteBuilderConfig.carpentryMarginRate);
const CARPENTRY_MARGIN_RATE = Number.isFinite(configuredCarpentryMarginRate)
  ? configuredCarpentryMarginRate
  : 0.35;
const CARPENTRY_BASE_FROM_LEGACY_FACTOR = 0.75 / 1.35;

const demontageTiers = [
  { key: "dem-0-100", label: "Tot 100 kg", maxKg: 100, rate: 80, order: 10 },
  { key: "dem-100-150", label: "100 tot 150 kg", maxKg: 150, rate: 100, order: 20 },
  { key: "dem-150-200", label: "150 tot 200 kg", maxKg: 200, rate: 110, order: 30 },
  { key: "dem-200-300", label: "200 tot 300 kg", maxKg: 300, rate: 170, order: 40 },
  { key: "dem-300-400", label: "300 tot 400 kg", maxKg: 400, rate: 320, order: 50 },
  { key: "dem-400-plus", label: "400 kg en meer", maxKg: Infinity, rate: 400, order: 60 }
];

const windowMontageTiers = [
  { key: "mont-raam-0-100", label: "Ramen tot 100 kg", maxKg: 100, rate: 175, order: 10 },
  {
    key: "mont-raam-100-150",
    label: "Ramen 100 tot 150 kg",
    maxKg: 150,
    rate: 220,
    order: 20
  },
  {
    key: "mont-raam-150-200",
    label: "Ramen 150 tot 200 kg",
    maxKg: 200,
    rate: 250,
    order: 30
  },
  {
    key: "mont-raam-200-300",
    label: "Ramen 200 tot 300 kg",
    maxKg: 300,
    rate: 370,
    order: 40
  },
  {
    key: "mont-raam-300-plus",
    label: "Ramen 300 kg en meer",
    maxKg: Infinity,
    rate: 480,
    order: 50
  }
];

const slidingMontageTiers = [
  {
    key: "mont-schuif-0-200",
    label: "Schuiframen tot 200 kg",
    maxKg: 200,
    rate: 370,
    order: 110
  },
  {
    key: "mont-schuif-200-400",
    label: "Schuiframen 200 tot 400 kg",
    maxKg: 400,
    rate: 570,
    order: 120
  },
  {
    key: "mont-schuif-400-plus",
    label: "Schuiframen 400 tot 600 kg",
    maxKg: 600,
    rate: 750,
    order: 130
  },
  {
    key: "mont-schuif-600-plus",
    label: "Schuiframen 600 kg en meer",
    maxKg: Infinity,
    rate: 900,
    order: 140
  }
];

const fixedMontageRates = {
  deur: { key: "mont-deur", label: "Enkele deur", rate: 260, order: 210 },
  "deur-zijlicht": { key: "mont-deur-zijlicht", label: "Enkele deur (met zijlicht)", rate: 320, order: 215 },
  "deur-dubbel": { key: "mont-deur-dubbel", label: "Dubbele deur", rate: 385, order: 220 },
  "deur-element": {
    key: "mont-deur-element",
    label: "Deur met koppeling met andere elementen",
    rate: 550,
    order: 230
  },
  poort: { key: "mont-poort", label: "Plaatsing sectionale poort", rate: 680, order: 240 }
};

const clientForm = document.getElementById("client-form");
const itemForm = document.getElementById("item-form");
const itemsPanel = document.getElementById("items-panel");
const facadePanel = document.getElementById("facade-panel");
const roofPanel = document.getElementById("roof-panel");
const wizardProgressEl = document.getElementById("wizard-progress");
const wizardProgressShellEl = wizardProgressEl ? wizardProgressEl.parentElement : null;
const wizardProgressHomeMarker = document.createComment("wizard-progress-home");
if (wizardProgressShellEl && wizardProgressShellEl.parentNode) {
  wizardProgressShellEl.parentNode.insertBefore(wizardProgressHomeMarker, wizardProgressShellEl);
}
const wizardBackButton = document.getElementById("wizard-back");
const wizardNextButton = document.getElementById("wizard-next");
const wizardControlsEl = document.getElementById("wizard-controls");
const wizardSteps = Array.from(document.querySelectorAll(".wizard-step"));
const termsActionLabelEl = document.getElementById("terms-action-label");

const typeField = document.getElementById("item-type");
const glassField = document.getElementById("item-glass");
const finishingField = document.getElementById("item-finishing");
const colorField = document.getElementById("item-color");
const openingField = document.getElementById("item-opening");
const widthField = document.getElementById("item-width");
const heightField = document.getElementById("item-height");
const shutterField = document.getElementById("item-shutter");
const itemDimensionHintEl = document.getElementById("item-dimension-hint");
const itemDraftTotalEl = document.getElementById("item-draft-total-value");
const itemDraftTotalNoteEl = document.getElementById("item-draft-total-note");

const itemsBody = document.getElementById("items-body");
const facadeForm = document.getElementById("facade-form");
const facadeFinishField = document.getElementById("facade-finish");
const facadeInsulationField = document.getElementById("facade-insulation");
const facadeWidthField = document.getElementById("facade-width");
const facadeHeightField = document.getElementById("facade-height");
const facadeElementSelectField = document.getElementById("facade-element-select");
const facadeElementQtyField = document.getElementById("facade-element-qty");
const facadeElementSillsField = document.getElementById("facade-element-sills");
const facadeOpeningWidthField = document.getElementById("facade-opening-width");
const facadeOpeningHeightField = document.getElementById("facade-opening-height");
const facadeCustomSillsField = document.getElementById("facade-custom-sills");
const facadeAddLinkedOpeningButton = document.getElementById("facade-add-linked-opening");
const facadeAddCustomOpeningButton = document.getElementById("facade-add-custom-opening");
const facadeOpeningsListEl = document.getElementById("facade-openings-list");
const facadeBody = document.getElementById("facade-body");
const facadeDraftTotalEl = document.getElementById("facade-draft-total-value");
const facadeDraftTotalNoteEl = document.getElementById("facade-draft-total-note");

const facadeGutterField = document.getElementById("facade-gutter");
const facadePlinthsField = document.getElementById("facade-plinths");
const facadeDownpipeField = document.getElementById("facade-downpipe");

const roofForm = document.getElementById("roof-form");
const roofDraftTotalEl = document.getElementById("roof-draft-total-value");
const roofDraftTotalNoteEl = document.getElementById("roof-draft-total-note");
const roofTypeField = document.getElementById("roof-type");
const roofSystemField = document.getElementById("roof-system");
const roofLengthField = document.getElementById("roof-length");
const roofWidthField = document.getElementById("roof-width");
const roofDepthField = document.getElementById("roof-depth");
const roofHeightField = document.getElementById("roof-height");
const roofFacadeWidthField = document.getElementById("roof-facade-width");
const roofSolarField = document.getElementById("roof-solar");
const roofStructureField = document.getElementById("roof-structure");
const roofInsulationField = document.getElementById("roof-insulation");
const roofGutterRenewField = document.getElementById("roof-gutter-renew");
const roofGutterLabelEl = document.getElementById("roof-gutter-label");
const roofBody = document.getElementById("roof-body");

const subtotalItemsEl = document.getElementById("subtotal-items");
const subtotalFacadeEl = document.getElementById("subtotal-facade");
const subtotalRoofEl = document.getElementById("subtotal-roof");
const itemsStepTotalEl = document.getElementById("items-step-total");
const itemsStepBreakdownEl = document.getElementById("items-step-breakdown");
const facadeStepTotalEl = document.getElementById("facade-step-total");
const roofStepTotalEl = document.getElementById("roof-step-total");
const itemsStepTotalNoteEl = document.getElementById("items-step-total-note");
const facadeStepTotalNoteEl = document.getElementById("facade-step-total-note");
const subtotalItemsBlock = document.getElementById("subtotal-items-block");
const subtotalFacadeBlock = document.getElementById("subtotal-facade-block");
const subtotalRoofBlock = document.getElementById("subtotal-roof-block");
const subtotalEl = document.getElementById("subtotal");
const measurementTotalEl = document.getElementById("measurement-total");
const totalExclEl = document.getElementById("total-excl");
const vatEl = document.getElementById("vat");
const totalEl = document.getElementById("total");
const vatLabelEl = document.getElementById("vat-label");

const itemsBreakdownBlock = document.getElementById("items-breakdown-block");
const breakdownElementsTotalEl = document.getElementById("breakdown-elements-total");
const demontageBreakdownEl = document.getElementById("demontage-breakdown");
const breakdownDemontageTotalEl = document.getElementById("breakdown-demontage-total");
const montageBreakdownEl = document.getElementById("montage-breakdown");
const breakdownMontageTotalEl = document.getElementById("breakdown-montage-total");
const finishingBreakdownEl = document.getElementById("finishing-breakdown");
const breakdownSiliconeTotalEl = document.getElementById("breakdown-silicone-total");
const breakdownFinishingTotalEl = document.getElementById("breakdown-finishing-total");
const extrasBreakdownEl = document.getElementById("extras-breakdown");
const breakdownExtrasTotalEl = document.getElementById("breakdown-extras-total");
const facadeBreakdownBlock = document.getElementById("facade-breakdown-block");
const facadeBreakdownWallAreaEl = document.getElementById("facade-breakdown-wall-area");
const facadeBreakdownElementsAreaEl = document.getElementById("facade-breakdown-elements-area");
const facadeBreakdownElementsLengthEl = document.getElementById("facade-breakdown-elements-length");
const facadeBreakdownNetAreaEl = document.getElementById("facade-breakdown-net-area");
const facadeCostBreakdownEl = document.getElementById("facade-cost-breakdown");
const facadePerFacadeBreakdownEl = document.getElementById("facade-per-facade-breakdown");
const facadeBreakdownTotalEl = document.getElementById("facade-breakdown-total");
const quoteMailPreviewEl = document.getElementById("quote-mail-preview");
const leadIntentFields = Array.from(document.querySelectorAll('input[name="lead-intent"]'));

const emailQuoteButton = document.getElementById("email-quote");
const resetClientButton = document.getElementById("reset-client");
const resetQuoteButton = document.getElementById("reset-quote");
const resetFacadeButton = document.getElementById("reset-facade");
const resetRoofButton = document.getElementById("reset-roof");
const itemSubmitButton = itemForm ? itemForm.querySelector("button[type='submit']") : null;
const roofSubmitButton = roofForm ? roofForm.querySelector("button[type='submit']") : null;

let items = [];
let editingIndex = null;
let facades = [];
let editingFacadeIndex = null;
let draftFacadeOpenings = [];
let editingDraftOpeningId = null;
let roofs = [];
let editingRoofIndex = null;
let activeStepKey = forcedMeasurementMode === "simple" ? "simple_items_count" : forcedMeasurementMode === "self" ? "elements" : "measurement";
let unlockedStepKeys = new Set([activeStepKey]);
let lastTrackedStepKey = "";
let leadNotification = {
  sent: false,
  signature: "",
  sentAt: ""
};
let contactSyncNotification = {
  sent: false,
  signature: "",
  sentAt: "",
  created: false
};
let preparedQuote = {
  ready: false,
  signature: "",
  data: null
};
let lastPrepareFailureReason = "";
let mobileAdvanceTimer = null;

function quotePayloadSignature(payload) {
  try {
    return JSON.stringify({
      client: payload.client || {},
      items: payload.items || [],
      facades: payload.facades || [],
      roofs: payload.roofs || [],
      itemBreakdown: payload.itemBreakdown || null,
      facadeMeta: payload.facadeMeta || null,
      roofBreakdown: payload.roofBreakdown || null,
      supportCalculation: payload.supportCalculation || null,
      totals: payload.totals || null
    });
  } catch (_err) {
    return "";
  }
}

function markQuoteDirty() {
  if (!preparedQuote.ready) return;
  preparedQuote = {
    ready: false,
    signature: "",
    data: null
  };
}

function shouldShowActualQuotePrices() {
  return preparedQuote.ready && activeStepKey === "overview";
}

const clientFields = {
  name: document.getElementById("client-name"),
  company: document.getElementById("client-company"),
  email: document.getElementById("client-email"),
  phone: document.getElementById("client-phone"),
  address: document.getElementById("client-address"),
  city: document.getElementById("client-city"),
  postal: document.getElementById("client-postal"),
  consent: null,
  notes: document.getElementById("client-notes"),
  oldHouse: document.getElementById("client-old-house"),
  timeline: document.getElementById("client-timeline"),
  scope: document.getElementById("client-scope"),
  building: document.getElementById("client-building"),
  floors: document.getElementById("client-floors"),
  referralCode: document.getElementById("client-referral-code")
};

const supportFieldsWrap = document.getElementById("support-fields");
const supportFields = {
  premium: document.getElementById("support-premium"),
  loan: document.getElementById("support-loan"),
  household: document.getElementById("support-household"),
  dependents: document.getElementById("support-dependents"),
  income: document.getElementById("support-income"),
  ownerOccupant: document.getElementById("support-owner-occupant"),
  domiciled: document.getElementById("support-domiciled"),
  otherProperty: document.getElementById("support-other-property"),
  flemishRegion: document.getElementById("support-flemish-region"),
  before2006: document.getElementById("support-before-2006"),
  loanYears: document.getElementById("support-loan-years")
};

const floorsLabel = document.getElementById("client-floors-label");
const moduleFields = {
  items: document.getElementById("module-items"),
  facade: document.getElementById("module-facade"),
  roof: document.getElementById("module-roof"),
  support: document.getElementById("module-support")
};
const measurementModeFields = Array.from(document.querySelectorAll('input[name="measurement-mode"]'));
const newsletterConsentFields = Array.from(document.querySelectorAll('[data-newsletter-consent]'));
const simpleLiveEstimateEl = document.getElementById("simple-live-estimate");
const housingChoiceFields = {
  oldHouse: Array.from(document.querySelectorAll('input[name="housing-old-house"]')),
  building: Array.from(document.querySelectorAll('input[name="housing-building"]'))
};
const personalHousingFieldsEl = document.querySelector(".personal-housing-fields");
const simpleFields = {
  oldHouse: Array.from(document.querySelectorAll('input[name="simple-old-house"]')),
  building: Array.from(document.querySelectorAll('input[name="simple-building"]')),
  itemsCount: Array.from(document.querySelectorAll('input[name="simple-items-count"]')),
  itemsMaterial: Array.from(document.querySelectorAll('input[name="simple-items-material"]')),
  itemsGlass: Array.from(document.querySelectorAll('input[name="simple-items-glass"]')),
  itemsFinishing: Array.from(document.querySelectorAll('input[name="simple-items-finishing"]')),
  facadeCount: Array.from(document.querySelectorAll('input[name="simple-facade-count"]')),
  facadeArea: Array.from(document.querySelectorAll('input[name="simple-facade-area"]')),
  facadeInsulation: Array.from(document.querySelectorAll('input[name="simple-facade-insulation"]')),
  facadeFinish: Array.from(document.querySelectorAll('input[name="simple-facade-finish"]')),
  roofCount: Array.from(document.querySelectorAll('input[name="simple-roof-count"]')),
  roofFlatCount: Array.from(document.querySelectorAll('input[name="simple-roof-flat-count"]')),
  roofSlopedCount: Array.from(document.querySelectorAll('input[name="simple-roof-sloped-count"]')),
  roofFlatArea: Array.from(document.querySelectorAll('input[name="simple-roof-flat-area"]')),
  roofSlopedArea: Array.from(document.querySelectorAll('input[name="simple-roof-sloped-area"]')),
  roofFlatMaterial: Array.from(document.querySelectorAll('input[name="simple-roof-flat-material"]')),
  roofInsulation: Array.from(document.querySelectorAll('input[name="simple-roof-insulation"]')),
  elementQuantities: Array.from(document.querySelectorAll(".simple-stepper input[type='number']"))
};

function getFieldValue(field) {
  return field && typeof field.value === "string" ? field.value.trim() : "";
}

function setFieldValue(field, value) {
  if (!field) return;
  field.value = value ?? "";
}

function formatCurrency(value) {
  return new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR"
  }).format(Number(value) || 0);
}

function parentTargetOrigin() {
  try {
    const ref = String(document.referrer || "");
    if (ref) {
      return new URL(ref).origin;
    }
  } catch (_err) {
    // ignore
  }
  return "*";
}

function postToParent(type, payload = {}) {
  if (!window.parent || window.parent === window) return;
  try {
    window.parent.postMessage({ type, ...payload }, parentTargetOrigin());
  } catch (_err) {
    // ignore
  }
}

const allowedAnalyticsEvents = new Set([
  "quote_builder_flow_state",
  "contactform_page",
  "lead_create_success",
  "quote_create_success",
  "quote_send_success",
  "quote_send_info"
]);
const lifecycleTrackingStorageKey = "quoteBuilderTrackedLifecycleEvents";
let contactformPageTracked = false;

function trackLifecycleEventOnce(event, dossierCode) {
  const code = String(dossierCode || "").trim();
  if (!code) {
    trackParentEvent(event);
    return;
  }
  try {
    const recorded = new Set(JSON.parse(sessionStorage.getItem(lifecycleTrackingStorageKey) || "[]"));
    const key = `${event}:${code}`;
    if (recorded.has(key)) return;
    recorded.add(key);
    sessionStorage.setItem(lifecycleTrackingStorageKey, JSON.stringify(Array.from(recorded).slice(-100)));
  } catch (_err) {
    // Tracking must never interrupt the offerteflow when session storage is unavailable.
  }
  trackParentEvent(event);
}

const analyticsFlowLabels = {
  simple: "Eenvoudige berekening",
  self: "Zelf opmeten",
  appointment: "Contactformulier",
  call: "Telefonisch contact"
};

function selectedMeasurementModeValue() {
  const selected = measurementModeFields.find((field) => field.checked);
  return selected ? selected.value : "";
}

function activeWizardStepLabel() {
  return wizardStepLabels[activeStepKey] || activeStepKey || "landingspagina";
}

function compactAnalyticsParams(overrides = {}) {
  const selectedMode = overrides.flowKey || selectedMeasurementModeValue();
  const flowLabel =
    overrides.quote_flow_label ||
    (selectedMode ? analyticsFlowLabels[selectedMode] || selectedMode : "Niet gekozen");
  const activeStep =
    overrides.quote_step ||
    overrides.activeStepLabel ||
    (activeStepKey === "measurement" ? "landingspagina" : activeWizardStepLabel());
  const stepFieldByMode = {
    simple: "quote_simple_step",
    self: "quote_self_step",
    appointment: "quote_appointment_step",
    call: "quote_call_step"
  };
  const compactParams = {
    quote_flow_label: flowLabel,
    quote_simple_step: "niet_actief",
    quote_self_step: "niet_actief",
    quote_appointment_step: "niet_actief",
    quote_call_step: "niet_actief"
  };
  const activeStepField = stepFieldByMode[selectedMode];

  if (activeStepField) compactParams[activeStepField] = activeStep;

  ["quote_simple_step", "quote_self_step", "quote_appointment_step", "quote_call_step"].forEach((field) => {
    if (overrides[field]) compactParams[field] = overrides[field];
  });

  return compactParams;
}

function trackParentEvent(event, params = {}) {
  if (!allowedAnalyticsEvents.has(event)) return;
  const compactParams = compactAnalyticsParams(params);
  postToParent("QB_EVENT", { event, params: compactParams });
  if (typeof window.quoteBuilderTrack === "function") {
    window.quoteBuilderTrack(event, compactParams);
  }
}

function trackContactformPage() {
  if (contactformPageTracked || activeStepKey !== "personal") return;
  contactformPageTracked = true;
  trackParentEvent("contactform_page");
}

const languageOptions = {
  nl: { codeLabel: "NL", label: "Nederlands" },
  fr: { codeLabel: "FR", label: "Français" },
  en: { codeLabel: "EN", label: "English" }
};
const languageStorageKey = "quoteBuilderLanguage";
const languageReloadStateKey = "quoteBuilderLanguageReloadState";
let currentLanguage = localStorage.getItem(languageStorageKey) || "nl";

const languageSwitcherEl = document.createElement("div");
languageSwitcherEl.className = "language-switcher";
languageSwitcherEl.innerHTML = `
  <button class="language-current" type="button" aria-haspopup="true" aria-expanded="false" title="Taal kiezen"></button>
  <div class="language-menu" role="menu">
    ${Object.entries(languageOptions)
      .map(
        ([code, option]) =>
          `<button class="language-option" type="button" data-lang="${code}" role="menuitem" title="${option.label}">${option.codeLabel}</button>`
      )
      .join("")}
  </div>
`;

const languageCurrentButton = languageSwitcherEl.querySelector(".language-current");
const languageOptionButtons = Array.from(languageSwitcherEl.querySelectorAll(".language-option"));

function setTranslateCookie(language) {
  const value = language === "nl" ? "" : `/nl/${language}`;
  const domainParts = window.location.hostname.split(".");
  const domains = [window.location.hostname];
  if (domainParts.length > 2) {
    domains.push(`.${domainParts.slice(-2).join(".")}`);
  }
  domains.forEach((domain) => {
    document.cookie = `googtrans=${value}; path=/; domain=${domain}`;
    if (!value) document.cookie = `googtrans=; path=/; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  });
  document.cookie = `googtrans=${value}; path=/`;
  if (!value) document.cookie = "googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

function updateLanguageSwitcher() {
  const option = languageOptions[currentLanguage] || languageOptions.nl;
  if (languageCurrentButton) {
    languageCurrentButton.textContent = option.codeLabel;
    languageCurrentButton.title = option.label;
    languageCurrentButton.setAttribute("aria-label", `Taal: ${option.label}`);
  }
  languageOptionButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.lang === currentLanguage);
  });
}

function dispatchTranslateChange(combo) {
  const event = document.createEvent("HTMLEvents");
  event.initEvent("change", true, true);
  combo.dispatchEvent(event);
}

function waitForTranslateCombo(callback, attempts = 20) {
  const combo = document.querySelector(".goog-te-combo");
  if (combo) {
    callback(combo);
    return;
  }
  if (attempts <= 0) {
    callback(null);
    return;
  }
  setTimeout(() => waitForTranslateCombo(callback, attempts - 1), 150);
}

function rememberWizardStateForLanguageReload() {
  try {
    sessionStorage.setItem(
      languageReloadStateKey,
      JSON.stringify({
        activeStepKey,
        unlockedStepKeys: Array.from(unlockedStepKeys)
      })
    );
  } catch (_err) {
    // ignore
  }
}

function restoreWizardStateAfterLanguageReload() {
  let raw = "";
  try {
    raw = sessionStorage.getItem(languageReloadStateKey) || "";
    sessionStorage.removeItem(languageReloadStateKey);
  } catch (_err) {
    raw = "";
  }
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.activeStepKey) activeStepKey = String(parsed.activeStepKey);
    if (Array.isArray(parsed?.unlockedStepKeys)) {
      unlockedStepKeys = new Set(parsed.unlockedStepKeys.map((key) => String(key)));
    }
  } catch (_err) {
    // ignore
  }
}

let translationLoadPromise;
function loadTranslation() {
  if (!translationLoadPromise) {
    translationLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      script.onload = resolve;
      script.onerror = () => {
        script.remove();
        translationLoadPromise = null;
        reject(new Error('Vertaling kon niet geladen worden.'));
      };
      document.head.appendChild(script);
    });
  }
  return translationLoadPromise;
}

async function applyGoogleTranslateLanguage(language, allowReload = true) {
  if (language === "nl") {
    setTranslateCookie("nl");
    if (allowReload && document.documentElement.className.includes("translated")) {
      rememberWizardStateForLanguageReload();
      window.location.reload();
      return;
    }
    return;
  }

  setTranslateCookie(language);
  try { await loadTranslation(); } catch (error) { console.warn(error.message); return; }
  waitForTranslateCombo((combo) => {
    if (!combo) {
      if (allowReload) {
        rememberWizardStateForLanguageReload();
        window.location.reload();
      }
      return;
    }
    combo.value = language;
    dispatchTranslateChange(combo);
  });
}

function setLanguage(language) {
  if (!languageOptions[language]) return;
  currentLanguage = language;
  localStorage.setItem(languageStorageKey, language);
  updateLanguageSwitcher();
  applyGoogleTranslateLanguage(language);
}

function attachLanguageSwitcher(activeStepEl) {
  const header = activeStepEl ? activeStepEl.querySelector(":scope > .panel-header") : null;
  if (!header) return;

  let actions = header.querySelector(":scope > .panel-header-actions");
  if (!actions) {
    actions = document.createElement("div");
    actions.className = "panel-header-actions";
    Array.from(header.children).forEach((child, index) => {
      if (index > 0) actions.appendChild(child);
    });
    header.appendChild(actions);
  }

  actions.appendChild(languageSwitcherEl);
}

languageSwitcherEl.addEventListener("click", (event) => {
  const optionButton = event.target.closest(".language-option");
  if (optionButton) {
    setLanguage(optionButton.dataset.lang);
    languageSwitcherEl.classList.remove("is-open");
    if (languageCurrentButton) languageCurrentButton.setAttribute("aria-expanded", "false");
    return;
  }
  if (event.target.closest(".language-current")) {
    const isOpen = languageSwitcherEl.classList.toggle("is-open");
    if (languageCurrentButton) languageCurrentButton.setAttribute("aria-expanded", String(isOpen));
  }
});

document.addEventListener("click", (event) => {
  if (languageSwitcherEl.contains(event.target)) return;
  languageSwitcherEl.classList.remove("is-open");
  if (languageCurrentButton) languageCurrentButton.setAttribute("aria-expanded", "false");
});

window.googleTranslateElementInit = function googleTranslateElementInit() {
  if (window.google?.translate?.TranslateElement) {
    new window.google.translate.TranslateElement(
      {
        pageLanguage: "nl",
        includedLanguages: "nl,fr,en",
        autoDisplay: false
      },
      "google-translate-element"
    );
    setTimeout(() => applyGoogleTranslateLanguage(currentLanguage, false), 250);
  }
};

updateLanguageSwitcher();
if (currentLanguage !== 'nl') applyGoogleTranslateLanguage(currentLanguage, false);

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderMailStyleTable(headers, rows) {
  const shortHeaderMap = {
    "Afmeting": "Afm.",
    "Prijs/stuk": "€/st",
    "Prijs": "€/eenh",
    "Eenheidsprijs": "€/eenh",
    "Hoeveelheid": "Aantal",
    "Omschrijving": "Omschr.",
    "Waarde": "€"
  };
  const columnCount = Math.max(2, Math.min(4, headers.length || 4));
  const normalizedHeaders =
    headers.length >= columnCount ? headers.slice(0, columnCount) : [...headers, ...Array(columnCount - headers.length).fill("")];
  const normalizedRows = rows.map((row) =>
    row.length >= columnCount ? row.slice(0, columnCount) : [...row, ...Array(columnCount - row.length).fill("")]
  );

  const head = normalizedHeaders
    .map((header) => {
      const shortLabel = shortHeaderMap[header] || header;
      return `<th><span class="mail-head-full">${escapeHtml(header)}</span><span class="mail-head-short">${escapeHtml(shortLabel)}</span></th>`;
    })
    .join("");
  const body = normalizedRows.length
    ? normalizedRows
        .map(
          (row) =>
            `<tr>${row
              .map((cell, index) => {
                const html = index === 0 ? escapeHtml(cell).replace(/\n/g, "<br>") : escapeHtml(cell);
                return `<td class="${index === 0 ? "left" : "right"}">${html}</td>`;
              })
              .join("")}</tr>`
        )
        .join("")
    : `<tr class="empty-row"><td colspan="${normalizedHeaders.length}">Geen lijnen</td></tr>`;

  const cols = normalizedHeaders.map(() => "<col>").join("");
  return `<div class="mail-table-wrap" data-columns="${columnCount}"><table><colgroup>${cols}</colgroup><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

function renderMailStyleTotal(value, label = "Totaal") {
  return `<div class="mail-table-total"><span>${escapeHtml(label)}:</span><strong>${escapeHtml(value)}</strong></div>`;
}

function renderMailStyleSection(title, headers, rows, totalValue, totalLabel = "Totaal") {
  return [
    `<p class="mail-subtitle">${escapeHtml(title)}</p>`,
    renderMailStyleTable(headers, rows),
    renderMailStyleTotal(totalValue, totalLabel)
  ].join("");
}

function renderOverviewCard(title, totalLabel, totalValue, content, options = {}) {
  const openAttr = options.open === true ? " open" : "";
  return `<details class="mail-card mail-collapsible-card"${openAttr}>
    <summary class="mail-card-toggle">
      <div class="mail-card-toggle-main">
        <span class="mail-card-toggle-title">${escapeHtml(title)}</span>
        <div class="mail-toggle-total-box">
          <div class="mail-toggle-total-label">${escapeHtml(totalLabel)}</div>
          <div class="mail-toggle-total-value">${escapeHtml(totalValue)}</div>
        </div>
      </div>
    </summary>
    <div class="mail-card-content">${content}</div>
  </details>`;
}

function renderOverviewTotalCard(totalValue, detailsContent, totalLabel = "Totale prijs incl. BTW", taxSummary = null) {
  const taxBreakdown = taxSummary
    ? `<div class="overview-tax-summary">
        <span><small>Prijs excl. BTW</small><b>${escapeHtml(taxSummary.totalExcl || "-")}</b></span>
        <span><small>${escapeHtml(taxSummary.vatLabel || "BTW")}</small><b>${escapeHtml(taxSummary.vat || "-")}</b></span>
      </div>`
    : "";
  return `<details class="overview-total-card">
    <summary>
      <div class="overview-total-copy">
        <span>${escapeHtml(totalLabel)}</span>
        ${taxBreakdown}
      </div>
      <div class="overview-total-incl">
        <small>Totaal incl. BTW</small>
        <strong>${escapeHtml(totalValue)}</strong>
      </div>
    </summary>
    <div class="overview-total-details">${detailsContent}</div>
  </details>`;
}

function renderSupportPremiumCard(support) {
  if (!support || !support.enabled) return "";
  const notes = support.notes.length
    ? `<ul class="support-note-list">${support.notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}</ul>`
    : "";
  const content = [
    `<div class="simple-estimate-hero">
      <span>Premie mogelijk</span>
      <strong>${formatCurrency(support.premiumTotal)}</strong>
      <small>Op basis van de ingevulde gegevens.</small>
    </div>`,
    `<p class="meta">Inkomenscategorie: ${escapeHtml(support.categoryLabel || "-")}</p>`,
    notes,
    `<p class="meta">Definitieve toekenning gebeurt via Mijn VerbouwLoket.</p>`
  ].join("");

  return `<details class="mail-card mail-collapsible-card">
    <summary class="mail-card-toggle">
      <div class="mail-card-toggle-main">
        <span class="mail-card-toggle-title">Mijn VerbouwPremie</span>
        <div class="mail-toggle-total-box">
          <div class="mail-toggle-total-label">Premie mogelijk</div>
          <div class="mail-toggle-total-value">${formatCurrency(support.premiumTotal)}</div>
        </div>
      </div>
    </summary>
    <div class="mail-card-content">${content}</div>
  </details>`;
}

function renderSupportLoanCard(support) {
  if (!support || !support.enabled) return "";
  const loanUnavailableLabel =
    support.options?.loan &&
    support.options?.ownerOccupant &&
    support.options?.domiciled &&
    support.options?.flemishRegion &&
    !support.options?.otherProperty
      ? "Bedrag te laag"
      : "Niet van toepassing";
  const loanRows = [
    ["Categorie", support.categoryLabel],
    ["Netto na premie", formatCurrency(support.netAfterPremium)],
    ["Lening initieel", support.loanEligible ? formatCurrency(support.loanPrincipalBeforePremium) : loanUnavailableLabel],
    ["Premie afgelost", support.loanEligible ? `-${formatCurrency(support.premiumTotal)}` : loanUnavailableLabel],
    ["Te financieren", support.loanEligible ? formatCurrency(support.loanPrincipalAfterPremium) : loanUnavailableLabel],
    ["Eigen inbreng", formatCurrency(support.loanOwnContribution)],
    ["Rentevoet", support.loanEligible ? `${(support.loanRate * 100).toFixed(1)}%` : "-"],
    ["Maandlast", support.loanEligible ? `${formatCurrency(support.loanMonthly)} / maand` : "-"],
    ["Looptijd", support.loanEligible ? `${support.loanYears} jaar` : "-"]
  ];
  const content = [
    `<p class="mail-subtitle">Lening-indicatie</p>`,
    renderMailStyleSection(
      "Lening",
      ["Omschrijving", "Waarde"],
      loanRows,
      support.loanEligible ? `${formatCurrency(support.loanMonthly)} / maand` : loanUnavailableLabel,
      support.loanEligible ? "Maandlast" : "Resultaat"
    ),
    support.loanEligible
      ? ""
      : `<p class="meta">Het minimumbedrag om voor de Mijn VerbouwLening in aanmerking te komen bedraagt ${formatCurrency(supportRules2026.loan.min)}.</p>`,
    `<p class="meta">Definitieve beoordeling en toekenning gebeuren via het Energiehuis.</p>`
  ].join("");

  return `<details class="mail-card mail-collapsible-card">
    <summary class="mail-card-toggle">
      <div class="mail-card-toggle-main">
        <span class="mail-card-toggle-title">Mijn VerbouwLening</span>
        <div class="mail-toggle-total-box">
          <div class="mail-toggle-total-label">Maandelijkse afbetaling</div>
          <div class="mail-toggle-total-value">${support.loanEligible ? `${formatCurrency(support.loanMonthly)} / maand` : loanUnavailableLabel}</div>
        </div>
      </div>
    </summary>
    <div class="mail-card-content">${content}</div>
  </details>`;
}

function renderQuoteMailStyle(totals) {
  if (!quoteMailPreviewEl) return;

  const vatRateLabel = `BTW (${Math.round(totals.vatRate * 100)}%)`;
  const itemTotals = totals.itemTotals;
  const facadeTotals = totals.facadeTotals;
  const roofTotals = totals.roofTotals;
  const perFacadeCost = Array.isArray(facadeTotals.perFacadeCost) ? facadeTotals.perFacadeCost : [];
  const itemsInclVat = totals.subtotalItems * (1 + totals.vatRate);
  const facadeInclVat = totals.subtotalFacade * (1 + totals.vatRate);
  const roofInclVat = totals.subtotalRoof * (1 + totals.vatRate);
  const grandTotalInclVat = totals.totalIncl;
  const support = totals.supportCalculation;

  const itemRows = totals.includeItems
    ? items.map((item) => [
        `${itemDisplayTypeLabel(item)}\n${formatSizeMmFromCm(item.widthCm, item.heightCm)}`,
        `${item.quantity} st`,
        formatCurrency(elementUnitPrice(item)),
        formatCurrency(linePrice(item))
      ])
    : [];

  const demRows = totals.includeItems
    ? itemTotals.demontageBreakdown.map((row) => [
        row.label,
        `${row.count}`,
        formatCurrency(row.unitRate),
        formatCurrency(row.total)
      ])
    : [];

  const monRows = totals.includeItems
    ? itemTotals.montageBreakdown.map((row) => [
        row.label,
        `${row.count}`,
        formatCurrency(row.unitRate),
        formatCurrency(row.total)
      ])
    : [];

  const finRows = totals.includeItems
    ? itemTotals.finishingBreakdown.map((row) => [
        row.label,
        `${row.count}`,
        formatCurrency(row.unitRate),
        formatCurrency(row.total)
      ])
    : [];

  const siliconeRows = totals.includeItems
    ? [[
        itemTotals.sealantLabel || "Transparant silicone (incl. materiaal)",
        `${(itemTotals.sealantLmTotal || itemTotals.siliconeLmTotal || 0).toFixed(2)} lm`,
        formatCurrency(itemTotals.sealantUnitRate || SILICONE_RATE_PER_LM),
        formatCurrency(itemTotals.sealantTotal || itemTotals.siliconeTotal || 0)
      ]]
    : [];

  const extraRows = totals.includeItems
    ? itemTotals.extrasBreakdown.map((row) => {
        const qty = Number(row.quantity) || 0;
        const qtyLabel = qty > 0 ? (Number.isInteger(qty) ? `${qty}` : qty.toFixed(2)) : "-";
        const unitLabel = Number(row.unitRate) > 0 ? formatCurrency(row.unitRate) : "-";
        return [row.label, qtyLabel, unitLabel, formatCurrency(row.value)];
      })
    : [];

  const facadeBuildSections = totals.includeFacades
    ? (perFacadeCost.length
        ? perFacadeCost
            .map((row) => {
              const facade = facades[row.index];
              const finishLabel = facade ? facadeFinishLabels[facade.finish] || facade.finish : "-";
              const facadeWidthLm = facade ? facade.widthCm / 100 : 0;
              const facadeHeightLm = facade ? facade.heightCm / 100 : 0;
              const openings = facade ? facadeOpeningsMetrics(facade).openings : [];
              const smallFactor = facadeTotals.smallFacadeMultiplier || 1;
              const plinthUnitRate =
                facade?.options?.plinths === "blauwe-hardsteen"
                  ? facadeRates.plinthStone
                  : facadeRates.plinthCrepi;
              const lines = [
                [`Gevel (${finishLabel})`, `${row.facadeArea.toFixed(2)} m²`, formatCurrency(row.rate), formatCurrency(row.grossAreaCost)],
              ];
              openings.forEach((opening, openingIndex) => {
                const openingArea = ((opening.widthCm * opening.heightCm) / 10000) * opening.quantity;
                const openingCost = openingArea * row.rate * smallFactor;
                const openingLabel =
                  opening.source === "item"
                    ? `${opening.label || "Gekoppeld element"}${opening.missingItem ? " (element verwijderd)" : ""}`
                    : `Losse opening ${opening.widthCm} x ${opening.heightCm} cm`;
                lines.push([
                  `Opening ${openingIndex + 1}: ${openingLabel}`,
                  `${openingArea.toFixed(2)} m²`,
                  formatCurrency(row.rate),
                  `-${formatCurrency(openingCost)}`
                ]);
              });
              lines.push([
                "Omtrek ramen",
                `${row.elementsLength.toFixed(2)} m`,
                formatCurrency(facadeRates.windowLm),
                formatCurrency(row.windowLmCost)
              ]);
              if (row.gutterCost > 0)
                lines.push([
                  "Dakgootbekleding",
                  `${facadeWidthLm.toFixed(2)} m`,
                  formatCurrency(facadeRates.gutter),
                  formatCurrency(row.gutterCost)
                ]);
              if (row.sillsCost > 0) {
                if (row.sillAluLm > 0) {
                  lines.push([
                    "Raamdorpels aluminium",
                    `${row.sillAluLm.toFixed(2)} m`,
                    formatCurrency(facadeRates.sillAlu),
                    formatCurrency(row.sillAluLm * facadeRates.sillAlu)
                  ]);
                }
                if (row.sillStoneLm > 0) {
                  lines.push([
                    "Raamdorpels blauwe hardsteen",
                    `${row.sillStoneLm.toFixed(2)} m`,
                    formatCurrency(facadeRates.sillStone),
                    formatCurrency(row.sillStoneLm * facadeRates.sillStone)
                  ]);
                }
              }
              if (row.plinthsCost > 0)
                lines.push([
                  "Plinten",
                  `${facadeWidthLm.toFixed(2)} m`,
                  formatCurrency(plinthUnitRate),
                  formatCurrency(row.plinthsCost)
                ]);
              if (row.downpipeCost > 0)
                lines.push([
                  "Afvoerbuis",
                  `${facadeHeightLm.toFixed(2)} m`,
                  formatCurrency(facadeRates.downpipe),
                  formatCurrency(row.downpipeCost)
                ]);

              return renderMailStyleSection(
                `Gevel ${row.index + 1}`,
                ["Specificatie", "Hoeveelheid", "Eenheidsprijs", "Totaal"],
                lines,
                formatCurrency(row.totalCost),
                `Totaal gevel ${row.index + 1}`
              );
            })
            .join("")
        : renderMailStyleSection(
            "Gevel 1",
            ["Specificatie", "Hoeveelheid", "Eenheidsprijs", "Totaal"],
            [],
            formatCurrency(0),
            "Totaal gevel 1"
          ))
    : "";

  const finalRows = [
    ["Totaal werken", "", "", formatCurrency(itemsInclVat + facadeInclVat + roofInclVat)],
    ["Totaal (zonder Mijn VerbouwPremie en Mijn VerbouwLening)", "", "", formatCurrency(grandTotalInclVat)],
    ...(totals.includeItems ? [["Totaal ramen & deuren (incl. BTW)", "", "", formatCurrency(itemsInclVat)]] : []),
    ...(totals.includeFacades
      ? [["Totaal gevelrenovatie (incl. BTW)", "", "", formatCurrency(facadeInclVat)]]
      : []),
    ...(totals.includeRoof ? [["Totaal dakrenovatie (incl. BTW)", "", "", formatCurrency(roofInclVat)]] : []),
    ...(support && support.enabled
      ? [
          ["Mijn VerbouwPremie (indicatief)", "", "", `-${formatCurrency(support.premiumTotal)}`],
          ["Netto na premie", "", "", formatCurrency(support.netAfterPremium)],
          ["Mijn VerbouwLening (na premie)", "", "", support.loanEligible ? formatCurrency(support.loanPrincipalAfterPremium) : "Niet van toepassing"],
          ["Eigen inbreng bij start", "", "", formatCurrency(support.loanOwnContribution)],
          ["Maandlast lening", "", "", support.loanEligible ? `${formatCurrency(support.loanMonthly)} / maand` : "Niet van toepassing"]
        ]
      : [])
  ];

  const perItemPricingSections = totals.includeItems
      ? items.map((item, index) => {
        const parts = itemDirectCostParts(item);
        const priceIncludingVat = (amount) => formatCurrency(toInclVat(amount));
        const serviceTotal = parts.demontage + parts.recycling + parts.montage + parts.sealant + parts.finishing;
        const typeLabel = itemDisplayTypeLabel(item);
        return `<details class="item-overview-detail">
          <summary><span class="item-overview-label"><b>${index + 1}. ${escapeHtml(typeLabel)} - ${parts.quantity} st.</b><small>${escapeHtml(formatSizeMmFromCm(item.widthCm, item.heightCm))}</small></span><strong class="item-overview-price">${priceIncludingVat(parts.element + serviceTotal)}</strong></summary>
          <div class="item-overview-detail-body">${renderMailStyleTable(
            ["Onderdeel", "Hoeveelheid", "Eenheidsprijs", "Totaal"],
            [
              ["Schrijnwerk", `${parts.quantity} st.`, priceIncludingVat(elementUnitPrice(item)), priceIncludingVat(parts.element)],
              ["Afbraak", `${parts.quantity} st.`, priceIncludingVat(parts.demontageTier.rate), priceIncludingVat(parts.demontage)],
              ["Recyclage", `${(parts.weightKg / 1000).toFixed(3)} ton`, priceIncludingVat(parts.recyclingRate), priceIncludingVat(parts.recycling)],
              ["Plaatsing", `${parts.quantity} st.`, priceIncludingVat(parts.montageTier.rate), priceIncludingVat(parts.montage)],
              [isFacadeRenovationActive() ? "Zwelband" : "Siliconeren", `${parts.sealantLm.toFixed(2)} lm`, priceIncludingVat(parts.sealantRate), priceIncludingVat(parts.sealant)],
              ...parts.finishingEntries.map((entry) => [entry.label, `${parts.quantity} st.`, priceIncludingVat(entry.unitPrice), priceIncludingVat(entry.unitPrice * parts.quantity)])
            ]
          )}</div>
        </details>`;
      }).join("")
    : "";

  const ramenDeurenBlock = perItemPricingSections;

  const gevelBlock = [
    `<p class="mail-subtitle">Prijsopbouw per gevel</p>${facadeBuildSections}`,
    `<p class="mail-subtitle">Totaal gevelrenovatie</p>`,
    renderMailStyleTable(
      ["Omschrijving", "", "", "Waarde"],
      [
        ["Subtotaal", "", "", formatCurrency(totals.subtotalFacade)],
        [vatRateLabel, "", "", formatCurrency(totals.subtotalFacade * totals.vatRate)]
      ]
    ),
    `<div class="mail-toggle-total-box">
      <div class="mail-toggle-total-label">Totaal incl. BTW</div>
      <div class="mail-toggle-total-value">${formatCurrency(facadeInclVat)}</div>
    </div>`
  ].join("");

  const eindtotaalBlock = [
    `<p class="mail-section-title">Eindtotaal</p>`,
    `<p class="meta">Hoofdtotaal hieronder is zonder Mijn VerbouwPremie en Mijn VerbouwLening.</p>`,
    renderMailStyleTable(["Omschrijving", "", "", "Waarde"], finalRows),
    `<div class="mail-grand-total"><span>Volledige kost (zonder premie/lening)</span><strong>${formatCurrency(grandTotalInclVat)}</strong></div>`
  ].join("");

  const ramenDeurenSummaryBlock = `
    <div class="mail-toggle-total-box">
      <div class="mail-toggle-total-label">Totaal incl. BTW</div>
      <div class="mail-toggle-total-value">${formatCurrency(itemsInclVat)}</div>
    </div>
  `;

  const gevelSummaryBlock = `
    <div class="mail-toggle-total-box">
      <div class="mail-toggle-total-label">Totaal incl. BTW</div>
      <div class="mail-toggle-total-value">${formatCurrency(facadeInclVat)}</div>
    </div>
  `;

  const roofRows = totals.includeRoof
    ? roofTotals.rows.map((row) => [
        `${roofTypeLabels[row.roof.type] || row.roof.type}\n${roofSystemLabels[row.roof.system] || row.roof.system}`,
        `${row.area.toFixed(2)} m²`,
        formatCurrency(roofUnitRate(row.roof)),
        formatCurrency(row.areaCost)
      ])
    : [];

  const roofElementsTotal = totals.includeRoof
    ? roofTotals.rows.reduce((sum, row) => sum + row.areaCost, 0)
    : 0;

  const roofExtrasTotal = totals.includeRoof
    ? roofTotals.rows.reduce(
        (sum, row) =>
          sum + row.structureCost + row.insulationCost + row.solarCost + row.batteryCost + row.gutterCost,
        0
      )
    : 0;

  const roofExtrasRows = totals.includeRoof
    ? roofTotals.rows.flatMap((row, index) => [
        ...(row.structureCost > 0
          ? [[`Dak ${index + 1} - constructie vervangen`, `${row.area.toFixed(2)} m²`, formatCurrency(roofRates.structureReplacement), formatCurrency(row.structureCost)]]
          : []),
        ...(row.insulationCost > 0
          ? [[`Dak ${index + 1} - isolatie`, `${row.area.toFixed(2)} m²`, formatCurrency(roofRates.insulation), formatCurrency(row.insulationCost)]]
          : []),
        ...(row.smallRoofMultiplier > 1
          ? [[`Dak ${index + 1} - klein dak toeslag`, `${row.area.toFixed(2)} m²`, `×${row.smallRoofMultiplier.toFixed(2)}`, "In bovenstaande m²-prijzen"]]
          : []),
        ...(row.solarCost > 0
          ? [[`Dak ${index + 1} - zonnepanelen`, "1 set", formatCurrency(roofRates.solarPanels), formatCurrency(row.solarCost)]]
          : []),
        ...(row.batteryCost > 0
          ? [[`Dak ${index + 1} - thuisbatterij`, "1 st", formatCurrency(roofRates.homeBattery), formatCurrency(row.batteryCost)]]
          : []),
        ...(row.gutterCost > 0
          ? [[row.roof.type === "sloped" ? "Dakgoten vernieuwen" : "Dakopstanden vernieuwen", `${row.accessoryLm.toFixed(2)} lm`, formatCurrency(row.roof.type === "sloped" ? roofRates.gutterLm : roofRates.upstandLm), formatCurrency(row.gutterCost)]]
          : [])
      ])
    : [];

  const roofBlock = [
    renderMailStyleSection(
      "Dakvlakken",
      ["Type", "Oppervlakte", "Eenheidsprijs", "Totaal"],
      roofRows,
      formatCurrency(roofElementsTotal)
    ),
    renderMailStyleSection(
      "Dak extra's",
      ["Specificatie", "Aantal", "Prijs", "Totaal"],
      roofExtrasRows,
      formatCurrency(roofExtrasTotal)
    ),
    `<p class="mail-subtitle">Totaal dakrenovatie</p>`,
    renderMailStyleTable(
      ["Omschrijving", "", "", "Waarde"],
      [
        ["Subtotaal", "", "", formatCurrency(totals.subtotalRoof)],
        [vatRateLabel, "", "", formatCurrency(totals.subtotalRoof * totals.vatRate)]
      ]
    ),
    `<div class="mail-toggle-total-box">
      <div class="mail-toggle-total-label">Totaal incl. BTW</div>
      <div class="mail-toggle-total-value">${formatCurrency(roofInclVat)}</div>
    </div>`
  ].join("");

  const roofSummaryBlock = `
    <div class="mail-toggle-total-box">
      <div class="mail-toggle-total-label">Totaal incl. BTW</div>
      <div class="mail-toggle-total-value">${formatCurrency(roofInclVat)}</div>
    </div>
  `;

  const sections = [];
  if (totals.includeItems) {
    sections.push(`<section class="overview-category-list">
      <h3>Ramen & deuren</h3>
      <div>${ramenDeurenBlock}</div>
    </section>`);
  }

  if (totals.includeFacades) {
    sections.push(`<details class="mail-card mail-collapsible-card">
      <summary class="mail-card-toggle">
        <div class="mail-card-toggle-main">
          <span class="mail-card-toggle-title">Gevelrenovatie</span>
          ${gevelSummaryBlock}
        </div>
      </summary>
      <div class="mail-card-content">${gevelBlock}</div>
    </details>`);
  }

  if (totals.includeRoof) {
    sections.push(`<details class="mail-card mail-collapsible-card">
      <summary class="mail-card-toggle">
        <div class="mail-card-toggle-main">
          <span class="mail-card-toggle-title">Dakrenovatie</span>
          ${roofSummaryBlock}
        </div>
      </summary>
      <div class="mail-card-content">${roofBlock}</div>
    </details>`);
  }

  if (support && support.enabled) {
    sections.push(renderSupportPremiumCard(support));
    sections.push(renderSupportLoanCard(support));
  }
  quoteMailPreviewEl.innerHTML = renderOverviewTotalCard(
    formatCurrency(grandTotalInclVat),
    sections.join(""),
    "Totale prijs",
    {
      totalExcl: formatCurrency(totals.totalExcl),
      vatLabel: vatRateLabel,
      vat: formatCurrency(totals.vat)
    }
  );
}

function currentSimpleSelection() {
  const oldHouseChoice = getFieldValue(clientFields.oldHouse) || "unknown";
  return {
    oldHouse: oldHouseChoice === "true",
    oldHouseChoice,
    building: getFieldValue(clientFields.building) || "gesloten-bebouwing",
    modules: selectedSimpleModules(),
    itemsCount: simpleElementQuantityTotal(),
    itemsMaterial: checkedRadioValue(simpleFields.itemsMaterial, "pvc"),
    itemsGlass: "double",
    itemsFinishing: checkedRadioValue(simpleFields.itemsFinishing, "mdf"),
    elementQuantities: currentSimpleElementQuantities(),
    facadeCount: checkedRadioValue(simpleFields.facadeCount, "60"),
    roofCount: checkedRadioValue(simpleFields.roofCount, "60")
  };
}

function simpleItemsMaterialLabel(value) {
  return value === "alu" ? "Aluminium" : "PVC";
}

function simpleItemsGlassLabel(value) {
  return value === "double" ? "dubbel glas" : "driedubbel glas";
}

function simpleItemsFinishingLabel(value) {
  return {
    pvc: "PVC binnenafwerking",
    mdf: "MDF binnenafwerking",
    pleister: "pleisterwerk",
    none: "geen binnenafwerking"
  }[value] || "MDF binnenafwerking";
}

function simpleRangeFromBucket(value, ranges) {
  return ranges[value] || ranges.default;
}

function simpleCountRange(value) {
  if (value === "5+") return [5, 7];
  const count = Number(value) || 0;
  return [count, count];
}

function simpleAreaRange(value) {
  const numericValue = Number(value);
  if (Number.isFinite(numericValue) && numericValue > 0) {
    return [Math.max(10, numericValue - 10), numericValue + 10];
  }
  return simpleRangeFromBucket(value, {
    none: [0, 0],
    lt20: [10, 20],
    "20-40": [20, 40],
    "40-60": [40, 60],
    "60-80": [60, 80],
    "80-100": [80, 100],
    "100-120": [100, 120],
    gt120: [120, 170],
    default: [0, 0]
  });
}

function simpleAreaChoice(value, fallback = "60") {
  const numericValue = Number(value);
  if (Number.isFinite(numericValue) && numericValue > 0) return String(Math.round(numericValue / 10) * 10);
  if (value === "lt20") return "20";
  if (value === "20-40" || value === "lt40") return "30";
  if (value === "40-60") return "50";
  if (value === "60-80" || value === "40-80") return "70";
  if (value === "80-100") return "90";
  if (value === "100-120" || value === "80-120") return "110";
  if (value === "gt120") return "140";
  if (value === "0" || value === "none") return "20";
  if (value === "1") return "30";
  if (value === "2") return "50";
  if (value === "3") return "90";
  if (value === "4" || value === "5+") return "140";
  return fallback;
}

function simpleHomeSizeLabel(value) {
  const m2 = Number(value) || 0;
  if (m2 <= 60) return "Kleine woning";
  if (m2 <= 120) return "Middelgrote woning";
  return "Grote woning";
}

function simpleAreaChoiceLabel(value) {
  const numericValue = Number(value);
  if (Number.isFinite(numericValue) && numericValue > 0) {
    return `ongeveer ${numericValue} m2 (${simpleHomeSizeLabel(numericValue).toLowerCase()})`;
  }
  return {
    none: "Geen",
    lt20: "< 20 m2",
    "20-40": "20-40 m2",
    "40-60": "40-60 m2",
    "60-80": "60-80 m2",
    "80-100": "80-100 m2",
    "100-120": "100-120 m2",
    gt120: "> 120 m2"
  }[value] || value || "-";
}

function simpleItemSpec(type, widthCm, heightCm, weightKg, opening = null) {
  return {
    type,
    widthCm,
    heightCm,
    quantity: 1,
    glass: "pvc_double",
    finishing: "mdf",
    color: "standard",
    opening: opening || (type === "raam" ? "draaikiep" : "vast"),
    shutter: "none",
    weightKg
  };
}

function simpleItemUnitTotal(spec) {
  const item = simpleItemSpec(spec.type, spec.widthCm, spec.heightCm, spec.weightKg, spec.opening);
  const parts = itemDirectCostParts(item);
  return parts.element + parts.demontage + parts.recycling + parts.montage + parts.sealant + parts.finishing;
}

function simpleItemUnitBreakdown(spec) {
  const item = simpleItemSpec(spec.type, spec.widthCm, spec.heightCm, spec.weightKg, spec.opening);
  const parts = itemDirectCostParts(item);
  return {
    item,
    carpentry: parts.element,
    services: parts.demontage + parts.recycling + parts.montage + parts.sealant + parts.finishing,
    demolition: parts.demontage,
    recycling: parts.recycling,
    demolitionRecycling: parts.demontage + parts.recycling,
    installation: parts.montage,
    sealant: parts.sealant,
    finishing: parts.finishing,
    areaM2: areaInM2(item),
    perimeterLm: finishingPerimeterLm(item),
    sealantLm: parts.sealantLm,
    total: parts.element + parts.demontage + parts.recycling + parts.montage + parts.sealant + parts.finishing,
    weightKg: parts.weightKg,
    demolitionRate: parts.demontageTier.rate,
    recyclingRate: parts.recyclingRate,
    installationRate: parts.montageTier.rate,
    sealantRate: parts.sealantRate,
    finishingEntries: parts.finishingEntries
  };
}

function simpleElementPackageTotal(items) {
  return items.reduce((sum, spec) => sum + simpleItemUnitTotal(spec), 0);
}

function simpleElementPackageRange(value) {
  const door = () => ({ type: "deur", widthCm: 100, heightCm: 220, weightKg: 110 });
  const window150 = () => ({ type: "raam", widthCm: 120, heightCm: 145, weightKg: 140 });
  const window200 = () => ({ type: "raam", widthCm: 160, heightCm: 170, weightKg: 190 });
  const sliding200 = () => ({ type: "schuifraam", widthCm: 260, heightCm: 220, weightKg: 190 });
  const sliding400 = () => ({ type: "schuifraam", widthCm: 420, heightCm: 230, weightKg: 390 });

  const packages = {
    "1-3": {
      low: [door(), window150()],
      high: [door(), window150(), window150()],
      detail: "Standaard: 1 deur en 1 tot 2 ramen van 100-150 kg."
    },
    "4-6": {
      low: [door(), sliding400(), window150(), window150()],
      high: [door(), sliding400(), window150(), window150(), window150(), window150()],
      detail: "Standaard: 1 deur, 1 schuifraam tot 400 kg en 2 tot 4 ramen van 100-150 kg."
    },
    "7-10": {
      low: [door(), sliding200(), sliding400(), window200(), window200(), window200(), window150(), window150()],
      high: [door(), sliding200(), sliding400(), window200(), window200(), window200(), window150(), window150(), window150(), window150(), window150()],
      detail: "Standaard: 1 deur, 2 schuiframen en een mix van ramen tot 200 kg en 100-150 kg."
    },
    "10+": {
      low: [door(), sliding200(), sliding400(), window200(), window200(), window200(), window150(), window150(), window150(), window150(), window150()],
      high: [door(), sliding200(), sliding400(), window200(), window200(), window200(), window150(), window150(), window150(), window150(), window150(), window150(), window150(), window150(), window150(), window150()],
      detail: "Basis is 11 elementen. Voor de maximumprijs worden 5 extra ramen tot 150 kg meegerekend."
    }
  };
  const pkg = packages[value] || packages["1-3"];
  return {
    low: simpleElementPackageTotal(pkg.low),
    high: simpleElementPackageTotal(pkg.high),
    detail: pkg.detail
  };
}

const simpleElementTypes = [
  {
    key: "fixed-window",
    label: "Vast raam",
    detail: "Vast raam zonder opening",
    specs: [{ type: "raam", widthCm: 110, heightCm: 140, weightKg: 120, opening: "vast" }]
  },
  {
    key: "single-window",
    label: "Draai/kiep raam",
    detail: "Standaard draai/kiep raam",
    specs: [{ type: "raam", widthCm: 120, heightCm: 145, weightKg: 140 }]
  },
  {
    key: "double-window",
    label: "Dubbel raam",
    detail: "Twee delen naast elkaar",
    specs: [{ type: "raam", widthCm: 220, heightCm: 145, weightKg: 190 }]
  },
  {
    key: "triple-window",
    label: "Drievoudig raam",
    detail: "Drie delen naast elkaar",
    specs: [{ type: "raam", widthCm: 330, heightCm: 145, weightKg: 240 }]
  },
  {
    key: "single-door",
    label: "Deur",
    detail: "Standaard buitendeur",
    specs: [{ type: "deur", widthCm: 100, heightCm: 220, weightKg: 110 }]
  },
  {
    key: "door-with-sidelight",
    label: "Deur met zijlicht",
    detail: "Buitendeur met vast glasdeel",
    specs: [{ type: "deur-zijlicht", widthCm: 160, heightCm: 220, weightKg: 160 }]
  },
  {
    key: "sliding-window",
    label: "Schuifraam",
    detail: "Schuifraam in PVC",
    specs: [{ type: "schuifraam", widthCm: 360, heightCm: 220, weightKg: 320 }]
  },
  {
    key: "garage-door",
    label: "Garagepoort",
    detail: "Sectionale garagepoort",
    specs: [{ type: "poort", widthCm: 260, heightCm: 220, weightKg: 140 }]
  }
];

function simpleElementQuantityField(key) {
  return document.getElementById(`simple-element-${key}`);
}

function currentSimpleElementQuantities() {
  return Object.fromEntries(
    simpleElementTypes.map((type) => {
      const field = simpleElementQuantityField(type.key);
      return [type.key, Math.max(0, Math.floor(Number(field ? field.value : 0) || 0))];
    })
  );
}

function simpleElementQuantityTotal(quantities = currentSimpleElementQuantities()) {
  return Object.values(quantities).reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0);
}

function updateSimpleElementCards({ preserveEmptyField = null } = {}) {
  simpleElementTypes.forEach((type) => {
    const field = simpleElementQuantityField(type.key);
    const card = document.querySelector(`[data-simple-element-card="${type.key}"]`);
    const isTemporarilyEmpty = field === preserveEmptyField && String(field?.value || "") === "";
    const value = isTemporarilyEmpty ? 0 : Math.max(0, Math.floor(Number(field ? field.value : 0) || 0));
    if (field && !isTemporarilyEmpty && field.value !== String(value)) field.value = String(value);
    if (card) card.classList.toggle("is-selected", value > 0);
  });
  updateSimpleEstimatePreview();
}

function simpleElementTypeTotal(type) {
  return type.specs.reduce((sum, spec) => sum + simpleItemUnitTotal(spec), 0);
}

function simpleElementTypeBreakdown(type) {
  return type.specs.reduce((totals, spec) => {
    const row = simpleItemUnitBreakdown(spec);
    totals.carpentry += row.carpentry;
    totals.services += row.services;
    totals.demolitionRecycling += row.demolitionRecycling;
    totals.installation += row.installation;
    totals.sealant += row.sealant;
    totals.finishing += row.finishing;
    totals.areaM2 += row.areaM2;
    totals.finishingLm += row.perimeterLm;
    totals.sealantLm += row.sealantLm;
    totals.total += row.total;
    totals.finishingEntries.push(...(Array.isArray(row.finishingEntries) ? row.finishingEntries : []));
    totals.specs.push(row);
    return totals;
  }, {
    carpentry: 0,
    services: 0,
    demolitionRecycling: 0,
    installation: 0,
    sealant: 0,
    finishing: 0,
    areaM2: 0,
    finishingLm: 0,
    sealantLm: 0,
    total: 0,
    finishingEntries: [],
    specs: []
  });
}

function formatSimpleRange(low, high) {
  const lowValue = Number(low || 0);
  const highValue = Number(high || 0);
  if (Math.abs(lowValue - highValue) < 0.005) return formatCurrency(lowValue);
  return `${formatCurrency(lowValue)} - ${formatCurrency(highValue)}`;
}

function calculateSimpleEstimate() {
  const selection = currentSimpleSelection();
  const vatRate = selection.oldHouse ? 0.06 : 0.21;
  const rows = [];
  let lowExcl = 0;
  let highExcl = 0;

  if (selection.modules.items) {
    const selectedTypes = simpleElementTypes
      .map((type) => ({
        ...type,
        quantity: Math.max(0, Number(selection.elementQuantities[type.key]) || 0)
      }))
      .filter((type) => type.quantity > 0);
    const detailedTypes = selectedTypes.map((type) => ({
      ...type,
      breakdown: simpleElementTypeBreakdown(type)
    }));
    const carpentryLow = detailedTypes.reduce((sum, type) => sum + type.breakdown.carpentry * type.quantity, 0);
    const servicesLow = detailedTypes.reduce((sum, type) => sum + type.breakdown.services * type.quantity, 0);
    const low = carpentryLow + servicesLow;
    const high = low;
    lowExcl += low;
    highExcl += high;
    detailedTypes.forEach((type) => {
      const typeLow = type.breakdown.total * type.quantity;
      const dimensions = type.specs
        .map((spec) => `${Math.round(spec.widthCm * 10)} × ${Math.round(spec.heightCm * 10)} mm`)
        .join(" + ");
      rows.push({
        label: `${type.quantity}× ${type.label}`,
        detail: `${dimensions} · PVC wit binnen/buiten · dubbel glas · MDF`,
        assumptions: [
          `Schrijnwerk: ${formatCurrency(type.breakdown.carpentry * type.quantity)} excl. BTW.`,
          `Diensten: ${formatCurrency(type.breakdown.services * type.quantity)} excl. BTW (afbraak en recyclage, plaatsing, siliconeren en MDF-afwerking).`
        ],
        low: typeLow,
        high: typeLow,
        quantity: type.quantity,
        unitLow: type.breakdown.total,
        unitHigh: type.breakdown.total,
        carpentryLow: type.breakdown.carpentry * type.quantity,
        servicesLow: type.breakdown.services * type.quantity,
        pricing: {
          areaM2: Number((type.breakdown.areaM2 * type.quantity).toFixed(4)),
          finishingLm: Number((type.breakdown.finishingLm * type.quantity).toFixed(4)),
          sealantLm: Number((type.breakdown.sealantLm * type.quantity).toFixed(4)),
          carpentryTotal: formatCurrency(type.breakdown.carpentry * type.quantity),
          demolitionTotal: formatCurrency(type.breakdown.demolition * type.quantity),
          demolitionRecyclingTotal: formatCurrency(type.breakdown.demolitionRecycling * type.quantity),
          recyclingTotal: formatCurrency(type.breakdown.recycling * type.quantity),
          installationTotal: formatCurrency(type.breakdown.installation * type.quantity),
          sealantTotal: formatCurrency(type.breakdown.sealant * type.quantity),
          finishingTotal: formatCurrency(type.breakdown.finishing * type.quantity),
          weightKg: Number((type.breakdown.weightKg * type.quantity).toFixed(2)),
          demolitionRate: formatCurrency(type.breakdown.demolitionRate),
          recyclingRate: formatCurrency(type.breakdown.recyclingRate),
          installationRate: formatCurrency(type.breakdown.installationRate),
          sealantRate: formatCurrency(type.breakdown.sealantRate),
          finishingEntries: type.breakdown.finishingEntries.map((entry) => ({
            label: entry.label,
            unitPrice: formatCurrency(entry.unitPrice),
            total: formatCurrency(entry.unitPrice * type.quantity)
          }))
        }
      });
    });
    selection.itemsMaterial = "pvc";
    selection.itemsGlass = "double";
    selection.itemsFinishing = "mdf";
    selection.priceSplit = {
      carpentryLow,
      carpentryHigh: carpentryLow,
      servicesLow,
      servicesHigh: servicesLow
    };
  }

  const totalLowExcl = lowExcl;
  const totalHighExcl = highExcl;
  const vatLow = totalLowExcl * vatRate;
  const vatHigh = totalHighExcl * vatRate;
  const totalLowIncl = totalLowExcl + vatLow;
  const totalHighIncl = totalHighExcl + vatHigh;

  const estimate = {
    type: "simple",
    selection,
    rows,
    elementCounts: simpleElementTypes.map((type) => ({
      key: type.key,
      label: type.label,
      quantity: Math.max(0, Math.floor(Number(selection.elementQuantities?.[type.key]) || 0))
    })),
    priceSplit: selection.priceSplit || {
      carpentryLow: 0,
      carpentryHigh: 0,
      servicesLow: 0,
      servicesHigh: 0
    },
    vatRate,
    subtotalLow: formatCurrency(lowExcl),
    subtotalHigh: formatCurrency(highExcl),
    totalLowExcl: formatCurrency(totalLowExcl),
    totalHighExcl: formatCurrency(totalHighExcl),
    vatLow: formatCurrency(vatLow),
    vatHigh: formatCurrency(vatHigh),
    totalLowIncl: formatCurrency(totalLowIncl),
    totalHighIncl: formatCurrency(totalHighIncl),
    totalRangeIncl: formatSimpleRange(totalLowIncl, totalHighIncl),
    totalHighInclRaw: totalHighIncl
  };
  const supportBreakdown = simpleSupportBreakdown(estimate);
  estimate.supportRows = supportBreakdown.combinedRows;
  estimate.supportPremiumRows = supportBreakdown.premiumRows;
  estimate.supportLoanRows = supportBreakdown.loanRows;
  estimate.supportIncomeNote = simpleSupportIncomeNote();
  return estimate;
}

function updateSimpleEstimatePreview() {
  if (!simpleLiveEstimateEl) return;
  const totalElements = simpleElementQuantityTotal();
  if (totalElements < 1) {
    simpleLiveEstimateEl.innerHTML = "<span>Indicatieve totaalprijs</span><strong>Voeg ramen of deuren toe</strong>";
    return;
  }
  const estimate = calculateSimpleEstimate();
  simpleLiveEstimateEl.innerHTML = `
    <span>Indicatieve totaalprijs voor ${totalElements} ${totalElements === 1 ? "element" : "elementen"}</span>
    <strong>${estimate.totalRangeIncl}</strong>
    <small>incl. btw, op basis van standaard PVC wit, driedubbel glas en MDF binnenafwerking</small>
  `;
}

function simpleSupportCategoryRows(estimate) {
  return simpleSupportBreakdown(estimate).combinedRows;
}

function simpleSupportBreakdown(estimate) {
  const supportOptions = currentSupportOptions();
  if (!supportOptions.enabled) {
    return {
      premiumRows: [["Status", "Niet ingevuld", "Niet ingevuld"]],
      loanRows: [
        ["Status", "Niet ingevuld"],
        ["Lening initieel", "Niet ingevuld"],
        ["Te financieren", "Niet ingevuld"],
        ["Maandlast", "Niet ingevuld"]
      ],
      combinedRows: [["Status", "Niet ingevuld", "Niet ingevuld", "Niet ingevuld"]],
      premiumTotal: null,
      loanMonthly: null,
      loanEligible: false,
      notFilled: true
    };
  }
  const selectedCategory = supportOptions.enabled ? supportIncomeCategory(supportOptions) : "";
  const eligibleHigh = {
    items: 0,
    facade: 0,
    roof: 0
  };

  estimate.rows.forEach((row) => {
    const label = String(row.label || "").toLowerCase();
    if (label.includes("ramen")) eligibleHigh.items += Number(row.high) || 0;
    if (label.includes("gevel")) eligibleHigh.facade += Number(row.high) || 0;
    if (label.includes("dak")) eligibleHigh.roof += Number(row.high) || 0;
  });

  const premiumRows = [];
  const loanRows = [];
  const combinedRows = [];
  let premiumTotalValue = 0;
  let loanMonthlyValue = 0;
  let loanEligibleValue = false;
  let loanPrincipalBeforePremiumValue = 0;
  let loanPrincipalValue = 0;
  let loanOwnContributionValue = 0;
  let loanRateValue = 0;
  let categoryLabelValue = "-";

  (selectedCategory ? [selectedCategory] : []).forEach((category) => {
    const itemPremium = calculatePremiumForCategory(eligibleHigh.items, category, "items");
    const facadePremium = calculatePremiumForCategory(eligibleHigh.facade, category, "facade");
    const roofPremium = calculatePremiumForCategory(eligibleHigh.roof, category, "roof");
    const premiumTotal = itemPremium + facadePremium + roofPremium;
    const loanRate = supportRules2026.loan.rates[category];
    const effectiveLoanRate = Number.isFinite(loanRate) ? loanRate : supportRules2026.loan.rates.category2;
    const loanEligible =
      selectedCategory &&
      estimate.totalHighInclRaw >= supportRules2026.loan.min;
    const loanPrincipal = loanEligible
      ? Math.max(0, Math.min(estimate.totalHighInclRaw, supportRules2026.loan.max) - premiumTotal)
      : 0;
    const loanMonthly = loanEligible ? monthlyLoanPayment(loanPrincipal, effectiveLoanRate, supportRules2026.loan.maxYears) : 0;
    const loanPrincipalBeforePremium = loanEligible ? Math.min(estimate.totalHighInclRaw, supportRules2026.loan.max) : 0;
    premiumTotalValue = premiumTotal;
    loanMonthlyValue = loanMonthly;
    loanEligibleValue = loanEligible;
    loanPrincipalBeforePremiumValue = loanPrincipalBeforePremium;
    loanPrincipalValue = loanPrincipal;
    loanOwnContributionValue = loanEligible ? Math.max(0, estimate.totalHighInclRaw - loanPrincipalBeforePremium) : estimate.totalHighInclRaw;
    loanRateValue = effectiveLoanRate;
    categoryLabelValue = supportCategoryLabel(category);

    premiumRows.push([
      supportCategoryLabel(category),
      itemPremium > 0 ? formatCurrency(itemPremium) : "-",
      premiumTotal > 0 ? formatCurrency(premiumTotal) : "-"
    ]);

    combinedRows.push([
      supportCategoryLabel(category),
      itemPremium > 0 ? formatCurrency(itemPremium) : "-",
      premiumTotal > 0 ? formatCurrency(premiumTotal) : "-",
      loanEligible ? `${formatCurrency(loanMonthly)} / maand` : "Bedrag te laag"
    ]);
  });

  const loanUnavailableLabel = "Bedrag te laag";
  loanRows.push(
    ["Categorie", categoryLabelValue],
    ["Netto na premie", formatCurrency(Math.max(0, estimate.totalHighInclRaw - premiumTotalValue))],
    ["Lening initieel", loanEligibleValue ? formatCurrency(loanPrincipalBeforePremiumValue) : loanUnavailableLabel],
    ["Premie afgelost", loanEligibleValue ? `-${formatCurrency(premiumTotalValue)}` : loanUnavailableLabel],
    ["Te financieren", loanEligibleValue ? formatCurrency(loanPrincipalValue) : loanUnavailableLabel],
    ["Eigen inbreng", formatCurrency(loanOwnContributionValue)],
    ["Rentevoet", loanEligibleValue ? `${(Number(loanRateValue || 0) * 100).toFixed(1)}%` : "-"],
    ["Maandlast", loanEligibleValue ? `${formatCurrency(loanMonthlyValue)} / maand` : "-"],
    ["Looptijd", loanEligibleValue ? `${supportRules2026.loan.maxYears} jaar` : "-"]
  );

  return {
    premiumRows,
    loanRows,
    combinedRows,
    premiumTotal: premiumTotalValue,
    loanMonthly: loanMonthlyValue,
    loanEligible: loanEligibleValue,
    notFilled: false
  };
}

function simpleSupportIncomeNote() {
  const options = currentSupportOptions();
  if (options.enabled) {
    return `Op basis van het ingevulde gezamenlijk belastbaar inkomen (${formatCurrency(options.income)}) gebruiken we voorlopig ${supportCategoryLabel(supportIncomeCategory(options)).toLowerCase()}.`;
  }
  return [
    `Alleenstaande: cat. 4 tot ${formatCurrency(supportRules2026.single.category4Max)}, cat. 3 tot ${formatCurrency(supportRules2026.single.category3Max)}, cat. 2 tot ${formatCurrency(supportRules2026.single.category2Max)}.`,
    `Gezin/koppel: cat. 4 tot ${formatCurrency(supportRules2026.family.category4Max)}, cat. 3 tot ${formatCurrency(supportRules2026.family.category3Max)}, cat. 2 tot ${formatCurrency(supportRules2026.family.category2Max)}.`
  ].join(" ");
}

function customerPriceBounds(totalIncl) {
  const total = Math.max(0, Number(totalIncl) || 0);
  return { lower: total * 0.85, upper: total };
}

function renderSimpleQuoteStyle() {
  if (!quoteMailPreviewEl) return;
  const estimate = calculateSimpleEstimate();
  const range = customerPriceBounds(estimate.totalHighInclRaw);
  const euro = (value) => new Intl.NumberFormat("nl-BE", {
    style: "currency", currency: "EUR", maximumFractionDigits: 0
  }).format(value);
  const lower = euro(Math.floor(range.lower));
  const upper = euro(Math.ceil(range.upper));
  quoteMailPreviewEl.innerHTML = `
    <div class="overview-total-card customer-total" aria-label="Totale indicatieve prijsvork">
      <div class="customer-total-heading">Jouw totale richtprijs</div>
      <p class="customer-total-price">${escapeHtml(lower)} – ${escapeHtml(upper)}</p>
      <p class="customer-total-tax">Inclusief ${Math.round(estimate.vatRate * 100)}% btw</p>
      <p class="customer-total-note">Indicatieve prijsvork op basis van standaardmaten en je gekozen aantallen. De definitieve offerte volgt na opmeting en technische controle en kan afwijken.</p>
    </div>`;
}

function currentClient() {
  const modules = selectedModules();
  const mode = currentMeasurementMode();
  const simpleSelection = currentSimpleSelection();
  const scopeModules = mode === "simple" ? simpleSelection.modules : modules;
  return {
    name: getFieldValue(clientFields.name),
    company: getFieldValue(clientFields.company),
    email: getFieldValue(clientFields.email),
    phone: getFieldValue(clientFields.phone),
    address: getFieldValue(clientFields.address),
    city: getFieldValue(clientFields.city),
    postal: getFieldValue(clientFields.postal),
    consentToContact: true,
    marketingMailsConsent: newsletterConsentFields.some((field) => field.checked),
    leadIntent: String(leadIntentFields.find((field) => field.checked)?.value || ""),
    notes: getFieldValue(clientFields.notes),
    oldHouse: mode === "simple" ? simpleSelection.oldHouse : clientFields.oldHouse ? clientFields.oldHouse.value === "true" : false,
    timeline: getFieldValue(clientFields.timeline),
    scope: deriveLegacyScope(scopeModules),
    building: mode === "simple" ? simpleSelection.building : getFieldValue(clientFields.building),
    floors: Number(clientFields.floors ? clientFields.floors.value : 1) || 1,
    referralCode: getFieldValue(clientFields.referralCode),
    measurementMode: mode,
    simpleSelection: mode === "simple" ? simpleSelection : null,
    support: mode === "appointment" ? { enabled: false } : currentSupportOptions()
  };
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function leadIntentLabel(value) {
  return (
    {
      "information-only": "Enkel richtprijs ontvangen – niet bellen",
      "contact-me": "Project bespreken – contact gewenst",
      "appointment-request": "Afspraak aan huis – definitieve opmeting en advies"
    }[String(value || "")] || ""
  );
}

function isLocalTestRuntime() {
  const host = String(window.location.hostname || "").toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

function isDigitsOnly(value) {
  return /^\d+$/.test(value);
}

function validateClientFields() {
  const email = getFieldValue(clientFields.email);
  const phone = getFieldValue(clientFields.phone);
  const postal = getFieldValue(clientFields.postal);

  if (email && !isValidEmail(email)) {
    alert("Gebruik een geldig e-mailadres, bv. voorbeeld@email.com.");
    if (clientFields.email) clientFields.email.focus();
    return false;
  }

  if (phone && !isDigitsOnly(phone)) {
    alert("Telefoonnummer mag enkel cijfers bevatten.");
    if (clientFields.phone) clientFields.phone.focus();
    return false;
  }

  if (postal && !isDigitsOnly(postal)) {
    alert("Postcode mag enkel cijfers bevatten.");
    if (clientFields.postal) clientFields.postal.focus();
    return false;
  }

  if (moduleFields.support && moduleFields.support.checked) {
    const income = Number(supportFields.income ? supportFields.income.value : 0);
    if (!Number.isFinite(income) || income < 0) {
      alert("Vul het gezamenlijk belastbaar inkomen in voor de berekening van Mijn VerbouwPremie en Mijn VerbouwLening.");
      if (supportFields.income) supportFields.income.focus();
      return false;
    }
  }

  return true;
}

function saveToStorage(options = {}) {
  const { markDirty = true } = options;
  if (markDirty) markQuoteDirty();
  const payload = {
    client: currentClient(),
    modules: selectedModules(),
    items,
    facades,
    roofs,
    leadNotification,
    contactSyncNotification
  };
  localStorage.setItem(storageKey, JSON.stringify(payload));
}

function loadFromStorage() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    if (parsed.client) {
      setFieldValue(clientFields.name, parsed.client.name || "");
      setFieldValue(clientFields.company, parsed.client.company || "");
      setFieldValue(clientFields.email, parsed.client.email || "");
      setFieldValue(clientFields.phone, parsed.client.phone || "");
      setFieldValue(clientFields.address, parsed.client.address || "");
      setFieldValue(clientFields.city, parsed.client.city || "");

      if (!parsed.client.postal && parsed.client.city && /\b\d{4}\b/.test(parsed.client.city)) {
        const parts = parsed.client.city.split(/(\d{4})/);
        setFieldValue(clientFields.city, parts[0].trim());
        setFieldValue(clientFields.postal, parts[1] ? parts[1].trim() : "");
      } else {
        setFieldValue(clientFields.postal, parsed.client.postal || "");
      }

      setFieldValue(clientFields.notes, parsed.client.notes || "");
      const savedLeadIntent = String(parsed.client.leadIntent || "");
      if (savedLeadIntent) {
        leadIntentFields.forEach((field) => {
          field.checked = field.value === savedLeadIntent;
        });
      }
      newsletterConsentFields.forEach((field) => {
        field.checked = Boolean(parsed.client.marketingMailsConsent);
      });
      if (clientFields.oldHouse) clientFields.oldHouse.value = "";
      if (clientFields.timeline) clientFields.timeline.value = parsed.client.timeline || "snel";
      if (clientFields.scope) clientFields.scope.value = parsed.client.scope || "ramen";
      if (clientFields.building) clientFields.building.value = "";
      setMeasurementMode(parsed.client.measurementMode || "self");
      if (parsed.client.simpleSelection) {
        const simple = parsed.client.simpleSelection;
        const oldHouseChoice = simple.oldHouseChoice || String(simple.oldHouse !== false);
        setRadioValue(simpleFields.oldHouse, oldHouseChoice, "true");
        setRadioValue(simpleFields.building, simple.building || "gesloten-bebouwing", "gesloten-bebouwing");
        setRadioValue(simpleFields.itemsCount, simple.itemsCount || "1-3", "1-3");
        if (simple.elementQuantities && typeof simple.elementQuantities === "object") {
          simpleElementTypes.forEach((type) => {
            const field = simpleElementQuantityField(type.key);
            if (field) field.value = String(Math.max(0, Math.floor(Number(simple.elementQuantities[type.key]) || 0)));
          });
          updateSimpleElementCards();
        }
        setRadioValue(simpleFields.itemsMaterial, simple.itemsMaterial || "pvc", "pvc");
        setRadioValue(simpleFields.itemsGlass, simple.itemsGlass || "double", "double");
        setRadioValue(simpleFields.itemsFinishing, simple.itemsFinishing || "none", "none");
        setRadioValue(
          simpleFields.facadeCount,
          simpleAreaChoice(String(simple.facadeCount !== undefined ? simple.facadeCount : "60")),
          "60"
        );
        setRadioValue(simpleFields.facadeArea, simple.facadeArea || "lt40", "lt40");
        const facadeInsulation =
          simple.facadeInsulation === "no" || simple.facadeInsulation === false ? "no" : "yes";
        setRadioValue(simpleFields.facadeInsulation, facadeInsulation, "yes");
        setRadioValue(simpleFields.facadeFinish, simple.facadeFinish || "crepi", "crepi");
        setRadioValue(
          simpleFields.roofCount,
          simpleAreaChoice(String(simple.roofCount || simple.roofSlopedCount || simple.roofFlatCount || "60")),
          "60"
        );
        const legacyRoofType = simple.roofType || "flat";
        const roofFlatCount =
          simple.roofFlatCount !== undefined ? simple.roofFlatCount : legacyRoofType === "flat" ? 1 : 0;
        const roofSlopedCount =
          simple.roofSlopedCount !== undefined ? simple.roofSlopedCount : legacyRoofType === "sloped" ? 1 : 0;
        setRadioValue(simpleFields.roofFlatCount, String(roofFlatCount), "1");
        setRadioValue(simpleFields.roofSlopedCount, String(roofSlopedCount), "0");
        setRadioValue(simpleFields.roofFlatArea, simple.roofFlatArea || simple.roofArea || "lt40", "lt40");
        setRadioValue(simpleFields.roofSlopedArea, simple.roofSlopedArea || simple.roofArea || "lt40", "lt40");
        setRadioValue(simpleFields.roofFlatMaterial, simple.roofFlatMaterial || "epdm", "epdm");
        setRadioValue(simpleFields.roofInsulation, simple.roofInsulation || "yes", "yes");
      }
      const savedFloorValue =
        parsed.client.floors !== undefined && parsed.client.floors !== null
          ? parsed.client.floors
          : parsed.client.apartmentFloor;
      if (clientFields.floors) clientFields.floors.value = String(savedFloorValue ?? 1);
      if (clientFields.referralCode) clientFields.referralCode.value = parsed.client.referralCode || "";
      const support = parsed.client.support || {};
      if (supportFields.premium) supportFields.premium.value = String(support.premium !== false);
      if (supportFields.loan) supportFields.loan.value = String(support.loan !== false);
      if (supportFields.household) supportFields.household.value = support.household || "single";
      if (supportFields.dependents) supportFields.dependents.value = String(support.dependents ?? 0);
      if (supportFields.income) supportFields.income.value = String(support.income ?? 0);
      if (supportFields.ownerOccupant) supportFields.ownerOccupant.value = String(support.ownerOccupant !== false);
      if (supportFields.domiciled) supportFields.domiciled.value = String(support.domiciled !== false);
      if (supportFields.otherProperty) supportFields.otherProperty.value = String(Boolean(support.otherProperty));
      if (supportFields.flemishRegion) supportFields.flemishRegion.value = String(support.flemishRegion !== false);
      if (supportFields.before2006) supportFields.before2006.value = String(support.before2006 !== false);
      if (supportFields.loanYears) supportFields.loanYears.value = String(support.loanYears || 25);
    }

    if (parsed.modules) {
      if (moduleFields.items) moduleFields.items.checked = Boolean(parsed.modules.items);
      if (moduleFields.facade) moduleFields.facade.checked = Boolean(parsed.modules.facade);
      if (moduleFields.roof) moduleFields.roof.checked = Boolean(parsed.modules.roof);
      if (moduleFields.support) moduleFields.support.checked = Boolean(parsed.modules.support);
    } else if (parsed.client && parsed.client.scope) {
      const scope = parsed.client.scope;
      if (moduleFields.items) moduleFields.items.checked = scope === "ramen" || scope === "beide" || scope === "ramen-dak" || scope === "alles";
      if (moduleFields.facade) moduleFields.facade.checked = scope === "gevel" || scope === "beide" || scope === "gevel-dak" || scope === "alles";
      if (moduleFields.roof) moduleFields.roof.checked = scope === "dak" || scope === "ramen-dak" || scope === "gevel-dak" || scope === "alles";
      if (moduleFields.support) moduleFields.support.checked = Boolean(parsed.client.support?.enabled);
    }

    items = Array.isArray(parsed.items) ? parsed.items.map(normalizeItem) : [];
    facades = Array.isArray(parsed.facades) ? parsed.facades.map(normalizeFacade) : [];
    roofs = Array.isArray(parsed.roofs) ? parsed.roofs.map(normalizeRoof) : [];
    leadNotification = {
      sent: Boolean(parsed.leadNotification?.sent),
      signature: String(parsed.leadNotification?.signature || ""),
      sentAt: String(parsed.leadNotification?.sentAt || "")
    };
    contactSyncNotification = {
      sent: Boolean(parsed.contactSyncNotification?.sent),
      signature: String(parsed.contactSyncNotification?.signature || ""),
      sentAt: String(parsed.contactSyncNotification?.sentAt || ""),
      created: Boolean(parsed.contactSyncNotification?.created)
    };
    renderItems();
    renderFacades();
    renderRoofs();
    renderDraftFacadeOpenings();
    refreshFacadeElementOptions();
    applyScopeVisibility();
    updateTotals();
  } catch (err) {
    console.warn("Kon concept niet laden:", err);
  }
}

function leadSignatureFromClient(client) {
  const name = String(client?.name || "").trim().toLowerCase();
  const email = String(client?.email || "").trim().toLowerCase();
  const phone = String(client?.phone || "").trim().toLowerCase();
  const city = String(client?.city || "").trim().toLowerCase();
  if (!name && !email && !phone && !city) return "";
  const address = String(client?.address || "").trim().toLowerCase();
  const postal = String(client?.postal || "").trim().toLowerCase();
  const oldHouse = client?.oldHouse ? "old" : "new";
  const scope = String(client?.scope || "").trim().toLowerCase();
  const building = String(client?.building || "").trim().toLowerCase();
  const floors = String(client?.floors || "").trim().toLowerCase();
  const referralCode = String(client?.referralCode || "").trim().toLowerCase();
  const support = client?.support ? JSON.stringify(client.support) : "";
  return `${name}|${email}|${phone}|${city}|${address}|${postal}|${oldHouse}|${scope}|${building}|${floors}|${referralCode}|${support}`;
}

function currentLeadAttribution() {
  const params = new URLSearchParams(window.location.search || "");
  const referrer = document.referrer || "";
  const utmSource = params.get("utm_source") || "";
  const utmMedium = params.get("utm_medium") || "";
  const utmCampaign = params.get("utm_campaign") || "";
  const clickId = params.get("gclid") || params.get("gbraid") || params.get("wbraid") || params.get("fbclid") || params.get("msclkid") || "";
  const sourceHint = `${utmSource} ${utmMedium} ${referrer} ${clickId ? window.location.search : ""}`.toLowerCase();
  let source = "Rechtstreeks / onbekend";

  if (params.get("gclid") || params.get("gbraid") || params.get("wbraid") || sourceHint.includes("google")) {
    source = "Google";
  } else if (
    params.get("fbclid") ||
    sourceHint.includes("facebook") ||
    sourceHint.includes("instagram") ||
    sourceHint.includes("meta")
  ) {
    source = "Meta";
  } else if (params.get("msclkid") || sourceHint.includes("bing")) {
    source = "Microsoft/Bing";
  } else if (sourceHint.includes("schijnpoort.be")) {
    source = "Eigen website";
  } else if (referrer) {
    source = "Verwijzende site";
  }

  return {
    source,
    pageUrl: window.location.href,
    referrer,
    utmSource,
    utmMedium,
    utmCampaign,
    clickId
  };
}

async function sendLeadInBackgroundOnce() { return; }

function contactSyncSignatureFromClient(client) {
  const name = String(client?.name || "").trim().toLowerCase();
  const email = String(client?.email || "").trim().toLowerCase();
  const phone = String(client?.phone || "").trim().toLowerCase();
  const city = String(client?.city || "").trim().toLowerCase();
  const address = String(client?.address || "").trim().toLowerCase();
  const postal = String(client?.postal || "").trim().toLowerCase();
  return `${name}|${email}|${phone}|${city}|${address}|${postal}`;
}

function sendContactSyncInBackgroundOnce() { return Promise.resolve({success:false,created:false}); }

function currentVatRate() {
  return currentClient().oldHouse ? 0.06 : 0.21;
}

function toInclVat(amountExcl) {
  const value = Number(amountExcl) || 0;
  return value * (1 + currentVatRate());
}

function currentSupportOptions() {
  const income = Math.max(0, Number(supportFields.income ? supportFields.income.value : 0) || 0);
  const legacySupportSelected = Boolean(moduleFields.support && moduleFields.support.checked);
  const optionalSupportFilled = income > 0;
  return {
    enabled: legacySupportSelected || optionalSupportFilled,
    premium: supportFields.premium ? supportFields.premium.value === "true" : true,
    loan: supportFields.loan ? supportFields.loan.value === "true" : true,
    household: getFieldValue(supportFields.household) || "single",
    dependents: Math.max(0, Math.floor(Number(supportFields.dependents ? supportFields.dependents.value : 0) || 0)),
    income,
    ownerOccupant: supportFields.ownerOccupant ? supportFields.ownerOccupant.value === "true" : true,
    domiciled: supportFields.domiciled ? supportFields.domiciled.value === "true" : true,
    otherProperty: supportFields.otherProperty ? supportFields.otherProperty.value === "true" : false,
    flemishRegion: supportFields.flemishRegion ? supportFields.flemishRegion.value === "true" : true,
    before2006: supportFields.before2006 ? supportFields.before2006.value === "true" : true,
    ventilation: true,
    loanYears: Math.min(
      supportRules2026.loan.maxYears,
      Math.max(1, Number(supportFields.loanYears ? supportFields.loanYears.value : 25) || 25)
    )
  };
}

function supportIncomeCategory(options) {
  if (options.otherProperty) return "category1";

  const isSingleBase = options.household === "single" && options.dependents === 0;
  const base = isSingleBase ? supportRules2026.single : supportRules2026.family;
  const extraDependents = options.household === "single"
    ? Math.max(0, options.dependents - 1)
    : Math.max(0, options.dependents);
  const increase = extraDependents * supportRules2026.incomeExtraPerDependent;
  const income = Number(options.income) || 0;

  if (income <= base.category4Max + increase) return "category4";
  if (income <= base.category3Max + increase) return "category3";
  if (income <= base.category2Max + increase) return "category2";
  return "category1";
}

function supportCategoryLabel(category) {
  const labels = {
    category4: "Inkomenscategorie 4",
    category3: "Inkomenscategorie 3",
    category2: "Inkomenscategorie 2",
    category1: "Inkomenscategorie 1"
  };
  return labels[category] || "-";
}

function calculatePremiumForCategory(amountExcl, category, type) {
  const rule = supportRules2026.premium[type] && supportRules2026.premium[type][category];
  const amount = Number(amountExcl) || 0;
  if (!rule || amount < 1000) return 0;
  return Math.min(amount, rule.invoiceCap) * rule.rate > rule.max
    ? rule.max
    : Math.min(amount, rule.invoiceCap) * rule.rate;
}

function monthlyLoanPayment(principal, annualRate, years) {
  const amount = Number(principal) || 0;
  const months = Math.max(1, Math.round((Number(years) || 1) * 12));
  const monthlyRate = (Number(annualRate) || 0) / 12;
  if (amount <= 0) return 0;
  if (monthlyRate <= 0) return amount / months;
  return (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
}

function roofPremiumEligibleSubtotal() {
  return calculateRoofTotals().rows.reduce((sum, row) => {
    if (row.roof.insulation === "none") return sum;
    return sum + row.areaCost + row.structureCost + row.insulationCost + row.gutterCost;
  }, 0);
}

function calculateSupport(totals) {
  const options = currentSupportOptions();
  const empty = {
    enabled: false,
    options,
    category: "",
    categoryLabel: "-",
    premiumEligible: false,
    loanEligible: false,
    premiumTotal: 0,
    netAfterPremium: totals.totalIncl,
    loanPrincipalBeforePremium: 0,
    loanPrincipalAfterPremium: 0,
    loanOwnContribution: totals.totalIncl,
    loanMonthly: 0,
    loanYears: options.loanYears,
    loanRate: 0,
    rows: [],
    notes: []
  };

  if (!options.enabled) return empty;

  const category = supportIncomeCategory(options);
  const baseEligible = options.ownerOccupant && options.flemishRegion && options.before2006;
  const categoryAllowsPremium = category === "category3" || category === "category4";
  const premiumEligible = options.premium && baseEligible && categoryAllowsPremium;
  const notes = [];
  const rows = [];

  if (options.otherProperty) {
    notes.push("Andere volle eigendom: voor de premie valt de klant automatisch in inkomenscategorie 1 en voor de lening is er geen recht als eigenaar-bewoner.");
  }
  if (!options.ownerOccupant) notes.push("Geen eigenaar-bewoner: deze indicatie rekent geen premie of lening voor particuliere eigenaar-bewoners.");
  if (!options.flemishRegion) notes.push("De woning moet in het Vlaams Gewest liggen.");
  if (!options.before2006) notes.push("Voor deze categorieën moet de woning of het gebouw dateren van voor 1 januari 2006.");
  if (options.premium && !categoryAllowsPremium) {
    notes.push("Sinds 1 maart 2026 is er voor deze werken geen Mijn VerbouwPremie meer voor inkomenscategorie 1 en 2.");
  }
  if (totals.includeItems && !options.ventilation) {
    notes.push("Ramen en deuren tellen niet mee omdat de ventilatievoorwaarde op 'Nee' staat.");
  }

  const itemEligibleAmount = totals.includeItems && options.ventilation ? totals.subtotalItems : 0;
  const facadeEligibleAmount = totals.includeFacades ? totals.subtotalFacade : 0;
  const roofEligibleAmount = totals.includeRoof ? roofPremiumEligibleSubtotal() : 0;

  const itemPremium = premiumEligible ? calculatePremiumForCategory(itemEligibleAmount, category, "items") : 0;
  const facadePremium = premiumEligible ? calculatePremiumForCategory(facadeEligibleAmount, category, "facade") : 0;
  const roofPremium = premiumEligible ? calculatePremiumForCategory(roofEligibleAmount, category, "roof") : 0;

  if (totals.includeItems) rows.push({ label: "Ramen & deuren", amount: itemEligibleAmount, premium: itemPremium });
  if (totals.includeFacades) rows.push({ label: "Gevelrenovatie", amount: facadeEligibleAmount, premium: facadePremium });
  if (totals.includeRoof) rows.push({ label: "Dakrenovatie", amount: roofEligibleAmount, premium: roofPremium });
  if (totals.includeRoof && roofEligibleAmount <= 0) {
    notes.push("Dakwerken tellen enkel mee voor de premie als er nieuwe isolatie in het dakwerk is opgenomen.");
  }

  const premiumTotal = itemPremium + facadePremium + roofPremium;
  const loanRate = supportRules2026.loan.rates[category];
  const effectiveLoanRate = Number.isFinite(loanRate) ? loanRate : supportRules2026.loan.rates.category2;
  const loanEligible =
    options.loan &&
    options.ownerOccupant &&
    options.domiciled &&
    options.flemishRegion &&
    !options.otherProperty &&
    totals.totalIncl >= supportRules2026.loan.min;

  if (options.loan && totals.totalIncl < supportRules2026.loan.min) {
    notes.push("Mijn VerbouwLening kan pas vanaf een ontleningsbedrag van 4.000 euro.");
  }
  if (options.loan && !options.domiciled) {
    notes.push("Voor Mijn VerbouwLening moet de klant gedomicilieerd zijn of binnen 36 maanden gedomicilieerd worden.");
  }

  const loanPrincipalBeforePremium = loanEligible
    ? Math.min(totals.totalIncl, supportRules2026.loan.max)
    : 0;
  const loanPrincipalAfterPremium = loanEligible
    ? Math.max(0, loanPrincipalBeforePremium - premiumTotal)
    : 0;
  const loanMonthly = loanEligible
    ? monthlyLoanPayment(loanPrincipalAfterPremium, effectiveLoanRate, options.loanYears)
    : 0;

  return {
    enabled: true,
    options,
    category,
    categoryLabel: supportCategoryLabel(category),
    premiumEligible,
    loanEligible,
    premiumTotal,
    netAfterPremium: Math.max(0, totals.totalIncl - premiumTotal),
    loanPrincipalBeforePremium,
    loanPrincipalAfterPremium,
    loanOwnContribution: loanEligible ? Math.max(0, totals.totalIncl - loanPrincipalBeforePremium) : totals.totalIncl,
    loanMonthly,
    loanYears: options.loanYears,
    loanRate: Number.isFinite(effectiveLoanRate) ? effectiveLoanRate : 0,
    rows,
    notes
  };
}

function generateQuoteCode(_scope) {
  const now = new Date();
  const stamp = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate()
  ).padStart(2, "0")}`;
  const mode = currentMeasurementMode();
  const source = mode === "simple" ? "RICHT" : mode === "appointment" ? "OPMET" : "ZELF";
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const random = Array.from({ length: 5 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `${source}-${stamp}-${random}`;
}

function selectedModules() {
  if (currentMeasurementMode() === "appointment") {
    return { items: false, facade: false, roof: false, support: false };
  }
  return {
    items: true,
    facade: false,
    roof: false,
    support: false
  };
}

function currentMeasurementMode() {
  if (forcedMeasurementMode) return forcedMeasurementMode;
  const selected = measurementModeFields.find((field) => field.checked);
  if (selected && selected.value === "appointment") return "appointment";
  if (selected && selected.value === "simple") return "simple";
  return "self";
}

function setMeasurementMode(mode) {
  const requestedMode = forcedMeasurementMode || mode;
  const normalized = requestedMode === "appointment" || requestedMode === "simple" ? requestedMode : "self";
  measurementModeFields.forEach((field) => {
    field.checked = field.value === normalized;
  });
}

function setRadioValue(fields, value, fallback = "") {
  const target = String(value || fallback);
  if (fields.length === 1 && fields[0].type === "range") {
    fields[0].value = target;
    updateSimpleAreaSliderLabels();
    return;
  }
  let matched = false;
  fields.forEach((field) => {
    const isMatch = field.value === target;
    field.checked = isMatch;
    if (isMatch) matched = true;
  });
  if (!matched && fields[0]) fields[0].checked = true;
}

function markChoiceCardSelection(field) {
  const card = field ? field.closest(".project-choice-card") : null;
  if (!field || !card) return;
  if (field.type === "radio" && field.name) {
    document.querySelectorAll('input[type="radio"]').forEach((radio) => {
      if (radio.name === field.name) {
        radio.closest(".project-choice-card")?.classList.remove("is-selected");
      }
    });
  }
  card.classList.toggle("is-selected", Boolean(field.checked));
}

function syncChoiceCardSelections(fields) {
  fields.forEach((field) => {
    const card = field.closest(".project-choice-card");
    if (card) card.classList.toggle("is-selected", Boolean(field.checked));
  });
}

function syncHousingChoicesFromFields() {
  if (clientFields.oldHouse) {
    if (clientFields.oldHouse.value) {
      setRadioValue(housingChoiceFields.oldHouse, clientFields.oldHouse.value, "");
    } else {
      housingChoiceFields.oldHouse.forEach((field) => {
        field.checked = false;
      });
    }
    syncChoiceCardSelections(housingChoiceFields.oldHouse);
  }
  if (clientFields.building) {
    if (clientFields.building.value) {
      setRadioValue(housingChoiceFields.building, clientFields.building.value, "");
    } else {
      housingChoiceFields.building.forEach((field) => {
        field.checked = false;
      });
    }
    syncChoiceCardSelections(housingChoiceFields.building);
  }
}

function updateSimpleAreaSliderLabels() {
  [
    {
      field: simpleFields.facadeCount[0],
      valueEl: document.getElementById("simple-facade-count-value"),
      hintEl: document.getElementById("simple-facade-count-hint")
    },
    {
      field: simpleFields.roofCount[0],
      valueEl: document.getElementById("simple-roof-count-value"),
      hintEl: document.getElementById("simple-roof-count-hint")
    }
  ].forEach(({ field, valueEl, hintEl }) => {
    if (!field) return;
    const value = Number(field.value) || 0;
    if (valueEl) valueEl.textContent = `${value} m2`;
    if (hintEl) hintEl.textContent = simpleHomeSizeLabel(value);
  });
}

function clearMeasurementModeChoice() {
  measurementModeFields.forEach((field) => {
    field.checked = false;
    field.closest(".project-choice-card")?.classList.remove("is-selected");
  });
}

function clearStepChoices(stepKey) {
  const stepEl = wizardSteps.find((step) => step.dataset.stepKey === stepKey);
  if (!stepEl) return;
  stepEl.querySelectorAll('.project-choice-card input[type="radio"], .project-choice-card input[type="checkbox"]').forEach((field) => {
    field.checked = false;
    field.closest(".project-choice-card")?.classList.remove("is-selected");
  });
  if (stepKey === "housing") {
    if (clientFields.oldHouse) clientFields.oldHouse.value = "";
    if (clientFields.building) clientFields.building.value = "";
  }
}

function checkedRadioValue(fields, fallback = "") {
  const selected = fields.find((field) => field.checked);
  if (!selected && fields.length === 1 && fields[0].type === "range") {
    return fields[0].value || fallback;
  }
  return selected ? selected.value : fallback;
}

function checkedRadioLabel(fields, fallback = "") {
  const selected = fields.find((field) => field.checked);
  if (!selected) return fallback;
  const card = selected.closest(".project-choice-card");
  return card ? card.textContent.trim().replace(/\s+/g, " ") : selected.value;
}

function selectedSimpleModules() {
  return {
    items: true,
    facade: false,
    roof: false,
    support: false
  };
}

function deriveLegacyScope(modules) {
  if (modules.items && modules.facade && modules.roof) return "alles";
  if (modules.items && modules.facade) return "beide";
  if (modules.items && modules.roof) return "ramen-dak";
  if (modules.facade && modules.roof) return "gevel-dak";
  if (modules.facade && !modules.items) return "gevel";
  if (modules.items && !modules.facade) return "ramen";
  if (modules.roof && !modules.items && !modules.facade) return "dak";
  return "ramen";
}

function syncScopeFromModules() {
  if (!clientFields.scope) return;
  clientFields.scope.value = deriveLegacyScope(
    currentMeasurementMode() === "simple" ? selectedSimpleModules() : selectedModules()
  );
}

function wizardStepOrder() {
  const mode = currentMeasurementMode();
  if (forcedMeasurementMode === "simple") return ["simple_items_count", "personal", "overview"];
  if (forcedMeasurementMode === "self") {
    return ["elements", "personal", "overview"];
  }
  if (mode === "appointment") {
    return ["measurement", "personal"];
  }
  if (mode === "simple") {
    return ["measurement", "simple_items_count", "personal", "overview"];
  }
  return ["measurement", "elements", "personal", "overview"];
}

const wizardStepLabels = {
  personal: "Woning",
  housing: "Woonst",
  projects: "Keuze",
  measurement: "Opmeting",
  simple_vat: "BTW",
  simple_building: "Woonst",
  simple_items_count: "Ramen/deuren",
  simple_facade_count: "Geveloppervlakte",
  simple_roof_count: "Dakoppervlakte",
  elements: "Ramen/deuren",
  facade: "Gevel",
  roof: "Dak",
  overview: "Overzicht"
};

const simpleProgressGroups = [
  { key: "measurement", label: "Opmeting", steps: ["measurement"] },
  { key: "housing", label: "Woonst", steps: ["housing"] },
  { key: "projects", label: "Keuze", steps: ["projects"] },
  {
    key: "simple_items_count",
    label: "Ramen/deuren",
    steps: ["simple_items_count"]
  },
  {
    key: "simple_facade_count",
    label: "Geveloppervlakte",
    steps: ["simple_facade_count"]
  },
  {
    key: "simple_roof_count",
    label: "Dakoppervlakte",
    steps: ["simple_roof_count"]
  },
  { key: "personal", label: "Woning", steps: ["personal"] },
  { key: "overview", label: "Overzicht", steps: ["overview"] }
];

function wizardProgressItems(order) {
  if (currentMeasurementMode() !== "simple") {
    return order.map((key) => ({
      key,
      label: wizardStepLabels[key] || key,
      steps: [key]
    }));
  }

  return simpleProgressGroups
    .map((group) => ({
      ...group,
      steps: group.steps.filter((step) => order.includes(step))
    }))
    .filter((group) => group.steps.length);
}


function updateApartmentFloorVisibility() {
  const isApartment = clientFields.building && clientFields.building.value === "appartement";
  if (floorsLabel) {
    floorsLabel.textContent = isApartment ? "Op welk verdiep" : "Aantal verdiepingen";
  }
  if (clientFields.floors) {
    clientFields.floors.min = isApartment ? "0" : "1";
    clientFields.floors.placeholder = isApartment ? "Bijv. 2" : "Aantal verdiepingen";
    if (!isApartment && Number(clientFields.floors.value) < 1) {
      clientFields.floors.value = "1";
    }
  }
}

function renderWizardProgress(order) {
  if (!wizardProgressEl) return;
  const progressItems = wizardProgressItems(order);
  wizardProgressEl.innerHTML = "";
  wizardProgressEl.style.setProperty("--wizard-step-count", String(Math.max(progressItems.length, 1)));
  const activeGroupIndex = progressItems.findIndex((group) => group.steps.includes(activeStepKey));
  const progressPercent =
    progressItems.length > 0 && activeGroupIndex >= 0
      ? ((activeGroupIndex + 1) / progressItems.length) * 100
      : 0;
  wizardProgressEl.style.setProperty("--mobile-progress-percent", `${progressPercent}%`);

  progressItems.forEach((group, index) => {
    const item = document.createElement("div");
    item.className = "wizard-progress-item";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "wizard-step-btn";
    button.dataset.step = group.steps[0];
    const isUnlocked = group.steps.some((step) => unlockedStepKeys.has(step));
    button.disabled = !isUnlocked;
    button.setAttribute("aria-disabled", String(!isUnlocked));
    if (!isUnlocked) button.classList.add("is-locked");

    if (index < activeGroupIndex) button.classList.add("is-complete");
    if (index === activeGroupIndex) button.classList.add("is-active");

    button.innerHTML = `<span class="wizard-step-dot">${index + 1}</span><span class="wizard-step-label">${group.label}</span>`;
    item.appendChild(button);
    wizardProgressEl.appendChild(item);

    if (index < progressItems.length - 1) {
      const line = document.createElement("span");
      line.className = "wizard-progress-line";
      if (index <= activeGroupIndex) line.style.background = "var(--accent-strong)";
      wizardProgressEl.appendChild(line);
    }
  });
}

function isMobileWizardViewport() {
  return Boolean(window.matchMedia && window.matchMedia("(max-width: 640px)").matches);
}

function placeWizardProgress(order, activeStepEl) {
  if (!wizardProgressShellEl || !activeStepEl) return;
  const shouldPlaceInPanel =
    isMobileWizardViewport() &&
    order.includes(activeStepKey);

  if (shouldPlaceInPanel) {
    const panelHeader = activeStepEl.querySelector(".panel-header");
    if (panelHeader) {
      const headerContent = panelHeader.querySelector(":scope > div");
      if (headerContent) {
        const titleEl = headerContent.querySelector("h2");
        headerContent.insertBefore(wizardProgressShellEl, titleEl || headerContent.firstChild);
      } else {
        panelHeader.insertAdjacentElement("afterend", wizardProgressShellEl);
      }
    } else {
      activeStepEl.insertBefore(wizardProgressShellEl, activeStepEl.firstChild);
    }
    return;
  }

  if (wizardProgressHomeMarker.parentNode && wizardProgressShellEl.parentNode !== wizardProgressHomeMarker.parentNode) {
    wizardProgressHomeMarker.parentNode.insertBefore(wizardProgressShellEl, wizardProgressHomeMarker.nextSibling);
  }
}

function updateSimpleStepTitles(order) {
  document.querySelectorAll(".wizard-step .panel-header .eyebrow").forEach((eyebrowEl) => {
    if (!eyebrowEl.dataset.wizardEyebrow) {
      eyebrowEl.dataset.wizardEyebrow = eyebrowEl.textContent;
    }
    eyebrowEl.textContent = eyebrowEl.dataset.wizardEyebrow;
  });

  document.querySelectorAll("[data-simple-title]").forEach((titleEl) => {
    titleEl.textContent = titleEl.dataset.simpleTitle || titleEl.textContent;
    const eyebrowEl = titleEl.closest(".panel-header")?.querySelector(".eyebrow");
    if (eyebrowEl && eyebrowEl.dataset.simpleEyebrow) {
      eyebrowEl.textContent = eyebrowEl.dataset.simpleEyebrow;
    }
  });

  const progressItems = wizardProgressItems(order);
  order.forEach((stepKey, index) => {
    const stepEl = wizardSteps.find((step) => step.dataset.stepKey === stepKey);
    if (!stepEl) return;
    const titleEl = stepEl.querySelector("[data-simple-title]");
    const eyebrowEl = stepEl.querySelector(".panel-header .eyebrow");
    if (eyebrowEl) {
      if (!eyebrowEl.dataset.simpleEyebrow) {
        eyebrowEl.dataset.simpleEyebrow = eyebrowEl.textContent;
      }
      const progressIndex = progressItems.findIndex((group) => group.steps.includes(stepKey));
      const progressGroup = progressItems[progressIndex];
      if (currentMeasurementMode() === "simple" && progressGroup) {
        eyebrowEl.textContent = `Stap ${progressIndex + 1} - ${progressGroup.label}`;
      } else {
        eyebrowEl.textContent = `Stap ${index + 1}`;
      }
    }
    if (titleEl) {
      titleEl.textContent = titleEl.dataset.simpleTitle || titleEl.textContent;
    }
  });
}

function goToWizardStep(stepKey, order = wizardStepOrder()) {
  if (!stepKey || stepKey === activeStepKey) return;
  const currentIndex = order.indexOf(activeStepKey);
  const nextIndex = order.indexOf(stepKey);
  const isBack = currentIndex >= 0 && nextIndex >= 0 && nextIndex < currentIndex;
  activeStepKey = stepKey;
  if (isBack) {
    if (stepKey === "measurement") {
      clearMeasurementModeChoice();
    } else {
      clearStepChoices(stepKey);
    }
  }
}

function updateTermsActionLabel() {
  if (!termsActionLabelEl) return;
  const mode = currentMeasurementMode();
  const label =
    mode === "appointment"
      ? "opmeting aanvragen"
    : activeStepKey === "personal"
      ? "prijs berekenen"
      : mode === "self"
      ? "start prijsberekening"
      : "prijs berekenen";
  termsActionLabelEl.textContent = label;
}

function renderWizard() {
  const order = wizardStepOrder();
  const mode = currentMeasurementMode();
  unlockedStepKeys = new Set(Array.from(unlockedStepKeys).filter((key) => order.includes(key)));
  unlockedStepKeys.add(order[0]);
  if (!order.includes(activeStepKey)) {
    activeStepKey = order[0];
  }
  unlockedStepKeys.add(activeStepKey);

  document.body.classList.toggle("is-simple-flow", mode === "simple");
  document.body.classList.toggle("is-self-flow", mode === "self");
  document.body.classList.toggle("is-appointment-flow", mode === "appointment");
  document.body.classList.toggle("show-prices-immediately", showPricesImmediately);
  document.body.classList.toggle("has-forced-measurement-mode", Boolean(forcedMeasurementMode));
  document.body.classList.toggle("is-mobile-wizard", isMobileWizardViewport());
  if (personalHousingFieldsEl) {
    personalHousingFieldsEl.classList.toggle("hidden", mode === "appointment");
  }

  wizardSteps.forEach((step) => {
    const key = step.dataset.stepKey;
    const visible = key === activeStepKey && order.includes(key);
    step.classList.toggle("active", visible);
  });

  updateSimpleStepTitles(order);
  renderWizardProgress(order);

  const activeStepEl = wizardSteps.find((step) => step.dataset.stepKey === activeStepKey);
  placeWizardProgress(order, activeStepEl);
  document.querySelectorAll(".mobile-step-back").forEach((button) => button.remove());
  if (wizardControlsEl && activeStepEl) {
    activeStepEl.appendChild(wizardControlsEl);
  }
  if (activeStepEl) {
    attachLanguageSwitcher(activeStepEl);
  }

  if (wizardBackButton) {
    const isFirst = order.indexOf(activeStepKey) <= 0;
    wizardBackButton.disabled = isFirst;
    wizardBackButton.classList.toggle("hidden", isFirst);
  }
  if (wizardNextButton) {
    const isLast = order.indexOf(activeStepKey) >= order.length - 1;
    const isAppointmentSubmit =
      currentMeasurementMode() === "appointment" && activeStepKey === "personal";
    const isSimpleOverview = currentMeasurementMode() === "simple" && activeStepKey === "overview";
    if (isAppointmentSubmit) {
      wizardNextButton.textContent = "Opmeting aanvragen";
      wizardNextButton.disabled = false;
    } else if (isSimpleOverview) {
      wizardNextButton.textContent = "Opnieuw berekenen";
      wizardNextButton.disabled = false;
    } else if (isLast) {
      wizardNextButton.textContent = "Opnieuw berekenen";
      wizardNextButton.disabled = false;
    } else {
      const isPenultimate =
        order.indexOf(activeStepKey) === order.length - 2 &&
        currentMeasurementMode() !== "appointment";
      const isSimpleElementStep =
        currentMeasurementMode() === "simple" && activeStepKey === "simple_items_count";
      const isSelfElementStep =
        currentMeasurementMode() === "self" && activeStepKey === "elements";
      wizardNextButton.textContent =
        activeStepKey === "personal" && currentMeasurementMode() !== "appointment"
          ? "Prijs berekenen"
          : isPenultimate
          ? "Overzicht bekijken"
          : isSimpleElementStep || isSelfElementStep
          ? "Woning en prijs bekijken"
          : "Volgende stap";
      wizardNextButton.disabled = false;
    }
  }
  const isCustomerOverview = activeStepKey === "overview";
  document.body.classList.toggle("is-customer-overview", isCustomerOverview);
  const adviceAction = document.getElementById("advice-action");
  if (adviceAction) adviceAction.hidden = !isCustomerOverview;
  if (wizardNextButton) {
    wizardNextButton.classList.toggle("primary", !isCustomerOverview);
    wizardNextButton.classList.toggle("secondary", isCustomerOverview);
  }
  updateTermsActionLabel();
  if (wizardControlsEl) {
    const hideClickThroughControls =
      activeStepKey === "measurement";
    wizardControlsEl.classList.toggle("mobile-hidden", hideClickThroughControls);
  }

  if (
    activeStepEl &&
    order.indexOf(activeStepKey) > 0
  ) {
    const backButton = document.createElement("button");
    backButton.type = "button";
    backButton.className = "mobile-step-back";
    backButton.setAttribute("aria-label", "Vorige stap");
    backButton.addEventListener("click", () => {
      const index = order.indexOf(activeStepKey);
      if (index <= 0) return;
      goToWizardStep(order[index - 1], order);
      renderWizard();
      updateTotals();
      scrollWizardToTop();
    });
    const headerTitle = activeStepEl.querySelector(".panel-header > div");
    if (headerTitle) {
      headerTitle.insertBefore(backButton, headerTitle.firstChild);
    } else {
      activeStepEl.prepend(backButton);
    }
  }

  if (activeStepKey && activeStepKey !== lastTrackedStepKey) {
    lastTrackedStepKey = activeStepKey;
    trackParentEvent("quote_builder_flow_state");
    trackContactformPage();
  }
}

function advanceWizardStep() {
  const order = wizardStepOrder();
  const index = order.indexOf(activeStepKey);
  if (index < 0 || index >= order.length - 1) return;

  const nextStepKey = order[index + 1];
  unlockedStepKeys.add(nextStepKey);
  goToWizardStep(nextStepKey, order);
  renderWizard();
  updateTotals();
  scrollWizardToTop();
}

function scheduleWizardAdvance(delay = 110) {
  if (mobileAdvanceTimer) window.clearTimeout(mobileAdvanceTimer);
  mobileAdvanceTimer = window.setTimeout(() => {
    mobileAdvanceTimer = null;
    advanceWizardStep();
  }, delay);
}

function resetDetailedModuleChoices() {
  Object.values(moduleFields).forEach((field) => {
    if (field) field.checked = false;
  });
  syncScopeFromModules();
}

function scrollWizardToTop() {
  const topTarget =
    document.querySelector(".page") ||
    document.querySelector(".hero") ||
    document.body;
  const topOffset = topTarget && typeof topTarget.getBoundingClientRect === "function"
    ? topTarget.getBoundingClientRect().top + window.scrollY
    : 0;

  window.scrollTo({ top: topOffset, behavior: "smooth" });
  if (document.documentElement) document.documentElement.scrollTop = topOffset;
  if (document.body) document.body.scrollTop = topOffset;

  requestAnimationFrame(() => {
    window.scrollTo({ top: topOffset, behavior: "smooth" });
  });
}

function validateHousingFields() {
  const isApartment = clientFields.building && clientFields.building.value === "appartement";
  if (!clientFields.oldHouse || !getFieldValue(clientFields.oldHouse)) {
    alert("Kies of de woning ouder dan 10 jaar is.");
    return false;
  }
  if (!clientFields.building || !getFieldValue(clientFields.building)) {
    alert("Kies een type woning.");
    return false;
  }
  if (clientFields.floors) {
    const floorValue = Number(clientFields.floors.value);
    if (isApartment && floorValue < 0) {
      alert("Vul een geldig verdiep in.");
      clientFields.floors.focus();
      return false;
    }
    if (!isApartment && floorValue <= 0) {
      alert("Aantal verdiepingen moet minstens 1 zijn.");
      clientFields.floors.focus();
      return false;
    }
  }
  return true;
}

function validateStep(stepKey) {
  if (stepKey === "personal") {
    return validateHousingFields();
  }

  if (stepKey === "housing") {
    return validateHousingFields();
  }

  if (stepKey === "projects") {
    const modules = selectedModules();
    if (!modules.items && !modules.facade && !modules.roof && !modules.support) {
      alert("Kies minstens één projectmodule.");
      return false;
    }
    return true;
  }

  if (stepKey === "measurement") {
    if (!measurementModeFields.some((field) => field.checked)) {
      alert("Kies hoe je jouw prijs wil berekenen.");
      return false;
    }
    return true;
  }

  if (stepKey === "simple_items_count") {
    if (simpleElementQuantityTotal() < 1) {
      alert("Duid minstens één raam of deur aan.");
      return false;
    }
    return true;
  }

  if (stepKey === "elements" && selectedModules().items && items.length < 1) {
    alert("Voeg minstens één element toe voor je verdergaat.");
    return false;
  }

  if (stepKey === "facade" && selectedModules().facade && facades.length < 1) {
    alert("Voeg minstens één gevel toe voor je verdergaat.");
    return false;
  }

  if (stepKey === "roof" && selectedModules().roof && roofs.length < 1) {
    alert("Voeg minstens één dakwerk toe voor je verdergaat.");
    return false;
  }

  return true;
}

function applyScopeVisibility() {
  syncScopeFromModules();
  const modules = currentMeasurementMode() === "appointment"
    ? { items: false, facade: false, roof: false, support: false }
    : selectedModules();
  const showItems = modules.items;
  const showFacades = modules.facade;
  const showRoof = modules.roof;

  if (itemsPanel) itemsPanel.classList.toggle("hidden", !showItems);
  if (facadePanel) facadePanel.classList.toggle("hidden", !showFacades);
  if (roofPanel) roofPanel.classList.toggle("hidden", !showRoof);
  if (supportFieldsWrap) {
    supportFieldsWrap.classList.remove("hidden");
  }
  if (subtotalItemsBlock) subtotalItemsBlock.classList.toggle("hidden", !showItems);
  if (subtotalFacadeBlock) subtotalFacadeBlock.classList.toggle("hidden", !showFacades);
  if (subtotalRoofBlock) subtotalRoofBlock.classList.toggle("hidden", !showRoof);
  if (itemsBreakdownBlock) itemsBreakdownBlock.classList.toggle("hidden", !showItems);
  if (facadeBreakdownBlock) facadeBreakdownBlock.classList.toggle("hidden", !showFacades);
}

function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function openingSnapshotLabel(type, widthCm, heightCm) {
  const typeLabel = itemTypeLabels[type] || type || "Element";
  return `${typeLabel} ${formatSizeMmFromCm(widthCm, heightCm)}`;
}

function cmToMm(cm) {
  const value = Number(cm);
  if (!Number.isFinite(value)) return 0;
  return value * 10;
}

function mmInputToCm(mm) {
  const value = Number(mm);
  if (!Number.isFinite(value)) return 0;
  return Math.round((value / 10) * 1000) / 1000;
}

function itemDimensionValidation() {
  const fields = [widthField, heightField].filter(Boolean);
  const invalidFields = fields.filter((field) => {
    const value = Number(field.value);
    return field.value !== "" && (!Number.isFinite(value) || value < MIN_ITEM_DIMENSION_MM);
  });

  fields.forEach((field) => {
    const invalid = invalidFields.includes(field);
    field.classList.toggle("dimension-invalid", invalid);
    field.setCustomValidity(invalid ? `Vul minstens ${MIN_ITEM_DIMENSION_MM} mm in.` : "");
  });

  if (itemDimensionHintEl) {
    const message = invalidFields.length
      ? `Deze maat is te klein. Vul afmetingen in millimeters in: minimaal ${MIN_ITEM_DIMENSION_MM} mm breed én hoog.`
      : `Vul afmetingen in millimeters in. Minimum: ${MIN_ITEM_DIMENSION_MM} mm breed en ${MIN_ITEM_DIMENSION_MM} mm hoog.`;
    itemDimensionHintEl.textContent = message;
    itemDimensionHintEl.classList.toggle("is-error", invalidFields.length > 0);
  }

  return invalidFields.length === 0;
}

function formatDimensionMmFromCm(cm) {
  const mm = cmToMm(cm);
  if (!mm) return "-";
  return Number.isInteger(mm) ? String(mm) : String(Number(mm.toFixed(1)));
}

function formatSizeMmFromCm(widthCm, heightCm) {
  return `${formatDimensionMmFromCm(widthCm)} x ${formatDimensionMmFromCm(heightCm)} mm`;
}

function normalizeItem(item) {
  const typeMap = {
    poort: "poort",
    garagepoort: "poort",
    "deur-zijlicht": "deur-zijlicht"
  };
  const shutterMap = {
    "rolluik-mechanisch": "rolluik",
    "rolluik-elektrisch": "rolluik",
    zonnewering: "zonnewering",
    rolluik: "rolluik"
  };

  const type = typeMap[item.type] || item.type || "raam";

  const legacyGlassMap = {
    double: "pvc_double",
    triple: "pvc_triple"
  };
  const normalizedGlass = legacyGlassMap[item.glass] || item.glass || "pvc_double";

  const normalized = {
    ...item,
    id: item.id || generateId("item"),
    type,
    glass: normalizedGlass,
    finishing: item.finishing || "none",
    color: item.color || "standard",
    opening: item.opening || "vast",
    shutter: shutterMap[item.shutter] || "none",
    widthCm: Number(item.widthCm) || 0,
    heightCm: Number(item.heightCm) || 0,
    quantity: Math.max(1, Number(item.quantity) || 1)
  };

  if (normalized.type === "poort") {
    normalized.opening = "vast";
    normalized.glass = "pvc_triple";
    normalized.finishing = "none";
    normalized.shutter = "none";
  }

  return normalized;
}

function isDoorType(type) {
  return type === "deur" || type === "deur-zijlicht" || type === "deur-element" || type === "deur-dubbel";
}

function isAluminiumSystem(glassType) {
  return glassType === "alu_double" || glassType === "alu_triple" || glassType === "alu_passive";
}

function isTripleWeightSystem(glassType) {
  return glassType === "pvc_triple" || glassType === "alu_triple" || glassType === "alu_passive";
}

function applyItemTypeFieldRules() {
  if (!typeField) return;
  const type = typeField.value;
  const isPoort = type === "poort";
  const isWindow = type === "raam";
  const isDoor = isDoorType(type);
  const isWindowDoor = isWindowDoorType(type);
  if (itemForm) itemForm.classList.toggle("item-form-poort", isPoort);

  const openingWrapper = openingField ? openingField.closest(".field") : null;
  if (openingWrapper) openingWrapper.classList.toggle("hidden", !isWindow);
  if (openingField) {
    openingField.disabled = !isWindow;
    if (!isWindow) openingField.value = "vast";
  }

  const glassWrapper = glassField ? glassField.closest(".field") : null;
  if (glassWrapper) glassWrapper.classList.toggle("hidden", isPoort);
  if (glassField) {
    const panelOption = glassField.querySelector('option[value="panel"]');
    const aluOptions = [
      glassField.querySelector('option[value="alu_double"]'),
      glassField.querySelector('option[value="alu_triple"]'),
      glassField.querySelector('option[value="alu_passive"]')
    ];
    if (panelOption) {
      panelOption.hidden = !isDoor;
      panelOption.disabled = !isDoor;
      if (!isDoor && glassField.value === "panel") glassField.value = "pvc_double";
    }
    aluOptions.forEach((opt) => {
      if (!opt) return;
      opt.hidden = !isWindowDoor || isPoort;
      opt.disabled = !isWindowDoor || isPoort;
    });
    if (glassField.value === "double") glassField.value = "pvc_double";
    if (glassField.value === "triple") glassField.value = "pvc_triple";
    if (!glassField.value) glassField.value = "pvc_double";
    if (!isWindowDoor && !isPoort) {
      glassField.value = "pvc_double";
    }
    if (isPoort) {
      glassField.disabled = true;
      glassField.value = "pvc_triple";
    } else {
      glassField.disabled = false;
    }
  }

  const finishingWrapper = finishingField ? finishingField.closest(".field") : null;
  if (finishingWrapper) finishingWrapper.classList.toggle("hidden", isPoort);
  if (finishingField) {
    finishingField.disabled = isPoort;
    if (isPoort) finishingField.value = "none";
  }

  const shutterWrapper = shutterField ? shutterField.closest(".field") : null;
  if (shutterWrapper) shutterWrapper.classList.toggle("hidden", isPoort);
  if (shutterField) {
    shutterField.disabled = isPoort;
    if (isPoort) shutterField.value = "none";
  }

  if (colorField) {
    const standardOption = colorField.querySelector('option[value="standard"]');
    const singleOption = colorField.querySelector('option[value="single"]');
    const doubleOption = colorField.querySelector('option[value="double"]');

    const isAlu = isAluminiumSystem(glassField ? glassField.value : "");

    if (isPoort) {
      if (standardOption) standardOption.textContent = "Wit";
      if (singleOption) singleOption.textContent = "Kleur buiten";
      if (doubleOption) {
        doubleOption.hidden = true;
        doubleOption.disabled = true;
      }
      if (colorField.value === "double") colorField.value = "standard";
    } else {
      if (standardOption) standardOption.textContent = "Standaard kleur";
      if (singleOption) singleOption.textContent = "Te kiezen kleur (1 kant)";
      if (doubleOption) {
        doubleOption.hidden = false;
        doubleOption.disabled = false;
      }
      if (isAlu) {
        if (singleOption) {
          singleOption.hidden = true;
          singleOption.disabled = true;
        }
        if (colorField.value === "single") colorField.value = "double";
      } else if (singleOption) {
        singleOption.hidden = false;
        singleOption.disabled = false;
      }
    }
  }
}

function normalizeFacadeOpening(opening) {
  const source = opening && opening.source === "item" ? "item" : "custom";
  const rawSills = opening ? String(opening.sills || "none") : "none";
  const sills = rawSills === "aluminium" || rawSills === "blauwe-hardsteen" ? rawSills : "none";
  return {
    id: opening.id || generateId("opening"),
    source,
    itemId: source === "item" ? opening.itemId || null : null,
    itemType: opening.itemType || "",
    widthCm: Number(opening.widthCm) || 0,
    heightCm: Number(opening.heightCm) || 0,
    quantity: Math.max(1, Number(opening.quantity) || 1),
    label: opening.label || "",
    sills
  };
}

function normalizeFacade(facade) {
  const options = facade && facade.options ? facade.options : {};
  const normalizeOpt = (value, allowed) => (allowed.includes(value) ? value : "none");
  return {
    ...facade,
    finish: facade.finish || "crepi",
    insulation: facade.insulation || "10",
    widthCm: Number(facade.widthCm) || 0,
    heightCm: Number(facade.heightCm) || 0,
    openings: Array.isArray(facade.openings) ? facade.openings.map(normalizeFacadeOpening) : [],
    options: {
      gutter: normalizeOpt(String(options.gutter || "none"), ["none", "trespa"]),
      plinths: normalizeOpt(String(options.plinths || "none"), ["none", "blauwe-hardsteen", "watervaste-crepi"]),
      downpipe: normalizeOpt(String(options.downpipe || "none"), ["none", "zink"])
    }
  };
}

function normalizeRoof(roof) {
  const rawType = roof.type || "flat";
  const type = rawType === "plat" ? "flat" : rawType === "hellend" ? "sloped" : rawType;
  const systemMap = {
    "plat-epdm": "flat-epdm",
    "plat-bitumen": "flat-roofing",
    "hellend-pannen": "sloped-tiles",
    "hellend-leien": "sloped-slate"
  };
  let system = systemMap[roof.system] || roof.system || (type === "sloped" ? "sloped-tiles" : "flat-epdm");
  if (type === "sloped") {
    system = "sloped-tiles";
  }
  const legacyArea = Number(roof.area) || 0;
  const lengthM = Math.max(0, Number(roof.lengthM) || 0);
  const widthM = Math.max(0, Number(roof.widthM) || 0);
  const solarPanels = ["none", "panels", "panels-battery"].includes(String(roof.solarPanels))
    ? String(roof.solarPanels)
    : roof.solarPanels === true
    ? "panels"
    : "none";
  const insulation =
    roof.insulation === true
      ? "mineral-wool"
      : ["none", "mineral-wool", "pu"].includes(String(roof.insulation))
      ? String(roof.insulation)
      : "none";
  return {
    id: roof.id || generateId("roof"),
    type,
    system,
    area: legacyArea,
    lengthM: lengthM || (type === "flat" && legacyArea ? legacyArea : 0),
    widthM: widthM || (type === "flat" && legacyArea ? 1 : 0),
    depthM: Math.max(0, Number(roof.depthM) || 0),
    heightM: Math.max(0, Number(roof.heightM) || 0),
    facadeWidthM: Math.max(0, Number(roof.facadeWidthM) || 0),
    quantity: 1,
    solarPanels,
    replaceStructure: Boolean(roof.replaceStructure),
    insulation,
    renewGutter: Boolean(roof.renewGutter),
    gutterLm: Math.max(0, Number(roof.gutterLm) || 0)
  };
}

function roofUnitRate(roof) {
  return roofRates.systems[roof.system] || roofRates.systems["flat-epdm"];
}

function roofAreaM2(roof) {
  if (roof.type === "sloped") {
    const slopedSide = Math.sqrt(Math.pow(Number(roof.depthM) || 0, 2) + Math.pow(Number(roof.heightM) || 0, 2));
    const grossArea = slopedSide * (Number(roof.facadeWidthM) || 0) || Number(roof.area) || 0;
    return Math.max(0, grossArea);
  }
  const flatArea = (Number(roof.lengthM) || 0) * (Number(roof.widthM) || 0);
  return flatArea || Number(roof.area) || 0;
}

function roofSlopedSideM(roof) {
  if (roof.type !== "sloped") return 0;
  return Math.sqrt(Math.pow(Number(roof.depthM) || 0, 2) + Math.pow(Number(roof.heightM) || 0, 2));
}

function roofAccessoryLm(roof) {
  if (!roof.renewGutter) return 0;
  if (roof.type === "sloped") return Number(roof.facadeWidthM) || 0;
  return 2 * ((Number(roof.lengthM) || 0) + (Number(roof.widthM) || 0));
}

function roofLineBreakdown(roof, options = {}) {
  const area = roofAreaM2(roof);
  const applySmallRoofMultiplier = options.applySmallRoofMultiplier !== false;
  // Small roof uplift with soft cap (same logic as facades, but up to 60 m²).
  // - up to 40 m²: full 1.5x
  // - 40 to 60 m²: decreasing factor so uplifted area price never exceeds the 60 m² cap
  // - above 60 m²: no uplift
  const smallRoofMultiplier = applySmallRoofMultiplier && area > 0 && area <= 60 ? Math.min(1.5, 60 / area) : 1;
  const areaCost = area * roofUnitRate(roof) * smallRoofMultiplier;
  const structureCost = roof.replaceStructure ? area * roofRates.structureReplacement * smallRoofMultiplier : 0;
  const insulationCost =
    roof.insulation !== "none" ? area * roofRates.insulation * smallRoofMultiplier : 0;
  const solarCost =
    roof.solarPanels === "panels" || roof.solarPanels === "panels-battery" ? roofRates.solarPanels : 0;
  const batteryCost = roof.solarPanels === "panels-battery" ? roofRates.homeBattery : 0;
  const accessoryLm = roofAccessoryLm(roof);
  const accessoryRate = roof.type === "sloped" ? roofRates.gutterLm : roofRates.upstandLm;
  const gutterCost = accessoryLm * accessoryRate;
  const total = areaCost + structureCost + insulationCost + solarCost + batteryCost + gutterCost;
  return {
    area,
    smallRoofMultiplier,
    areaCost,
    structureCost,
    insulationCost,
    solarCost,
    batteryCost,
    accessoryLm,
    gutterCost,
    total
  };
}

function calculateRoofTotals(options = {}) {
  const rows = roofs.map((roof) => {
    const calc = roofLineBreakdown(roof, options);
    return {
      roof,
      ...calc
    };
  });

  const total = rows.reduce((sum, row) => sum + row.total, 0);
  return {
    rows,
    total,
    areaTotal: rows.reduce((sum, row) => sum + row.area, 0),
    gutterTotalLm: rows.reduce((sum, row) => sum + row.accessoryLm, 0)
  };
}

function roofExtrasLabel(roof) {
  const parts = [];
  parts.push(roofSolarLabels[roof.solarPanels] || roofSolarLabels.none);
  parts.push(roof.replaceStructure ? "Constructie vervangen" : "Constructie behouden");
  parts.push(roofInsulationLabels[roof.insulation] || roofInsulationLabels.none);
  if (roof.renewGutter) {
    const label = roof.type === "sloped" ? "Dakgoten" : "Dakopstanden";
    parts.push(`${label} ${roofAccessoryLm(roof).toFixed(1)} lm`);
  }
  return parts.length ? parts.join(" · ") : "-";
}

function cmToM(value) {
  return Math.max(0, (Number(value) || 0) / 100);
}

function mToCm(value) {
  return Math.max(0, Math.round((Number(value) || 0) * 100));
}

function draftRoofFromForm() {
  if (!roofTypeField || !roofSystemField) return null;
  const type = roofTypeField.value === "sloped" ? "sloped" : "flat";
  const roof = normalizeRoof({
    type,
    system: roofSystemField.value || (type === "sloped" ? "sloped-tiles" : "flat-epdm"),
    lengthM: cmToM(roofLengthField ? roofLengthField.value : 0),
    widthM: cmToM(roofWidthField ? roofWidthField.value : 0),
    depthM: cmToM(roofDepthField ? roofDepthField.value : 0),
    heightM: cmToM(roofHeightField ? roofHeightField.value : 0),
    facadeWidthM: cmToM(roofFacadeWidthField ? roofFacadeWidthField.value : 0),
    solarPanels: roofSolarField ? roofSolarField.value : "none",
    replaceStructure: roofStructureField ? roofStructureField.value === "true" : false,
    insulation: roofInsulationField ? roofInsulationField.value : "none",
    renewGutter: roofGutterRenewField ? roofGutterRenewField.value === "true" : false
  });
  return roofAreaM2(roof) > 0 ? roof : null;
}

function renderRoofDraftTotal() {
  if (!roofDraftTotalEl) return;
  const draftRoof = draftRoofFromForm();
  if (!draftRoof) {
    roofDraftTotalEl.textContent = formatCurrency(0);
    if (roofDraftTotalNoteEl) roofDraftTotalNoteEl.textContent = "";
    return;
  }

  const breakdown = roofLineBreakdown(draftRoof, { applySmallRoofMultiplier: false });
  roofDraftTotalEl.textContent = formatCurrency(toInclVat(breakdown.total));
  if (roofDraftTotalNoteEl) {
    const noteParts = [`${breakdown.area.toFixed(2)} m²`, "preview zonder klein-daktoeslag"];
    if (breakdown.accessoryLm > 0) {
      noteParts.push(`${breakdown.accessoryLm.toFixed(2)} lm ${draftRoof.type === "sloped" ? "dakgoten" : "dakopstanden"}`);
    }
    roofDraftTotalNoteEl.textContent = noteParts.join(" · ");
  }
}

function renderRoofs(roofTotals = null) {
  if (!roofBody) return;
  roofBody.innerHTML = "";

  if (!roofs.length) {
    const row = document.createElement("tr");
    row.className = "empty-row";
    row.innerHTML = '<td colspan="6">Nog geen dakwerken toegevoegd</td>';
    roofBody.appendChild(row);
    return;
  }

  roofs.forEach((roof, index) => {
    const calc =
      roofTotals && Array.isArray(roofTotals.rows) && roofTotals.rows[index]
        ? roofTotals.rows[index]
        : roofLineBreakdown(roof, { applySmallRoofMultiplier: shouldShowActualQuotePrices() });
    const row = document.createElement("tr");
    row.dataset.index = String(index);
    row.innerHTML = `
      <td>${roofTypeLabels[roof.type] || roof.type}</td>
      <td>${roofSystemLabels[roof.system] || roof.system}</td>
      <td>${calc.area.toFixed(1)} m²</td>
      <td>${roofExtrasLabel(roof)}</td>
      <td>${formatCurrency(calc.total)}</td>
      <td>
        <div class="table-actions">
          <button class="remove-btn roof-remove-btn" data-index="${index}" aria-label="Verwijder dakwerk">×</button>
        </div>
      </td>
    `;
    roofBody.appendChild(row);
  });
}

function updateRoofFormMode() {
  if (!roofTypeField || !roofSystemField || !roofForm) return;
  const type = roofTypeField.value === "sloped" ? "sloped" : "flat";
  roofForm.dataset.roofType = type;
  if (type === "sloped") {
    roofSystemField.value = "sloped-tiles";
  } else if (roofSystemField.value !== "flat-epdm" && roofSystemField.value !== "flat-roofing") {
    roofSystemField.value = "flat-epdm";
  }
  if (roofGutterLabelEl) {
    roofGutterLabelEl.textContent = type === "sloped" ? "Dakgoten vernieuwen" : "Dakopstanden vernieuwen";
  }
  renderRoofDraftTotal();
}

function resetRoofForm() {
  if (!roofTypeField || !roofSystemField) return;
  roofTypeField.value = "flat";
  roofSystemField.value = "flat-epdm";
  if (roofLengthField) roofLengthField.value = "";
  if (roofWidthField) roofWidthField.value = "";
  if (roofDepthField) roofDepthField.value = "";
  if (roofHeightField) roofHeightField.value = "";
  if (roofFacadeWidthField) roofFacadeWidthField.value = "";
  if (roofSolarField) roofSolarField.value = "none";
  if (roofStructureField) roofStructureField.value = "false";
  if (roofInsulationField) roofInsulationField.value = "none";
  if (roofGutterRenewField) roofGutterRenewField.value = "false";
  editingRoofIndex = null;
  if (roofSubmitButton) roofSubmitButton.textContent = "Dakwerk toevoegen";
  updateRoofFormMode();
  renderRoofDraftTotal();
}

function addRoof(event) {
  event.preventDefault();
  const type = roofTypeField && roofTypeField.value === "sloped" ? "sloped" : "flat";
  const payload = normalizeRoof({
    id: editingRoofIndex !== null && roofs[editingRoofIndex] ? roofs[editingRoofIndex].id : generateId("roof"),
    type,
    system: roofSystemField ? roofSystemField.value : type === "sloped" ? "sloped-tiles" : "flat-epdm",
    lengthM: cmToM(roofLengthField ? roofLengthField.value : 0),
    widthM: cmToM(roofWidthField ? roofWidthField.value : 0),
    depthM: cmToM(roofDepthField ? roofDepthField.value : 0),
    heightM: cmToM(roofHeightField ? roofHeightField.value : 0),
    facadeWidthM: cmToM(roofFacadeWidthField ? roofFacadeWidthField.value : 0),
    solarPanels: roofSolarField ? roofSolarField.value : "none",
    replaceStructure: roofStructureField ? roofStructureField.value === "true" : false,
    insulation: roofInsulationField ? roofInsulationField.value : "none",
    renewGutter: roofGutterRenewField ? roofGutterRenewField.value === "true" : false
  });

  if (roofAreaM2(payload) <= 0) {
    alert(type === "sloped" ? "Vul diepte, hoogte en gevelbreedte in (in cm)." : "Vul lengte en breedte in (in cm).");
    return;
  }

  if (editingRoofIndex !== null) {
    roofs[editingRoofIndex] = payload;
  } else {
    roofs.push(payload);
  }

  renderRoofs();
  updateTotals();
  saveToStorage();
  resetRoofForm();
}

function removeRoof(event) {
  const button = event.target.closest(".roof-remove-btn");
  if (!button) return;
  const index = Number(button.dataset.index);
  if (!Number.isFinite(index) || !roofs[index]) return;
  roofs.splice(index, 1);
  renderRoofs();
  updateTotals();
  saveToStorage();
}

function areaInM2(item) {
  const dims = effectiveItemDimensionsCm(item);
  return (dims.widthCm * dims.heightCm) / 10000;
}

function perimeterInLm(item) {
  const dims = effectiveItemDimensionsCm(item);
  return ((dims.widthCm + dims.heightCm) * 2) / 100;
}

function serviceAreaInM2(item) {
  return ((Number(item?.widthCm) || 0) * (Number(item?.heightCm) || 0)) / 10000;
}

function finishingPerimeterLm(item) {
  return (((Number(item?.widthCm) || 0) + (Number(item?.heightCm) || 0)) * 2) / 100;
}

function isWindowDoorType(itemType) {
  return [
    "raam",
    "schuifraam",
    "deur",
    "deur-zijlicht",
    "deur-dubbel",
    "deur-element"
  ].includes(itemType);
}

function isFacadeRenovationActive() {
  return Boolean(selectedModules().facade);
}

function sealantRatePerLm() {
  return isFacadeRenovationActive() ? ZWELBAND_RATE_PER_LM : SILICONE_RATE_PER_LM;
}

function sealantLabel() {
  return isFacadeRenovationActive()
    ? "Zwelband leveren & plaatsen"
    : "Transparant silicone (voegbreedte max. 1 cm, incl. materiaal)";
}

function effectiveItemDimensionsCm(item) {
  // Sheet: rekenen met de opgegeven maten, zonder extra maatcorrectie.
  return { widthCm: Number(item?.widthCm) || 0, heightCm: Number(item?.heightCm) || 0 };
}

function totalElementsArea() {
  return items.reduce((sum, item) => sum + areaInM2(item) * item.quantity, 0);
}

function totalElementsLength() {
  return items.reduce(
    (sum, item) => sum + perimeterInLm(item) * item.quantity,
    0
  );
}

function totalElementsWidth() {
  return items.reduce((sum, item) => sum + (effectiveItemDimensionsCm(item).widthCm / 100) * item.quantity, 0);
}

function findItemById(itemId) {
  return items.find((item) => item.id === itemId) || null;
}

function resolvedFacadeOpenings(facade) {
  const openings = Array.isArray(facade.openings) ? facade.openings : [];
  return openings
    .map((opening) => {
      if (opening.source === "item" && opening.itemId) {
        const item = findItemById(opening.itemId);
        if (item) {
          return {
            ...opening,
            itemType: item.type,
            widthCm: Number(item.widthCm) || 0,
            heightCm: Number(item.heightCm) || 0,
            quantity: Math.max(1, Number(opening.quantity) || 1),
            label: openingSnapshotLabel(item.type, item.widthCm, item.heightCm),
            missingItem: false
          };
        }
      }

      const type = opening.itemType || "raam";
      return {
        ...opening,
        itemType: type,
        widthCm: Number(opening.widthCm) || 0,
        heightCm: Number(opening.heightCm) || 0,
        quantity: Math.max(1, Number(opening.quantity) || 1),
        label:
          opening.label ||
          (opening.source === "item"
            ? `${openingSnapshotLabel(type, opening.widthCm, opening.heightCm)} (element verwijderd)`
            : `Losse opening ${opening.widthCm} x ${opening.heightCm} cm`),
        missingItem: opening.source === "item"
      };
    })
    .filter((opening) => opening.widthCm > 0 && opening.heightCm > 0 && opening.quantity > 0);
}

function facadeOpeningsMetrics(facade) {
  const openings = resolvedFacadeOpenings(facade);
  return openings.reduce(
    (totals, opening) => {
      const area = ((opening.widthCm * opening.heightCm) / 10000) * opening.quantity;
      const length = ((2 * (opening.widthCm + opening.heightCm)) / 100) * opening.quantity;
      const width = (opening.widthCm / 100) * opening.quantity;
      totals.elementsArea += area;
      totals.elementsLength += length;
      totals.elementsWidth += width;
      totals.openings.push(opening);
      return totals;
    },
    { elementsArea: 0, elementsLength: 0, elementsWidth: 0, openings: [] }
  );
}

function totalFacadeArea() {
  return facades.reduce((sum, facade) => sum + facadeAreaInM2(facade), 0);
}

function totalFacadeWidth() {
  return facades.reduce((sum, facade) => sum + facade.widthCm / 100, 0);
}

function totalFacadeHeight() {
  return facades.reduce((sum, facade) => sum + facade.heightCm / 100, 0);
}

function facadeAreaInM2(facade) {
  return (facade.widthCm * facade.heightCm) / 10000;
}

function windowFormulaBasePrice(item) {
  const dims = effectiveItemDimensionsCm(item);
  const wMm = Number(dims.widthCm) * 10;
  const hMm = Number(dims.heightCm) * 10;
  if (!(wMm > 0) || !(hMm > 0)) return 0;

  const area = (wMm * hMm) / 1000000;
  const minSide = Math.min(wMm, hMm);
  const maxSide = Math.max(wMm, hMm);
  const ratio = minSide > 0 ? maxSide / minSide : 0;
  const slank = Math.abs(minSide - 500) < 0.001 && Math.abs(maxSide - 3000) < 0.001 ? 1 : 0;
  const klein = area <= 1.25 ? 1 : 0;

  const basis =
    38.18 +
    105.11 * area +
    16.01 * Math.pow(area, 2) +
    96.87 * slank +
    23.62 * klein;

  if (area >= 2 && area <= 3.5) {
    if (ratio >= 2.7) return 190 * area;
    if (area < 2.5) return 140 * area;
    return 130 * area;
  }

  return basis;
}

function colorMultiplier(item) {
  if (isAluminiumSystem(item?.glass)) {
    return item.color === "double" ? 1.1 : 1;
  }
  const area = areaInM2(item);
  if (item.color === "single") {
    return area < 3.5 ? 1.1 : 1.05;
  }
  if (item.color === "double") {
    return area < 3.5 ? 1.25 : 1.1;
  }
  return 1;
}

function openingMultiplier(item) {
  if (item.type !== "raam" || item.opening !== "draaikiep") return 1;
  return areaInM2(item) <= 1 ? 2 : 1.4;
}

function glassPriceMultiplier(item) {
  const system = item?.glass;

  const pvcDoubleForType = () => {
    if (item?.type === "raam") return 1.25;
    if (item?.type === "schuifraam") return 0.9;
    if (
      item?.type === "deur" ||
      item?.type === "deur-zijlicht" ||
      item?.type === "deur-element" ||
      item?.type === "deur-dubbel"
    ) {
      return 0.9;
    }
    return 1;
  };
  const pvcTripleForType = () => {
    if (item?.type === "raam") return 1.25 * 1.25;
    return 1;
  };

  if (system === "panel") return pvcDoubleForType();
  if (system === "pvc_double") return pvcDoubleForType();
  if (system === "pvc_triple") return pvcTripleForType();
  if (system === "alu_double") return pvcTripleForType() * 2;
  if (system === "alu_triple") return pvcTripleForType() * 2 * 1.1;
  if (system === "alu_passive") return pvcTripleForType() * 2 * 1.1 * 1.25;

  // Legacy fallback
  if (system === "double") return pvcDoubleForType();
  if (system === "triple") return pvcTripleForType();
  return 1;
}

function elementUnitBasePrice(item) {
  const area = areaInM2(item);
  const glassFactor = glassPriceMultiplier(item);

  if (item.type === "raam") {
    return windowFormulaBasePrice(item) * glassFactor;
  }
  if (item.type === "schuifraam") {
    return (1500 + area * 270) * glassFactor;
  }
  if (item.type === "deur") {
    return 1250 * glassFactor;
  }
  if (item.type === "deur-zijlicht") {
    return (1250 + windowFormulaBasePrice(item)) * glassFactor;
  }
  if (item.type === "deur-element") {
    return (1250 + windowFormulaBasePrice(item)) * glassFactor;
  }
  if (item.type === "deur-dubbel") {
    return 1800 * glassFactor;
  }
  if (item.type === "poort") {
    return 1750;
  }
  return 0;
}

function legacyElementUnitPrice(item) {
  const base = elementUnitBasePrice(item);
  const shutter = shutterUnitPrice(item);
  const baseMultiplier = WINDOW_DOOR_BASE_PRICE_MULTIPLIER;
  return (base * baseMultiplier * openingMultiplier(item) * colorMultiplier(item) + shutter) * ELEMENT_BASE_DISCOUNT_FACTOR;
}

function elementUnitBaseCost(item) {
  return legacyElementUnitPrice(item) * CARPENTRY_BASE_FROM_LEGACY_FACTOR;
}

function elementUnitPrice(item) {
  return elementUnitBaseCost(item) * (1 + CARPENTRY_MARGIN_RATE);
}

function linePrice(item) {
  return elementUnitPrice(item) * item.quantity;
}

function draftItemFromForm() {
  if (
    !typeField ||
    !glassField ||
    !finishingField ||
    !colorField ||
    !widthField ||
    !heightField ||
    !shutterField
  ) {
    return null;
  }

  const widthCm = mmInputToCm(widthField.value);
  const heightCm = mmInputToCm(heightField.value);
  if (!itemDimensionValidation() || ![widthCm, heightCm].every((n) => Number.isFinite(n) && n > 0)) return null;
  const selectedType = typeField.value;
  const isPoort = selectedType === "poort";
  const selectedShutter = isPoort ? "none" : shutterField.value;
  const selectedFinishing = isPoort ? "none" : finishingField.value;

  return normalizeItem({
    id: editingIndex !== null && items[editingIndex] ? items[editingIndex].id : "__draft__",
    type: selectedType,
    glass: isPoort ? "pvc_triple" : glassField.value || "pvc_double",
    finishing: selectedFinishing,
    color: colorField.value,
    opening: selectedType === "raam" ? openingField.value : "vast",
    shutter: selectedShutter,
    widthCm,
    heightCm,
    quantity: 1
  });
}

function renderItemDraftTotal() {
  if (!itemDraftTotalEl) return;
  const draftItem = draftItemFromForm();
  if (!draftItem) {
    itemDraftTotalEl.textContent = formatCurrency(0);
    if (itemDraftTotalNoteEl) itemDraftTotalNoteEl.textContent = "";
    return;
  }

  const parts = itemDirectCostParts(draftItem);
  const directTotal =
    parts.element +
    parts.demontage +
    parts.recycling +
    parts.montage +
    parts.sealant +
    parts.finishing;
  itemDraftTotalEl.textContent = formatCurrency(toInclVat(directTotal));
  if (itemDraftTotalNoteEl) {
    itemDraftTotalNoteEl.textContent =
      "Inclusief schrijnwerk, afbraak en recyclage, plaatsing, siliconeren en gekozen binnenafwerking.";
  }
}

function itemDirectCostParts(item) {
  const quantity = Math.max(1, Number(item.quantity) || 1);
  const unitWeightKg = itemWeightKg(item);
  const weightKg = unitWeightKg * quantity;
  const demontageTier = pickTierByWeight(unitWeightKg, demontageTiers);
  const montageTier = montageTierForItem(item, unitWeightKg);
  const sealantLm = perimeterInLm(item) * quantity;
  const sealantRate = sealantRatePerLm();
  const finishingEntries = finishingEntriesForItem(item);
  const finishing = finishingEntries.reduce((sum, entry) => sum + entry.unitPrice * quantity, 0);

  return {
    quantity,
    unitWeightKg,
    weightKg,
    demontageTier,
    montageTier,
    finishingEntries,
    element: linePrice(item),
    demontage: demontageTier.rate * quantity,
    recycling: (weightKg / 1000) * RECYCLING_RATE_PER_1000KG,
    recyclingRate: RECYCLING_RATE_PER_1000KG,
    montage: montageTier.rate * quantity,
    sealant: sealantLm * sealantRate,
    sealantLm,
    sealantRate,
    finishing
  };
}

function itemAllInTotals(itemsList, client) {
  const entries = (itemsList || []).map((item, index) => ({
    key: item.id || `idx-${index}`,
    parts: itemDirectCostParts(item)
  }));
  const totalsByKey = new Map();
  entries.forEach((entry) => {
    const direct =
      entry.parts.element +
      entry.parts.demontage +
      entry.parts.recycling +
      entry.parts.montage +
      entry.parts.sealant +
      entry.parts.finishing;

    totalsByKey.set(entry.key, {
      total: direct
    });
  });

  return totalsByKey;
}

function itemDirectPreviewTotal(item) {
  const parts = itemDirectCostParts(item);
  return (
    parts.element +
    parts.demontage +
    parts.recycling +
    parts.montage +
    parts.sealant +
    parts.finishing
  );
}

function calculateItemPreviewTotals() {
  return calculateItemTotals();
}

function itemSavingsHint() {
  return "Prijs volgens gewichtsklasse, gekozen afwerking en afzonderlijke recyclage.";
}

function itemHasFinishing(item) {
  return effectiveFinishing(item) !== "none";
}

function lowVolumeForfaitRule(itemsList = items) {
  const normalizedItems = itemsList || [];
  const totalCount = normalizedItems.reduce((sum, item) => sum + Math.max(1, Number(item.quantity) || 1), 0);
  const hasFinishing = normalizedItems.some(itemHasFinishing);
  const hasWithoutFinishing = normalizedItems.some((item) => !itemHasFinishing(item));
  const threshold = !hasFinishing ? 4 : hasWithoutFinishing ? 3 : 2;

  return {
    totalCount,
    threshold,
    applies: totalCount > 0 && totalCount <= threshold
  };
}

function formulaWeightKg(item) {
  const isTripleGlass = isTripleWeightSystem(item?.glass);
  const glassKgPerM2 = isTripleGlass ? 30 : 20;
  const profileKgPerLm = isTripleGlass ? 8 : 6;
  const dims = effectiveItemDimensionsCm(item);
  const glassWidthM = Math.max(dims.widthCm - 13, 0) / 100;
  const glassHeightM = Math.max(dims.heightCm - 13, 0) / 100;
  const glassKg = glassWidthM * glassHeightM * glassKgPerM2;
  const pvcLm = ((2 * dims.widthCm + 2 * dims.heightCm) / 100) * profileKgPerLm;
  return glassKg + pvcLm;
}

function itemWeightKg(item) {
  if (item.type === "deur") return 110;
  if (item.type === "deur-zijlicht") return 140;
  if (item.type === "poort") return 140;
  if (item.type === "deur-dubbel") return 190;
  if (item.type === "deur-element") return 110 + formulaWeightKg(item);
  return formulaWeightKg(item);
}

function pickTierByWeight(weight, tiers) {
  return tiers.find((tier) => weight <= tier.maxKg) || tiers[tiers.length - 1];
}

function montageTierForItem(item, weightKg) {
  if (item.type === "raam") return pickTierByWeight(weightKg, windowMontageTiers);
  if (item.type === "schuifraam") return pickTierByWeight(weightKg, slidingMontageTiers);
  if (fixedMontageRates[item.type]) return fixedMontageRates[item.type];
  return pickTierByWeight(weightKg, windowMontageTiers);
}

function addCategoryCost(map, tier, quantity) {
  const existing = map.get(tier.key) || {
    key: tier.key,
    label: tier.label,
    unitRate: tier.rate,
    count: 0,
    total: 0,
    order: tier.order
  };

  existing.count += quantity;
  existing.total += tier.rate * quantity;
  map.set(tier.key, existing);
}

function sortedBreakdown(map) {
  return Array.from(map.values()).sort((a, b) => a.order - b.order);
}

function addMeasuredCost(map, { key, label, unitRate, quantity, unit, order }) {
  const existing = map.get(key) || {
    key,
    label,
    unitRate,
    count: 0,
    quantity: 0,
    unit,
    total: 0,
    order
  };
  existing.count += quantity;
  existing.quantity += quantity;
  existing.total += unitRate * quantity;
  map.set(key, existing);
}

function addFinishingCost(map, entry, quantity) {
  const existing = map.get(entry.key) || {
    key: entry.key,
    label: entry.label,
    unitRate: entry.unitPrice,
    count: 0,
    areaM2: 0,
    total: 0,
    order: entry.order
  };

  existing.count += quantity;
  existing.areaM2 += (entry.areaM2 || 0) * quantity;
  existing.total += entry.unitPrice * quantity;
  map.set(entry.key, existing);
}

function effectiveFinishing(item) {
  return item.finishing;
}

function finishingEntriesForItem(item) {
  const finishing = effectiveFinishing(item);
  const areaM2 = areaInM2(item);
  const entries = [];
  const tierByFinishing = {
    mdf: mdfFinishingTier,
    pvc: pvcFinishingTier,
    pleister: plasterFinishingTier
  };
  const tierForFinishing = tierByFinishing[finishing];

  if (tierForFinishing) {
    const tier = tierForFinishing(areaM2);
    entries.push({
      key: `fin-${finishing}-${tier.key}`,
      label: tier.label,
      order: finishing === "mdf" ? 10 : finishing === "pvc" ? 20 : 30,
      areaM2,
      unitPrice: tier.rate
    });
  }

  // Een rolluik krijgt altijd een geïsoleerde MDF-bak, los van de gekozen
  // binnenafwerking. PVC-afwerking bevat dus geen standaard vensterbank.
  if (item.shutter === "rolluik") {
    const upToThreeMetres = effectiveItemDimensionsCm(item).widthCm <= 300;
    entries.push({
      key: upToThreeMetres ? "fin-mdf-rolluik-tot3m" : "fin-mdf-rolluik-boven3m",
      label: upToThreeMetres
        ? "MDF rolluikbak geïsoleerd (tot 3 m)"
        : "MDF rolluikbak geïsoleerd (> 3 m)",
      order: 40,
      areaM2,
      unitPrice: upToThreeMetres ? 220 : 340
    });
  }

  return entries;
}

function mdfFinishingTier(areaM2) {
  if (areaM2 <= 5) return { key: "tot5", label: "MDF alle zijden < 5 m²", rate: 230 };
  if (areaM2 <= 10) return { key: "tot10", label: "MDF alle zijden < 10 m²", rate: 350 };
  return { key: "vanaf10", label: "MDF alle zijden ≥ 10 m²", rate: 470 };
}

function pvcFinishingTier(areaM2) {
  if (areaM2 <= 2.5) return { key: "tot2_5", label: "PVC omlijsting < 2,5 m²", rate: 250 };
  if (areaM2 <= 5) return { key: "tot5", label: "PVC omlijsting < 5 m²", rate: 360 };
  if (areaM2 <= 10) return { key: "tot10", label: "PVC omlijsting < 10 m²", rate: 470 };
  return { key: "vanaf10", label: "PVC omlijsting ≥ 10 m²", rate: 660 };
}

function plasterFinishingTier(areaM2) {
  if (areaM2 <= 2.5) return { key: "tot2_5", label: "Pleister omlijsting < 2,5 m²", rate: 300 };
  if (areaM2 <= 5) return { key: "tot5", label: "Pleister omlijsting < 5 m²", rate: 450 };
  return { key: "vanaf5", label: "Pleister omlijsting ≥ 5 m²", rate: 600 };
}

function shutterUnitPrice(item) {
  if (item.shutter !== "rolluik" && item.shutter !== "zonnewering") return 0;
  return (item.widthCm / 100) * SHUTTER_RATE_PER_LM;
}

function calculateItemTotals() {
  const demontageMap = new Map();
  const montageMap = new Map();
  const finishingMap = new Map();

  let elementsTotal = 0;
  let demontageTotal = 0;
  let recyclingTotal = 0;
  let montageTotal = 0;
  const sealantRate = sealantRatePerLm();
  const sealantTitle = sealantLabel();
  let sealantTotal = 0;
  let sealantLmTotal = 0;
  let finishingTotal = 0;
  let totalWeightKg = 0;
  let totalCount = 0;

  items.forEach((item) => {
    const quantity = Number(item.quantity) || 1;
    const parts = itemDirectCostParts(item);

    elementsTotal += parts.element;
    totalWeightKg += itemWeightKg(item) * quantity;
    totalCount += quantity;

    demontageTotal += parts.demontage;
    addCategoryCost(demontageMap, parts.demontageTier, quantity);
    recyclingTotal += parts.recycling;

    montageTotal += parts.montage;
    addCategoryCost(montageMap, parts.montageTier, quantity);

    sealantLmTotal += parts.sealantLm;
    sealantTotal += parts.sealant;

    parts.finishingEntries.forEach((entry) => {
      finishingTotal += entry.unitPrice * quantity;
      addFinishingCost(finishingMap, entry, quantity);
    });
  });
  const recyclingBreakdown = recyclingTotal > 0
    ? [{
        key: "recycling",
        label: "Recyclage",
        unitRate: RECYCLING_RATE_PER_1000KG,
        quantity: totalWeightKg / 1000,
        unit: "ton",
        total: recyclingTotal,
        order: 15
      }]
    : [];
  const extrasBreakdown = [];
  const extrasTotal = 0;
  const servicesTotal = demontageTotal + recyclingTotal + montageTotal + sealantTotal + finishingTotal;

  return {
    elementsTotal,
    demontageTotal,
    demontageBreakdown: sortedBreakdown(demontageMap),
    recyclingTotal,
    recyclingBreakdown,
    montageTotal,
    montageBreakdown: sortedBreakdown(montageMap),
    sealantTotal,
    sealantLmTotal,
    sealantUnitRate: sealantRate,
    sealantLabel: sealantTitle,
    siliconeTotal: sealantTotal,
    siliconeLmTotal: sealantLmTotal,
    finishingTotal,
    finishingBreakdown: sortedBreakdown(finishingMap),
    extrasBreakdown,
    extrasTotal,
    carpentryTotal: elementsTotal,
    servicesTotal,
    totalWeightKg,
    totalCount,
    total:
      elementsTotal + servicesTotal
  };
}

function facadeLinePrice(facade, index, facadeTotals) {
  const row =
    facadeTotals && Array.isArray(facadeTotals.perFacadeCost) ? facadeTotals.perFacadeCost[index] : null;
  if (row && Number.isFinite(row.totalCost)) return row.totalCost;
  const perFacade = facadeTotals && Array.isArray(facadeTotals.perFacade) ? facadeTotals.perFacade[index] : null;
  const netArea = perFacade
    ? perFacade.netArea
    : Math.max(facadeAreaInM2(facade) - facadeOpeningsMetrics(facade).elementsArea, 0);
  const rate = facadeRateForFacade(facade);
  const softMultiplier = netArea > 0 && netArea <= 50 ? Math.min(1.5, 50 / netArea) : 1;
  return netArea * rate * softMultiplier;
}

function facadeDirectPreviewCost(facade) {
  const metrics = facadeOpeningsMetrics(facade);
  const netArea = Math.max(facadeAreaInM2(facade) - metrics.elementsArea, 0);
  const options = {
    gutter: facade?.options?.gutter || "none",
    plinths: facade?.options?.plinths || "none",
    downpipe: facade?.options?.downpipe || "none"
  };
  const sillAluLm = metrics.openings.reduce(
    (sum, opening) =>
      sum +
      (opening.sills === "aluminium"
        ? (opening.widthCm / 100) * Math.max(1, Number(opening.quantity) || 1)
        : 0),
    0
  );
  const sillStoneLm = metrics.openings.reduce(
    (sum, opening) =>
      sum +
      (opening.sills === "blauwe-hardsteen"
        ? (opening.widthCm / 100) * Math.max(1, Number(opening.quantity) || 1)
        : 0),
    0
  );
  const areaCost = netArea * facadeRateForFacade(facade);
  const windowLmCost = metrics.elementsLength * facadeRates.windowLm;
  const gutterCost = options.gutter === "trespa" ? (facade.widthCm / 100) * facadeRates.gutter : 0;
  const sillsCost = sillAluLm * facadeRates.sillAlu + sillStoneLm * facadeRates.sillStone;
  const plinthsCost =
    options.plinths === "blauwe-hardsteen"
      ? (facade.widthCm / 100) * facadeRates.plinthStone
      : options.plinths === "watervaste-crepi"
      ? (facade.widthCm / 100) * facadeRates.plinthCrepi
      : 0;
  const downpipeCost = options.downpipe === "zink" ? (facade.heightCm / 100) * facadeRates.downpipe : 0;
  return areaCost + windowLmCost + gutterCost + sillsCost + plinthsCost + downpipeCost;
}

function facadeSavingsHint(facadeTotals) {
  const netArea = Number(facadeTotals?.netArea || 0);
  const multiplier = Number(facadeTotals?.smallFacadeMultiplier || 1);
  if (netArea > 0 && multiplier > 1) {
    const remaining = Math.max(50 - netArea, 0);
    return `Tip: voeg nog ${remaining.toFixed(2)} m² gevel toe om dichter bij het voordeligere tarief vanaf 50 m² te komen.`;
  }
  return "";
}

function facadeRateForFacade(facade) {
  if (facade.finish === "steenstrips") return 350;
  return facadeRates.area[facade.insulation] || facadeRates.area["12"];
}

function calculateFacadeTotals(options = {}) {
  const applySmallFacadeMultiplier = options.applySmallFacadeMultiplier !== false;
  const facadeArea = totalFacadeArea();
  const facadeWidth = totalFacadeWidth();
  const facadeHeight = totalFacadeHeight();

  const perFacade = facades.map((facade) => {
    const facadeAreaM2 = facadeAreaInM2(facade);
    const metrics = facadeOpeningsMetrics(facade);
    const netArea = Math.max(facadeAreaM2 - metrics.elementsArea, 0);
    const options = {
      gutter: facade?.options?.gutter || "none",
      plinths: facade?.options?.plinths || "none",
      downpipe: facade?.options?.downpipe || "none"
    };
    const sillAluLm = metrics.openings.reduce(
      (sum, opening) =>
        sum +
        (opening.sills === "aluminium"
          ? (opening.widthCm / 100) * Math.max(1, Number(opening.quantity) || 1)
          : 0),
      0
    );
    const sillStoneLm = metrics.openings.reduce(
      (sum, opening) =>
        sum +
        (opening.sills === "blauwe-hardsteen"
          ? (opening.widthCm / 100) * Math.max(1, Number(opening.quantity) || 1)
          : 0),
      0
    );
    return {
      facade,
      facadeArea: facadeAreaM2,
      netArea,
      elementsArea: metrics.elementsArea,
      elementsLength: metrics.elementsLength,
      elementsWidth: metrics.elementsWidth,
      openings: metrics.openings,
      options,
      sillAluLm,
      sillStoneLm
    };
  });

  const elementsArea = perFacade.reduce((sum, row) => sum + row.elementsArea, 0);
  const elementsLength = perFacade.reduce((sum, row) => sum + row.elementsLength, 0);
  const elementsWidth = perFacade.reduce((sum, row) => sum + row.elementsWidth, 0);
  const netArea = perFacade.reduce((sum, row) => sum + row.netArea, 0);
  const usedAssumptions = false;

  if (netArea <= 0) {
    return {
      facadeArea,
      facadeWidth,
      facadeHeight,
      elementsArea,
      elementsLength,
      elementsWidth,
      usedAssumptions,
      netArea,
      baseAreaCost: 0,
      baseWindowLmCost: 0,
      smallFacadeMultiplier: 1,
      baseCost: 0,
      gutterCost: 0,
      sillsCost: 0,
      plinthsCost: 0,
      downpipeCost: 0,
      extrasCost: 0,
      totalCost: 0,
      perFacade,
      perFacadeCost: perFacade.map((row, index) => ({
        index,
        rate: facadeRateForFacade(row.facade),
        facadeArea: row.facadeArea,
        openingsArea: row.elementsArea,
        netArea: row.netArea,
        elementsLength: row.elementsLength,
        elementsWidth: row.elementsWidth,
        sillAluLm: row.sillAluLm,
        sillStoneLm: row.sillStoneLm,
        options: row.options,
        grossAreaCost: 0,
        openingDeduction: 0,
        netAreaCost: 0,
        windowLmCost: 0,
        gutterCost: 0,
        sillsCost: 0,
        plinthsCost: 0,
        downpipeCost: 0,
        totalCost: 0
      }))
    };
  }

  const areaCost = perFacade.reduce((sum, row) => {
    const rate = facadeRateForFacade(row.facade);
    return sum + row.netArea * rate;
  }, 0);

  const windowLmCost = elementsLength * facadeRates.windowLm;
  // Small facade uplift with soft cap:
  // - up to 33.33 m²: full 1.5x
  // - 33.33 to 50 m²: decreasing factor so the uplifted area price never exceeds the 50 m² cap
  // - above 50 m²: no uplift
  const smallFacadeMultiplier =
    applySmallFacadeMultiplier && netArea > 0 && netArea <= 50 ? Math.min(1.5, 50 / netArea) : 1;
  const baseAreaCost = areaCost * smallFacadeMultiplier;
  const baseWindowLmCost = windowLmCost;
  const baseCost = baseAreaCost + baseWindowLmCost;

  const perFacadeCost = perFacade.map((row, index) => {
    const rate = facadeRateForFacade(row.facade);
    const grossAreaCost = row.facadeArea * rate * smallFacadeMultiplier;
    const openingDeduction = row.elementsArea * rate * smallFacadeMultiplier;
    const netAreaCost = row.netArea * rate * smallFacadeMultiplier;
    const windowLmCostRow = row.elementsLength * facadeRates.windowLm;
    const gutterCostRow =
      row.options.gutter === "trespa" ? (row.facade.widthCm / 100) * facadeRates.gutter : 0;
    const sillsCostRow = row.sillAluLm * facadeRates.sillAlu + row.sillStoneLm * facadeRates.sillStone;
    const plinthsCostRow =
      row.options.plinths === "blauwe-hardsteen"
        ? (row.facade.widthCm / 100) * facadeRates.plinthStone
        : row.options.plinths === "watervaste-crepi"
        ? (row.facade.widthCm / 100) * facadeRates.plinthCrepi
        : 0;
    const downpipeCostRow =
      row.options.downpipe === "zink" ? (row.facade.heightCm / 100) * facadeRates.downpipe : 0;
    const totalRow =
      netAreaCost + windowLmCostRow + gutterCostRow + sillsCostRow + plinthsCostRow + downpipeCostRow;

    return {
      index,
      rate,
      facadeArea: row.facadeArea,
      openingsArea: row.elementsArea,
      netArea: row.netArea,
      elementsLength: row.elementsLength,
      elementsWidth: row.elementsWidth,
      sillAluLm: row.sillAluLm,
      sillStoneLm: row.sillStoneLm,
      options: row.options,
      grossAreaCost,
      openingDeduction,
      netAreaCost,
      windowLmCost: windowLmCostRow,
      gutterCost: gutterCostRow,
      sillsCost: sillsCostRow,
      plinthsCost: plinthsCostRow,
      downpipeCost: downpipeCostRow,
      totalCost: totalRow
    };
  });

  const gutterCost = perFacadeCost.reduce((sum, row) => sum + row.gutterCost, 0);
  const sillsCost = perFacadeCost.reduce((sum, row) => sum + row.sillsCost, 0);
  const plinthsCost = perFacadeCost.reduce((sum, row) => sum + row.plinthsCost, 0);
  const downpipeCost = perFacadeCost.reduce((sum, row) => sum + row.downpipeCost, 0);
  const extrasCost = gutterCost + sillsCost + plinthsCost + downpipeCost;
  const totalCost = baseCost + extrasCost;

  return {
    facadeArea,
    facadeWidth,
    facadeHeight,
    elementsArea,
    elementsLength,
    elementsWidth,
    usedAssumptions,
    netArea,
    baseAreaCost,
    baseWindowLmCost,
    smallFacadeMultiplier,
    baseCost,
    gutterCost,
    sillsCost,
    plinthsCost,
    downpipeCost,
    extrasCost,
    totalCost,
    perFacade,
    perFacadeCost
  };
}

function renderItems() {
  if (!itemsBody) return;
  itemsBody.innerHTML = "";
  const allInByItem = itemAllInTotals(items, currentClient());
  const usedByItemId = linkedOpeningUsageByItem();

  if (!items.length) {
    const row = document.createElement("tr");
    row.className = "empty-row";
    const cell = document.createElement("td");
    cell.colSpan = 8;
    cell.textContent = "Nog geen elementen toegevoegd";
    row.appendChild(cell);
    itemsBody.appendChild(row);
    refreshFacadeElementOptions();
    return;
  }

  items.forEach((item, index) => {
    const row = document.createElement("tr");
    row.dataset.index = String(index);

    const typeLabel = itemTypeLabels[item.type] || item.type;
    const finishing = finishingLabels[item.finishing] || "-";
    const color = colorLabels[item.color] || "-";
    const shutter = shutterLabels[item.shutter] || "-";
    const options = [];
    if (item.type !== "poort") {
      options.push(glassLabels[item.glass] || "Dubbelglas");
    }
    if (item.type === "raam") {
      options.push(openingLabels[item.opening] || "Vast");
    }
    if (item.shutter !== "none") {
      options.push(shutter);
    }
    const itemKey = item.id || `idx-${index}`;
    const allInTotal = shouldShowActualQuotePrices()
      ? allInByItem.get(itemKey)?.total || 0
      : itemDirectPreviewTotal(item);
    const quantity = Math.max(1, Number(item.quantity) || 1);
    const minQuantity = Math.max(1, usedByItemId.get(item.id) || 0);
    row.innerHTML = `
      <td class="type">${typeLabel}<span class="mobile-item-size">${formatSizeMmFromCm(item.widthCm, item.heightCm)}</span></td>
      <td>${color}</td>
      <td>${finishing}</td>
      <td>${options.length ? options.join(" · ") : "-"}</td>
      <td>${formatSizeMmFromCm(item.widthCm, item.heightCm)}</td>
      <td>
        <div class="item-quantity-stepper" data-index="${index}">
          <button type="button" class="item-quantity-button" data-item-quantity-change="-1" aria-label="Verminder aantal">−</button>
          <input class="item-quantity-input" type="number" min="${minQuantity}" step="1" value="${quantity}" data-index="${index}" inputmode="numeric" aria-label="Aantal elementen">
          <button type="button" class="item-quantity-button" data-item-quantity-change="1" aria-label="Verhoog aantal">+</button>
        </div>
      </td>
      <td>${formatCurrency(toInclVat(allInTotal))}</td>
      <td>
        <div class="table-actions">
          <button class="remove-btn" data-index="${index}" aria-label="Verwijder element">×</button>
        </div>
      </td>
    `;

    itemsBody.appendChild(row);
  });

  refreshFacadeElementOptions();
}

function refreshFacadeElementOptions() {
  if (!facadeElementSelectField) return;

  const previous = facadeElementSelectField.value;
  const usedByItemId = linkedOpeningUsageByItem();
  facadeElementSelectField.innerHTML = '<option value="">Kies element</option>';

  items.forEach((item) => {
    const used = usedByItemId.get(item.id) || 0;
    const totalQty = Math.max(1, Number(item.quantity) || 1);
    const remaining = Math.max(totalQty - used, 0);
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = `${itemTypeLabels[item.type] || item.type} · ${formatSizeMmFromCm(
      item.widthCm,
      item.heightCm
    )} · resterend ${remaining}/${totalQty}`;
    option.disabled = remaining <= 0;
    facadeElementSelectField.appendChild(option);
  });

  if (previous && items.some((item) => item.id === previous)) {
    facadeElementSelectField.value = previous;
  }

  const hasItems = items.length > 0;
  facadeElementSelectField.disabled = !hasItems;
  if (facadeElementQtyField) facadeElementQtyField.disabled = !hasItems;
  if (facadeAddLinkedOpeningButton) facadeAddLinkedOpeningButton.disabled = !hasItems;
  updateFacadeLinkedQtyAvailability();
}

function linkedOpeningUsageByItem() {
  const usage = new Map();
  facades.forEach((facade, facadeIndex) => {
    if (editingFacadeIndex !== null && facadeIndex === editingFacadeIndex) return;
    const openings = Array.isArray(facade.openings) ? facade.openings : [];
    openings.forEach((opening) => {
      if (opening.source !== "item" || !opening.itemId) return;
      const count = usage.get(opening.itemId) || 0;
      usage.set(opening.itemId, count + Math.max(1, Number(opening.quantity) || 1));
    });
  });

  draftFacadeOpenings.forEach((opening) => {
    if (editingDraftOpeningId && opening.id === editingDraftOpeningId) return;
    if (opening.source !== "item" || !opening.itemId) return;
    const count = usage.get(opening.itemId) || 0;
    usage.set(opening.itemId, count + Math.max(1, Number(opening.quantity) || 1));
  });
  return usage;
}

function remainingLinkedQuantityForItem(itemId) {
  const item = findItemById(itemId);
  if (!item) return 0;
  const usedByItemId = linkedOpeningUsageByItem();
  const used = usedByItemId.get(itemId) || 0;
  const totalQty = Math.max(1, Number(item.quantity) || 1);
  return Math.max(totalQty - used, 0);
}

function updateFacadeLinkedQtyAvailability() {
  if (!facadeElementSelectField || !facadeElementQtyField) return;
  const itemId = facadeElementSelectField.value;
  const remaining = itemId ? remainingLinkedQuantityForItem(itemId) : 0;

  facadeElementQtyField.min = "1";
  facadeElementQtyField.max = String(Math.max(remaining, 1));
  if (!itemId || remaining <= 0) {
    facadeElementQtyField.value = "1";
    facadeElementQtyField.disabled = true;
    if (facadeAddLinkedOpeningButton) facadeAddLinkedOpeningButton.disabled = true;
    return;
  }

  facadeElementQtyField.disabled = false;
  if (Number(facadeElementQtyField.value) > remaining) {
    facadeElementQtyField.value = String(remaining);
  }
  if (Number(facadeElementQtyField.value) <= 0) {
    facadeElementQtyField.value = "1";
  }
  if (facadeAddLinkedOpeningButton) facadeAddLinkedOpeningButton.disabled = false;
}

function currentDraftFacadeOpenings() {
  return draftFacadeOpenings.map(normalizeFacadeOpening);
}

function currentlyEditingDraftOpening() {
  if (!editingDraftOpeningId) return null;
  return draftFacadeOpenings.find((opening) => opening.id === editingDraftOpeningId) || null;
}

function updateDraftOpeningActionLabels() {
  const editing = currentlyEditingDraftOpening();
  if (facadeAddLinkedOpeningButton) {
    facadeAddLinkedOpeningButton.textContent =
      editing && editing.source === "item" ? "Wijzigen" : "Koppelen";
  }
  if (facadeAddCustomOpeningButton) {
    facadeAddCustomOpeningButton.textContent =
      editing && editing.source === "custom" ? "Wijzigen" : "Koppelen";
  }
}

function resetDraftOpeningEditor() {
  editingDraftOpeningId = null;
  updateDraftOpeningActionLabels();
}

function draftFacadeFromForm() {
  if (!facadeFinishField || !facadeInsulationField || !facadeWidthField || !facadeHeightField) return null;
  const widthCm = Number(facadeWidthField.value);
  const heightCm = Number(facadeHeightField.value);
  if (!Number.isFinite(widthCm) || !Number.isFinite(heightCm) || widthCm <= 0 || heightCm <= 0) return null;

  return normalizeFacade({
    finish: facadeFinishField.value || "crepi",
    insulation: facadeInsulationField.value || "10",
    widthCm,
    heightCm,
    openings: currentDraftFacadeOpenings(),
    options: {
      gutter: facadeGutterField ? facadeGutterField.value : "none",
      plinths: facadePlinthsField ? facadePlinthsField.value : "none",
      downpipe: facadeDownpipeField ? facadeDownpipeField.value : "none"
    }
  });
}

function renderFacadeDraftTotal() {
  if (!facadeDraftTotalEl) return;
  const draftFacade = draftFacadeFromForm();
  if (!draftFacade) {
    facadeDraftTotalEl.textContent = formatCurrency(0);
    if (facadeDraftTotalNoteEl) facadeDraftTotalNoteEl.textContent = "";
    return;
  }

  facadeDraftTotalEl.textContent = formatCurrency(toInclVat(facadeDirectPreviewCost(draftFacade)));
  if (facadeDraftTotalNoteEl) {
    facadeDraftTotalNoteEl.textContent =
      "Preview met voordelige grote-gevelprijs, zonder kleine-gevelcorrectie. Bij offerte-aanmaak berekenen we de werkelijke prijs.";
  }
}

function renderDraftFacadeOpenings() {
  if (!facadeOpeningsListEl) return;
  facadeOpeningsListEl.innerHTML = "";

  if (!draftFacadeOpenings.length) {
    const row = document.createElement("tr");
    row.className = "empty-row";
    row.innerHTML = '<td colspan="6">Nog geen openingen toegevoegd</td>';
    facadeOpeningsListEl.appendChild(row);
    renderFacadeDraftTotal();
    return;
  }

  draftFacadeOpenings.forEach((opening) => {
    const row = document.createElement("tr");
    row.dataset.openingId = opening.id;
    if (editingDraftOpeningId && opening.id === editingDraftOpeningId) {
      row.classList.add("is-editing");
    }
    const sourceLabel = opening.source === "item" ? "Gekoppeld element" : "Losse opening";
    const sizeLabel = `${opening.widthCm} x ${opening.heightCm} cm`;
    const description = facadeOpeningLabel(opening);
    const sillLabel =
      opening.sills === "aluminium"
        ? "Aluminium"
        : opening.sills === "blauwe-hardsteen"
        ? "Blauwe hardsteen"
        : "Geen";
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-btn facade-opening-remove";
    removeButton.dataset.openingId = opening.id;
    removeButton.setAttribute("aria-label", "Verwijder opening");
    removeButton.textContent = "×";

    const actionCell = document.createElement("td");
    const actionWrap = document.createElement("div");
    actionWrap.className = "table-actions";
    actionWrap.appendChild(removeButton);
    actionCell.appendChild(actionWrap);

    row.innerHTML = `
      <td>${sourceLabel}</td>
      <td>${sizeLabel}</td>
      <td>${opening.quantity}</td>
      <td>${sillLabel}</td>
      <td>${description}</td>
    `;
    row.appendChild(actionCell);
    facadeOpeningsListEl.appendChild(row);
  });
  updateDraftOpeningActionLabels();
  renderFacadeDraftTotal();
}

function facadeOpeningLabel(opening) {
  const base =
    opening.source === "item"
      ? `${opening.label} × ${opening.quantity}`
      : `Losse opening ${opening.widthCm} x ${opening.heightCm} cm`;
  if (opening.sills === "aluminium") return `${base} · Raamdorpel aluminium`;
  if (opening.sills === "blauwe-hardsteen") return `${base} · Raamdorpel blauwe hardsteen`;
  return base;
}

function addLinkedOpeningToDraft() {
  if (!facadeElementSelectField) return;
  const itemId = facadeElementSelectField.value;
  const item = findItemById(itemId);
  if (!item) {
    alert("Kies eerst een bestaand element.");
    return;
  }

  const remaining = remainingLinkedQuantityForItem(itemId);
  if (remaining <= 0) {
    alert("Dit element is al volledig verdeeld over gevels.");
    return;
  }
  const requestedQty = Math.max(1, Number(facadeElementQtyField ? facadeElementQtyField.value : 1) || 1);
  const quantity = Math.min(requestedQty, remaining);
  if (requestedQty > quantity && facadeElementQtyField) facadeElementQtyField.value = String(quantity);
  const sills = facadeElementSillsField ? facadeElementSillsField.value : "none";
  const payload = normalizeFacadeOpening({
    id: generateId("opening"),
    source: "item",
    itemId: item.id,
    itemType: item.type,
    widthCm: item.widthCm,
    heightCm: item.heightCm,
    quantity,
    label: openingSnapshotLabel(item.type, item.widthCm, item.heightCm),
    sills
  });
  const editing = currentlyEditingDraftOpening();
  if (editing && editing.source === "item") {
    payload.id = editing.id;
    draftFacadeOpenings = draftFacadeOpenings.map((opening) =>
      opening.id === editing.id ? payload : opening
    );
  } else {
    draftFacadeOpenings.push(payload);
  }
  resetDraftOpeningEditor();
  renderDraftFacadeOpenings();
  refreshFacadeElementOptions();
}

function addCustomOpeningToDraft() {
  const widthCm = Number(facadeOpeningWidthField ? facadeOpeningWidthField.value : 0);
  const heightCm = Number(facadeOpeningHeightField ? facadeOpeningHeightField.value : 0);
  if (![widthCm, heightCm].every((n) => Number.isFinite(n) && n > 0)) {
    alert("Geef een geldige breedte en hoogte voor de losse opening.");
    return;
  }

  const sills = facadeCustomSillsField ? facadeCustomSillsField.value : "none";
  const payload = normalizeFacadeOpening({
    id: generateId("opening"),
    source: "custom",
    widthCm,
    heightCm,
    quantity: 1,
    label: `Losse opening ${widthCm} x ${heightCm} cm`,
    sills
  });
  const editing = currentlyEditingDraftOpening();
  if (editing && editing.source === "custom") {
    payload.id = editing.id;
    draftFacadeOpenings = draftFacadeOpenings.map((opening) =>
      opening.id === editing.id ? payload : opening
    );
  } else {
    draftFacadeOpenings.push(payload);
  }
  resetDraftOpeningEditor();
  if (facadeOpeningWidthField) facadeOpeningWidthField.value = "";
  if (facadeOpeningHeightField) facadeOpeningHeightField.value = "";
  renderDraftFacadeOpenings();
  refreshFacadeElementOptions();
}

function removeDraftOpening(event) {
  const button = event.target.closest(".facade-opening-remove");
  if (!button) return;
  const openingId = button.dataset.openingId;
  draftFacadeOpenings = draftFacadeOpenings.filter((opening) => opening.id !== openingId);
  if (editingDraftOpeningId && editingDraftOpeningId === openingId) {
    resetDraftOpeningEditor();
  }
  renderDraftFacadeOpenings();
  refreshFacadeElementOptions();
}

function editDraftOpening(event) {
  if (event.target.closest(".facade-opening-remove")) return;
  const row = event.target.closest("tr[data-opening-id]");
  if (!row) return;
  const openingId = row.dataset.openingId;
  const opening = draftFacadeOpenings.find((entry) => entry.id === openingId);
  if (!opening) return;

  editingDraftOpeningId = opening.id;
  if (opening.source === "item") {
    if (facadeElementSelectField) facadeElementSelectField.value = opening.itemId || "";
    updateFacadeLinkedQtyAvailability();
    if (facadeElementQtyField) facadeElementQtyField.value = String(Math.max(1, Number(opening.quantity) || 1));
    if (facadeElementSillsField) facadeElementSillsField.value = opening.sills || "none";
  } else {
    if (facadeOpeningWidthField) facadeOpeningWidthField.value = String(opening.widthCm || "");
    if (facadeOpeningHeightField) facadeOpeningHeightField.value = String(opening.heightCm || "");
    if (facadeCustomSillsField) facadeCustomSillsField.value = opening.sills || "none";
  }
  renderDraftFacadeOpenings();
  refreshFacadeElementOptions();
}

function facadeOpeningSummary(facade) {
  const openings = resolvedFacadeOpenings(facade);
  if (!openings.length) return "Geen openingen";
  const linkedQty = openings
    .filter((opening) => opening.source === "item")
    .reduce((sum, opening) => sum + opening.quantity, 0);
  const customQty = openings
    .filter((opening) => opening.source === "custom")
    .reduce((sum, opening) => sum + opening.quantity, 0);
  return `${linkedQty} gekoppeld · ${customQty} losse opening(en)`;
}

function facadeOpeningDetails(facade) {
  const openings = resolvedFacadeOpenings(facade);
  if (!openings.length) return "Geen openingen";
  return openings
    .map((opening) => {
      const sill =
        opening.sills === "aluminium"
          ? " · dorpel aluminium"
          : opening.sills === "blauwe-hardsteen"
          ? " · dorpel blauwe hardsteen"
          : "";
      if (opening.source === "item") {
        return `${opening.label} × ${opening.quantity}${opening.missingItem ? " (element verwijderd)" : ""}${sill}`;
      }
      return `Losse opening ${opening.widthCm} x ${opening.heightCm} cm${sill}`;
    })
    .join(" · ");
}

function openingAreaM2(opening) {
  return ((opening.widthCm * opening.heightCm) / 10000) * opening.quantity;
}

function openingPerimeterLm(opening) {
  return ((2 * (opening.widthCm + opening.heightCm)) / 100) * Math.max(1, Number(opening.quantity) || 1);
}

function linkedOpeningsPerimeterLm(openings) {
  return openings
    .filter((opening) => opening.source === "item")
    .reduce(
      (sum, opening) => sum + openingPerimeterLm(opening),
      0
    );
}

function facadeSpecificOverviewHtml(facade, perFacade, perFacadeCostRow, facadeNumber, facadeIndex, facadeTotals) {
  const finish = facadeFinishLabels[facade.finish] || facade.finish;
  const insulation = insulationLabels[facade.insulation] || facade.insulation;
  const openings = perFacade && Array.isArray(perFacade.openings) ? perFacade.openings : resolvedFacadeOpenings(facade);
  const facadeArea = perFacade ? perFacade.facadeArea : facadeAreaInM2(facade);
  const netArea = perFacade ? perFacade.netArea : Math.max(facadeArea - openings.reduce((sum, opening) => sum + openingAreaM2(opening), 0), 0);
  const allOpeningsPerimeter = openings.reduce((sum, opening) => sum + openingPerimeterLm(opening), 0);

  const options = [];
  if (facade?.options?.gutter === "trespa") options.push("Dakgootbekleding: Trespa");
  if (facade?.options?.plinths === "blauwe-hardsteen") options.push("Plinten: blauwe hardsteen");
  if (facade?.options?.plinths === "watervaste-crepi") options.push("Plinten: watervaste crepi");
  if (facade?.options?.downpipe === "zink") options.push("Afvoerbuis: zink");
  const optionTags = options.length
    ? options.map((option) => `<span class="facade-pill">${escapeHtml(option)}</span>`).join("")
    : '<span class="facade-pill facade-pill-muted">Geen gevelopties</span>';

  const openingRows = openings.length
    ? openings
        .map((opening, index) => {
          const label =
            opening.source === "item"
              ? `${opening.label}${opening.missingItem ? " (element verwijderd)" : ""}`
              : `Losse opening ${opening.widthCm} x ${opening.heightCm} cm`;
          const sill =
            opening.sills === "aluminium"
              ? " · dorpel aluminium"
              : opening.sills === "blauwe-hardsteen"
              ? " · dorpel blauwe hardsteen"
              : "";
          return `<tr>
            <td>${index + 1}. ${escapeHtml(label)}${escapeHtml(sill)}</td>
            <td class="right">-${openingAreaM2(opening).toFixed(2)} m²</td>
            <td class="right">${openingPerimeterLm(opening).toFixed(2)} m</td>
          </tr>`;
        })
        .join("")
    : '<tr><td colspan="3">Geen openingen</td></tr>';

  return `
    <summary class="facade-overview-head">
      <div class="facade-overview-main">
        <div class="facade-overview-title"><strong>Gevel ${facadeNumber}</strong></div>
        <div class="facade-overview-meta">
          <span class="facade-pill">Afwerking: ${escapeHtml(finish)}</span>
          <span class="facade-pill">Isolatie: ${escapeHtml(insulation)}</span>
          <span class="facade-pill">${facade.widthCm} × ${facade.heightCm} cm</span>
        </div>
        <div class="facade-overview-price">
          Totaal gevel: <strong>${formatCurrency(toInclVat(perFacadeCostRow ? perFacadeCostRow.totalCost : 0))}</strong>
        </div>
      </div>
      <div class="facade-head-actions">
        <button type="button" class="secondary facade-edit-btn" data-index="${facadeIndex}">Gevel wijzigen</button>
        <button type="button" class="facade-delete-btn" data-index="${facadeIndex}" aria-label="Gevel verwijderen">Gevel verwijderen</button>
      </div>
    </summary>
    <div class="facade-overview-body">
      <div class="facade-overview-options">
        <div class="meta"><strong>Gevelopties</strong></div>
        <div class="facade-overview-meta">${optionTags}</div>
      </div>
      <div class="facade-overview-openings">
        <div class="meta"><strong>Raamopeningen</strong></div>
        <table>
          <thead>
            <tr>
              <th>Opening</th>
              <th>Oppervlak</th>
              <th>Omtrek</th>
            </tr>
          </thead>
          <tbody>${openingRows}</tbody>
          <tfoot>
            <tr>
              <td colspan="3" class="right"><strong>Netto geveloppervlakte: ${netArea.toFixed(2)} m²<br>Totale omtrek: ${allOpeningsPerimeter.toFixed(2)} m</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  `;
}

function renderFacades(totals) {
  if (!facadeBody) return;

  const facadeTotals = totals || calculateFacadeTotals();

  facadeBody.innerHTML = "";

  if (!facades.length) {
    const empty = document.createElement("div");
    empty.className = "facade-empty";
    empty.textContent = "Nog geen gevels toegevoegd";
    facadeBody.appendChild(empty);
    return;
  }

  facades.forEach((facade, index) => {
    const entry = document.createElement("details");
    entry.className = "facade-overview";
    entry.dataset.index = String(index);

    const perFacade = Array.isArray(facadeTotals.perFacade) ? facadeTotals.perFacade[index] : null;
    const perFacadeCostRow = Array.isArray(facadeTotals.perFacadeCost)
      ? facadeTotals.perFacadeCost[index]
      : null;
    const specificsHtml = facadeSpecificOverviewHtml(
      facade,
      perFacade,
      perFacadeCostRow,
      index + 1,
      index,
      facadeTotals
    );
    entry.innerHTML = specificsHtml;

    facadeBody.appendChild(entry);
  });
}

function renderCategoryList(target, rows, emptyLabel) {
  if (!target) return;
  target.innerHTML = "";

  if (!rows.length) {
    const li = document.createElement("li");
    li.textContent = emptyLabel;
    target.appendChild(li);
    return;
  }

  rows.forEach((row) => {
    const li = document.createElement("li");
    const measuredQuantity = Number(row.quantity ?? row.count) || 0;
    const quantityLabel = row.unit
      ? `${measuredQuantity.toFixed(2)} ${row.unit}`
      : String(row.count);
    li.textContent = `${row.label}: ${quantityLabel} × ${formatCurrency(row.unitRate)} = ${formatCurrency(
      row.total
    )}`;
    target.appendChild(li);
  });
}

function renderFinishingList(target, rows, emptyLabel) {
  if (!target) return;
  target.innerHTML = "";

  if (!rows.length) {
    const li = document.createElement("li");
    li.textContent = emptyLabel;
    target.appendChild(li);
    return;
  }

  rows.forEach((row) => {
    const li = document.createElement("li");
    const measuredQuantity = Number(row.quantity ?? row.count) || 0;
    const quantityLabel = row.unit
      ? `${measuredQuantity.toFixed(2)} ${row.unit}`
      : String(row.count);
    li.textContent = `${row.label}: ${quantityLabel} × ${formatCurrency(row.unitRate)} = ${formatCurrency(
      row.total
    )}`;
    target.appendChild(li);
  });
}

function renderExtrasList(target, rows, emptyLabel) {
  if (!target) return;
  target.innerHTML = "";

  if (!rows.length) {
    const li = document.createElement("li");
    li.textContent = emptyLabel;
    target.appendChild(li);
    return;
  }

  rows.forEach((row) => {
    const li = document.createElement("li");
    li.textContent = `${row.label}: ${formatCurrency(row.value)}`;
    target.appendChild(li);
  });
}

function renderItemsBreakdown(includeItems, itemTotals) {
  if (!itemsBreakdownBlock) return;

  itemsBreakdownBlock.classList.toggle("hidden", !includeItems);
  if (!includeItems) return;

  if (breakdownElementsTotalEl) {
    breakdownElementsTotalEl.textContent = formatCurrency(itemTotals.elementsTotal);
  }
  if (breakdownDemontageTotalEl) {
    breakdownDemontageTotalEl.textContent = formatCurrency(itemTotals.demontageTotal);
  }
  if (breakdownMontageTotalEl) {
    breakdownMontageTotalEl.textContent = formatCurrency(itemTotals.montageTotal);
  }
  if (breakdownSiliconeTotalEl) {
    breakdownSiliconeTotalEl.textContent = formatCurrency(itemTotals.siliconeTotal);
  }
  if (breakdownFinishingTotalEl) {
    breakdownFinishingTotalEl.textContent = formatCurrency(itemTotals.finishingTotal);
  }
  if (breakdownExtrasTotalEl) {
    breakdownExtrasTotalEl.textContent = formatCurrency(itemTotals.extrasTotal);
  }

  renderCategoryList(demontageBreakdownEl, itemTotals.demontageBreakdown, "Geen demontagekosten");
  renderCategoryList(montageBreakdownEl, itemTotals.montageBreakdown, "Geen montagekosten");
  renderFinishingList(finishingBreakdownEl, itemTotals.finishingBreakdown, "Geen afwerking");
  renderExtrasList(extrasBreakdownEl, itemTotals.extrasBreakdown, "Geen extra kosten");
}

function itemBreakdownDetailList(rows, emptyLabel, formatter) {
  if (!Array.isArray(rows) || !rows.length) {
    return `<p class="item-price-breakdown-empty">${escapeHtml(emptyLabel)}</p>`;
  }
  return `<ul>${rows.map((row) => `<li>${formatter(row)}</li>`).join("")}</ul>`;
}

function renderItemsStepBreakdown(itemTotals) {
  if (!itemsStepBreakdownEl || !showPricesImmediately) return;

  const vatRate = currentVatRate();
  const incl = (value) => formatCurrency(Number(value || 0) * (1 + vatRate));
  const perItemSections = items.map((item, index) => {
    const parts = itemDirectCostParts(item);
    const services = parts.demontage + parts.recycling + parts.montage + parts.sealant + parts.finishing;
    const finishingRows = parts.finishingEntries.map((entry) => [
      entry.label,
      `${parts.quantity} st.`,
      incl(entry.unitPrice),
      incl(entry.unitPrice * parts.quantity)
    ]);
    return `
      <div class="item-price-breakdown-section item-price-breakdown-per-item">
        <div class="item-price-breakdown-line">
          <span>Element ${index + 1}: ${escapeHtml(itemDisplayTypeLabel(item))} · ${escapeHtml(formatSizeMmFromCm(item.widthCm, item.heightCm))} · ${parts.quantity} st.</span>
          <strong>${incl(parts.element + services)}</strong>
        </div>
        <div class="item-price-breakdown-details">
          <ul>
            <li>Schrijnwerk: ${parts.quantity} × ${incl(elementUnitPrice(item))} = <strong>${incl(parts.element)}</strong></li>
            <li>Afbraak: ${parts.quantity} × ${incl(parts.demontageTier.rate)} = <strong>${incl(parts.demontage)}</strong></li>
            <li>Recyclage: ${(parts.weightKg / 1000).toFixed(3)} ton × ${incl(parts.recyclingRate)} = <strong>${incl(parts.recycling)}</strong></li>
            <li>Plaatsing: ${parts.quantity} × ${incl(parts.montageTier.rate)} = <strong>${incl(parts.montage)}</strong></li>
            <li>Siliconeren: ${parts.sealantLm.toFixed(2)} lm × ${incl(parts.sealantRate)} = <strong>${incl(parts.sealant)}</strong></li>
            ${parts.finishingEntries.map((entry) => `<li>${escapeHtml(entry.label)}: ${parts.quantity} × ${incl(entry.unitPrice)} = <strong>${incl(entry.unitPrice * parts.quantity)}</strong></li>`).join("")}
          </ul>
        </div>
      </div>`;
  });

  itemsStepBreakdownEl.innerHTML = [
    `<p class="item-price-breakdown-intro">Alle bedragen hieronder zijn inclusief ${Math.round(vatRate * 100)}% BTW.</p>`,
    ...(perItemSections.length ? perItemSections : ['<p class="item-price-breakdown-empty">Geen elementen toegevoegd</p>']),
    `<div class="item-price-breakdown-summary">
      <div class="item-price-breakdown-line"><span>Totaal schrijnwerk</span><strong>${incl(itemTotals.carpentryTotal ?? itemTotals.elementsTotal)}</strong></div>
      <div class="item-price-breakdown-line"><span>Totaal diensten</span><strong>${incl(itemTotals.servicesTotal ?? (itemTotals.total - itemTotals.elementsTotal))}</strong></div>
    </div>`,
    `<div class="item-price-breakdown-grand-total"><span>Totaal elementen</span><strong>${incl(itemTotals.total)}</strong></div>`
  ].join("");
}

function renderFacadeBreakdown(includeFacades, facadeTotals) {
  if (!facadeBreakdownBlock) return;
  facadeBreakdownBlock.classList.toggle("hidden", !includeFacades);
  if (!includeFacades) return;

  if (facadeBreakdownWallAreaEl) {
    facadeBreakdownWallAreaEl.textContent = `${facadeTotals.facadeArea.toFixed(2)} m²`;
  }
  if (facadeBreakdownElementsAreaEl) {
    facadeBreakdownElementsAreaEl.textContent = `${facadeTotals.elementsArea.toFixed(2)} m²`;
  }
  if (facadeBreakdownElementsLengthEl) {
    facadeBreakdownElementsLengthEl.textContent = `${facadeTotals.elementsLength.toFixed(2)} m`;
  }
  if (facadeBreakdownNetAreaEl) {
    facadeBreakdownNetAreaEl.textContent = `${facadeTotals.netArea.toFixed(2)} m²`;
  }
  if (facadeBreakdownTotalEl) {
    facadeBreakdownTotalEl.textContent = formatCurrency(facadeTotals.totalCost);
  }

  if (!facadeCostBreakdownEl) return;
  const lines = [
    { label: "Basis geveloppervlakte", value: facadeTotals.baseAreaCost },
    { label: "Ramen (lengtemeters)", value: facadeTotals.baseWindowLmCost },
    { label: "Dakgootbekleding", value: facadeTotals.gutterCost },
    { label: "Raamdorpels", value: facadeTotals.sillsCost },
    { label: "Plinten", value: facadeTotals.plinthsCost },
    { label: "Afvoerbuis", value: facadeTotals.downpipeCost }
  ].filter((entry) => entry.value > 0);

  facadeCostBreakdownEl.innerHTML = "";
  if (!lines.length) {
    const li = document.createElement("li");
    li.textContent = "Geen kostenlijnen";
    facadeCostBreakdownEl.appendChild(li);
    return;
  }

  lines.forEach((entry) => {
    const li = document.createElement("li");
    li.textContent = `${entry.label}: ${formatCurrency(entry.value)}`;
    facadeCostBreakdownEl.appendChild(li);
  });

  if (!facadePerFacadeBreakdownEl) return;
  facadePerFacadeBreakdownEl.innerHTML = "";

  const rows = Array.isArray(facadeTotals.perFacadeCost) ? facadeTotals.perFacadeCost : [];
  if (!rows.length) {
    const empty = document.createElement("p");
    empty.className = "meta";
    empty.textContent = "Geen gevels toegevoegd";
    facadePerFacadeBreakdownEl.appendChild(empty);
    return;
  }

  rows.forEach((row) => {
    const block = document.createElement("div");
    block.className = "cost-group";
    const finish = facades[row.index] ? facadeFinishLabels[facades[row.index].finish] || facades[row.index].finish : "Gevel";
    const insulation = facades[row.index]
      ? insulationLabels[facades[row.index].insulation] || facades[row.index].insulation
      : "-";

    const perLines = [
      `Bruto gevel: ${row.facadeArea.toFixed(2)} m² × ${formatCurrency(row.rate)} = ${formatCurrency(
        row.grossAreaCost
      )}`,
      `Raamopeningen: ${row.openingsArea.toFixed(2)} m² = -${formatCurrency(row.openingDeduction)}`,
      `Netto geveloppervlakte: ${row.netArea.toFixed(2)} m² = ${formatCurrency(row.netAreaCost)}`
    ];

    if (row.elementsLength > 0 && row.windowLmCost > 0) {
      perLines.push(
        `Ramen (lengtemeters): ${row.elementsLength.toFixed(2)} m = ${formatCurrency(row.windowLmCost)}`
      );
    }
    if (row.gutterCost > 0) {
      const widthLm = facades[row.index] ? facades[row.index].widthCm / 100 : 0;
      perLines.push(`Dakgootbekleding (Trespa): ${widthLm.toFixed(2)} m = ${formatCurrency(row.gutterCost)}`);
    }
    if (row.sillsCost > 0) {
      if (row.sillAluLm > 0) {
        perLines.push(
          `Raamdorpels aluminium: ${row.sillAluLm.toFixed(2)} m = ${formatCurrency(
            row.sillAluLm * facadeRates.sillAlu
          )}`
        );
      }
      if (row.sillStoneLm > 0) {
        perLines.push(
          `Raamdorpels blauwe hardsteen: ${row.sillStoneLm.toFixed(2)} m = ${formatCurrency(
            row.sillStoneLm * facadeRates.sillStone
          )}`
        );
      }
    }
    if (row.plinthsCost > 0) {
      const widthLm = facades[row.index] ? facades[row.index].widthCm / 100 : 0;
      perLines.push(`Plinten: ${widthLm.toFixed(2)} m = ${formatCurrency(row.plinthsCost)}`);
    }
    if (row.downpipeCost > 0) {
      const heightLm = facades[row.index] ? facades[row.index].heightCm / 100 : 0;
      perLines.push(`Afvoerbuis: ${heightLm.toFixed(2)} m = ${formatCurrency(row.downpipeCost)}`);
    }

    const list = document.createElement("ul");
    list.className = "breakdown-list";
    perLines.forEach((line) => {
      const li = document.createElement("li");
      li.textContent = line;
      list.appendChild(li);
    });

    const total = document.createElement("div");
    total.className = "cost-line";
    total.innerHTML = `<span>Totaal gevel ${row.index + 1}</span><strong>${formatCurrency(row.totalCost)}</strong>`;

    block.innerHTML = `<p class="label">Gevel ${row.index + 1} · ${finish} · ${insulation}</p>`;
    block.appendChild(list);
    block.appendChild(total);
    facadePerFacadeBreakdownEl.appendChild(block);
  });
}

function calculateQuoteTotals(options = {}) {
  const preview = options.preview === true;
  const modules = selectedModules();
  const includeItems = modules.items;
  const includeFacades = modules.facade;
  const includeRoof = modules.roof;

  const itemTotals = preview ? calculateItemPreviewTotals() : calculateItemTotals();
  const facadeTotals = calculateFacadeTotals({ applySmallFacadeMultiplier: !preview });
  const roofTotals = calculateRoofTotals({ applySmallRoofMultiplier: !preview });

  const subtotalItems = includeItems ? itemTotals.total : 0;
  const subtotalFacade = includeFacades ? facadeTotals.totalCost : 0;
  const subtotalRoof = includeRoof ? roofTotals.total : 0;

  const hasScopeItems = includeItems && items.length > 0;
  const hasScopeFacades = includeFacades && facades.length > 0;
  const hasScopeRoof = includeRoof && roofs.length > 0;
  const hasAnyScopedWork = hasScopeItems || hasScopeFacades || hasScopeRoof;

  const subtotal = subtotalItems + subtotalFacade + subtotalRoof;
  const totalExcl = subtotal;
  const vatRate = currentVatRate();
  const vat = totalExcl * vatRate;
  const totalIncl = totalExcl + vat;
  const measurementTotal = 0;
  const measurementTotalIncl = 0;
  const totals = {
    includeItems,
    includeFacades,
    includeRoof,
    hasAnyScopedWork,
    itemTotals,
    facadeTotals,
    roofTotals,
    subtotalItems,
    subtotalFacade,
    subtotalRoof,
    subtotal,
    measurementTotal,
    measurementTotalIncl,
    totalExcl,
    vatRate,
    vat,
    totalIncl
  };
  totals.supportCalculation = calculateSupport(totals);
  return totals;
}

function updateTotals() {
  if (currentMeasurementMode() === "simple") {
    renderSimpleQuoteStyle();
    updateSimpleEstimatePreview();
    return;
  }
  const totals = calculateQuoteTotals();
  const showActualPrices = shouldShowActualQuotePrices();
  const displayTotals = showActualPrices ? totals : calculateQuoteTotals({ preview: true });

  renderItems();
  renderFacades(displayTotals.facadeTotals);
  renderRoofs(displayTotals.roofTotals);
  renderItemsBreakdown(displayTotals.includeItems, displayTotals.itemTotals);
  renderItemsStepBreakdown(displayTotals.itemTotals);
  renderFacadeBreakdown(displayTotals.includeFacades, displayTotals.facadeTotals);

  if (subtotalItemsEl) subtotalItemsEl.textContent = formatCurrency(displayTotals.subtotalItems);
  if (subtotalFacadeEl) subtotalFacadeEl.textContent = formatCurrency(displayTotals.subtotalFacade);
  if (subtotalRoofEl) subtotalRoofEl.textContent = formatCurrency(displayTotals.subtotalRoof);
  if (itemsStepTotalEl) itemsStepTotalEl.textContent = formatCurrency(toInclVat(displayTotals.subtotalItems));
  if (facadeStepTotalEl) facadeStepTotalEl.textContent = formatCurrency(toInclVat(displayTotals.subtotalFacade));
  if (roofStepTotalEl) roofStepTotalEl.textContent = formatCurrency(toInclVat(displayTotals.subtotalRoof));
  if (itemsStepTotalNoteEl) {
    itemsStepTotalNoteEl.textContent = itemSavingsHint();
  }
  if (facadeStepTotalNoteEl) {
    facadeStepTotalNoteEl.textContent = showActualPrices
      ? facadeSavingsHint(totals.facadeTotals)
      : "Preview met voordelige grote-gevelprijs. Kleine-gevelcorrecties verschijnen pas bij offerte-aanmaak.";
  }
  if (subtotalEl) subtotalEl.textContent = formatCurrency(displayTotals.subtotal);
  if (measurementTotalEl) {
    measurementTotalEl.textContent = formatCurrency(0);
    const measurementRow = measurementTotalEl.closest("li, .summary-row, .cost-line, .totals-row");
    if (measurementRow) measurementRow.classList.add("hidden");
  }
  if (totalExclEl) totalExclEl.textContent = formatCurrency(displayTotals.totalExcl);

  if (vatLabelEl) {
    vatLabelEl.textContent = `BTW (${Math.round(displayTotals.vatRate * 100)}%)`;
  }
  if (vatEl) vatEl.textContent = formatCurrency(displayTotals.vat);
  if (totalEl) totalEl.textContent = formatCurrency(displayTotals.totalIncl);

  renderQuoteMailStyle(displayTotals);
  renderFacadeDraftTotal();
  renderItemDraftTotal();
  renderRoofDraftTotal();
}

function updateOpeningAvailability() {
  applyItemTypeFieldRules();
}

function resetItemForm(options = {}) {
  const { preserveSelections = false } = options;
  if (!typeField || !glassField) return;

  if (!preserveSelections) {
    typeField.value = "raam";
    glassField.value = "pvc_double";
    finishingField.value = "none";
    colorField.value = "standard";
    openingField.value = "vast";
    shutterField.value = "none";
  }

  widthField.value = "";
  heightField.value = "";
  editingIndex = null;
  if (itemForm) itemForm.classList.remove("is-editing-item");
  updateOpeningAvailability();
  if (itemSubmitButton) itemSubmitButton.textContent = "Element toevoegen";
  renderItemDraftTotal();
}

function resetFacadeForm() {
  if (!facadeFinishField || !facadeInsulationField) return;
  facadeFinishField.value = "crepi";
  facadeInsulationField.value = "10";
  facadeWidthField.value = "";
  facadeHeightField.value = "";
  if (facadeElementSelectField) facadeElementSelectField.value = "";
  if (facadeElementQtyField) facadeElementQtyField.value = "1";
  if (facadeElementSillsField) facadeElementSillsField.value = "none";
  if (facadeOpeningWidthField) facadeOpeningWidthField.value = "";
  if (facadeOpeningHeightField) facadeOpeningHeightField.value = "";
  if (facadeCustomSillsField) facadeCustomSillsField.value = "none";
  if (facadeGutterField) facadeGutterField.value = "none";
  if (facadePlinthsField) facadePlinthsField.value = "none";
  if (facadeDownpipeField) facadeDownpipeField.value = "none";
  draftFacadeOpenings = [];
  resetDraftOpeningEditor();
  renderDraftFacadeOpenings();
  refreshFacadeElementOptions();
  editingFacadeIndex = null;

  const button = facadeForm ? facadeForm.querySelector("button[type='submit']") : null;
  if (button) button.textContent = "Gevel toevoegen";
}

function addItem(event) {
  event.preventDefault();

  const type = typeField.value;
  const isPoort = type === "poort";
  const glass = isPoort ? "pvc_triple" : glassField ? glassField.value : "pvc_double";
  const finishing = isPoort ? "none" : finishingField.value;
  const color = colorField.value;
  const opening = type === "raam" ? openingField.value : "vast";
  const shutter = isPoort ? "none" : shutterField.value;
  const widthCm = mmInputToCm(widthField.value);
  const heightCm = mmInputToCm(heightField.value);

  if (!itemDimensionValidation() || ![widthCm, heightCm].every((n) => Number.isFinite(n) && n >= MIN_ITEM_DIMENSION_MM / 10)) {
    alert(`Controleer de afmetingen. Vul minstens ${MIN_ITEM_DIMENSION_MM} mm in voor breedte en hoogte.`);
    return;
  }

  const payload = {
    id: editingIndex !== null && items[editingIndex] ? items[editingIndex].id : generateId("item"),
    type,
    glass,
    finishing,
    color,
    opening,
    shutter,
    widthCm,
    heightCm,
    quantity:
      editingIndex !== null && items[editingIndex]
        ? Math.max(1, Number(items[editingIndex].quantity) || 1)
        : 1
  };

  if (editingIndex !== null) {
    items[editingIndex] = payload;
  } else {
    items.push(payload);
  }

  renderItems();
  updateTotals();
  saveToStorage();
  resetItemForm({ preserveSelections: true });
}

function addFacade(event) {
  event.preventDefault();

  const finish = facadeFinishField.value;
  const insulation = facadeInsulationField.value;
  const widthCm = Number(facadeWidthField.value);
  const heightCm = Number(facadeHeightField.value);

  if (![widthCm, heightCm].every((n) => Number.isFinite(n) && n > 0)) {
    alert("Controleer de afmetingen van de gevel.");
    return;
  }

  const payload = {
    finish,
    insulation,
    widthCm,
    heightCm,
    openings: currentDraftFacadeOpenings(),
    options: {
      gutter: facadeGutterField ? facadeGutterField.value : "none",
      plinths: facadePlinthsField ? facadePlinthsField.value : "none",
      downpipe: facadeDownpipeField ? facadeDownpipeField.value : "none"
    }
  };

  if (editingFacadeIndex !== null) {
    facades[editingFacadeIndex] = payload;
  } else {
    facades.push(payload);
  }

  renderFacades();
  updateTotals();
  saveToStorage();
  resetFacadeForm();
  refreshFacadeElementOptions();
}

function removeItem(event) {
  const button = event.target.closest(".remove-btn");
  if (!button) return;

  const index = Number(button.dataset.index);
  items.splice(index, 1);
  renderItems();
  updateTotals();
  saveToStorage();

  if (editingIndex !== null) {
    if (editingIndex === index) {
      resetItemForm();
    } else if (index < editingIndex) {
      editingIndex -= 1;
    }
  }
}

function updateItemQuantity(event) {
  const input = event.target.closest(".item-quantity-input");
  if (!input) return;

  const index = Number(input.dataset.index);
  if (!Number.isFinite(index) || !items[index]) return;

  const item = items[index];
  const usedByItemId = linkedOpeningUsageByItem();
  const minQuantity = Math.max(1, usedByItemId.get(item.id) || 0);
  const requestedQuantity = Math.floor(Number(input.value));
  const quantity = Math.max(minQuantity, Number.isFinite(requestedQuantity) ? requestedQuantity : minQuantity);

  input.value = String(quantity);
  if (Math.max(1, Number(item.quantity) || 1) === quantity) return;

  item.quantity = quantity;
  renderItems();
  updateTotals();
  saveToStorage();
  refreshFacadeElementOptions();
}

function adjustItemQuantity(event) {
  const button = event.target.closest("[data-item-quantity-change]");
  if (!button) return;

  event.preventDefault();
  event.stopPropagation();
  const stepper = button.closest(".item-quantity-stepper");
  const input = stepper?.querySelector(".item-quantity-input");
  if (!input) return;

  const index = Number(input.dataset.index);
  if (!Number.isFinite(index) || !items[index]) return;

  const usedByItemId = linkedOpeningUsageByItem();
  const minQuantity = Math.max(1, usedByItemId.get(items[index].id) || 0);
  const currentQuantity = Math.max(minQuantity, Math.floor(Number(input.value) || minQuantity));
  input.value = String(Math.max(minQuantity, currentQuantity + Number(button.dataset.itemQuantityChange || 0)));
  updateItemQuantity({ target: input });
}

function removeFacade(event) {
  const button = event.target.closest(".remove-btn, .facade-delete-btn");
  if (!button) return;
  event.preventDefault();
  event.stopPropagation();

  const index = Number(button.dataset.index);
  facades.splice(index, 1);
  renderFacades();
  updateTotals();
  saveToStorage();
  refreshFacadeElementOptions();

  if (editingFacadeIndex !== null) {
    if (editingFacadeIndex === index) {
      resetFacadeForm();
    } else if (index < editingFacadeIndex) {
      editingFacadeIndex -= 1;
    }
  }
}

function handleTypeChange() {
  updateOpeningAvailability();
  renderItemDraftTotal();
}

async function sendEmail(mode = "send") {
  if (mode === "prepare") {
    preparedQuote = {ready:true,signature:"standalone",data:{}};
    updateTotals();
    return true;
  }
  goToWizardStep(wizardStepOrder()[0]);
  renderWizard();
  scrollWizardToTop();
  return true;
}

function resetClientSection() {
  if (clientForm) clientForm.reset();
  leadIntentFields.forEach((field) => {
    field.checked = field.value === "contact-me";
  });
  window.SchijnpoortAppointments?.reset();
  newsletterConsentFields.forEach((field) => {
    field.checked = false;
  });
  leadNotification = {
    sent: false,
    signature: "",
    sentAt: ""
  };
  contactSyncNotification = {
    sent: false,
    signature: "",
    sentAt: "",
    created: false
  };
  updateApartmentFloorVisibility();
  saveToStorage();
  updateTotals();
}

function resetItemsSection() {
  items = [];
  resetItemForm();
  renderItems();
  updateTotals();
  saveToStorage();
}

function resetFacadesSection() {
  facades = [];
  resetFacadeForm();
  renderFacades();
  updateTotals();
  saveToStorage();
}

function resetRoofSection() {
  roofs = [];
  resetRoofForm();
  renderRoofs();
  updateTotals();
  saveToStorage();
}

if (itemForm) itemForm.addEventListener("submit", addItem);
if (itemsBody) {
  itemsBody.addEventListener("click", removeItem);
  itemsBody.addEventListener("change", updateItemQuantity);
  itemsBody.addEventListener("click", adjustItemQuantity);
  itemsBody.addEventListener("focusin", (event) => {
    const input = event.target.closest(".item-quantity-input");
    if (input) input.select();
  });

  itemsBody.addEventListener("click", (event) => {
    if (event.target.closest(".remove-btn, .item-quantity-stepper")) return;

    const row = event.target.closest("tr[data-index]");
    if (!row) return;

    const index = Number(row.dataset.index);
    if (!Number.isFinite(index) || !items[index]) return;

    const item = items[index];
    editingIndex = index;
    typeField.value = item.type;
    if (glassField) glassField.value = item.glass || "pvc_double";
    finishingField.value = item.finishing;
    colorField.value = item.color || "standard";
    openingField.value = item.opening || "vast";
    widthField.value = formatDimensionMmFromCm(item.widthCm);
    heightField.value = formatDimensionMmFromCm(item.heightCm);
    shutterField.value = item.shutter;
    updateOpeningAvailability();

    if (itemForm) itemForm.classList.add("is-editing-item");
    if (itemSubmitButton) itemSubmitButton.textContent = "Element wijzigen";
    typeField.focus();
    renderItemDraftTotal();
  });
}

if (facadeForm) facadeForm.addEventListener("submit", addFacade);
if (facadeBody) {
  facadeBody.addEventListener("click", removeFacade);
  facadeBody.addEventListener("click", (event) => {
    const editButton = event.target.closest(".facade-edit-btn");
    if (!editButton) return;
    event.preventDefault();
    event.stopPropagation();
    const index = Number(editButton.dataset.index);
    if (!Number.isFinite(index) || !facades[index]) return;

    const facade = facades[index];
    editingFacadeIndex = index;
    facadeFinishField.value = facade.finish;
    facadeInsulationField.value = facade.insulation;
    facadeWidthField.value = facade.widthCm;
    facadeHeightField.value = facade.heightCm;
    if (facadeGutterField) facadeGutterField.value = facade.options?.gutter || "none";
    if (facadePlinthsField) facadePlinthsField.value = facade.options?.plinths || "none";
    if (facadeDownpipeField) facadeDownpipeField.value = facade.options?.downpipe || "none";
    draftFacadeOpenings = Array.isArray(facade.openings)
      ? facade.openings.map(normalizeFacadeOpening)
      : [];
    resetDraftOpeningEditor();
    renderDraftFacadeOpenings();
    refreshFacadeElementOptions();

    const button = facadeForm.querySelector("button[type='submit']");
    if (button) button.textContent = "Gevel wijzigen";
    facadeFinishField.focus();
  });
}

if (facadeOpeningsListEl) {
  facadeOpeningsListEl.addEventListener("click", removeDraftOpening);
  facadeOpeningsListEl.addEventListener("click", editDraftOpening);
}
if (roofForm) roofForm.addEventListener("submit", addRoof);
if (roofTypeField) roofTypeField.addEventListener("change", updateRoofFormMode);
[
  roofSystemField,
  roofLengthField,
  roofWidthField,
  roofDepthField,
  roofHeightField,
  roofFacadeWidthField,
  roofSolarField,
  roofStructureField,
  roofInsulationField,
  roofGutterRenewField
].forEach((field) => {
  if (!field) return;
  field.addEventListener("input", renderRoofDraftTotal);
  field.addEventListener("change", renderRoofDraftTotal);
});
if (roofBody) {
  roofBody.addEventListener("click", removeRoof);
  roofBody.addEventListener("click", (event) => {
    if (event.target.closest(".roof-remove-btn")) return;
    const row = event.target.closest("tr[data-index]");
    if (!row) return;
    const index = Number(row.dataset.index);
    if (!Number.isFinite(index) || !roofs[index]) return;
    const roof = roofs[index];
    editingRoofIndex = index;
    if (roofTypeField) roofTypeField.value = roof.type;
    updateRoofFormMode();
    if (roofSystemField) roofSystemField.value = roof.system;
    if (roofLengthField) roofLengthField.value = roof.lengthM ? String(mToCm(roof.lengthM)) : "";
    if (roofWidthField) roofWidthField.value = roof.widthM ? String(mToCm(roof.widthM)) : "";
    if (roofDepthField) roofDepthField.value = roof.depthM ? String(mToCm(roof.depthM)) : "";
    if (roofHeightField) roofHeightField.value = roof.heightM ? String(mToCm(roof.heightM)) : "";
    if (roofFacadeWidthField) roofFacadeWidthField.value = roof.facadeWidthM ? String(mToCm(roof.facadeWidthM)) : "";
    if (roofSolarField) roofSolarField.value = roof.solarPanels || "none";
    if (roofStructureField) roofStructureField.value = String(Boolean(roof.replaceStructure));
    if (roofInsulationField) roofInsulationField.value = roof.insulation || "none";
    if (roofGutterRenewField) roofGutterRenewField.value = String(Boolean(roof.renewGutter));
    renderRoofDraftTotal();
    if (roofSubmitButton) roofSubmitButton.textContent = "Dakwerk wijzigen";
    if (roofTypeField) roofTypeField.focus();
  });
}
if (facadeAddLinkedOpeningButton) {
  facadeAddLinkedOpeningButton.addEventListener("click", addLinkedOpeningToDraft);
}
if (facadeAddCustomOpeningButton) {
  facadeAddCustomOpeningButton.addEventListener("click", addCustomOpeningToDraft);
}
if (facadeElementSelectField) {
  facadeElementSelectField.addEventListener("change", updateFacadeLinkedQtyAvailability);
}
if (facadeElementQtyField) {
  facadeElementQtyField.addEventListener("input", () => {
    if (!facadeElementQtyField) return;
    const value = Math.max(1, Number(facadeElementQtyField.value) || 1);
    const max = Math.max(1, Number(facadeElementQtyField.max) || 1);
    facadeElementQtyField.value = String(Math.min(value, max));
  });
}

if (facadeGutterField) {
  facadeGutterField.addEventListener("change", () => {
    updateTotals();
    saveToStorage();
  });
}
if (facadePlinthsField) {
  facadePlinthsField.addEventListener("change", () => {
    updateTotals();
    saveToStorage();
  });
}
if (facadeDownpipeField) {
  facadeDownpipeField.addEventListener("change", () => {
    updateTotals();
    saveToStorage();
  });
}
[
  facadeFinishField,
  facadeInsulationField,
  facadeWidthField,
  facadeHeightField,
  facadeElementSillsField,
  facadeCustomSillsField
].forEach((field) => {
  if (!field) return;
  field.addEventListener("change", renderFacadeDraftTotal);
  field.addEventListener("input", renderFacadeDraftTotal);
});

[
  typeField,
  glassField,
  finishingField,
  colorField,
  openingField,
  widthField,
  heightField,
  shutterField
].forEach((field) => {
  if (!field) return;
  field.addEventListener("change", renderItemDraftTotal);
  field.addEventListener("input", renderItemDraftTotal);
});

if (typeField) typeField.addEventListener("change", handleTypeChange);
if (glassField) {
  glassField.addEventListener("change", () => {
    applyItemTypeFieldRules();
    renderItemDraftTotal();
  });
}
if (finishingField) {
  finishingField.addEventListener("change", () => {
    applyItemTypeFieldRules();
    renderItemDraftTotal();
  });
}
if (shutterField) {
  shutterField.addEventListener("change", () => {
    applyItemTypeFieldRules();
    renderItemDraftTotal();
  });
}
if (emailQuoteButton) emailQuoteButton.addEventListener("click", sendEmail);
leadIntentFields.forEach((field) => {
  field.addEventListener("change", () => {
    // De opvolgingskeuze verandert de prijs/offerte niet; behoud de al voorbereide offerte.
    saveToStorage({ markDirty: false });
  });
});
newsletterConsentFields.forEach((field) => {
  field.addEventListener("change", () => {
    newsletterConsentFields.forEach((otherField) => {
      otherField.checked = field.checked;
    });
    // Deze toestemming verandert de prijs niet en mag de voorbereide offerte behouden.
    saveToStorage({ markDirty: false });
  });
});
if (resetClientButton) resetClientButton.addEventListener("click", resetClientSection);
if (resetQuoteButton) resetQuoteButton.addEventListener("click", resetItemsSection);
if (resetFacadeButton) resetFacadeButton.addEventListener("click", resetFacadesSection);
if (resetRoofButton) resetRoofButton.addEventListener("click", resetRoofSection);
measurementModeFields.forEach((field) => {
  const handleMeasurementPathClick = () => {
    if (activeStepKey !== "measurement") return;
    if (field.value === "self" || field.value === "simple") resetDetailedModuleChoices();
    scheduleWizardAdvance();
  };

  const card = field.closest(".project-choice-card");
  if (card) card.addEventListener("click", handleMeasurementPathClick);
  field.addEventListener("click", handleMeasurementPathClick);

  field.addEventListener("change", () => {
    unlockedStepKeys = new Set(["measurement"]);
    activeStepKey = "measurement";
    lastTrackedStepKey = "";
    if ((field.value === "self" || field.value === "simple") && field.checked) resetDetailedModuleChoices();
    saveToStorage();
    applyScopeVisibility();
    renderWizard();
    updateTotals();
    scheduleWizardAdvance();
  });
});

document.querySelectorAll(".price-path-call").forEach((link) => {
  link.addEventListener("click", () => {
    trackParentEvent("quote_builder_flow_state", {
      flowKey: "call",
      quote_flow_label: "Telefonisch contact",
      quote_call_step: "klik op bellen"
    });
  });
});
[
  ...simpleFields.oldHouse,
  ...simpleFields.building,
  ...simpleFields.itemsCount,
  ...simpleFields.itemsMaterial,
  ...simpleFields.itemsGlass,
  ...simpleFields.itemsFinishing,
  ...simpleFields.facadeCount,
  ...simpleFields.facadeArea,
  ...simpleFields.facadeInsulation,
  ...simpleFields.facadeFinish,
  ...simpleFields.roofCount,
  ...simpleFields.roofFlatCount,
  ...simpleFields.roofSlopedCount,
  ...simpleFields.roofFlatArea,
  ...simpleFields.roofSlopedArea,
  ...simpleFields.roofFlatMaterial,
  ...simpleFields.roofInsulation,
  ...simpleFields.elementQuantities
].forEach((field) => {
  if (!field) return;
  const handleSimpleChoiceClick = () => {
    if (field.type === "radio") {
      scheduleWizardAdvance();
    }
  };
  const card = field.closest(".project-choice-card");
  if (card) card.addEventListener("click", handleSimpleChoiceClick);
  field.addEventListener("click", handleSimpleChoiceClick);
  if (field.type === "range") {
    field.addEventListener("input", () => {
      updateSimpleAreaSliderLabels();
      saveToStorage();
      updateTotals();
    });
  }
  if (simpleFields.elementQuantities.includes(field)) {
    field.addEventListener("input", () => {
      // Laat een gebruiker het bestaande aantal eerst volledig wissen. Pas bij
      // het verlaten van het veld normaliseren we een leeg of ongeldig aantal naar 0.
      updateSimpleElementCards({ preserveEmptyField: field });
      saveToStorage();
      updateTotals();
    });
    field.addEventListener("focus", () => {
      // Op mobiel kan de gebruiker hierdoor onmiddellijk een nieuw aantal typen.
      field.select();
    });
  }
  field.addEventListener("change", () => {
    if (field.type === "range") updateSimpleAreaSliderLabels();
    if (simpleFields.elementQuantities.includes(field)) updateSimpleElementCards();
    saveToStorage();
    applyScopeVisibility();
    renderWizard();
    updateTotals();
    if (field.type === "radio") {
      scheduleWizardAdvance();
    }
  });
});

document.querySelectorAll("[data-simple-element-minus], [data-simple-element-plus]").forEach((button) => {
  button.addEventListener("click", () => {
    const key = button.dataset.simpleElementMinus || button.dataset.simpleElementPlus;
    const field = simpleElementQuantityField(key);
    if (!field) return;
    const current = Math.max(0, Math.floor(Number(field.value) || 0));
    const next = button.dataset.simpleElementPlus ? current + 1 : Math.max(0, current - 1);
    field.value = String(next);
    updateSimpleElementCards();
    saveToStorage();
    updateTotals();
  });
});

document.addEventListener("change", (event) => {
  const field = event.target;
  if (!(field instanceof HTMLInputElement)) return;
  if (!field.closest(".project-choice-card")) return;
  markChoiceCardSelection(field);
});

if (wizardProgressEl) {
  wizardProgressEl.addEventListener("click", (event) => {
    const button = event.target.closest(".wizard-step-btn");
    if (!button) return;
    if (button.disabled) return;
    const step = button.dataset.step;
    if (!step) return;
    const order = wizardStepOrder();
    const targetIndex = order.indexOf(step);
    const activeIndex = order.indexOf(activeStepKey);
    if (targetIndex > activeIndex && !unlockedStepKeys.has(step)) return;
    goToWizardStep(step, order);
    renderWizard();
    scrollWizardToTop();
  });
}
if (wizardBackButton) {
  wizardBackButton.addEventListener("click", () => {
    const order = wizardStepOrder();
    const index = order.indexOf(activeStepKey);
    if (index > 0) {
      goToWizardStep(order[index - 1], order);
      renderWizard();
      scrollWizardToTop();
    }
  });
}
if (wizardNextButton) {
  wizardNextButton.addEventListener("click", async () => {
    const order = wizardStepOrder();
    const index = order.indexOf(activeStepKey);
    const previousStepKey = activeStepKey;
    if (!validateStep(activeStepKey)) {
      return;
    }
    if (currentMeasurementMode() === "appointment" && activeStepKey === "personal") {
      await sendEmail("send", { measurementRequest: true });
      return;
    }
    if (currentMeasurementMode() === "simple" && activeStepKey === "overview") {
      await sendEmail("send");
      return;
    }
    if (index >= order.length - 1) {
      if (!preparedQuote.ready) {
        alert("Maak eerst de offerte aan voor je mailt.");
        return;
      }
      await sendEmail("send");
      return;
    }
    const nextStepKey = order[index + 1];
    if (nextStepKey === "overview") {
      const prepared = await sendEmail("prepare");
      if (!prepared || !preparedQuote.ready || !preparedQuote.data) {
        if (lastPrepareFailureReason !== "network_error") return;
      }
      unlockedStepKeys.add(nextStepKey);
      goToWizardStep(nextStepKey, order);
      renderWizard();
      scrollWizardToTop();
      return;
    }
    if (index < order.length - 1) {
      unlockedStepKeys.add(nextStepKey);
      goToWizardStep(nextStepKey, order);
      renderWizard();
      scrollWizardToTop();
    }
  });
}

Object.values(moduleFields).forEach((field) => {
  if (!field) return;
  field.addEventListener("change", () => {
    saveToStorage();
    applyScopeVisibility();
    updateTotals();
    renderWizard();
  });
});

measurementModeFields.forEach((field) => {
  field.addEventListener("change", () => {
    saveToStorage();
    renderWizard();
  });
});

housingChoiceFields.oldHouse.forEach((field) => {
  field.addEventListener("change", () => {
    if (clientFields.oldHouse) clientFields.oldHouse.value = field.value;
    markChoiceCardSelection(field);
    saveToStorage();
    updateTotals();
  });
});

housingChoiceFields.building.forEach((field) => {
  field.addEventListener("change", () => {
    if (clientFields.building) clientFields.building.value = field.value;
    markChoiceCardSelection(field);
    updateApartmentFloorVisibility();
    saveToStorage();
    updateTotals();
  });
});

if (clientForm) clientForm.addEventListener("input", saveToStorage);
Object.values(supportFields).forEach((field) => {
  if (!field) return;
  field.addEventListener("input", () => {
    saveToStorage();
    updateTotals();
  });
  field.addEventListener("change", () => {
    saveToStorage();
    updateTotals();
  });
});

if (clientFields.oldHouse) {
  clientFields.oldHouse.addEventListener("change", () => {
    syncHousingChoicesFromFields();
    saveToStorage();
    updateTotals();
  });
}
if (clientFields.timeline) clientFields.timeline.addEventListener("change", saveToStorage);
if (clientFields.building) {
  clientFields.building.addEventListener("change", () => {
    syncHousingChoicesFromFields();
    updateApartmentFloorVisibility();
    saveToStorage();
    updateTotals();
  });
}
if (clientFields.floors) clientFields.floors.addEventListener("input", saveToStorage);
if (clientFields.referralCode) clientFields.referralCode.addEventListener("input", saveToStorage);
if (clientFields.city) clientFields.city.addEventListener("input", saveToStorage);
if (clientFields.postal) clientFields.postal.addEventListener("input", saveToStorage);
let wizardResizeFrame = 0;
let wizardViewportWidth = window.innerWidth;
window.addEventListener("resize", () => {
  if (window.innerWidth === wizardViewportWidth) return;
  wizardViewportWidth = window.innerWidth;
  cancelAnimationFrame(wizardResizeFrame);
  wizardResizeFrame = requestAnimationFrame(renderWizard);
});

resetItemForm();
resetFacadeForm();
updateRoofFormMode();
loadFromStorage();
if (forcedMeasurementMode) setMeasurementMode(forcedMeasurementMode);
syncHousingChoicesFromFields();
updateSimpleAreaSliderLabels();
updateSimpleElementCards();
restoreWizardStateAfterLanguageReload();
updateOpeningAvailability();
updateApartmentFloorVisibility();
applyScopeVisibility();
renderWizard();
updateTotals();

// --- Iframe height reporter (Squarespace embed) ---
(function () {
  if (window.parent === window) return;
  const HEIGHT_MESSAGE_TYPE = "EMBED_HEIGHT";
  const DEBOUNCE_MS = 80;
  const CHANGE_THRESHOLD_PX = 2;

  let lastHeight = 0;
  let debounceId = null;
  let followupReportId = null;
  let finalReportId = null;

  function measureDocumentHeight() {
    const body = document.body;
    const html = document.documentElement;
    if (!body || !html) return 0;

    const page = document.querySelector(".page");
    if (page) {
      const rect = page.getBoundingClientRect();
      const style = window.getComputedStyle(page);
      const marginTop = parseFloat(style.marginTop || "0") || 0;
      const marginBottom = parseFloat(style.marginBottom || "0") || 0;
      return Math.ceil(rect.height + marginTop + marginBottom);
    }

    // Fallback only when .page is unavailable.
    const fallbackHeights = [body.scrollHeight, html.scrollHeight, body.offsetHeight, html.offsetHeight].filter(
      (height) => Number.isFinite(height) && height > 0
    );
    return fallbackHeights.length ? Math.max(...fallbackHeights) : 0;
  }

  function postHeight(height) {
    if (!Number.isFinite(height) || height <= 0) return;
    if (Math.abs(height - lastHeight) < CHANGE_THRESHOLD_PX) return;

    lastHeight = height;
    try {
      window.parent.postMessage({ type: HEIGHT_MESSAGE_TYPE, height }, "*");
    } catch (err) {
      console.warn("Kon embed hoogte niet posten:", err);
    }
  }

  function scheduleReport() {
    if (debounceId) return;
    debounceId = setTimeout(() => {
      debounceId = null;
      postHeight(measureDocumentHeight());
    }, DEBOUNCE_MS);
  }

  function burstReport() {
    scheduleReport();
    clearTimeout(followupReportId);
    clearTimeout(finalReportId);
    followupReportId = setTimeout(scheduleReport, 120);
    finalReportId = setTimeout(scheduleReport, 280);
  }

  function attachObservers() {
    window.addEventListener("resize", burstReport);
    window.addEventListener("orientationchange", burstReport);
    window.addEventListener("load", burstReport);
    document.addEventListener("DOMContentLoaded", burstReport);
    document.addEventListener("transitionend", burstReport, true);
    document.addEventListener("animationend", burstReport, true);
    document.addEventListener("click", scheduleReport, true);
    document.addEventListener("input", scheduleReport, true);
    document.addEventListener("change", scheduleReport, true);

    if (document.fonts && typeof document.fonts.ready?.then === "function") {
      document.fonts.ready.then(burstReport).catch(() => {});
    }

    if ("MutationObserver" in window && document.body) {
      const observer = new MutationObserver(burstReport);
      const mutationConfig = {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "style", "hidden", "open", "aria-expanded"]
      };
      observer.observe(document.body, {
        ...mutationConfig
      });
      const page = document.querySelector(".page");
      if (page && page !== document.body) observer.observe(page, mutationConfig);
    }

    if ("ResizeObserver" in window) {
      const resizeObserver = new ResizeObserver(burstReport);
      if (document.body) resizeObserver.observe(document.body);
      if (document.documentElement) resizeObserver.observe(document.documentElement);
      const page = document.querySelector(".page");
      if (page) resizeObserver.observe(page);
    }
  }

  attachObservers();
  burstReport();
})();
