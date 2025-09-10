import logging from '../lib/logger.js';

const logger = logging('rule:attr');

/** @typedef {import('cheerio').Cheerio<import('domhandler').Document>} Cheerio */
/** @typedef {import("../lib/reporter.js")} Reporter */
/** @typedef {import("../lib/parse.js").AST} AST */
/** @typedef {import("../lib/parse.js").Node} Node */

/**
 * @typedef {Object<string,string|string[]|boolean|RegExp>} AttrConfig
 *
 * The key represents the attribute name. The value has the following meanings:
 * - `{Boolean}` If true, the attr must exist. If false, it must not exist.
 * - `{String}` The attr value must match this exactly. It must also exist.
 * - `{RegExp}` The attr value must match the regex.
 * - `{Array<String>}` The attr value must be one of these. It must also exist.
 *
 * The following special configs are allowed:
 * - `{ "rule::selector": {String} }` Default "*". The matching elements must fulfill the other configs.
 * - `{ "rule::whitelist": {Boolean} }` Default `false`. If true, no other attributes can exist than those specified by the other configs.
 * - `{ "rule::order": {Array<String> | Boolean} }` Default `null`. As array, attributes must be defined in the provided order. As `true`, attributes must be defined in alphabetical order.
 * - `{ "<attribute>?": {Boolean|String|RegExp|Array<String>} }` Appending a `?` to an attribute name will make that attribute optional, and it will not error if it is missing when `rule::whitelist` is set.
 */

/**
 * Workflow:
 * 1. Find all elements matching the selector.
 * 2. For each element:
 *   - Go through every rule in the config
 *	 - If their attribute must exist, check that it does
 *   - Go through every attribute on the element
 *	 - If it has a config:
 *	   - If allowed, remove it from the attr list
 *	   - If disallowed, error and remove it from the attr list
 *   - If whitelist is true, error if there are non-optional attributes left
 */

const SPECIAL_ATTRIBS = new Set([
	'rule::selector',
	'rule::whitelist',
	'rule::order',
]);

const OPTIONAL_SUFFIX = '?';

const isAttributeOptional = (attribute) => attribute.endsWith(OPTIONAL_SUFFIX);

/**
 * Executes on a single element.
 * @param {Cheerio} $elm The cheerio element to execute on
 * @param {AttrConfig} config The config to execute
 * @param {Reporter} reporter The rule reporter
 * @param {AST} ast The AST we are executing on
 */
// eslint-disable-next-line complexity
function executeOnElm($elm, config, reporter, ast) {
	// @ts-ignore
	const attributes_ = {...$elm.attribs};
	// Check that all attributes that must exist do so
	for (const attrib of Object.keys(config)) {
		// Do nothing with special configs
		if (SPECIAL_ATTRIBS.has(attrib)) {
			continue;
		}

		// Do nothing with optional attributes
		if (isAttributeOptional(attrib)) {
			continue;
		}

		// If defined and not false it must exist
		if (config[attrib] && !(attrib in attributes_)) {
			reporter.error(
				`Expected attribute '${attrib}', didn't find it`,
				$elm,
				ast,
			);
		}
	}

	if (config['rule::order']) {
		const attributes = Object.keys(attributes_);
		if (attributes.length > 0) {
			let order;
			if (config['rule::order'] === true) {
				// Alphabetical ordering
				order = [...attributes];
				order.sort();
			} else {
				order = config['rule::order'];
			}

			let previousIndex = order.indexOf(attributes[0]);
			for (let i = 1; i < attributes.length; i++) {
				const index = order.indexOf(attributes[i]);
				if (index === -1) {
					// This attribute doesn't need ordering, ignore it
					break;
				}

				if (previousIndex !== -1 && index < previousIndex) {
					reporter.error(
						`Wrong ordering of attributes, found "${attributes.join(
							', ',
						)}", expected "${order.join(', ')}"`,
						$elm,
						ast,
					);
					break;
				}

				previousIndex = index;
			}
		}
	}

	// Check that all configs are met
	for (const attrib of Object.keys(attributes_)) {
		const value = attributes_[attrib];
		const expected =
			config[attrib] === undefined
				? config[`${attrib}${OPTIONAL_SUFFIX}`]
				: config[attrib];
		let handled = false;
		// Check each type
		// eslint-disable-next-line default-case
		switch (typeof expected) {
			case 'boolean': {
				handled = true;
				if (expected === false) {
					reporter.error(`Attribute '${attrib}' is disallowed`, $elm, ast);
				}

				break;
			}

			case 'string': {
				handled = true;
				if (value !== expected) {
					reporter.error(
						`Expected attribute '${attrib}' to be "${expected}", was "${value}"`,
						$elm,
						ast,
					);
				}

				break;
			}

			case 'object': {
				if (Array.isArray(expected)) {
					handled = true;
					if (!expected.includes(value)) {
						reporter.error(
							`Expected attribute '${attrib}' to be one of ${JSON.stringify(
								expected,
							)}, was "${value}"`,
							$elm,
							ast,
						);
					}
				} else if (expected instanceof RegExp) {
					handled = true;
					if (!expected.test(value)) {
						reporter.error(
							`Expected attribute '${attrib}' to match ${expected}, was "${value}"`,
							$elm,
							ast,
						);
					}
				} else {
					reporter.warn(
						`Unknown config for attribute '${attrib}' (${JSON.stringify(
							expected,
						)}), ignoring`,
						$elm,
						ast,
					);
				}

				break;
			}
		}

		// If we handled the attribute (i.e. we had a config for it)
		// then remove it from our attribute list
		if (handled) {
			delete attributes_[attrib];
		}
	}

	if (config['rule::whitelist']) {
		const remaining = Object.keys(attributes_).filter(
			(attribute) => !isAttributeOptional(attribute),
		);

		if (remaining.length > 0) {
			reporter.error(
				`Found extra attributes ${JSON.stringify(remaining)} with whitelisting enabled`,
				$elm,
				ast,
			);
		}
	}
}

const attribute = {
	/**
	 * Generates a linting function from a config
	 * @param {AttrConfig} config
	 */
	generate(config) {
		/**
		 * Performs the linting according to the previously passed config.
		 * @param {Reporter} reporter The reporter to report warnings/errors to
		 * @param {Cheerio} $ A cheerio representation of the document
		 * @param {AST} ast The underlying AST representation of the document.
		 *				  This should be given to Reporter when warning/erroring with a node.
		 */
		return function (reporter, $, ast) {
			logger.debug('Called', config);

			// Find all elements that match the selector and execute on them
			const selector = config['rule::selector'] || '*';
			const $elms = $.find(selector).toArray();
			logger.debug('Found elms for selector', selector, $elms.length);
			for (const $elm of $elms) {
				executeOnElm($elm, config, reporter, ast);
			}
		};
	},
};

export default attribute;
