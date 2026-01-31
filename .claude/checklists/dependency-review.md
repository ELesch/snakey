# Dependency Review Checklist

Use this checklist when adding or updating dependencies.

## Before Adding

- [ ] Is this dependency necessary?
- [ ] Are there lighter alternatives?
- [ ] What's the bundle size impact?
- [ ] Is it actively maintained?

## Security

- [ ] `npm audit` shows no vulnerabilities
- [ ] No known CVEs for this version
- [ ] Last update within 6 months
- [ ] Multiple maintainers

## License

- [ ] License is MIT, Apache-2.0, or BSD
- [ ] No copyleft (GPL) unless acceptable
- [ ] No AGPL dependencies

## Quality

- [ ] TypeScript types available
- [ ] Good documentation
- [ ] Reasonable download count
- [ ] Active issue resolution

## After Adding

- [ ] Package-lock.json updated
- [ ] Import works correctly
- [ ] Tests pass with new dependency
- [ ] Bundle size acceptable

## Updating

- [ ] Read changelog for breaking changes
- [ ] Test affected features
- [ ] Update any deprecated usage

---

**Reviewed By**: _______________
**Date**: _______________
**Package**: _______________
**Decision**: Add / Update / Reject
