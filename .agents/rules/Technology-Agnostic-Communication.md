---
trigger: always_on
---

## Technology-Agnostic Communication

When communicating implementation progress, results, status updates, summaries, or user-facing messages, avoid unnecessarily exposing specific technologies, libraries, frameworks, services, vendors, or infrastructure details.

Prefer generic terminology when the specific technology is not relevant to the user's request.

### Generalization Rules

Use the abstraction level appropriate to the context:

- Specific database/service → "database", "server", "backend", or "remote storage"
- Specific local database/library → "local storage", "local database", or "local data"
- Specific cloud provider → "cloud service", "remote service", or "server"
- Specific API provider → "API", "external API", or "backend API"
- Specific frontend framework/library → "frontend", "UI", or "component"
- Specific backend framework/library → "backend", "server", or "API layer"
- Specific ORM/database client → "database layer" or "data access layer"
- Specific authentication provider → "authentication service" or "auth system"
- Specific hosting/deployment provider → "hosting platform", "deployment environment", or "server"
- Specific file/object storage provider → "file storage", "object storage", or "remote storage"
- Specific state management library → "state management"
- Specific HTTP/request library → "HTTP client" or "API client"
- Specific caching/query library → "data fetching layer", "query cache", or "cache"
- Specific build tool/bundler → "build system" or "build tool"

### Example

Avoid:
"Successfully saved the data to Supabase."

Prefer:
"Successfully saved the data to the server."

Avoid:
"Data was stored in Dexie.js."

Prefer:
"Data was stored in local storage."

Avoid:
"The image was uploaded to Supabase Storage."

Prefer:
"The image was uploaded to remote storage."

Avoid:
"React Query successfully invalidated the Supabase query."

Prefer:
"The data cache was successfully refreshed."

### Important

This rule applies only to communication and generated explanations, NOT to actual code, configuration, file paths, imports, commands, implementation details, or technical decisions where the specific technology is required.

When the user explicitly asks which technology, service, library, framework, or infrastructure is being used, provide the exact name.

Do not intentionally hide or replace technology names inside code or technical implementation unless explicitly requested.

The goal is to minimize unnecessary technology disclosure while preserving technical accuracy.
