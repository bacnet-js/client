# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

## Project Instructions

All coding standards, architecture patterns, testing guidelines, and contribution requirements are maintained in a single shared location:

**[.github/copilot-instructions.md](.github/copilot-instructions.md)**

That file is the primary reference for:

- Code style and TypeScript conventions
- Architecture patterns (event-driven design, buffer management, ASN.1 encoding)
- BACnet protocol specifics
- Testing strategy and coverage requirements
- Git workflow and conventional commits
- Pull request quality standards

## Quick Reference

```bash
# Build
npm run build

# Lint
npm run lint
npm run lint:fix

# Test
npm run test:all           # Run all tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:compliance    # Compliance tests only

# Development
npm run emulator:start     # Start BACnet device emulator
npm run docs               # Generate API docs with TypeDoc
```
