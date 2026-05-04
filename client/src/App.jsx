import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Loader2, Newspaper, ChevronLeft, ChevronRight, X, ExternalLink, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = 'http://localhost:3001/api';

function App() {
  const [query, setQuery] = useState('');
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [articleLoading, setArticleLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  const handleSearch = async (e, newQuery = query, newPage = 1) => {
    if (e) e.preventDefault();
    if (!newQuery) return;

    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/news`, {
        params: { q: newQuery, page: newPage }
      });
      setNews(response.data.results);
      setPage(newPage);
      setTotalResults(response.data.results.length); // Bing news search gives dynamic results
    } catch (error) {
      console.error('Search error:', error);
      alert('Failed to fetch news. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openArticle = async (article) => {
    setArticleLoading(true);
    setSelectedArticle({ ...article, isFetching: true });

    try {
      const response = await axios.get(`${API_BASE}/article`, {
        params: { url: article.link }
      });
      setSelectedArticle(response.data);
    } catch (error) {
      console.error('Article fetch error:', error);
      setSelectedArticle({
        ...article,
        content: '<p>Failed to load full article content. done You can read it directly at the source site.</p>'
      });
    } finally {
      setArticleLoading(false);
    }
  };

  const closeArticle = () => setSelectedArticle(null);

  // Initial search on mount
  useEffect(() => {
    handleSearch(null, 'World News', 1);
  }, []);

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <Newspaper size={28} />
            <span>CrawlerNews</span>
          </div>
        </div>
      </header>

      <form className="search-wrapper" onSubmit={handleSearch}>
        <input
          className="search-input"
          placeholder="Search for news by keyword (e.g. cricket, AI, startups)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="search-button" type="submit">
          <Search size={20} />
          <span>Search</span>
        </button>
      </form>

      {loading ? (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Crawling the latest headlines for "{query || 'World News'}"...</p>
        </div>
      ) : (
        <>
          <motion.div
            className="news-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {news.map((item, idx) => (
              <motion.div
                key={item.id}
                className="news-card"
                onClick={() => openArticle(item)}
                whileHover={{ scale: 1.02 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <img src={item.image} alt={item.title} className="news-image" loading="lazy" />
                <div className="news-content">
                  <span className="news-source">{item.source}</span>
                  <h3 className="news-title">{item.title}</h3>
                  <p className="news-snippet">{item.snippet}</p>
                  <div className="news-footer">
                    <span>{item.time}</span>
                    <RefreshCw size={14} className="icon-pulse" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <div className="pagination">
            <button
              className="page-btn"
              onClick={() => handleSearch(null, query || 'World News', page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft size={18} />
            </button>
            <span className="page-num">Page {page}</span>
            <button
              className="page-btn"
              onClick={() => handleSearch(null, query || 'World News', page + 1)}
              disabled={news.length < 20}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </>
      )}

      {/* Article Detail Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeArticle}
          >
            <motion.div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <button className="modal-close" onClick={closeArticle}>
                <X size={20} />
              </button>

              {(selectedArticle.image || selectedArticle.thumbnail) && (
                <img src={selectedArticle.image || selectedArticle.thumbnail} alt={selectedArticle.title} className="article-hero" />
              )}

              <div className="article-body">
                {selectedArticle.siteName && (
                  <span className="news-source">{selectedArticle.siteName}</span>
                )}
                <h1 className="article-title">{selectedArticle.title}</h1>
                {selectedArticle.byline && (
                  <p className="article-byline" style={{ marginTop: '-1rem', marginBottom: '1.5rem', color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}>
                    By {selectedArticle.byline}
                  </p>
                )}

                {articleLoading ? (
                  <div className="loading-indicator">
                    <Loader2 size={40} className="spinner" />
                    <p>Crawling full story content with Reader Mode...</p>
                  </div>
                ) : (
                  <div className="article-text">
                    <div dangerouslySetInnerHTML={{ __html: selectedArticle.content }} />
                    <div style={{ marginTop: '2rem', borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
                      <a
                        href={selectedArticle.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="search-button"
                        style={{ display: 'inline-flex' }}
                      >
                        <ExternalLink size={18} />
                        Read original article at source
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer style={{ textAlign: 'center', padding: '4rem 0', color: '#94a3b8', fontSize: '0.9rem' }}>
        <p>© 2026 CrawlerNews Demo. Premium Web Scraper Experience.</p>
      </footer>
    </div>
  );
}

export default App;
