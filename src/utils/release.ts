import { execa, fs } from '@modern-js/utils';
import { getPackageInfo, getPackageManager } from './npm';

import { execaWithStreamLog } from './exec';
import { PublishTools } from '@/types';

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

export const bumpCanaryVersion = async (
  cwd: string = process.cwd(),
  publishVersion = 'canary',
  tools: PublishTools,
) => {
  const packageManager = await getPackageManager(cwd);
  const params = ['run'];
  if (tools === PublishTools.Modern) {
    params.push('bump');
  } else {
    params.push('changeset');
    params.push('version');
  }
  await execaWithStreamLog(packageManager, [
    ...params,
    '--snapshot',
    publishVersion,
  ]);
};

export const runRelease = async (
  cwd: string = process.cwd(),
  tag?: string,
  tools: PublishTools = PublishTools.Modern,
) => {
  const packageManager = await getPackageManager(cwd);
  const params: string[] = ['run'];
  if (tools === PublishTools.Modern) {
    params.push('release');
  } else {
    params.push('changeset');
    params.push('publish');
  }
  if (tag) {
    params.push('--tag', tag);
  }
  if (tools === PublishTools.Modern) {
    params.push('--no-git-checks');
  }
  console.info('[run release]', packageManager, params);
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
  return stdout;
};
