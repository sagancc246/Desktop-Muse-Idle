const { spawn } = require('node:child_process');
const http = require('node:http');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const viteBin = path.join(repoRoot, 'node_modules', 'vite', 'bin', 'vite.js');
const verificationPort = 4174;
const appUrl = `http://127.0.0.1:${verificationPort}/`;
const target = process.argv[2];

const appScripts = {
  e2e: 'verify:e2e:app',
  priority1: 'verify:priority1:app',
  priority2: 'verify:priority2:app',
};

function runNpm(script) {
  return new Promise((resolve, reject) => {
    console.log(`\n> npm run ${script}`);
    const command = process.platform === 'win32' ? process.env.ComSpec : npmCommand;
    const args =
      process.platform === 'win32' ? ['/d', '/s', '/c', `npm.cmd run ${script}`] : ['run', script];
    const child = spawn(command, args, {
      cwd: repoRoot,
      env: { ...process.env, APP_URL: appUrl },
      stdio: 'inherit',
    });

    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`npm run ${script} failed (${signal ?? `exit ${code}`})`));
    });
  });
}

function waitForServer(timeoutMs = 20_000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      const request = http.get(appUrl, (response) => {
        response.resume();
        if (response.statusCode && response.statusCode < 500) {
          resolve();
          return;
        }
        retry();
      });
      request.once('error', retry);
      request.setTimeout(1_000, () => request.destroy());
    };

    const retry = () => {
      if (Date.now() - startedAt >= timeoutMs) {
        reject(new Error(`Vite dev server did not become ready within ${timeoutMs}ms`));
        return;
      }
      setTimeout(check, 200);
    };

    check();
  });
}

function isServerRunning() {
  return new Promise((resolve) => {
    const request = http.get(appUrl, (response) => {
      response.resume();
      resolve(true);
    });
    request.once('error', () => resolve(false));
    request.setTimeout(500, () => {
      request.destroy();
      resolve(false);
    });
  });
}

async function waitForServerDown(timeoutMs = 5_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (!(await isServerRunning())) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Vite dev server did not stop within ${timeoutMs}ms`);
}

async function withVite(scripts) {
  if (await isServerRunning()) {
    throw new Error(
      `Port ${verificationPort} is already serving HTTP. Stop the existing verification server before retrying.`,
    );
  }
  console.log(`\n> starting Vite at ${appUrl}`);
  const vite = spawn(
    process.execPath,
    [viteBin, '--host', '127.0.0.1', '--port', String(verificationPort), '--strictPort'],
    {
      cwd: repoRoot,
      stdio: 'inherit',
    },
  );

  let viteExit;
  const viteExited = new Promise((resolve) => {
    vite.once('exit', (code, signal) => {
      viteExit = new Error(`Vite exited early (${signal ?? `exit ${code}`})`);
      resolve();
    });
  });

  try {
    await Promise.race([
      waitForServer(),
      viteExited.then(() => {
        throw viteExit;
      }),
    ]);
    await new Promise((resolve) => setTimeout(resolve, 250));
    if (vite.exitCode !== null || vite.signalCode !== null) {
      throw viteExit;
    }
    for (const script of scripts) {
      await runNpm(script);
    }
  } finally {
    if (vite.exitCode === null && vite.signalCode === null) {
      vite.kill();
      await Promise.race([
        viteExited,
        new Promise((resolve) => setTimeout(resolve, 2_000)),
      ]);
      await waitForServerDown();
    }
  }
}

async function main() {
  if (target === 'all') {
    await runNpm('build');
    await withVite(['verify:priority1:app', 'verify:priority2:app', 'verify:e2e:app']);
    // priority3 and verify:save-migrations intentionally point to the same migration suite.
    await runNpm('verify:priority3');
    return;
  }

  const appScript = appScripts[target];
  if (!appScript) {
    throw new Error(`Unknown verification target: ${target ?? '(missing)'}`);
  }
  await withVite([appScript]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
