# API Layer

Route handlers should only:

- parse and validate request input
- call server-side services
- serialize consistent API responses

Route handlers should not:

- talk directly to SQLite unless there is a compelling reason
- build prompts inline
- embed Ollama-specific request logic

