/* =========================================================
   MAIN.JS 目錄
   01  背景動畫：分頁隱藏時暫停（省電）
   02  跨頁 View Transitions：依目的地決定滑動方向
   ========================================================= */


/* 01 —— 背景流動漸變：切到別的分頁時暫停動畫 —— */
const bgEl = document.querySelector(".bg");
if (bgEl) {
    document.addEventListener("visibilitychange", function () {
        // 分頁不可見 → 暫停；回到分頁 → 恢復
        bgEl.classList.toggle("is-paused", document.hidden);
    });
}


/* 02 —— 跨頁 View Transitions：依目的地決定滑動方向 —— */

// 判斷網址是不是首頁（以 / 或 /index.html 結尾）
function isHomeUrl(url) {
    const path = new URL(url, location.href).pathname;
    return path.endsWith("/") || path.endsWith("/index.html");
}

// 依「來源 → 目的地」決定方向：forward（上滑）或 back（下滑）
function pickTransitionType(activation) {
    if (!activation || !activation.from || !activation.entry) {
        return "forward";
    }
    const fromHome = isHomeUrl(activation.from.url);
    const toHome = isHomeUrl(activation.entry.url);
    if (fromHome && !toHome) {
        return "forward";   // 首頁 → 內頁：上滑
    }
    if (!fromHome && toHome) {
        return "back";      // 內頁 → 首頁：下滑
    }
    if (activation.entry.index < activation.from.index) {
        return "back";      // 同層返回
    }
    return "forward";       // 同層前進
}

// 離開目前頁（舊頁快照）時標記方向
window.addEventListener("pageswap", function (e) {
    if (e.viewTransition && e.activation) {
        e.viewTransition.types.add(pickTransitionType(e.activation));
    }
});

// 進入新頁（新頁快照）時標記相同方向
window.addEventListener("pagereveal", function (e) {
    if (e.viewTransition && navigation.activation) {
        e.viewTransition.types.add(pickTransitionType(navigation.activation));
    }
});