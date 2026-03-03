# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`@bacnet-js/client` — a BACnet® protocol stack written in pure TypeScript for Node.js (>= 20). Implements ASHRAE 135 standard for building automation and control networks. Published as an npm package with only two runtime dependencies (`debug`, `iconv-lite`).

## Commands

```bash
npm run build                # TypeScript compile (tsconfig.build.json)
npm run lint                 # ESLint check
npm run lint:fix             # ESLint auto-fix

npm run test:all             # All tests (unit + integration + compliance)
npm run test:unit            # Unit tests only
npm run test:integration     # Integration tests only
npm run test:compliance      # Compliance tests (requires emulator, runs sequentially)

# Run a single test file
node --require esbuild-register --test test/unit/service-read-property.spec.ts

npm run emulator:start       # Start BACnet device emulator (needed for compliance tests)
npm run docs                 # Generate TypeDoc API docs
```

Tests use the **Node.js native test runner** (`node --test`) with `esbuild-register` for TypeScript. No Jest/Mocha.

## Architecture

### Protocol Stack (bottom-up)

Each layer is a pure-function module with `encode`/`decode` exports sharing a mutable `EncodeBuffer` (`{ buffer: Buffer, offset: number }`):

```
UDP Socket (Transport)
  → BVLC  (src/lib/bvlc.ts)    — 4-byte BACnet/IP framing header
  → NPDU  (src/lib/npdu.ts)    — Network routing, source/dest addressing
  → APDU  (src/lib/apdu.ts)    — PDU type dispatch (confirmed/unconfirmed/ack/error/abort)
  → Service payload            — Service-specific ASN.1 encoded data
```

`src/lib/asn1.ts` provides all ASN.1 primitives (context/application tags, object IDs, bitstrings, etc.). Uses `iconv-lite` for multi-encoding character string support.

### Main Client (`src/lib/client.ts`)

`BACnetClient` extends `TypedEventEmitter<BACnetClientEvents>`. All BACnet services are methods on this class (~2100 lines).

**Outbound flow (e.g., readProperty):**
1. Get rolling invoke ID (0-255)
2. Allocate `EncodeBuffer`, encode NPDU → APDU → service payload
3. Prepend BVLC header via `sendBvlc()`, send UDP
4. `RequestManager.add(invokeId)` returns a Promise that resolves when ACK arrives

**Inbound flow:**
1. `Transport` emits `message` → `_receiveData()`
2. Decode BVLC → NPDU → determine PDU type
3. For requests: look up service in `confirmedServiceMap`/`unconfirmedServiceMap`, call `ServiceClass.decode()`, emit event
4. For ACKs: `RequestManager.resolve(invokeId, data)`

### Services (`src/lib/services/`)

Each service is a static class extending `BacnetService` (or `BacnetAckService`):

```typescript
class ReadProperty extends BacnetAckService {
    static encode(buffer, ...)           // Client sends request
    static decode(buffer, offset, len)   // Client receives request (server role)
    static encodeAcknowledge(buffer, ...)  // Client sends ACK (server role)
    static decodeAcknowledge(buffer, ...)  // Client receives ACK
}
```

`ServicesMap` in `services/index.ts` maps event names (e.g., `"readProperty"`) to service classes for dynamic dispatch.

### Transport (`src/lib/transport.ts`)

Wraps a `dgram` UDP4 socket. Default port: `47808` (0xBAC0). Handles broadcast deduplication (10s window). Injectable via `ClientOptions.transport` for testing.

### RequestManager (`src/lib/request-manager.ts`)

Maps invoke IDs to `Deferred<NetworkOpResult>` promises. Handles timeout sweeping. Timeout function is injectable for test mocking.

### Key Entry Point (`src/index.ts`)

Thin re-export: `BACnetClient` as default export, plus all enums, types, and bitstring classes.

## Testing Tiers

- **Unit** (`test/unit/`): Encode/decode in isolation. Uses `getBuffer()` helper from `test/unit/utils.ts`.
- **Integration** (`test/integration/`): Uses `TransportStub` (mock EventEmitter) injected into `BACnetClient`. Simulates packets via `transportStub.emit('message', buffer, addr)`.
- **Compliance** (`test/compliance/`): Runs against the live emulator. Sequential execution (`--test-concurrency=1`).

## Key Types and Conventions

- `EncodeBuffer`: `{ buffer: Buffer, offset: number }` — mutable cursor passed through all encode layers
- `BACNetObjectID`: `{ type: ObjectType, instance: number }`
- `TypedValue<Tag>`: `{ type: ApplicationTag, value: ... }` — generic typed BACnet value
- `Decode<T>`: `{ len, value }` — standard decode return shape
- Enums in `src/lib/enum.ts`: `ObjectType`, `PropertyIdentifier`, `ApplicationTag`, `ConfirmedServiceChoice`, `UnconfirmedServiceChoice`, `PduType`, `ErrorClass`, `ErrorCode`
- Bitstrings in `src/lib/bitstring.ts`: `GenericBitString<E>`, `StatusFlagsBitString`, `ServicesSupportedBitString`

## ASHRAE 135 Standard Reference

This library implements [ASHRAE Standard 135 (BACnet)](https://www.ashrae.org/technical-resources/standards-and-guidelines/read-only-versions-of-ashrae-standards). Always consult the official specification when reviewing or implementing features:

- **[Standard 135-2024](https://ashrae.iwrapper.com/ASHRAE_PREVIEW_ONLY_STANDARDS/STD_135_2024)** — Current version
- **[Standard 135-2020](https://ashrae.iwrapper.com/ASHRAE_PREVIEW_ONLY_STANDARDS/STD_135_2020)** — Previous version

When implementing or modifying protocol features, reference the relevant standard section in a code comment with a link when possible. Example:

```typescript
// Encode object identifier per ASHRAE 135-2024 §20.2.14
// https://ashrae.iwrapper.com/ASHRAE_PREVIEW_ONLY_STANDARDS/STD_135_2024
encodeApplicationObjectId(buffer, objectType, instance)
```

## Coding Standards

Detailed standards are in **[.github/copilot-instructions.md](.github/copilot-instructions.md)**. Key points:

- Strict TypeScript (`noImplicitAny`, `strictNullChecks`)
- Files: camelCase. Classes: PascalCase. Enums: PascalCase with ALL_CAPS values. Private members: underscore prefix.
- `interface` over `type` for object shapes
- Conventional Commits: `feat|fix|docs|test|chore|refactor|perf|ci[scope]: description`
- Scopes: `client`, `transport`, `services`, `asn1`, `enum`, `types`, `apdu`, `npdu`, `bvlc`
- Debug logging: `debug` library with `bacnet:module:level` namespaces
