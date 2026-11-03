import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const src=fs.readFileSync('script.js','utf8');
const workbook=JSON.parse(fs.readFileSync('tests/fixtures/prices-from-sheet.json','utf8'));
const cell=(tab,address)=>workbook[tab][address].value;
const n=(tab,address)=>Number(cell(tab,address));
const dutchNumbers=text=>text.match(/\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?/g).map(x=>Number(x.replaceAll('.','').replace(',','.')));
const sw='Schrijnwerk',ds='Diensten';
const coeff=dutchNumbers(cell(sw,'B20'));
function sheetReference(i){
 const w=i.widthCm/100,h=i.heightCm/100,a=w*h,p=2*(w+h),ratio=Math.max(w,h)/Math.min(w,h);
 const basis=()=>a>=2&&a<=3.5 ? a*(ratio>=2.7?dutchNumbers(cell(sw,'B17'))[0]:a<2.5?dutchNumbers(cell(sw,'B18'))[0]:dutchNumbers(cell(sw,'B19'))[0]) : coeff[0]+coeff[1]*a+coeff[2]*a*a+coeff[3]*(i.widthCm===50&&i.heightCm===300?1:0)+coeff[4]*(a<=1.25?1:0);
 const base=i.type==='raam'?basis():i.type==='schuifraam'?dutchNumbers(cell(sw,'B7'))[0]+dutchNumbers(cell(sw,'B7'))[1]*a:i.type==='deur'||i.type==='deur-zijlicht'||i.type==='deur-element'?dutchNumbers(cell(sw,'B8'))[0]+(i.type==='deur'?0:basis()):i.type==='deur-dubbel'?dutchNumbers(cell(sw,'B11'))[0]:dutchNumbers(cell(sw,'B12'))[0];
 const row={pvc_double:27,pvc_triple:28,alu_double:29,alu_triple:30,alu_passive:31}[i.glass];
 const gf=i.type==='poort'?1:n(sw,(i.type==='raam'?'B':i.type==='schuifraam'?'C':'D')+row);
 const colorRow={standard:35,single:36,double:37}[i.color],colorCol=i.glass.startsWith('alu')?'D':a<3.5?'B':'C';
 const color=n(sw,colorCol+colorRow),opening=i.type==='raam'&&i.opening==='draaikiep'?(a<=1?2:1.4):1;
 const shade=i.shutter==='none'?0:w*n(ds,'C37');
 const product=(base*gf*1.1*opening*color+shade)*n('Overzicht','B23')*(.75/1.35)*(1+n('Overzicht','B24'));
 const triple=['pvc_triple','alu_triple','alu_passive'].includes(i.glass),formulaWeight=(w-.13)*(h-.13)*(triple?30:20)+p*(triple?8:6);
 const weight=i.type==='raam'||i.type==='schuifraam'?formulaWeight:i.type==='deur'?110:i.type==='deur-zijlicht'?140:i.type==='deur-dubbel'?190:i.type==='deur-element'?110+formulaWeight:140;
 const dr=[6,7,8,9,10,11].find(r=>weight<=(r===11?Infinity:n(ds,'C'+r)));
 const demolition=n(ds,'D'+dr),recycling=weight/1000*n(ds,'C34');
 let installation;
 if(i.type==='raam')installation=n(ds,'C'+[16,17,18,19,20][[100,150,200,300,Infinity].findIndex(max=>weight<=max)]);
 else if(i.type==='schuifraam')installation=n(ds,'C'+[21,22,23,24][[200,400,600,Infinity].findIndex(max=>weight<=max)]);
 else installation=n(ds,'C'+({deur:25,'deur-zijlicht':26,'deur-dubbel':27,'deur-element':28,poort:29}[i.type]));
 const sealant=p*n(ds,'C35');let fr=null;
 if(i.finishing==='mdf')fr=a<=5?42:a<=10?43:44;
 if(i.finishing==='pvc')fr=a<=2.5?45:a<=5?46:a<=10?47:48;
 if(i.finishing==='pleister')fr=a<=2.5?49:a<=5?50:51;
 const finishing=(fr?n(ds,'C'+fr):0)+(i.shutter==='rolluik'?n(ds,'C'+(w<=3?52:53)):0);
 const parts={product,demolition,recycling,installation,sealant,finishing};
 return {parts,weight,net:Object.values(parts).reduce((x,y)=>x+y,0)};
}
const names=['effectiveItemDimensionsCm','isWindowDoorType','areaInM2','perimeterInLm','finishingPerimeterLm','isAluminiumSystem','isTripleWeightSystem','windowFormulaBasePrice','colorMultiplier','openingMultiplier','glassPriceMultiplier','elementUnitBasePrice','legacyElementUnitPrice','elementUnitBaseCost','elementUnitPrice','linePrice','effectiveFinishing','finishingEntriesForItem','mdfFinishingTier','pvcFinishingTier','plasterFinishingTier','shutterUnitPrice','formulaWeightKg','itemWeightKg','pickTierByWeight','montageTierForItem','itemDirectCostParts','simpleItemSpec','simpleItemUnitBreakdown','simpleElementTypeBreakdown','formatSimpleRange','calculateSimpleEstimate','customerPriceBounds'];
const funcs=names.map(name=>{const m=src.match(new RegExp('^function '+name+'\\([^]*?^}','m'));assert.ok(m,name);return m[0];}).join('\n');
const constants=src.slice(src.indexOf('const MIN_ITEM_DIMENSION_MM'),src.indexOf('const clientForm'));
const typesSource=src.slice(src.indexOf('const simpleElementTypes = ['),src.indexOf('function simpleElementQuantityField'));
const context=vm.createContext({});
vm.runInContext(fs.readFileSync('config.js','utf8').replace('window.QUOTE_BUILDER_CONFIG','globalThis.config'),context);
vm.runInContext('const quoteBuilderConfig=config;function isFacadeRenovationActive(){return false}function sealantRatePerLm(){return 7}function formatCurrency(n){return Number(n).toFixed(2)}function currentSimpleSelection(){return globalThis.selection}function simpleSupportBreakdown(){return {combinedRows:[],premiumRows:[],loanRows:[]}}function simpleSupportIncomeNote(){return ""}\n'+constants+'\n'+typesSource+'\n'+funcs,context);
const types=vm.runInContext('simpleElementTypes',context);
const results=[],errors=[];
let comparisons=0;
for(const type of types){
 const i={...type.specs[0],quantity:1,glass:'pvc_double',finishing:'mdf',color:'standard',opening:type.specs[0].opening||(type.specs[0].type==='raam'?'draaikiep':'vast'),shutter:'none'};
 const ref=sheetReference(i);context.item=i;
 const live=vm.runInContext('itemDirectCostParts(item)',context);
 const map={product:'element',demolition:'demontage',recycling:'recycling',installation:'montage',sealant:'sealant',finishing:'finishing'};
 for(const [field,key] of Object.entries(map)){comparisons++;if(Math.abs(ref.parts[field]-live[key])>1e-8)errors.push({type:type.key,field,expected:ref.parts[field],actual:live[key]});}
 for(const oldHouse of [true,false])for(const qty of [1,2,5]){
  context.selection={modules:{items:true},oldHouse,elementQuantities:{[type.key]:qty}};
  const est=vm.runInContext('calculateSimpleEstimate()',context);
  const expected=ref.net*qty*(oldHouse?1.06:1.21);comparisons++;
  if(Math.abs(est.totalHighInclRaw-expected)>1e-8)errors.push({type:type.key,oldHouse,qty,expected,actual:est.totalHighInclRaw});
  context.upper=est.totalHighInclRaw;
  const bounds=vm.runInContext('customerPriceBounds(upper)',context);
  assert.equal(bounds.upper,est.totalHighInclRaw);
 }
 results.push({type:type.label,dimensions:`${i.widthCm*10} × ${i.heightCm*10} mm`,opening:i.opening,net:ref.net,inc6:ref.net*1.06,inc21:ref.net*1.21,shownUpper6:Math.ceil(ref.net*1.06),shownUpper21:Math.ceil(ref.net*1.21),parts:ref.parts});
}
context.selection={modules:{items:true},oldHouse:false,elementQuantities:Object.fromEntries(types.map((t,i)=>[t.key,i+1]))};
const mixed=vm.runInContext('calculateSimpleEstimate()',context);
const expectedMixed=results.reduce((sum,r,i)=>sum+r.inc21*(i+1),0);comparisons++;
assert.ok(Math.abs(mixed.totalHighInclRaw-expectedMixed)<1e-7,'Gemengd project');
assert.equal(errors.length,0,JSON.stringify(errors));

console.log(`PASS: ${comparisons} controles; alle 8 types, beide btw-tarieven, aantallen en gemengd project.`);
