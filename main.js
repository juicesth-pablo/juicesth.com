/* =========================================================
   MAIN.JS 目錄
   01  背景動畫：分頁隱藏時暫停（省電）
   ========================================================= */


/* 01 —— 背景流動漸變：切到別的分頁時暫停動畫 —— */
const bgEl = document.querySelector(".bg");

if (bgEl) {

    document.addEventListener("visibilitychange", function () {

        // 分頁不可見 → 暫停；回到分頁 → 恢復
        bgEl.classList.toggle("is-paused", document.hidden);
    });
}