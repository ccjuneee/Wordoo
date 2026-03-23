/* ══ Wordoo ══ */

const state = {
  words:     JSON.parse(localStorage.getItem('wd_words')    || '[]'),
  wrong:     JSON.parse(localStorage.getItem('wd_wrong')    || '[]'),
  history:   JSON.parse(localStorage.getItem('wd_history')  || '[]'),
  streak:    parseInt(localStorage.getItem('wd_streak')     || '0'),
  lastDate:  localStorage.getItem('wd_lastDate')            || '',
  dailyGoal: parseInt(localStorage.getItem('wd_dailyGoal')  || '5'),
  todayDone: parseInt(localStorage.getItem('wd_todayDone')  || '0'),
  lang:      localStorage.getItem('wd_lang') || 'zh',
  quiz: { questions:[], current:0, score:0, answers:[], answered:false }
};

function save() {
  localStorage.setItem('wd_words',     JSON.stringify(state.words));
  localStorage.setItem('wd_wrong',     JSON.stringify(state.wrong));
  localStorage.setItem('wd_history',   JSON.stringify(state.history));
  localStorage.setItem('wd_streak',    state.streak);
  localStorage.setItem('wd_lastDate',  state.lastDate);
  localStorage.setItem('wd_dailyGoal', state.dailyGoal);
  localStorage.setItem('wd_todayDone', state.todayDone);
  localStorage.setItem('wd_lang',      state.lang);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length-1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

/* i18n */
const T = {
  zh: {
    start:'开始测验', wordbook:'单词本', wrongbook:'错题本', profile_title:'我的',
    streak_unit:'天连续', today:'今日', total:'单词总数', mastered:'已掌握', wrong:'错题',
    streak_lbl:'连续天数', sessions:'测验次数', accuracy:'正确率',
    fill:'填空题', choice:'选择题', guess:'猜单词',
    correct:'✓ 正确！', wrong_ans:'✗ 答错了', correct_ans:'正确答案：',
    next:'下一题 →', result_btn:'查看结果 🎉', home_btn:'回首页', again_btn:'再来一次',
    add:'添加单词', word_label:'单词', confirm:'添加单词',
    meaning_label:'释义（自动填入）', example_label:'例句（可选）',
    spell:'请拼写：', listen:'听发音写单词', hint:'🔊 听发音',
    submit:'确认', guess_q:'看释义猜单词：',
    history:'历史记录', daily:'每日目标', per_day:'每天做', qunit:'题',
    great:'太棒了！', good:'继续努力！', keep:'多加练习！',
    min2:'至少需要2个单词', no_ans:'请输入答案', deleted:'已删除',
    added:'✓ 已添加', exists:'单词已存在', enter_word:'请输入单词',
    cleared:'错题本已清空', lookup:'🔍 查询中…', lookup_ok:'✓ 自动填入完成',
    lookup_fail:'查询失败', not_found:'未找到，请手动填写',
    no_words:'还没有单词', add_hint:'点右上角 + 开始添加',
    no_wrong:'暂无错题', keep_it:'继续保持！', no_history:'完成测验后这里会出现记录',
    no_def:'暂无释义',
  },
  en: {
    start:'Start Quiz', wordbook:'Words', wrongbook:'Mistakes', profile_title:'Me',
    streak_unit:'d streak', today:'Today', total:'Total', mastered:'Mastered', wrong:'Wrong',
    streak_lbl:'Streak', sessions:'Sessions', accuracy:'Accuracy',
    fill:'Fill in', choice:'Multiple choice', guess:'Guess word',
    correct:'✓ Correct!', wrong_ans:'✗ Wrong', correct_ans:'Answer: ',
    next:'Next →', result_btn:'See Results 🎉', home_btn:'Home', again_btn:'Again',
    add:'Add Word', word_label:'Word', confirm:'Add Word',
    meaning_label:'Definition (auto-filled)', example_label:'Example (optional)',
    spell:'Spell this: ', listen:'Listen and spell', hint:'🔊 Hear it',
    submit:'Submit', guess_q:'Guess the word: ',
    history:'History', daily:'Daily Goal', per_day:'Do', qunit:'questions',
    great:'Excellent!', good:'Keep going!', keep:'Practice more!',
    min2:'Need at least 2 words', no_ans:'Please enter an answer', deleted:'Deleted',
    added:'✓ Added', exists:'Word already exists', enter_word:'Please enter a word',
    cleared:'Mistakes cleared', lookup:'🔍 Looking up…', lookup_ok:'✓ Definition found',
    lookup_fail:'Lookup failed', not_found:'Not found, fill manually',
    no_words:'No words yet', add_hint:'Tap + to add your first word',
    no_wrong:'No mistakes!', keep_it:'Keep it up!', no_history:'Complete a quiz to see history',
    no_def:'No definition',
  }
};
const t = k => (T[state.lang]||T.zh)[k] || k;

function applyLang() {
  document.querySelectorAll('[data-i18n]').forEach(el => { el.innerHTML = t(el.dataset.i18n); });
  const ht = document.getElementById('hero-title');
  if (ht) ht.innerHTML = state.lang==='zh' ? '今天学<br>几个词？' : 'Learn<br>some words?';
  const lb = document.getElementById('btn-lang');
  if (lb) lb.textContent = state.lang==='zh' ? 'EN' : '中';
}

function speak(word) {
  const obj = state.words.find(w => w.en.toLowerCase()===word.toLowerCase());
  if (obj && obj.audioUrl) { new Audio(obj.audioUrl).play().catch(()=>fbSpeak(word)); }
  else fbSpeak(word);
}
function fbSpeak(word) {
  if (!window.speechSynthesis) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(word);
  u.lang='en-US'; u.rate=0.9;
  const v = speechSynthesis.getVoices().find(v=>v.name.includes('Samantha')||v.name.includes('Daniel')||(v.lang==='en-US'&&v.localService));
  if (v) u.voice=v;
  speechSynthesis.speak(u);
}
function markMastered(en) { const w=state.words.find(x=>x.en===en); if(w){w.mastered=true;save();} }
function addToWrong(word) {
  const ex=state.wrong.find(w=>w.en===word.en);
  if(ex) ex.count=(ex.count||1)+1; else state.wrong.push({...word,count:1}); save();
}

window.onload = function() {

  /* ── SPLASH ── */
  const splash = document.getElementById('screen-splash');
  let splashGone = false;
  function exitSplash() {
    if (splashGone) return;
    splashGone = true;
    splash.style.pointerEvents = 'none';
    splash.style.transition = 'opacity .45s ease';
    splash.style.opacity = '0';
    setTimeout(function() {
      splash.style.display = 'none';
      splash.style.zIndex = '-1';  // belt and suspenders
    }, 480);
  }
  splash.onclick = exitSplash;
  // Also auto-exit after 5s
  setTimeout(exitSplash, 5000);
  // Safety net: if something went wrong, force remove after 6s
  setTimeout(function() {
    splash.style.display = 'none';
    splash.style.pointerEvents = 'none';
    splash.style.zIndex = '-1';
  }, 6100);

  /* ── THEME ── */
  const html = document.documentElement;
  html.dataset.theme = localStorage.getItem('wd_theme') || 'dark';
  const themeBtn = document.getElementById('btn-theme');
  function syncTheme() { themeBtn.textContent = html.dataset.theme==='dark' ? '☀' : '🌙'; }
  syncTheme();
  themeBtn.onclick = function() {
    html.dataset.theme = html.dataset.theme==='dark' ? 'light' : 'dark';
    localStorage.setItem('wd_theme', html.dataset.theme); syncTheme();
  };

  /* ── LANG ── */
  document.getElementById('btn-lang').onclick = function() {
    state.lang = state.lang==='zh' ? 'en' : 'zh'; save(); applyLang();
  };
  applyLang();

  /* ── SCREENS ── */
  const screens = {};
  document.querySelectorAll('.screen').forEach(s => { screens[s.id.replace('screen-','')] = s; });
  let cur = 'home';

  function goTo(name) {
    if (!screens[name] || cur===name) return;
    screens[cur].classList.remove('active');
    screens[name].classList.add('active');
    cur = name;
  }
  document.querySelectorAll('[data-back]').forEach(b => {
    b.onclick = function() { goTo(b.dataset.back); };
  });

  /* ── QUIT QUIZ — already handled by data-back="home" ── */

  /* ── TOAST ── */
  const toastEl = document.getElementById('toast');
  let tt;
  function toast(msg) {
    toastEl.textContent=msg; toastEl.classList.add('show');
    clearTimeout(tt); tt=setTimeout(()=>toastEl.classList.remove('show'),2200);
  }

  /* ── HOME UI ── */
  function updateHomeUI() {
    const today = new Date().toDateString();
    if (!state.lastDate.startsWith(today)) {
      const yday = new Date(Date.now()-86400000).toDateString();
      if (state.lastDate!==yday && state.lastDate!=='') state.streak=0;
      state.todayDone=0; state.lastDate=today; save();
    }
    document.getElementById('streak-count').textContent  = state.streak;
    document.getElementById('stat-total').textContent    = state.words.length;
    document.getElementById('stat-mastered').textContent = state.words.filter(w=>w.mastered).length;
    document.getElementById('stat-wrong').textContent    = state.wrong.length;
    document.getElementById('ring-text').textContent     = state.todayDone+'/'+state.dailyGoal;
  }

  document.getElementById('btn-desk').onclick = function(){ renderDesk(); goTo('desk'); };

  var wbBtn = document.getElementById('btn-wordbook');
  if (!wbBtn) { console.error('btn-wordbook NOT FOUND'); }
  else {
    wbBtn.addEventListener('click', function(e) {
      renderWordList(); goTo('wordbook');
    });
  }
  document.getElementById('btn-wrongbook').onclick = function(){ renderWrongList(); goTo('wrongbook'); };
  document.getElementById('btn-profile').onclick   = function(){ renderProfile(); goTo('profile'); };
  document.getElementById('btn-start-quiz').onclick = startQuiz;

  /* ── WORD LIST ── */
  document.getElementById('search-input').oninput = renderWordList;

  function renderWordList() {
    const q    = document.getElementById('search-input').value.toLowerCase();
    const list = state.words.filter(w=>w.en.toLowerCase().includes(q)||(w.zh||'').includes(q));
    const box  = document.getElementById('word-list');
    const emp  = document.getElementById('empty-words');
    box.innerHTML='';
    if (!list.length) {
      emp.removeAttribute('hidden');
      emp.querySelector('.empty-sub').textContent = q?(state.lang==='zh'?'没有匹配的单词':'No matches'):t('add_hint');
    } else {
      emp.setAttribute('hidden','');
      list.forEach((w,i)=>{
        const c=document.createElement('div');
        c.className='word-card'+(w.mastered?' mastered':'');
        c.style.animationDelay=(i*.05)+'s';
        c.innerHTML=`<div class="word-main">
          <div class="word-en">${w.en}</div>
          <div class="word-zh">${w.zh||'<span style="color:var(--text3)">'+t('no_def')+'</span>'}</div>
          ${w.example?`<div class="word-ex">${w.example}</div>`:''}
        </div>
        <div class="word-actions">
          ${w.mastered?'<span class="mastered-tag">✓</span>':''}
          <button class="word-btn" onclick="speak('${w.en.replace(/'/g,"\\'")}')">🔊</button>
          <button class="word-btn" style="color:var(--bad)" onclick="delWord('${w.en.replace(/'/g,"\\'")}')">🗑</button>
        </div>`;
        box.appendChild(c);
      });
    }
  }
  window.delWord = function(en){
    state.words=state.words.filter(w=>w.en!==en); save(); renderWordList(); updateHomeUI(); toast(t('deleted')+' '+en);
  };

  /* ── ADD WORD ── */
  const modal = document.getElementById('modal-add');
  const iWord = document.getElementById('input-word');
  const iMean = document.getElementById('input-meaning');
  const iEx   = document.getElementById('input-example');
  const lstat = document.getElementById('lookup-status');

  document.getElementById('btn-add-word').onclick = function(){
    iWord.value=''; iMean.value=''; iEx.value='';
    delete iWord.dataset.audio; lstat.textContent=''; lstat.style.color='';
    modal.removeAttribute('hidden'); setTimeout(()=>iWord.focus(),150);
  };
  document.getElementById('modal-close').onclick = function(){ modal.setAttribute('hidden',''); };
  modal.onclick = function(e){ if(e.target===modal) modal.setAttribute('hidden',''); };
  document.getElementById('confirm-add-word').onclick = addWord;
  iWord.onblur = function(){ autoLookup(iWord.value.trim()); };
  iWord.onkeydown = function(e){ if(e.key==='Enter'){autoLookup(iWord.value.trim()); iMean.focus();} };

  async function autoLookup(word){
    if(!word||iMean.value.trim()) return;
    lstat.textContent=t('lookup'); lstat.style.color='var(--text2)';
    document.getElementById('confirm-add-word').disabled=true;
    try{
      const r=await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/'+encodeURIComponent(word));
      const d=await r.json();
      if(!Array.isArray(d)||!d[0]){ lstat.textContent=t('not_found'); lstat.style.color='var(--bad)'; document.getElementById('confirm-add-word').disabled=false; return; }
      const def=d[0].meanings?.[0]?.definitions?.[0];
      if(def?.definition&&!iMean.value.trim()) iMean.value=def.definition;
      if(def?.example&&!iEx.value.trim()) iEx.value=def.example;
      const ph=d[0].phonetics?.find(p=>p.audio?.startsWith('http'));
      if(ph) iWord.dataset.audio=ph.audio;
      lstat.textContent=t('lookup_ok'); lstat.style.color='var(--good)';
    }catch{ lstat.textContent=t('lookup_fail'); lstat.style.color='var(--bad)'; }
    document.getElementById('confirm-add-word').disabled=false;
  }

  async function addWord(){
    const en=iWord.value.trim();
    if(!en){toast(t('enter_word'));return;}
    if(state.words.find(w=>w.en.toLowerCase()===en.toLowerCase())){toast(t('exists'));return;}
    if(!iMean.value.trim()&&!iWord.dataset.audio) await autoLookup(en);
    state.words.push({en, zh:iMean.value.trim()||'', example:iEx.value.trim()||'', audioUrl:iWord.dataset.audio||'', mastered:false, addedAt:Date.now()});
    delete iWord.dataset.audio;
    save(); modal.setAttribute('hidden',''); renderWordList(); updateHomeUI(); toast(t('added')+' '+en);
  }

  /* ── WRONG BOOK ── */
  function renderWrongList(){
    const box=document.getElementById('wrong-list'), emp=document.getElementById('empty-wrong');
    box.innerHTML='';
    if(!state.wrong.length){ emp.removeAttribute('hidden'); return; }
    emp.setAttribute('hidden','');
    state.wrong.forEach((w,i)=>{
      const c=document.createElement('div'); c.className='word-card'; c.style.animationDelay=(i*.05)+'s';
      c.innerHTML=`<div class="word-main"><div class="word-en">${w.en}</div><div class="word-zh">${w.zh||''}</div>
        <div class="word-ex" style="color:var(--bad)">${state.lang==='zh'?'错误':'Wrong'} ${w.count||1}×</div></div>
        <div class="word-actions"><button class="word-btn" onclick="speak('${w.en.replace(/'/g,"\\'")}')">🔊</button></div>`;
      box.appendChild(c);
    });
  }
  document.getElementById('btn-clear-wrong').onclick = function(){
    if(!state.wrong.length) return;
    state.wrong=[]; save(); renderWrongList(); updateHomeUI(); toast(t('cleared'));
  };

  /* ── PROFILE ── */
  function renderProfile(){
    document.getElementById('p-streak').textContent   = state.streak;
    document.getElementById('p-sessions').textContent = state.history.length;
    const acc=state.history.length?Math.round(state.history.reduce((s,h)=>s+(h.score/h.total),0)/state.history.length*100)+'%':'—';
    document.getElementById('p-accuracy').textContent = acc;
    document.getElementById('goal-display').textContent = state.dailyGoal;
    const list=document.getElementById('history-list'), emp=document.getElementById('empty-history');
    list.innerHTML='';
    const recent=[...state.history].reverse().slice(0,8);
    if(!recent.length){ emp.removeAttribute('hidden'); return; }
    emp.setAttribute('hidden','');
    recent.forEach(h=>{
      const r=document.createElement('div'); r.className='history-row';
      r.innerHTML=`<span class="history-date">${h.date} · ${h.total}${t('qunit')}</span><span class="history-score">${h.score}/${h.total}</span>`;
      list.appendChild(r);
    });
  }
  document.getElementById('goal-minus').onclick = function(){ state.dailyGoal=Math.max(1,state.dailyGoal-1); document.getElementById('goal-display').textContent=state.dailyGoal; save(); updateHomeUI(); };
  document.getElementById('goal-plus').onclick  = function(){ state.dailyGoal=Math.min(50,state.dailyGoal+1); document.getElementById('goal-display').textContent=state.dailyGoal; save(); updateHomeUI(); };

  /* ══ QUIZ ══ */
  const TYPES=['fill','choice','guess'];

  function startQuiz(){
    if(state.words.length<2){toast(t('min2'));return;}
    const ws=new Set(state.wrong.map(w=>w.en));
    const pool=shuffle([...state.words.filter(w=>ws.has(w.en)),...state.words.filter(w=>!ws.has(w.en))]).slice(0,state.dailyGoal);
    state.quiz={questions:pool.map((w,i)=>({word:w,type:w.zh?TYPES[i%TYPES.length]:'fill'})),current:0,score:0,answers:[],answered:false};
    goTo('quiz'); renderQ();
  }

  function renderQ(){
    const {questions,current}=state.quiz, q=questions[current];
    document.getElementById('quiz-prog-fill').style.width=(current/questions.length*100)+'%';
    document.getElementById('quiz-prog-text').textContent=(current+1)+'/'+questions.length;
    document.getElementById('quiz-score-badge').textContent=state.quiz.score+(state.lang==='zh'?'分':'pts');
    const body=document.getElementById('quiz-body');
    body.innerHTML=''; state.quiz.answered=false;

    if(q.type==='fill'){
      const hasZh=!!q.word.zh;
      body.innerHTML=`<span class="type-badge">${t('fill')}</span>
        <div class="quiz-q">${hasZh?t('spell')+`<span class="quiz-highlight">${q.word.zh}</span>`:t('listen')}</div>
        ${q.word.example?`<div style="font-size:13px;color:var(--text3);font-style:italic">${q.word.example}</div>`:''}
        <input class="quiz-input" id="fill-input" type="text" placeholder="${state.lang==='zh'?'输入英文单词…':'Type the word…'}" autocomplete="off" autocorrect="off" spellcheck="false">
        <div id="feedback-area"></div>
        <div class="quiz-actions">
          <button class="btn-primary" id="submit-btn">${t('submit')}</button>
          <button class="btn-secondary" id="hint-btn">${t('hint')}</button>
        </div>`;
      if(!hasZh) setTimeout(()=>speak(q.word.en),400);
      const fi=document.getElementById('fill-input');
      setTimeout(()=>fi.focus(),100);
      document.getElementById('submit-btn').onclick=function(){if(!state.quiz.answered)doFill(q,fi.value.trim(),'fill-input');};
      fi.onkeydown=function(e){if(e.key==='Enter'&&!state.quiz.answered)doFill(q,fi.value.trim(),'fill-input');};
      document.getElementById('hint-btn').onclick=function(){speak(q.word.en);};

    } else if(q.type==='choice'){
      const opts=shuffle([q.word.zh||q.word.en,...shuffle(state.words.filter(w=>w.en!==q.word.en).map(w=>w.zh||w.en)).slice(0,3)]);
      body.innerHTML=`<span class="type-badge">${t('choice')}</span>
        <div class="quiz-q"><span class="quiz-highlight">${q.word.en}</span>${state.lang==='zh'?' 的意思是？':' means?'}</div>
        <div class="choices">${opts.map((o,i)=>`<button class="choice-btn" data-opt="${o}"><span class="letter">${'ABCD'[i]}</span>${o}</button>`).join('')}</div>
        <div id="feedback-area"></div>
        <div id="next-actions" class="quiz-actions" style="display:none"></div>`;
      document.querySelectorAll('.choice-btn').forEach(b=>{
        b.onclick=function(){if(!state.quiz.answered)doChoice(q,b.dataset.opt,q.word.zh||q.word.en,b);};
      });

    } else {
      body.innerHTML=`<span class="type-badge">${t('guess')}</span>
        <div class="quiz-q">${t('guess_q')}<br><span class="quiz-highlight">${q.word.zh||'?'}</span></div>
        ${q.word.example?`<div style="font-size:13px;color:var(--text3);font-style:italic">${q.word.example}</div>`:''}
        <div style="display:flex;gap:8px;align-items:center">
          <input class="quiz-input" id="guess-input" type="text" placeholder="${state.lang==='zh'?'输入英文…':'Type English…'}" autocomplete="off" autocorrect="off" spellcheck="false" style="flex:1">
          <button id="guess-speak" style="width:44px;height:44px;background:var(--surface2);border:1px solid var(--border);border-radius:50%;font-size:18px;cursor:pointer;flex-shrink:0">🔊</button>
        </div>
        <div id="feedback-area"></div>
        <div class="quiz-actions"><button class="btn-primary" id="submit-btn">${t('submit')}</button></div>`;
      const gi=document.getElementById('guess-input');
      setTimeout(()=>gi.focus(),100);
      document.getElementById('guess-speak').onclick=function(){speak(q.word.en);};
      document.getElementById('submit-btn').onclick=function(){if(!state.quiz.answered)doFill(q,gi.value.trim(),'guess-input');};
      gi.onkeydown=function(e){if(e.key==='Enter'&&!state.quiz.answered)doFill(q,gi.value.trim(),'guess-input');};
    }
  }

  async function doFill(q,ans,id){
    if(!ans){toast(t('no_ans'));return;}
    state.quiz.answered=true;
    const ok=ans.trim().toLowerCase()===q.word.en.toLowerCase();
    document.getElementById(id)?.classList.add(ok?'ok':'err');
    await showFB(q,ok,ans); rec(q,ok,ans); replNext();
  }
  async function doChoice(q,chosen,correct,btn){
    state.quiz.answered=true;
    const ok=chosen===correct;
    document.querySelectorAll('.choice-btn').forEach(b=>{
      b.disabled=true;
      if(b.dataset.opt===correct) b.classList.add('ok');
      else if(b===btn&&!ok) b.classList.add('err');
    });
    await showFB(q,ok,chosen); rec(q,ok,chosen);
    const na=document.getElementById('next-actions');
    if(na){ na.style.display='flex'; na.innerHTML=`<button class="btn-primary" id="next-btn">${isLast()?t('result_btn'):t('next')}</button>`; document.getElementById('next-btn').onclick=nextQ; }
  }
  function rec(q,ok,ans){
    if(ok){state.quiz.score++;markMastered(q.word.en);}else addToWrong(q.word);
    state.quiz.answers.push({word:q.word.en,correct:ok,userAns:ans});
    document.getElementById('quiz-score-badge').textContent=state.quiz.score+(state.lang==='zh'?'分':'pts');
  }
  function replNext(){
    const a=document.querySelector('.quiz-actions');
    if(a){a.innerHTML=`<button class="btn-primary" id="next-btn">${isLast()?t('result_btn'):t('next')}</button>`;document.getElementById('next-btn').onclick=nextQ;}
  }
  async function showFB(q,ok,ans){
    const area=document.getElementById('feedback-area'); if(!area)return;
    area.innerHTML=`<div class="feedback ${ok?'ok':'err'}">
      <div class="feedback-title ${ok?'ok':'err'}">${ok?t('correct'):t('wrong_ans')}</div>
      ${!ok?`<div style="font-size:14px;margin-bottom:6px;color:var(--text2)">${t('correct_ans')}<strong style="color:var(--text)">${q.word.en}</strong></div>`:''}
      <div class="feedback-text"><span class="dots"><span></span><span></span><span></span></span></div>
    </div>`;
    area.scrollIntoView({behavior:'smooth',block:'nearest'});
    try{
      const r=await fetch('http://localhost:3000/explain',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({word:q.word.en,meaning:q.word.zh||'',correct:ok,userAns:ans})});
      const d=await r.json();
      area.querySelector('.feedback-text').textContent=d.explain||'';
    }catch{
      area.querySelector('.feedback-text').textContent=ok?`${q.word.en}: ${q.word.zh||''}`:`Answer: ${q.word.en}`;
    }
  }
  function isLast(){ return state.quiz.current===state.quiz.questions.length-1; }
  function nextQ(){ if(isLast())finishQuiz(); else{state.quiz.current++;renderQ();} }

  function finishQuiz(){
    state.todayDone+=state.quiz.questions.length;
    const today=new Date().toDateString();
    if(state.todayDone>=state.dailyGoal&&!state.lastDate.includes('_done')){state.streak++;state.lastDate=today+'_done';}
    state.history.push({date:new Date().toLocaleDateString(state.lang==='zh'?'zh-CN':'en-CA'),score:state.quiz.score,total:state.quiz.questions.length});
    save(); updateHomeUI();
    const {score,questions,answers}=state.quiz, total=questions.length, pct=Math.round(score/total*100);
    document.getElementById('result-body').innerHTML=`
      <div class="result-emoji">${pct>=80?'🏆':pct>=60?'👍':'📖'}</div>
      <div class="result-title">${pct>=80?t('great'):pct>=60?t('good'):t('keep')}</div>
      <div class="result-score">${score}<span style="font-size:28px;background:none;-webkit-text-fill-color:var(--text2)"> / ${total}</span></div>
      <div class="result-sub">${t('accuracy')} ${pct}%</div>
      <div class="result-list">${answers.map(a=>`<div class="result-row"><span class="result-word">${a.word}</span><span class="result-badge ${a.correct?'ok':'err'}">${a.correct?'✓':'✗'}</span></div>`).join('')}</div>
      <div class="result-btns">
        <button class="btn-secondary" id="res-home">${t('home_btn')}</button>
        <button class="btn-primary" id="res-again">${t('again_btn')}</button>
      </div>`;
    goTo('result');
    document.getElementById('res-home').onclick=function(){goTo('home');};
    document.getElementById('res-again').onclick=function(){startQuiz();};
  }

  updateHomeUI();

  /* ══ DESK ══ */
  var deskBalls = JSON.parse(localStorage.getItem('wd_desk') || '[]');
  var deskTrashCount = parseInt(localStorage.getItem('wd_trash') || '0');
  var activeBall = null;
  var COLORS = ['col0','col1','col2','col3','col4','col5'];

  function saveDesk() {
    localStorage.setItem('wd_desk', JSON.stringify(deskBalls));
    localStorage.setItem('wd_trash', String(deskTrashCount));
  }

  function syncDesk() {
    // add new wrong words not yet in desk
    state.wrong.forEach(function(w) {
      var found = deskBalls.find(function(b){ return b.en === w.en; });
      if (!found) {
        deskBalls.push({
          en: w.en, zh: w.zh||'', example: w.example||'',
          count: w.count||1,
          col: Math.floor(Math.random() * 6)
        });
      } else {
        found.count = w.count || found.count;
      }
    });
    // remove from desk if no longer in wrong list
    deskBalls = deskBalls.filter(function(b){
      return state.wrong.find(function(w){ return w.en === b.en; });
    });
    saveDesk();
  }

  function renderDesk() {
    syncDesk();
    var surface = document.getElementById('desk-surface');
    var isEn    = state.lang === 'en';

    document.getElementById('desk-title').textContent      = isEn ? 'My Desk'    : '我的桌面';
    document.getElementById('desk-empty-text').textContent = isEn ? 'Desk is clean!' : '桌面干净！';
    document.getElementById('desk-empty-sub').textContent  = isEn ? 'Wrong answers appear here' : '答错的单词会出现在这里';
    document.getElementById('trash-count').textContent     = '🗑 ' + deskTrashCount;

    surface.querySelectorAll('.word-block').forEach(function(b){ b.remove(); });
    var empty = document.getElementById('desk-empty');

    if (!deskBalls.length) {
      empty.classList.remove('hidden');
      return;
    }
    empty.classList.add('hidden');

    // sort: newest at bottom (keep insertion order)
    deskBalls.forEach(function(ball, i) {
      var el  = document.createElement('div');
      var cnt = ball.count || 1;
      var cntCls = cnt >= 3 ? 'cnt3' : cnt === 2 ? 'cnt2' : 'cnt1';

      el.className = 'word-block ' + COLORS[ball.col % 6] + ' ' + cntCls;
      el.style.animationDelay = (i * 0.07) + 's';

      // width: base 120px + 8px per letter, capped at surface width - 40px
      var W = surface.clientWidth || 340;
      var blockW = Math.min(120 + ball.en.length * 8, W - 40);
      el.style.width = blockW + 'px';

      // bar fill = word length proportion (max 20 chars = 100%)
      var barPct = Math.min(ball.en.length / 18, 1) * 100;

      el.innerHTML =
        '<div class="wb-letter">' + ball.en[0].toUpperCase() + '</div>' +
        '<div class="wb-bar"><div class="wb-bar-fill" style="width:' + barPct + '%"></div></div>' +
        (cnt > 1 ? '<div class="wb-count">✗' + cnt + '</div>' : '');

      el.onclick = function(){ openDeskQuiz(ball, el); };
      surface.appendChild(el);
    });
  }

  function openDeskQuiz(ball, el) {
    activeBall = {ball: ball, el: el};
    var isEn = state.lang === 'en';
    document.getElementById('dq-prompt').textContent   = isEn ? 'Write the English word' : '看释义写英文单词';
    document.getElementById('dq-meaning').textContent  = ball.zh || (isEn ? '(no definition)' : '（无释义）');
    document.getElementById('dq-example').textContent  = ball.example ? '"' + ball.example + '"' : '';
    document.getElementById('dq-input').value          = '';
    document.getElementById('dq-feedback').textContent = '';
    document.getElementById('dq-feedback').className   = 'dq-feedback';
    document.getElementById('dq-btn-text').textContent = isEn ? 'Submit' : '确认';
    document.getElementById('dq-title').textContent    = isEn ? 'Review' : '复习';
    document.getElementById('modal-desk-quiz').removeAttribute('hidden');
    setTimeout(function(){ document.getElementById('dq-input').focus(); }, 150);
  }

  document.getElementById('dq-close').onclick = function(){
    document.getElementById('modal-desk-quiz').setAttribute('hidden','');
    activeBall = null;
  };
  document.getElementById('modal-desk-quiz').onclick = function(e){
    if (e.target === document.getElementById('modal-desk-quiz')){
      document.getElementById('modal-desk-quiz').setAttribute('hidden','');
      activeBall = null;
    }
  };
  document.getElementById('dq-submit').onclick = submitDeskQuiz;
  document.getElementById('dq-input').onkeydown = function(e){ if(e.key==='Enter') submitDeskQuiz(); };

  function submitDeskQuiz() {
    if (!activeBall) return;
    var ans  = document.getElementById('dq-input').value.trim();
    var fb   = document.getElementById('dq-feedback');
    var isEn = state.lang === 'en';
    if (!ans) {
      fb.textContent = isEn ? 'Please type the word' : '请输入英文单词';
      fb.className = 'dq-feedback err'; return;
    }
    var correct = ans.toLowerCase() === activeBall.ball.en.toLowerCase();

    if (correct) {
      fb.textContent = (isEn ? '✓ Correct! ' : '✓ 答对了！') + activeBall.ball.en;
      fb.className = 'dq-feedback ok';
      document.getElementById('dq-submit').disabled = true;
      setTimeout(function(){
        activeBall.el.classList.add('fly-away');
        var en = activeBall.ball.en;
        // remove from desk but keep in wrong list
        // (will come back if wrong again in quiz)
        deskBalls = deskBalls.filter(function(b){ return b.en !== en; });
        // remove from wrong list too — they cleared it
        state.wrong = state.wrong.filter(function(w){ return w.en !== en; });
        deskTrashCount++;
        save(); saveDesk();
        var bin = document.getElementById('desk-bin');
        if (bin) { bin.classList.add('shake'); setTimeout(function(){ bin.classList.remove('shake'); }, 500); }
        document.getElementById('trash-count').textContent = '🗑 ' + deskTrashCount;
        setTimeout(function(){
          document.getElementById('modal-desk-quiz').setAttribute('hidden','');
          if (activeBall && activeBall.el) activeBall.el.remove();
          activeBall = null;
          document.getElementById('dq-submit').disabled = false;
          if (!deskBalls.length) document.getElementById('desk-empty').classList.remove('hidden');
          updateHomeUI();
        }, 440);
      }, 700);

    } else {
      fb.textContent = (isEn ? '✗ Answer: ' : '✗ 正确答案：') + activeBall.ball.en;
      fb.className = 'dq-feedback err';
      activeBall.el.classList.remove('shake');
      void activeBall.el.offsetWidth;
      activeBall.el.classList.add('shake');
      setTimeout(function(){ if(activeBall) activeBall.el.classList.remove('shake'); }, 350);
      activeBall.ball.count = (activeBall.ball.count||1) + 1;
      var cnt    = activeBall.ball.count;
      var cntCls = cnt >= 3 ? 'cnt3' : cnt === 2 ? 'cnt2' : 'cnt1';
      activeBall.el.className = 'word-block ' + COLORS[activeBall.ball.col % 6] + ' ' + cntCls;
      var countEl = activeBall.el.querySelector('.wb-count');
      if (countEl) countEl.textContent = '✗' + cnt;
      else {
        var d = document.createElement('div');
        d.className = 'wb-count'; d.textContent = '✗' + cnt;
        activeBall.el.appendChild(d);
      }
      var ww = state.wrong.find(function(w){ return w.en === activeBall.ball.en; });
      if (ww) ww.count = cnt;
      save(); saveDesk();
      document.getElementById('dq-input').value = '';
      setTimeout(function(){ document.getElementById('dq-input').focus(); }, 150);
    }
  }
}; // end window.onload