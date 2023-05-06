import child_process from 'child_process';
import util from 'util';

const exec = util.promisify(child_process.exec);

/**
 * 
 * @param {string} command The command to execute
 * @param {*} swapStd Whether to treat stderr (true) or stdout (false) as failure
 * @returns 
 */
export default async function runCommand(command, swapStd = false) {
  /** @type {string} */
  let stdout;

  /** @type {string} */
  let stderr;

  try {
    const streams = await exec(command);
    stdout = streams.stdout;
    stderr = streams.stderr;
  }
  catch ({ code, killed, signal, stdout, stderr }) {
    throw new Error(`'${command}' exited with a non-zero exit code ${code}${killed ? ` due to being killed by ${signal}` : ''}.\n\nStandard output:\n${stdout}\n\nStandard error:\n${stderr}`);
  }

  if (swapStd ? stdout : stderr) {
    throw new Error(`'${command}' exited with code zero with non-empty standard ${swapStd ? 'output' : 'error'}.\n\nStandard output:\n${stdout}\n\nStandard error:\n${stderr}`);
  }

  return swapStd ? stderr : stdout;
}
