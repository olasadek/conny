// Shared MongoDB connection for Vercel serverless functions.
// The client is cached at module scope so warm invocations of the same
// lambda instance reuse the connection instead of reconnecting every call.

import { MongoClient } from "mongodb";

let clientPromise = null;

function connect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable");
  }
  if (!clientPromise) {
    const client = new MongoClient(uri);
    clientPromise = client.connect();
  }
  return clientPromise;
}

export async function getDb() {
  const client = await connect();
  return client.db(process.env.MONGODB_DB || "seal_command");
}
