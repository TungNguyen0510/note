import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { neon } from '@neondatabase/serverless';

@Injectable()
export class DatabaseService {
  private readonly sql: ReturnType<typeof neon>;
  public readonly query: <T = any>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ) => Promise<T[]>;

  constructor(private readonly configService: ConfigService) {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not defined');
    }
    this.sql = neon(databaseUrl);

    this.query = async <T = any>(
      strings: TemplateStringsArray,
      ...values: unknown[]
    ): Promise<T[]> => {
      const result = await this.sql(strings, ...values);
      return result as unknown as T[];
    };
  }

  async getData() {
    const data = await this.sql`...`;
    return data;
  }
}
