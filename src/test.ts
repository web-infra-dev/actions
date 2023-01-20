import * as github from '@actions/github';
import * as core from '@actions/core';

const sleep = (time: number) => {
  return new Promise(resolve => {
    setTimeout(resolve, time);
  });
};
export const test = async () => {
  const githubToken = process.env.GITHUB_TOKEN as string;
  const publishVersion = core.getInput('version');
  const publishBranch = core.getInput('branch');
  console.info('[githubToken]:', githubToken);
  console.info('[publishVersion]:', publishVersion);
  console.info('[publishBranch]:', publishBranch);
  const options = {
    publishBranch,
    githubToken,
    baseBranch: publishVersion,
  };
  // 获取发布 Pull Request
  const octokit = github.getOctokit(githubToken);
  const pulls = await octokit.rest.pulls.list({
    ...options,
    ...github.context.repo,
  });
  if (pulls.data.length === 0) {
    throw Error('not found release pull request');
  }

  const content = pulls.data[0].body;
  console.info('[PULL Body]', content);
  sleep(1000000);
};
