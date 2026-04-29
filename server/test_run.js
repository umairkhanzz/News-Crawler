const { scrapeArticleDetail } = require('./crawler');

async function test() {
  const url = process.argv[2] || 'https://www.theaustralian.com.au/sport/cricket/how-south-australia-rose-from-a-domestic-cricket-joke-to-sheffield-shield-powerhouse/news-story/19a1edef1794ab5812b976a4430030ee';
  console.log(`Testing scrape for: ${url}`);
  try {
    const result = await scrapeArticleDetail(url);
    console.log('--- RESULT ---');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('--- ERROR ---', error);
  }
}

test();
