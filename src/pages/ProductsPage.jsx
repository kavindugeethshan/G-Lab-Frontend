import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/products/ProductCard';
import { productService } from '../services/productService';
import './ProductsPage.css';

const CATEGORIES = [
  { label: 'All Categories', value: '' },
  { label: 'Graphics Cards', value: 'Graphics Cards' },
  { label: 'Processors', value: 'Processors' },
  { label: 'Memory (RAM)', value: 'RAM' },
  { label: 'SSDs & Storage', value: 'Storage' },
  { label: 'Power Supplies', value: 'Power Supplies' },
  { label: 'Motherboards', value: 'Motherboards' },
  { label: 'Cameras', value: 'Cameras' },
  { label: 'Drones', value: 'Drones' },
  { label: 'Laptops', value: 'Laptops' },
];

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // States initialized from search params
  const [keyword, setKeyword] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [brand, setBrand] = useState(searchParams.get('brand') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sortOption, setSortOption] = useState(searchParams.get('sort') || 'newest');
  const [limit, setLimit] = useState(Number(searchParams.get('limit')) || 12);
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        limit,
        page,
      };

      const currCat = searchParams.get('category');
      const currSearch = searchParams.get('search');
      const currBrand = searchParams.get('brand');
      const currMin = searchParams.get('minPrice');
      const currMax = searchParams.get('maxPrice');
      const currSort = searchParams.get('sort');

      if (currCat) params.category = currCat;
      if (currSearch) params.search = currSearch;
      if (currBrand) params.brand = currBrand;
      if (currMin) params.minPrice = Number(currMin);
      if (currMax) params.maxPrice = Number(currMax);
      if (currSort) params.sort = currSort;

      const data = await productService.getProducts(params);
      let list = data.products || [];

      // Client sort fallback if backend doesn't sort
      if (currSort === 'price_asc') {
        list.sort((a, b) => (a.price || 0) - (b.price || 0));
      } else if (currSort === 'price_desc') {
        list.sort((a, b) => (b.price || 0) - (a.price || 0));
      } else if (currSort === 'rating') {
        list.sort((a, b) => (b.ratingAverage || 0) - (a.ratingAverage || 0));
      }

      setProducts(list);
      setTotalProducts(data.pagination?.totalProducts || data.total || list.length);
    } catch (err) {
      console.warn('Error loading products:', err?.message);
    } finally {
      setLoading(false);
    }
  }, [searchParams, limit, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  }, [page]);

  const applyFilters = () => {
    const newParams = new URLSearchParams();
    if (keyword.trim()) newParams.set('search', keyword.trim());
    if (category) newParams.set('category', category);
    if (brand.trim()) newParams.set('brand', brand.trim());
    if (minPrice) newParams.set('minPrice', minPrice);
    if (maxPrice) newParams.set('maxPrice', maxPrice);
    if (sortOption) newParams.set('sort', sortOption);
    if (limit) newParams.set('limit', String(limit));
    newParams.set('page', '1');
    setPage(1);
    setSearchParams(newParams);
    setMobileFilterOpen(false);
  };

  const handleCategorySelect = (catVal) => {
    setCategory(catVal);
    const newParams = new URLSearchParams(searchParams);
    if (catVal) newParams.set('category', catVal);
    else newParams.delete('category');
    newParams.set('page', '1');
    setPage(1);
    setSearchParams(newParams);
    setMobileFilterOpen(false);
  };

  const resetFilters = () => {
    setKeyword('');
    setCategory('');
    setBrand('');
    setMinPrice('');
    setMaxPrice('');
    setSortOption('newest');
    setPage(1);
    setSearchParams({});
    setMobileFilterOpen(false);
  };

  const totalPages = Math.ceil(totalProducts / limit) || 1;

  return (
    <>
      <div className="page-container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px 80px 20px' }}>
      {/* 1. TOP SEARCH BAR CARD */}
      <div className="top-search-card">
        <div className="top-search-header">
          <h2>Hardware &amp; Component Catalog</h2>
          <p>Find genuine CPUs, GPUs, RAM modules, SSDs, and motherboards with full warranty</p>
        </div>
        <div className="search-bar-row">
          <div className="search-input-box">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input
              type="text"
              id="searchKeyword"
              placeholder="Search products by name, brand, or specifications..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            />
          </div>
          <button type="button" className="btn btn-primary btn-search" onClick={applyFilters}>
            <i className="fa-solid fa-magnifying-glass"></i> Search
          </button>
        </div>
      </div>

      {/* 2. SHOP LAYOUT */}
      <div className="shop-layout">
        {/* PRODUCT DISPLAY & CONTROLS */}
        <main className="products-content-area">
          {/* TOP CONTROL BAR */}
          <div className="products-control-bar">
            <div className="results-count" id="resultsCount">
              Showing {products.length} of {totalProducts} products
            </div>
            <div className="control-actions-right">
              {/* Filter Trigger Button */}
              <button
                type="button"
                className="btn btn-outline btn-filter-trigger"
                onClick={() => setMobileFilterOpen(true)}
              >
                <i className="fa-solid fa-sliders"></i> Filters
              </button>

              {/* All Categories Button */}
              <button
                type="button"
                className={`btn btn-outline btn-all-categories ${!category ? 'active' : ''}`}
                onClick={() => handleCategorySelect('')}
                title="Show all products"
              >
                <i className="fa-solid fa-layer-group"></i> All Categories
              </button>

              <select
                className="select-sort"
                value={sortOption}
                onChange={(e) => {
                  setSortOption(e.target.value);
                  const p = new URLSearchParams(searchParams);
                  p.set('sort', e.target.value);
                  setSearchParams(p);
                }}
              >
                <option value="newest">Sort by: Newest Arrivals</option>
                <option value="price_asc">Sort by: Price (Low to High)</option>
                <option value="price_desc">Sort by: Price (High to Low)</option>
                <option value="rating">Sort by: Top Rated</option>
              </select>

              <select
                className="select-sort"
                value={limit}
                onChange={(e) => {
                  const newLimit = Number(e.target.value);
                  setLimit(newLimit);
                  const p = new URLSearchParams(searchParams);
                  p.set('limit', String(newLimit));
                  p.set('page', '1');
                  setPage(1);
                  setSearchParams(p);
                }}
              >
                <option value="12">12 / page</option>
                <option value="24">24 / page</option>
                <option value="48">48 / page</option>
              </select>
            </div>
          </div>

          {/* PRODUCT LISTING GRID */}
          <div id="productList" className="product-grid">
            {loading ? (
              <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                Loading catalog products...
              </p>
            ) : products.length > 0 ? (
              products.map((prod) => (
                <ProductCard key={prod._id} product={prod} />
              ))
            ) : (
              <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                No hardware components matched your filter criteria.
              </p>
            )}
          </div>

          {/* PAGINATION BAR */}
          <div className="pagination-bar" id="paginationBar">
            <div className="pagination-info">
              Page {page} of {totalPages}
            </div>
            <div className="pagination-buttons">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={page <= 1}
                onClick={() => {
                  const newPage = page - 1;
                  setPage(newPage);
                  const p = new URLSearchParams(searchParams);
                  p.set('page', String(newPage));
                  setSearchParams(p);
                }}
              >
                &laquo; Prev
              </button>
              {Array.from({ length: totalPages }).slice(0, 5).map((_, i) => {
                const pgNum = i + 1;
                return (
                  <button
                    key={pgNum}
                    type="button"
                    className={`btn ${page === pgNum ? 'btn-primary' : 'btn-outline'} btn-sm`}
                    onClick={() => {
                      setPage(pgNum);
                      const p = new URLSearchParams(searchParams);
                      p.set('page', String(pgNum));
                      setSearchParams(p);
                    }}
                  >
                    {pgNum}
                  </button>
                );
              })}
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={page >= totalPages}
                onClick={() => {
                  const newPage = page + 1;
                  setPage(newPage);
                  const p = new URLSearchParams(searchParams);
                  p.set('page', String(newPage));
                  setSearchParams(p);
                }}
              >
                Next &raquo;
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>

      {/* FILTER DRAWER & BACKDROP */}
      <div
        className={`drawer-backdrop ${mobileFilterOpen ? 'active' : ''}`}
        onClick={() => setMobileFilterOpen(false)}
      ></div>

      <div className={`mobile-filter-drawer ${mobileFilterOpen ? 'active' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-title">
            <i className="fa-solid fa-sliders" style={{ color: 'var(--accent-color)' }}></i> Filters
          </div>
          <button
            type="button"
            className="btn-reset-link"
            onClick={() => setMobileFilterOpen(false)}
            style={{ fontSize: '1.1rem' }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="filter-group">
          <span className="filter-label">Categories</span>
          <ul className="category-list">
            {CATEGORIES.map((cat) => (
              <li key={cat.value}>
                <button
                  type="button"
                  className={`category-item-btn ${category === cat.value ? 'active' : ''}`}
                  onClick={() => handleCategorySelect(cat.value)}
                >
                  {cat.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="filter-group">
          <span className="filter-label">Brand / Manufacturer</span>
          <input
            type="text"
            className="sidebar-input"
            placeholder="e.g. ASUS, MSI"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <span className="filter-label">Price Range (Rs.)</span>
          <div className="price-range-inputs">
            <input
              type="number"
              className="sidebar-input"
              placeholder="Min"
              min="0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <input
              type="number"
              className="sidebar-input"
              placeholder="Max"
              min="0"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={resetFilters}>
            Reset
          </button>
          <button type="button" className="btn btn-primary" style={{ flex: 2 }} onClick={applyFilters}>
            View Results
          </button>
        </div>
      </div>
    </>
  );
}
