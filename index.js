import fs from 'fs';
import drainAsyncGenerator from './drainAsyncGenerator.js';
import parseDotGitmodulesFile from './parseDotGitmodulesFile.js';
import parseDotGitModulesDirectory from './parseDotGitModulesDirectory.js';
import parseDotGitConfigFile from './parseDotGitConfigFile.js';
import parseGitLsFilesCommand from './parseGitLsFilesCommand.js';
import runCommand from './runCommand.js';

const dotGitmodules = await drainAsyncGenerator(parseDotGitmodulesFile());
console.log('.gitmodules:');
for (const { name, path, url } of dotGitmodules) {
  console.log(`\t${name} (${path}): ${url}`);
}

const gitLsFiles = await drainAsyncGenerator(parseGitLsFilesCommand());
console.log('git ls-files:');
for (const path of gitLsFiles) {
  console.log(`\t${path}`);
}

// Remove submodule directories removed from `.gitmodules` but not by the Git command
for (const gitLsFile of gitLsFiles) {
  const dotGitmodule = dotGitmodules.find(dotGitmodule => dotGitmodule.path === gitLsFile);
  if (!dotGitmodule) {
    const stdout = await runCommand(`git rm --cached ${gitLsFile}`);
    console.log(`Removed submodule ${gitLsFile} from index because it is not in .gitmodules: ${stdout}`);
  }
}

const dotGitModules = await drainAsyncGenerator(parseDotGitModulesDirectory());
console.log('.git/modules:');
for (const path of dotGitModules) {
  console.log(`\t${path}`);
}

// Remove bits of submodules removed from `.gitmodules` but not by the Git command
for (const dotGitModule of dotGitModules) {
  const dotGitmodule = dotGitmodules.find(dotGitmodule => dotGitmodule.path === dotGitModule);
  if (!dotGitmodule) {
    await fs.promises.rm(`.git/modules/${dotGitModule}`, { recursive: true });
    console.log(`Removed submodule ${dotGitModule} from .git/modules because it is not in .gitmodules.`);
  }
}

const dotGitConfig = await drainAsyncGenerator(parseDotGitConfigFile());
console.log('.git/config:');
for (const { name, url, active } of dotGitConfig) {
  console.log(`\t${name}: ${url} (${active ? 'active' : 'inactive'})`);
}

// Remove sections of submodules removed from `.gitmodules` but not by the Git command
for (const { name } of dotGitConfig) {
  const dotGitmodule = dotGitmodules.find(dotGitmodule => dotGitmodule.name === name);
  if (!dotGitmodule) {
    const stdout = await runCommand(`git config --remove-section submodule.${name}`);
    console.log(`Removed submodule ${name} from .git/config because it is not in .gitmodules: ${stdout}`);
  }
}

// Install submodules added by name to `.gitmodules` not added by the Git command
for (const dotGitmodule of dotGitmodules) {
  if (dotGitmodule.name !== dotGitmodule.path) {
    throw new Error(`No support for submodule name !== path: ${dotGitmodule.name} !== ${dotGitmodule.path}`);
  }

  const dotGitModule = dotGitModules.find(dotGitModule => dotGitModule === dotGitmodule.path);
  if (!dotGitModule) {
    const stdout = await runCommand(`git submodule add ${dotGitmodule.url}`);
    console.log(`Added submodule ${dotGitmodule.name} to .git/modules because it is not in .git/modules: ${stdout}`);
  }

  if (!dotGitConfig.find(dotGitConfig => dotGitConfig.name === dotGitmodule.name)) {
    throw new Error(`No .git/config entry found for submodule ${dotGitmodule.name}.`);
  }

  const { name, url, active } = dotGitConfig.find(dotGitConfig => dotGitConfig.name === dotGitmodule.name);
  if (url !== dotGitmodule.url) {
    throw new Error(`URL mismatch for submodule ${name}: ${url} !== ${dotGitmodule.url}`);
  }

  if (!active) {
    throw new Error(`Submodule ${name} is not active.`);
  }
}
