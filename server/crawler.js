const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');

/**
 * Scrapes news from Bing News Search.
 * @param {string} query - The search keyword.
 * @param {number} page - The page number (offset).
 * @returns {Promise<Array>} - List of news articles.
 */
async function scrapeNews(query, page = 1) {
  try {
    const offset = (page - 1) * 20;
    const url = `https://www.bing.com/news/search?q=${encodeURIComponent(query)}&first=${offset}`;
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    const $ = cheerio.load(response.data);
    const articles = [];

    $('.news-card').each((i, el) => {
      const title = $(el).find('.title').text().trim();
      const link = $(el).find('.title').attr('href');
      const snippet = $(el).find('.snippet').text().trim();
      const source = $(el).find('.source').text().trim();
      const time = $(el).find('.time').text().trim();
      let image = $(el).find('img').attr('src') || $(el).find('img').attr('data-src');

      if (image && image.startsWith('/')) {
        image = 'https://www.bing.com' + image;
      }

      if (title && link) {
        articles.push({
          id: Math.random().toString(36).substr(2, 9),
          title,
          link,
          snippet,
          source,
          time,
          image: image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1000'
        });
      }
    });

    return articles;
  } catch (error) {
    console.error('Scraping Error:', error.message);
    throw new Error('Failed to crawl news.');
  }
}

/**
 * Scrapes detailed article content using Puppeteer and Mozilla Readability.
 * @param {string} url - The article URL.
 * @returns {Promise<Object>} - Detailed article data.
 */
async function scrapeArticleDetail(url) {
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    
    // Set a realistic User-Agent
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');
    
    // Navigate and wait for content
    await page.goto(url, { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });

    // Get the full HTML
    const html = await page.content();
    
    // Use Readability to extract the main content
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      throw new Error('Readability failed to parse the article.');
    }

    return {
      title: article.title,
      content: article.content, // HTML content
      excerpt: article.excerpt,
      byline: article.byline,
      siteName: article.siteName,
      image: null, // We'll rely on the one from the search result or og:image meta if we really want to scrape it separately
      sourceUrl: url
    };
  } catch (error) {
    console.error('Deep Scraping Error:', error.message);
    return {
      title: 'Article Preview',
      content: `<p>We encountered an issue while trying to extract the full content of this article: <i>${error.message}</i>.</p><p>You can still read the full story on the original website.</p>`,
      sourceUrl: url
    };
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = { scrapeNews, scrapeArticleDetail };
