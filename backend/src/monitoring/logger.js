function logInfo(message, context = {}) {
  console.info(
    JSON.stringify({
      level: 'info',
      message,
      ...context,
      timestamp: new Date().toISOString(),
    }),
  );
}

function logError(message, context = {}) {
  console.error(
    JSON.stringify({
      level: 'error',
      message,
      ...context,
      timestamp: new Date().toISOString(),
    }),
  );
}

module.exports = {
  logError,
  logInfo,
};
