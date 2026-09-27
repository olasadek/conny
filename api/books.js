// GET  /api/books  -> Book[]   (every added/edited book — both brand-new
//                                entries and overrides of a seed book from
//                                js/data.js's ARCHIVE_DATA, keyed by id)
// POST /api/books  { id?, title, author, cover, rating, status } -> Book
//
// If `id` is provided, this upserts (edits) that exact book — used both to
// edit a seed book from ARCHIVE_DATA (the frontend merges this override on
// top of it) and to save further edits to a previously-added book.
// If `id` is omitted, a new id is generated from the title so this always
// creates a brand-new book rather than colliding with an existing one.

import { getDb } from "../lib/mongodb.js";

const MAX_FIELD_LEN = 120;
const MAX_COVER_LEN = 500;
const VALID_STATUSES = ["Reading", "Completed", "Want to Read"];
const DEFAULT_COVER = "assets/images/archive/placeholder-book.svg";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function randomSuffix() {
  return Math.random().toString(16).slice(2, 8);
}

function toBook(doc) {
  return {
    id: doc._id,
    title: doc.title,
    author: doc.author,
    cover: doc.cover,
    rating: doc.rating,
    status: doc.status,
  };
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
  const collection = db.collection("books");

  if (req.method === "GET") {
    const docs = await collection.find({}).toArray();
    res.status(200).json(docs.map(toBook));
    return;
  }

  if (req.method === "POST") {
    const body = req.body || {};

    const title = typeof body.title === "string" ? body.title.slice(0, MAX_FIELD_LEN).trim() : "";
    const author = typeof body.author === "string" ? body.author.slice(0, MAX_FIELD_LEN).trim() : "";
    const cover = typeof body.cover === "string" && body.cover.trim() ? body.cover.slice(0, MAX_COVER_LEN).trim() : DEFAULT_COVER;
    const status = VALID_STATUSES.includes(body.status) ? body.status : "Want to Read";
    const ratingNum = Number(body.rating);
    const rating = Number.isFinite(ratingNum) ? Math.max(0, Math.min(5, Math.round(ratingNum * 2) / 2)) : 0;

    if (!title || !author) {
      res.status(400).json({ error: "Title and author are required" });
      return;
    }

    let id = typeof body.id === "string" ? body.id.slice(0, 80).trim() : "";
    if (!id) {
      id = `${slugify(title) || "book"}-${randomSuffix()}`;
    }

    const doc = { _id: id, title, author, cover, rating, status };
    await collection.updateOne({ _id: id }, { $set: doc }, { upsert: true });
    res.status(200).json(toBook(doc));
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
