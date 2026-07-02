import { env } from "./config/env";
import { createApp } from "./app";
import { logger } from "./infrastructure/logger";

const app = createApp();

app.listen(env.port, () => {
  logger.info("KRAVIA API listening.", { port: env.port, basePath: "/api/v1" });
});
