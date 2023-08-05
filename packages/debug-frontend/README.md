# `@mangos/debug-frontend`

This is the frontend part of `@mangos/debug`.

-   [`@mangos/debug-frontend`](#mangosdebug-frontend)
    -   [Problem statement](#problem-statement)
    -   [Features](#features)
    -   [Quick Example:](#quick-example)
    -   [API](#api)
        -   [`createDebug`](#createdebug)
        -   [`Printable Interface`](#printable-interface)
        -   [`register`](#register)
        -   [`unregister`](#unregister)
    -   [CookBook](#cookbook)

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

This is an example where a general `App.js` consumes 2 modules `@mangos/payment-processing` and `@mangos/notification`

Both `@mangos/payment-processing` and `@mangos/notification` are (supposedly) 3rd party modules build by seperate organsiations prefixing their debug messages with their specifc namespace. The final application, consuming both 3rd party libraries, defines the backend that will receive debug information from those libraries by calling their respective exported "register" function.

**Library1: published on npm as `@mangos/payment-processing`.**

```typescript
import createDebug, { register, unregister } from '@mangos/debug-frontend';

// re-export to hook to whoever consumes this library
export { register, unregister };

// create a logger for namespace "payment-processor"
const debug = createDebug('payment-processor');

// send money to an account
export function transmitMoney(account: string, amount: number): boolean {
    //.
    //. do some usefull work
    //.
    debug('An amount of %d was transmitted to account %s', amount, number);
    return true;
}
```

**Library2: published on npm as `@mangos/notification`.**

```typescript
import createDebug, { register, unregister } from '@mangos/debug-frontend';

// re-export to hook to whoever consumes this library
export { register, unregister };

// create a logger for namespace "notification"
const debug = createDebug('notification');

// send money to an account
export function notifyUserAccount(iban: string, message: string): boolean {
    //.
    //. do some usefull work
    //.
    debug('account %s has been notified of event: %s', iban, message);
    return true;
}
```

**Final application: `app.js`**

```typescript
import {
    transmitMoney,
    register as registerPayDebug,
    unregister as unregisterPayDebug
} from '@mangos/payment-processing';

import { notifyUserAccount, register as registerNotify, unregister as unregisterNotify } from '@mangos/debug-frontend';

// see @mangos/debug README on how to set up logging backend
// (specific namespace enabling, destination transports, etc)
import backendController from './setupLoggingBackend';

// debug messages will be sent to this backend
registerPayDebug(backendController);
registerNotify(backendController);

// could be logged, depends on backend Configuration
transmitMoney('IBAN444444555555', 10);
notifyUserAccount('IBAN444444555555', 'transaction successful');

// detach payment module from logging backend
unregisterPayDebug();

// will most certainly NOT be logged
transmit('IBAN444444555555', 25);
```

## API

`@mangos/debug-frontend` has an small api surface.

For Common Usage patterns see [Cookbook](#Cookbook)

Overview of all functions:

### `createDebug`

Creates a debugger attached to a namespace. You can use the same namespace name argument value (ex. "my-namespace") in different modules.
Or create multiple debuggers within the same module.

```typescript
import createDebug from '@mangos/debug-frontend';
const debug = createDebug('my-namespace');

debug('hello world'); // this message will be tagged with the namesapce "my-namespace"
```

### `Debug Interface`

This is the return value of the `createDebug` function call.

spec:

```typescript
type Debug = {
    (formatter: string, ...args: any[]): void;
    readonly namespace: string;
    readonly enabled: boolean;
};
```

Besides it being a callable function it has 2 properties:

-   **`namespace`**: the namespace used when creating the printer with `createDebug`
-   **`enabled`**: if the backend logging will allow logging of this namespaces to pass through.

### `register`

This function connects your tracing/logging calls in your code to the debug-backend.

spec:

```typescript
function register(backend: (prefix?: string) => LoggerController, prefix?: string): void;
```

Arguments:

-   **`backend`**: A configured backend (see `@mangos/debug`)
-   **`prefix`**: A code integrator can choose to separate conflicting namespaces (from 3rd party code) by prefixing the namespace of a library with an extra string prefix.

### `unregister`

This function undoes (detached the debug backend) the previous call to `register`.

spec:

```typescript
function unregister(): void;
```

## CookBook

ToDo:
