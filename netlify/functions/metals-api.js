const https = require('https');

let cachedData = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

exports.handler = async (event, context) => {
  try {
    // Check cache
    const now = Date.now();
    if (cachedData && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('Returning cached data');
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=900'
        },
        body: JSON.stringify(cachedData)
      };
    }

    // Fetch fresh data
    const data = await fetchMetalsPrice();
    cachedData = data;
    cacheTimestamp = now;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=900'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Metals API Error:', error);
    
    // Return cached data even if error
    if (cachedData) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(cachedData)
      };
    }

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};

function fetchMetalsPrice() {
  return new Promise((resolve, reject) => {
    const url = 'https://api.metalpriceapi.com/v1/latest?api_key=fc0d17d2529ac3b5fef986d24338c604&base=USD&currencies=EUR,GBP,XAU,XAG';
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}
