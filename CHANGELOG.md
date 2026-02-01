# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Error boundaries for graceful error handling
- Accessibility improvements (skip navigation, form accessibility, chart alternatives)
- Comprehensive test coverage for repositories and API routes
- Chart code splitting for performance

### Changed
- Standardized API response format across all endpoints
- Dashboard query optimization (removed N+1 queries)
- Reports pagination (max 1000 records)

### Fixed
- Color contrast for WCAG compliance
- Null query parameter handling in API routes (allows Zod defaults to apply)
