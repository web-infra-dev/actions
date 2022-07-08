import os from 'os';
import path from 'path';
import execa from 'execa';
import { fs, semver } from '@modern-js/utils';

export async function canUseYarn() {
  try {
    await execa('yarn', ['--version'], {
      env: process.env,
    });
    return true;
  } catch (e) {
    return false;
  }
}

export async function canUsePnpm() {
  try {
    await execa('pnpm', ['--version'], {
      env: process.env,
    });
    return true;
  } catch (e) {
    return false;
  }
}

export async function getPackageManager(cwd = process.cwd()) {
  let appDirectory = cwd;
  while (os.homedir() !== appDirectory) {
    if (appDirectory === path.sep) {
      break;
    }
    if (fs.existsSync(path.resolve(appDirectory, 'pnpm-lock.yaml'))) {
      return 'pnpm';
    }
    if (fs.existsSync(path.resolve(appDirectory, 'yarn.lock'))) {
      return 'yarn';
    }
    if (fs.existsSync(path.resolve(appDirectory, 'package-lock.json'))) {
      return 'npm';
    }
    appDirectory = path.join(appDirectory, '..');
  }
  if (await canUsePnpm()) {
    return 'pnpm';
  }
  return (await canUseYarn()) ? 'yarn' : 'npm';
}

/**
 * get package name and package version from package name string
 * @param {string} packageName
 * @returns {name: string, version: string}
 */
export function getPackageInfo(packageName: string) {
  if (!packageName) {
    throw new Error('package is not exisit');
  }
  const splitAt = packageName.split('@');
  let pkgVersion = 'latest';
  let pkgName = packageName;
  if (
    (!packageName.startsWith('@') && splitAt.length === 2) ||
    (packageName.startsWith('@') && splitAt.length === 3)
  ) {
    const semverValid = semver.valid(splitAt[splitAt.length - 1]);
    if (semverValid === null) {
      pkgVersion = splitAt[splitAt.length - 1];
      pkgName = packageName.slice(0, packageName.lastIndexOf('@'));
    } else {
      pkgVersion = semverValid;
      pkgName = packageName.split(semverValid)[0].slice(0, -1);
    }
  }
  return {
    name: pkgName,
    version: pkgVersion,
  };
}
