import * as core from '@actions/core';
import { gitCommitAll, gitConfigUser, gitPushTags } from './utils';
import { chagnePublishBranch, changeDependenceVersion } from './utils/fs';
import {
  bumpCanaryVersion,
  runInstall,
  runPrepare,
  runRelease,
  writeNpmrc,
} from './utils/release';

// eslint-disable-next-line max-statements
export const release = async () => {
  const githubToken = process.env.GITHUB_TOKEN;
  const publishVersion = core.getInput('version');
  const publishBranch = core.getInput('branch');
  console.info('publishVersion', publishVersion);
  console.info('publishBranch', publishBranch);

  if (!githubToken) {
    core.setFailed('Please add the GITHUB_TOKEN');
    return;
  }

  await gitConfigUser();
  await chagnePublishBranch(publishBranch);

  // hack modern.js repo need to change plugin-testing and module-tools version
  const repo = process.env.REPOSITORY;

  if (repo === 'modern-js-dev/modern.js' && publishVersion !== 'canary') {
    await changeDependenceVersion();
  }

  // prepare repo
  await runInstall();
  await runPrepare();

  await writeNpmrc();
  // publish
  if (publishVersion === 'canary') {
    await bumpCanaryVersion(publishVersion);
    await gitCommitAll('publish canary');
    await runRelease(process.cwd(), 'canary');
  } else if (publishVersion === 'pre') {
    await gitCommitAll('publish pre');
    await runRelease(process.cwd(), 'next');
    await gitPushTags();
  } else {
    await gitCommitAll('publish latest');
    await runRelease(process.cwd(), 'latest');
    await gitPushTags();
  }
};
