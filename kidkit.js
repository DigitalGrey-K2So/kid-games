/* kidkit.js: shared helpers for the Kid Games
   1. Play timer: after 13 minutes of play in one game, things get harder.
      After 20 minutes, the next mistake ends the game with a "time for a break" screen.
      A grown up can press and hold on that screen to keep playing.
   2. Spelling: a list of 1st grade words with pictures, a word bar to show progress,
      and a voice that says the word out loud. */
(function(){
  'use strict';
  var HARD_AT=13*60, BREAK_AT=20*60, FORGET_AFTER=15*60*1000;
  var game='game',isPlaying=function(){return true;},onHard=null,onBreak=null;
  var t=0,hard=false,broken=false,lastActive=0,timer=null;

  function load(){
    try{
      var s=JSON.parse(localStorage.getItem('kgTime:'+game)||'null');
      /* closing the game and coming right back keeps the clock; a real break of 15 minutes resets it */
      if(s&&Date.now()-s.seen<FORGET_AFTER){t=s.t||0;}
    }catch(e){}
    hard=t>=HARD_AT;
  }
  function save(){try{localStorage.setItem('kgTime:'+game,JSON.stringify({t:Math.round(t),seen:Date.now()}));}catch(e){}}
  function active(){lastActive=Date.now();}
  /* play time log: {"2026-11-23":{"block-buddies":312,...}} */
  var pendingLog=0;
  function today(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  function logSecond(){pendingLog++;}
  function flushLog(){
    if(!pendingLog)return;
    try{
      var log=JSON.parse(localStorage.getItem('kgLog')||'{}'),d=today();
      log[d]=log[d]||{};log[d][game]=(log[d][game]||0)+pendingLog;pendingLog=0;
      var days=Object.keys(log).sort();while(days.length>120)delete log[days.shift()];
      localStorage.setItem('kgLog',JSON.stringify(log));
    }catch(e){}
  }
  function tick(){
    if(broken||document.hidden)return;
    var playing=false;try{playing=isPlaying();}catch(e){}
    if(!playing||Date.now()-lastActive>90000)return;
    t+=1;logSecond();
    if(t%10===0){save();flushLog();}
    if(!hard&&t>=HARD_AT){hard=true;banner('Level up! Things get a little faster now.');if(onHard)try{onHard();}catch(e){}}
  }

  /* ---------- styles for the banner, break screen and word bar ---------- */
  var css=document.createElement('style');
  css.textContent=
    '#kgBanner{position:fixed;left:50%;top:14px;transform:translate(-50%,-140%);z-index:50;font-family:Fredoka,"Arial Rounded MT Bold",sans-serif;font-weight:600;font-size:20px;color:#231A5C;background:#FFE066;border:4px solid #231A5C;border-radius:18px;box-shadow:0 5px 0 #231A5C;padding:10px 18px;transition:transform .4s;pointer-events:none;max-width:92vw;text-align:center}'+
    '#kgBanner.show{transform:translate(-50%,0)}'+
    '#kgBreak{position:fixed;inset:0;z-index:60;display:grid;place-items:center;background:rgba(35,26,92,.55);touch-action:none}'+
    '#kgBreak .box{font-family:Fredoka,"Arial Rounded MT Bold",sans-serif;color:#231A5C;background:#FFFDF5;border:5px solid #231A5C;border-radius:26px;box-shadow:0 8px 0 #231A5C;padding:24px 28px;max-width:min(92vw,480px);text-align:center;display:flex;flex-direction:column;gap:14px;align-items:center}'+
    '#kgBreak h2{margin:0;font-size:34px;font-weight:700}'+
    '#kgBreak p{margin:0;font-family:Nunito,sans-serif;font-weight:800;font-size:18px}'+
    '#kgBreak .home{display:inline-flex;align-items:center;gap:10px;font-size:26px;font-weight:600;color:#231A5C;background:#7BE38F;border:4px solid #231A5C;border-radius:22px;box-shadow:0 5px 0 #231A5C;padding:12px 28px;text-decoration:none}'+
    '#kgBreak .grown{font:600 14px Fredoka,sans-serif;color:rgba(35,26,92,.6);background:transparent;border:2px dashed rgba(35,26,92,.35);border-radius:12px;padding:6px 12px;cursor:pointer;touch-action:none}'+
    '.kgWord{display:flex;align-items:center;gap:6px;padding:4px 12px;min-height:56px;font-family:Fredoka,"Arial Rounded MT Bold",sans-serif;font-weight:700}'+
    '.kgWord .pic{font-size:28px;line-height:1}'+
    '.kgWord .slot{width:30px;height:38px;border-bottom:4px solid currentColor;display:grid;place-items:center;font-size:28px;line-height:1;text-transform:uppercase}'+
    '.kgWord .slot.next{animation:kgBlink 1s infinite}'+
    '.kgWord .slot.got{color:#1E9E4A}'+
    '.kgWord.done{animation:kgPop .5s}'+
    '@keyframes kgBlink{50%{border-color:transparent}}'+
    '@keyframes kgPop{40%{transform:scale(1.15) rotate(-3deg)}}'+
    '@media (prefers-reduced-motion:reduce){#kgBanner{transition:none}.kgWord .slot.next,.kgWord.done{animation:none}}';
  document.head.appendChild(css);

  var bannerEl=null,bannerT=null;
  function banner(msg){
    if(!bannerEl){bannerEl=document.createElement('div');bannerEl.id='kgBanner';bannerEl.setAttribute('role','status');document.body.appendChild(bannerEl);}
    bannerEl.textContent=msg;bannerEl.classList.add('show');
    clearTimeout(bannerT);bannerT=setTimeout(function(){bannerEl.classList.remove('show');},3200);
  }
  function showBreak(){
    if(broken)return;broken=true;save();
    if(onBreak)try{onBreak();}catch(e){}
    var mins=Math.round(t/60);
    var d=document.createElement('div');d.id='kgBreak';
    d.innerHTML='<div class="box" role="dialog" aria-label="Time for a break">'+
      '<h2>Great playing!</h2>'+
      '<p>You played for '+mins+' minutes. Time to rest your eyes and stretch. Come back later!</p>'+
      '<a class="home" href="index.html"><svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="M3.5 11.5L12 4l8.5 7.5" fill="none" stroke="#231A5C" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 10v9.5h4.5v-5h3v5H18V10" fill="none" stroke="#231A5C" stroke-width="2.6" stroke-linejoin="round"/></svg>Home</a>'+
      '<button class="grown" type="button">Grown ups: press and hold to keep playing</button></div>';
    document.body.appendChild(d);
    var b=d.querySelector('.grown'),hold=null;
    b.addEventListener('pointerdown',function(e){e.preventDefault();b.textContent='Keep holding...';hold=setTimeout(function(){t=0;hard=false;broken=false;save();d.remove();banner('Timer reset. Have fun!');},2000);});
    ['pointerup','pointerleave','pointercancel'].forEach(function(ev){b.addEventListener(ev,function(){clearTimeout(hold);if(document.body.contains(d))b.textContent='Grown ups: press and hold to keep playing';});});
    b.addEventListener('contextmenu',function(e){e.preventDefault();});
    speak('Great playing! Time for a break.');
  }

  /* ---------- spelling ---------- */
  var WORDS=[
    ['cat','🐱'],['dog','🐶'],['sun','☀️'],['hat','🎩'],['pig','🐷'],['cup','🥤'],['bus','🚌'],['hen','🐔'],
    ['fox','🦊'],['box','📦'],['egg','🥚'],['bed','🛏️'],['bee','🐝'],['car','🚗'],['owl','🦉'],['ant','🐜'],
    ['cow','🐮'],['bat','🦇'],['map','🗺️'],['pen','🖊️'],['fish','🐟'],['frog','🐸'],['cake','🎂'],['star','⭐'],
    ['tree','🌳'],['ball','⚽'],['duck','🦆'],['moon','🌙'],['bird','🐦'],['boat','⛵'],['milk','🥛'],['corn','🌽'],
    ['bear','🐻'],['ship','🚢'],['book','📖'],['kite','🪁'],['rain','🌧️'],['hand','✋'],['lamp','💡'],['drum','🥁']
  ];
  var lastWord=null;
  function pickWord(maxLen){
    var pool=WORDS.filter(function(w){return w[0].length<=(maxLen||4)&&w[0]!==lastWord;});
    var w=pool[Math.floor(Math.random()*pool.length)];lastWord=w[0];
    return {word:w[0],pic:w[1]};
  }
  var voice=null;
  function speak(text){
    try{
      if(!window.speechSynthesis)return;
      window.speechSynthesis.cancel();
      var u=new SpeechSynthesisUtterance(text);u.rate=.85;u.pitch=1.15;u.lang='en-US';
      if(!voice){var v=window.speechSynthesis.getVoices().filter(function(x){return /^en/i.test(x.lang);});voice=v.find(function(x){return /samantha|karen|female|zira|aria/i.test(x.name);})||v[0]||null;}
      if(voice)u.voice=voice;
      window.speechSynthesis.speak(u);
    }catch(e){}
  }
  /* a little sticker showing the picture and one slot per letter */
  function wordBar(parent,before){
    var el=document.createElement('div');el.className='sticker kgWord';el.setAttribute('aria-live','polite');
    if(before)parent.insertBefore(el,before);else parent.appendChild(el);
    var cur=null,need=0;
    function render(){
      if(!cur){el.innerHTML='';return;}
      var h='<span class="pic" aria-hidden="true">'+cur.pic+'</span>';
      for(var i=0;i<cur.word.length;i++)h+='<span class="slot'+(i<need?' got':i===need?' next':'')+'">'+(i<need?cur.word[i]:'')+'</span>';
      el.innerHTML=h;el.setAttribute('aria-label','Spell '+cur.word+'. '+need+' of '+cur.word.length+' letters found');
    }
    return {
      set:function(w){cur=w;need=0;render();},
      fill:function(){need++;render();},
      done:function(){el.classList.remove('done');void el.offsetWidth;el.classList.add('done');},
      get word(){return cur;},get need(){return need;},
      get nextLetter(){return cur?cur.word[need]:null;}
    };
  }

  window.KG={
    init:function(o){
      o=o||{};game=o.game||game;if(o.isPlaying)isPlaying=o.isPlaying;onHard=o.onHard||null;onBreak=o.onBreak||null;
      load();
      ['pointerdown','keydown'].forEach(function(ev){document.addEventListener(ev,active,true);});
      document.addEventListener('visibilitychange',function(){if(document.hidden){save();flushLog();}});
      window.addEventListener('pagehide',function(){save();flushLog();});
      clearInterval(timer);timer=setInterval(tick,1000);
      if(hard)setTimeout(function(){banner('Welcome back! The game is a little faster now.');},800);
    },
    hard:function(){return hard;},
    boost:function(){return hard?1.3:1;},
    /* games call this whenever she makes a mistake */
    error:function(){if(t>=BREAK_AT&&!broken)showBreak();},
    minutes:function(){return t/60;},
    banner:banner,speak:speak,pickWord:pickWord,wordBar:wordBar
  };
})();
