import * as core from '@actions/core';
import { getReleaseNote, genReleaseNote } from './utils/changesets';
import { PublishTools } from './types';

const VERSION_REGEX = /^modern-(\d*)$/;

export const pullRequest = async () => {
  const githubToken = process.env.GITHUB_TOKEN;
  // 当前发布的版本类型，例如 alpha、latest
  let releaseType = core.getInput('version') || 'release';
  if (releaseType === 'latest' || VERSION_REGEX.test(releaseType)) {
    releaseType = 'release';
  }
  // 当前发布的版本，例如 v1.0.0
  const releaseVersion = core.getInput('versionNumber');
  // 当前发布源分支
  const releaseBranch = core.getInput('branch');
  const publishTools =
    (core.getInput('tools') as PublishTools) || PublishTools.Modern; // changeset or modern
  console.info('[publishTools]:', publishTools);

  if (!releaseBranch) {
    throw Error('not found release branch');
  }

  console.info('Release Version', releaseVersion);
  console.info('publishBranch', releaseBranch);

  if (!githubToken) {
    core.setFailed('Please add the GITHUB_TOKEN');
    return;
  }

  let releaseNote = '';
  if (publishTools === PublishTools.Modern) {
    releaseNote = await getReleaseNote();
  } else {
    releaseNote = await genReleaseNote();
  }

  console.info('releaseNote', releaseNote);
};
