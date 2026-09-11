/* =========================================================
   MAIN.JS 目錄
   01  資料：系列與 Volume（增減內容改這裡）
   02  版面組建：系列牆（自動防重疊排版）/ Volume 列表 / 播放器
   03  導覽：左右滑動 + 瀏覽器歷史（返回鍵 / Esc / ← 一致）
   04  背景動畫：分頁隱藏時暫停（省電）
   ========================================================= */


/* 01 —— 資料 —— */
/* 新增系列：在陣列加一筆即可，位置會自動排版、不重疊。 */
/* cover：現用漸變佔位；換真圖改成 "url(images/{slug}/{slug}-cover.webp) center/cover"。 */
const SERIES = [
    {
        id: "wavy",
        title: "wavy",
        cover: "url(images/wavy.webp) center/cover",
        volumes: [
            { title: "Vol. 1", meta: "10 tracks", spotify: "1LfXvRTxAF8tXRrhVWHT59" },
            { title: "Vol. 2", meta: "10 tracks", spotify: "62cXCEmsdH4Hld4TXKiBxN" },
            { title: "Vol. 3", meta: "10 tracks", spotify: "4YH6kA5i4ARlqmVtBiWFDm" }
        ]
    },
    {
        id: "mellow-bars",
        title: "mellow bars",
        cover: "url(images/mellow-bars.webp) center/cover",
        volumes: [
            { title: "Vol. 1", meta: "10 tracks", spotify: "6fxGOLkUeroXa5b9LBdJaP" },
            { title: "Vol. 2", meta: "10 tracks", spotify: "56dkNieDonnb7tqOMNmZBF" },
            { title: "Vol. 3", meta: "10 tracks", spotify: "4TEIWRetVbO5J9fMJr68w7" },
            { title: "Vol. 4", meta: "10 tracks", spotify: "2vmE4jAnGgQ76nw5pbFR52" },
            { title: "Vol. 5", meta: "10 tracks", spotify: "0ezMxUDf356GSV7CIa7tDk" },
            { title: "Vol. 6", meta: "10 tracks", spotify: "3y0W2onJmuMYq6mffo2Xwb" },
            { title: "Vol. 7", meta: "10 tracks", spotify: "39YFGNcfTPAeyXgvVCMtgG" },
            { title: "Vol. 8", meta: "10 tracks", spotify: "6zayQDaTx1bE1CGqDEIvIr" },
            { title: "Vol. 9", meta: "10 tracks", spotify: "4OlY9DzwVk9ml8x6uhTv4p" }
        ]
    },
    {
        id: "summer-jam-mixtape",
        title: "summer jam mixtape",
        cover: "url(images/summer-jam-mixtape.webp) center/cover",
        volumes: [
            { title: "Vol. 1", meta: "10 tracks", spotify: "1auHxB3sJpK2stmkZtAFXC" }
        ]
    },
    {
        id: "flying-melodies",
        title: "flying melodies",
        cover: "url(images/flying-melodies.webp) center/cover",
        volumes: [
            { title: "Vol. 1", meta: "10 tracks", spotify: "1OMuKzoymTfBg1dDIH6sAT" },
            { title: "Vol. 2", meta: "10 tracks", spotify: "2ikcNC0TZMJv9lGHXiMN7f" }
        ]
    }
];


/* 02 —— 版面組建 —— */
const scatterEl = document.getElementById("scatter");
const volumesEl = document.getElementById("volumes");
const playerEl = document.getElementById("player");
const seriesTitleEl = document.getElementById("seriesTitle");
const bgEl = document.querySelector(".bg");

// 固定亂數種子：每次載入位置都一樣。改這個數字可「整體重新洗牌」一次。
const LAYOUT_SEED = 20260911;

// mulberry32：小型可重現亂數產生器（同種子 → 同序列）
function makeRandom(seed) {
    let a = seed >>> 0;
    return function () {
        a += 0x6D2B79F5;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// 自動排版：固定種子 → 位置不變；防重疊（含右側標題空間）
function layoutSeries() {
    const rect = scatterEl.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    const gap = 20;              // 封面之間最小間距(px)
    const labelReserve = 180;    // 右側預留給系列名稱的空間(px)，一併納入防重疊
    const minS = W * 0.08;       // 封面最小邊長
    const maxS = W * 0.12;       // 封面最大邊長
    const rand = makeRandom(LAYOUT_SEED);
    const placed = [];

    return SERIES.map(function (series) {
        const s = minS + rand() * (maxS - minS);
        const ew = s + labelReserve;      // 佔位寬度＝封面 + 右側標題空間
        const maxX = W - ew - gap;
        const maxY = H - s - gap;
        let x = gap;
        let y = gap;
        for (let t = 0; t < 120; t++) {
            x = gap + rand() * Math.max(0, maxX - gap);
            y = gap + rand() * Math.max(0, maxY - gap);
            const clash = placed.some(function (p) {
                return !(x + ew + gap <= p.x || x >= p.x + p.ew + gap ||
                         y + s + gap <= p.y || y >= p.y + p.s + gap);
            });
            if (!clash) {
                break;
            }
        }
        placed.push({ x: x, y: y, s: s, ew: ew });
        return {
            series: series,
            left: (x / W * 100) + "%",
            top: (y / H * 100) + "%",
            size: (s / window.innerWidth * 100) + "vw"
        };
    });
}

// 建立系列牆
function renderScatter() {
    scatterEl.innerHTML = "";
    layoutSeries().forEach(function (item) {
        const series = item.series;
        computePalette(series);

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "series";
        btn.dataset.series = series.id;
        btn.style.setProperty("--top", item.top);
        btn.style.setProperty("--left", item.left);
        btn.style.setProperty("--size", item.size);
        btn.innerHTML =
            '<span class="series__cover" style="background: ' + series.cover + ';"></span>' +
            '<span class="series__label">' + series.title + '</span>';

        // hover / 聚焦 → 預覽該色；離開 → 回到目前該有的底色（首頁預設 / 內頁鎖定色）
        btn.addEventListener("mouseenter", function () { applyPalette(series.id); });
        btn.addEventListener("mouseleave", syncPalette);
        btn.addEventListener("focus", function () { applyPalette(series.id); });
        btn.addEventListener("blur", syncPalette);

        scatterEl.appendChild(btn);
        wallObserver.observe(btn);
    });
}

// 內頁：建立左側 Volume 列表，並載入指定 volume 到右側播放器
function renderDetail(series, index) {
    currentSeries = series;
    seriesTitleEl.textContent = series.title;
    volumesEl.innerHTML = "";
    series.volumes.forEach(function (vol, i) {
        const num = String(i + 1).padStart(2, "0");
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "volume";
        btn.dataset.index = i;
        btn.innerHTML =
            '<span class="volume__index">' + num + '</span>' +
            '<span class="volume__title">' + vol.title + '</span>' +
            '<span class="volume__meta">' + (vol.meta || "") + '</span>';
        volumesEl.appendChild(btn);
    });
    setActiveVolume(index || 0);
}

// 切換右側播放器 + 標示選中的 volume
function setActiveVolume(index) {
    if (!currentSeries) {
        return;
    }
    const i = currentSeries.volumes[index] ? index : 0;
    Array.prototype.forEach.call(volumesEl.children, function (btn, k) {
        btn.classList.toggle("is-active", k === i);
    });
    const vol = currentSeries.volumes[i];
    renderPlayer(vol.title, vol.spotify);
}

// 從「純ID / 帶?si= / 完整分享連結」取出乾淨的 playlist ID
function cleanPlaylistId(idOrUrl) {
    const s = String(idOrUrl).trim();
    const m = s.match(/playlist\/([A-Za-z0-9]+)/);
    return m ? m[1] : s.split("?")[0];
}

// 注入 Spotify 播放器
function renderPlayer(title, spotifyId) {
    const id = cleanPlaylistId(spotifyId);   // 吃「純ID / 帶?si= / 完整分享連結」都行
    playerEl.innerHTML =
        '<iframe src="https://open.spotify.com/embed/playlist/' + id + '?utm_source=generator" ' +
        'width="100%" height="480" loading="lazy" ' +
        'allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" ' +
        'title="Spotify 播放器：' + title + '"></iframe>';
}

/* —— 首頁背景隨封面變色 —— */
const paletteCache = {};   // 每個系列的代表色（RGB 陣列），預先算好

// #rgb / #rrggbb → [r,g,b]
function hexToRgb(hex) {
    let h = hex.replace("#", "");
    if (h.length === 3) {
        h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    }
    const n = parseInt(h.slice(0, 6), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// 把圖畫進小 canvas 取平均色
function averageColor(img) {
    try {
        const n = 24;
        const c = document.createElement("canvas");
        c.width = n;
        c.height = n;
        const ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0, n, n);
        const data = ctx.getImageData(0, 0, n, n).data;
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] < 125) {
                continue;
            }
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count++;
        }
        if (!count) {
            return null;
        }
        return [Math.round(r / count), Math.round(g / count), Math.round(b / count)];
    } catch (e) {
        return null;   // 跨網域圖會讀不到，安全略過
    }
}

// 把顏色往白(amt>0)或黑(amt<0)推
function shade(rgb, amt) {
    const target = amt < 0 ? 0 : 255;
    const p = Math.abs(amt);
    return "rgb(" +
        Math.round(rgb[0] + (target - rgb[0]) * p) + " " +
        Math.round(rgb[1] + (target - rgb[1]) * p) + " " +
        Math.round(rgb[2] + (target - rgb[2]) * p) + ")";
}

// 預先算好某系列的代表色（圖 → 平均色；漸變 → 其中 hex 的平均）
function computePalette(series) {
    const cover = series.cover || "";
    const m = cover.match(/url\((['"]?)(.*?)\1\)/);
    if (m) {
        const img = new Image();
        img.onload = function () {
            const c = averageColor(img);
            if (c) {
                paletteCache[series.id] = c;
                if (committedSeriesId === series.id) {
                    syncPalette();   // reload 進到此系列、圖晚點才載入時補上
                }
            }
        };
        img.src = m[2];
        return;
    }
    const hexes = cover.match(/#[0-9a-fA-F]{3,8}/g);
    if (hexes && hexes.length) {
        const rgbs = hexes.map(hexToRgb);
        paletteCache[series.id] = [0, 1, 2].map(function (k) {
            return Math.round(rgbs.reduce(function (s, c) { return s + c[k]; }, 0) / rgbs.length);
        });
    }
}

// 套用 / 還原背景色
function applyPalette(id) {
    const base = paletteCache[id];
    if (!base) {
        return;
    }
    bgEl.style.setProperty("--bg-1", shade(base, 0.45));
    bgEl.style.setProperty("--bg-2", shade(base, 0));
    bgEl.style.setProperty("--bg-3", shade(base, -0.35));
    bgEl.style.setProperty("--bg-4", shade(base, -0.6));
}

function clearPalette() {
    ["--bg-1", "--bg-2", "--bg-3", "--bg-4"].forEach(function (v) {
        bgEl.style.removeProperty(v);
    });
}

let committedSeriesId = null;   // 已進入的系列（決定內頁底色）
let currentSeries = null;   // 目前開啟的系列
let visibleSeriesId = null;   // 手機系列牆目前置中的封面

// 依目前狀態還原底色：內頁 → 該系列主題色；首頁 → 預設
function syncPalette() {
    if (committedSeriesId) {
        applyPalette(committedSeriesId);
    } else if (isMobile() && visibleSeriesId) {
        applyPalette(visibleSeriesId);   // 手機系列牆：跟著目前置中的封面
    } else {
        clearPalette();
    }
}

function isMobile() {
    return window.matchMedia("(max-width: 700px)").matches;
}


/* 03 —— 導覽：左右滑動 + 網址 hash（可分享、reload 還原） —— */
const track = document.getElementById("track");
const panels = Array.prototype.slice.call(document.querySelectorAll(".panel"));
let level = 0;

// 只讓目前這一頁可互動；其餘設為 inert（不可聚焦、不可點、不會被捲進畫面）
function updatePanels() {
    panels.forEach(function (panel, i) {
        panel.inert = (i !== level);
        panel.setAttribute("aria-hidden", i === level ? "false" : "true");
    });
}

function setLevel(n) {
    level = n;
    track.style.setProperty("--level", n);
    if (n === 0) {
        playerEl.innerHTML = "";
        currentSeries = null;
    }
    if (document.activeElement && document.activeElement.blur) {
        document.activeElement.blur();
    }
    updatePanels();
}

// 解析 hash：'' → 首頁；'seriesId' → Volume 列表；'seriesId/index' → 播放器
function parseHash() {
    const raw = location.hash.replace(/^#/, "");
    if (!raw) {
        return { level: 0 };
    }
    const parts = raw.split("/");
    const series = SERIES.find(function (s) {
        return s.id === parts[0];
    });
    if (!series) {
        return { level: 0 };
    }
    const idx = parts.length >= 2 ? parseInt(parts[1], 10) : 0;
    return { level: 1, series: series, index: idx >= 0 ? idx : 0 };
}

function applyRoute(instant) {
    const r = parseHash();
    if (r.level === 1) {
        renderDetail(r.series, r.index);
    }
    committedSeriesId = (r.level === 1) ? r.series.id : null;
    syncPalette();
    if (instant) {
        track.style.transition = "none";
        setLevel(r.level);
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                track.style.transition = "";
            });
        });
    } else {
        setLevel(r.level);
    }
}

// 點系列 → 寫入 hash（產生一筆歷史，返回鍵可用）
scatterEl.addEventListener("click", function (e) {
    const btn = e.target.closest(".series");
    if (btn) {
        committedSeriesId = btn.dataset.series;   // 立刻鎖定，避免閃爍
        syncPalette();
        location.hash = btn.dataset.series;
    }
});

// 點 Volume → 寫入 hash
volumesEl.addEventListener("click", function (e) {
    const btn = e.target.closest(".volume");
    if (!btn || !currentSeries) {
        return;
    }
    const i = parseInt(btn.dataset.index, 10);
    setActiveVolume(i);
    // 記住選到的 volume（reload / 分享用），但不新增歷史 → 返回仍直接回系列牆
    history.replaceState(history.state, "", "#" + currentSeries.id + "/" + i);
});

// ← 返回鍵、品牌回首頁：一律走瀏覽器歷史
document.addEventListener("click", function (e) {
    if (e.target.closest("[data-back]")) {
        history.back();
    }
    if (e.target.closest("[data-home]") && level > 0) {
        history.go(-level);
    }
});

// Esc 返回上一層
document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && level > 0) {
        history.back();
    }
});

// hash 變化（含返回 / 前進）→ 更新畫面
window.addEventListener("hashchange", function () {
    applyRoute(false);
});

// 手機系列牆：偵測目前置中的封面 → 背景跟著變色
const wallObserver = new IntersectionObserver(function (entries) {
    if (!isMobile() || level !== 0) {
        return;
    }
    entries.forEach(function (entry) {
        if (entry.isIntersecting) {
            visibleSeriesId = entry.target.dataset.series;
            syncPalette();
        }
    });
}, { root: scatterEl, rootMargin: "-45% 0px -45% 0px", threshold: 0 });

renderScatter();
applyRoute(true);


/* 04 —— 背景流動漸變：切到別的分頁時暫停 —— */
if (bgEl) {
    document.addEventListener("visibilitychange", function () {
        bgEl.classList.toggle("is-paused", document.hidden);
    });
}


/* —— 導覽 + 泡泡：點一下展開 / 收合（觸控用） —— */
const menuEl = document.querySelector(".menu");
if (menuEl) {
    const plusEl = menuEl.querySelector(".menu__plus");
    plusEl.addEventListener("click", function (e) {
        e.stopPropagation();
        menuEl.classList.toggle("is-open");
    });
    // 點泡泡以外的地方就收合
    document.addEventListener("click", function (e) {
        if (!menuEl.contains(e.target)) {
            menuEl.classList.remove("is-open");
        }
    });
}