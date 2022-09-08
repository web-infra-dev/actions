import path from 'path';
import { fs, execa, getPackageManager } from '@modern-js/utils';
import readChangesets from '@changesets/read';
import { execaWithStreamLog } from '.';

export async function runBumpVersion(
  releaseType: string,
  cwd: string = process.cwd(),
) {
  const packageManager = await getPackageManager(cwd);
  const changesets = await readChangesets(cwd);

  if (changesets.length === 0) {
    // eslint-disable-next-line no-console
    console.log('No changesets found');
    return;
  }

  if (releaseType === 'release') {
    await execaWithStreamLog(packageManager, ['run', 'bump'], {
      cwd,
    });
  } else if (packageManager === 'pnpm') {
    await execaWithStreamLog(
      packageManager,
      ['run', 'bump', '--', '--canary', '--preid', releaseType],
      {
        cwd,
      },
    );
  } else {
    await execaWithStreamLog(
      packageManager,
      ['run', 'bump', '--canary', '--preid', releaseType],
      {
        cwd,
      },
    );
  }
}

export async function getReleaseNote(
  title: string,
  cwd: string = process.cwd(),
) {
  const packageManager = await getPackageManager(cwd);
  // 判断是否存在 gen-release-note 命令
  const pkgPath = path.join(cwd, 'package.json');
  const pkgInfo = fs.readJSONSync(pkgPath);
  const { scripts } = pkgInfo;
  if (scripts['gen-release-note']) {
    const { stdout } = await execa(
      packageManager,
      ['run', 'gen-release-note'],
      {
        cwd,
      },
    );
    return `
  # ${title}

  ${stdout.split('modern gen-release-note')[1]}
  `;
  } else {
    return `# ${title}`;
  }
}
