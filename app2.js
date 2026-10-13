'use strict';
/* ===== إصلاح: دالة يوم الأسبوع للرقم التسلسلي ===== */
function dowOf(s){return new Date(s*864e5).getUTCDay();}

/* ===== نسخة مصححة من شريط اليوم ===== */
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

/* ===== موعد التذكير القادم ===== */
function nextDuaInfo(){
  if(!state)return null;
  const ts=todaySerial();
  for(let k=0;k<30;k++){
    const s=ts+k,dt=fromSerial(s);
    if(!isDuaDay(s))continue;
    const target=new Date(dt.y,dt.m,dt.d,16,30,0);
    if(target.getTime()<=Date.now())continue;
    const mins=Math.max(1,Math.round((target-Date.now())/60000));
    const when=(k===0?'اليوم':k===1?'غداً':DOW_FULL[dowOf(s)])+' '+arNum(dt.d)+' '+MONTH_AR[dt.m];
    return{when,mins};
  }
  return null;
}
function durPhrase(mins){
  if(mins<60)return'بعد '+arNum(mins)+' دقيقة';
  const h=Math.floor(mins/60),m=mins%60;
  return'بعد '+arNum(h)+' ساعة'+(m?' و'+arNum(m)+' دقيقة':'');
}
function renderDuaBar(){
  const sup=('Notification' in window)?Notification.permission:'unsupported';
  let st;
  if(sup==='granted')st='<span class="ok">الإشعارات مفعّلة ✓</span>';
  else if(sup==='denied')st='<span class="bad">الإشعارات مرفوضة — فعّلها من إعدادات المتصفح</span>';
  else if(sup==='unsupported')st='<span class="bad">متصفحك لا يدعم الإشعارات — سيظهر الدعاء عند فتح التطبيق</span>';
  else st='<span class="mid">الإشعارات غير مفعّلة بعد</span>';
  let acts='';
  if(sup==='default')acts+='<button class="btn small filled" data-act="enable">تفعيل الإشعارات</button>';
  if(sup==='granted')acts+='<button class="btn small" data-act="test">إشعار تجريبي</button>';
  acts+='<button class="btn small" data-act="open">فتح الدعاء</button>';
  const ts=todaySerial();
  const todayLic=isWorkDay(ts)&&licenses.has(ts);
  const nx=nextDuaInfo();
  const nxLine=!state?'حدّد أيام العمل أولاً — بعدها يُجدول تذكير التحصين ٤:٣٠ مساءً في كل ليلة عمل'
    :(nx?('التذكير القادم: '+nx.when+' الساعة ٤:٣٠ مساءً ('+durPhrase(nx.mins)+')'):'لا تذكير قادم قريباً');
  duaBarEl.innerHTML=
    '<svg class="bell" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>'
    +'<span class="st">'+st+'</span><span class="spacer"></span>'+acts
    +'<span class="next">☾ '+nxLine
    +(todayLic?' · <span style="color:var(--lic-ink)">اليوم من رخصتك — لا تذكير اليوم</span>':'')+'</span>'
    +'<details><summary>كيف أضمن وصول التذكير على هاتفي؟</summary><div>'
    +'• <b>أندرويد:</b> أبقِ التطبيق مفتوحاً في الخلفية وسيصلك الإشعار في وقته.<br>'
    +'• <b>آيفون:</b> أضف التطبيق للشاشة الرئيسية عبر Safari وافتحه من الأيقونة (iOS 16.4+).<br>'
    +'• <b>الضمان الأكبر:</b> عند فتح التطبيق بعد ٤:٣٠ مساءً في ليلة عمل يظهر الدعاء تلقائياً.<br>'
    +'• <b>أيام الرخص:</b> يُلغى تذكيرها تلقائياً وينتقل لأول ليلة عمل بعدها.'
    +'</div></details>';
}
function notifyDua(){
  if(!('Notification' in window)||Notification.permission!=='granted')return;
  try{
    const n=new Notification('حان وقت دعاء التحصين 🤲',{
      body:'ليلة عمل مباركة — اضغط لقراءة الدعاء كاملاً',
      tag:'dua-'+todaySerial(),icon:DUA_ICON
    });
    n.onclick=()=>{try{window.focus();}catch(e){} openDua(); try{n.close();}catch(e){}};
  }catch(e){}
  if(navigator.vibrate)try{navigator.vibrate([300,150,300]);}catch(e){}
}
function notifyTest(){
  if(!('Notification' in window)){toast('متصفحك لا يدعم الإشعارات');return;}
  if(Notification.permission!=='granted'){toast('فعّل الإشعارات أولاً');return;}
  try{
    const n=new Notification('تجربة إشعار — تقويم أيام العمل',{body:'هكذا سيصلك تذكير الدعاء كل ليلة عمل ٤:٣٠ مساءً',icon:DUA_ICON});
    n.onclick=()=>{try{window.focus();}catch(e){} try{n.close();}catch(e){}};
    toast('أُرسل إشعار تجريبي');
  }catch(e){toast('تعذر الإظهار — أبقِ التطبيق مفتوحاً');}
}
function buildDuaBody(){duaBody.innerHTML=DUA_PARAS.map(p=>'<p>'+p+'</p>').join('');}
function openDua(){
  const T=todayParts(),s=todaySerial();
  duaSub.textContent=(isDuaDay(s)&&pastDuaTime()?'ليلة عمل — ':'')
    +DOW_FULL[dowOf(s)]+' '+arNum(T.d)+' '+MONTH_AR[T.m]+' '+arNum(T.y);
  duaOverlay.hidden=false;
  document.body.style.overflow='hidden';
  updateDuaBtn();
}
function closeDua(){
  duaOverlay.hidden=true;
  document.body.style.overflow='';
  try{speechSynthesis.cancel();}catch(e){}
  updateDuaBtn();renderDuaBar();
}
function updateDuaBtn(){
  const s=todaySerial();
  duaBtn.classList.toggle('unread',isDuaDay(s)&&pastDuaTime()&&lnum(K_READ)!==s);
}
function speakDua(){
  try{
    if(!('speechSynthesis' in window)){toast('متصفحك لا يدعم القراءة الصوتية');return;}
    if(speechSynthesis.speaking||speechSynthesis.pending){speechSynthesis.cancel();toast('تم إيقاف القراءة');return;}
    const u=new SpeechSynthesisUtterance(DUA_TEXT);
    const vs=speechSynthesis.getVoices(),ar=vs.find(v=>v.lang&&v.lang.toLowerCase().indexOf('ar')===0);
    if(ar)u.voice=ar;
    u.lang='ar-SA';u.rate=.85;u.pitch=1;
    speechSynthesis.cancel();speechSynthesis.speak(u);
    toast('جارٍ القراءة — اضغط مجدداً للإيقاف');
  }catch(e){toast('تعذرت القراءة الصوتية');}
}
function duaDone(){
  lset(K_READ,todaySerial());
  closeDua();
  toast('تقبّل الله طاعتك — تم تسجيل قراءة الدعاء لهذه الليلة');
}
function checkDuaHard(){
  renderDuaBar();
  const s=todaySerial();
  if(!isDuaDay(s)||!pastDuaTime())return;
  if(lnum(K_NOTIFIED)===s)return;
  lset(K_NOTIFIED,s);
  notifyDua();
  openDua();
}
function duaCatchUp(){
  const s=todaySerial();
  if(!isDuaDay(s)||!pastDuaTime())return;
  if(lnum(K_NOTIFIED)===s&&lnum(K_READ)!==s)openDua();
}

/* ===== الأحداث ===== */
editBtn.addEventListener('click',()=>editing?stopEdit():startEdit());
cancelBtn.addEventListener('click',stopEdit);
resetBtn.addEventListener('click',()=>{
  state=null;save();stopEdit();startEdit();
  toast('مُسح الجدول — اختر ٣ أيام عمل من جديد');
});
licBtn.addEventListener('click',()=>licEdit?stopLicEdit():startLicEdit());
cancelLicBtn.addEventListener('click',stopLicEdit);
saveLicBtn.addEventListener('click',commitLic);
clearLicBtn.addEventListener('click',()=>{licPicked.clear();updateLicCount();renderMonths(false);renderSummary();});

monthsEl.addEventListener('click',e=>{
  const b=e.target.closest('.cell');
  if(!b||b.classList.contains('empty'))return;
  const s=+b.dataset.s;
  if(licEdit){
    licPicked.has(s)?licPicked.delete(s):licPicked.add(s);
    updateLicCount();
    renderMonths(false);renderSummary();
    return;
  }
  if(!editing)return;
  const i=picked.indexOf(s);
  if(i>-1)picked.splice(i,1);else picked.push(s);
  updatePcount();
  if(picked.length===3)finishPick();
  else renderMonths(false);
});

duaBtn.addEventListener('click',openDua);
duaX.addEventListener('click',closeDua);
duaDoneBtn.addEventListener('click',duaDone);
duaSpeak.addEventListener('click',speakDua);
duaOverlay.addEventListener('click',e=>{if(e.target===duaOverlay)closeDua();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!duaOverlay.hidden)closeDua();});
duaBarEl.addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');if(!b)return;
  const a=b.dataset.act;
  if(a==='enable'){
    if(!('Notification' in window)){toast('متصفحك لا يدعم الإشعارات');return;}
    Notification.requestPermission().then(()=>{
      renderDuaBar();
      if(Notification.permission==='granted'){toast('تم تفعيل الإشعارات');notifyTest();}
    });
  }
  if(a==='test')notifyTest();
  if(a==='open')openDua();
});

function renderAll(wave){
  renderMonths(wave);renderSummary();renderToday();renderFoot();renderDuaBar();updateDuaBtn();
  if(wave)setTimeout(()=>{
    document.querySelectorAll('#months .cell').forEach(c=>c.style.transitionDelay='');
    monthsEl.classList.remove('wave');
  },1100);
}

/* ===== التشغيل ===== */
buildDuaBody();
renderAll(false);
if(!state){startEdit();toast('مرحباً! اضغط على ٣ أيام عمل متتالية لتحديد جدولك');}
duaCatchUp();
setTimeout(checkDuaHard,600);
setInterval(checkDuaHard,20000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){duaCatchUp();renderDuaBar();}});
let lastKey=(()=>{const T=todayParts();return T.y+'-'+T.m+'-'+T.d;})();
setInterval(()=>{
  const T=todayParts(),k=T.y+'-'+T.m+'-'+T.d;
  if(k!==lastKey){lastKey=k;renderAll(false);}
},30000);