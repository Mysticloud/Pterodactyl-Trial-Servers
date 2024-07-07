import { spawn } from 'cross-spawn';

const runCommand = (command) => {
  const [cmd, ...args] = command.split(' ');
  const child = spawn(cmd, args, { stdio: 'inherit' });

  return new Promise((resolve, reject) => {
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`${command} exited with code ${code}`));
        return;
      }
      resolve();
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
};

const buildAndStart = async () => {
  try {
    await runCommand('npm i --force');
    await runCommand('npm run build');
    await runCommand('npm run start');
  } catch (error) {
    console.error(error);
  }
};

buildAndStart();