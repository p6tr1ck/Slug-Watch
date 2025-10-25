const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');
const geocoding = require('@aashari/nodejs-geocoding');

async function fetchCoordinates(address) {
  try {
    const results = await geocoding.encode(address); // conversion from clean address to coords
    if (results) return results[0];
    if (results && typeof results === 'object') return results[0];
  } catch {
    return null;
  }
  return null;
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
      .replace(/\b(\d+)\s+block\s+of\s+/i, '$1 ')
      .replace(/\s*\(Campus\)/gi, '')
      .replace(/\*/g, '')
      .replace(/\bCllg\b/gi, 'College')
      .replace(/\bBuil\b/gi, 'Building')
      .replace(/Mc\s+Laughlin/gi, 'McLaughlin')
      .replace(/\bMchenry\b/gi, 'McHenry')
      .replace(/Stevenson Service Rd\b/gi, 'Stevenson Service Road')
      .replace(/\bRd\b/gi, 'Road')
      .replace(/\bDr\b/gi, 'Drive')
      .replace(/\bSt\b/gi, 'Street')
      .replace(/Cowell-?stevenson/gi, 'Cowell Stevenson')
      .replace(/Porter-?kresge/gi, 'Porter Kresge')
      .trim();

    //adding city state, and zip for encode
    location = `${location} CA 95064`;

    jobs.push({category, number, date_time, location, disposition}); //queue push
  });

  await browser.close();

  const rows = []; //rows to push to json
  for (const job of jobs) {
    const { category, number, date_time, location, disposition } = job;

    const coords = await fetchCoordinates(location); //calls encode for coords

    
    if (!coords || coords.latitude == null || coords.longitude == null) { //checks for existence
      continue;
    }

    rows.push({category, number, date_time, location, lat: coords.latitude, long: coords.longitude ,disposition}); //push to finshed array
  }


  fs.writeFileSync('crime_log.json', JSON.stringify(rows, null, 2));
  console.log('Saved to crime_log.json');
}
