# 播放器比較與目標達成度分析

## 三種播放器概覽

本專案實作了三種不同的影片播放器方案，皆透過 Cloudflare Stream 提供 HLS 串流影片來源。

| 項目 | Cloudflare Stream | Video.js v8 | @videojs/react (v10 Beta) |
|------|-------------------|-------------|---------------------------|
| 套件 | `@cloudflare/stream-react` | `video.js` + 外掛 | `@videojs/react` |
| 渲染方式 | iframe 嵌入 | 原生 `<video>` + MSE | 原生 `<video>` + hls.js |
| 架構風格 | 宣告式（React 元件） | 命令式（Player 實例） | 宣告式（Store + React 元件） |
| 成熟度 | 穩定（正式版） | 穩定（正式版） | **Beta（v10.0.0-beta.13）** |

---

## 目標達成度

### 目標一：跨瀏覽器的支援度

| 播放器 | 達成度 | 說明 |
|--------|--------|------|
| Cloudflare Stream | ✅ 最佳 | 由 Cloudflare 負責所有瀏覽器相容性處理，透過 iframe 嵌入，開發者無需處理任何瀏覽器差異。支援所有主流瀏覽器（Chrome、Firefox、Safari、Edge）及行動裝置。 |
| Video.js v8 | ✅ 良好 | 成熟的開源播放器，內建 VHS（Video.js HTTP Streaming）處理 HLS，設定 `overrideNative: true` 可在所有瀏覽器上統一使用 MSE（Media Source Extensions）播放。廣泛支援桌面與行動瀏覽器。 |
| @videojs/react | ⚠️ 良好但有風險 | 底層使用 hls.js 處理 HLS 串流，瀏覽器支援度本身沒問題。但套件仍為 Beta 版，API 可能變動，不建議直接用於正式環境。 |

### 目標二：根據網速決定播放畫質 / 手動切換畫質

| 播放器 | 達成度 | 說明 |
|--------|--------|------|
| Cloudflare Stream | ✅ 完全達成 | **自動 ABR**（Adaptive Bitrate）由 Cloudflare 內建處理，會根據網速自動調整畫質。播放器控制列上**原生提供畫質選擇器**，使用者可手動切換畫質，無需額外開發。 |
| Video.js v8 | ✅ 完全達成 | 需額外安裝 `videojs-hls-quality-selector` + `videojs-contrib-quality-levels` 兩個外掛套件才能實現。安裝後控制列上會顯示畫質選擇器，使用者可以手動選擇畫質（如 360p、720p、1080p），也支援自動 ABR 模式。 |
| @videojs/react | ⚠️ 部分達成 | 底層 hls.js **自動 ABR** 運作正常，會根據網速自動調整畫質。但**目前沒有提供手動選擇畫質的 UI 元件**，也沒有對應的外掛套件可安裝，若需手動切換畫質需完全自行開發。 |

### 目標三：影片不能輕易的被下載

| 播放器 | 達成度 | 說明 |
|--------|--------|------|
| Cloudflare Stream | ✅ 最佳 | iframe 沙盒機制使得使用者**無法直接存取底層的 `<video>` 元素**。搭配 Signed URLs / Signed Tokens 可限制影片存取權限（時間限制、IP 限制、域名限制）。雖然技術上仍可透過攔截網路請求取得 HLS 片段，但門檻最高。 |
| Video.js v8 | ⚠️ 一般 | 使用 HLS 串流本身比單一 MP4 檔案更難直接下載（影片被切成多個 `.ts` 片段）。但原生 `<video>` 元素暴露在 DOM 中，有經驗的使用者可透過瀏覽器開發者工具取得 manifest URL 並用工具下載。**無內建 DRM 支援**。 |
| @videojs/react | ⚠️ 一般 | 與 Video.js v8 相同，原生 `<video>` 元素暴露在 DOM 中，HLS manifest URL 可被攔截。可透過 `videoRef` 取得底層元素，但這也代表前端程式碼可被利用。**無內建 DRM 支援**。 |

> **備註：** 若需更高等級的影片保護，需考慮搭配 DRM（Digital Rights Management）方案，如 Widevine（Chrome/Firefox/Android）、FairPlay（Safari/iOS）、PlayReady（Edge）。Cloudflare Stream 有提供付費的 DRM 整合方案。

---

## 各播放器優缺點

### Cloudflare Stream（`@cloudflare/stream-react`）

**優點：**
- 🟢 零設定即可使用，Cloudflare 負責轉碼、CDN 分發、ABR
- 🟢 影片保護最佳（iframe 沙盒 + Signed URLs）
- 🟢 跨瀏覽器相容性完全由 Cloudflare 處理
- 🟢 **原生提供畫質選擇器**，使用者可手動切換畫質
- 🟢 內建分析面板（觀看次數、緩衝率等）
- 🟢 支援字幕與章節功能

**缺點：**
- 🔴 客製化程度有限（只能透過有限的 props 調整外觀）
- 🔴 完全依賴 Cloudflare 服務（供應商鎖定）
- 🔴 iframe 嵌入使得與外部 UI 的互動（如 seek）需要透過 `streamRef` API，行為有時不一致

---

### Video.js v8（`video.js`）

**優點：**
- 🟢 成熟穩定，社群龐大，文件齊全
- 🟢 **畫質選擇器完整可用**（需安裝 `videojs-hls-quality-selector` + `videojs-contrib-quality-levels` 外掛）
- 🟢 外掛生態系豐富（字幕、廣告、分析等）
- 🟢 原生支援 `<track kind="chapters">`，控制列會顯示章節選單
- 🟢 高度可客製化（主題、外掛、控制列元件）

**缺點：**
- 🔴 命令式 API，與 React 的宣告式風格不太搭配，需要手動管理生命週期
- 🔴 套件體積較大（~1.5MB 含外掛）
- 🔴 影片保護能力有限（DOM 可被檢視、manifest URL 可被攔截）
- 🔴 部分外掛（如 `videojs-hls-quality-selector`）缺乏 TypeScript 型別定義

---

### @videojs/react（`@videojs/react` v10 Beta）

**優點：**
- 🟢 React 原生架構（Store-based），與 React 生態系完美整合
- 🟢 內建 Tailwind CSS 皮膚（`VideoSkinTailwind`），易於客製化樣式
- 🟢 底層使用 hls.js，可透過 `hlsConfig` 精細調整 ABR 行為
- 🟢 `HlsVideo` 元件支援 `forwardRef`，可取得原生 `<video>` 元素進行操作
- 🟢 宣告式 API，不需手動管理播放器生命週期

**缺點：**
- 🔴 **仍為 Beta 版**（v10.0.0-beta.13），API 可能變動，不建議用於正式環境
- 🔴 **無畫質選擇器 UI**，也無對應外掛套件，需完全自行開發
- 🔴 文件與範例極少，學習與除錯成本較高
- 🔴 不支援原生 `<track kind="chapters">` 控制列顯示（需自行實作章節 UI）
- 🔴 影片保護能力與 Video.js v8 相同

---

## 總結比較表

| 評估項目 | Cloudflare Stream | Video.js v8 | @videojs/react v10 |
|----------|:-----------------:|:-----------:|:-------------------:|
| 跨瀏覽器支援 | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| 自動畫質調整（ABR） | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| 手動畫質選擇 | ⭐⭐⭐ | ⭐⭐⭐（需安裝外掛） | ❌（需自行開發） |
| 影片下載保護 | ⭐⭐⭐ | ⭐ | ⭐ |
| React 整合度 | ⭐⭐ | ⭐ | ⭐⭐⭐ |
| 客製化彈性 | ⭐ | ⭐⭐⭐ | ⭐⭐ |
| 套件成熟度 | ⭐⭐⭐ | ⭐⭐⭐ | ⭐（Beta） |
| 章節支援 | ⭐⭐ | ⭐⭐⭐ | ⭐ |

---

## 待確認問題

1. **章節（Chapters）格式與來源**
   - 目前章節資料是寫死在 `public/chapters.vtt` 檔案中，需要討論未來要用什麼格式與方式來提供章節資料。
   - 可行方案：
     - **WebVTT 格式（`.vtt`）**：標準格式，三種播放器皆可直接透過 `<track>` 元素載入。目前專案已使用此方案，並有 `parseVttChapters()` 工具函式解析。
     - **純文字或 JSON 格式**：由後端 API 提供，前端 parse 後渲染章節按鈕。彈性較高但需要額外開發。
   - 備註：目前只有 **Video.js v8** 在設定 `<track kind="chapters">` 時，會自動在控制列上顯示章節選單（原生支援）。Cloudflare Stream 和 @videojs/react 都需要依賴外部 UI（如目前的側邊欄章節按鈕）來操作章節跳轉。
