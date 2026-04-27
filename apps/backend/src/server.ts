import { createApp } from './app.ts';
import { env } from './config/env.ts';

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`[backend] listening on :${env.PORT}`);
});
