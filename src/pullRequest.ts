import * as core from '@actions/core';
import * as github from '@actions/github';
import readChangesets from '@changesets/read';
import {
  gitCommitAll,
  gitCommitWithIgnore,
  gitConfigUser,
  gitPush,
  gitReset,
  gitSwitchToMaybeExistingBranch,
} from './utils';
import { getReleaseNote, runBumpVersion } from './utils/changesets';
import { createPullRequest, writeGithubToken } from './utils/github';
import {
  runInstall,
  runPrepareMonorepoTools,
  updateLockFile,
} from './utils/release';

export const pullRequest = async () => {
  const githubToken = process.env.GITHUB_TOKEN;
  // 当前发布的版本，例如 v1.0.0
  const releaseVersion = core.getInput('versionNumber');
  // 当前发布源分支
  const releaseBranch = core.getInput('branch');
  console.info('Release Version', releaseVersion);
  console.info('publishBranch', releaseBranch);

  if (!githubToken) {
    core.setFailed('Please add the GITHUB_TOKEN');
    return;
  }

  await gitConfigUser();
  await writeGithubToken(githubToken);

  const branch = github.context.ref.replace('refs/heads/', '');
  const versionBranch = releaseVersion
    ? `release-${releaseVersion}`
    : `changeset-release/${branch}`;
  const title = releaseVersion
    ? `Release ${releaseVersion}`
    : 'Version Packages';

  await gitSwitchToMaybeExistingBranch(versionBranch);
  await gitReset(github.context.sha);

  const cwd = process.cwd();

  const changesets = await readChangesets(cwd);

  if (changesets.length === 0) {
    // eslint-disable-next-line no-console
    console.log('No changesets found');
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }

  await runInstall();

  // hack modern.js repo
  const repo = process.env.REPOSITORY;
  const isModernRepo = repo === 'modern-js-dev/modern.js';

  if (isModernRepo) {
    await runPrepareMonorepoTools();
  }

  const releaseNote = await getReleaseNote(title);

  // 获取 changesets
  await runBumpVersion();

  await updateLockFile();

  if (isModernRepo) {
    await gitCommitWithIgnore(title, /^test/);
  } else {
    await gitCommitAll(title);
  }

  await gitPush(versionBranch, { force: true });

  await createPullRequest({
    githubToken,
    title,
    body: releaseNote,
    branch: versionBranch,
  });
};
