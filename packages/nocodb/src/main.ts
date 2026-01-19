import cors from 'cors';
import express from 'express';
import Noco from '~/Noco';

const server = express();
server.enable('trust proxy');
server.disable('etag');
server.disable('x-powered-by');
server.use(
  cors({
    credentials: true,
    exposedHeaders: 'xc-db-response',
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const allowedRaw = process.env.NC_CORS_ORIGIN || '';
      const allowed = allowedRaw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (allowed.includes(origin)) return callback(null, true);

      if (
        process.env.NODE_ENV === 'development' &&
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
  }),
);

server.set('view engine', 'ejs');

async function bootstrap() {
  const httpServer = server.listen(process.env.PORT || 8080, async () => {
    server.use(await Noco.init({}, httpServer, server));
  });
}

bootstrap();
