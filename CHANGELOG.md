# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2026-02-23

### Added

**Investigation Reports**:
- Created comprehensive investigation report for acp-mcp file access issue (GitHub #1)
- Documented root cause: path format mismatch between list_files and read_file
- Provided 3 alternative solutions with implementation plans
- Posted detailed solution to upstream GitHub issue

**Tasks**:
- Task 9: Investigate acp-mcp File Access Issue (completed)

**ACP Updates**:
- Updated to ACP v3.11.0 (from v3.10.1)
- Added @acp.project-create command
- Enhanced package management commands

### Changed

**Progress Tracking**:
- Milestone M2 progress: 67% → 75% (3/4 tasks completed)
- Updated next steps to reflect task 9 completion

## [1.0.1] - 2026-02-23

### Fixed

**Authentication**:
- Fixed JWT validation by creating custom `PlatformJWTProvider` to handle ESM imports correctly
- Fixed token resolution by creating custom `PlatformTokenResolver` with correct API endpoint format
- Changed resource type from `acp-remote-dev` to `acp` to match platform configuration
- Fixed SSH credentials parsing to correctly extract host, port, username, and private key from API response
- Added host:port parsing for `remote_url` field

**Dependencies**:
- Upgraded `@prmichaelsen/mcp-auth` from v1.0.0 to v7.0.4 for better stability and security
- Upgraded `@modelcontextprotocol/sdk` from v1.0.0 to v1.0.4

### Added

**Authentication Providers**:
- `src/auth/platform-jwt-provider.ts` - Custom JWT authentication provider for agentbase.me
- `src/auth/platform-token-resolver.ts` - Custom token resolver for fetching SSH credentials

**Reports**:
- `agent/reports/mcp-auth-server-base-auth-provider-issues.md` - Documentation of authentication issues for package maintainers
- `agent/reports/agentbase-ssh-key-format-issue.md` - Investigation report for SSH key format issues
- `agent/reports/agentbase-mcp-integration-missing.md` - Integration status and configuration guide

### Changed

**Server Configuration**:
- Updated `src/index.ts` to use custom authentication providers instead of built-in ones
- Improved SSH configuration parsing to handle agentbase.me API response format
- Enhanced logging for better debugging

## [1.0.0] - 2026-02-21

### Added

- Initial release
- Multi-tenant MCP server with JWT authentication
- SSH-based remote machine access
- Integration with agentbase.me platform
- Cloud Run deployment configuration
- Docker multi-stage builds
- Health check endpoint
