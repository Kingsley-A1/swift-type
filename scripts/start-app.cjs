const { openSync } = require('fs');
const { spawn } = require('child_process');
const { join } = require('path');

const logPath = join(process.cwd(), 'scripts', 'app-3001.log');
const out = openSync(logPath, 'w');

const child = spawn('pnpm', ['exec', 'next', 'dev', '-p', '3001'], {
  cwd: process.cwd(),
  detached: true,
  shell: true,
  stdio: ['ignore', out, out],
});

child.unref();

console.log(`STARTED_PID=${child.pid}`);
console.log(`LOG=${logPath}`);
