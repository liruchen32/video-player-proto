import { useEffect, useMemo, useRef, memo, type Ref } from "react";
import { createPlayer } from "@videojs/react";
import {
  VideoSkinTailwind,
  videoFeatures,
} from "@videojs/react/video";
import HlsVideo from "@videojs/react/media/hls-video";
import type { HlsVideoProps } from "@videojs/react/media/hls-video";

export type { HlsVideoProps };

export interface VideojsReactPlayerProps {
  /**
   * Cloudflare Stream video ID or a signed URL token.
   * The component builds the HLS manifest URL from this.
   */
  videoId: string;

  /**
   * Optional Cloudflare customer subdomain.
   * If provided the source becomes:
   *   https://<subdomain>.cloudflarestream.com/<videoId>/manifest/video.m3u8
   */
  customerSubdomain?: string;

  /**
   * Pass a fully-qualified source URL instead of building one from videoId.
   */
  src?: string;

  /** Poster / thumbnail image URL */
  poster?: string;

  /** Autoplay the video (default: false) */
  autoplay?: boolean;

  /** Loop the video (default: false) */
  loop?: boolean;

  /** Mute the video (default: false) */
  muted?: boolean;

  /**
   * Prefer `'mse'` (hls.js) or `'native'` (browser-built-in) HLS playback.
   * Defaults to `'mse'` when hls.js is supported, falls back to native.
   */
  preferPlayback?: "mse" | "native";

  /**
   * hls.js configuration object passed straight through to the underlying
   * hls.js instance.  Useful for tuning ABR, buffer lengths, etc.
   * @see https://github.com/video-dev/hls.js/blob/master/docs/API.md#fine-tuning
   */
  hlsConfig?: Record<string, unknown>;

  /** Enable hls.js debug logging in the console (default: false) */
  hlsDebug?: boolean;

  /** URL to a WebVTT chapters file (kind="chapters") */
  chaptersUrl?: string;

  /** URL to a WebVTT captions file */
  captionsUrl?: string;

  /** Label for the captions track */
  captionsLabel?: string;

  /** Language code for the captions track */
  captionsLang?: string;

  /** Additional CSS class names on the wrapper div */
  className?: string;

  /** Ref to the underlying HTMLVideoElement rendered by HlsVideo */
  videoRef?: Ref<HTMLVideoElement>;

  /** Callback when playback ends */
  onEnded?: () => void;

  /** Callback on time update with current time */
  onTimeUpdate?: (currentTime: number) => void;

  /** Callback on error */
  onError?: (error: { code: number; message: string } | null) => void;
}

// ── Build a Cloudflare Stream HLS manifest URL ────────────────────────
function buildStreamSrc(
  videoId: string,
  customerSubdomain?: string,
): string {
  const domain = customerSubdomain
    ? `${customerSubdomain}.cloudflarestream.com`
    : `customer-n7a55rvtlm2rnt4m.cloudflarestream.com`;
  return `https://${domain}/${videoId}/manifest/video.m3u8`;
}

// ── Create a Video.js 10 player instance (module-level, singleton) ────
const Player = createPlayer({ features: videoFeatures });

// ── Reactive bridge: forward store state to parent callbacks ──────────
// Uses refs so the callbacks never change identity and never cause
// the parent (or sibling player tree) to re-render.
function PlayerCallbacks({
  onTimeUpdateRef,
  onEndedRef,
  onErrorRef,
}: {
  onTimeUpdateRef: React.RefObject<VideojsReactPlayerProps["onTimeUpdate"] | undefined>;
  onEndedRef: React.RefObject<VideojsReactPlayerProps["onEnded"] | undefined>;
  onErrorRef: React.RefObject<VideojsReactPlayerProps["onError"] | undefined>;
}) {
  const currentTime = Player.usePlayer((s) => s.currentTime);
  const ended = Player.usePlayer((s) => s.ended);
  const error = Player.usePlayer((s) => s.error);

  useEffect(() => {
    onTimeUpdateRef.current?.(currentTime);
  }, [currentTime, onTimeUpdateRef]);

  useEffect(() => {
    if (ended) onEndedRef.current?.();
  }, [ended, onEndedRef]);

  useEffect(() => {
    if (error) onErrorRef.current?.(error);
  }, [error, onErrorRef]);

  return null;
}

// ── The inner player tree that must NOT remount on parent re-renders ──
const PlayerInner = memo(function PlayerInner({
  resolvedSrc,
  poster,
  autoplay,
  loop,
  muted,
  preferPlayback,
  hlsConfig,
  hlsDebug,
  chaptersUrl,
  captionsUrl,
  captionsLabel,
  captionsLang,
  className,
  videoRef,
  onTimeUpdateRef,
  onEndedRef,
  onErrorRef,
}: {
  resolvedSrc: string;
  poster?: string;
  autoplay: boolean;
  loop: boolean;
  muted: boolean;
  preferPlayback?: "mse" | "native";
  hlsConfig?: Record<string, unknown>;
  hlsDebug?: boolean;
  chaptersUrl?: string;
  captionsUrl?: string;
  captionsLabel: string;
  captionsLang: string;
  className: string;
  videoRef?: Ref<HTMLVideoElement>;
  onTimeUpdateRef: React.RefObject<VideojsReactPlayerProps["onTimeUpdate"] | undefined>;
  onEndedRef: React.RefObject<VideojsReactPlayerProps["onEnded"] | undefined>;
  onErrorRef: React.RefObject<VideojsReactPlayerProps["onError"] | undefined>;
}) {
  return (
    <Player.Provider>
      <div className={`relative w-full overflow-hidden rounded-xl ${className}`}>
        <VideoSkinTailwind poster={poster}>
          <HlsVideo
            ref={videoRef}
            src={resolvedSrc}
            preload="metadata"
            crossOrigin="anonymous"
            autoPlay={autoplay}
            loop={loop}
            muted={muted}
            preferPlayback={preferPlayback}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            config={hlsConfig as Record<string, any>}
            debug={hlsDebug}
          >
            {chaptersUrl && (
              <track
                kind="chapters"
                src={chaptersUrl}
                srcLang="en"
                label="Chapters"
                default
              />
            )}
            {captionsUrl && (
              <track
                kind="captions"
                src={captionsUrl}
                srcLang={captionsLang}
                label={captionsLabel}
                default
              />
            )}
          </HlsVideo>
        </VideoSkinTailwind>
      </div>

      {/* Reactive bridge — forwards store state to parent callbacks */}
      <PlayerCallbacks
        onTimeUpdateRef={onTimeUpdateRef}
        onEndedRef={onEndedRef}
        onErrorRef={onErrorRef}
      />
    </Player.Provider>
  );
});

// ── Main component ────────────────────────────────────────────────────
export default function VideojsReactPlayer({
  videoId,
  customerSubdomain,
  src,
  poster,
  autoplay = false,
  loop = false,
  muted = false,
  preferPlayback,
  hlsConfig,
  hlsDebug = false,
  chaptersUrl,
  captionsUrl,
  captionsLabel = "English",
  captionsLang = "en",
  className = "",
  videoRef,
  onEnded,
  onTimeUpdate,
  onError,
}: VideojsReactPlayerProps) {
  const resolvedSrc = useMemo(
    () => src ?? buildStreamSrc(videoId, customerSubdomain),
    [src, videoId, customerSubdomain],
  );

  // Stable refs — these never change identity, so PlayerInner never
  // re-renders when the parent state (e.g. currentTime) updates.
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onEndedRef = useRef(onEnded);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate;
    onEndedRef.current = onEnded;
    onErrorRef.current = onError;
  });

  return (
    <PlayerInner
      resolvedSrc={resolvedSrc}
      poster={poster}
      autoplay={autoplay}
      loop={loop}
      muted={muted}
      preferPlayback={preferPlayback}
      hlsConfig={hlsConfig}
      hlsDebug={hlsDebug}
      chaptersUrl={chaptersUrl}
      captionsUrl={captionsUrl}
      captionsLabel={captionsLabel}
      captionsLang={captionsLang}
      className={className}
      videoRef={videoRef}
      onTimeUpdateRef={onTimeUpdateRef}
      onEndedRef={onEndedRef}
      onErrorRef={onErrorRef}
    />
  );
}
