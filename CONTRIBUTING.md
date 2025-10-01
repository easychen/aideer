# Contributing to AiDeer

Thank you for your interest in contributing to AiDeer! We welcome contributions from the community and are pleased to have you join us.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Create a new branch for your feature or bug fix
4. Make your changes
5. Test your changes thoroughly
6. Submit a pull request

## Development Setup

### Prerequisites

- Node.js (version 18 or higher)
- pnpm (recommended package manager)

### Installation

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/aideer.git
cd aideer

# Install dependencies
pnpm install

# Start development servers
# Frontend (port 3000)
cd frontend && pnpm dev

# Backend (port 3001)
cd backend && pnpm dev

# Website (port 5173)
cd website && pnpm dev
```

## Project Structure

- `/frontend` - React frontend application
- `/backend` - Node.js/TypeScript backend API
- `/website` - Marketing/documentation website
- `/browser-extension` - Browser extension for AiDeer
- `/electron` - Desktop application
- `/docsite` - Documentation site

## Code Style

- Use TypeScript for all new code
- Follow the existing code style and conventions
- Use meaningful variable and function names
- Add comments for complex logic
- Ensure your code passes linting checks

## Testing

- Write tests for new features and bug fixes
- Ensure all existing tests pass
- Test your changes in multiple browsers/environments when applicable

## Submitting Changes

### Pull Request Process

1. Ensure your code follows the project's coding standards
2. Update documentation if necessary
3. Add or update tests as appropriate
4. Fill out the pull request template completely
5. **Sign the Contributor License Agreement (CLA)**

### Contributor License Agreement (CLA)

Before we can accept your contribution, you need to agree to our [Contributor License Agreement (CLA)](CLA.md). This is a one-time requirement.

By submitting a pull request, you confirm that:
- You have read and agree to the CLA
- You are legally entitled to grant the license described in the CLA
- Your contribution is your original work or you have the right to submit it under the project's license

The CLA ensures that:
- You retain copyright to your contributions
- The project can distribute your contributions under the AGPL v3 license
- The project and its users are protected from potential legal issues

### Pull Request Guidelines

- Keep pull requests focused and atomic
- Write clear, descriptive commit messages
- Reference any related issues in your PR description
- Be responsive to feedback and requested changes
- Ensure CI checks pass before requesting review

## Reporting Issues

When reporting issues, please include:
- A clear description of the problem
- Steps to reproduce the issue
- Expected vs actual behavior
- Your environment details (OS, browser, Node.js version, etc.)
- Screenshots or error messages if applicable

## Feature Requests

We welcome feature requests! Please:
- Check if the feature has already been requested
- Provide a clear description of the feature
- Explain the use case and benefits
- Consider contributing the implementation yourself

## Code of Conduct

Please note that this project is released with a [Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.

## License

By contributing to AiDeer, you agree that your contributions will be licensed under the GNU Affero General Public License v3.0 (AGPL-3.0).

## Questions?

If you have questions about contributing, feel free to:
- Open an issue for discussion
- Contact the maintainers
- Join our community discussions

Thank you for contributing to AiDeer!