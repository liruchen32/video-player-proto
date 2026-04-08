/**
 * Parse a WebVTT file and return an array of chapter cues.
 */
export interface ChapterCue {
  startTime: number; // seconds
  endTime: number; // seconds
  title: string;
}

/**
 * Parse a time string "HH:MM:SS.mmm" into seconds.
 */
function parseVttTime(timeStr: string): number {
  const parts = timeStr.trim().split(":");
  let hours = 0,
    minutes = 0,
    seconds = 0;

  if (parts.length === 3) {
    hours = parseFloat(parts[0]);
    minutes = parseFloat(parts[1]);
    seconds = parseFloat(parts[2]);
  } else if (parts.length === 2) {
    minutes = parseFloat(parts[0]);
    seconds = parseFloat(parts[1]);
  }

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Fetch and parse a WebVTT chapters file into ChapterCue[].
 */
export async function parseVttChapters(url: string): Promise<ChapterCue[]> {
  const res = await fetch(url);
  const text = await res.text();
  const chapters: ChapterCue[] = [];

  // Split by blank lines
  const blocks = text.split(/\n\s*\n/);

  for (const block of blocks) {
    const lines = block.trim().split("\n");

    // Find the line with the arrow " --> "
    const timeLine = lines.find((l) => l.includes("-->"));
    if (!timeLine) continue;

    const [startStr, endStr] = timeLine.split("-->");
    const startTime = parseVttTime(startStr);
    const endTime = parseVttTime(endStr);

    // Everything after the time line is the title
    const timeIdx = lines.indexOf(timeLine);
    const title = lines
      .slice(timeIdx + 1)
      .join(" ")
      .trim();

    if (title) {
      chapters.push({ startTime, endTime, title });
    }
  }

  return chapters;
}
