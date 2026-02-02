# API Review Checklist

> Target: RESTful, consistent, developer-friendly API

## Pre-Review
- [ ] Understand API consumers
- [ ] Review existing API documentation

## REST Conventions

### HTTP Methods
- [ ] GET for reading (idempotent, no side effects)
- [ ] POST for creating resources
- [ ] PUT for full resource replacement
- [ ] PATCH for partial updates
- [ ] DELETE for resource removal

### Status Codes
- [ ] 200 OK for successful reads/updates
- [ ] 201 Created for new resources (with Location header)
- [ ] 204 No Content for successful deletes
- [ ] 400 Bad Request for client errors
- [ ] 401 Unauthorized for missing/invalid auth
- [ ] 403 Forbidden for insufficient permissions
- [ ] 404 Not Found for missing resources
- [ ] 409 Conflict for state conflicts
- [ ] 422 Unprocessable Entity for validation errors
- [ ] 500 Internal Server Error for unexpected failures

### URL Design
- [ ] Plural nouns for collections (/users not /user)
- [ ] No verbs in URLs (/users not /getUsers)
- [ ] Logical nesting (/users/:id/posts)
- [ ] Consistent casing (kebab-case preferred)
- [ ] Max 2-3 levels of nesting

## Request/Response

### Request Format
- [ ] JSON content type
- [ ] Consistent field naming (camelCase or snake_case)
- [ ] Validation errors return field-level details
- [ ] Request size limits defined

### Response Format
- [ ] Consistent envelope (or consistently none)
- [ ] Timestamps in ISO 8601
- [ ] IDs consistently named
- [ ] Null vs undefined consistent

### Pagination
- [ ] Consistent pagination strategy
- [ ] Page metadata included (total, pages, current)
- [ ] Cursor-based for large datasets
- [ ] Reasonable defaults and limits

### Filtering/Sorting
- [ ] Filter parameters consistent
- [ ] Sort parameter follows convention
- [ ] Searchable fields documented

## Security

### Authentication
- [ ] Auth required for protected endpoints
- [ ] Token format documented
- [ ] Token expiration handled

### Authorization
- [ ] Resource ownership verified
- [ ] Role/permission checks present
- [ ] No IDOR vulnerabilities

### Input Validation
- [ ] All input validated
- [ ] Injection prevented
- [ ] File uploads restricted

## Documentation

- [ ] All endpoints documented
- [ ] Request/response examples provided
- [ ] Error responses documented
- [ ] Authentication explained
- [ ] Rate limits documented (if applicable)

## Versioning

- [ ] Version strategy defined (URL or header)
- [ ] Breaking changes versioned
- [ ] Deprecation policy documented

## Sign-Off
- Reviewer: _______
- Date: _______
- Issues: [ ] None [ ] See below

| Severity | Issue | Convention | Endpoint | Fix |
|----------|-------|------------|----------|-----|
| | | | | |
