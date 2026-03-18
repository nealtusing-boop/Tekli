export function getWeekStartDate(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday
  const diff = day === 0 ? -6 : 1 - day;

  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + diff);

  return d.toISOString().split("T")[0];
}

export function subtractOneWeek(weekStartDate: string) {
  const d = new Date(`${weekStartDate}T00:00:00`);
  d.setDate(d.getDate() - 7);
  return d.toISOString().split("T")[0];
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

export function formatSeconds(totalSeconds?: number | null) {
  if (totalSeconds === null || totalSeconds === undefined) return "—";

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const paddedSeconds = String(seconds).padStart(2, "0");

  if (hours > 0) {
    const paddedMinutes = String(minutes).padStart(2, "0");
    return `${hours}:${paddedMinutes}:${paddedSeconds}`;
  }

  return `${minutes}:${paddedSeconds}`;
}

export function weekdayLabel(day: number) {
  const labels = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  return labels[day] || "Unknown";
}