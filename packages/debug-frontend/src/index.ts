import type { LoggerController, Printer } from './index.types';

const defaultController: LoggerController = {
    send(_namespace: string, _formatter: string, ..._args: any[]) {},
    isEnabled(_namespace?: string) {
        return false;
    }
};

let controller: LoggerController = defaultController;

export function register(backend: (prefix?: string) => LoggerController, prefix?: string) {
    controller = backend(prefix);
    return controller;
}

export function unRegister() {
    controller = defaultController;
}

export default function createNs(ns: string): Printer {
    function print(formatter: string, ...args: any[]) {
        if (controller.isEnabled(ns)) {
            controller.send(ns, formatter, ...args);
        }
    }
    Object.defineProperties(print, {
        enabled: {
            get() {
                return controller.isEnabled(ns);
            },
            enumerable: true
        },
        namespace: {
            value: ns,
            enumerable: true,
            writable: false
        }
    });
    return print as Printer;
}
