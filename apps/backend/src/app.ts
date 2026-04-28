import cors from 'cors';
import express, { type Request } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { registerRoutes } from './routes/index.js';

type RequestWithRawBody = Request & {
  rawBody?: Buffer;
};

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        (req as RequestWithRawBody).rawBody = Buffer.from(buf);
      }
    })
  );
  app.use(morgan('dev'));

  registerRoutes(app);

  return app;
}
