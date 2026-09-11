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
            { title: "Vol. 1 — Nightcall", meta: "32 tracks", spotify: "096fjisZoDUSwSpAJrswnX" },
            { title: "Vol. 2 — Neon", meta: "28 tracks", spotify: "PLAYLIST_ID" },
            { title: "Vol. 3 — Afterglow", meta: "24 tracks", spotify: "PLAYLIST_ID" }
        ]
    },
    {
        id: "mellow-bars",
        title: "mellow bars",
        cover: "url(images/mellow-bars.webp) center/cover",
        volumes: [
            { title: "Vol. 1", meta: "10 tracks", spotify: "https://open.spotify.com/playlist/6fxGOLkUeroXa5b9LBdJaP?si=847b0e5974bf4742" },
            { title: "Vol. 2", meta: "10 tracks", spotify: "https://open.spotify.com/playlist/56dkNieDonnb7tqOMNmZBF?si=38b8eb7914044a48" },
            { title: "Vol. 3", meta: "10 tracks", spotify: "https://open.spotify.com/playlist/4TEIWRetVbO5J9fMJr68w7?si=c1812b302dae4ee2" },
            { title: "Vol. 4", meta: "10 tracks", spotify: "https://open.spotify.com/playlist/2vmE4jAnGgQ76nw5pbFR52?si=4007cefb0fa24343" },
            { title: "Vol. 5", meta: "10 tracks", spotify: "https://open.spotify.com/playlist/0ezMxUDf356GSV7CIa7tDk?si=62f2ff5d08d749ea" },
            { title: "Vol. 6", meta: "10 tracks", spotify: "https://open.spotify.com/playlist/3y0W2onJmuMYq6mffo2Xwb?si=aee73f85b63242ff" },
            { title: "Vol. 7", meta: "10 tracks", spotify: "https://open.spotify.com/playlist/39YFGNcfTPAeyXgvVCMtgG?si=e55456628b7e4e81" },
            { title: "Vol. 8", meta: "10 tracks", spotify: "https://open.spotify.com/playlist/6zayQDaTx1bE1CGqDEIvIr?si=a0368bc6cde643ec" },
            { title: "Vol. 9", meta: "10 tracks", spotify: "https://open.spotify.com/playlist/4OlY9DzwVk9ml8x6uhTv4p?si=90a45c0ccd4c42f7" }
        ]
    },
    {
        id: "summer-jam-mixtape",
        title: "summer jam mixtape",
        cover: "url(images/summer-jam-mixtape.webp) center/cover",
        volumes: [
            { title: "Vol. 1 — Rooftop", meta: "18 tracks", spotify: "PLAYLIST_ID" }
        ]
    },
    {
        id: "flying-melodies",
        title: "flying melodies",
        cover: "url(images/flying-melodies.webp) center/cover",
        volumes: [
            { title: "Vol. 1", meta: "10 tracks", spotify: "1OMuKzoymTfBg1dDIH6sAT" },
            { title: "Vol. 2 — Sunrise", meta: "26 tracks", spotify: "PLAYLIST_ID" }
        ]
    }
];


/* 02 —— 版面組建 —— */
const scatterEl = document.getElementById("scatter");
const volumesEl = document.getElementById("volumes");
const playerEl = document.getElementById("player");
const seriesTitleEl = document.getElementById("seriesTitle");
const volumeTitleEl = document.getElementById("volumeTitle");
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
    });
}

// 依系列建立 Volume 列表
function renderVolumes(series) {
    seriesTitleEl.textContent = series.title;
    volumesEl.innerHTML = "";
    series.volumes.forEach(function (vol, i) {
        const num = String(i + 1).padStart(2, "0");
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "volume";
        btn.dataset.series = series.id;
        btn.dataset.index = i;
        btn.innerHTML =
            '<span class="volume__index">' + num + '</span>' +
            '<span class="volume__title">' + vol.title + '</span>' +
            '<span class="volume__meta">' + (vol.meta || "") + '</span>';
        volumesEl.appendChild(btn);
    });
}

// 從「純ID / 帶?si= / 完整分享連結」取出乾淨的 playlist ID
function cleanPlaylistId(idOrUrl) {
    const s = String(idOrUrl).trim();
    const m = s.match(/playlist\/([A-Za-z0-9]+)/);
    return m ? m[1] : s.split("?")[0];
}

// 注入 Spotify 播放器
function renderPlayer(title, spotifyId) {
    const id = cleanPlaylistId(spotifyId);
    volumeTitleEl.textContent = title;
    playerEl.innerHTML =
        '<iframe src="https://open.spotify.com/embed/playlist/' + id + '?utm_source=generator" ' +
        'width="100%" height="480" loading="lazy" ' +
        'allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" ' +
        'title="Spotify 播放器"></iframe>';
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

// 依目前狀態還原底色：內頁 → 該系列主題色；首頁 → 預設
function syncPalette() {
    if (committedSeriesId) {
        applyPalette(committedSeriesId);
    } else {
        clearPalette();
    }
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
    if (n < 2) {
        playerEl.innerHTML = "";     // 離開播放器 → 停播
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
    if (parts.length >= 2) {
        const idx = parseInt(parts[1], 10);
        if (series.volumes[idx]) {
            return { level: 2, series: series, index: idx };
        }
        return { level: 1, series: series };
    }
    return { level: 1, series: series };
}

// 依 hash 還原畫面；instant=true 時首次載入不播滑動動畫（避免一進來就大滑一段）
function applyRoute(instant) {
    const r = parseHash();
    if (r.level >= 1) {
        renderVolumes(r.series);
    }
    if (r.level === 2) {
        const vol = r.series.volumes[r.index];
        renderPlayer(vol.title, vol.spotify);
    }
    committedSeriesId = (r.level >= 1) ? r.series.id : null;   // 內頁鎖該系列色、首頁還原預設
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
    if (btn) {
        location.hash = btn.dataset.series + "/" + btn.dataset.index;
    }
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

renderScatter();
applyRoute(true);


/* 04 —— 背景流動漸變：切到別的分頁時暫停 —— */
if (bgEl) {
    document.addEventListener("visibilitychange", function () {
        bgEl.classList.toggle("is-paused", document.hidden);
    });
}