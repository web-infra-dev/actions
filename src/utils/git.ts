import path from 'path';
import { fs } from '@modern-js/utils';
import { execaWithStreamLog } from './exec';

export const writeGithubToken = async (githubToken: string) => {
  await fs.writeFile(
    path.join(process.env.HOME as string, '.netrc'),
    `machine github.com\nlogin github-actions[bot]\npassword ${githubToken}`,
  );
};
export const gitConfigUser = async () => {
  console.info('git config user...');
  await execaWithStreamLog('git', [
    'config',
    '--global',
    'user.name',
    `"github-actions[bot]"`,
  ]);
  await execaWithStreamLog('git', [
    'config',
    '--global',
    'user.email',
    `"github-actions[bot]@users.noreply.github.com"`,
  ]);
};

export const gitCommitAll = async (message: string) => {
  console.info('git commit all...');
  await execaWithStreamLog('git', ['status']);
  await execaWithStreamLog('git', ['add', '.']);
  await execaWithStreamLog('git', ['commit', '-m', message]);
  await execaWithStreamLog('git', ['status']);
};

export const gitPushTags = async () => {
  console.info('git push tags...');
  await execaWithStreamLog('git', ['push', 'origin', '--tags']);
};
