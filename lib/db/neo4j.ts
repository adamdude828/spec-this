import neo4jDriver, { Driver, Session } from "neo4j-driver";

class Neo4jConnection {
  private driver: Driver | null = null;
  private static instance: Neo4jConnection;

  private constructor() {}

  public static getInstance(): Neo4jConnection {
    if (!Neo4jConnection.instance) {
      Neo4jConnection.instance = new Neo4jConnection();
    }
    return Neo4jConnection.instance;
  }

  public async connect(): Promise<void> {
    if (this.driver) {
      return; // Already connected
    }

    const uri = process.env.NEO4J_URI || "bolt://localhost:7687";
    const username = process.env.NEO4J_USERNAME || "neo4j";
    const password = process.env.NEO4J_PASSWORD || "neo4jpassword";

    try {
      this.driver = neo4jDriver.driver(uri, neo4jDriver.auth.basic(username, password));

      // Verify connectivity
      await this.driver.verifyConnectivity();
      console.log("✅ Connected to Neo4j");
    } catch (error) {
      console.error("❌ Failed to connect to Neo4j:", error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.driver) {
      await this.driver.close();
      this.driver = null;
      console.log("🔌 Disconnected from Neo4j");
    }
  }

  public getSession(): Session {
    if (!this.driver) {
      throw new Error("Neo4j driver not initialized. Call connect() first.");
    }
    return this.driver.session();
  }

  public getDriver(): Driver {
    if (!this.driver) {
      throw new Error("Neo4j driver not initialized. Call connect() first.");
    }
    return this.driver;
  }

  public isConnected(): boolean {
    return this.driver !== null;
  }
}

// Export singleton instance
export const neo4j = Neo4jConnection.getInstance();

// Helper function for running queries with automatic session management
export async function runQuery<T = any>(
  query: string,
  params: Record<string, any> = {}
): Promise<T[]> {
  const session = neo4j.getSession();
  try {
    const result = await session.run(query, params);
    return result.records.map((record) => record.toObject() as T);
  } finally {
    await session.close();
  }
}

// Helper function for write transactions
export async function runWriteTransaction<T = any>(
  query: string,
  params: Record<string, any> = {}
): Promise<T[]> {
  const session = neo4j.getSession();
  try {
    const result = await session.executeWrite((tx) => tx.run(query, params));
    return result.records.map((record) => record.toObject() as T);
  } finally {
    await session.close();
  }
}

// Helper function for read transactions
export async function runReadTransaction<T = any>(
  query: string,
  params: Record<string, any> = {}
): Promise<T[]> {
  const session = neo4j.getSession();
  try {
    const result = await session.executeRead((tx) => tx.run(query, params));
    return result.records.map((record) => record.toObject() as T);
  } finally {
    await session.close();
  }
}
