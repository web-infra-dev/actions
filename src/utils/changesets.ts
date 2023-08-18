import path from 'path';
import readChangesets from '@changesets/read';
import { execa, getPackageManager, fs } from '@modern-js/utils';
import { PublishTools } from '../types';
import { execaWithStreamLog } from '.';

export async function runBumpVersion(
  releaseType: string,
  tools: PublishTools,
  cwd: string = process.cwd(),
) {
  const packageManager = await getPackageManager(cwd);
  const changesets = await readChangesets(cwd);

  if (changesets.length === 0) {
    // eslint-disable-next-line no-console
    console.log('No changesets found');
    return;
  }
  const params = ['run'];
  if (tools === PublishTools.Changeset) {
    params.push('changeset');
    params.push('version');
  } else {
    params.push('bump');
  }
  if (releaseType === 'release') {
    await execaWithStreamLog(packageManager, params, {
      cwd,
    });
  } else {
    await execaWithStreamLog(
      packageManager,
      [...params, '--canary', '--preid', releaseType],
      {
        cwd,
      },
    );
  }
}

export async function getReleaseNote(
  githubToken: string,
  cwd: string = process.cwd(),
) {
  const packageManager = await getPackageManager(cwd);
  const { stdout } = await execa(packageManager, ['run', 'gen-release-note'], {
    cwd,
    env: {
      GITHUB_AUTH_TOKEN: githubToken,
    },
  });
  const part1 = stdout.split('modern gen-release-note')[1];
  const part2 = part1.split('\n').filter(v => v)
  return part2.slice(1).join('\n'); // remove monorepo-tools version info
}

export async function getPreState(
  releaseType: string,
  tools: PublishTools,
  cwd: string = process.cwd(),
) {
  const packageManager = await getPackageManager(cwd);
  const prePath = path.join(cwd, '.changeset', 'pre.json');
  if (fs.existsSync(prePath)) {
    fs.removeSync(prePath);
  }
  if (tools === PublishTools.Modern) {
    await execaWithStreamLog(
      packageManager,
      ['run', 'pre', 'enter', releaseType],
      {
        cwd,
      },
    );
  } else {
    await execaWithStreamLog(
      packageManager,
      ['run', 'changeset', 'pre', 'enter', releaseType],
      {
        cwd,
      },
    );
  }
  const preState = fs.readJSONSync(prePath, 'utf-8');
  fs.removeSync(prePath);
  return preState;
}
