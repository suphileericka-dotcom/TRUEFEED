const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const [environment, ...commandParts] = process.argv.slice(2);

if (!environment || commandParts.length === 0) {
  console.error('Usage: node scripts/with-env.js <development|staging|production> <command...>');
  process.exit(1);
}

const envFile = path.join(process.cwd(), `.env.${environment}`);
const exampleFile = `${envFile}.example`;

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return fs
    .readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .reduce((values, line) => {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith('#')) {
        return values;
      }

      const separatorIndex = trimmed.indexOf('=');

      if (separatorIndex === -1) {
        return values;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();

      values[key] = value.replace(/^["']|["']$/g, '');
      return values;
    }, {});
}

const fileToLoad = fs.existsSync(envFile) ? envFile : exampleFile;
const loadedEnv = parseEnvFile(fileToLoad);
const [command, ...args] = commandParts;

const child = spawn(command, args, {
  env: {
    ...process.env,
    ...loadedEnv,
  },
  shell: true,
  stdio: 'inherit',
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
