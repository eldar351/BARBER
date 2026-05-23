import { config } from './config.mjs';
import { upsertAdmin } from './repositories/adminRepo.mjs';
import { ensureSettings } from './repositories/settingsRepo.mjs';
import { listBarbers, createBarber } from './repositories/barberRepo.mjs';
import { listServices, createService } from './repositories/serviceRepo.mjs';

const DEFAULT_WINDOWS = [
  [0, 9 * 60, 19 * 60],
  [1, 9 * 60, 19 * 60],
  [2, 9 * 60, 19 * 60],
  [3, 9 * 60, 19 * 60],
  [4, 9 * 60, 19 * 60],
  [5, 9 * 60, 14 * 60],
];

export async function seedDatabase() {
  await upsertAdmin({ email: config.adminEmail, password: config.adminPassword });
  await ensureSettings();

  const barbers = await listBarbers();
  if (barbers.length === 0) {
    for (const row of [
      ['אלדר', 'פיידים ותספורות מודרניות', 'https://images.unsplash.com/photo-1517832606299-7ae9b720a186?auto=format&fit=crop&w=500&q=80', 5],
      ['יונתן', 'זקן וגילוח קלאסי', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80', 5],
      ['מיכאל', 'תספורות ילדים ומשפחות', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=80', 5],
    ]) {
      await createBarber({
        name: row[0],
        specialty: row[1],
        imageUrl: row[2],
        rating: row[3],
        isActive: true,
        schedules: DEFAULT_WINDOWS.map(([dayOfWeek, startMinutes, endMinutes]) => ({
          dayOfWeek,
          startMinutes,
          endMinutes,
          isActive: true,
        })),
        exceptions: [],
      });
    }
  }

  const services = await listServices();
  if (services.length === 0) {
    for (const row of [
      ['תספורת גבר', 'תספורת מלאה כולל סידור קווים.', 45, 70, 'https://images.unsplash.com/photo-1622287162716-f311baa1a2b8?auto=format&fit=crop&w=800&q=80'],
      ['תספורת + זקן', 'חבילה מלאה עם טיפול בזקן.', 60, 100, 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80'],
      ['גילוח קלאסי', 'מגבת חמה, סכין וסיום מדויק.', 30, 55, 'https://images.unsplash.com/photo-1512690459411-b0fd1c86b8c8?auto=format&fit=crop&w=800&q=80'],
      ['תספורת ילד', 'תספורת עדינה ומהירה לילדים.', 30, 50, 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=800&q=80'],
    ]) {
      await createService({
        name: row[0],
        description: row[1],
        durationMin: row[2],
        price: row[3],
        imageUrl: row[4],
        isActive: true,
        barberSelectionMode: 'all',
        linkedBarberIds: [],
      });
    }
  }
}
