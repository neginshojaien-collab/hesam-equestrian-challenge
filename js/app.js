(() => {
  'use strict';

  const $ = id => document.getElementById(id);

  const horses = [
    {
      name: 'SHADOW',
      fa: 'شدو',
      trait: 'PRECISION',
      stat: 95
    },
    {
      name: 'BLAZE',
      fa: 'بلیز',
      trait: 'POWER',
      stat: 89
    },
    {
      name: 'STORM',
      fa: 'استورم',
      trait: 'BALANCE',
      stat: 92
    },
    {
      name: 'NIGHT KING',
      fa: 'نایت کینگ',
      trait: 'SPEED',
      stat: 98
    }
  ];

  const questions = [
    {
      q: 'قبل از شروع یک مسیر پرش، مهم‌ترین بررسی کدام است؟',
      opts: [
        'تناسب زین و تجهیزات ایمنی',
        'فقط سرعت اسب',
        'فقط ظاهر تجهیزات'
      ],
      right: 0
    },
    {
      q: 'اگر اسب پیش از مانع بی‌قرار شد، انتخاب بهتر چیست؟',
      opts: [
        'فوراً سرعت را بیشتر کنی',
        'با حفظ آرامش، ریتم و کنترل را بازیابی کنی',
        'مهار را ناگهانی و شدید بکشی'
      ],
      right: 1
    },
    {
      q: 'در تمرین پرش، کدام نشانه مهم‌تر است؟',
      opts: [
        'فقط سریع تمام کردن مسیر',
        'حفظ ریتم، تعادل و واکنش به اسب',
        'پرش از هر مانعی بدون آمادگی'
      ],
      right: 1
    }
  ];

  let state = {
    name: 'سوارکار',
    horse: 0,
    score: 0,
    successful: 0,
    missed: 0,
    boosted: 0,
    energy: 100,
    total: 12,
    done: 0,
    time: 45,
    quizIndex: 0,
    quizCorrect: 0
  };

  let raf = 0;
  let interval = 0;
  let activeObstacle = false;
  let handled = false;
  let obstacleX = 110;
  let lastFrame = 0;
  let sound = false;

  function go(page) {
    document.querySelectorAll('.screen').forEach(e => {
      e.classList.toggle('active', e.id === page);
    });

    if (page !== 'ride') {
      stopLoop();
    }
  }

  function beep(freq = 440) {
    if (!sound) return;

    try {
      const AC = window.AudioContext ||
        window.webkitAudioContext;

      const ctx = new AC();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(
        0.06,
        ctx.currentTime
      );

      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + 0.12
      );

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.12);

      setTimeout(() => ctx.close(), 350);

    } catch (e) {}
  }

  function initHorses() {
    const box = $('horseGrid');

    box.innerHTML = '';

    horses.forEach((h, i) => {
      const b = document.createElement('button');

      b.className =
        'horse-card' +
        (i === state.horse ? ' selected' : '');

      b.innerHTML = `
        <div class="horse-title">${h.name}</div>
        <small class="horse-sub">${h.trait}</small>
        <div class="mini-track">
          <i style="width:${h.stat}%"></i>
        </div>
      `;

      b.addEventListener('click', () => {
        state.horse = i;
        initHorses();
        beep(550);
      });

      box.appendChild(b);
    });
  }

  function stopLoop() {
    cancelAnimationFrame(raf);
    clearInterval(interval);

    raf = 0;
    interval = 0;
    activeObstacle = false;
  }

  function toast(t) {
    $('gameToast').textContent = t;
  }

  function update() {
    $('score').textContent = state.score;
    $('timer').textContent = state.time;

    $('energy').textContent =
      Math.round(state.energy);

    $('progressText').textContent =
      `مانع ${Math.min(state.done + 1, state.total)} / ${state.total}`;

    $('progressBar').style.width =
      (state.done / state.total * 100) + '%';

    $('roundLabel').textContent =
      state.done < 4
        ? 'ROUND 1 · CONTROL'
        : state.done < 8
        ? 'ROUND 2 · TIMING'
        : 'ROUND 3 · ELITE';
  }

  function spawn() {
    if (state.done >= state.total) {
      endRide();
      return;
    }

    activeObstacle = true;
    handled = false;
    obstacleX = 110;

    $('obstacle').style.left = obstacleX + '%';

    update();
  }

  function resolve(success) {
    if (!activeObstacle || handled) return;

    handled = true;
    activeObstacle = false;

    state.done++;

    if (success) {
      state.successful++;
      state.score += 75;

      toast([
        'PERFECT JUMP! +75',
        'CLEAN LANDING! +75',
        'GREAT TIMING! +75'
      ][state.done % 3]);

      beep(680);

    } else {
      state.missed++;

      state.energy = Math.max(
        0,
        state.energy - 12
      );

      toast('مانع از دست رفت! ریتمت رو حفظ کن');

      beep(230);
    }

    update();

    if (state.energy <= 0) {
      endRide();
      return;
    }

    setTimeout(() => {
      if ($('ride').classList.contains('active')) {
        spawn();
      }
    }, 540);
  }

  function frame(now) {
    if (!$('ride').classList.contains('active')) {
      return;
    }

    if (!lastFrame) lastFrame = now;

    const dt = Math.min(
      (now - lastFrame) / 1000,
      0.06
    );

    lastFrame = now;

    if (activeObstacle) {
      const base =
        state.done < 4
          ? 31
          : state.done < 8
          ? 38
          : 45;

      obstacleX -= base * dt;

      $('obstacle').style.left =
        obstacleX + '%';

      if (obstacleX < -10) {
        resolve(false);
      }
    }

    raf = requestAnimationFrame(frame);
  }

  function jump() {
    if (!activeObstacle) return;

    if (obstacleX >= 14 && obstacleX <= 37) {
      resolve(true);

    } else {
      state.energy = Math.max(
        0,
        state.energy - 3
      );

      toast(
        'زود یا دیر بود! روی محدوده نارنجی بپر'
      );

      beep(300);
      update();

      if (state.energy <= 0) {
        endRide();
      }
    }
  }

  function boost() {
    if (!activeObstacle || state.energy < 12) {
      return;
    }

    state.boosted++;
    state.energy -= 7;
    obstacleX -= 10;

    toast('BOOST ⚡ سرعت بیشتر، انرژی کمتر');

    beep(520);
    update();

    if (obstacleX < -10) {
      resolve(false);
    }
  }

  function startRide() {
    stopLoop();

    Object.assign(state, {
      score: 0,
      successful: 0,
      missed: 0,
      boosted: 0,
      energy: 100,
      total: 12,
      done: 0,
      time: 45,
      quizIndex: 0,
      quizCorrect: 0
    });

    lastFrame = 0;

    go('ride');
    update();

    toast(
      'وقتی مانع به خط نارنجی رسید JUMP بزن'
    );

    spawn();

    raf = requestAnimationFrame(frame);

    interval = setInterval(() => {
      state.time--;
      update();

      if (state.time <= 0) {
        endRide();
      }
    }, 1000);
  }

  function endRide() {
    stopLoop();
    go('knowledge');
    showQuestion();
  }

  function showQuestion() {
    const i = state.quizIndex;

    if (i >= questions.length) {
      result();
      return;
    }

    const q = questions[i];

    $('quizCounter').textContent =
      `${i + 1} / ${questions.length}`;

    $('question').textContent = q.q;

    $('quizFeedback').textContent =
      'انتخابت روی نتیجه نهایی اثر دارد.';

    $('answers').innerHTML = '';

    $('answers').dataset.locked = 'false';

    q.opts.forEach((o, j) => {
      const b = document.createElement('button');

      b.className = 'answer';
      b.textContent = o;

      b.addEventListener('click', () => {
        if (
          $('answers').dataset.locked === 'true'
        ) return;

        $('answers').dataset.locked = 'true';

        b.classList.add('chosen');

        if (j === q.right) {
          state.quizCorrect++;

          $('quizFeedback').textContent =
            '✓ انتخاب درست';

          beep(750);

        } else {
          $('quizFeedback').textContent =
            'پاسخ بهتر: ' + q.opts[q.right];

          beep(240);
        }

        setTimeout(() => {
          state.quizIndex++;
          showQuestion();
        }, 1050);
      });

      $('answers').appendChild(b);
    });
  }

  function scores() {
    const precision = Math.round(
      state.successful / state.total * 100
    );

    const speed = Math.min(
      100,
      Math.round(
        (state.time / 45) * 70 +
        Math.max(0, state.boosted) * 5 +
        precision * 0.25
      )
    );

    const knowledge = Math.round(
      state.quizCorrect /
      questions.length * 100
    );

    return {
      precision,
      speed,
      knowledge,
      total: Math.round(
        precision * 0.55 +
        speed * 0.15 +
        knowledge * 0.30
      )
    };
  }

  function rank(v) {
    if (v >= 95) return 'LEGEND RIDER';
    if (v >= 80) return 'ELITE RIDER';
    if (v >= 60) return 'ADVANCED RIDER';
    if (v >= 40) return 'SKILLED RIDER';

    return 'ROOKIE RIDER';
  }

  function summary() {
    const s = scores();

    return `
🐎 HESAM EQUESTRIAN CHALLENGE

👤 ${state.name}
🐴 ${horses[state.horse].name}

🏆 ${s.total}/100
🥇 ${rank(s.total)}

🎯 دقت: ${s.precision}%
⚡ سرعت: ${s.speed}%
🧠 دانش: ${s.knowledge}%

🎮 این امتیاز مربوط به بازی مجازی است.

${location.href.split('#')[0]}
    `.trim();
  }

  function result() {
    go('result');

    const s = scores();

    $('finalScore').textContent = s.total;
    $('resultRank').textContent = rank(s.total);

    $('resultName').textContent =
      `${state.name} · ${horses[state.horse].name}`;

    $('statPrecision').textContent =
      s.precision + '%';

    $('statSpeed').textContent =
      s.speed + '%';

    $('statKnowledge').textContent =
      s.knowledge + '%';

    try {
      const previous = Number(
        localStorage.getItem('hesam-best')
      ) || 0;

      localStorage.setItem(
        'hesam-best',
        String(Math.max(s.total, previous))
      );

    } catch (e) {}
  }

  async function share() {
    const text = summary();

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'HESAM EQUESTRIAN CHALLENGE',
          text
        });

        $('shareNotice').textContent =
          'نتیجه برای اشتراک آماده شد.';

      } else {
        await navigator.clipboard.writeText(text);

        $('shareNotice').textContent =
          'گزارش کپی شد. در تلگرام برای @Nwgin2 ارسال کن.';
      }

    } catch (e) {
      if (e.name !== 'AbortError') {
        copy();
      }
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(
        summary()
      );

      $('shareNotice').textContent =
        '✓ گزارش کپی شد؛ در تلگرام برای @Nwgin2 بفرست.';

    } catch (e) {
      $('shareNotice').textContent =
        'کپی خودکار ممکن نبود؛ از گزینه اشتراک استفاده کن.';
    }
  }

  // INITIALIZE GAME

  initHorses();

  document.querySelectorAll('[data-go]')
    .forEach(b => {
      b.addEventListener('click', () => {
        if (b.dataset.go === 'horses') {
          state.name = $('playerName')
            .value.trim()
            .slice(0, 22) || 'سوارکار';
        }

        go(b.dataset.go);
        beep(400);
      });
    });

  $('soundBtn').addEventListener('click', () => {
    sound = !sound;

    $('soundBtn').textContent =
      sound ? '♫ ON' : '♫ OFF';

    beep(500);
  });

  $('horseNext').addEventListener(
    'click',
    startRide
  );

  $('jumpBtn').addEventListener(
    'pointerdown',
    e => {
      e.preventDefault();
      jump();
    }
  );

  $('boostBtn').addEventListener(
    'pointerdown',
    e => {
      e.preventDefault();
      boost();
    }
  );

  $('quitBtn').addEventListener('click', () => {
    if (confirm('از مسابقه خارج می‌شی؟')) {
      stopLoop();
      go('horses');
    }
  });

  $('shareBtn').addEventListener('click', share);
  $('copyBtn').addEventListener('click', copy);

  $('restartBtn').addEventListener('click', () => {
    go('horses');
    initHorses();
  });

  window.addEventListener('keydown', e => {
    if (!$('ride').classList.contains('active')) {
      return;
    }

    if (
      e.code === 'Space' ||
      e.code === 'ArrowUp'
    ) {
      e.preventDefault();

      if (!e.repeat) jump();

    } else if (
      e.code === 'ArrowRight' &&
      !e.repeat
    ) {
      e.preventDefault();
      boost();
    }
  });

})();
