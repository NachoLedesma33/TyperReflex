// Formats a duration in seconds as hh:mm:ss for the results screen.

export function formatTime(totalSeconds: number): string {
  const secs = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const seconds = secs % 60;
  const pad = (value: number): string => String(value).padStart(2, "0");

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}
