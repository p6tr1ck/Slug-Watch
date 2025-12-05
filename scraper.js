const axios = require('axios')
const cheerio = require('cheerio')

axios
    .get('https://ucsc.citizenrims.com/daily-crime-fire-log-bulletin')
    .then(response =>{
        console.log(response.data);
    })
    .catch(error => {
        console.error('Error fetching page', error);
    });