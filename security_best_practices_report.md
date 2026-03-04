# Security Best Practices Report — my-player

## Executive Summary
本项目是一个前端音乐播放器 + NestJS 后端 + Netease Cloud Music API 代理服务的全栈应用。整体功能清晰，但后端对外接口目前缺少身份认证与输入校验，若部署到公网会有明显安全风险。建议在对外暴露前补齐认证授权、输入校验与基础安全头，并加上请求限流/超时等防护。

## Scope
- 前端：Vite + React (`src/`)
- 后端：NestJS + Prisma + Postgres (`server/`)
- NCM API 服务：`services/ncm-api/`

## Findings

### High Severity

**SBP-001: Playlist CRUD endpoints are unauthenticated/unauthorized**
- Location: `server/src/playlists/playlists.controller.ts:6-27`
- Evidence:
  ```ts
   6: @Controller('playlists')
  10:   @Get()
  15:   @Post()
  20:   @Patch(':id')
  25:   @Delete(':id')
  ```
- Impact: If the API is reachable beyond localhost, any caller can create/update/delete playlists without authentication. This is a data integrity and abuse risk.
- Fix: Add authentication (e.g., JWT/session) and authorization guards on playlist routes; enforce user ownership in service layer.
- Mitigation: If this is strictly local-only, bind to localhost and restrict network access at the firewall or reverse proxy.
- False positive notes: Risk is lower if the server is guaranteed to be local-only and not exposed to untrusted networks.

### Medium Severity

**SBP-002: No request validation on playlist inputs**
- Location: `server/src/playlists/dto/create-playlist.dto.ts:1-4`, `server/src/playlists/dto/update-playlist.dto.ts:1-4`, `server/src/main.ts:1-33`
- Evidence:
  ```ts
   1: export class CreatePlaylistDto {
   2:   name: string;
   3:   description?: string;
   4:   trackIds?: string[];
   5: }
  ```
  ```ts
   1: export class UpdatePlaylistDto {
   2:   name?: string;
   3:   description?: string;
   4:   trackIds?: string[];
   5: }
  ```
- Impact: The API accepts arbitrary shapes/types and unbounded arrays/strings, which can lead to data inconsistency, unexpected errors, or payload-based DoS.
- Fix: Add `class-validator` decorators on DTOs and enable a global `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, and type transformation. Add size/length limits for `trackIds` and `name`.
- Mitigation: Add DB-level constraints (string length) and request body size limits.
- False positive notes: If this is a trusted internal-only service, risk is reduced but still affects robustness.

### Low Severity

**SBP-003: Missing baseline security headers / fingerprinting protections**
- Location: `server/src/main.ts:1-33`
- Evidence:
  ```ts
   7:   const app = await NestFactory.create(AppModule);
   8:   app.enableCors({ ... });
  30:   const port = process.env.PORT ?? 3000;
  31:   await app.listen(port);
  ```
- Impact: Without `helmet()` or disabling `x-powered-by`, the server misses common defense-in-depth headers and is easier to fingerprint.
- Fix: Add `helmet()` and `app.disable('x-powered-by')`; set CSP at the edge if serving frontend assets.
- Mitigation: Configure these headers at a reverse proxy/CDN if app-level changes aren’t possible.
- False positive notes: If headers are set at an upstream reverse proxy, this might already be covered—verify at runtime.

**SBP-004: Upstream proxy fetch has no timeout or response size guard**
- Location: `server/src/netease/netease.service.ts:26-29`
- Evidence:
  ```ts
  26:     const response = await fetch(url.toString());
  27:     const contentType = response.headers.get('content-type') ?? '';
  28:     const raw = await response.text();
  29:     const data = contentType.includes('application/json') ? JSON.parse(raw) : raw;
  ```
- Impact: A slow or very large upstream response can tie up server resources and degrade availability (DoS risk). `JSON.parse` can also throw on malformed upstream responses.
- Fix: Add an `AbortController` timeout and cap response size before parsing; wrap `JSON.parse` in a try/catch and return a controlled error.
- Mitigation: Apply upstream timeouts and size limits at a reverse proxy.
- False positive notes: If a proxy already enforces timeouts/limits, impact is lower.

---
Report generated on 2026-03-03.
