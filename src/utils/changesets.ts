import readChangesets from '@changesets/read';
import { execa, getPackageManager } from '@modern-js/utils';
import { execaWithStreamLog } from '.';

export async function runBumpVersion(cwd: string = process.cwd()) {
  const packageManager = await getPackageManager(cwd);
  const changesets = await readChangesets(cwd);

  if (changesets.length === 0) {
    // eslint-disable-next-line no-console
    console.log('No changesets found');
    return;
  }

  await execaWithStreamLog(packageManager, ['run', 'bump'], {
    cwd,
  });
}

export async function getReleaseNote(
  title: string,
  cwd: string = process.cwd(),
) {
  const packageManager = await getPackageManager(cwd);
  const { stdout } = await execa(packageManager, ['run', 'gen-release-note'], {
    cwd,
  });
  return `
# ${title}

${stdout.split('modern gen-release-note')[1]}
`;
}
