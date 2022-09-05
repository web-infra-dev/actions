# Modern.js Actions

## Introduce

This Action containers two actions for [Modern.js](https://modernjs.dev/):

- Create a pull request with all of the package versions updated and changelogs updated

- Release packages to [NPM](https://www.npmjs.com/) and create Release to repo

## Usage

### Release Pull Request

#### Inputs

- type: action type. Used to distinguish action execution action. Here is 'pull request'
- version: release type. Support 'latest', 'canary', 'alpha', 'pre'
- versionNumber: release version. Support like 'v1.x.x' or 'auto'. When you use auto, this action will get the first packages version after running bump version.

#### REPO_SCOPED_TOKEN

This action need to set REPO_SCOPED_TOKEN. You can read [Creating a personal access token](https://docs.github.com/cn/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) to create presonal access token.

#### Outputs

Create Release Request for repository.

#### Example

```
name: Release Pull Request

on:
  workflow_dispatch:
    inputs:
      version:
        type: choice
        description: 'Release Type(canary, alpha, pre, latest)'
        required: true
        default: 'latest'
        options:
        - canary
        - alpha
        - pre
        - latest

jobs:
  release:
    name: Create Release Pull Request
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repo
        uses: actions/checkout@master
        with:
        # This makes Actions fetch only one branch to release
          fetch-depth: 100

      - name: Create Release Pull Request
        uses: modern-js-dev/actions@main
        with:
          # this expects you to have a script called release which does a build for your packages and calls changeset publish
          version: ${{ github.event.inputs.version }}
          versionNumber: 'auto'
          type: 'pull request'
        env:
          GITHUB_TOKEN: ${{ secrets.REPO_SCOPED_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          REPOSITORY: ${{ github.repository }}
          REF: ${{ github.ref }}
```

### Release

#### Inputs

- type: action type. Used to distinguish action execution action. Here is 'relesae'
- version: release type. Support 'latest', 'canary', 'alpha', 'pre'
- branch: release branch


#### REPO_SCOPED_TOKEN

This action need to set REPO_SCOPED_TOKEN. You can read [Creating a personal access token](https://docs.github.com/cn/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) to create presonal access token.

#### Outputs

Runtime Modern Release to publish packages to NPM

#### Example

```
name: Release

on:
  workflow_dispatch:
    inputs:
      version:
        type: choice
        description: 'Release Version(canary, alpha, pre, latest)'
        required: true
        default: 'canary'
        options:
        - canary
        - alpha
        - pre
        - latest
      branch:
        description: 'Release Branch(confirm release branch)'
        required: true
        default: 'main'

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repo
        uses: actions/checkout@master
        with:
        # This makes Actions fetch only one branch to release
          fetch-depth: 1

      - name: Release
        uses: modern-js-dev/actions@main
        with:
          # this expects you to have a script called release which does a build for your packages and calls changeset publish
          version: ${{ github.event.inputs.version }}
          branch: ${{ github.event.inputs.branch }}
          type: 'release'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          REPOSITORY: ${{ github.repository }}
          REF: ${{ github.ref }}

```
