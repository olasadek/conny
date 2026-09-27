// GET  /api/weapons  -> { [shipId]: weaponId }         (current loadout for every ship)
// POST /api/weapons  { shipId, weaponId } -> { shipId, weaponId }
//
// Loadouts are shared across every visitor: one document per ship in the
// "weapons" collection of MongoDB, `_id` set to the ship id. Ships/weapons
// themselves are defined in js/data.js (HANGAR_DATA / WEAPONS_CATALOG);
// this collection only remembers which weapon id is currently equipped.
// Requires the MONGODB_URI environment variable (see README).

import { getDb } from "../lib/mongodb.js";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  let db;
  try {
    db = await getDb();
  } catch (err) {
    res.status(500).json({ error: "Database not configured" });
    return;
  }
  const collection = db.collection("weapons");

  if (req.method === "GET") {
    const docs = await collection.find({}).toArray();
    const all = {};
    docs.forEach((doc) => {
      all[doc._id] = doc.weaponId;
    });
    res.status(200).json(all);
    return;
  }

  if (req.method === "POST") {
    const body = req.body || {};
    const shipId = typeof body.shipId === "string" ? body.shipId.slice(0, 60).trim() : "";
    const weaponId = typeof body.weaponId === "string" ? body.weaponId.slice(0, 60).trim() : "";

    if (!shipId || !weaponId) {
      res.status(400).json({ error: "Missing fields" });
      return;
    }

    await collection.updateOne({ _id: shipId }, { $set: { weaponId } }, { upsert: true });
    res.status(200).json({ shipId, weaponId });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
