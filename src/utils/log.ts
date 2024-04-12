// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const log = (...args: any[]) => {
  const line = args.map((obj) => (typeof obj === 'object' ? JSON.stringify(obj) : obj)).join(' ');
  return line;
};
