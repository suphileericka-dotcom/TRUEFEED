// Ce fichier fait partie du code Truefeed; il documente la logique de ce module.
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

function logWarn(message, context = {}) {
  console.warn(
    JSON.stringify({
      level: 'warn',
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
  logWarn,
};
