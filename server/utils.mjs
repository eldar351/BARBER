export function nowIso() {
  return new Date().toISOString();
}

export function minutesFromTime(time) {
  const [h, m] = String(time).split(':').map(Number);
  return h * 60 + m;
}

export function timeFromMinutes(total) {
  const h = Math.floor(total / 60).toString().padStart(2, '0');
  const m = (total % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}
