import { useRef, useEffect, useCallback } from "react";
import videojs from "video.js";
import type Player from "video.js/dist/types/player";
import "video.js/dist/video-js.css";

// HLS quality selector plugin — auto-registers on videojs
import "videojs-contrib-quality-levels";
import "videojs-hls-quality-selector";

export interface VideoPlayerProps {
  /**
   * Cloudflare Stream video ID or a signed URL token.
   * The component builds the HLS manifest URL from this.
   */
  videoId: string;

  /**
   * Optional Cloudflare customer subdomain for signed URLs.
   * If provided the source becomes:
   *   https://<subdomain>.cloudflarestream.com/<videoId>/manifest/video.m3u8
   * Otherwise the default customer domain is used:
   *   https://customer-<id>.cloudflarestream.com/<videoId>/manifest/video.m3u8
   *
   * You can also pass a full manifest URL directly via `src` to override.
   */
  customerSubdomain?: string;

  /**
   * If you want to pass a fully-qualified source URL instead of
   * building one from videoId, use this prop.
   */
  src?: string;

  /** Poster / thumbnail image URL */
  poster?: string;

  /** Autoplay the video (default: false) */
  autoplay?: boolean;

  /** Show native controls (default: true) */
  controls?: boolean;

  /** Loop the video (default: false) */
  loop?: boolean;

  /** Mute the video (default: false) */
  muted?: boolean;

  /** Start playback at a specific time in seconds */
  startTime?: number;

  /** Fluid mode – scales to container width (default: true) */
  fluid?: boolean;

  /** Aspect ratio string e.g. "16:9" */
  aspectRatio?: string;

  /** URL to a WebVTT chapters file (kind="chapters") */
  chaptersUrl?: string;

  /** Additional CSS class names on the wrapper div */
  className?: string;

  /** Callback when the player is ready */
  onReady?: (player: Player) => void;

  /** Callback when playback ends */
  onEnded?: () => void;

  /** Callback on time update with current time */
  onTimeUpdate?: (currentTime: number) => void;

  /** Callback on error */
  onError?: (error: unknown) => void;
}

/**
 * Build a Cloudflare Stream HLS manifest URL from a video ID.
 */
function buildStreamSrc(
  videoId: string,
  customerSubdomain?: string
): string {
  const domain = customerSubdomain
    ? `${customerSubdomain}.cloudflarestream.com`
    : `customer-n7a55rvtlm2rnt4m.cloudflarestream.com`;
  return `https://${domain}/${videoId}/manifest/video.m3u8`;
}

export default function VideoPlayer({
  videoId,
  customerSubdomain,
  src,
  poster,
  autoplay = false,
  controls = true,
  loop = false,
  muted = false,
  startTime,
  fluid = true,
  aspectRatio = "16:9",
  chaptersUrl,
  className = "",
  onReady,
  onEnded,
  onTimeUpdate,
  onError,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Player | null>(null);

  const resolvedSrc = src ?? buildStreamSrc(videoId, customerSubdomain);

  // stable callback refs ------------------------------------------------
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;
  const onTimeUpdateRef = useRef(onTimeUpdate);
  onTimeUpdateRef.current = onTimeUpdate;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const initPlayer = useCallback(() => {
    if (!videoRef.current) return;

    const player = videojs(videoRef.current, {
      autoplay,
      controls,
      loop,
      muted,
      fluid,
      aspectRatio,
      responsive: true,
      poster,
      html5: {
        vhs: {
          overrideNative: true,
        },
        nativeAudioTracks: false,
        nativeVideoTracks: false,
      },
      sources: [
        {
          src: resolvedSrc,
          type: "application/x-mpegURL",
        },
      ],
    });

    player.ready(() => {
      playerRef.current = player;

      if (startTime) {
        player.currentTime(startTime);
      }

      // Activate HLS quality selector menu in control bar
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (player as any).hlsQualitySelector({
        displayCurrentQuality: true,
      });

      onReadyRef.current?.(player);
    });

    player.on("ended", () => onEndedRef.current?.());
    player.on("timeupdate", () =>
      onTimeUpdateRef.current?.(player.currentTime() ?? 0)
    );
    player.on("error", () => onErrorRef.current?.(player.error()));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedSrc]);

  // Mount / unmount ------------------------------------------------------
  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current) {
      initPlayer();
    }

    return () => {
      const player = playerRef.current;
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [initPlayer]);

  // Update source if it changes ------------------------------------------
  useEffect(() => {
    const player = playerRef.current;
    if (player && !player.isDisposed()) {
      player.src({ src: resolvedSrc, type: "application/x-mpegURL" });
    }
  }, [resolvedSrc]);

  return (
    <div data-vjs-player className={`relative ${className}`}>
      <video
        ref={videoRef}
        className="video-js vjs-big-play-centered"
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
      </video>
    </div>
  );
}
