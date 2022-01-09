import { fs } from '@modern-js/utils';
import { canUsePnpm, canUseYarn, getPackageManager } from './npm';

import { execaWithStreamLog } from './exec';

export const writeNpmrc = async () => {
  const npmrcPath = `${process.env.HOME as string}/.npmrc`;
  if (fs.existsSync(npmrcPath)) {
    console.info('Found existing .npmrc file');
  } else {
    console.info('No .npmrc file found, creating one');
    fs.writeFileSync(
      npmrcPath,
      `//registry.npmjs.org/:_authToken=${process.env.NPM_TOKEN as string}`,
    );
  }
};

export const runInstall = async (cwd: string = process.cwd()) => {
  console.info('run install...');
  if (!(await canUsePnpm())) {
    await execaWithStreamLog('npm', ['install', '-g', 'pnpm'], { cwd });
  }
  if (!(await canUseYarn())) {
    await execaWithStreamLog('npm', ['install', '-g', 'yarn'], { cwd });
  }
  const packageManager = await getPackageManager(cwd);
  await execaWithStreamLog(
    packageManager,
    ['install', '--ignore-scripts', '--no-frozen-lockfile'],
    {
      cwd,
    },
  );
};

export const runPrepare = async (cwd: string = process.cwd()) => {
  const packageManager = await getPackageManager(cwd);
  if (packageManager === 'pnpm') {
    await execaWithStreamLog(
      'pnpm',
      ['run', 'prepare', '--filter', './packages'],
      { cwd },
    );
  } else {
    await execaWithStreamLog('npm', ['install', '-g', 'lerna'], { cwd });
    await execaWithStreamLog('lerna', ['run', 'prepare'], { cwd });
  }
};

export const bumpCanaryVersion = async (cwd: string = process.cwd()) => {
  const packageManager = await getPackageManager(cwd);
  if (packageManager === 'pnpm') {
    await execaWithStreamLog(packageManager, [
      'run',
      'bump',
      '--',
      '--snapshot',
      'canary',
    ]);
  } else {
    await execaWithStreamLog(packageManager, [
      'run',
      'bump',
      '--snapshot',
      'canary',
    ]);
  }
};

export const runRelease = async (cwd: string = process.cwd(), tag?: string) => {
  const packageManager = await getPackageManager(cwd);
  const params: string[] = ['run', 'release'];
  if (packageManager === 'pnpm') {
    params.push('--');
  }
  if (tag) {
    params.push('--tag', tag);
  }
  params.push('--no-git-checks');
  await execaWithStreamLog(packageManager, params, {
    cwd,
  });
};
