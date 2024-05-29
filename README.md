# CacheEngineDB

CacheEngineDB is a simple caching service for asynchronous methods using MongoDB. It ensures efficient caching by storing the results of function executions and retrieving them if they exist, saving the need for redundant computations.

## Features

- Connects to a MongoDB database and creates the necessary collection if it does not exist.
- Ensures that the required indexes are created on the cache collection.
- Provides a `cache` method to cache the results of asynchronous functions.
- Fully typed with TypeScript.

## Installation

You can install the package via npm:

```javascript
npm install cache-engine-db
```

Usage
Importing and Initializing

```javascript
import { CacheEngineDB, ICacheEngineDBConnectOptions } from 'cache-engine-db';

// Define connection options
const options: ICacheEngineDBConnectOptions = {
  uri: 'your-mongodb-uri',
  dbName: 'your-database-name',
};

// Create an instance of CacheEngineDB
const cacheEngineDB = new CacheEngineDB();

// Connect to the database
await cacheEngineDB.connect(options);
```

Caching Function Results
You can cache the results of an asynchronous function using the cache method:

```javascript
const cachedResult = await cacheEngineDB.cache(
  {
    id: 'unique-function-identifier',
    fn: asyncFunction,
  },
  arg1,
  arg2
);

// Example usage
async function fetchData(param1: string, param2: number) {
  // Simulate an asynchronous operation
  return { data: `Result for ${param1} and ${param2}` };
}

const result = await cacheEngineDB.cache(
  {
    id: 'fetchData',
    fn: fetchData,
  },
  'testParam',
  123
);

console.log(result);
```

## Methods

### connect(options: ICacheEngineDBConnectOptions): Promise
Connects to the MongoDB database with the provided URI and database name. Creates the cache collection if it doesn't exist and ensures the required indexes are set up.

**options**: An object containing `uri` and `dbName`.

### cache<T extends (...args: any[]) => any>(options: { id: string; fn: T }, ...args: Parameters<T>): Promise<ReturnType<T>>
Caches the result of the given asynchronous function. If the result is already cached, it returns the cached result.

**options**: An object containing `id` (a unique identifier for the function) and `fn` (the function to cache).

**...args**: The arguments to pass to the function.

## Error Handling
Errors during connection, ensuring database and collection, ensuring indexes, and caching method execution are logged to the console.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request on GitHub.

## License
This project is licensed under the MIT License.
