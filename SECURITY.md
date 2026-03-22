# Security Policy

## Reporting a Security Vulnerability

If you discover a security vulnerability in this project, **do not open a public issue**. Instead, please email security details to the maintainer privately.

### Reporting Process

1. **Email the maintainer** (GitHub: [@sudohakan](https://github.com/sudohakan))
2. **Include details**: Affected version, vulnerability type, reproduction steps
3. **Allow 7-14 days** for an initial response
4. **Avoid public disclosure** until a fix is released

We take security seriously and will acknowledge your report and work toward a fix.

## Security Model

### OAuth 2.0 Authentication

This server uses Google's OAuth 2.0 protocol for authentication:

- **Local Credential Storage**: Credentials are stored locally in `.gtasks-server-credentials.json` (not committed to version control)
- **No Embedded Secrets**: OAuth keys are provided by the user at setup time
- **Secure Scopes**: Requests only the `https://www.googleapis.com/auth/tasks` scope
- **Token Refresh**: Automatic token refresh managed by the Google Cloud library

### Sensitive Data Handling

- **API Keys/Credentials**: Never hardcode secrets. Store in environment variables or config files outside the repository
- **Credentials File**: Add to `.gitignore` — `.gtasks-server-credentials.json` is not tracked
- **Log Output**: Do not log authentication tokens or sensitive task data in production

### Access Control

- This server runs locally and communicates only with Google's API
- No external network calls beyond Google Tasks API
- No data is stored on remote servers (except by Google for your Google Tasks account)
- Each user manages their own Google credentials independently

## Best Practices for Users

1. **Keep credentials private**: Do not share `.gtasks-server-credentials.json` or `gcp-oauth.keys.json`
2. **Revoke access if needed**: Visit [Google Account](https://myaccount.google.com/permissions) to revoke app access
3. **Use environment variables**: For deployment, use environment-based configuration instead of files
4. **Rotate credentials**: Periodically regenerate OAuth keys in Google Cloud Console
5. **Monitor permissions**: Review the scopes requested during OAuth flow — this app only needs tasks access

## Dependency Security

This project depends on:

- `@google-cloud/local-auth`: Secure local authentication
- `@modelcontextprotocol/sdk`: MCP protocol implementation
- `googleapis`: Official Google API client

We recommend:
- Keep dependencies updated: `npm audit` and `npm update` regularly
- Monitor security advisories for breaking changes
- Report security issues in dependencies to their maintainers

## Compliance

- **License**: MIT (no license-related restrictions)
- **Data Privacy**: This server does not collect data; it only manages your Google Tasks
- **GDPR**: Users control their own data through Google's privacy settings
- **No Telemetry**: This server does not send any telemetry or usage data

## Security Checklist for Deployments

Before deploying this server to production:

- [ ] Store credentials in environment variables or secure vaults (not in files)
- [ ] Use HTTPS for all API communication (automatic with Google APIs)
- [ ] Restrict access to the server's port to trusted clients only
- [ ] Keep Node.js and dependencies up to date
- [ ] Monitor logs for suspicious authentication failures
- [ ] Regularly audit Google account connected apps
- [ ] Use strong Google account passwords and 2FA on Google accounts

## Vulnerability Disclosure Timeline

We follow responsible disclosure practices:

1. **Report**: Maintainer receives vulnerability report privately
2. **Acknowledgment**: Response within 7 days
3. **Assessment**: Severity determination and reproduction
4. **Development**: Fix is developed and tested
5. **Release**: Patch version released; advisories posted
6. **Disclosure**: Public security advisory after release

For questions about security, please reach out to the maintainer privately.
