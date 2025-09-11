import { ConfigService } from '@nestjs/config';
export declare class DatabaseService {
    private readonly configService;
    private readonly sql;
    readonly query: <T = any>(strings: TemplateStringsArray, ...values: unknown[]) => Promise<T[]>;
    constructor(configService: ConfigService);
    getData(): Promise<any[][] | Record<string, any>[] | import("@neondatabase/serverless").FullQueryResults<boolean>>;
}
