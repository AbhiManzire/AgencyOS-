export function formatElapsedHms(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (value: number): string => String(value).padStart(2, '0');

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function computeElapsedSeconds(startTimeIso: string, nowMs: number = Date.now()): number {
  const elapsedMs = nowMs - new Date(startTimeIso).getTime();
  return Math.max(0, Math.floor(elapsedMs / 1000));
}
