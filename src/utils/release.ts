import { execa, fs } from '@modern-js/utils';
import {
  canUsePnpm,
  canUseYarn,
  getPackageInfo,
  getPackageManager,
} from './npm';

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

export const updateLockFile = async (cwd: string = process.cwd()) => {
  const packageManager = await getPackageManager(cwd);
  await execaWithStreamLog(
    packageManager,
    ['install', '--ignore-scripts', '--lockfile-only'],
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
      ['run', '--filter', './packages/**', 'prepare'],
      { cwd },
    );
  } else {
    await execaWithStreamLog('npm', ['install', '-g', 'lerna'], { cwd });
    await execaWithStreamLog('lerna', ['run', 'prepare'], { cwd });
  }
};

export const runPrepareMonorepoTools = async (cwd: string = process.cwd()) => {
  await execaWithStreamLog(
    'pnpm',
    ['run', '--filter', '@modern-js/monorepo-tools...', 'prepare'],
    { cwd },
  );
};

export const bumpCanaryVersion = async (cwd: string = process.cwd()) => {
  const packageManager = await getPackageManager(cwd);
  await execaWithStreamLog(packageManager, [
    'run',
    'bump',
    '--snapshot',
    'canary',
  ]);
};

export const runRelease = async (cwd: string = process.cwd(), tag?: string) => {
  const packageManager = await getPackageManager(cwd);
  const params: string[] = ['run', 'release'];
  if (tag) {
    params.push('--tag', tag);
  }
  params.push('--no-git-checks');
  await execaWithStreamLog(packageManager, params, {
    cwd,
  });
};

export const listTagsAndGetPackages = async () => {
  const { stdout } = await execa('git', ['--no-pager', 'tag', '-l']);
  const result: Record<string, string> = {};
  stdout.split('\n').forEach(info => {
    const { name, version } = getPackageInfo(info);
    if (version !== 'latest') {
      result[name] = version;
    }
  });
  console.info('[Tags]: list tags:');
  console.info(stdout);
  console.info('[Packages]:');
  console.info(JSON.stringify(result));
};
