import dynamicImportVars from '@rollup/plugin-dynamic-import-vars';
// eslint-disable-next-line unicorn/prefer-module
const packageJson = require('./package.json');

const config = {
    input: './src/svglint.js',
    output: {
        exports: 'auto',
        file: './src/svglint.cjs',
        format: 'cjs',
        inlineDynamicImports: true,
    },
    external: [
        'node:events',
        'node:fs',
        'node:path',
        'node:util',
        'node:url',
        ...Object.keys(packageJson.dependencies || {}),
        ...Object.keys(packageJson.peerDependencies || {}),
    ],
    plugins: [
        dynamicImportVars({
            warnOnError: true, // Disables errors caused by dynamic import of plugins
        }),
    ],
};

export default config;
