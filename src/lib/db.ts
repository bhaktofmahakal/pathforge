import neo4j, { Driver } from "neo4j-driver";

/**
 * Singleton Neo4j/CognoDB driver instance.
 *
 * The driver manages a connection pool internally — we instantiate it once
 * at module level and open/close sessions per request. This avoids exhausting
 * the 200-connection free-tier cap on CognoDB.
 */

const COGNODB_URI = process.env.COGNODB_URI;
const COGNODB_PASSWORD = process.env.COGNODB_PASSWORD;
const COGNODB_USER = "cognodb";

if (!COGNODB_URI) {
  throw new Error(
    "Missing COGNODB_URI environment variable. " +
      "Set it in .env.local (e.g. bolt+s://xxx.databases.cognodb.com)"
  );
}

if (!COGNODB_PASSWORD) {
  throw new Error(
    "Missing COGNODB_PASSWORD environment variable. " +
      "Set it in .env.local"
  );
}

let driver: Driver;

try {
  driver = neo4j.driver(
    COGNODB_URI,
    neo4j.auth.basic(COGNODB_USER, COGNODB_PASSWORD),
    {
      maxConnectionPoolSize: 50,
      connectionAcquisitionTimeout: 10_000, // 10s — generous for cold starts
      maxTransactionRetryTime: 15_000,
    }
  );
} catch (err) {
  throw new Error(
    `Failed to create Neo4j driver: ${err instanceof Error ? err.message : String(err)}`
  );
}

export default driver;

/**
 * Helper: run a read query with params, return records.
 * Handles session lifecycle and error wrapping.
 */
export async function readQuery<T = Record<string, unknown>>(
  cypher: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  const session = driver.session({ defaultAccessMode: neo4j.session.READ });
  try {
    const result = await session.run(cypher, params);
    return result.records.map((r) => r.toObject() as T);
  } finally {
    await session.close();
  }
}

/**
 * Helper: run a write query with params, return records.
 */
export async function writeQuery<T = Record<string, unknown>>(
  cypher: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  const session = driver.session({ defaultAccessMode: neo4j.session.WRITE });
  try {
    const result = await session.run(cypher, params);
    return result.records.map((r) => r.toObject() as T);
  } finally {
    await session.close();
  }
}
