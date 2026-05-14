const originalConsoleLog = console.log;

console.log = (...args: unknown[]) => {
  if (args.some((a) => typeof a === 'string' && a.includes('prisma:'))) {
    return;
  }

  originalConsoleLog(...args);
};
