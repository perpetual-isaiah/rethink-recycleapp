// scripts/seedRecyclingPoints.js
// Usage:
//   npm run seed
//   node scripts/seedRecyclingPoints.js [--dry-run] [--clean]
//
// - --dry-run  -> logs operations without writing to DB
// - --clean    -> delete any existing points with same names before inserting/upserting

require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/myrecyclingapp';
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const CLEAN = args.includes('--clean');

async function main() {
  console.log('Seed script starting', { DRY_RUN, CLEAN });

  // Connect first
  await mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('Connected to MongoDB');

  // Require model after connection (keeps things tidy)
  const RecyclingPoint = require(path.join(__dirname, '..', 'models', 'RecyclingPoint'));

  const points = [
    {
      name: "Lefkoşa Municipal Recycling Depot",
      address: "Near Municipal Transfer Station, Lefkoşa",
      city: "Lefkoşa",
      lat: 35.1856,
      lng: 33.3823,
      materials: ["carton", "container", "e-waste", "clothes"],
      tags: ["municipality", "drop-off", "curbside"]
    },
    {
      name: "Girne Tyre Collection Centre",
      address: "Industrial Zone, Girne",
      city: "Girne",
      lat: 35.3400,
      lng: 33.3190,
      materials: ["tire"],
      tags: ["industrial", "bulk", "appointment"]
    },
    {
      name: "Gazimağusa Construction Transfer Point",
      address: "South of Gazimağusa - Transfer Station",
      city: "Gazimağusa",
      lat: 35.1254,
      lng: 33.9343,
      materials: ["construction"],
      tags: ["bulky-waste", "transfer-station", "moloz"]
    },
    {
      name: "Güzelyurt Community Clothes Bank",
      address: "Market Street, Güzelyurt",
      city: "Güzelyurt",
      lat: 35.0411,
      lng: 32.9178,
      materials: ["clothes"],
      tags: ["charity", "donation", "dropbox"]
    },
    {
      name: "İskele E-Waste Drop-off (Municipality)",
      address: "Municipal Services Yard, İskele",
      city: "İskele",
      lat: 35.2967,
      lng: 33.9979,
      materials: ["e-waste", "batteries"],
      tags: ["municipality", "secure-data-advice"]
    },
    {
      name: "Kyrenia Cardboard & Containers Bank",
      address: "Shopping District — Public Recycling Cage, Kyrenia",
      city: "Girne",
      lat: 35.3385,
      lng: 33.3206,
      materials: ["carton", "container"],
      tags: ["public", "24hrs", "paper"]
    },
    {
      name: "Lapta Bulky / Construction Drop",
      address: "Lapta Service Yard",
      city: "Lapta",
      lat: 35.3520,
      lng: 33.2620,
      materials: ["construction", "carton"],
      tags: ["drop-off", "bulky"]
    },
    {
      name: "Nicosia University Donation Point",
      address: "Campus Main Gate - Donation Bin",
      city: "Lefkoşa",
      lat: 35.1920,
      lng: 33.3828,
      materials: ["clothes", "carton", "e-waste"],
      tags: ["university", "student-drive", "scheduled-collections"]
    },
    {
      name: "North Cyprus Tyre Recycler (Private)",
      address: "East Industrial Zone",
      city: "Gazimağusa",
      lat: 35.1300,
      lng: 33.9400,
      materials: ["tire"],
      tags: ["private", "processing", "bulk-only"]
    },
    {
      name: "Famagusta Community Textile & Small Appliances",
      address: "Community Centre - Famagusta",
      city: "Gazimağusa",
      lat: 35.1188,
      lng: 33.9394,
      materials: ["clothes", "e-waste", "container"],
      tags: ["charity", "collection-drive"]
    }
  ];

  const names = points.map(p => p.name);

  try {
    if (DRY_RUN) {
      console.log('DRY RUN: The following operations would be executed:');
      console.table(points.map(p => ({ name: p.name, city: p.city, materials: p.materials.join(', ') })));
      await mongoose.disconnect();
      console.log('Dry run complete — disconnected.');
      process.exit(0);
    }

    if (CLEAN) {
      console.log('CLEAN: Deleting existing points that match seed names...');
      const delRes = await RecyclingPoint.deleteMany({ name: { $in: names } });
      console.log(`Deleted ${delRes.deletedCount} existing docs`);
    }

    let inserted = 0;
    let updated = 0;

    for (const p of points) {
      // Use updateOne with upsert to be idempotent
      const res = await RecyclingPoint.updateOne(
        { name: p.name },        // filter (upsert key)
        { $set: p },             // full set (replace fields listed)
        { upsert: true }
      );

      // result interpretation:
      // res.matchedCount > 0 -> existing doc matched (updated or no-op)
      // res.upsertedCount > 0 -> new doc inserted
      // res.modifiedCount > 0 -> existing doc modified
      if (res.upsertedCount && res.upsertedCount > 0) {
        inserted += 1;
        console.log(`Inserted new: ${p.name}`);
      } else if (res.modifiedCount && res.modifiedCount > 0) {
        updated += 1;
        console.log(`Updated: ${p.name}`);
      } else {
        // matched but no change (identical)
        console.log(`Unchanged: ${p.name}`);
      }
    }

    console.log(`Seeding complete. Inserted: ${inserted}, Updated: ${updated}`);
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB. Done.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    try { await mongoose.disconnect(); } catch (e) {}
    process.exit(1);
  }
}

main();
