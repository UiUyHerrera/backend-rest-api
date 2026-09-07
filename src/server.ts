import app from './app';
import { config } from './lib/config';

const server = app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});

function shutdown() {
  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);