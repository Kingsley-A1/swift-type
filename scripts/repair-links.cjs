const { existsSync, symlinkSync } = require('fs');
const { join } = require('path');

const root = process.cwd();

const links = [
  {
    link: join(root, 'node_modules', 'drizzle-orm'),
    target: join(
      root,
      'node_modules',
      '.pnpm',
      'drizzle-orm@0.45.1_@neondat_9360a1a974670b572bac20e1f6f7cd56',
      'node_modules',
      'drizzle-orm',
    ),
  },
  {
    link: join(root, 'node_modules', 'pg'),
    target: join(root, 'node_modules', '.pnpm', 'pg@8.20.0', 'node_modules', 'pg'),
  },
  {
    link: join(root, 'node_modules', '@types', 'pg'),
    target: join(
      root,
      'node_modules',
      '.pnpm',
      '@types+pg@8.18.0',
      'node_modules',
      '@types',
      'pg',
    ),
  },
];

for (const { link, target } of links) {
  if (!existsSync(link)) {
    symlinkSync(target, link, 'junction');
    console.log(`linked ${link}`);
  } else {
    console.log(`exists ${link}`);
  }
}
