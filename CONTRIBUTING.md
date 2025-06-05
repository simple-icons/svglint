# Contributing

## Commands

- Lint with `npm run lint`.
- Format with `npm run format`.
- Run tests with `npm test`.

## Release process

This project uses [`semantic-release`] for automating the release process. The
plugins are configured in *package.json*:

- [`@semantic-release/commit-analyzer`] with the `angular` preset to analyze
  commit messages and determine the type of release (major, minor, patch).
  So the each commit message must follow the format defined by
  [Angular's commit message format].
- [`@semantic-release/release-notes-generator`] to generate release notes
  based on the commit messages.
- [`@semantic-release/npm`] to publish the package to npm.
- [`@semantic-release/github`] to create a GitHub release, upload the
  generated release notes and comment on released pull requests and issues.
- [`@semantic-release/git`] to commit a version bump to the repository before
  publishing the release.

So, the release processs is really simple.

1. Accept and merge pull requests prefixing the commit messages to follow the
   Angular commit message format.
2. When a new release is ready, run the [Release workflow] manually using its
   GitHub Actions interface.

Remember:

- Prefix commit messages with `fix:`, `feat:`, `chore:`, `BREAKING CHANGE:` etc.
- Don't manually commit version bumps.
- Dispatch manually the [Release workflow] when a new release is ready.

[`semantic-release`]: https://github.com/semantic-release/semantic-release
[`@semantic-release/commit-analyzer`]: https://github.com/semantic-release/commit-analyzer
[Angular's commit message format]: https://github.com/angular/angular/blob/main/contributing-docs/commit-message-guidelines.md
[`@semantic-release/release-notes-generator`]: https://github.com/semantic-release/release-notes-generator
[`@semantic-release/npm`]: https://github.com/semantic-release/npm
[`@semantic-release/github`]: https://github.com/semantic-release/github
[Release workflow]: https://github.com/simple-icons/svglint/actions/workflows/release.yml
