import fs from 'node:fs';
import { test, it } from 'node:test';
import assert from 'node:assert/strict';
import url from 'node:url';
import path from 'node:path'
import runCommand from './runCommand.js';
import drainAsyncGenerator from './drainAsyncGenerator.js';
import parseDotGitmodulesFile from './parseDotGitmodulesFile.js';
import parseGitLsFilesCommand from './parseGitLsFilesCommand.js';
import parseDotGitModulesDirectory from './parseDotGitModulesDirectory.js';
import parseDotGitConfigFile from './parseDotGitConfigFile.js';

test('add submodule', async () => {
  // Clean up stray `super` folder left in case the test failed on the prior run
  try {
    await fs.promises.access('super');
    await fs.promises.rm('super', { recursive: true });
  }
  catch { }

  // Clean up stray `sub` folder left in case the test failed on the prior run
  try {
    await fs.promises.access('sub');
    await fs.promises.rm('sub', { recursive: true });
  }
  catch { }

  // Make a directory for the super repository we will add the submodule to later
  await fs.promises.mkdir('super');

  // Go to the test repository directory to make all file system calls work on it
  process.chdir('super');

  // Turn the directory into a Git repository
  assert.match(
    await runCommand('git init'),
    /^Initialized empty Git repository in .*\/super\/.git\/\n$/
  );

  // Assert the `.gitmodules` file is empty (does not exist)
  assert.deepEqual(
    await drainAsyncGenerator(parseDotGitmodulesFile()),
    []
  );

  // Assert the `git ls-files` command returns nothing
  assert.deepEqual(
    await drainAsyncGenerator(parseGitLsFilesCommand()),
    []
  );

  // Assert the `.git/modules` directory is empty (does not exist)
  assert.deepEqual(
    await drainAsyncGenerator(parseDotGitModulesDirectory()),
    []
  );

  // Assert the `.git/config` file has no `submodule` sections
  assert.deepEqual(
    await drainAsyncGenerator(parseDotGitConfigFile()),
    []
  );

  // Assert that `git submodule status` shows no submodule is checked out
  assert.equal(
    await runCommand('git submodule status'),
    ''
  );

  // Go back up to be able to create a directory alongside the `super` directory
  process.chdir('..');

  // Make a directory for the sub repository which is the submodule we will add
  await fs.promises.mkdir('sub');

  // Go to the test repository directory to make all file system calls work on it
  process.chdir('sub');

  // Turn the directory into a Git repository
  assert.match(
    await runCommand('git init'),
    /^Initialized empty Git repository in .*\/sub\/.git\/\n$/
  );

  // Add a README to the submodule so it is not empty and is easier to inspect
  await fs.promises.writeFile('README.md', 'Hello, world!\n');

  // Stage the README
  assert.equal(
    await runCommand('git add README.md'),
    ''
  );

  // Commit the README
  assert.match(
    await runCommand('git commit -m "Add a README" -m "The README is here to make the submodule non-empty"'),
    /^\[main \(root-commit\) \w{7}\] Add a README\n 1 file changed, 1 insertion\(\+\)\n create mode 100644 README.md\n$/
  );

  // Go back up and re-enter the `super` directory to be able to add the submodule
  process.chdir('../super');

  // Add the submodule to `.gitmodules` to simulate doing it via the GitHub web UI
  await fs.promises.writeFile('.gitmodules', '[submodule "sub"]\n\tpath = sub\n\turl = ../sub\n');

  // Run the main script which should notice this and sort out the repo state
  await import('./index.js');

  // Assert the `.gitmodules` file is not empty (contains the module)
  assert.deepEqual(
    await drainAsyncGenerator(parseDotGitmodulesFile()),
    [{ name: 'sub', path: 'sub', url: '../sub' }]
  );

  // Assert the `git ls-files` command returns nothing
  assert.deepEqual(
    await drainAsyncGenerator(parseGitLsFilesCommand()),
    ['sub']
  );

  // Assert the `.git/modules` directory is empty (does not exist)
  assert.deepEqual(
    await drainAsyncGenerator(parseDotGitModulesDirectory()),
    ['sub']
  );

  // Assert the `.git/config` file has no `submodule` sections
  assert.deepEqual(
    await drainAsyncGenerator(parseDotGitConfigFile()),
    [{ active: true, name: 'sub', url: path.join(url.fileURLToPath(import.meta.url), '../sub') }]
  );

  // Assert that `git submodule status` shows the submodule is checked out
  assert.match(
    await runCommand('git submodule status'),
    /^ \w{40} sub \(heads\/main\)\n$/
  );

  // Go back out from `super` to be able to clean up the two repository folders
  process.chdir('..');

  // Delete the `super` repository directory
  //await fs.promises.rm('super', { recursive: true });

  // Delete the `sub` repository directory
  //await fs.promises.rm('sub', { recursive: true });
});

it.todo('remove submodule', async () => { });

it.todo('clone with submodules', async () => { });
