(function () {
  // ===== 工具 ====
  // 隨機整數 包含 min & max
  function R(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function toCssUnit(value) {
    return typeof value === "number" ? `${value}px` : value;
  }

  // [遊戲物件]
  function GameObj(size, position, el) {
    this.size = size;
    this.position = position;
    this.el = typeof el === "string" ? document.querySelector(el) : el;
    this.updateCss();
  }

  // [遊戲物件] --//更新css
  GameObj.prototype.updateCss = function () {
    if (!this.el) return;
    this.el.style.left = toCssUnit(this.position.x);
    this.el.style.bottom = toCssUnit(this.position.y);
    this.el.style.width = toCssUnit(this.size.width);
    this.el.style.height = toCssUnit(this.size.height);
  };

  // [類別] 鴨子
  function Duck(el, id, gameWidth) {
    this.duckPos = R(0, 2);
    this.velocity = R(12, 16) / 10;
    const width = [170, 150, 130];
    const yPos = ["15%", "40%", "65%"];
    this.id = id;
    this.inGame = true;
    this.style = R(0, 2);
    this.rafId = null;
    GameObj.call(
      this,
      {
        width: width[this.duckPos],
        height: width[this.duckPos] * 1.3,
      },
      {
        x: this.duckPos === 1 ? gameWidth : -width[this.duckPos],
        y: yPos[this.duckPos],
      },
      el,
    );
    this.initPos();
  }
  Duck.prototype = Object.create(GameObj.prototype);
  Duck.prototype.constructor = Duck.constructor;

  // [類別] 鴨子 --// 針對所在位置處理z-index
  Duck.prototype.initPos = function () {
    const pos = this.duckPos;
    if (!this.el) return;
    switch (pos) {
      case 0:
        this.el.style.zIndex = "30";
        break;
      case 1:
        this.el.classList.add("right");
        this.el.style.zIndex = "20";
        break;
      case 2:
        this.el.style.zIndex = "10";
        break;
      default:
        break;
    }
  };

  // [類別] 鴨子 --//移動
  Duck.prototype.move = function (gameWidth) {
    const tick = () => {
      if (!this.el || !this.inGame) return;
      if (this.duckPos === 1) {
        if (this.position.x > -this.size.width) {
          this.position.x -= this.velocity;
        } else {
          this.el.remove();
          this.inGame = false;
          if (this.rafId) {
            cancelAnimationFrame(this.rafId);
          }
          return;
        }
      } else {
        if (this.position.x < gameWidth) {
          this.position.x += this.velocity;
        } else {
          this.el.remove();
          this.inGame = false;
          if (this.rafId) {
            cancelAnimationFrame(this.rafId);
          }
          return;
        }
      }
      this.updateCss();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  };

  // [類別] 手
  function Hand(el, angle) {
    this.angle = angle;
    GameObj.call(this, { width: "30%", height: "auto" }, { x: "40%", y: "-5%" }, el);
    this.updateCss();
  }
  Hand.prototype = Object.create(GameObj.prototype);
  Hand.prototype.constructor = Hand.constructor;

  // [類別] 手 --// 更新角度
  Hand.prototype.updateCss = function () {
    if (!this.el) return;
    this.el.style.left = toCssUnit(this.position.x);
    this.el.style.bottom = toCssUnit(this.position.y);
    this.el.style.width = toCssUnit(this.size.width);
    this.el.style.height = toCssUnit(this.size.height);
    this.el.style.transform = `rotate(${this.angle}deg)`;
  };

  // [類別] progressbar
  function Bar(el) {
    GameObj.call(this, { width: "100%", height: "100%" }, { x: "0%", y: "0%" }, el);
    this.updateCss();
  }
  Bar.prototype = Object.create(GameObj.prototype);
  Bar.prototype.constructor = Bar.constructor;

  // [遊戲本體]
  function Game(options) {
    this.gameMain = options.gameMain;
    this.gameScore = options.gameScore;
    this.gameTime = options.gameTime;
    this.hand = new Hand(options.handEl, 0);
    this.bar = new Bar(options.barEl);
    this.progress = 0;
    this.isTouch = false;
    this.handler = "mousedown";
    this.cleanHandler = "mouseup";
    this.currentTouch = false;
    this.currentProgress = 0;
    this.currentBlock = 0;
    this.newAllDucks = [];
    this.duckHitted = null;
    this.createTimer = null;
    this.timer = null;
    this.handlerTimer = null;
    this.score = 0;
    this.time = 30;
    this.isActive = true;
    this.isBound = false;
    this.ducks = [];
    this.checkDevice();
    this.bindControls();
    this.start();
  }

  Game.prototype.getGameWidth = function () {
    if (!this.gameMain) return 0;
    return this.gameMain.getBoundingClientRect().width;
  };

  // [遊戲本體] --//確認裝置
  Game.prototype.checkDevice = function () {
    if (navigator.userAgent.match(/(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i)) {
      this.handler = "touchstart";
      this.cleanHandler = "touchend";
    } else {
      this.handler = "mousedown";
      this.cleanHandler = "mouseup";
    }
  };

  // [遊戲本體] --//創造鴨子
  Game.prototype.createDuck = function () {
    let id = 1;
    this.createTimer = setInterval(() => {
      const duckEl = document.createElement("div");
      duckEl.className = "duck";
      duckEl.id = `duck-${id}`;
      this.gameMain.appendChild(duckEl);
      const duck = new Duck(duckEl, id, this.getGameWidth());
      duck.el.classList.add(`duck${duck.style + 1}`);
      this.ducks.push(duck);
      duck.move(this.getGameWidth());
      id += 1;
      this.newAllDucks = this.ducks.filter((item) => item.inGame);
    }, 1500);
  };

  // [遊戲本體] --//放開丟出
  Game.prototype.throw = function () {
    if (!this.gameMain) return;
    this.hand.el.querySelector(".coin1").style.display = "none";
    const coin2 = document.createElement("img");
    coin2.className = "coin2";
    coin2.src = "img/coin2.png";
    this.gameMain.appendChild(coin2);
    const coinDistance = this.currentProgress;
    let coinDuration;
    let coinScale;
    let coinDelay;
    switch (true) {
      case coinDistance <= 5:
        coinDuration = 0.1;
        coinScale = 0.7;
        coinDelay = 0;
        this.currentBlock = null;
        break;
      case coinDistance >= 5 && coinDistance < 35:
        coinDuration = 0.2;
        coinScale = 0.6;
        coinDelay = 0.1;
        this.currentBlock = 0;
        break;
      case coinDistance >= 35 && coinDistance < 65:
        coinDuration = 0.3;
        coinScale = 0.5;
        coinDelay = 0.2;
        this.currentBlock = 1;
        break;
      case coinDistance >= 65 && coinDistance < 95:
        coinDuration = 0.4;
        coinScale = 0.4;
        coinDelay = 0.3;
        this.currentBlock = 2;
        break;
      default:
        coinDuration = 0.5;
        coinScale = 0.3;
        coinDelay = 0.4;
        this.currentBlock = null;
        break;
    }

    gsap.to(coin2, {
      duration: coinDuration,
      bottom: `${this.currentProgress * 0.6 + 22}%`,
      scale: coinScale,
      ease: "power2.out",
      onComplete: () => {
        if (this.duckHitted) {
          this.duckHitted.el.style.backgroundImage = `url("img/duck${this.duckHitted.style + 1}_hitted.png")`;
          const duckHittedPos = this.duckHitted.duckPos;
          switch (duckHittedPos) {
            case 0:
              this.score += 5;
              break;
            case 1:
              this.score += 10;
              break;
            case 2:
              this.score += 30;
              break;
            default:
              break;
          }
          this.gameScore.textContent = this.score;
        }
      },
    });
    gsap.to(coin2, {
      duration: 0.1,
      opacity: 0,
      delay: coinDelay,
      onComplete: () => {
        coin2.remove();
      },
    });
  };

  // [遊戲本體] --//按鈕控制
  Game.prototype.bindControls = function () {
    if (this.isBound || !this.gameMain) return;
    // 按鈕控制 touchStart
    const addProgress = (e) => {
      if (!this.isActive) return;
      e.preventDefault();
      if (this.currentTouch) return;
      this.hand.el.querySelector(".coin1").style.display = "block";
      this.currentTouch = true;
      this.isTouch = true;
      this.handlerTimer = setInterval(() => {
        if (this.progress < 100) {
          this.progress += 3;
        } else {
          this.progress = 100;
          clearInterval(this.handlerTimer);
        }
        this.hand.angle = -this.progress / 2;
        this.hand.updateCss();

        this.bar.position.x = `${this.progress}%`;
        this.bar.updateCss();
      }, 50);
    };

    // 按鈕控制 touchend
    const cleanProgress = (e) => {
      if (!this.isActive) return;
      e.preventDefault();
      this.currentTouch = false;
      clearInterval(this.handlerTimer);
      this.handlerTimer = null;
      this.isTouch = false;
      this.currentProgress = this.progress;
      this.progress = 0;
      this.hand.angle = 0;
      this.hand.updateCss();
      this.bar.position.x = "0%";
      this.bar.updateCss();
      this.throw();
      this.checkHit();
    };

    this.gameMain.addEventListener(this.handler, addProgress, { passive: false });
    this.gameMain.addEventListener(this.cleanHandler, cleanProgress, { passive: false });
    this.isBound = true;
  };

  // [遊戲本體] --//確認丟中
  Game.prototype.checkHit = function () {
    const gw = this.getGameWidth();
    const duckHitted =
      this.newAllDucks.find((item) => {
        const inRangex = item.position.x < gw / 2 - 10 && item.position.x + item.size.width > gw / 2 + 10;
        const inBlock = item.duckPos === this.currentBlock;
        return inRangex && inBlock;
      }) || null;
    this.duckHitted = duckHitted;
  };

  // [遊戲本體] --//計時器
  Game.prototype.gameTimer = function (onTimeUp) {
    this.timer = setInterval(() => {
      if (this.time <= 1) {
        this.time = 0;
        this.gameTime.textContent = this.time;
        clearInterval(this.timer);
        clearInterval(this.createTimer);
        this.isActive = false;
        if (typeof onTimeUp === "function") {
          onTimeUp();
        }
        return;
      }
      this.time -= 1;
      this.gameTime.textContent = this.time;
    }, 1000);
  };

  Game.prototype.start = function () {
    this.score = 0;
    this.time = 30;
    this.progress = 0;
    this.isTouch = false;
    this.currentTouch = false;
    this.currentProgress = 0;
    this.currentBlock = 0;
    this.newAllDucks = [];
    this.duckHitted = null;
    this.isActive = true;
    this.gameScore.textContent = this.score;
    this.gameTime.textContent = this.time;
    this.hand.angle = 0;
    this.hand.updateCss();
    this.bar.position.x = "0%";
    this.bar.updateCss();
  };

  Game.prototype.reset = function (onTimeUp) {
    clearInterval(this.timer);
    clearInterval(this.createTimer);
    clearInterval(this.handlerTimer);
    this.timer = null;
    this.createTimer = null;
    this.handlerTimer = null;
    this.isActive = true;
    this.gameMain.style.pointerEvents = "auto";
    this.gameMain.querySelectorAll(".duck, .coin2").forEach((el) => el.remove());
    this.ducks.forEach((duck) => {
      if (duck.rafId) {
        cancelAnimationFrame(duck.rafId);
      }
    });
    this.ducks = [];
    this.start();
    this.createDuck();
    this.gameTimer(onTimeUp);
  };

  // [主要遊戲場景]
  const gameEl = document.querySelector(".game");
  if (!gameEl) return;

  const title = gameEl.querySelector(".game__title");
  const leaf = gameEl.querySelectorAll(".leaf");
  const page1Btn = gameEl.querySelectorAll(".game__btns > a");
  const gameFooter = gameEl.querySelector(".game__footer");
  const gameMain = gameEl.querySelector(".game__main");
  const cloud = gameEl.querySelector(".cloud");
  const page1Ducks = gameEl.querySelectorAll(".page1-duck");
  const gameTop = gameEl.querySelector(".game__top");
  const gameHand = gameEl.querySelector(".hand");
  const gameScore = gameEl.querySelector(".score");
  const gameTime = gameEl.querySelector(".time");
  const btnStart = gameEl.querySelector(".btn-start");
  const pop = gameEl.querySelector(".pop");
  const popInner = gameEl.querySelector(".pop__inner");
  const popResult = gameEl.querySelector(".pop-result");
  const popLink = gameEl.querySelector(".pop__link");
  const popReplay = gameEl.querySelector(".pop__replay");

  let tl1 = null;
  let introPlayed = false;
  let game = null;

  // ==== 動畫函式 ====

  // page1 動畫
  function page1Ani() {
    if (introPlayed || !title) return;
    introPlayed = true;
    tl1 = gsap.timeline({ delay: 0.5 });
    tl1.from(title, { duration: 1.5, y: "-30%", opacity: 0, ease: "elastic.out(1, 0.3)" });
    tl1.from(page1Btn, { duration: 1.5, stagger: 0.2, scale: 0, ease: "elastic.out(1, 0.3)" }, 0.2);
  }

  // 移除動畫並呼叫 [主要遊戲場景]
  function removeItem() {
    title.remove();
    page1Btn.forEach((btn) => btn.remove());
    page1Ducks.forEach((duck) => duck.remove());
    callMainGame();
  }

  // 開始遊戲場景動畫
  function gameStart() {
    if (tl1) {
      tl1.clear();
    }
    if (btnStart) {
      btnStart.style.pointerEvents = "none";
    }
    const tl2 = gsap.timeline();
    tl2.to([title, ...page1Btn, ...page1Ducks], {
      duration: 0.6,
      stagger: 0.1,
      y: -100,
      opacity: 0,
      onComplete: removeItem,
    });
    tl2.to(gameFooter, { duration: 0.6, y: "100%", opacity: 0 }, 0);
    tl2.to(leaf, { duration: 1.5, y: "30%", scale: 0.8, ease: "power4.out" }, 0.2);
    tl2.to(cloud, { duration: 2, y: "-40%", ease: "power4.out" }, 0);
    tl2.to(gameMain, { duration: 1.8, backgroundPositionY: 0, backgroundSize: "110%" }, 0);
    tl2.to(gameTop, { duration: 0.6, opacity: 1, y: 0 }, 0.5);
    tl2.to(gameHand, { duration: 0.6, opacity: 1, y: 0 }, 0.5);
  }

  // ==== 燈箱 ====

  // 結果燈箱
  function showModal() {
    gameMain.style.pointerEvents = "none";
    if (game && game.score <= 50) {
      popResult.innerHTML = "好可惜<br>小鴨子玩水不夠過癮";
    } else {
      popResult.innerHTML = "小鴨子 玩水玩得很開心<br>送了謝禮過來~";
    }
    popReplay.classList.add("only");
    pop.classList.remove("hide");
    pop.setAttribute("aria-hidden", "false");
    gsap.from(popInner, {
      duration: 1,
      opacity: 0,
      scale: 0.5,
      ease: "elastic.out(1, 0.3)",
      delay: 0.3,
    });
  }

  // 通用燈箱控制
  const openModal = (modal) => {
    if (!modal) return;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  };

  const closeModal = (modal) => {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  };

  // 遊戲流程控制
  function callMainGame() {
    if (!game) {
      game = new Game({
        gameMain,
        gameScore,
        gameTime,
        handEl: ".hand",
        barEl: ".game__top--barinner",
      });
      game.gameTimer(showModal);
      game.createDuck();
    } else {
      game.reset(showModal);
    }
  }

  // ==== 事件綁定 ====

  // 開始遊戲按鈕
  if (btnStart) {
    btnStart.addEventListener("click", gameStart);
  }

  // 重新載入
  if (popReplay) {
    popReplay.addEventListener("click", (e) => {
      e.preventDefault();
      pop.classList.add("hide");
      pop.setAttribute("aria-hidden", "true");
      if (game) {
        game.reset(showModal);
      }
    });
  }

  // 燈箱事件
  const modalTriggers = document.querySelectorAll("[data-toggle='modal']");
  const modalDismiss = document.querySelectorAll("[data-dismiss='modal']");

  modalTriggers.forEach((trigger) => {
    const target = trigger.getAttribute("data-target");
    if (!target) return;
    const modal = document.querySelector(target);
    if (!modal) return;
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      openModal(modal);
    });
  });

  modalDismiss.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const modal = btn.closest(".modal");
      closeModal(modal);
    });
  });

  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeModal(modal);
      }
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const opened = document.querySelector(".modal.is-open");
    if (opened) {
      closeModal(opened);
    }
  });

  // 接 init 的 loading 結束回調，開始 page1 動畫
  window.onLoadingDone = () => {
    page1Ani();
  };

  // 禁用手指雙擊縮放
  let lastTouchEnd = 0;
  document.documentElement.addEventListener(
    "touchend",
    (event) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    },
    false,
  );
})();
