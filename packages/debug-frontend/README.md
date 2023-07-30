# `@mangos/debug-frontend` & `@mangos/debug`

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

## Quick Example

```typescript
// payment-processing-library.js
import debug, { register, unregister } from '@mangos/debug-frontend';

// re-export to hook your payment-library to logger backend
export { register, unregister };

const logger = debug('payment-processor'); // create a logger for namespace "payment-processor"

export function transmit(account: string, amount: number) {
    logger('An amount of %d was transmitted to account %s', amount, number);
}
```

```typescript
// index.js
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
const logger = debug('my-namespace');
```

import debug, { register, unregister } from '@mangos/debug-frontend';
