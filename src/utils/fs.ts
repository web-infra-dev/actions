import path from 'path';
import { fs } from '@modern-js/utils';
import { gitCheckoutPRHead } from './git';

export const changePublishBranch = async (
  branch: string,
  pullRequestNumber?: string,
  cwd: string = process.cwd(),
) => {
  let result = branch;
  if (pullRequestNumber) {
    result = await gitCheckoutPRHead(pullRequestNumber);
  }
  console.info('change publish branch...');
  const config = await fs.readJSON(path.join(cwd, '.changeset', 'config.json'));
  config.baseBranch = result;
  await fs.writeJSON(
    path.join(cwd, '.changeset', 'config.json'),
    config,
    'utf-8',
  );
  return result;
};
