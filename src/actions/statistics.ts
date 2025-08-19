"use server";
import clientPromise from "@/lib/mongodb";

export async function logUserAction({
  address,
  agent,
  action,
  volume,
  token,
  volumeUsd,
  extra = {},
}: {
  address: string;
  agent: string;
  action: string;
  volume: number;
  token: string;
  volumeUsd?: number;
  extra?: Record<string, unknown>;
}) {
  const client = await clientPromise;
  const db = client.db();
  const statistics = db.collection("statistics");
  const entry = {
    address,
    agent,
    action,
    volume,
    token,
    volumeUsd: volumeUsd || null,
    extra,
    timestamp: new Date(),
  };
  await statistics.insertOne(entry);
  return entry;
}

export async function logUserLogin(address: string) {
  const client = await clientPromise;
  const db = client.db();
  const users = db.collection("users");
  await users.updateOne(
    { address },
    { $set: { address, lastLogin: new Date() } },
    { upsert: true }
  );
  return { address };
}

export async function getUserStatistics(address: string) {
  const client = await clientPromise;
  const db = client.db();
  const statistics = db.collection("statistics");
  const results = await statistics
    .find({ address })
    .sort({ timestamp: -1 })
    .toArray();

  // Convert MongoDB documents to plain objects
  return results.map((doc) => ({
    _id: doc._id.toString(),
    address: doc.address,
    agent: doc.agent,
    action: doc.action,
    volume: doc.volume,
    token: doc.token,
    volumeUsd: doc.volumeUsd,
    extra: doc.extra,
    timestamp: doc.timestamp.toISOString(),
  }));
}
