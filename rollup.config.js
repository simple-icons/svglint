import fs from 'node:fs';
import dynamicImportVars from '@rollup/plugin-dynamic-import-vars';

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

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
		'node:url',
		'node:util',
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
