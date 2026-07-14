import { exec } from "child_process";
import { homedir } from "os";

// Dangerous commands that should never be executed
const BLOCKED_PATTERNS = [
  /rm\s+(-rf?|--recursive)\s+\/\s*$/,
  /rm\s+-rf?\s+\/\s*$/,
  /mkfs/,
  /dd\s+if=/,
  /format\s+[a-zA-Z]:/,
  /:(){ :\|:& };:/,  // fork bomb
  />\s*\/dev\/sd/,
  /chmod\s+-R\s+777\s+\//,
  /chown\s+-R.*\s+\//,
];

export async function executeCommand(
  command: string,
  cwd?: string,
  timeout: number = 30000
): Promise<string> {
  // Check for blocked commands
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(command)) {
      throw new Error(
        `Command blocked for safety: matches dangerous pattern. Command: ${command}`
      );
    }
  }

  const workingDir = cwd || homedir();

  return new Promise((resolve, reject) => {
    const process = exec(
      command,
      {
        cwd: workingDir,
        timeout,
        maxBuffer: 10 * 1024 * 1024, // 10MB max output
        env: { ...globalThis.process.env, TERM: "dumb" },
      },
      (error, stdout, stderr) => {
        let output = "";

        if (stdout) {
          output += `STDOUT:\n${stdout}\n`;
        }
        if (stderr) {
          output += `STDERR:\n${stderr}\n`;
        }

        if (error) {
          if (error.killed) {
            reject(
              new Error(`Command timed out after ${timeout}ms:\n${output}`)
            );
          } else {
            // Still return output even on non-zero exit code
            output += `\nExit code: ${error.code}`;
            resolve(output);
          }
        } else {
          output += "\nExit code: 0";
          resolve(output);
        }
      }
    );
  });
}
