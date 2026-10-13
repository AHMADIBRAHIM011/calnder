/* APP1 v5 */
'use strict';
/* ===== أدوات عامة ===== */
const AR='٠١٢٣٤٥٦٧٨٩';
const arNum=n=>String(n).replace(/\d/g,d=>AR[+d]);
const MONTH_AR=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const DOW=['أحد','اثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'];
const DOW_FULL=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
const serial=(y,m,d)=>Math.round(Date.UTC(y,m,d)/864e5);
const fromSerial=s=>{const t=new Date(s*864e5);return{y:t.getUTCFullYear(),m:t.getUTCMonth(),d:t.getUTCDate()};};
const dowOf=s=>new Date(s*864e5).getUTCDay();
const mod6=n=>((n%6)+6)%6;
const daysPhrase=n=>n===1?'يوم واحد':n===2?'يومين':arNum(n)+' أيام';

/* ===== نطاق العرض: من الشهر الحالي حتى ديسمبر ٢٠٢٧ ===== */
const MONTHS=(()=>{const now=new Date();const a=[];
  for(let y=now.getFullYear();y<=2027;y++)
    for(let m=(y===now.getFullYear()?now.getMonth():0);m<12;m++)a.push({y,m});
  return a;})();

/* ===== حالة الدورة ===== */
const KEY='twq-work-calendar-3x3-v2';
let state=(()=>{try{const s=JSON.parse(localStorage.getItem(KEY));
  if(s&&s.base&&Array.isArray(s.offsets)&&s.offsets.length===3)return s;}catch(e){}return null;})();
const save=()=>{try{if(state)localStorage.setItem(KEY,JSON.stringify(state));else localStorage.removeItem(KEY);}catch(e){}};
const baseSerial=()=>state?serial(state.base.y,state.base.m,state.base.d):null;
const classify=s=>!state?'none':(state.offsets.includes(mod6(s-baseSerial()))?'work':'rest');

/* ===== الرخص والإجازات ===== */
const KEY_LIC='twq-licenses-v1';
let licenses=(()=>{try{const a=JSON.parse(localStorage.getItem(KEY_LIC));
  if(Array.isArray(a))return new Set(a.filter(n=>Number.isInteger(n)));}catch(e){}return new Set();})();
const saveLic=()=>{try{localStorage.setItem(KEY_LIC,JSON.stringify([...licenses].sort((a,b)=>a-b)));}catch(e){}};
let licEdit=false,licPicked=new Set();

/* ===== الدعاء ===== */
const DUA_PARAS=[
'اللهم إني أعوذ بك من ساعة السوء ويوم السوء وليلة السوء وصديق السوء وجار السوء، وأعوذ بك من ذي الوجهين وذي اللسانين، وأعوذ بك من إبليس وذريته وشياطينه، وأعوذ بك من الحديد والحريق والطريق وساعة الغفلة',
'ربنا عليك توكلت وأنت رب العرش العظيم',
'اللهم إني حصّنت نفسي وأهل بيتي جميعًا بالحيّ القيوم الذي لا تأخذه سنة ولا نوم، ودفعت عني وعنهم السوء بلا حول ولا قوة إلا بالله العلي العظيم',
'اللهم إني أعوذ بك من بكاء يرهقني وهمّ يفجعني، اللهم اجبر خاطري واشرح صدري',
'استغفرك ربي من كل الذنوب والخطايا، ربي لا تكسر لي قلبًا ولا تصعب عليّ أمرًا ولا تحرمني من تعلّقت به الروح',
'واحفظ لي عائلتي وأحبتي، ومن أراد لي الخير يارب العالمين'];
const DUA_TEXT=DUA_PARAS.join(' ');
const DUA_MIN=16*60+30;
const K_NOTIFIED='twq-dua-notified',K_READ='twq-dua-read';
const lnum=k=>{try{const v=localStorage.getItem(k);return v===null?-1:+v;}catch(e){return -1;}};
const lset=(k,v)=>{try{localStorage.setItem(k,String(v));}catch(e){}};
const todayParts=()=>{const t=new Date();return{y:t.getFullYear(),m:t.getMonth(),d:t.getDate()};};
const todaySerial=()=>{const T=todayParts();return serial(T.y,T.m,T.d);};
const isWorkDay=s=>classify(s)==='work';
const isDuaDay=s=>classify(s)==='work'&&!licenses.has(s);
const pastDuaTime=()=>{const n=new Date();return n.getHours()*60+n.getMinutes()>=DUA_MIN;};
const DUA_ICON=(()=>{try{const c=document.createElement('canvas');c.width=c.height=192;const x=c.getContext('2d');
  x.fillStyle='#0b0b09';x.fillRect(0,0,192,192);
  x.strokeStyle='#d9a641';x.lineWidth=10;x.strokeRect(10,10,172,172);
  x.fillStyle='#d9a641';x.font='110px serif';x.textAlign='center';x.textBaseline='middle';x.fillText('\u263E',96,104);
  return c.toDataURL('image/png');}catch(e){return undefined;}})();

/* ===== العناصر ===== */
const $=id=>document.getElementById(id);
const monthsEl=$('months'),summaryEl=$('summary'),weekEl=$('weekStrip'),
  tDateEl=$('tDate'),tBadgeEl=$('tBadge'),tNextEl=$('tNext'),
  editBtn=$('editBtn'),editBar=$('editBar'),pcountEl=$('pcount'),
  cancelBtn=$('cancelBtn'),resetBtn=$('resetBtn'),footEl=$('foot'),toastEl=$('toast'),
  duaBarEl=$('duaBar'),duaBtn=$('duaBtn'),duaOverlay=$('duaOverlay'),
  duaSub=$('duaSub'),duaBody=$('duaBody'),duaX=$('duaX'),duaSpeak=$('duaSpeak'),duaDoneBtn=$('duaDoneBtn'),
  licBtn=$('licBtn'),licBar=$('licBar'),licCountEl=$('licCount'),
  clearLicBtn=$('clearLic'),saveLicBtn=$('saveLicBtn'),cancelLicBtn=$('cancelLic');
const BTN_HTML=editBtn.innerHTML,LIC_BTN_HTML=licBtn.innerHTML;

/* ===== وضع تعديل الدوام ===== */
let editing=false,picked=[];
function updatePcount(){pcountEl.textContent=arNum(picked.length)+' / ٣';}
function startEdit(){
  if(licEdit)stopLicEdit();
  editing=true;picked=[];
  editBar.hidden=false;
  editBtn.textContent='إلغاء التعديل';
  updatePcount();
  renderMonths(false);renderSummary();
}
function stopEdit(){
  editing=false;picked=[];
  editBar.hidden=true;
  editBtn.innerHTML=BTN_HTML;
  renderMonths(false);renderSummary();
}
function finishPick(){
  picked.sort((a,b)=>a-b);
  const baseS=picked[0];
  const offsets=[...new Set(picked.map(p=>mod6(p-baseS)))].sort((a,b)=>a-b);
  state={base:fromSerial(baseS),offsets};
  save();
  const consecutive=picked[1]-picked[0]===1&&picked[2]-picked[1]===1;
  editing=false;picked=[];
  editBar.hidden=true;
  editBtn.innerHTML=BTN_HTML;
  renderAll(true);
  toast(consecutive?'تم! حُسبت أيام العمل والإجازة لكامل التقويم تلقائياً':'تم الحفظ — انتبه: أيام العمل التي اخترتها غير متتالية');
}

/* ===== وضع الرخص ===== */
function updateLicCount(){licCountEl.textContent=arNum(licPicked.size)+' يوم';}
function startLicEdit(){
  if(editing)stopEdit();
  licEdit=true;
  licPicked=new Set(licenses);
  licBar.hidden=false;
  licBtn.textContent='إغلاق الرخص';
  updateLicCount();
  renderMonths(false);renderSummary();
}
function stopLicEdit(){
  licEdit=false;licPicked=new Set();
  licBar.hidden=true;
  licBtn.innerHTML=LIC_BTN_HTML;
  renderMonths(false);renderSummary();
}
function commitLic(){
  licenses=new Set(licPicked);
  saveLic();
  licEdit=false;licPicked=new Set();
  licBar.hidden=true;
  licBtn.innerHTML=LIC_BTN_HTML;
  renderAll(false);
  toast(licenses.size?'تم حفظ الرخص — '+arNum(licenses.size)+' يوماً (تذكير الدعاء مستثنى منها)':'تم مسح جميع الرخص');
}

/* ===== رسم الشهور ===== */
function renderMonths(wave){
  const T=todayParts();
  monthsEl.classList.toggle('editing',editing);
  monthsEl.classList.toggle('licedit',licEdit);
  monthsEl.classList.toggle('wave',!!wave);
  const baseS=baseSerial();
  const licSet=licEdit?licPicked:licenses;
  let h='';
  for(const mo of MONTHS){
    const lead=new Date(mo.y,mo.m,1).getDay();
    const dim=new Date(mo.y,mo.m+1,0).getDate();
    const isCur=mo.y===T.y&&mo.m===T.m;
    let w=0,r=0,l=0;
    for(let d=1;d<=dim;d++){
      const s=serial(mo.y,mo.m,d);
      if(licSet.has(s))l++;
      else{const c=classify(s);if(c==='work')w++;else if(c==='rest')r++;}
    }
    h+='<section class="month'+(isCur?' cur':'')+'"><header><h2>'+MONTH_AR[mo.m]+' '+arNum(mo.y)+'</h2>'
      +'<span class="mstat"><b><i class="dot w"></i>'+arNum(w)+'</b><b><i class="dot r"></i>'+arNum(r)+'</b>'
      +(l?'<b><i class="dot l"></i>'+arNum(l)+'</b>':'')+'</span></header>'
      +'<div class="dow">'+DOW.map(x=>'<span>'+x+'</span>').join('')+'</div><div class="days">';
    for(let i=0;i<lead;i++)h+='<span class="cell empty"></span>';
    for(let d=1;d<=dim;d++){
      const s=serial(mo.y,mo.m,d);
      const isT=mo.y===T.y&&mo.m===T.m&&d===T.d;
      let cls='cell',extra='',kind='';
      if(editing){
        const pi=picked.indexOf(s);
        if(pi>-1){cls+=' picked';extra=' data-pick="'+arNum(pi+1)+'"';}
      }else if(licSet.has(s)){cls+=' lic';kind=' — رخصة / إجازة (بلا تذكير دعاء)';}
      else{
        const c=classify(s);
        if(c==='work'){cls+=' work';kind=' — يوم عمل (فيه تذكير الدعاء)';}
        else if(c==='rest'){cls+=' rest';kind=' — يوم إجازة';}
        else kind=' — حدّد الجدول أولاً';
      }
      if(licEdit&&licPicked.has(s))cls+=' marked';
      if(isT)cls+=' today';
      const delay=(wave&&!editing&&baseS!==null)?' style="transition-delay:'+Math.max(0,s-baseS)*1.1+'ms"':'';
      h+='<button type="button" class="'+cls+'" data-s="'+s+'"'+extra+delay
        +' title="'+DOW_FULL[dowOf(s)]+' '+arNum(d)+' '+MONTH_AR[mo.m]+' '+arNum(mo.y)+kind+'"><span>'+arNum(d)+'</span></button>';
    }
    h+='</div></section>';
  }
  monthsEl.innerHTML=h;
}

/* ===== عدّاد الشهور ===== */
function renderSummary(){
  const T=todayParts();
  const licSet=licEdit?licPicked:licenses;
  let h='';
  for(const mo of MONTHS){
    const dim=new Date(mo.y,mo.m+1,0).getDate();
    let w=0,r=0,l=0;
    for(let d=1;d<=dim;d++){
      const s=serial(mo.y,mo.m,d);
      if(licSet.has(s))l++;
      else{const c=classify(s);if(c==='work')w++;else if(c==='rest')r++;}
    }
    const isCur=mo.y===T.y&&mo.m===T.m;
    const row=!state?'<span style="color:var(--dim2)">بانتظار تحديد الجدول</span>'
      :'<span><i class="dot w"></i>عمل '+arNum(w)+'</span><span><i class="dot r"></i>إجازة '+arNum(r)+'</span><span><i class="dot l"></i>رخص '+arNum(l)+'</span>';
    h+='<div class="scard'+(isCur?' cur':'')+((editing||licEdit)?' dim':'')+'"><b>'+MONTH_AR[mo.m]+'<i>'+arNum(mo.y)+'</i></b>'
      +'<span class="row">'+row+'</span></div>';
  }
  summaryEl.innerHTML=h;
}

/* ===== شريط اليوم (نسخة مُصلحة احتياطية — إن وُجدت نسخة في app2.js فهي المطّردة) ===== */
function renderToday(){
  const T=todayParts();
  const ts=serial(T.y,T.m,T.d),baseS=baseSerial();
  const licSet=licEdit?licPicked:licenses;
  tDateEl.textContent=DOW_FULL[dowOf(ts)]+' '+arNum(T.d)+' '+MONTH_AR[T.m]+' '+arNum(T.y);
  if(!state){
    tBadgeEl.innerHTML='<span class="badge none">لم يُحدد الجدول بعد</span>';
    tNextEl.textContent='اضغط «تعديل أيام العمل» ثم اختر ٣ أيام متتالية — ويتحسب كل شيء تلقائياً';
    weekEl.innerHTML='';
    return;
  }
  const off=mod6(ts-baseS);
  const ws=[...state.offsets].sort((a,b)=>a-b);
  const rs=[0,1,2,3,4,5].filter(o=>!ws.includes(o));
  const isW=ws.includes(off);
  if(licSet.has(ts)){
    tBadgeEl.innerHTML='<span class="badge lic">رخصة / إجازة معتمدة</span>';
  }else{
    tBadgeEl.innerHTML=isW
      ?'<span class="badge work">يوم عمل '+arNum(ws.indexOf(off)+1)+' من '+arNum(ws.length)+'</span>'
      :'<span class="badge rest">يوم إجازة '+arNum(rs.indexOf(off)+1)+' من '+arNum(rs.length)+'</span>';
  }
  let nx=0;
  for(let k=1;k<=6;k++){const o=mod6(off+k);if(isW?!ws.includes(o):ws.includes(o)){nx=k;break;}}
  tNextEl.innerHTML=(isW?'الإجازة القادمة بعد ':'العمل القادم بعد ')+daysPhrase(nx)
    +(licSet.has(ts)?' · <span style="color:var(--lic-ink)">اليوم من أيام رخصتك — لا تذكير دعاء اليوم</span>':'');
  let h='';
  for(let k=-3;k<=3;k++){
    const s2=ts+k;
    const kind=licSet.has(s2)?'lic':(ws.includes(mod6(s2-baseS))?'work':'rest');
    h+='<div class="wd '+kind+(k===0?' now':'')+'"><i></i><span>'+(k===0?'اليوم':DOW[dowOf(s2)])+'</span></div>';
  }
  weekEl.innerHTML=h;
}

/* ===== التذييل ===== */
function renderFoot(){
  if(!state){footEl.innerHTML='<span>حدّد أيام العمل أولاً لحساب الإجماليات</span>';return;}
  let w=0,r=0,l=0,tot=0;
  for(const mo of MONTHS){
    const dim=new Date(mo.y,mo.m+1,0).getDate();
    for(let d=1;d<=dim;d++){
      const s=serial(mo.y,mo.m,d);tot++;
      if(licenses.has(s))l++;
      else{const c=classify(s);if(c==='work')w++;else r++;}
    }
  }
  footEl.innerHTML='<span>إجمالي الفترة: <b>'+arNum(tot)+'</b> يوماً</span>'
    +'<span class="fr"><i class="dot w"></i>دوام: <b>'+arNum(w)+'</b></span>'
    +'<span class="fr"><i class="dot r"></i>إجازة: <b>'+arNum(r)+'</b></span>'
    +'<span class="fr"><i class="dot l"></i>رخص: <b>'+arNum(l)+'</b></span>';
}

/* ===== توست ===== */
let toastT;
function toast(msg){toastEl.textContent=msg;toastEl.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>toastEl.classList.remove('show'),3600);}