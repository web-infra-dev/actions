import * as core from '@actions/core';
import { gitCommitAll, gitConfigUser } from './utils';
import { chagnePublishBranch } from './utils/fs';
import { createRelease } from './utils/github';
import {
  bumpCanaryVersion,
  listTagsAndGetPackages,
  runInstall,
  runPrepare,
  runRelease,
  writeNpmrc,
} from './utils/release';

const VERSION_REGEX = /^modern-(\d*)$/;

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

  // prepare repo
  await runInstall();
  await runPrepare();

  await writeNpmrc();
  // publish
  if (publishVersion === 'canary') {
    await bumpCanaryVersion(undefined, publishVersion);
    await gitCommitAll('publish canary');
    await runRelease(process.cwd(), 'canary');
  } else if (publishVersion === 'next') {
    await bumpCanaryVersion(undefined, publishVersion);
    await gitCommitAll('publish next');
    await runRelease(process.cwd(), 'next');
  } else if (publishVersion === 'pre') {
    await gitCommitAll('publish pre');
    await runRelease(process.cwd(), 'pre');
  } else if (publishVersion === 'alpha') {
    await gitCommitAll('publish alpha');
    await runRelease(process.cwd(), 'alpha');
  } else if (publishVersion === 'beta') {
    await gitCommitAll('publish beta');
    await runRelease(process.cwd(), 'beta');
  } else if (VERSION_REGEX.test(publishVersion)) {
    await gitCommitAll(`publish ${publishVersion}`);
    await runRelease(process.cwd(), publishVersion);
    await createRelease({
      publishBranch,
      githubToken,
    });
  } else {
    await gitCommitAll('publish latest');
    await runRelease(process.cwd(), 'latest');
    await createRelease({
      publishBranch,
      githubToken,
    });
  }
  await listTagsAndGetPackages();
};
