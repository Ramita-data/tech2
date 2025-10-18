(async function(){
  const state = {score:0,coins:0,levelIndex:0,levels:[],timerId:null,timeLeft:0};
  const $=id=>document.getElementById(id);

  // DOM
  const screenStart=$('screen-start'),screenLevel=$('screen-level'),screenFact=$('screen-fact'),screenGameOver=$('screen-gameover');
  const btnStart=$('btn-start'),btnNext=$('btn-next'),btnRestart=$('btn-restart');
  const questionText=$('question-text'),optionsDiv=$('options'),levelNum=$('level-num');
  const timerVal=$('timer-val'),scoreVal=$('score-val'),coinsVal=$('coins-val');
  const techFact=$('tech-fact'),finalScore=$('final-score');

  // Audio
  const bgMusic = $('bg-music');
  const correctSound = $('correct-sound');
  const wrongSound = $('wrong-sound');

  const bgMusics = ['bg1.mp3','bg2.mp3','bg3.mp3']; 
  let bgIndex = 0;

  function playBackground(){
    bgMusic.src = bgMusics[bgIndex % bgMusics.length];
    bgMusic.play();
    bgIndex++;
  }

  function loadProgress(){try{const s=JSON.parse(localStorage.getItem('techquest_state')||'{}');if(s.score)state.score=s.score;if(s.coins)state.coins=s.coins}catch(e){console.warn(e)}updateUI()}
  function saveProgress(){try{localStorage.setItem('techquest_state',JSON.stringify({score:state.score,coins:state.coins}))}catch(e){console.warn(e)}}
  function updateUI(){scoreVal.textContent=state.score;coinsVal.textContent=state.coins;}

  async function loadQuestions(){
    try{const res=await fetch('questions_500.json');if(!res.ok)throw new Error();const data=await res.json();state.levels=data.levels||[]}
    catch(e){console.error(e);state.levels=[{level:1,time:20,fact:'Fallback fact.',questions:[{q:'Fallback Q?','choices':['A','B'],'a':0}]}]}
  }

  function showScreen(el){[screenStart,screenLevel,screenFact,screenGameOver].forEach(s=>s.classList.add('hidden'));el.classList.remove('hidden');}

  function startLevel(i){
    if(i<0||i>=state.levels.length){gameOver();return}
    state.levelIndex=i;
    const lvl=state.levels[i];
    levelNum.textContent=lvl.level;
    state.currentQuestions=lvl.questions.slice();
    state.qIndex=0;
    state.timeLeft=lvl.time;
    showScreen(screenLevel);
    renderQuestion();
    startTimer();
    playBackground();
  }

  function startTimer(){
    clearInterval(state.timerId);
    timerVal.textContent=state.timeLeft;
    state.timerId=setInterval(()=>{
      state.timeLeft--;
      timerVal.textContent=state.timeLeft;
      if(state.timeLeft<=0){clearInterval(state.timerId);gameOver();}
    },1000);
  }

  function renderQuestion(){
    const lvl=state.levels[state.levelIndex];
    const q=state.currentQuestions[state.qIndex];
    if(!q){clearInterval(state.timerId);showFact(lvl.fact);return;}
    questionText.textContent=q.q;
    optionsDiv.innerHTML='';
    q.choices.forEach((c,i)=>{
      const b=document.createElement('div');b.className='option';b.textContent=c;
      b.addEventListener('click',()=>selectOption(b,i,q.a));
      optionsDiv.appendChild(b);
    });
  }

  function selectOption(elem,idx,correct){
    [...optionsDiv.children].forEach(c=>c.style.pointerEvents='none');
    if(idx===correct){
      elem.classList.add('correct');
      correctSound.play();
      state.score+=10+(state.levelIndex*5);
      state.coins+=5;
      saveProgress();updateUI();
      setTimeout(()=>{state.qIndex++;renderQuestion();},700);
    } else {
      elem.classList.add('wrong');
      wrongSound.play();
      state.score=Math.max(0,state.score-5);
      saveProgress();updateUI();
      setTimeout(()=>{state.qIndex++;renderQuestion();},900);
    }
  }

  function showFact(text){
    techFact.textContent=text;
    showScreen(screenFact);
    btnNext.textContent=(state.levelIndex>=state.levels.length-1)?"Finish Game":"Next Level";
  }

  function gameOver(){
    clearInterval(state.timerId);
    finalScore.textContent=state.score;
    showScreen(screenGameOver);
    bgMusic.pause();
    bgMusic.currentTime = 0;
  }

  btnStart.addEventListener('click',()=>startLevel(0));
  btnNext.addEventListener('click',()=>{if(state.levelIndex>=state.levels.length-1){gameOver();}else{startLevel(state.levelIndex+1);}});
  btnRestart.addEventListener('click',()=>{state.score=0;state.coins=0;saveProgress();updateUI();showScreen(screenStart);});

  function initPayPal(){
    if(typeof paypal==='undefined'){console.warn('PayPal SDK not available.');return;}
    paypal.Buttons({
      style:{layout:'vertical',color:'gold',shape:'rect',label:'paypal'},
      createOrder:(d,a)=>a.order.create({purchase_units:[{amount:{value:'10.00'}}]}),
      onApprove:(d,a)=>a.order.capture().then(()=>{state.coins+=1000;saveProgress();updateUI();alert('Payment successful! 1000 Knowledge Coins added.')}),
      onError:err=>{console.error(err);alert('Payment failed.');}
    }).render('#paypal-button-container');
  }

  await loadQuestions(); loadProgress(); showScreen(screenStart); initPayPal();
})();
