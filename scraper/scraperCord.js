require("dotenv").config()
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');
const geocoding = require('@aashari/nodejs-geocoding');
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.supabaseUrl,
  process.env.supabaseRoleKey
);

async function fetchCoordinates(address) {
  try {
    const results = await geocoding.encode(address); // conversion from clean address to coords
    if (results) return results[0];
    //if (results && typeof results === 'object') return results[0];
  } catch {
    return null;
  }
  return null;
}
function parseDateTime(dtString) {
  const match = dtString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/);
  if (!match) {
    return dtString;
  }

  const [_, mm, dd, yyyy, HH, MM] = match;

  const monthIndex = Number(mm) - 1;
  const dayNum = Number(dd);
  const yearNum = Number(yyyy);
  const hourNum = Number(HH);
  const minNum = Number(MM);

  const d = new Date(yearNum, monthIndex, dayNum, hourNum, minNum, 0, 0);
  return d.toISOString();
}

async function scrapeUCSC() {
  const url = 'https://ucsc.citizenrims.com/daily-crime-fire-log-bulletin';
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('table.mat-mdc-table');

  const html = await page.content();
  const $ = cheerio.load(html);

  const jobs = []; //queue to allow time for encode to work

  $('table.mat-mdc-table tbody tr').each((i, el) => {
    const category = $(el).find('td.mat-column-nature').text().trim();
    const number = $(el).find('td.mat-column-number').text().trim();
    const date_time = $(el).find('td.mat-column-occurred').text().trim();
    const disposition = $(el).find('td.mat-column-disposition').text().trim();
    let location = $(el).find('td.mat-column-location').text().trim();

    const lowerRow = $(el).text().trim().toLowerCase();
    if (lowerRow.includes('no records found')) return; //exclude days with no reported activity
    if (disposition.toLowerCase().includes('log note')) return; //exclude log notes

    location = location // cleaning up address, excess fluff
      .replace(/\b(\d+)\s+block\s+of\s+/i, '$1 ') //blocks
      .replace(/\s*\(Campus\)/gi, '') //removes campus tag
      .replace(/^.*?,\s*(?=\d)/, '') //all before comma deleted
      .replace(/Cllge/gi, 'College')
      .replace(/Mc\s+Laughlin/gi, 'McLaughlin')
      .replace(/\bMchenry\b/gi, 'McHenry')
      .replace(/Stevenson Service Rd\b/gi, 'Stevenson Service Road')
      .replace(/\bRd\b/gi, 'Road')
      .replace(/\bDr\b/gi, 'Drive')
      .replace(/\bSt\b/gi, 'Street')
      .replace(/Cowell-?stevenson/gi, 'Cowell Stevenson')
      .replace(/Porter-?kresge/gi, 'Porter Kresge')
      .trim();

    if (!/^\s*\d/.test(location)) return; //makes sure that theres a numerical address

    //adding city state, and zip for encode
    location = `${location}, CA 95064`;
    const form_date = parseDateTime(date_time)

    jobs.push({category, number, form_date, location, disposition}); //queue push
  });

  await browser.close();

  const rows = []; //rows to push to json
  const supaRow = []
  for (const job of jobs) {
    const { category, number, form_date, location, disposition } = job;

    const coords = await fetchCoordinates(location); //calls encode for coords

    
    if (!coords || coords.latitude == null || coords.longitude == null) { //checks for existence
      console.log("couldn't find lat/long for the following: %s", job);
      continue;
    }

    rows.push({category, number, form_date, location, lat: coords.latitude, long: coords.longitude ,disposition}); //push to finshed array
    //console.log(rows);

    const lat = coords.latitude;
    const long = coords.longitude;


    console.log("heres the parsed shit, %s, %s, %s, %s", category, form_date, lat, long);

    supaRow.push({ crime:category, date:form_date, lat: lat, longi:long});
    //console.log(supaRow);
    const {data, err} = await supabase.from("police_logs").insert([supaRow]);

    // if (err){
    //   console.log("Couldn't append this to supabase: %s", data);
    // }else{
    //   console.log("pushed into supabase: %s", supaRow);
    // }
  }


  fs.writeFileSync('crime_log.json', JSON.stringify(rows, null, 2));
  console.log('Saved to crime_log.json');
}

scrapeUCSC();
