const esbuild = require('esbuild');

esbuild.build({
    entryPoints: ['src/extension.js'],
    bundle: true,
    outfile: 'out/extension.js',
    platform: 'node',
    external: ['vscode'],
    format: 'cjs',
}).catch(() => process.exit());