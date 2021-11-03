import * as core from '@actions/core';
import { release } from './release';

(async () => {
  const actionType = core.getInput('type');

  switch (actionType) {
    case 'release':
      await release();
      break;
    default:
      throw new Error('action type not support');
  }
})().catch(err => {
  console.error(err);
  core.setFailed(err.message);
});
