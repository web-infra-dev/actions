import * as core from '@actions/core';
import { PublishTools } from './types';
import { gitCommitAll, gitConfigUser } from './utils';
import { changePublishBranch } from './utils/fs';
import { createComment, createRelease } from './utils/github';
import {
  bumpCanaryVersion,
  listTagsAndGetPackages,
  runRelease,
  writeNpmrc,
} from './utils/release';

const VERSION_REGEX = /^modern-(\d*)$/;

export const release = async () => {
  const githubToken = process.env.GITHUB_TOKEN;
  const pullRequestNumber = process.env.PULL_REQUEST_NUMBER;
  const comment = process.env.COMMENT;
  const publishVersion = core.getInput('version'); // latest、beta、next、canary
  let publishBranch = core.getInput('branch');
  const publishTools =
    (core.getInput('tools') as PublishTools) || PublishTools.Modern; // changeset or modern
  console.info('[publishVersion]:', publishVersion);
  console.info('[publishTools]:', publishTools);
  console.info('[comment]:', comment, typeof comment);

  if (!githubToken) {
    core.setFailed('Please add the GITHUB_TOKEN');
    return;
  }

  if (comment) {
    const commentInfo = JSON.parse(comment);
    if (
      commentInfo.author_association !== 'MEMBER' ||
      commentInfo.author_association !== 'OWNER'
    ) {
      core.setFailed(
        'No permission to release the version, please contact the administrator',
      );
      return;
    }
  }

  await gitConfigUser();
  // change changeset publish branch to publishBranch
  publishBranch = await changePublishBranch(publishBranch, pullRequestNumber);

  console.info('[publishBranch]:', publishBranch);

  await writeNpmrc();
  // publish
  if (publishVersion === 'canary') {
    await bumpCanaryVersion(undefined, publishVersion, publishTools);
    await gitCommitAll('publish canary');
    await runRelease(process.cwd(), 'canary', publishTools);
  } else if (publishVersion === 'next') {
    await bumpCanaryVersion(undefined, publishVersion, publishTools);
    await gitCommitAll('publish next');
    await runRelease(process.cwd(), 'next', publishTools);
  } else if (publishVersion === 'pre') {
    await gitCommitAll('publish pre');
    await runRelease(process.cwd(), 'pre', publishTools);
  } else if (publishVersion === 'alpha') {
    await gitCommitAll('publish alpha');
    await runRelease(process.cwd(), 'alpha', publishTools);
  } else if (publishVersion === 'beta') {
    await gitCommitAll('publish beta');
    await runRelease(process.cwd(), 'beta', publishTools);
  } else if (VERSION_REGEX.test(publishVersion)) {
    const baseBranch = `v${publishVersion.split('-')[1]}`; // v1
    await gitCommitAll(`publish ${publishVersion}`);
    await runRelease(process.cwd(), publishVersion);
    await createRelease({
      publishBranch,
      githubToken,
      baseBranch,
    });
  } else {
    await gitCommitAll('publish latest');
    await runRelease(process.cwd(), 'latest', publishTools);
    await createRelease({
      publishBranch,
      githubToken,
    });
  }
  const content = await listTagsAndGetPackages();
  if (pullRequestNumber) {
    await createComment({
      githubToken,
      content,
      pullRequestNumber,
    });
  }
};
