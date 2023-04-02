import child_process from 'child_process';
import util from 'util';

const exec = util.promisify(child_process.exec);

export default async function runCommand(command) {
  const { stdout, stderr, exitCode } = await exec(command);
  if (stderr) {
    throw new Error(stderr);
  }

  if (exitCode !== undefined && exitCode !== 0) {
    throw new Error(`Exit code ${exitCode} from command: ${command}: ${stdout}`);
  }

  return stdout;
}
