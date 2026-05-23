const FIELD_LABELS = {
  email: 'האימייל',
  password: 'הסיסמה',
  customerName: 'השם',
  customerPhone: 'הטלפון',
  customerEmail: 'האימייל',
  code: 'קוד האימות',
  barberId: 'נותן השירות',
  serviceId: 'השירות',
  date: 'התאריך',
  time: 'השעה',
  notes: 'ההערות',
  name: 'השם',
  description: 'התיאור',
  durationMin: 'משך השירות',
  price: 'המחיר',
  imageUrl: 'קישור התמונה',
  linkedBarberIds: 'נותני השירות',
  specialty: 'ההתמחות',
  rating: 'הדירוג',
  schedules: 'שעות הפעילות',
  exceptions: 'החריגים',
  dayStartMinutes: 'שעת ההתחלה',
  dayEndMinutes: 'שעת הסיום',
  slotIntervalMinutes: 'מרווח הזמנים',
  heroBadgeText: 'טקסט התגית',
  heroTitle: 'כותרת הדף',
  heroSubtitle: 'תיאור הדף',
  startDate: 'תאריך ההתחלה',
  endDate: 'תאריך הסיום',
  days: 'מספר הימים',
};

function fieldLabel(path = []) {
  const key = path[path.length - 1];
  return FIELD_LABELS[key] || 'השדה';
}

function formatIssue(issue) {
  if (!issue) return 'נתונים לא תקינים.';
  if (issue.message && !String(issue.message).startsWith('Invalid ') && !String(issue.message).startsWith('Too ')) {
    return issue.message;
  }

  const label = fieldLabel(issue.path);

  switch (issue.code) {
    case 'too_small':
      if (issue.origin === 'string') return `${label} קצר מדי.`;
      if (issue.origin === 'array') return `יש לבחור לפחות ערך אחד עבור ${label}.`;
      return `${label} קטן מדי.`;
    case 'too_big':
      if (issue.origin === 'string') return `${label} ארוך מדי.`;
      return `${label} גדול מדי.`;
    case 'invalid_type':
      return `${label} לא תקין.`;
    case 'invalid_value':
      return `${label} לא תקין.`;
    case 'invalid_format':
      if (issue.path?.[issue.path.length - 1] === 'email') return 'יש להזין כתובת אימייל תקינה.';
      if (issue.path?.[issue.path.length - 1] === 'date') return 'יש להזין תאריך תקין.';
      if (issue.path?.[issue.path.length - 1] === 'time') return 'יש להזין שעה תקינה.';
      return `${label} בפורמט לא תקין.`;
    default:
      return issue.message || 'נתונים לא תקינים.';
  }
}

export function parseWith(schema, payload) {
  const result = schema.safeParse(payload);
  if (!result.success) {
    return {
      ok: false,
      error: formatIssue(result.error.issues[0]),
      issues: result.error.issues.map((issue) => ({ ...issue, message: formatIssue(issue) })),
    };
  }
  return { ok: true, data: result.data };
}

export function sendResult(res, result) {
  if (!result.ok) {
    return res.status(result.code || 400).json({ error: result.error, issues: result.issues });
  }
  return res.status(result.code || 200).json(result.data);
}

export function asyncRoute(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
