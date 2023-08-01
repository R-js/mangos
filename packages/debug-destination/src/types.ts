/**
 * These types and constants will need to be shared with the @mangos-debug (the controller/switchboard)
 */
import { RECEIVED, ERR_NAMESPACE_REJECTED, ERR_NO_DATA_TO_SEND, ERR_UNDERLYING_TRANSPORT_OFFLINE } from './constants';
export type TransportResult =
    | typeof RECEIVED
    | typeof ERR_UNDERLYING_TRANSPORT_OFFLINE
    | typeof ERR_NAMESPACE_REJECTED
    | typeof ERR_NO_DATA_TO_SEND;

export interface Transport {
    (prefix: string, namespace: string, key: string, format: string, ...args: any[]): TransportResult;
    readonly accepted: number;
    readonly rejectedBecauseTransportOffline: number;
    readonly noData: number;
}
