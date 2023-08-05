import crc2 from '../utils/crc32';
import colors from './colors';

import { RECEIVED, ERR_UNDERLYING_TRANSPORT_OFFLINE, ERR_NAMESPACE_REJECTED, ERR_NO_DATA_TO_SEND } from '../constants';
import type { TransportResult, Transport } from '../types';

let mutex: Transport;

export type DevConsoleOptions = {};

type Temporal = {
    ts: number;
    cnt: number;
};

type Dictionary = {
    [prefix: string]: {
        [namespace: string]: {
            [key: string]: {
                accepted: [Temporal, Temporal, Temporal];
                noData: Temporal;
                offLineRejects: Temporal;
            };
        };
    };
};

const dictionary: Dictionary = {};

function createDevConsoleTransport(devConsoleOptions?: DevConsoleOptions): Transport {
    if (mutex !== undefined) {
        return mutex;
    }
    let accepted = 0;
    let noData = 0;
    function transport(prefix: string, namespace: string, key: string, ...args: any[]): TransportResult {
        return 1;
    }
    // decorate transport function with
    Object.defineProperties(transport, {
        accepted: {
            get: () => accepted
        },
        rejectedBecauseTransportOffline: {
            get: () => 0
        },
        noData: {
            get: () => noData
        }
    });
    mutex = transport as Transport;
    return transport as Transport;
}
