import execa from 'execa';

export function execaWithStreamLog(
  command: string,
  args: string[],
  options?: Record<string, any>,
) {
  const promise = execa(command, args, {
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
    ...options,
  });
  return promise;
}
