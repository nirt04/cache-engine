import { MongoClient, Db } from 'mongodb';

export interface ICacheEngineDBConnectOptions {
  uri: string;
  dbName: string;
}

export enum FetchPolicy {
  CacheAndNetwork = 'cache-and-network',
  NetworkAndCache = 'network-and-cache',
  NetworkOnly = 'network-only',
}

export class CacheEngineDB {
  private client?: MongoClient;
  private db?: Db;
  private cacheCollectionName = 'CacheEngineCollection';

  constructor() {}

  public async connect(options: ICacheEngineDBConnectOptions): Promise<void> {
    try {
      this.client = new MongoClient(options.uri);
      await this.client.connect();
      const adminDb = this.client.db().admin();
      const dbs = await adminDb.listDatabases();

      const dbExists = dbs.databases.some((db: { name: string }) => db.name === options.dbName);
      if (!dbExists) {
        console.warn(`Database ${options.dbName} does not exist. It will be created upon first write.`);
      }

      this.db = this.client.db(options.dbName);
      await this.ensureDatabaseAndCollection();
    } catch (error) {
      console.error('Failed to connect to the database:', error);
    }
  }

  private async ensureDatabaseAndCollection(): Promise<void> {
    if (!this.db) return;

    try {
      const collections = await this.db.listCollections({ name: this.cacheCollectionName }).toArray();
      if (collections.length === 0) {
        await this.db.createCollection(this.cacheCollectionName);
      }
      await this.ensureKeyIndex();
    } catch (error) {
      console.error('Error ensuring database and collection:', error);
    }
  }

  private async ensureKeyIndex(): Promise<void> {
    if (!this.db) return;

    try {
      const indexes = await this.db.collection(this.cacheCollectionName).indexes();
      const keyIndexExists = indexes.some(index => index.key.hasOwnProperty('key'));
      if (!keyIndexExists) {
        await this.db.collection(this.cacheCollectionName).createIndex({ key: 1 });
      }
    } catch (error) {
      console.error('Error ensuring key index:', error);
    }
  }

  public async cache<T extends (...args: any[]) => any>(
    options: {
      id: string;
      fn: T;
      fetchPolicy?: FetchPolicy;
    },
    ...args: Parameters<T>
  ): Promise<ReturnType<T>> {
    const { id, fn, fetchPolicy = FetchPolicy.CacheAndNetwork } = options;
    const key = `${id}_${JSON.stringify(args)}`;

    if (!this.db) {
      throw new Error('Database is not initialized.');
    }

    try {
      if (fetchPolicy === FetchPolicy.CacheAndNetwork) {
        // Check if the result is already cached
        const cached = await this.db.collection(this.cacheCollectionName).findOne({ key });
        if (cached) {
          return JSON.parse(cached.value);
        }
      }

      // Execute the function and cache the result
      const result = await fn(...args);
      if (fetchPolicy !== FetchPolicy.NetworkOnly) {
        await this.db.collection(this.cacheCollectionName).insertOne({ key, value: JSON.stringify(result) });
      }
      return result;
    } catch (error) {
      console.error('Error in cache method:', error);
      throw error;
    }
  }
}
