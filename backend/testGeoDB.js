const axios = require('axios');

async function testCity(city) {
  try {
    const response = await axios.get('https://wft-geo-db.p.rapidapi.com/v1/geo/cities', {
      params: { namePrefix: city, limit: 1 },
      headers: {
        'X-RapidAPI-Key': 'YOUR_API_KEY_HERE',
        'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com',
      },
    });
    console.log(response.data);
  } catch (error) {
    console.error(error.response?.data || error.message);
  }
}

testCity('London');
