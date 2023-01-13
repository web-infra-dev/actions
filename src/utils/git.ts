import { execa } from '@modern-js/utils';
import { execaWithStreamLog } from './exec';

export const gitConfigUser = async () => {
  console.info('git config user...');
  await execaWithStreamLog('git', [
    'config',
    '--global',
    '--add',
    `safe.directory`,
    '/github/workspace',
  ]);
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
  await execaWithStreamLog('git', ['commit', '-m', message, '-n']);
  await execaWithStreamLog('git', ['status']);
};

export const gitCommitWithIgnore = async (message: string, ignore?: RegExp) => {
  const { stdout } = await execa('git', ['diff', '--name-only', 'HEAD']);
  const files = stdout.split('\n');
  for (const file of files) {
    if (!ignore || !file.match(ignore)) {
      await execaWithStreamLog('git', ['add', file]);
    }
  }
  await execaWithStreamLog('git', ['commit', '-m', message]);
};

export const gitPush = async (
  branch: string,
  { force }: { force?: boolean } = {},
) => {
  await execaWithStreamLog(
    'git',
    ['push', 'origin', `HEAD:${branch}`, force && '--force'].filter<string>(
      Boolean as any,
    ),
  );
};

export const gitPushTags = async () => {
  console.info('git push tags...');
  await execaWithStreamLog('git', ['push', 'origin', '--tags']);
};

export const gitSwitchToMaybeExistingBranch = async (branch: string) => {
  try {
    await execaWithStreamLog('git', ['rev-parse', '--verify', branch], {
      ignoreReturnCode: true,
    });
    await execaWithStreamLog('git', ['checkout', branch]);
  } catch (e: any) {
    await execaWithStreamLog('git', ['checkout', '-b', branch]);
  }
};

export const gitReset = async (
  pathSpec: string,
  mode: 'hard' | 'soft' | 'mixed' = 'hard',
) => {
  await execaWithStreamLog('git', ['reset', `--${mode}`, pathSpec]);
};
