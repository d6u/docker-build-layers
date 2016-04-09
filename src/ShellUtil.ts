import {join} from 'path';
import {spawn} from 'child_process';

export function exec(cmd: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    console.log(`---> Executing "${cmd}"`);

    const args = cmd.split(' ');
    const child = spawn(args[0], args.slice(1), {
      cwd: process.cwd(),
      stdio: 'inherit',
    });

    child.on('exit', (code: number, signal: string) => {
      if (code === 0 || code == null) {
        resolve();
      } else {
        reject(new Error(`"${cmd}" exited with code ${code} ${signal}`));
      }
    });
  });
}
