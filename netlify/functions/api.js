const { MongoClient } = require("mongodb");
const { v4: uuidv4 } = require("uuid");

let cachedDb = null;

async function getDb() {
  if (cachedDb) return cachedDb;
  const client = new MongoClient(process.env.MONGO_URL);
  await client.connect();
  cachedDb = client.db(process.env.DB_NAME || "korkman2");
  return cachedDb;
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

function now() {
  return new Date().toISOString();
}

// ============= ROUTE HANDLERS =============

async function handleDrivers(method, pathParts, body, query) {
  const db = await getDb();
  const col = db.collection("drivers");

  if (method === "GET" && pathParts.length === 0) {
    const drivers = await col.find({}, { projection: { _id: 0 } }).toArray();
    return json(200, drivers);
  }

  if (method === "GET" && pathParts.length === 1) {
    const driver = await col.findOne({ id: pathParts[0] }, { projection: { _id: 0 } });
    return driver ? json(200, driver) : json(404, { detail: "Driver not found" });
  }

  if (method === "POST") {
    const driver = { id: uuidv4(), ...body, active: true, created_at: now() };
    await col.insertOne(driver);
    const { _id, ...result } = driver;
    return json(200, result);
  }

  if (method === "PUT" && pathParts.length === 1) {
    const updateData = {};
    for (const [k, v] of Object.entries(body)) {
      if (v !== null && v !== undefined) updateData[k] = v;
    }
    await col.updateOne({ id: pathParts[0] }, { $set: updateData });
    const driver = await col.findOne({ id: pathParts[0] }, { projection: { _id: 0 } });
    return driver ? json(200, driver) : json(404, { detail: "Driver not found" });
  }

  if (method === "DELETE" && pathParts.length === 1) {
    await col.deleteOne({ id: pathParts[0] });
    return json(200, { message: "Driver deleted" });
  }

  return json(404, { detail: "Not found" });
}

async function handleTours(method, pathParts, body, query) {
  const db = await getDb();
  const col = db.collection("tours");

  if (method === "GET" && pathParts.length === 0) {
    const q = {};
    if (query.report_id) q.report_id = query.report_id;
    if (query.plads) q.plads = query.plads;
    if (query.driver_id) q.driver_id = query.driver_id;
    const tours = await col.find(q, { projection: { _id: 0 } }).toArray();
    return json(200, tours);
  }

  if (method === "POST" && pathParts[0] === "bulk") {
    const created = [];
    for (const t of body) {
      const tour = { id: uuidv4(), ...t, completed: false, on_way: false, is_pause: false, weight: null, time: "", created_at: now() };
      await col.insertOne(tour);
      const { _id, ...result } = tour;
      created.push(result);
    }
    return json(200, created);
  }

  if (method === "POST" && pathParts[0] === "pause") {
    const pause = {
      id: uuidv4(), date: "", container: "", fraction: "PAUSE", facility: "PAUSE",
      address: "", is_pause: true, completed: false, on_way: false, weight: null, time: "",
      plads: query.plads || body.plads || "", driver_id: query.driver_id || body.driver_id || "",
      driver_name: query.driver_name || body.driver_name || "", report_id: query.report_id || body.report_id || "",
      created_at: now()
    };
    await col.insertOne(pause);
    const { _id, ...result } = pause;
    return json(200, result);
  }

  if (method === "POST" && pathParts.length === 0) {
    const tour = { id: uuidv4(), ...body, completed: false, on_way: false, is_pause: false, weight: null, time: "", created_at: now() };
    await col.insertOne(tour);
    const { _id, ...result } = tour;
    return json(200, result);
  }

  if (method === "PUT" && pathParts.length === 1) {
    const updateData = {};
    for (const [k, v] of Object.entries(body)) {
      if (v !== null && v !== undefined) updateData[k] = v;
    }
    await col.updateOne({ id: pathParts[0] }, { $set: updateData });
    const tour = await col.findOne({ id: pathParts[0] }, { projection: { _id: 0 } });
    return tour ? json(200, tour) : json(404, { detail: "Tour not found" });
  }

  if (method === "DELETE" && pathParts[0] === "report" && pathParts.length === 2) {
    const result = await col.deleteMany({ report_id: pathParts[1] });
    return json(200, { message: `Deleted ${result.deletedCount} tours` });
  }

  if (method === "DELETE" && pathParts.length === 1) {
    await col.deleteOne({ id: pathParts[0] });
    return json(200, { message: "Tour deleted" });
  }

  return json(404, { detail: "Not found" });
}

async function handleReports(method, pathParts, body, query) {
  const db = await getDb();
  const col = db.collection("reports");

  if (method === "GET" && pathParts[0] === "history") {
    const days = parseInt(query.days || "30");
    const history = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayReports = await col.find({ report_date: dateStr }, { projection: { _id: 0 } }).toArray();
      if (!dayReports.length) continue;
      const dayTours = await db.collection("tours").find({ date: dateStr, is_pause: false }, { projection: { _id: 0 } }).toArray();
      history.push({
        date: dateStr,
        total_tours: dayTours.length,
        completed_tours: dayTours.filter(t => t.completed).length,
        total_weight: dayTours.reduce((s, t) => s + (t.weight || 0), 0),
        driver_count: new Set(dayReports.map(r => r.driver_id).filter(Boolean)).size,
        reports: dayReports.slice(0, 10).map(r => ({
          id: r.id, driver_name: r.driver_name || "", start_time: r.start_time || "",
          end_time: r.end_time || "", plads: r.plads || ""
        }))
      });
    }
    return json(200, history);
  }

  if (method === "GET" && pathParts.length === 0) {
    const q = {};
    if (query.driver_id) q.driver_id = query.driver_id;
    if (query.date) q.report_date = query.date;
    const reports = await col.find(q, { projection: { _id: 0 } }).toArray();
    return json(200, reports);
  }

  if (method === "GET" && pathParts.length === 1) {
    const report = await col.findOne({ id: pathParts[0] }, { projection: { _id: 0 } });
    return report ? json(200, report) : json(404, { detail: "Report not found" });
  }

  if (method === "POST") {
    const report = { id: uuidv4(), ...body, created_at: now(), updated_at: now() };
    await col.insertOne(report);
    const { _id, ...result } = report;
    return json(200, result);
  }

  if (method === "PUT" && pathParts.length === 1) {
    const updateData = {};
    for (const [k, v] of Object.entries(body)) {
      if (v !== null && v !== undefined) updateData[k] = v;
    }
    updateData.updated_at = now();
    await col.updateOne({ id: pathParts[0] }, { $set: updateData });
    const report = await col.findOne({ id: pathParts[0] }, { projection: { _id: 0 } });
    return report ? json(200, report) : json(404, { detail: "Report not found" });
  }

  if (method === "DELETE" && pathParts.length === 1) {
    await db.collection("tours").deleteMany({ report_id: pathParts[0] });
    await col.deleteOne({ id: pathParts[0] });
    return json(200, { message: "Report deleted" });
  }

  return json(404, { detail: "Not found" });
}

async function handleParseMail(body) {
  const text = body.text || "";
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const parsed = [];
  const facilityGroups = {};

  let startIdx = 0;
  const firstLine = (lines[0] || "").toLowerCase();
  if (firstLine.includes("afhentning") || firstLine.includes("container") || firstLine.includes("fraktion")) startIdx = 1;

  for (let i = startIdx; i < lines.length; i++) {
    let parts = lines[i].split("\t");
    if (parts.length < 5) parts = lines[i].split(/\s{2,}/);
    if (parts.length < 6) continue;

    const date = parts[0].trim();
    if (!/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/.test(date)) continue;

    const container = parts[1].trim();
    const fraction = parts[2].trim();
    const facility = parts[4].trim();
    const address = parts[5].trim();
    const open_from = (parts[6] || "").trim();
    const open_to = (parts[7] || "").trim();
    const remark = (parts[8] || "").trim();

    if (fraction && facility) {
      parsed.push({ date, container, fraction, facility, address, open_from, open_to, remark });
      if (!facilityGroups[facility]) facilityGroups[facility] = [];
      facilityGroups[facility].push({ container, fraction, address, remark });
    }
  }

  const grouped = {};
  for (const [f, items] of Object.entries(facilityGroups)) {
    grouped[f] = { count: items.length, containers: items.map(i => i.container) };
  }

  return json(200, {
    success: parsed.length > 0,
    tours: parsed.slice(0, 20),
    count: Math.min(parsed.length, 20),
    debug_info: "",
    grouped_by_facility: grouped
  });
}

async function handlePlads(method, pathParts, body) {
  const db = await getDb();
  const col = db.collection("plads");

  if (method === "GET") {
    const list = await col.find({ active: true }, { projection: { _id: 0 } }).toArray();
    return json(200, list);
  }

  if (method === "POST") {
    const existing = await col.findOne({ name: body.name });
    if (existing) return json(400, { detail: "Plads already exists" });
    const plads = { id: uuidv4(), name: body.name, active: true, created_at: now() };
    await col.insertOne(plads);
    const { _id, ...result } = plads;
    return json(200, result);
  }

  if (method === "DELETE" && pathParts.length === 1) {
    await col.updateOne({ id: pathParts[0] }, { $set: { active: false } });
    return json(200, { message: "Plads deleted" });
  }

  return json(404, { detail: "Not found" });
}

async function handleSchedule(method, pathParts, body, query) {
  const db = await getDb();
  const col = db.collection("schedules");

  if (method === "GET") {
    const weekStart = query.week_start;
    if (!weekStart) return json(400, { detail: "week_start required" });
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const schedules = await col.find({
      date: { $gte: weekStart, $lte: end.toISOString().split("T")[0] }
    }, { projection: { _id: 0 } }).toArray();
    return json(200, schedules);
  }

  if (method === "POST" && pathParts[0] === "bulk") {
    const results = [];
    for (const s of body.schedules) {
      const existing = await col.findOne({ driver_id: s.driver_id, date: s.date }, { projection: { _id: 0 } });
      if (existing) {
        await col.updateOne({ id: existing.id }, { $set: { plads: s.plads, updated_at: now() } });
        results.push({ ...existing, plads: s.plads });
      } else {
        const obj = { id: uuidv4(), ...s, created_at: now(), updated_at: now() };
        await col.insertOne(obj);
        const { _id, ...result } = obj;
        results.push(result);
      }
    }
    return json(200, { message: `Saved ${results.length} schedules`, count: results.length });
  }

  if (method === "POST") {
    const existing = await col.findOne({ driver_id: body.driver_id, date: body.date }, { projection: { _id: 0 } });
    if (existing) {
      await col.updateOne({ id: existing.id }, { $set: { plads: body.plads, updated_at: now() } });
      return json(200, { ...existing, plads: body.plads });
    }
    const obj = { id: uuidv4(), ...body, created_at: now(), updated_at: now() };
    await col.insertOne(obj);
    const { _id, ...result } = obj;
    return json(200, result);
  }

  if (method === "DELETE") {
    const weekStart = query.week_start;
    if (!weekStart) return json(400, { detail: "week_start required" });
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    await col.deleteMany({ date: { $gte: weekStart, $lte: end.toISOString().split("T")[0] } });
    return json(200, { message: "Schedules deleted" });
  }

  return json(404, { detail: "Not found" });
}

async function handleMessages(method, pathParts, body, query) {
  const db = await getDb();
  const col = db.collection("messages");

  if (method === "GET") {
    const q = {};
    if (query.driver_id) q.to_driver_id = query.driver_id;
    const messages = await col.find(q, { projection: { _id: 0 } }).sort({ created_at: -1 }).toArray();
    return json(200, messages);
  }

  if (method === "POST") {
    const driver = await db.collection("drivers").findOne({ id: body.to_driver_id }, { projection: { _id: 0 } });
    const msg = {
      id: uuidv4(), from_admin: true, to_driver_id: body.to_driver_id,
      to_driver_name: driver ? driver.name : "", content: body.content,
      read: false, created_at: now()
    };
    await col.insertOne(msg);
    const { _id, ...result } = msg;
    return json(200, result);
  }

  if (method === "PUT" && pathParts.length === 2 && pathParts[1] === "read") {
    await col.updateOne({ id: pathParts[0] }, { $set: { read: true } });
    return json(200, { message: "Message marked as read" });
  }

  if (method === "DELETE" && pathParts.length === 1) {
    await col.deleteOne({ id: pathParts[0] });
    return json(200, { message: "Message deleted" });
  }

  return json(404, { detail: "Not found" });
}

async function handleAdminLogin(body) {
  if (body.username === "admin" && body.password === "1234") {
    return json(200, { success: true, message: "Login successful" });
  }
  return json(401, { detail: "Invalid credentials" });
}

async function handleAdminStats() {
  const db = await getDb();
  const drivers = await db.collection("drivers").find({}, { projection: { _id: 0 } }).toArray();
  const today = new Date().toISOString().split("T")[0];
  const stats = [];

  for (const driver of drivers) {
    const allTours = await db.collection("tours").find({ driver_id: driver.id, is_pause: false }, { projection: { _id: 0 } }).toArray();
    const todayTours = allTours.filter(t => t.date === today);
    const reports = await db.collection("reports").find({ driver_id: driver.id }, { projection: { _id: 0 } }).sort({ report_date: -1 }).limit(30).toArray();

    stats.push({
      driver_id: driver.id, driver_name: driver.name, plate: driver.plate,
      total_tours: allTours.length, completed_tours: allTours.filter(t => t.completed).length,
      total_weight: allTours.reduce((s, t) => s + (t.weight || 0), 0),
      today_tours: todayTours.length, today_completed: todayTours.filter(t => t.completed).length,
      last_start_time: reports[0]?.start_time || "", last_end_time: reports[0]?.end_time || "",
      reports: reports.slice(0, 10).map(r => ({ date: r.report_date, start: r.start_time, end: r.end_time, plads: r.plads }))
    });
  }
  return json(200, stats);
}

async function handleSeed() {
  const db = await getDb();
  const existing = await db.collection("drivers").countDocuments({});

  const existingPlads = await db.collection("plads").countDocuments({});
  if (existingPlads === 0) {
    const defaultPlads = ["Glostrup", "Herlev", "Hillerød", "Ballerup", "Skipstrup", "Helsingør", "Køge", "Bjæverskov", "St. Heddinge", "Hårlev", "Gribskov"];
    for (const name of defaultPlads) {
      await db.collection("plads").insertOne({ id: uuidv4(), name, active: true, created_at: now() });
    }
  }

  if (existing > 0) return json(200, { message: "Data already seeded", driver_count: existing });

  const defaultDrivers = [
    { name: "Dennis", plate: "DV 10239", area: "Glostrup", facility: "ARGO" },
    { name: "Zekiye", plate: "DY 84184", area: "Herlev", facility: "ARGO" },
    { name: "Emrer", plate: "EC 25026", area: "Hillerød", facility: "ARGO" },
    { name: "Ferdat", plate: "EN 80295", area: "Ballerup", facility: "ARGO" },
    { name: "FRI", plate: "DM 13404", area: "Skipstrup", facility: "ARGO" },
    { name: "Rafael", plate: "DR 30142", area: "Helsingør", facility: "ARGO" },
    { name: "John", plate: "DS 78545", area: "Køge", facility: "ARGO" },
    { name: "Thomas", plate: "DY 84177", area: "Bjæverskov", facility: "ARGO" },
    { name: "Tony", plate: "EB 64418", area: "St. Heddinge", facility: "ARGO" },
    { name: "Murat", plate: "EN 80294", area: "Hårlev", facility: "ARGO" },
    { name: "Nihat", plate: "EC 66505", area: "Gribskov", facility: "ARGO" },
    { name: "Berrin", plate: "BN55130", area: "Glostrup", facility: "ARGO" },
  ];

  for (const d of defaultDrivers) {
    await db.collection("drivers").insertOne({ id: uuidv4(), ...d, phone: "", email: "", active: true, created_at: now() });
  }

  return json(200, { message: "Seeded default drivers and plads", driver_count: defaultDrivers.length });
}

// ============= MAIN HANDLER =============

exports.handler = async (event) => {
  const method = event.httpMethod;

  // Handle CORS preflight
  if (method === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      },
      body: "",
    };
  }

  try {
    // Parse path: /api/tours/123 -> ["tours", "123"]
    const rawPath = event.path.replace("/.netlify/functions/api", "").replace("/api", "");
    const pathParts = rawPath.split("/").filter(Boolean);
    const resource = pathParts[0] || "";
    const subParts = pathParts.slice(1);

    const body = event.body ? JSON.parse(event.body) : {};
    const query = event.queryStringParameters || {};

    switch (resource) {
      case "drivers":
        return await handleDrivers(method, subParts, body, query);
      case "tours":
        return await handleTours(method, subParts, body, query);
      case "reports":
        return await handleReports(method, subParts, body, query);
      case "parse-mail":
        return await handleParseMail(body);
      case "plads":
        return await handlePlads(method, subParts, body);
      case "schedule":
        return await handleSchedule(method, subParts, body, query);
      case "messages":
        return await handleMessages(method, subParts, body, query);
      case "admin":
        if (subParts[0] === "login") return await handleAdminLogin(body);
        if (subParts[0] === "stats") return await handleAdminStats();
        return json(404, { detail: "Not found" });
      case "seed":
        return await handleSeed();
      case "":
        return json(200, { message: "Kørselsrapport API v2.0" });
      default:
        return json(404, { detail: "Not found" });
    }
  } catch (error) {
    console.error("API Error:", error);
    return json(500, { detail: error.message });
  }
};
