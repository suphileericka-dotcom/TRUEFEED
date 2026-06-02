const { app } = require('./app');
const { env } = require('./config/env');
const { logInfo } = require('./monitoring/logger');

app.listen(env.port, () => {
  logInfo('server_started', {
    app: env.appName,
    port: env.port,
    environment: env.nodeEnv,
  });
});
