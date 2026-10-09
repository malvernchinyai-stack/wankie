/* =====================================================================
   WANKIE DOCS — offline document generator
   For: Wankie Chicken & Hatchery (Private) Limited
   Developed by: Pilotage Business Consultants (Private) Limited
   Quotations · Invoices · Bills of Quantities · Contracts ·
   Distributor / Agency Application Letters
   All data is stored on the device (localStorage). No internet needed.
   ===================================================================== */
'use strict';

const APP_VERSION = '1.0.0';
const STORE_KEY = 'wankie_docs_v1';
const DEV = {
  name: 'Pilotage Business Consultants (Private) Limited',
  email: 'info@pilotage.co.zw',
  phone: '+263 716 572 205',
  web: 'www.pilotage.co.zw'
};

const TYPES = {
  quotation: { label: 'Quotation', short: 'QUOTE', prefix: 'QT', cls: 'c-quotation', hint: 'Price offers to customers' },
  invoice:   { label: 'Invoice', short: 'INV', prefix: 'INV', cls: 'c-invoice', hint: 'Bill customers, track payment' },
  boq:       { label: 'Bill of Quantities', short: 'BOQ', prefix: 'BOQ', cls: 'c-boq', hint: 'Itemised project costing' },
  contract:  { label: 'Contract', short: 'CONTRACT', prefix: 'CON', cls: 'c-contract', hint: 'Supply, grower & service agreements' },
  letter:    { label: 'Distributor Application', short: 'LETTER', prefix: 'LTR', cls: 'c-letter', hint: 'Apply to become a distributor / agent' }
};

const DEFAULT_SETTINGS = {
  company: 'Wankie Chicken & Hatchery (Private) Limited',
  tagline: 'Chickens and Hatchery',
  address: 'Stand No. 11, Nyamakate Business Centre, Karoi, Zimbabwe',
  phone1: '+263 77 695 6058',
  phone2: '+27 62 765 1069 (WhatsApp)',
  email: 'info@wankiechickens.co.zw',
  website: 'wankiechickens.co.zw',
  regNo: '', bpNo: '', vatNo: '',
  bank: { bankName: '', accountName: 'Wankie Chicken & Hatchery (Private) Limited', accountNo: '', branch: '', swift: '', mobile: '' },
  currency: 'USD',
  vatRate: 15.5,
  vatDefault: false,
  quoteValidDays: 14,
  invoiceDueDays: 7,
  quoteTerms: 'Prices are valid for the period stated above and subject to stock availability.\nDay-old chicks are supplied vaccinated as per hatchery schedule; orders are confirmed on payment of a deposit.\nDelivery charges are quoted separately unless stated.',
  invoiceTerms: 'Payment is due by the due date shown above.\nPlease use the invoice number as your payment reference.\nGoods remain the property of Wankie Chicken & Hatchery (Private) Limited until paid in full.',
  signatory: 'Ishameil Garawaziva',
  signatoryTitle: 'Business Development Manager',
  letterPrefix: 'WCH/BD',
  logo: '',               // custom uploaded logo (data URL). Empty = built-in logo.
  showDevCredit: false     // show "Developed by Pilotage" on printed documents
};

const DEFAULT_ITEMS = [
  ['Day-old broiler chicks', 'chick', 'Chicks'],
  ['Day-old layer chicks', 'chick', 'Chicks'],
  ['Point-of-lay hens', 'bird', 'Birds'],
  ['Live broiler chickens', 'bird', 'Birds'],
  ['Dressed chicken', 'kg', 'Meat'],
  ['Table eggs (tray of 30)', 'tray', 'Eggs'],
  ['Fertile hatching eggs', 'egg', 'Eggs'],
  ['Broiler starter crumbs 50kg', 'bag', 'Stockfeed'],
  ['Broiler grower pellets 50kg', 'bag', 'Stockfeed'],
  ['Broiler finisher pellets 50kg', 'bag', 'Stockfeed'],
  ['Layers mash 50kg', 'bag', 'Stockfeed'],
  ['Chick drinker / feeder', 'each', 'Equipment'],
  ['Custom hatching service', 'egg', 'Services'],
  ['Delivery / transport', 'trip', 'Services']
];

/* ------------------------------------------------------------------ */
/* Storage                                                            */
/* ------------------------------------------------------------------ */
let DB = load();

function load() {
  let d = {};
  try { d = JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { d = {}; }
  return migrate(d);
}
function migrate(d) {
  const s = d.settings || {};
  d.settings = Object.assign({}, DEFAULT_SETTINGS, s);
  d.settings.bank = Object.assign({}, DEFAULT_SETTINGS.bank, s.bank || {});
  d.clients = d.clients || [];
  d.items = d.items || DEFAULT_ITEMS.map(([name, unit, cat]) => ({ id: uid(), name, unit, cat, price: 0 }));
  d.docs = d.docs || [];
  d.counters = d.counters || {};
  // Letter refs WCH/BD/2026/001 & 002 already issued (Brighorn, K Cee) — continue at 003.
  if (!d.counters.letter) d.counters.letter = { year: 2026, next: 3 };
  return d;
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(DB)); return true; }
  catch (e) { toast('Storage is full — export a backup and remove old documents or the logo.'); return false; }
}
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function nl(v) { return esc(v).replace(/\n/g, '<br>'); }
function num(v) { const n = parseFloat(v); return isFinite(n) ? n : 0; }
function pad3(n) { return String(n).padStart(3, '0'); }
function today() { return isoDate(new Date()); }
function isoDate(d) { const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 10); }
function addDays(iso, n) { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + num(n)); return isoDate(d); }
function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T12:00:00');
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}
function money(v, cur) {
  cur = cur || DB.settings.currency || 'USD';
  const n = num(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (cur === 'USD' ? 'US$' : cur + ' ') + n;
}
function round2(n) { return Math.round((num(n) + Number.EPSILON) * 100) / 100; }
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2600);
}
function getPath(obj, path) { return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj); }
function setPath(obj, path, val) {
  const ks = path.split('.'); let o = obj;
  for (let i = 0; i < ks.length - 1; i++) { if (o[ks[i]] == null) o[ks[i]] = /^\d+$/.test(ks[i + 1]) ? [] : {}; o = o[ks[i]]; }
  o[ks[ks.length - 1]] = val;
}
function clone(o) { return JSON.parse(JSON.stringify(o)); }

/* ------------------------------------------------------------------ */
/* Numbering                                                          */
/* ------------------------------------------------------------------ */
function nextNo(type, peek) {
  const y = new Date().getFullYear();
  if (type === 'letter') {
    let c = DB.counters.letter;
    if (c.year !== y) c = { year: y, next: 1 };
    const no = `${DB.settings.letterPrefix}/${y}/${pad3(c.next)}`;
    if (!peek) { DB.counters.letter = { year: y, next: c.next + 1 }; }
    return no;
  }
  const k = type + '_' + y;
  const n = (DB.counters[k] || 0) + 1;
  if (!peek) DB.counters[k] = n;
  return `${TYPES[type].prefix}-${y}-${pad3(n)}`;
}

/* ------------------------------------------------------------------ */
/* Totals                                                             */
/* ------------------------------------------------------------------ */
function lineTotal(r) { return round2(num(r.qty) * num(r.price)); }
function calc(doc) {
  let sub = 0;
  if (doc.type === 'boq') {
    (doc.sections || []).forEach(s => (s.rows || []).forEach(r => { sub += round2(num(r.qty) * num(r.rate)); }));
    const cont = round2(sub * num(doc.contingency) / 100);
    const net = round2(sub + cont);
    const vat = doc.vatOn ? round2(net * num(doc.vatRate) / 100) : 0;
    return { sub: round2(sub), cont, net, vat, total: round2(net + vat) };
  }
  (doc.items || []).forEach(r => { sub += lineTotal(r); });
  const disc = round2(num(doc.discount));
  const net = round2(sub - disc);
  const vat = doc.vatOn ? round2(net * num(doc.vatRate) / 100) : 0;
  const total = round2(net + vat);
  const paid = round2(num(doc.amountPaid));
  return { sub: round2(sub), disc, net, vat, total, paid, balance: round2(total - paid) };
}
function invoiceStatus(doc) {
  const c = calc(doc);
  if (c.total > 0 && c.paid >= c.total) return 'Paid';
  if (c.paid > 0) return 'Partial';
  return 'Unpaid';
}
function docAmount(doc) {
  if (doc.type === 'contract') return num(doc.value) ? money(doc.value) : '';
  if (doc.type === 'letter') return '';
  return money(calc(doc).total);
}

/* ------------------------------------------------------------------ */
/* New document factories                                             */
/* ------------------------------------------------------------------ */
function emptyClient() { return { name: '', contact: '', phone: '', email: '', address: '' }; }
function newDoc(type) {
  const s = DB.settings, d = today();
  const base = { id: uid(), type, no: '', date: d, client: emptyClient(), createdAt: Date.now(), updatedAt: Date.now() };
  if (type === 'quotation') return Object.assign(base, {
    validUntil: addDays(d, s.quoteValidDays), subject: '', items: [blankLine()], discount: 0,
    vatOn: s.vatDefault, vatRate: s.vatRate, notes: '', terms: s.quoteTerms
  });
  if (type === 'invoice') return Object.assign(base, {
    dueDate: addDays(d, s.invoiceDueDays), orderRef: '', items: [blankLine()], discount: 0,
    vatOn: s.vatDefault, vatRate: s.vatRate, amountPaid: 0, notes: '', terms: s.invoiceTerms, showBank: true
  });
  if (type === 'boq') return Object.assign(base, {
    project: '', location: 'Nyamakate, Karoi', contingency: 5, vatOn: s.vatDefault, vatRate: s.vatRate,
    sections: [{ title: 'Preliminaries & General', rows: [blankBoqRow()] }],
    notes: 'Quantities are estimates and will be re-measured on completion.\nRates include supply and delivery to site unless stated otherwise.'
  });
  if (type === 'contract') {
    const c = Object.assign(base, {
      kind: 'supply', title: '', counterpartyId: '', startDate: d, duration: '12 months', value: '',
      paymentTerms: '50% deposit on order, balance on delivery', delivery: 'Delivered to the Customer\'s premises within the Karoi district',
      products: 'Day-old chicks, live and dressed chickens, eggs and stockfeed', companyRole: '', otherRole: '', clauses: [], witnesses: true
    });
    applyContractTemplate(c);
    return c;
  }
  if (type === 'letter') {
    const l = Object.assign(base, {
      supplier: '', attention: 'The General Manager', supplierAddress: 'Harare', products: 'stockfeeds',
      area: 'Nyamakate, Karoi and the surrounding farming areas', subject: '', body: '',
      closing: 'Yours faithfully,', signatory: s.signatory, signatoryTitle: s.signatoryTitle,
      enclosures: 'Certificate of Incorporation\nCR14 / CR6 (Company Registration)\nZIMRA Tax Clearance Certificate (ITF263)\nCompany Profile\nCopy of Director\'s National ID'
    });
    l.subject = letterSubject(l); l.body = letterBody(l);
    return l;
  }
  return base;
}
function blankLine() { return { desc: '', qty: 1, unit: '', price: 0 }; }
function blankBoqRow() { return { desc: '', unit: 'item', qty: 1, rate: 0 }; }

/* ------------------------------------------------------------------ */
/* Letter templates                                                   */
/* ------------------------------------------------------------------ */
function supProd(l) {
  const sup = l.supplier || '[Supplier name]', prod = (l.products || '').trim();
  const firstWord = prod.split(/\s+/)[0].toLowerCase().replace(/s$/, '');
  return (!prod || (firstWord && sup.toLowerCase().includes(firstWord))) ? sup + ' products' : sup + ' ' + prod;
}
function letterSubject(l) {
  const sup = supProd(l).toUpperCase();
  const area = (l.area || '').split(',')[0].trim() || 'NYAMAKATE';
  return `APPLICATION TO BE APPOINTED AS AN AUTHORISED DISTRIBUTOR / AGENT OF ${sup} – ${area.toUpperCase()}, KAROI`.replace(/KAROI, KAROI/, 'KAROI');
}
function letterBody(l) {
  const s = DB.settings, sup = l.supplier || '[Supplier name]', prod = l.products || 'products';
  return [
    `We, ${s.company}, hereby formally apply to be appointed as an authorised distributor and agent of ${supProd(l)} for ${l.area || 'our area'}.`,
    `We are a registered poultry business operating from ${s.address.replace(/, Zimbabwe$/, '')}. Our core business is poultry production and hatchery services, supplying day-old chicks, live and dressed chickens and eggs to small-scale and commercial farmers in the district. Through this work we already serve a large and growing base of farmers who need a reliable, nearby source of quality inputs.`,
    `At present many farmers in our area travel long distances to buy ${prod}, which raises their costs and leads to supply gaps. As your authorised distributor we would bring ${sup} products closer to these farmers, keep consistent stock available throughout the production cycle, and give practical advice on correct product use so that customers achieve the best results from your brand.`,
    `We have secure, dry storage at our business centre, transport for stock collection and deliveries, and a team that understands the local farming community. We commit to upholding your recommended pricing, storage and handling standards, to promoting the ${sup} brand actively in our area, and to providing regular sales and stock reports.`,
    `Enclosed please find our company documents for your consideration. We would welcome the opportunity to meet your team to discuss the terms of appointment, minimum order quantities, credit or payment terms, and any further requirements you may have.`,
    `We look forward to a mutually beneficial and long-term partnership.`
  ].join('\n\n');
}

/* ------------------------------------------------------------------ */
/* Contract templates                                                 */
/* ------------------------------------------------------------------ */
const CONTRACT_KINDS = {
  supply: { label: 'Poultry Products Supply Agreement', company: 'the Supplier', other: 'the Customer' },
  distribution: { label: 'Distribution / Agency Agreement', company: 'the Principal', other: 'the Distributor' },
  outgrower: { label: 'Contract Grower (Out-grower) Agreement', company: 'the Company', other: 'the Grower' },
  service: { label: 'Services Agreement', company: 'the Client', other: 'the Service Provider' }
};
function applyContractTemplate(c) {
  const k = CONTRACT_KINDS[c.kind] || CONTRACT_KINDS.supply;
  c.title = k.label; c.companyRole = k.company; c.otherRole = k.other;
  c.clauses = contractClauses(c).map(([title, text]) => ({ title, text }));
}
function contractClauses(c) {
  const A = cap(c.companyRole), B = cap(c.otherRole);
  const common = [
    ['Termination', `Either party may terminate this Agreement by giving thirty (30) days' written notice to the other party. Either party may terminate immediately by written notice if the other party commits a material breach and fails to remedy it within fourteen (14) days of being notified in writing. Termination does not affect amounts already due.`],
    ['Force Majeure', `Neither party shall be liable for failure or delay in performing its obligations caused by events beyond its reasonable control, including disease outbreaks (such as avian influenza or Newcastle disease), movement restrictions imposed by the Department of Veterinary Services, drought, fire, flood, fuel shortages or acts of government. The affected party shall notify the other promptly and resume performance as soon as possible.`],
    ['Confidentiality', `Each party shall keep confidential all business, pricing and customer information received from the other party and shall not disclose it to any third party without prior written consent, except where required by law.`],
    ['Dispute Resolution', `The parties shall first attempt to resolve any dispute amicably through good-faith negotiation between their senior representatives. If the dispute is not resolved within twenty-one (21) days, it shall be referred to arbitration in Harare in terms of the Arbitration Act [Chapter 7:15]. The decision of the arbitrator shall be final and binding.`],
    ['Governing Law', `This Agreement shall be governed by and interpreted in accordance with the laws of Zimbabwe.`],
    ['Entire Agreement and Variation', `This Agreement constitutes the entire agreement between the parties. No variation, addition or cancellation shall be of any force unless reduced to writing and signed by both parties.`],
    ['Notices', `All notices shall be in writing and delivered by hand, registered post or e-mail to the addresses stated in this Agreement, or to any other address a party notifies in writing.`]
  ];
  let specific = [];
  if (c.kind === 'supply') specific = [
    ['Scope of Supply', `${A} agrees to supply and ${B} agrees to purchase the following products: ${c.products}, in the quantities and specifications set out in each written or electronic order accepted by ${A}.`],
    ['Duration', `This Agreement commences on the Commencement Date stated in the Schedule and continues for a period of ${c.duration}, unless terminated earlier in terms of this Agreement. It may be renewed by written agreement of both parties.`],
    ['Orders and Delivery', `${B} shall place orders at least seven (7) days in advance, or twenty-one (21) days in advance for day-old chicks to allow for hatchery scheduling. Delivery terms: ${c.delivery}. Risk in the products passes to ${B} on delivery.`],
    ['Price and Payment', `The prices shall be as per ${A}'s current price list or accepted quotation. Payment terms: ${c.paymentTerms}. ${A} may suspend deliveries while any amount remains overdue.`],
    ['Quality, Inspection and Claims', `${A} warrants that all products shall be of good, merchantable quality and, in the case of live birds, healthy and vaccinated according to ${A}'s standard schedule. ${B} shall inspect products on delivery and report any shortage or defect within twenty-four (24) hours for live birds and forty-eight (48) hours for other products, failing which the delivery shall be deemed accepted.`],
    ['Ownership', `Ownership of the products remains with ${A} until the full purchase price has been paid.`],
    ['Obligations of ' + B, `${B} shall provide suitable, clean and prepared housing, brooding and storage conditions for products received, and shall follow the handling and management guidelines provided by ${A}. ${A} shall not be liable for losses arising from poor management after delivery.`]
  ];
  if (c.kind === 'distribution') specific = [
    ['Appointment', `${A} appoints ${B} as its authorised distributor and agent for the following products: ${c.products}, within the territory agreed in the Schedule. ${B} accepts the appointment on the terms of this Agreement.`],
    ['Duration', `This Agreement commences on the Commencement Date and continues for ${c.duration}, after which it may be renewed by written agreement.`],
    ['Orders, Pricing and Payment', `${B} shall purchase products from ${A} at the distributor prices issued by ${A} from time to time. Payment terms: ${c.paymentTerms}. ${B} shall sell to end customers at or near the recommended retail prices.`],
    ['Delivery and Stock', `Delivery terms: ${c.delivery}. ${B} shall maintain adequate stock levels and store products in clean, dry and secure conditions in line with ${A}'s handling guidelines.`],
    ['Brand and Marketing', `${B} shall promote the products actively, use ${A}'s brand name and materials only as approved, and shall not make any claims about the products that are not authorised by ${A}.`],
    ['Reporting', `${B} shall provide monthly sales and stock reports and promptly report any customer complaints or quality concerns to ${A}.`]
  ];
  if (c.kind === 'outgrower') specific = [
    ['Purpose', `${A} engages ${B} to raise poultry under ${A}'s contract growing programme. ${A} shall supply inputs (${c.products}) and ${B} shall raise the birds to market weight and sell them exclusively to ${A}.`],
    ['Duration', `This Agreement commences on the Commencement Date and continues for ${c.duration}, covering the production cycles agreed in writing from time to time.`],
    ['Supply of Inputs', `${A} shall deliver day-old chicks, feed and agreed veterinary inputs to ${B}'s premises. The value of these inputs shall be recorded on a delivery note signed by ${B} and shall be recovered from the proceeds of the birds bought back.`],
    ['Obligations of the Grower', `${B} shall provide clean, disinfected and adequately equipped housing; follow the feeding, vaccination and biosecurity programme issued by ${A}; keep daily mortality and feed records; and allow ${A}'s staff to inspect the birds at any reasonable time. ${B} shall not sell, pledge or otherwise dispose of the birds or inputs to any third party.`],
    ['Buy-back, Price and Payment', `${A} shall buy back all marketable birds at the end of each cycle at the price agreed in writing before placement. Payment terms: ${c.paymentTerms}. The value of inputs supplied shall be deducted from the amount payable to ${B}.`],
    ['Mortality and Losses', `Losses caused by ${B}'s negligence, theft or failure to follow the management programme shall be borne by ${B}. Losses caused by proven defects in the chicks or feed supplied shall be borne by ${A}.`]
  ];
  if (c.kind === 'service') specific = [
    ['Services', `${B} shall provide the following services to ${A}: ${c.products}, with due skill, care and diligence and in accordance with good industry practice.`],
    ['Duration', `This Agreement commences on the Commencement Date and continues for ${c.duration}, unless terminated earlier.`],
    ['Fees and Payment', `${A} shall pay ${B} the contract value stated in the Schedule. Payment terms: ${c.paymentTerms}, against a valid tax invoice.`],
    ['Performance and Site Rules', `${B} shall comply with ${A}'s biosecurity, health and safety and site rules at all times, including restricted access to poultry houses and the hatchery. Place of performance: ${c.delivery}.`],
    ['Warranty', `${B} warrants that the services will be performed by suitably qualified personnel and shall remedy any defective work at its own cost within a reasonable time.`],
    ['Independent Contractor', `${B} is an independent contractor and nothing in this Agreement creates an employment, partnership or agency relationship between the parties.`]
  ];
  const lowerMid = t => [c.companyRole, c.otherRole].reduce((acc, r) => {
    const R = cap(r); if (!/^the /i.test(r)) return acc;
    return acc.replace(new RegExp('([^.:\\n]) ' + R.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '$1 ' + 'the' + R.slice(3));
  }, t);
  return specific.concat(common).map(([h, t]) => [h, lowerMid(t)]);
}
function cap(s) { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); }

/* ------------------------------------------------------------------ */
/* Router & state                                                     */
/* ------------------------------------------------------------------ */
let VIEW = 'home', DRAFT = null, PARAMS = {}, FILTER = 'all', SEARCH = '';
function go(view, params) {
  VIEW = view; PARAMS = params || {};
  $$('#bnav button').forEach(b => b.classList.toggle('on', b.dataset.nav === view || (view === 'edit' && b.dataset.nav === 'docs') || (view === 'preview' && b.dataset.nav === 'docs')));
  render();
  window.scrollTo(0, 0);
  try { history.replaceState(null, '', '#' + view); } catch (e) {}
}
function render() {
  const m = $('#main');
  const fn = { home: vHome, docs: vDocs, edit: vEdit, preview: vPreview, clients: vClients, catalog: vCatalog, settings: vSettings }[VIEW] || vHome;
  m.innerHTML = fn() + creditHTML();
  if (VIEW === 'preview') fitPreview();
}
function creditHTML() {
  return `<div class="credit">Wankie Docs v${APP_VERSION} · Works offline<br>Developed by <b>${DEV.name}</b></div>`;
}

/* ------------------------------------------------------------------ */
/* VIEWS                                                              */
/* ------------------------------------------------------------------ */
function vHome() {
  const inv = DB.docs.filter(d => d.type === 'invoice');
  const outstanding = inv.reduce((a, d) => a + Math.max(0, calc(d).balance), 0);
  const month = today().slice(0, 7);
  const thisMonth = DB.docs.filter(d => (d.date || '').slice(0, 7) === month).length;
  const recent = DB.docs.slice().sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);
  return `
  <h1 class="view-title">Create a document</h1>
  <div class="tiles">
    ${Object.keys(TYPES).map(t => `
      <button class="tile" data-action="new" data-type="${t}">
        <div class="ti ${TYPES[t].cls}">${t === 'boq' ? 'BOQ' : TYPES[t].prefix}</div>
        <b>${TYPES[t].label}</b><span>${TYPES[t].hint}</span>
      </button>`).join('')}
  </div>
  <h2>Summary</h2>
  <div class="stats">
    <div class="stat"><div class="l">Outstanding invoices</div><div class="v">${money(outstanding)}</div></div>
    <div class="stat alt"><div class="l">Documents this month</div><div class="v">${thisMonth}</div></div>
  </div>
  <h2>Recent documents</h2>
  ${recent.length ? `<div class="list">${recent.map(docLi).join('')}</div>` : `<div class="card empty">No documents yet. Tap a tile above to create your first one.</div>`}
  `;
}
function docLi(d) {
  const t = TYPES[d.type];
  const who = d.type === 'letter' ? d.supplier : (d.client && d.client.name);
  const sub = d.type === 'boq' ? d.project : d.type === 'contract' ? d.title : d.type === 'letter' ? 'Distributor application' : (d.subject || d.orderRef || '');
  const st = d.type === 'invoice' ? `<div class="pill ${invoiceStatus(d)}">${invoiceStatus(d) === 'Partial' ? 'Part paid' : invoiceStatus(d)}</div>` : '';
  return `<div class="li" data-action="open" data-id="${d.id}">
    <span class="badge ${t.cls}">${t.short}</span>
    <div class="main"><b>${esc(who || '(no name)')}</b><span>${esc(d.no || 'Draft')} · ${esc(fmtDate(d.date))}${sub ? ' · ' + esc(sub) : ''}</span></div>
    <div class="amt">${esc(docAmount(d))}${st}</div></div>`;
}
function vDocs() {
  const q = SEARCH.toLowerCase();
  let list = DB.docs.slice().sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.updatedAt - a.updatedAt);
  if (FILTER !== 'all') list = list.filter(d => d.type === FILTER);
  if (q) list = list.filter(d => JSON.stringify([d.no, d.client && d.client.name, d.supplier, d.project, d.title, d.subject]).toLowerCase().includes(q));
  return `
  <h1 class="view-title">Documents</h1>
  <input type="search" placeholder="Search by number, client, supplier…" value="${esc(SEARCH)}" data-action="search" style="width:100%;margin-bottom:10px">
  <div class="chips">
    <button class="chip ${FILTER === 'all' ? 'on' : ''}" data-action="filter" data-type="all">All (${DB.docs.length})</button>
    ${Object.keys(TYPES).map(t => `<button class="chip ${FILTER === t ? 'on' : ''}" data-action="filter" data-type="${t}">${t === 'letter' ? 'Letters' : t === 'boq' ? 'BOQs' : TYPES[t].label + 's'} (${DB.docs.filter(d => d.type === t).length})</button>`).join('')}
  </div>
  ${list.length ? `<div class="list">${list.map(docLi).join('')}</div>` : `<div class="card empty">No documents found.</div>`}`;
}

/* ---------- Editor ---------- */
function vEdit() {
  const d = DRAFT, t = TYPES[d.type];
  const no = d.no || nextNo(d.type, true);
  let body = '';
  if (d.type === 'quotation' || d.type === 'invoice') body = edSales(d);
  if (d.type === 'boq') body = edBoq(d);
  if (d.type === 'contract') body = edContract(d);
  if (d.type === 'letter') body = edLetter(d);
  return `
  <h1 class="view-title">${d.no ? 'Edit' : 'New'} ${t.label}</h1>
  <div class="card">
    <h3>Document</h3>
    <div class="row">
      <label>${d.type === 'letter' ? 'Our reference' : 'Number'}<input readonly value="${esc(no)}"></label>
      <label>Date<input type="date" data-bind="date" value="${esc(d.date)}"></label>
      ${d.type === 'quotation' ? `<label>Valid until<input type="date" data-bind="validUntil" value="${esc(d.validUntil)}"></label>` : ''}
      ${d.type === 'invoice' ? `<label>Due date<input type="date" data-bind="dueDate" value="${esc(d.dueDate)}"></label>` : ''}
    </div>
    ${!d.no ? `<div class="small muted">Number is assigned when you save.</div>` : ''}
  </div>
  ${body}
  <div class="btn-row savebar">
    <button class="btn ghost" data-action="cancel-edit">Cancel</button>
    <button class="btn red" data-action="save-doc" style="flex:1">Save &amp; Preview</button>
  </div>`;
}
function clientBlock(d, heading) {
  return `<div class="card">
    <h3>${heading || 'Customer'}</h3>
    ${DB.clients.length ? `<label>Choose saved client<select data-action="pick-client"><option value="">— Type a new client below —</option>
      ${DB.clients.slice().sort((a, b) => a.name.localeCompare(b.name)).map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></label>` : ''}
    <label>Name / Company<input data-bind="client.name" value="${esc(d.client.name)}" placeholder="e.g. Chikomba Farms"></label>
    <div class="row">
      <label>Contact person<input data-bind="client.contact" value="${esc(d.client.contact)}"></label>
      <label>Phone<input type="tel" data-bind="client.phone" value="${esc(d.client.phone)}"></label>
    </div>
    <label>Email<input type="email" data-bind="client.email" value="${esc(d.client.email)}"></label>
    <label>Address<textarea data-bind="client.address" rows="2" style="min-height:60px">${esc(d.client.address)}</textarea></label>
    ${d.type === 'contract' ? `<label>Registration / ID number<input data-bind="client.regNo" value="${esc(d.client.regNo || '')}"></label>` : ''}
  </div>`;
}
function catalogDatalist() {
  return `<datalist id="catalog">${DB.items.map(i => `<option value="${esc(i.name)}">${esc(i.unit)}${num(i.price) ? ' · ' + money(i.price) : ''}</option>`).join('')}</datalist>`;
}
function edSales(d) {
  const isInv = d.type === 'invoice';
  return `
  ${clientBlock(d)}
  <div class="card">
    <h3>${isInv ? 'Invoice details' : 'Quotation details'}</h3>
    ${isInv ? `<label>Order / Quotation reference<input data-bind="orderRef" value="${esc(d.orderRef)}"></label>`
            : `<label>Subject<input data-bind="subject" value="${esc(d.subject)}" placeholder="e.g. Supply of 500 day-old broiler chicks"></label>`}
  </div>
  <div class="card">
    <h3>Items</h3>
    ${catalogDatalist()}
    <div class="lines">${d.items.map((r, i) => `
      <div class="line">
        <div class="head"><span class="n">${i + 1}</span>
          <input list="catalog" data-bind="items.${i}.desc" data-item="${i}" value="${esc(r.desc)}" placeholder="Description (pick or type)">
          <button class="icon-btn" title="Remove" data-action="del-line" data-i="${i}">×</button></div>
        <div class="nums">
          <label>Qty<input type="number" inputmode="decimal" step="any" data-bind="items.${i}.qty" value="${esc(r.qty)}"></label>
          <label>Unit<input data-bind="items.${i}.unit" value="${esc(r.unit)}" placeholder="each"></label>
          <label>Unit price<input type="number" inputmode="decimal" step="any" data-bind="items.${i}.price" value="${esc(r.price)}"></label>
        </div>
        <div class="amt" data-lt="${i}">${money(lineTotal(r))}</div>
      </div>`).join('')}
    </div>
    <div class="btn-row"><button class="btn ghost sm" data-action="add-line">+ Add item</button></div>
  </div>
  <div class="card">
    <h3>Totals</h3>
    <div class="row">
      <label>Discount (${esc(DB.settings.currency)})<input type="number" inputmode="decimal" step="any" data-bind="discount" value="${esc(d.discount)}"></label>
      <label>VAT rate %<input type="number" inputmode="decimal" step="any" data-bind="vatRate" value="${esc(d.vatRate)}"></label>
    </div>
    <label class="check"><input type="checkbox" data-bind="vatOn" ${d.vatOn ? 'checked' : ''}> Charge VAT</label>
    ${isInv ? `<label>Amount paid to date<input type="number" inputmode="decimal" step="any" data-bind="amountPaid" value="${esc(d.amountPaid)}"></label>
      <label class="check"><input type="checkbox" data-bind="showBank" ${d.showBank ? 'checked' : ''}> Show banking details on invoice</label>` : ''}
    <div class="totals-live" id="liveTotals">${liveTotals(d)}</div>
  </div>
  <div class="card">
    <h3>Notes &amp; terms</h3>
    <label>Notes to customer<textarea data-bind="notes" rows="2">${esc(d.notes)}</textarea></label>
    <label>Terms &amp; conditions<textarea data-bind="terms" rows="4">${esc(d.terms)}</textarea></label>
  </div>`;
}
function liveTotals(d) {
  const c = calc(d);
  if (d.type === 'boq') return `<span>Sub-total</span><b>${money(c.sub)}</b><span>Contingency</span><b>${money(c.cont)}</b>${d.vatOn ? `<span>VAT</span><b>${money(c.vat)}</b>` : ''}<span>TOTAL</span><span class="g">${money(c.total)}</span>`;
  return `<span>Sub-total</span><b>${money(c.sub)}</b>${c.disc ? `<span>Discount</span><b>-${money(c.disc)}</b>` : ''}${d.vatOn ? `<span>VAT ${num(d.vatRate)}%</span><b>${money(c.vat)}</b>` : ''}<span>TOTAL</span><span class="g">${money(c.total)}</span>${d.type === 'invoice' ? `<span>Balance due</span><b>${money(c.balance)}</b>` : ''}`;
}
function edBoq(d) {
  return `
  ${clientBlock(d, 'Client / Employer')}
  <div class="card">
    <h3>Project</h3>
    <label>Project title<input data-bind="project" value="${esc(d.project)}" placeholder="e.g. Construction of 2,000-bird broiler house"></label>
    <label>Location<input data-bind="location" value="${esc(d.location)}"></label>
  </div>
  ${catalogDatalist()}
  ${d.sections.map((s, si) => `
  <div class="card section-box">
    <div class="row" style="align-items:flex-end">
      <label style="flex:1 1 auto">Bill ${si + 1} — section title<input data-bind="sections.${si}.title" value="${esc(s.title)}"></label>
      <button class="icon-btn" style="margin-bottom:10px" title="Remove section" data-action="del-section" data-si="${si}">×</button>
    </div>
    <div class="lines">${s.rows.map((r, ri) => `
      <div class="line">
        <div class="head"><span class="n" style="width:auto;padding:0 6px">${si + 1}.${ri + 1}</span>
          <textarea list="catalog" data-bind="sections.${si}.rows.${ri}.desc" placeholder="Item description">${esc(r.desc)}</textarea>
          <button class="icon-btn" title="Remove" data-action="del-boq-row" data-si="${si}" data-ri="${ri}">×</button></div>
        <div class="nums">
          <label>Qty<input type="number" inputmode="decimal" step="any" data-bind="sections.${si}.rows.${ri}.qty" value="${esc(r.qty)}"></label>
          <label>Unit<input data-bind="sections.${si}.rows.${ri}.unit" value="${esc(r.unit)}"></label>
          <label>Rate<input type="number" inputmode="decimal" step="any" data-bind="sections.${si}.rows.${ri}.rate" value="${esc(r.rate)}"></label>
        </div>
        <div class="amt" data-bt="${si}_${ri}">${money(num(r.qty) * num(r.rate))}</div>
      </div>`).join('')}
    </div>
    <div class="btn-row"><button class="btn ghost sm" data-action="add-boq-row" data-si="${si}">+ Add item</button></div>
  </div>`).join('')}
  <div class="btn-row" style="margin-bottom:12px"><button class="btn yolk sm" data-action="add-section">+ Add bill section</button></div>
  <div class="card">
    <h3>Summary</h3>
    <div class="row">
      <label>Contingency %<input type="number" inputmode="decimal" step="any" data-bind="contingency" value="${esc(d.contingency)}"></label>
      <label>VAT rate %<input type="number" inputmode="decimal" step="any" data-bind="vatRate" value="${esc(d.vatRate)}"></label>
    </div>
    <label class="check"><input type="checkbox" data-bind="vatOn" ${d.vatOn ? 'checked' : ''}> Charge VAT</label>
    <div class="totals-live" id="liveTotals">${liveTotals(d)}</div>
  </div>
  <div class="card"><h3>Notes &amp; assumptions</h3>
    <textarea data-bind="notes" rows="4" style="width:100%">${esc(d.notes)}</textarea></div>`;
}
function edContract(d) {
  return `
  <div class="card">
    <h3>Agreement type</h3>
    <label>Template<select data-action="contract-kind">
      ${Object.keys(CONTRACT_KINDS).map(k => `<option value="${k}" ${d.kind === k ? 'selected' : ''}>${CONTRACT_KINDS[k].label}</option>`).join('')}</select></label>
    <label>Agreement title<input data-bind="title" value="${esc(d.title)}"></label>
    <div class="row">
      <label>Wankie is referred to as<input data-bind="companyRole" value="${esc(d.companyRole)}"></label>
      <label>Other party is referred to as<input data-bind="otherRole" value="${esc(d.otherRole)}"></label>
    </div>
  </div>
  ${clientBlock(d, 'Other party')}
  <div class="card">
    <h3>Schedule (key terms)</h3>
    <label>Products / services covered<textarea data-bind="products" rows="2" style="min-height:60px">${esc(d.products)}</textarea></label>
    <div class="row">
      <label>Commencement date<input type="date" data-bind="startDate" value="${esc(d.startDate)}"></label>
      <label>Duration<input data-bind="duration" value="${esc(d.duration)}"></label>
    </div>
    <label>Contract value (${esc(DB.settings.currency)}, optional)<input type="number" inputmode="decimal" step="any" data-bind="value" value="${esc(d.value)}"></label>
    <label>Payment terms<input data-bind="paymentTerms" value="${esc(d.paymentTerms)}"></label>
    <label>Delivery / place of performance<input data-bind="delivery" value="${esc(d.delivery)}"></label>
    <div class="btn-row"><button class="btn ghost sm" data-action="regen-clauses">↻ Rebuild clauses from these terms</button></div>
    <label class="check" style="margin-top:10px"><input type="checkbox" data-bind="witnesses" ${d.witnesses ? 'checked' : ''}> Include witness signature lines</label>
  </div>
  <div class="card">
    <h3>Clauses</h3>
    ${d.clauses.map((c, i) => `
      <div class="clause">
        <div class="head"><span class="n badge c-contract">${i + 1}</span>
          <input data-bind="clauses.${i}.title" value="${esc(c.title)}">
          <button class="icon-btn" data-action="del-clause" data-i="${i}">×</button></div>
        <textarea data-bind="clauses.${i}.text" rows="4" style="width:100%">${esc(c.text)}</textarea>
      </div>`).join('')}
    <div class="btn-row"><button class="btn ghost sm" data-action="add-clause">+ Add clause</button></div>
  </div>`;
}
function edLetter(d) {
  return `
  <div class="card">
    <h3>Supplier (addressee)</h3>
    <label>Supplier company<input data-bind="supplier" value="${esc(d.supplier)}" placeholder="e.g. Brighorn Stockfeeds"></label>
    <label>Attention<input data-bind="attention" value="${esc(d.attention)}"></label>
    <label>Supplier address<textarea data-bind="supplierAddress" rows="2" style="min-height:60px">${esc(d.supplierAddress)}</textarea></label>
  </div>
  <div class="card">
    <h3>Application</h3>
    <label>Products to distribute<input data-bind="products" value="${esc(d.products)}" placeholder="stockfeeds, veterinary products, day-old chicks…"></label>
    <label>Distribution area<input data-bind="area" value="${esc(d.area)}"></label>
    <div class="btn-row"><button class="btn yolk sm" data-action="regen-letter">↻ Rewrite subject &amp; letter from these details</button></div>
    <label style="margin-top:12px">Subject<textarea data-bind="subject" rows="2" style="min-height:60px">${esc(d.subject)}</textarea></label>
    <label>Letter body (blank line = new paragraph)<textarea data-bind="body" rows="14">${esc(d.body)}</textarea></label>
  </div>
  <div class="card">
    <h3>Sign-off</h3>
    <label>Closing<input data-bind="closing" value="${esc(d.closing)}"></label>
    <div class="row">
      <label>Signatory<input data-bind="signatory" value="${esc(d.signatory)}"></label>
      <label>Title<input data-bind="signatoryTitle" value="${esc(d.signatoryTitle)}"></label>
    </div>
    <label>Enclosures (one per line)<textarea data-bind="enclosures" rows="5">${esc(d.enclosures)}</textarea></label>
  </div>`;
}

/* ---------- Preview ---------- */
function vPreview() {
  const d = DB.docs.find(x => x.id === PARAMS.id);
  if (!d) return `<div class="card empty">Document not found.</div>`;
  const t = TYPES[d.type];
  return `
  <div class="preview-bar">
    <button class="btn ghost sm" data-action="back-docs">← Back</button>
    <button class="btn red sm" data-action="print">⎙ Print / Save PDF</button>
    <button class="btn sm" data-action="edit" data-id="${d.id}">Edit</button>
    ${navigator.share ? `<button class="btn ghost sm" data-action="share" data-id="${d.id}">Share</button>` : ''}
  </div>
  <div class="preview-bar">
    ${d.type === 'quotation' ? `<button class="btn yolk sm" data-action="to-invoice" data-id="${d.id}">Convert to invoice</button>` : ''}
    ${d.type === 'invoice' && invoiceStatus(d) !== 'Paid' ? `<button class="btn yolk sm" data-action="record-payment" data-id="${d.id}">Record payment</button>` : ''}
    <button class="btn ghost sm" data-action="duplicate" data-id="${d.id}">Duplicate</button>
    <button class="btn danger sm" data-action="delete" data-id="${d.id}">Delete</button>
  </div>
  <div class="small muted" style="margin:-4px 2px 10px">${t.label} ${esc(d.no)} · Tip: in the print screen choose “Save as PDF”, then share the PDF on WhatsApp or email.</div>
  <div class="page-wrap" id="pageWrap"><div id="pageHolder">${renderDoc(d)}</div></div>`;
}
function fitPreview() {
  const wrap = $('#pageWrap'), page = $('#pageHolder .doc');
  if (!wrap || !page) return;
  const cs = getComputedStyle(wrap.parentElement);
  const avail = wrap.parentElement.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const w = page.offsetWidth;
  const s = Math.min(1, avail / w);
  $('#pageHolder').style.zoom = s;
  wrap.style.width = Math.min(avail, w * s) + 'px';
}
window.addEventListener('resize', () => { if (VIEW === 'preview') fitPreview(); });

/* ------------------------------------------------------------------ */
/* DOCUMENT RENDERING (A4)                                            */
/* ------------------------------------------------------------------ */
function logoSrc() { return DB.settings.logo || 'icons/logo.png'; }
function letterhead() {
  const s = DB.settings;
  const regs = [s.regNo && 'Reg. No: ' + s.regNo, s.bpNo && 'BP No: ' + s.bpNo, s.vatNo && 'VAT No: ' + s.vatNo].filter(Boolean).join(' · ');
  return `<div class="lh">
    <div class="logo"><img src="${esc(logoSrc())}" alt="${esc(s.company)}"></div>
    <div class="info"><b>${esc(s.company)}</b>${esc(s.address)}<br>
      Tel: ${esc(s.phone1)}${s.phone2 ? '<br>' + esc(s.phone2) : ''}<br>
      ${esc(s.email)}${s.website ? ' · ' + esc(s.website) : ''}${regs ? '<br>' + esc(regs) : ''}</div>
  </div><div class="lh-bar"></div>`;
}
function docFooter() {
  const s = DB.settings;
  return `<div class="grow"></div><div class="dfoot">
    <span class="tag">WANKIE CHICKENS AND HATCHERY</span>
    <span>${esc(s.phone1)} · ${esc(s.email)}${s.website ? ' · ' + esc(s.website) : ''}</span></div>
    ${s.showDevCredit ? `<div class="devcredit">Generated with Wankie Docs · Developed by ${DEV.name}</div>` : ''}`;
}
function partyBox(h, c) {
  if (!c) return '';
  return `<div class="pbox"><div class="h">${h}</div><b>${esc(c.name || '—')}</b><br>
    ${c.contact ? 'Attn: ' + esc(c.contact) + '<br>' : ''}${c.address ? nl(c.address) + '<br>' : ''}
    ${[c.phone, c.email].filter(Boolean).map(esc).join(' · ')}</div>`;
}
function bankBlock() {
  const b = DB.settings.bank;
  const rows = [['Bank', b.bankName], ['Account name', b.accountName], ['Account no.', b.accountNo], ['Branch', b.branch], ['SWIFT', b.swift], ['Mobile money', b.mobile]].filter(r => r[1]);
  if (!b.bankName && !b.accountNo && !b.mobile) return '';
  return `<div class="blk"><div class="h">Banking details</div>${rows.map(r => `<p><span style="color:#666">${r[0]}:</span> <b>${esc(r[1])}</b></p>`).join('')}</div>`;
}
function renderDoc(d) {
  if (d.type === 'quotation' || d.type === 'invoice') return renderSales(d);
  if (d.type === 'boq') return renderBoq(d);
  if (d.type === 'contract') return renderContract(d);
  if (d.type === 'letter') return renderLetter(d);
  return '';
}
function renderSales(d) {
  const isInv = d.type === 'invoice', c = calc(d), s = DB.settings, st = isInv ? invoiceStatus(d) : '';
  const meta = isInv
    ? [['Invoice No.', d.no], ['Date', fmtDate(d.date)], ['Due date', fmtDate(d.dueDate)], d.orderRef && ['Reference', d.orderRef]]
    : [['Quotation No.', d.no], ['Date', fmtDate(d.date)], ['Valid until', fmtDate(d.validUntil)]];
  return `<div class="doc">
    ${letterhead()}
    <div class="title-row">
      <div class="dtitle">${isInv ? (d.vatOn ? 'Tax Invoice' : 'Invoice') : 'Quotation'}<small>${isInv ? 'Please pay by the due date' : (d.subject ? esc(d.subject) : 'Price offer')}</small></div>
      <table class="meta">${meta.filter(Boolean).map(r => `<tr><td>${r[0]}</td><td>${esc(r[1])}</td></tr>`).join('')}</table>
    </div>
    <div class="parties">${partyBox(isInv ? 'Bill to' : 'Prepared for', d.client)}
      <div class="pbox"><div class="h">From</div><b>${esc(s.company)}</b><br>${esc(s.address)}<br>${esc(s.phone1)} · ${esc(s.email)}</div></div>
    <table class="items"><thead><tr><th style="width:8mm">#</th><th>Description</th><th class="r" style="width:16mm">Qty</th><th style="width:16mm">Unit</th><th class="r" style="width:28mm">Unit price</th><th class="r" style="width:30mm">Amount</th></tr></thead>
      <tbody>${d.items.filter(r => r.desc || num(r.price)).map((r, i) => `<tr><td>${i + 1}</td><td>${nl(r.desc)}</td><td class="r">${esc(num(r.qty).toLocaleString('en-US'))}</td><td>${esc(r.unit)}</td><td class="r">${money(r.price)}</td><td class="r">${money(lineTotal(r))}</td></tr>`).join('')}</tbody></table>
    <div style="display:flex;gap:6mm;align-items:flex-start">
      <div style="flex:1">${isInv && st === 'Paid' ? '<div class="stamp">PAID</div>' : ''}</div>
      <table class="totals">
        <tr><td>Sub-total</td><td>${money(c.sub)}</td></tr>
        ${c.disc ? `<tr><td>Discount</td><td>-${money(c.disc)}</td></tr>` : ''}
        ${d.vatOn ? `<tr><td>VAT @ ${num(d.vatRate)}%</td><td>${money(c.vat)}</td></tr>` : ''}
        <tr class="grand"><td>TOTAL (${esc(s.currency)})</td><td>${money(c.total)}</td></tr>
        ${isInv && c.paid ? `<tr><td>Paid to date</td><td>-${money(c.paid)}</td></tr><tr class="due"><td>BALANCE DUE</td><td>${money(c.balance)}</td></tr>` : ''}
      </table>
    </div>
    <div class="blocks">
      <div class="blk"><div class="h">${isInv ? 'Terms' : 'Terms & conditions'}</div><p>${esc(d.terms)}</p>${d.notes ? `<p style="margin-top:2mm"><b>Note:</b> ${esc(d.notes)}</p>` : ''}</div>
      ${isInv && d.showBank ? bankBlock() : `<div class="blk"><div class="h">Contact</div><p>${esc(s.signatory)}<br>${esc(s.signatoryTitle)}<br>${esc(s.phone1)}<br>${esc(s.email)}</p></div>`}
    </div>
    <div class="sigs">
      <div class="sig"><div class="ln"></div><div class="cap">For ${esc(s.company)}</div><b>${esc(s.signatory)}</b> — ${esc(s.signatoryTitle)}</div>
      ${isInv ? `<div class="sig"><div class="ln"></div><div class="cap">Received by (name, signature &amp; date)</div></div>`
              : `<div class="sig"><div class="ln"></div><div class="cap">Accepted by customer (name, signature &amp; date)</div></div>`}
    </div>
    ${docFooter()}
  </div>`;
}
function renderBoq(d) {
  const c = calc(d), s = DB.settings;
  const secTotals = d.sections.map(sec => round2(sec.rows.reduce((a, r) => a + num(r.qty) * num(r.rate), 0)));
  return `<div class="doc">
    ${letterhead()}
    <div class="title-row">
      <div class="dtitle">Bill of Quantities<small>${esc(d.project || '')}</small></div>
      <table class="meta"><tr><td>BOQ No.</td><td>${esc(d.no)}</td></tr><tr><td>Date</td><td>${esc(fmtDate(d.date))}</td></tr>${d.location ? `<tr><td>Location</td><td>${esc(d.location)}</td></tr>` : ''}</table>
    </div>
    <div class="parties">${partyBox('Client / Employer', d.client)}
      <div class="pbox"><div class="h">Prepared by</div><b>${esc(s.company)}</b><br>${esc(s.address)}<br>${esc(s.phone1)}</div></div>
    <table class="items"><thead><tr><th style="width:12mm">Item</th><th>Description</th><th style="width:15mm">Unit</th><th class="r" style="width:16mm">Qty</th><th class="r" style="width:26mm">Rate</th><th class="r" style="width:30mm">Amount</th></tr></thead><tbody>
      ${d.sections.map((sec, si) => `
        <tr class="sec"><td>${si + 1}</td><td colspan="5">${esc(sec.title || 'Section ' + (si + 1))}</td></tr>
        ${sec.rows.map((r, ri) => `<tr><td>${si + 1}.${ri + 1}</td><td>${nl(r.desc)}</td><td>${esc(r.unit)}</td><td class="r">${esc(num(r.qty).toLocaleString('en-US'))}</td><td class="r">${money(r.rate)}</td><td class="r">${money(num(r.qty) * num(r.rate))}</td></tr>`).join('')}
        <tr class="sub"><td></td><td colspan="4">Total carried to summary — ${esc(sec.title || 'Section ' + (si + 1))}</td><td class="r">${money(secTotals[si])}</td></tr>`).join('')}
    </tbody></table>
    <div style="display:flex;gap:6mm;align-items:flex-start">
      <div class="blk" style="flex:1;font-size:8.8pt"><div class="h">Summary</div>
        ${d.sections.map((sec, si) => `<p>Bill ${si + 1}: ${esc(sec.title)} — <b>${money(secTotals[si])}</b></p>`).join('')}</div>
      <table class="totals">
        <tr><td>Sub-total</td><td>${money(c.sub)}</td></tr>
        ${num(d.contingency) ? `<tr><td>Contingency @ ${num(d.contingency)}%</td><td>${money(c.cont)}</td></tr>` : ''}
        ${d.vatOn ? `<tr><td>VAT @ ${num(d.vatRate)}%</td><td>${money(c.vat)}</td></tr>` : ''}
        <tr class="grand"><td>GRAND TOTAL</td><td>${money(c.total)}</td></tr>
      </table>
    </div>
    ${d.notes ? `<div class="blk" style="font-size:8.8pt"><div class="h">Notes &amp; assumptions</div><p>${esc(d.notes)}</p></div>` : ''}
    <div class="sigs">
      <div class="sig"><div class="ln"></div><div class="cap">Prepared by — for ${esc(s.company)}</div><b>${esc(s.signatory)}</b></div>
      <div class="sig"><div class="ln"></div><div class="cap">Approved by client (name, signature &amp; date)</div></div>
    </div>
    ${docFooter()}
  </div>`;
}
function renderContract(d) {
  const s = DB.settings, c = d.client;
  const sched = [['Commencement date', fmtDate(d.startDate)], ['Duration', d.duration], ['Products / services', d.products],
    num(d.value) ? ['Contract value', money(d.value)] : null, ['Payment terms', d.paymentTerms], ['Delivery / place', d.delivery]].filter(Boolean);
  const witness = d.witnesses ? `<div class="cap" style="margin-top:4mm">Witness 1:</div><div class="ln"></div><div class="cap">Witness 2:</div><div class="ln"></div>` : '';
  return `<div class="doc letter">
    ${letterhead()}
    <div class="ctitle">${esc(d.title)}</div>
    <div class="cno">Contract No. ${esc(d.no)}</div>
    <p class="cparty">This Agreement is made and entered into on <b>${esc(fmtDate(d.date))}</b> by and between:</p>
    <p class="cparty"><b>${esc(s.company)}</b>${s.regNo ? ', Registration No. ' + esc(s.regNo) : ''}, a company registered in Zimbabwe with its principal place of business at ${esc(s.address)}, represented by ${esc(s.signatory)}, ${esc(s.signatoryTitle)} (hereinafter referred to as <b>“${esc(cap(d.companyRole).replace(/^The /, ''))}”</b>);</p>
    <p class="cparty" style="text-align:center"><b>AND</b></p>
    <p class="cparty"><b>${esc(c.name || '________________________')}</b>${c.regNo ? ', Registration / ID No. ' + esc(c.regNo) : ''}${c.address ? ', of ' + esc(c.address.replace(/\n/g, ', ')) : ''}${c.contact ? ', represented by ' + esc(c.contact) : ''} (hereinafter referred to as <b>“${esc(cap(d.otherRole).replace(/^The /, ''))}”</b>).</p>
    <p class="cparty">The parties agree as follows:</p>
    <div class="sched"><b style="color:var(--navy)">SCHEDULE OF KEY TERMS</b><table>${sched.map(r => `<tr><td>${r[0]}</td><td>${esc(r[1])}</td></tr>`).join('')}</table></div>
    <div class="clauses">${d.clauses.map((cl, i) => `<div class="cl"><h4>${i + 1}. ${esc(cl.title)}</h4><p>${esc(cl.text)}</p></div>`).join('')}</div>
    <p class="cparty" style="margin-top:4mm">IN WITNESS WHEREOF the parties have signed this Agreement on the dates and at the places indicated below.</p>
    <div class="csig">
      <div><div class="h">For ${esc(s.company)}</div><div class="ln"></div><div class="cap">Signature</div>
        <b>${esc(s.signatory)}</b><div class="cap">${esc(s.signatoryTitle)}</div><div class="cap">Date &amp; place: ______________________</div>${witness}</div>
      <div><div class="h">For ${esc(c.name || cap(d.otherRole))}</div><div class="ln"></div><div class="cap">Signature</div>
        <b>${esc(c.contact || '________________________')}</b><div class="cap">Name &amp; designation</div><div class="cap">Date &amp; place: ______________________</div>${witness}</div>
    </div>
    ${docFooter()}
  </div>`;
}
function renderLetter(d) {
  const s = DB.settings;
  const paras = String(d.body || '').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  const encl = String(d.enclosures || '').split('\n').map(x => x.trim()).filter(Boolean);
  return `<div class="doc letter">
    ${letterhead()}
    <div class="ref"><span>Our Ref: <b>${esc(d.no)}</b></span><span>${esc(fmtDate(d.date))}</span></div>
    <div class="addr">${esc(d.attention)}\n<b>${esc(d.supplier || '[Supplier]')}</b>\n${esc(d.supplierAddress)}</div>
    <div>Dear Sir / Madam,</div>
    <div class="subject">RE: ${esc(d.subject)}</div>
    <div class="body">${paras.map(p => `<p>${nl(p)}</p>`).join('')}</div>
    <div class="signoff"><div style="margin-top:4mm">${esc(d.closing)}</div>
    <div style="height:13mm"></div>
    <div><b>${esc(d.signatory)}</b><br>${esc(d.signatoryTitle)}<br>For and on behalf of ${esc(s.company)}<br>${esc(s.phone1)} · ${esc(s.email)}</div></div>
    ${encl.length ? `<div class="encl"><b>Enclosures:</b><ol>${encl.map(e => `<li>${esc(e)}</li>`).join('')}</ol></div>` : ''}
    ${docFooter()}
  </div>`;
}

/* ------------------------------------------------------------------ */
/* Clients view                                                       */
/* ------------------------------------------------------------------ */
function vClients() {
  const ed = PARAMS.edit ? DB.clients.find(c => c.id === PARAMS.edit) : null;
  const f = ed || (PARAMS.new ? emptyClient() : null);
  return `<h1 class="view-title">Clients</h1>
  ${f ? `<div class="card"><h3>${ed ? 'Edit client' : 'New client'}</h3>
    <label>Name / Company<input id="c_name" value="${esc(f.name)}"></label>
    <div class="row"><label>Contact person<input id="c_contact" value="${esc(f.contact)}"></label>
    <label>Phone<input id="c_phone" type="tel" value="${esc(f.phone)}"></label></div>
    <label>Email<input id="c_email" type="email" value="${esc(f.email)}"></label>
    <label>Address<textarea id="c_address" rows="2">${esc(f.address)}</textarea></label>
    <div class="btn-row"><button class="btn ghost" data-action="nav" data-to="clients">Cancel</button>
      ${ed ? `<button class="btn danger" data-action="del-client" data-id="${ed.id}">Delete</button>` : ''}
      <button class="btn red" style="flex:1" data-action="save-client" data-id="${ed ? ed.id : ''}">Save client</button></div></div>`
  : `<button class="btn red block" data-action="client-new" style="margin-bottom:12px">+ Add client</button>`}
  ${DB.clients.length ? `<div class="list">${DB.clients.slice().sort((a, b) => a.name.localeCompare(b.name)).map(c => {
    const n = DB.docs.filter(d => d.client && d.client.name === c.name).length;
    return `<div class="li" data-action="client-edit" data-id="${c.id}"><span class="badge c-quotation">${esc((c.name || '?').slice(0, 2).toUpperCase())}</span>
      <div class="main"><b>${esc(c.name)}</b><span>${esc([c.contact, c.phone].filter(Boolean).join(' · ') || c.email || '')}</span></div><div class="amt small">${n} doc${n === 1 ? '' : 's'}</div></div>`;
  }).join('')}</div>` : `<div class="card empty">Clients you use on documents are saved here automatically.</div>`}`;
}

/* ------------------------------------------------------------------ */
/* Product catalog view                                               */
/* ------------------------------------------------------------------ */
function vCatalog() {
  const ed = PARAMS.edit ? DB.items.find(i => i.id === PARAMS.edit) : null;
  const f = ed || (PARAMS.new ? { name: '', unit: 'each', price: 0, cat: '' } : null);
  const cats = [...new Set(DB.items.map(i => i.cat || 'Other'))];
  return `<h1 class="view-title">Products &amp; prices</h1>
  <div class="small muted" style="margin:-8px 2px 12px">Set your current prices here. When you pick a product on a quotation or invoice, its unit and price fill in automatically.</div>
  ${f ? `<div class="card"><h3>${ed ? 'Edit product' : 'New product'}</h3>
    <label>Product / service name<input id="p_name" value="${esc(f.name)}"></label>
    <div class="row"><label>Unit<input id="p_unit" value="${esc(f.unit)}"></label>
    <label>Price (${esc(DB.settings.currency)})<input id="p_price" type="number" inputmode="decimal" step="any" value="${esc(f.price)}"></label></div>
    <label>Category<input id="p_cat" list="cats" value="${esc(f.cat)}"><datalist id="cats">${cats.map(c => `<option value="${esc(c)}">`).join('')}</datalist></label>
    <div class="btn-row"><button class="btn ghost" data-action="nav" data-to="catalog">Cancel</button>
      ${ed ? `<button class="btn danger" data-action="del-item" data-id="${ed.id}">Delete</button>` : ''}
      <button class="btn red" style="flex:1" data-action="save-item" data-id="${ed ? ed.id : ''}">Save product</button></div></div>`
  : `<button class="btn red block" data-action="item-new" style="margin-bottom:12px">+ Add product</button>`}
  ${cats.map(cat => `<h2>${esc(cat)}</h2><div class="list">${DB.items.filter(i => (i.cat || 'Other') === cat).map(i => `
    <div class="li" data-action="item-edit" data-id="${i.id}"><div class="main"><b>${esc(i.name)}</b><span>per ${esc(i.unit)}</span></div>
    <div class="amt">${num(i.price) ? money(i.price) : '<span class="muted small">set price</span>'}</div></div>`).join('')}</div>`).join('')}`;
}

/* ------------------------------------------------------------------ */
/* Settings view                                                      */
/* ------------------------------------------------------------------ */
function vSettings() {
  const s = DB.settings, b = s.bank, lc = DB.counters.letter;
  const fld = (k, l, type) => `<label>${l}<input ${type ? `type="${type}"` : ''} data-set="${k}" value="${esc(getPath(s, k))}"></label>`;
  return `<h1 class="view-title">Settings</h1>
  <div class="card"><h3>Company</h3>
    ${fld('company', 'Registered name')}
    <label>Address<textarea data-set="address" rows="2" style="min-height:60px">${esc(s.address)}</textarea></label>
    <div class="row">${fld('phone1', 'Phone 1', 'tel')}${fld('phone2', 'Phone 2', 'tel')}</div>
    <div class="row">${fld('email', 'Email', 'email')}${fld('website', 'Website')}</div>
    <div class="row">${fld('regNo', 'Company reg. no.')}${fld('bpNo', 'ZIMRA BP no.')}${fld('vatNo', 'VAT no.')}</div>
  </div>
  <div class="card"><h3>Logo</h3>
    <div style="background:#f6f7fb;border-radius:10px;padding:12px;text-align:center;margin-bottom:10px"><img src="${esc(logoSrc())}" style="max-width:100%;max-height:90px"></div>
    <div class="btn-row"><label class="btn ghost sm" style="margin:0">Upload new logo<input type="file" accept="image/*" data-action="logo-file" hidden></label>
    ${s.logo ? `<button class="btn danger sm" data-action="logo-reset">Use original logo</button>` : ''}</div>
  </div>
  <div class="card"><h3>Signatory</h3>
    <div class="row">${fld('signatory', 'Name')}${fld('signatoryTitle', 'Title')}</div>
  </div>
  <div class="card"><h3>Banking details (shown on invoices)</h3>
    <div class="row">${fld('bank.bankName', 'Bank')}${fld('bank.branch', 'Branch')}</div>
    ${fld('bank.accountName', 'Account name')}
    <div class="row">${fld('bank.accountNo', 'Account number')}${fld('bank.swift', 'SWIFT / branch code')}</div>
    ${fld('bank.mobile', 'Mobile money (e.g. EcoCash merchant code)')}
  </div>
  <div class="card"><h3>Defaults</h3>
    <div class="row">${fld('currency', 'Currency code')}${fld('vatRate', 'VAT rate %', 'number')}</div>
    <label class="check"><input type="checkbox" data-set="vatDefault" ${s.vatDefault ? 'checked' : ''}> Charge VAT by default on new documents</label>
    <div class="row">${fld('quoteValidDays', 'Quotation valid (days)', 'number')}${fld('invoiceDueDays', 'Invoice due (days)', 'number')}</div>
    <label>Default quotation terms<textarea data-set="quoteTerms" rows="4">${esc(s.quoteTerms)}</textarea></label>
    <label>Default invoice terms<textarea data-set="invoiceTerms" rows="4">${esc(s.invoiceTerms)}</textarea></label>
  </div>
  <div class="card"><h3>Letter references</h3>
    <div class="row">${fld('letterPrefix', 'Prefix')}
      <label>Next number (${lc.year})<input type="number" data-action="letter-next" value="${esc(lc.next)}"></label></div>
    <div class="small muted">Next reference: <b>${esc(nextNo('letter', true))}</b></div>
  </div>
  <div class="card"><h3>Backup &amp; restore</h3>
    <div class="small muted" style="margin-bottom:8px">All data is stored only on this phone. Export a backup regularly and keep it on Google Drive or WhatsApp to yourself.</div>
    <div class="btn-row"><button class="btn sm" data-action="export">⇩ Export backup</button>
      <label class="btn ghost sm" style="margin:0">⇧ Restore backup<input type="file" accept=".json,application/json" data-action="import" hidden></label></div>
  </div>
  <div class="card"><h3>About this app</h3>
    <div style="display:flex;gap:12px;align-items:center;margin-bottom:10px"><img src="icons/rooster.png" style="width:44px"><div><b style="color:var(--navy)">Wankie Docs</b> v${APP_VERSION}<br><span class="small muted">Offline document generator for ${esc(s.company)}</span></div></div>
    <div style="background:var(--navy);color:#fff;border-radius:12px;padding:12px 14px">
      <div class="small" style="opacity:.75;text-transform:uppercase;letter-spacing:.06em">Designed &amp; developed by</div>
      <div style="font-weight:800;font-size:15px;margin:2px 0 6px">${DEV.name}</div>
      <div class="small" style="opacity:.9">${DEV.email} · ${DEV.phone}<br>${DEV.web}</div>
    </div>
    <label class="check" style="margin-top:12px"><input type="checkbox" data-set="showDevCredit" ${s.showDevCredit ? 'checked' : ''}> Show “Developed by Pilotage” line on printed documents</label>
    <div class="btn-row" style="margin-top:10px"><button class="btn danger sm" data-action="reset-all">Erase all data</button></div>
  </div>`;
}

/* ------------------------------------------------------------------ */
/* EVENTS                                                             */
/* ------------------------------------------------------------------ */
document.addEventListener('click', e => {
  const nav = e.target.closest('[data-nav]');
  if (nav) { if (VIEW === 'edit' && !confirmLeave()) return; DRAFT = null; go(nav.dataset.nav); return; }
  const el = e.target.closest('[data-action]');
  if (!el || el.tagName === 'SELECT' || el.tagName === 'INPUT' && el.type !== 'button') return;
  const a = el.dataset.action, id = el.dataset.id;
  const actions = {
    'new': () => { DRAFT = newDoc(el.dataset.type); go('edit'); },
    'open': () => go('preview', { id }),
    'edit': () => { DRAFT = clone(DB.docs.find(d => d.id === id)); go('edit'); },
    'nav': () => go(el.dataset.to),
    'filter': () => { FILTER = el.dataset.type; render(); },
    'back-docs': () => go('docs'),
    'cancel-edit': () => { if (!confirmLeave()) return; const back = DRAFT && DRAFT.no ? ['preview', { id: DRAFT.id }] : ['home']; DRAFT = null; go(...back); },
    'save-doc': saveDraft,
    'add-line': () => { DRAFT.items.push(blankLine()); rerenderEdit(); },
    'del-line': () => { DRAFT.items.splice(+el.dataset.i, 1); if (!DRAFT.items.length) DRAFT.items.push(blankLine()); rerenderEdit(); },
    'add-section': () => { DRAFT.sections.push({ title: '', rows: [blankBoqRow()] }); rerenderEdit(); },
    'del-section': () => { if (DRAFT.sections.length > 1 && confirm('Remove this whole section?')) { DRAFT.sections.splice(+el.dataset.si, 1); rerenderEdit(); } },
    'add-boq-row': () => { DRAFT.sections[+el.dataset.si].rows.push(blankBoqRow()); rerenderEdit(); },
    'del-boq-row': () => { const r = DRAFT.sections[+el.dataset.si].rows; r.splice(+el.dataset.ri, 1); if (!r.length) r.push(blankBoqRow()); rerenderEdit(); },
    'add-clause': () => { DRAFT.clauses.push({ title: 'New clause', text: '' }); rerenderEdit(); },
    'del-clause': () => { DRAFT.clauses.splice(+el.dataset.i, 1); rerenderEdit(); },
    'regen-clauses': () => { if (confirm('Rebuild all clauses from the template? Your manual clause edits will be replaced.')) { DRAFT.clauses = contractClauses(DRAFT).map(([title, text]) => ({ title, text })); rerenderEdit(); toast('Clauses rebuilt'); } },
    'regen-letter': () => { if (confirm('Rewrite the subject and letter body from the details above? Manual edits will be replaced.')) { DRAFT.subject = letterSubject(DRAFT); DRAFT.body = letterBody(DRAFT); rerenderEdit(); toast('Letter rewritten'); } },
    'print': doPrint,
    'share': () => shareDoc(id),
    'duplicate': () => { const src = DB.docs.find(d => d.id === id); DRAFT = Object.assign(clone(src), { id: uid(), no: '', date: today(), amountPaid: 0, createdAt: Date.now() }); if (DRAFT.type === 'quotation') DRAFT.validUntil = addDays(today(), DB.settings.quoteValidDays); if (DRAFT.type === 'invoice') DRAFT.dueDate = addDays(today(), DB.settings.invoiceDueDays); go('edit'); toast('Copy created — edit and save'); },
    'to-invoice': () => { const q = DB.docs.find(d => d.id === id); const inv = newDoc('invoice'); Object.assign(inv, { client: clone(q.client), items: clone(q.items), discount: q.discount, vatOn: q.vatOn, vatRate: q.vatRate, orderRef: q.no, notes: q.notes }); DRAFT = inv; go('edit'); toast('Invoice prepared from ' + q.no); },
    'record-payment': () => recordPayment(id),
    'delete': () => { const d = DB.docs.find(x => x.id === id); if (confirm(`Delete ${TYPES[d.type].label} ${d.no}? This cannot be undone.`)) { DB.docs = DB.docs.filter(x => x.id !== id); save(); toast('Deleted'); go('docs'); } },
    'client-new': () => go('clients', { new: 1 }),
    'client-edit': () => go('clients', { edit: id }),
    'save-client': () => saveClient(id),
    'del-client': () => { if (confirm('Delete this client? Existing documents are not affected.')) { DB.clients = DB.clients.filter(c => c.id !== id); save(); go('clients'); } },
    'item-new': () => go('catalog', { new: 1 }),
    'item-edit': () => go('catalog', { edit: id }),
    'save-item': () => saveItem(id),
    'del-item': () => { if (confirm('Delete this product?')) { DB.items = DB.items.filter(i => i.id !== id); save(); go('catalog'); } },
    'logo-reset': () => { DB.settings.logo = ''; save(); render(); toast('Original logo restored'); },
    'export': exportBackup,
    'reset-all': () => { if (confirm('Erase ALL documents, clients and settings on this phone?') && confirm('Are you sure? Export a backup first if unsure.')) { localStorage.removeItem(STORE_KEY); DB = load(); go('home'); toast('All data erased'); } }
  };
  if (actions[a]) { e.preventDefault(); actions[a](); }
});

document.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset.bind && DRAFT) {
    const v = el.type === 'checkbox' ? el.checked : el.type === 'number' ? (el.value === '' ? '' : num(el.value)) : el.value;
    setPath(DRAFT, el.dataset.bind, v);
    DRAFT._dirty = true;
    updateLive();
  } else if (el.dataset.set) {
    const v = el.type === 'checkbox' ? el.checked : el.type === 'number' ? num(el.value) : el.value;
    setPath(DB.settings, el.dataset.set, v); save();
  } else if (el.dataset.action === 'search') {
    SEARCH = el.value; const pos = el.selectionStart; render(); const s = $('[data-action="search"]'); s.focus(); s.setSelectionRange(pos, pos);
  } else if (el.dataset.action === 'letter-next') {
    const n = Math.max(1, parseInt(el.value, 10) || 1); DB.counters.letter = { year: new Date().getFullYear(), next: n }; save();
  }
});

document.addEventListener('change', e => {
  const el = e.target, a = el.dataset.action;
  if (a === 'pick-client' && el.value) {
    const c = DB.clients.find(x => x.id === el.value);
    if (c) { DRAFT.client = Object.assign(emptyClient(), { name: c.name, contact: c.contact, phone: c.phone, email: c.email, address: c.address, regNo: c.regNo || '' }); rerenderEdit(); }
  } else if (a === 'contract-kind') {
    if (confirm('Switch template? Clauses will be rebuilt for the new agreement type.')) { DRAFT.kind = el.value; applyContractTemplate(DRAFT); rerenderEdit(); }
    else el.value = DRAFT.kind;
  } else if (el.dataset.item != null && DRAFT) {
    const i = +el.dataset.item, row = DRAFT.items[i];
    const p = DB.items.find(x => x.name.toLowerCase() === String(row.desc).trim().toLowerCase());
    if (p) { row.unit = p.unit; if (num(p.price)) row.price = num(p.price); rerenderEdit(); }
  } else if (a === 'logo-file' && el.files[0]) {
    readImage(el.files[0], 600).then(url => { DB.settings.logo = url; if (save()) { render(); toast('Logo updated'); } });
  } else if (a === 'import' && el.files[0]) {
    importBackup(el.files[0]);
  } else if (el.dataset.set || el.dataset.action === 'letter-next') {
    if (VIEW === 'settings' && (el.dataset.set === 'letterPrefix' || el.dataset.action === 'letter-next')) { const y = window.scrollY; render(); window.scrollTo(0, y); }
  }
});

function updateLive() {
  const lt = $('#liveTotals'); if (lt) lt.innerHTML = liveTotals(DRAFT);
  if (DRAFT.items) DRAFT.items.forEach((r, i) => { const x = $(`[data-lt="${i}"]`); if (x) x.textContent = money(lineTotal(r)); });
  if (DRAFT.sections) DRAFT.sections.forEach((s, si) => s.rows.forEach((r, ri) => { const x = $(`[data-bt="${si}_${ri}"]`); if (x) x.textContent = money(num(r.qty) * num(r.rate)); }));
}
function rerenderEdit() { const y = window.scrollY; DRAFT._dirty = true; render(); window.scrollTo(0, y); }
function confirmLeave() { return !(DRAFT && DRAFT._dirty) || confirm('Discard unsaved changes?'); }

function saveDraft() {
  const d = DRAFT;
  const who = d.type === 'letter' ? d.supplier : d.client.name;
  if (!String(who || '').trim()) { toast(d.type === 'letter' ? 'Enter the supplier name' : 'Enter the client name'); return; }
  if (d.items) d.items = d.items.filter(r => String(r.desc).trim() || num(r.price));
  if (d.items && !d.items.length) { d.items = [blankLine()]; toast('Add at least one item'); rerenderEdit(); return; }
  if (!d.no) d.no = nextNo(d.type);
  delete d._dirty;
  d.updatedAt = Date.now();
  const i = DB.docs.findIndex(x => x.id === d.id);
  if (i >= 0) DB.docs[i] = d; else DB.docs.push(d);
  // remember client
  if (d.client && d.client.name && d.type !== 'letter') {
    const ex = DB.clients.find(c => c.name.trim().toLowerCase() === d.client.name.trim().toLowerCase());
    if (ex) Object.keys(d.client).forEach(k => { if (d.client[k]) ex[k] = d.client[k]; });
    else DB.clients.push(Object.assign({ id: uid() }, d.client));
  }
  if (save()) { DRAFT = null; toast('Saved ' + d.no); go('preview', { id: d.id }); }
}
function saveClient(id) {
  const c = { name: $('#c_name').value.trim(), contact: $('#c_contact').value.trim(), phone: $('#c_phone').value.trim(), email: $('#c_email').value.trim(), address: $('#c_address').value.trim() };
  if (!c.name) { toast('Enter a name'); return; }
  if (id) Object.assign(DB.clients.find(x => x.id === id), c); else DB.clients.push(Object.assign({ id: uid() }, c));
  save(); toast('Client saved'); go('clients');
}
function saveItem(id) {
  const p = { name: $('#p_name').value.trim(), unit: $('#p_unit').value.trim() || 'each', price: num($('#p_price').value), cat: $('#p_cat').value.trim() || 'Other' };
  if (!p.name) { toast('Enter a product name'); return; }
  if (id) Object.assign(DB.items.find(x => x.id === id), p); else DB.items.push(Object.assign({ id: uid() }, p));
  save(); toast('Product saved'); go('catalog');
}
function recordPayment(id) {
  const d = DB.docs.find(x => x.id === id), c = calc(d);
  const v = prompt(`Amount received (balance ${money(c.balance)}):`, c.balance.toFixed(2));
  if (v == null) return;
  const n = num(v); if (n <= 0) { toast('Enter an amount'); return; }
  d.amountPaid = round2(num(d.amountPaid) + n);
  d.payments = (d.payments || []).concat([{ date: today(), amount: n }]);
  d.updatedAt = Date.now(); save(); render(); toast(invoiceStatus(d) === 'Paid' ? 'Invoice fully paid' : 'Payment recorded');
}

/* ---------- Print / share ---------- */
function doPrint() {
  const d = DB.docs.find(x => x.id === PARAMS.id);
  const pa = $('#printArea');
  pa.innerHTML = renderDoc(d);
  const oldTitle = document.title;
  document.title = `${TYPES[d.type].label} ${d.no} - ${d.type === 'letter' ? d.supplier : d.client.name}`.replace(/[\/\\:*?"<>|]/g, '-');
  const imgs = $$('img', pa);
  Promise.all(imgs.map(i => i.complete ? 1 : new Promise(r => { i.onload = i.onerror = r; }))).then(() => {
    setTimeout(() => {
      window.print();
      setTimeout(() => { document.title = oldTitle; }, 1000);
    }, 50);
  });
}
function shareDoc(id) {
  const d = DB.docs.find(x => x.id === id), s = DB.settings;
  const who = d.type === 'letter' ? d.supplier : d.client.name;
  let text = `${s.company}\n${TYPES[d.type].label} ${d.no}\nTo: ${who}\nDate: ${fmtDate(d.date)}`;
  if (d.type === 'quotation' || d.type === 'invoice') {
    text += '\n\n' + d.items.map(r => `• ${r.desc} — ${num(r.qty)} ${r.unit} × ${money(r.price)} = ${money(lineTotal(r))}`).join('\n');
    const c = calc(d); text += `\n\nTOTAL: ${money(c.total)}`;
    if (d.type === 'invoice') text += `\nBalance due: ${money(c.balance)} by ${fmtDate(d.dueDate)}`;
    if (d.type === 'quotation') text += `\nValid until ${fmtDate(d.validUntil)}`;
  }
  text += `\n\n${s.signatory}, ${s.signatoryTitle}\n${s.phone1} · ${s.email}`;
  navigator.share({ title: `${TYPES[d.type].label} ${d.no}`, text }).catch(() => {});
}

/* ---------- Files ---------- */
function readImage(file, maxW) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const sc = Math.min(1, maxW / img.width);
        const cv = document.createElement('canvas'); cv.width = Math.round(img.width * sc); cv.height = Math.round(img.height * sc);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        res(cv.toDataURL('image/png'));
      };
      img.onerror = rej; img.src = fr.result;
    };
    fr.onerror = rej; fr.readAsDataURL(file);
  });
}
function exportBackup() {
  const blob = new Blob([JSON.stringify({ app: 'wankie-docs', version: APP_VERSION, exported: new Date().toISOString(), data: DB }, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `wankie-docs-backup-${today()}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast('Backup downloaded');
}
function importBackup(file) {
  const fr = new FileReader();
  fr.onload = () => {
    try {
      const j = JSON.parse(fr.result); const data = j.data || j;
      if (!data.docs || !data.settings) throw new Error('bad');
      if (!confirm(`Restore backup with ${data.docs.length} documents? This replaces the data on this phone.`)) return;
      DB = migrate(data); save(); go('home'); toast('Backup restored');
    } catch (e) { toast('That file is not a valid Wankie Docs backup'); }
  };
  fr.readAsText(file);
}

/* ------------------------------------------------------------------ */
/* Install prompt, service worker, start                              */
/* ------------------------------------------------------------------ */
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; $('#installBtn').classList.remove('hide'); });
$('#installBtn').addEventListener('click', async () => {
  if (!deferredPrompt) return; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; $('#installBtn').classList.add('hide');
});
window.addEventListener('appinstalled', () => $('#installBtn').classList.add('hide'));
window.addEventListener('beforeunload', e => { if (DRAFT && DRAFT._dirty) { e.preventDefault(); e.returnValue = ''; } });

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

(function start() {
  const h = (location.hash || '').slice(1);
  go(['docs', 'clients', 'catalog', 'settings'].includes(h) ? h : 'home');
  setTimeout(() => { const sp = $('#splash'); sp.classList.add('out'); setTimeout(() => sp.remove(), 500); }, 1300);
})();
