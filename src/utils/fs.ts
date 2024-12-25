import path from 'path';
import { fs } from '@modern-js/utils';

export const changePublishBranch = async (
  branch: string,
  cwd: string = process.cwd(),
) => {
  let result = branch;
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
