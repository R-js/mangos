import { vi } from 'vitest';

import type { LoggerController, Printer } from './index.types';

type LoggerControllerEnhanced = LoggerController & {
    history: Parameters<LoggerController['send']>[];
    callBack?: (a?: string) => boolean;
};

const createControllerMock: (prefix?: string) => LoggerControllerEnhanced = (_prefix?: string) => ({
    history: [],
    send(namespace: string, formatter: string, ...args: any[]) {
        this.history.push([namespace, formatter, ...args]);
    },
    isEnabled(namespace?: string) {
        if (this.callBack) {
            return this.callBack(namespace);
        }
        return false;
    }
});

describe('frontend', () => {
    let module;
    beforeEach(async () => {
        module = await import('.');
    });
    afterEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
    });
    it('out-of-the-box the frontend/printer is a dud', () => {
        const print: Printer = module.default('my-namespace');
        print('something %o', { hello: 'world' });
        expect(print.namespace).toBe('my-namespace');
        expect(print.enabled).toBe(false);
    });
    it('register controller, (enabled logging for namespace)', () => {
        const controller = module.register!(createControllerMock);
        controller.callBack = (_ns?: string) => true;
        const print: Printer = module.default('my-namespace');
        print('something %o', { hello: 'world' });
        expect(print.namespace).toBe('my-namespace');
        expect(print.enabled).toBe(true);
        expect(controller.history).toEqual([['my-namespace', 'something %o', { hello: 'world' }]]);
    });
    it('register controller, (disabled logging for namespace)', () => {
        const controller = module.register!(createControllerMock);
        controller.callBack = (_ns?: string) => false;
        const print: Printer = module.default('my-namespace');
        print('something %o', { hello: 'world' });
        expect(print.namespace).toBe('my-namespace');
        expect(print.enabled).toBe(false);
        expect(controller.history).toEqual([]);
    });
    it('unregister controller', () => {
        const controller = module.register!(createControllerMock);
        controller.callBack = (_ns?: string) => true;
        const print: Printer = module.default('my-namespace');
        print('something %o %s', { hello: 'world2' }, 'some other text');
        expect(print.namespace).toBe('my-namespace');
        expect(print.enabled).toBe(true);
        expect(controller.history).toEqual([
            ['my-namespace', 'something %o %s', { hello: 'world2' }, 'some other text']
        ]);
        module.unRegister!();
        print('some text');
        expect(print.namespace).toBe('my-namespace');
        expect(print.enabled).toBe(false);
    });
});
