require("dotenv").config();
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const fs = require("fs");
const geocoding = require("@aashari/nodejs-geocoding");
const { createClient } = require("@supabase/supabase-js");
const { format } = require("path");

const supabase = createClient(
  process.env.supabaseUrl,
  process.env.supabaseRoleKey
);

async function grabEntries() {
  const { data, error } = await supabase
    .from("police_logs")
    .select("incid_num");
  if (error) {
    console.error("Error getting pins from database: ", error);
    return [];
  }
  return data;
}

function normDateTime(raw) {
  // Take only first part if it's a range like
  // "10/20/2025 5:00 PM - 10/23/2025 2:30 PM"
  if (!raw || typeof raw !== "string") {
    return null;
  }
  const firstPart = raw.split(" - ")[0].trim();

  // Handle "Unknown Time"
  if (/unknown time/i.test(firstPart)) {
    return null;
  }

  // match: MM/DD/YYYY HH:MM AM/PM or MM/DD/YYYY
  const m = firstPart.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})\s*(AM|PM))?$/i
  );

  if (!m) {
    return null;
  }

  const mm = Number(m[1]);
  const dd = Number(m[2]);
  const yyyy = Number(m[3]);
  const hhStr = m[4];
  const minStr = m[5];
  const ampm = m[6];

  let hour = 0;
  let minute = 0;

  if (hhStr !== undefined && minStr !== undefined && ampm !== undefined) {
    hour = Number(hhStr);
    minute = Number(minStr);

    // 12-hour → 24-hour
    if (/AM/i.test(ampm)) {
      if (hour === 12) hour = 0; // 12 AM → 00
    } else {
      if (hour !== 12) hour += 12; // PM conversion
    }
  }

  const dt = new Date(yyyy, mm - 1, dd, hour, minute, 0, 0);
  return dt.toISOString();
}

function checkTime(str) {
  //check if the string has an "unknown time" indication

  if (/unknown time/i.test(str)) {
    return true;
  }
  return false;
}

async function fetchCoordinates(address) {
  try {
    const results = await geocoding.encode(address);
    if (results) return results[0];
  } catch {
    return null;
  }
  return null;
}

async function scrapeUCSC() {
  const url = "https://ucsc.citizenrims.com/daily-crime-fire-log-bulletin";
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
  await page.waitForSelector("table.mat-mdc-table");

  const html = await page.content();
  const $ = cheerio.load(html);

  const jobs = [];

  $("table.mat-mdc-table tbody tr").each((i, el) => {
    const category = $(el).find("td.mat-column-nature").text().trim();
    const number = $(el).find("td.mat-column-number").text().trim();
    const date_time = $(el).find("td.mat-column-occurred").text().trim();
    const reported = $(el).find("td.mat-column-reported").text().trim();
    const disposition = $(el).find("td.mat-column-disposition").text().trim();
    let location = $(el).find("td.mat-column-location").text().trim();

    console.log("raw number: ", number);

    const lowerRow = $(el).text().trim().toLowerCase();
    if (lowerRow.includes("no records found")) return;
    if (disposition.toLowerCase().includes("log note")) return;

    // Clean & normalize address
    location = location
      .replace(/\s*\(Campus\)/gi, "")
      .replace(/\b(\d+)\s+block\s+of\s+/i, "$1 ")
      .replace(/\bCllge\b/gi, "College")
      .replace(/Mc\s+Laughlin/gi, "McLaughlin")
      .replace(/\bMchenry\b/gi, "McHenry")
      .replace(/Stevenson Service Rd\b/gi, "Stevenson Service Road")
      .replace(/\bRd\b/gi, "Road")
      .replace(/\bDr\b/gi, "Drive")
      .replace(/\bSt\b/gi, "Street")
      .replace(/Cowell-?stevenson/gi, "Cowell Stevenson")
      .replace(/Porter-?kresge/gi, "Porter Kresge")
      .trim();

    const placeMatch = location.match(/^([^,]+)/);
    const placeName = placeMatch ? placeMatch[1].trim() : location;

    // Standardize final address
    location = `${placeName}, Santa Cruz, CA 95064`;
    //console.log("this:%s, there:%s",category,location);
    let inTime = date_time;
    if (checkTime(date_time) == true) {
      inTime = reported;
    }

    jobs.push({ category, number, inTime, location, disposition }); //queue push
  });

  await browser.close();

  const existingEntries = await grabEntries();
  const seen = new Set(
    existingEntries
      .map((e) => e.incid_num && e.incid_num.trim())
      .filter(Boolean)
  );

  const existingEntries = await grabEntries();
  const seen = new Set(
    existingEntries
      .map((e) => e.incid_num && e.incid_num.trim())
      .filter(Boolean)
  );

  const rows = [];
  for (const job of jobs) {
    const { category, number, inTime, location, disposition } = job;

    const coords = await fetchCoordinates(location); //calls encode for coords
    const caseNum = number && number.trim();
    if (!caseNum) {
      console.log("no case number, skipping row:", job);
      continue;
    }
    if (seen.has(caseNum)) {
      console.log("already have case number, skipping row:", job);
      continue;
    }

    const lat = coords.latitude;
    const long = coords.longitude;
    const format_date = normDateTime(job.inTime);

    const supaRow =
      format_date == null
        ? { crime: category, lat: lat, long: long, incid_num: caseNum }
        : {
            crime: category,
            date: format_date,
            lat: lat,
            long: long,
            incid_num: caseNum,
          };

    console.log(supaRow);

    const { data, error } = await supabase
      .from("police_logs")
      .insert([supaRow]);

    if (error) {
      console.log("Couldn't append to supabase:", supaRow);
    } else {
      console.log("Pushed into supabase:", supaRow);
    }

    rows.push({
      category,
      number,
      date_time,
      location,
      lat,
      long,
      disposition,
    });
  }
}

async function main() {
  while (true) {
    await scrapeUCSC();
    await new Promise((r) => setTimeout(r, 15 * 60 * 1000)); //wait 15 minutes
  }
}

main().catch(console.error);
