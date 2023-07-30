export type Printer = {
    (formatter: string, ...args: any[]): void;
    readonly namespace: string;
    readonly enabled: boolean;
};

export type LoggerController = {
    send(namespace: string, formatter: string, ...args: any[]): void;
    isEnabled(namespace?: string): boolean;
};
