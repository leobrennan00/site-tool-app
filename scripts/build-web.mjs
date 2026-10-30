// Builds the website and puts it where the backend serves it (/app, see
// site-tool-backend/website.py). Deploying the backend then deploys the site.
import { execSync } from 'node:child_process';
import { rmSync, cpSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(app, 'dist-web');
const target = resolve(app, '..', 'site-tool-backend', 'web');

if (!existsSync(resolve(target, '..'))) {
  console.error(`No backend checkout at ${resolve(target, '..')}`);
  process.exit(1);
}

rmSync(out, { recursive: true, force: true });
// --offline: the Expo version check can't get through this machine's proxy.
execSync(`npx expo export --platform web --output-dir "${out}"`, {
  cwd: app,
  stdio: 'inherit',
  env: { ...process.env, EXPO_OFFLINE: '1' },
});
rmSync(target, { recursive: true, force: true });
cpSync(out, target, { recursive: true });
console.log(`Website copied to ${target}`);
