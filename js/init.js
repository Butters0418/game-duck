(function () {
  const app = {
    data: {
      isMobile: false,
      userEvent: "click",
      preventTouchMove: true,
    },

    // 工具：隨機數字(不含 max)
    R(min, max) {
      return min + Math.random() * (max - min);
    },

    // 判斷裝置
    detectDevice() {
      this.data.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      this.data.userEvent = this.data.isMobile ? "touchstart" : "click";
    },

    // 圖片載入與 mask
    handleLoading() {
      const loadingMask = document.querySelector(".loading_mask");
      if (!loadingMask) return;

      const imgs = Array.from(document.images);
      const imgsLen = imgs.length;
      let loadedCount = 0;
      let loadingTime = 1500;
      let timer = null;
      let isHidden = false;
      const startTime = Date.now(); // 記錄開始時間
      const minLoadingTime = 300; // 最小顯示時間 300ms

      // loading 結束 隱藏 mask，遊戲開始
      const hideLoading = () => {
        if (isHidden) return;
        isHidden = true;
        if (timer) {
          clearInterval(timer);
        }

        // 計算已經過的時間
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, minLoadingTime - elapsed);

        // 確保至少顯示 300ms
        setTimeout(() => {
          loadingMask.classList.add("is-hidden");
          if (typeof window.onLoadingDone === "function") {
            window.onLoadingDone();
          }
        }, remainingTime);
      };

      // 圖片載入完成檢查
      const checkComplete = () => {
        if (imgsLen === 0 || loadedCount === imgsLen) {
          hideLoading();
        }
      };

      // 圖片載入監聽
      if (imgsLen > 0) {
        const onImgLoaded = () => {
          loadedCount += 1;
          if (loadedCount === imgsLen) {
            console.log("All img load");
            hideLoading();
          }
        };

        imgs.forEach((img) => {
          if (img.complete) {
            onImgLoaded();
          } else {
            img.addEventListener("load", onImgLoaded, { once: true });
            img.addEventListener("error", onImgLoaded, { once: true });
          }
        });
      }

      // 倒數計時器（最多 1.5 秒）
      timer = setInterval(() => {
        loadingTime -= 300;
        if (loadingTime <= 0) {
          hideLoading();
        } else {
          checkComplete();
        }
      }, 300);
    },

    // 阻止下拉滑動
    preventTouchMove() {
      if (!this.data.preventTouchMove) return;

      document.body.addEventListener(
        "touchmove",
        (e) => {
          e.preventDefault();
        },
        { passive: false },
      );
    },

    init() {
      this.detectDevice();
      this.preventTouchMove();
      this.handleLoading();
    },
  };

  // DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => app.init());
  } else {
    app.init();
  }
})();
