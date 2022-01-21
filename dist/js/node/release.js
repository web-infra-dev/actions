"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.release = void 0;

var core = _interopRequireWildcard(require("@actions/core"));

var _utils = require("./utils");

var _fs = require("./utils/fs");

var _release = require("./utils/release");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

// eslint-disable-next-line max-statements
const release = async () => {
  const githubToken = process.env.GITHUB_TOKEN;
  const publishVersion = core.getInput('version');
  const publishBranch = core.getInput('branch');
  console.info('publishVersion', publishVersion);
  console.info('publishBranch', publishBranch);

  if (!githubToken) {
    core.setFailed('Please add the GITHUB_TOKEN');
    return;
  }

  await (0, _utils.gitConfigUser)();
  await (0, _fs.chagnePublishBranch)(publishBranch); // hack modern.js repo

  const repo = process.env.REPOSITORY; // prepare repo

  await (0, _release.runInstall)();
  await (0, _release.runPrepare)();

  if (repo === 'modern-js-dev/modern.js') {
    await (0, _fs.checkGeneratorDist)();
  }

  await (0, _release.writeNpmrc)(); // publish

  if (publishVersion === 'canary') {
    await (0, _release.bumpCanaryVersion)(publishVersion);
    await (0, _utils.gitCommitAll)('publish canary');
    await (0, _release.runRelease)(process.cwd(), 'canary');
  } else if (publishVersion === 'pre') {
    await (0, _utils.gitCommitAll)('publish pre');
    await (0, _release.runRelease)(process.cwd(), 'next');
    await (0, _utils.gitPushTags)();
  } else {
    await (0, _utils.gitCommitAll)('publish latest');
    await (0, _release.runRelease)(process.cwd(), 'latest');
    await (0, _utils.gitPushTags)();
  }
};

exports.release = release;