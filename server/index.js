const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { scrapeNews, scrapeArticleDetail } = require('./crawler');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Main News Search Endpoint
app.get('/api/news', async (req, res) => {
  const { q, page = 1 } = req.query;
  
  if (!q) {
    return res.status(400).json({ error: 'Keyword "q" is required.' });
  }

  try {
    const articles = await scrapeNews(q, parseInt(page));
    res.json({
      query: q,
      page: parseInt(page),
      results: articles
    });
  } catch (error) {
    console.error('API Error /news:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Single Article Crawl Endpoint
app.get('/api/article', async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'Article "url" is required.' });
  }

  try {
    const article = await scrapeArticleDetail(url);
    res.json(article);
  } catch (error) {
    console.error('API Error /article:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
