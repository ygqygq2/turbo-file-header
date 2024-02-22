export const log = (...args: any[]) => {
  const line = args.map((obj) => (typeof obj === 'object' ? JSON.stringify(obj) : obj)).join(' ');
  return line;
};
