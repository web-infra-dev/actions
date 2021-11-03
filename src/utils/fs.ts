import path from 'path';
import { getPackages } from '@manypkg/get-packages';
import packageJson from 'package-json';
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

// eslint-disable-next-line max-statements
export const changeDependenceVersion = async (cwd: string = process.cwd()) => {
  console.info('change modern.js repo dependence version...');
  const { packages } = await getPackages(cwd);
  const { version: testingPluginVersion } = await packageJson(
    '@modern-js/plugin-testing',
  );
  const { version: moduleToolsVersion } = await packageJson(
    '@modern-js/module-tools',
  );
  const { version: monorepoToolsVersion } = await packageJson(
    '@modern-js/monorepo-tools',
  );
  for (const pkg of packages) {
    const { dir } = pkg;
    const pkgJSON = await fs.readJSON(path.join(dir, 'package.json'));
    if (pkgJSON.devDependencies?.['@modern-js/plugin-testing']) {
      pkgJSON.devDependencies['@modern-js/plugin-testing'] = `^${
        testingPluginVersion as string
      }`;
    }
    if (pkgJSON.dependencies?.['@modern-js/plugin-testing']) {
      pkgJSON.dependencies['@modern-js/plugin-testing'] = `^${
        testingPluginVersion as string
      }`;
    }
    if (pkgJSON.devDependencies?.['@modern-js/module-tools']) {
      pkgJSON.devDependencies['@modern-js/module-tools'] = `^${
        moduleToolsVersion as string
      }`;
    }
    if (pkgJSON.dependencies?.['@modern-js/module-tools']) {
      pkgJSON.dependencies['@modern-js/module-tools'] = `^${
        moduleToolsVersion as string
      }`;
    }
    await fs.writeJSON(path.join(dir, 'package.json'), pkgJSON, 'utf-8');
  }
  const pkgJSON = await fs.readJSON(path.join(cwd, 'package.json'));
  if (pkgJSON.devDependencies['@modern-js/monorepo-tools']) {
    pkgJSON.devDependencies['@modern-js/monorepo-tools'] = `^${
      monorepoToolsVersion as string
    }`;
    await fs.writeJSON(path.join(cwd, 'package.json'), pkgJSON, 'utf-8');
  }
};
