import './db.mjs';
import { config } from './config.mjs';
import { seedDatabase } from './seed.mjs';
import { createApp } from './app.mjs';
import { logInfo } from './services/logService.mjs';

await seedDatabase();

const app = createApp();
app.listen(config.port, () => {
  logInfo('server.startup', 'BARBER server listening', { port: config.port });
  logInfo('server.startup', 'Server configuration loaded', {
    dataProvider: config.dataProvider,
    adminEmail: config.adminEmail,
  });
});
