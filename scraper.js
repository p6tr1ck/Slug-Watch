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

  // Wait for the table to render
  await page.waitForSelector('table.mat-mdc-table');

  // Get the full HTML after JS renders
  const html = await page.content();
  const $ = cheerio.load(html);

  const rows = [];
  $('table.mat-mdc-table tbody tr').each((i, el) => {
    const nature = $(el).find('td.mat-column-nature').text().trim();
    const number = $(el).find('td.mat-column-number').text().trim();
    const occurred = $(el).find('td.mat-column-occurred').text().trim();
    const location = $(el).find('td.mat-column-location').text().trim();
    const disposition = $(el).find('td.mat-column-disposition').text().trim();

    if (nature) {
      rows.push({ nature, number, occurred, location, disposition });
    }
  });

  console.log(`✅ Found ${rows.length} records.`);
  console.log(rows.slice(0, 5)); // print first few

  fs.writeFileSync('crime_log.json', JSON.stringify(rows, null, 2));
  console.log('Saved to crime_log.json');

  await browser.close();
}

scrapeUCSC();
