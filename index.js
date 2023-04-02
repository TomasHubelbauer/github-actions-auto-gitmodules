import fs from 'fs';
import child_process from 'child_process';
import util from 'util';
import drainAsyncGenerator from './drainAsyncGenerator.js';
import parseDotGitmodulesFile from './parseDotGitmodulesFile.js';
import parseDotGitModulesDirectory from './parseDotGitModulesDirectory.js';
import parseDotGitConfigFile from './parseDotGitConfigFile.js';

const exec = util.promisify(child_process.exec);

const dotGitmodules = await drainAsyncGenerator(parseDotGitmodulesFile());
console.log('.gitmodules:');
for (const { name, path, url } of dotGitmodules) {
  console.log(`\t${name} (${path}): ${url}`);
}

const dotGitModules = await drainAsyncGenerator(parseDotGitModulesDirectory());
console.log('.git/modules:');
for (const path of dotGitModules) {
  console.log(`\t${path}`);
}

const dotGitConfig = await drainAsyncGenerator(parseDotGitConfigFile());
console.log('.git/config:');
for (const { name, url, active } of dotGitConfig) {
  console.log(`\t${name}: ${url} (${active ? 'active' : 'inactive'})`);
}

// Install submodules added by name to `.gitmodules` not added by the Git command
for (const dotGitmodule of dotGitmodules) {
  if (dotGitmodule.name !== dotGitmodule.path) {
    throw new Error(`No support for submodule name !== path: ${dotGitmodule.name} !== ${dotGitmodule.path}`);
  }

  const dotGitModule = dotGitModules.find(dotGitModule => dotGitModule === dotGitmodule.path);
  if (!dotGitModule) {
    const { stdout, stderr } = await exec(`git submodule add ${dotGitmodule.url}`);
    if (stderr) {
      throw new Error(stderr);
    }

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

// Remove bits of submodules removed from `.gitmodules` but not by the Git command
for (const dotGitModule of dotGitModules) {
  const dotGitmodule = dotGitmodules.find(dotGitmodule => dotGitmodule.path === dotGitModule);
  if (!dotGitmodule) {
    const { stdout, stderr } = await exec(`git rm ${dotGitModule}`);
    if (stderr) {
      throw new Error(stderr);
    }

    console.log(`Removed submodule ${dotGitModule} from index because it is not in .gitmodules: ${stdout}`);

    await fs.promises.rm(`.git/modules/${dotGitModule}`, { recursive: true });
    console.log(`Removed submodule ${dotGitModule} from .git/modules because it is not in .gitmodules.`);
  }
}

for (const { name } of dotGitConfig) {
  const dotGitmodule = dotGitmodules.find(dotGitmodule => dotGitmodule.name === name);
  if (!dotGitmodule) {
    const { stdout, stderr } = await exec(`git config --remove-section submodule.${name}`);
    if (stderr) {
      throw new Error(stderr);
    }

    console.log(`Removed submodule ${name} from .git/config because it is not in .gitmodules: ${stdout}`);
  }
}
