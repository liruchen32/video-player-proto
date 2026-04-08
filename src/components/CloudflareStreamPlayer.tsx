import { Stream, type StreamPlayerApi } from "@cloudflare/stream-react";
import {
  useState,
  useCallback,
  useRef,
  useImperativeHandle,
  type Ref,
} from "react";

export interface CloudflareStreamPlayerHandle {
  /** Seek to a specific time in seconds */
  seekTo: (time: number) => void;
  /** Get the underlying StreamPlayerApi (iframe element) */
  getStreamPlayer: () => StreamPlayerApi | undefined;
}

export interface CloudflareStreamPlayerProps {
  /**
   * Cloudflare Stream video ID or signed token.
   */
  videoId: string;

  /** Poster / thumbnail image URL */
  poster?: string;

  /** Autoplay the video (default: false) */
  autoplay?: boolean;

  /** Show controls (default: true) */
  controls?: boolean;

  /** Loop the video (default: false) */
  loop?: boolean;

  /** Mute the video (default: false) */
  muted?: boolean;

  /** Start playback at a specific time in seconds */
  startTime?: number;

  /** Letterbox color behind the video */
  letterboxColor?: string;

  /** Primary accent color for the player UI */
  primaryColor?: string;

  /** URL to a WebVTT chapters file */
  chaptersUrl?: string;

  /** Additional CSS class names on the wrapper div */
  className?: string;

  /** Callback when playback ends */
  onEnded?: () => void;

  /** Callback on time update with current time */
  onTimeUpdate?: (currentTime: number) => void;

  /** Callback on error */
  onError?: (error: Event) => void;

  /** Callback when stream is loaded and ready to play */
  onLoadedData?: () => void;

  /** Imperative handle ref for seeking, etc. */
  playerRef?: Ref<CloudflareStreamPlayerHandle>;
}

/**
 * A thin wrapper around the official `@cloudflare/stream-react` <Stream>
 * component with Tailwind styling, convenience callbacks and an optional
 * YouTube-style chapter track overlay.
 */
export default function CloudflareStreamPlayer({
  videoId,
  poster,
  autoplay = false,
  controls = true,
  loop = false,
  muted = false,
  startTime,
  letterboxColor,
  primaryColor = "#6366f1",
  className = "",
  onEnded,
  onTimeUpdate,
  onError,
  onLoadedData,
  playerRef,
}: CloudflareStreamPlayerProps) {
  const streamRef = useRef<StreamPlayerApi>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useImperativeHandle(playerRef, () => ({
    seekTo(time: number) {
      if (streamRef.current) {
        streamRef.current.currentTime = time;
        streamRef.current.play();
      }
    },
    getStreamPlayer() {
      return streamRef.current;
    },
  }));

  const handleLoadedData = useCallback(() => {
    setIsLoading(false);
    onLoadedData?.();
  }, [onLoadedData]);

  const handleTimeUpdate = useCallback(
    () => {
      if (streamRef.current) {
        onTimeUpdate?.(streamRef.current.currentTime ?? 0);
      }
    },
    [onTimeUpdate],
  );

  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl bg-black ${className}`}
    >
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white" />
        </div>
      )}

      <Stream
        src={videoId}
        poster={poster}
        autoplay={autoplay}
        controls={controls}
        loop={loop}
        muted={muted}
        startTime={startTime}
        letterboxColor={letterboxColor}
        primaryColor={primaryColor}
        responsive
        streamRef={streamRef}
        onLoadedData={handleLoadedData}
        onEnded={onEnded}
        onTimeUpdate={handleTimeUpdate}
        onError={onError}
      />
    </div>
  );
}