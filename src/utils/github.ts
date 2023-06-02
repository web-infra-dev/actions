import path from 'path';
import * as github from '@actions/github';
import { fs } from '@modern-js/utils';
import { gitSwitchToMaybeExistingBranch } from './git';
import { gitPush } from './git';

export const writeGithubToken = async (githubToken: string) => {
  await fs.writeFile(
    path.join(process.env.HOME as string, '.netrc'),
    `machine github.com\nlogin github-actions[bot]\npassword ${githubToken}`,
  );
};

interface CreatePullRequestOptions {
  githubToken: string;
  branch: string;
  title: string;
  body: string;
}

export const createPullRequest = async (options: CreatePullRequestOptions) => {
  const { githubToken, branch: baseBranch, title, body } = options;
  const repo = `${github.context.repo.owner}/${github.context.repo.repo}`;
  const branch = github.context.ref.replace('refs/heads/', '');
  const octokit = github.getOctokit(githubToken);

  // 判断当前 Pull Request 是否存在
  const searchQuery = `repo:${repo}+state:open+head:${baseBranch}+base:${branch}`;
  const searchResult = await octokit.rest.search.issuesAndPullRequests({
    q: searchQuery,
  });

  if (searchResult.data.items.length === 0) {
    console.info('creating pull request');
    const { data: newPullRequest } = await octokit.rest.pulls.create({
      base: branch,
      head: baseBranch,
      title,
      body,
      ...github.context.repo,
    });
    return {
      pullRequestNumber: newPullRequest.number,
    };
  } else {
    const [pullRequest] = searchResult.data.items;

    console.info(`updating found pull request #${pullRequest.number}`);
    await octokit.rest.pulls.update({
      pull_number: pullRequest.number,
      title,
      body,
      ...github.context.repo,
    });

    return {
      pullRequestNumber: pullRequest.number,
    };
  }
};

interface CreateReleaseOptions {
  githubToken: string;
  baseBranch?: string;
  publishBranch: string;
}

export const createRelease = async (options: CreateReleaseOptions) => {
  const { githubToken, publishBranch, baseBranch } = options;
  // 根据 publishBranch 计算出 tagName
  const publishInfo = publishBranch.split('-');
  if (publishInfo.length <= 1) {
    console.info('current publishBranch not support create release');
    return;
  }
  const tagName = publishInfo[1];

  const octokit = github.getOctokit(githubToken);

  // 获取发布 Pull Request
  const pulls = await octokit.rest.pulls.list({
    ...github.context.repo,
  });

  const releasePull = pulls.data.find(
    pull =>
      pull.base.ref === (baseBranch || 'main') &&
      pull.head.ref === publishBranch,
  );

  if (!releasePull) {
    throw Error('not found release pull request');
  }

  const content = releasePull.body;
  console.info('pulls body', content);

  await gitSwitchToMaybeExistingBranch(tagName);
  await gitPush(tagName, { force: true });
  await octokit.rest.repos.createRelease({
    name: tagName,
    tag_name: tagName,
    body: content || '',
    target_commitish: tagName,
    ...github.context.repo,
  });
};

interface CreateCommentOptions {
  githubToken: string;
  content: string;
  pullRequestNumber: string;
}

export const createComment = async (options: CreateCommentOptions) => {
  const { githubToken, content, pullRequestNumber } = options;
  const octokit = github.getOctokit(githubToken);
  octokit.rest.issues.createComment({
    issue_number: Number(pullRequestNumber),
    body: content,
    ...github.context.repo,
  });
};
