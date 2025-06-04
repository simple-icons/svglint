/**
 * @file XO Flat config file.
 */

/** @type {import('xo').FlatXoConfig} */
const xoConfig = [
	{
		prettier: true,
	},
	{
		ignores: ['test/projects/broken/broken-svglint-config.js'],
	},
	{
		rules: {
			'unicorn/prefer-event-target': 'off',
			'n/file-extension-in-import': 'off',
			'sort-imports': [
				'error',
				{
					ignoreCase: false,
					ignoreDeclarationSort: true,
					ignoreMemberSort: false,
					memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
					allowSeparatedGroups: false,
				},
			],
			'import-x/no-named-as-default': 'off',
			'import-x/extensions': 'off',
			'import-x/order': [
				'error',
				{
					groups: ['builtin', 'external', 'parent', 'sibling', 'index'],
					alphabetize: {
						order: 'asc',
						caseInsensitive: true,
					},
					warnOnUnassignedImports: true,
					'newlines-between': 'never',
				},
			],
			'promise/prefer-await-to-then': 'off',
			'no-console': ['error', {allow: ['warn', 'error']}],
		},
	},
];

export default xoConfig;
