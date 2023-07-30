# `@mangos/debug-frontend`

This is the frontend part of `@mangos/debug`.

## Problem statement

3rd party modules implementing their own debug-tracing/logging internally can conflict with each other in various ways:

1. ambiguity: you don't know from which library a particular log message came from.
2. resource: how do you make sure the independent logging implementation all log to the same file?
3. message uniformity: how do you make sure the logging implementations use the same log message format?

We try to solve this problem by separating logging into 3 concerns.

1. A part that interfaces with code (where you call a logging function)
2. A part that controls what sections of the code are allowed to log (via use of "namespaces")
3. A part that sends log to a physical output (console, file, syslog, network).

Concerns (1) is implemented in this library `@mangos/debug-frontend`.
Concern (2) & (3) are implemented in `@mangos/debug`.

**The `@mangos/debug-frontend` is 922 bytes (not minimized & unzipped)**. This makes it the fastest and most lightweight log integration possibly for your code.

## Features

The `@mangos/debug` logging (frontend + backend) has the following,

1. **fast no-op**: if logging is disabled for a specific namespace, calling a log function is a no-op.
2. **dynamic turn off/on**: logging/tracing can be enabled and disabled while your program is running.
3. **dynamic log destination**: logging/tracing can be routed to destinations while your program is running.

## Quick Example:

payment-processing-library.js

```typescript
import debug, { register, unregister } from '@mangos/debug-frontend';

// re-export to hook your payment-library to logger backend
export { register, unregister };

const printer = debug('payment-processor'); // create a logger for namespace "payment-processor"

export function transmit(account: string, amount: number) {
    printer('An amount of %d was transmitted to account %s', amount, number);
}
```

index.js

```typescript
import { transmit, register, unregister } from './payment-processing-library';

// see @mangos/debug README on how to set up logging backend (transports)
import backendController from './setupLoggingBackend';

// at any time you can register the backend for
register(backendController);

transmit('IBAN444444555555', 10); // could be logged, depends on backend Configuration

register();

transmit('IBAN444444555555', 10); // will most certainly not be logged
```

## API

Overview of all functions:

### `debug`

Creates a logger attached to a namespace.

```typescript
import debug from '@mangos/debug-frontend';
const printer = debug('my-namespace');

printer('hello world'); // this message will be tagged with the namesapce "my-namespace"
```

### `Printable Interface`

This is the return value of the `debug` function call.

spec:

```typescript
type Printer = {
    (formatter: string, ...args: any[]): void;
    readonly namespace: string;
    readonly enabled: boolean;
};
```
Besides it being a callable function it has 2 properties:

- `namespace`: the namespace used when creating the printer with `debug`
- `enabled`: if the backend logging will allow logging of this namespaces to pass through.

### `register`

This function connects your tracing/logging calls in your code to the debug-backend.

spec:
```typescript
function register(backend: (prefix?: string) => LoggerController, prefix?: string): void;
```

Arguments:
- `backend`: A configured backend (see `@mangos/debug`) 
- `prefix`: A code integrator can choose to separate conflicting namespaces (from 3rd party code) by prefixing the namespace of a library with an extra string prefix.


### `unregister`

This function undoes (detached the debug backend) the previous call to `register`.

spec:
```typescript
function unregister(): void;
```

