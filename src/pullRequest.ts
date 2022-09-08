import * as core from '@actions/core';
import * as github from '@actions/github';
import readChangesets from '@changesets/read';
import { getPackages } from '@manypkg/get-packages';
import { read } from '@changesets/config';
import assembleReleasePlan from '@changesets/assemble-release-plan';
import { execa } from '@modern-js/utils';
import {
  execaWithStreamLog,
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
  // 当前发布的版本类型，例如 alpha、latest
  let releaseType = core.getInput('version') || 'release';
  if (releaseType === 'latest') {
    releaseType = 'release';
  }
  // 当前发布的版本，例如 v1.0.0
  let releaseVersion = core.getInput('versionNumber');
  // 当前发布源分支
  const releaseBranch = core.getInput('branch');

  if (!releaseBranch) {
    throw Error('not found release branch');
  }

  // hack modern.js repo
  const repo = process.env.REPOSITORY;
  const isModernRepo = repo === 'modern-js-dev/modern.js';

  const cwd = process.cwd();

  const changesets = await readChangesets(cwd);

  const CHANGESET_PATH = require.resolve('@changesets/cli', { paths: [cwd] });

  if (releaseType === 'canary' && releaseVersion === 'auto') {
    releaseVersion = `${new Date().toISOString().split('T')[0]}`;
  } else if (releaseVersion === 'auto') {
    const packages = await getPackages(cwd);

    if (releaseType === 'alpha' || releaseType === 'next') {
      await execaWithStreamLog(process.execPath, [
        CHANGESET_PATH,
        'pre',
        'enter',
        releaseType || 'next',
      ]);
    }

    const config = await read(cwd, packages);

    const releasePlan = assembleReleasePlan(
      changesets,
      packages,
      config,
      undefined,
      releaseType === 'canary'
        ? {
            tag: 'canary',
          }
        : undefined,
    );
    if (releasePlan.releases.length === 0) {
      return;
    }
    if (isModernRepo) {
      releaseVersion = `v${
        releasePlan.releases.filter(
          release => !release.name.includes('generator'),
        )[0].newVersion
      }`;
    } else {
      releaseVersion = `v${releasePlan.releases[0].newVersion}`;
    }
  }

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
    ? `${releaseType}-${releaseVersion}`
    : `changeset-${releaseType}/${branch}`;
  const title = releaseVersion
    ? `Release ${releaseVersion}`
    : 'Version Packages';

  await gitSwitchToMaybeExistingBranch(versionBranch);
  await gitReset(github.context.sha);

  if (changesets.length === 0) {
    // eslint-disable-next-line no-console
    console.log('No changesets found');
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }

  await runInstall();

  if (isModernRepo) {
    await runPrepareMonorepoTools();
  }

  if (releaseType === 'canary') {
    console.info('git push');
    await gitPush(versionBranch, { force: true });
    return;
  }

  const releaseNote = await getReleaseNote(title);

  // 判断是否是 modern 项目
  let isModernProject = true;
  try {
    execa('npx', ['modern', '--version']);
  } catch (e) {
    isModernProject = false;
  }

  if (!isModernProject && (releaseType === 'alpha' || releaseType === 'next')) {
    try {
      await execaWithStreamLog(process.execPath, [CHANGESET_PATH, 'version']);
      await execaWithStreamLog(process.execPath, [
        CHANGESET_PATH,
        'pre',
        'exit',
      ]);
    } catch (e) {
      await execaWithStreamLog(process.execPath, [
        CHANGESET_PATH,
        'pre',
        'exit',
      ]);
    }
  } else {
    await runBumpVersion(releaseType);
  }

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
