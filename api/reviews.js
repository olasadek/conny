// GET  /api/reviews            -> { [bookId]: Review[] }  (all books)
// GET  /api/reviews?bookId=X   -> Review[]                (one book)
// POST /api/reviews  { bookId, name, rating, text, honeypot? } -> Review[] for that book
//
// Reviews live in the "reviews" collection of MongoDB, one document per
// review, keyed by the `id` field on entries in js/data.js (ARCHIVE_DATA).
// Requires the MONGODB_URI environment variable (see README).

import { getDb } from "../lib/mongodb.js";

const MAX_NAME_LEN = 60;
const MAX_TEXT_LEN = 800;
const MAX_REVIEWS_PER_BOOK = 200;

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
  const collection = db.collection("reviews");

  if (req.method === "GET") {
    const bookId = typeof req.query.bookId === "string" ? req.query.bookId : "";

    if (bookId) {
      const list = await collection
        .find({ bookId })
        .sort({ date: -1 })
        .limit(MAX_REVIEWS_PER_BOOK)
        .project({ _id: 0 })
        .toArray();
      res.status(200).json(list);
      return;
    }

    const all = await collection.find({}).sort({ date: -1 }).project({ _id: 0 }).toArray();
    const grouped = {};
    for (const review of all) {
      if (!grouped[review.bookId]) grouped[review.bookId] = [];
      grouped[review.bookId].push(review);
    }
    res.status(200).json(grouped);
    return;
  }

  if (req.method === "POST") {
    const body = req.body || {};

    if (body.honeypot) {
      // Bot filled the hidden field — pretend success, do nothing.
      res.status(200).json({ ok: true });
      return;
    }

    const bookId = typeof body.bookId === "string" ? body.bookId.slice(0, 80).trim() : "";
    const name = typeof body.name === "string" ? body.name.slice(0, MAX_NAME_LEN).trim() : "";
    const text = typeof body.text === "string" ? body.text.slice(0, MAX_TEXT_LEN).trim() : "";
    const rating = Math.round(Number(body.rating));

    if (!bookId || !name || !text || !(rating >= 1 && rating <= 5)) {
      res.status(400).json({ error: "Missing or invalid fields" });
      return;
    }

    await collection.insertOne({ bookId, name, text, rating, date: new Date().toISOString() });

    const list = await collection
      .find({ bookId })
      .sort({ date: -1 })
      .limit(MAX_REVIEWS_PER_BOOK)
      .project({ _id: 0 })
      .toArray();
    res.status(200).json(list);
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
