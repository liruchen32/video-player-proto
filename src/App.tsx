import { useEffect, useRef, useState } from "react";
import { VideoPlayer } from "./components";
import { CloudflareStreamPlayer } from "./components";
import type { CloudflareStreamPlayerHandle } from "./components";
import { VideojsReactPlayer } from "./components";
import { parseVttChapters, type ChapterCue } from "./components/parseVttChapters";
import type Player from "video.js/dist/types/player";

// ── Demo video ──────────────────────────────────────────────────────
const VIDEO_ID = "cb89cf7ae6c71adc9555fc57a78c60e3";
const VIDEO_TITLE = "大罷免測試影片";
const VIDEO_DESC = "測試一下，拿來測試，測試播放影片啦";
const CHAPTERS_URL = "/chapters.vtt";

type PlayerMode = "videojs" | "stream" | "vjsreact";

function App() {
  const [playerMode, setPlayerMode] = useState<PlayerMode>("stream");
  const [currentTime, setCurrentTime] = useState(0);
  const [chapters, setChapters] = useState<ChapterCue[]>([]);

  // Player refs for seeking
  const vjsPlayerRef = useRef<Player | null>(null);
  const cfPlayerRef = useRef<CloudflareStreamPlayerHandle>(null);
  const vjsReactVideoRef = useRef<HTMLVideoElement>(null);

  // Fetch chapters from VTT
  useEffect(() => {
    parseVttChapters(CHAPTERS_URL).then(setChapters).catch(console.error);
  }, []);

  // Seek the active player to a given time and autoplay
  const seekTo = (time: number) => {
    switch (playerMode) {
      case "videojs": {
        const player = vjsPlayerRef.current;
        if (player) {
          player.currentTime(time);
          player.play();
        }
        break;
      }
      case "stream":
        cfPlayerRef.current?.seekTo(time);
        break;
      case "vjsreact": {
        const video = vjsReactVideoRef.current;
        if (video) {
          video.currentTime = time;
          video.play();
        }
        break;
      }
    }
  };

  // Find the currently active chapter
  const activeChapterIndex = chapters.findIndex(
    (ch) => currentTime >= ch.startTime && currentTime < ch.endTime,
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-950 via-gray-900 to-gray-950 text-gray-100">
      {/* ── Header ───────────────────────────────────────────── */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-indigo-400">▶</span> Video Player Proto
          </h1>

          {/* Player mode toggle */}
          <div className="flex items-center gap-2 rounded-lg bg-white/5 p-1 text-sm">
            <button
              onClick={() => { setPlayerMode("stream"); setCurrentTime(0); }}
              className={`rounded-md px-3 py-1.5 font-medium transition ${
                playerMode === "stream"
                  ? "bg-indigo-500 text-white shadow"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              CF Stream
            </button>
            <button
              onClick={() => { setPlayerMode("videojs"); setCurrentTime(0); }}
              className={`rounded-md px-3 py-1.5 font-medium transition ${
                playerMode === "videojs"
                  ? "bg-indigo-500 text-white shadow"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Video.js
            </button>
            <button
              onClick={() => { setPlayerMode("vjsreact"); setCurrentTime(0); }}
              className={`rounded-md px-3 py-1.5 font-medium transition ${
                playerMode === "vjsreact"
                  ? "bg-indigo-500 text-white shadow"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              VJS React
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ─────────────────────────────────────────────── */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          {/* Player area */}
          <div className="space-y-4">
            <div className="overflow-hidden rounded-xl border border-white/10 bg-black shadow-2xl">
              {playerMode === "stream" ? (
                <CloudflareStreamPlayer
                  videoId={VIDEO_ID}
                  controls
                  primaryColor="#6366f1"
                  chaptersUrl={CHAPTERS_URL}
                  playerRef={cfPlayerRef}
                  onTimeUpdate={setCurrentTime}
                  onEnded={() => console.log("Video ended")}
                />
              ) : playerMode === "vjsreact" ? (
                <VideojsReactPlayer
                  videoId={VIDEO_ID}
                  chaptersUrl={CHAPTERS_URL}
                  videoRef={vjsReactVideoRef}
                  onTimeUpdate={setCurrentTime}
                  onEnded={() => console.log("Video ended")}
                />
              ) : (
                <VideoPlayer
                  videoId={VIDEO_ID}
                  controls
                  autoplay={false}
                  chaptersUrl={CHAPTERS_URL}
                  onReady={(player) => {
                    vjsPlayerRef.current = player;
                  }}
                  onTimeUpdate={setCurrentTime}
                  onEnded={() => console.log("Video ended")}
                />
              )}
            </div>

            {/* Now-playing info */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">{VIDEO_TITLE}</h2>
                <p className="text-sm text-gray-400">{VIDEO_DESC}</p>
              </div>
              <span className="shrink-0 rounded-md bg-white/5 px-3 py-1 font-mono text-xs text-gray-400">
                {formatTime(currentTime)}
              </span>
            </div>
          </div>

          {/* Sidebar – chapters */}
          <aside className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Chapters
            </h3>
            {chapters.length === 0 && (
              <p className="text-sm text-gray-500">No chapters available</p>
            )}
            {chapters.map((ch, idx) => (
              <button
                key={idx}
                onClick={() => seekTo(ch.startTime)}
                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ${
                  idx === activeChapterIndex
                    ? "border-indigo-500 bg-indigo-500/10"
                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                }`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-gray-300">
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{ch.title}</p>
                  <p className="text-xs text-gray-500">
                    {formatTime(ch.startTime)} – {formatTime(ch.endTime)}
                  </p>
                </div>
                {idx === activeChapterIndex && (
                  <span className="shrink-0 text-xs font-semibold text-indigo-400">
                    ▶ NOW
                  </span>
                )}
              </button>
            ))}
          </aside>
        </div>
      </main>
    </div>
  );
}

/** Format seconds → mm:ss */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default App;
