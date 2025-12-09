// scrape_ucsc_table.js
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');

async function scrapeUCSC() {
  const url = 'https://ucsc.citizenrims.com/daily-crime-fire-log-bulletin';
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(url, {
    waitUntil: 'networkidle2',
    timeout: 60000
  });

  await page.waitForSelector('table.mat-mdc-table');

  const html = await page.content();
  const $ = cheerio.load(html);

  const rows = [];
  $('table.mat-mdc-table tbody tr').each((i, el) => {
    const category = $(el).find('td.mat-column-nature').text().trim();
    const number = $(el).find('td.mat-column-number').text().trim();
    const date_time = $(el).find('td.mat-column-occurred').text().trim();
    const location = $(el).find('td.mat-column-location').text().trim();
    const disposition = $(el).find('td.mat-column-disposition').text().trim();

    if (category) {
      rows.push({ category, number, date_time, location, disposition });
    }
  });

  //console.log(`Found ${rows.length} records.`);
  console.log(rows.slice(0, 5)); // just printingfirst 5 to check

  fs.writeFileSync('crime_log.json', JSON.stringify(rows, null, 2));
  console.log('Saved to crime_log.json');

  await browser.close();
}

scrapeUCSC();
