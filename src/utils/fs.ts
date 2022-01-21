import path from 'path';
import { getPackages } from '@manypkg/get-packages';
import { fs } from '@modern-js/utils';

export const chagnePublishBranch = async (
  branch: string,
  cwd: string = process.cwd(),
) => {
  const ref = process.env.REF;
  const currentBranch = ref?.match(/refs\/heads\/(.*)/)?.[1];
  console.info('currentBranch', ref, currentBranch, branch);
  if (branch !== currentBranch) {
    throw new Error('branch not match');
  }
  console.info('change publish branch...');
  const config = await fs.readJSON(path.join(cwd, '.changeset', 'config.json'));
  config.baseBranch = branch;
  await fs.writeJSON(
    path.join(cwd, '.changeset', 'config.json'),
    config,
    'utf-8',
  );
};

export const checkGeneratorDist = async (cwd: string = process.cwd()) => {
  const { packages } = await getPackages(cwd);
  for (const pkg of packages) {
    const { dir } = pkg;

    if (dir.includes('generator/generators')) {
      if (!fs.existsSync(path.join(dir, 'dist/js/node/main.js'))) {
        console.warn('generator dist not right', dir);
        // eslint-disable-next-line no-process-exit
        process.exit(1);
      }
    }
  }
};
