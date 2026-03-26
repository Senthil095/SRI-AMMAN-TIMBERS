import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useCart } from '../context/CartContext';
import { FiSearch, FiShoppingCart, FiStar, FiArrowRight, FiCheck, FiTruck, FiShield, FiAward, FiPhone } from 'react-icons/fi';
import ScrollReveal from '../components/ScrollReveal';
import './Home.css';

const CATEGORIES = ['All', 'Interior', 'Exterior', 'Primer', 'Enamel', 'Texture', 'Wood Finish'];

const WHY_CHOOSE = [
    { icon: <FiAward size={24} />, title: 'Premium Quality', desc: 'All paints are certified and tested for durability, coverage, and finish quality.', color: '#ff6b6b', bg: '#fff0f0' },
    { icon: <FiTruck size={24} />, title: 'Fast Delivery', desc: 'Same-day delivery available in select areas.', color: '#2ec4b6', bg: '#e8faf9' },
    { icon: <FiShield size={24} />, title: 'Genuine Products', desc: '100% authentic paints directly sourced from top manufacturers.', color: '#4cc9f0', bg: '#eaf8ff' },
    { icon: <FiPhone size={24} />, title: 'Expert Support', desc: 'Our color consultants are available 7 days a week to help you choose the right shade.', color: '#9b5de5', bg: '#f5eeff' },
];

const TESTIMONIALS = [
    { name: 'Priya Sharma', role: 'Interior Designer', text: 'Sri Amman Paints has the best selection of interior paints I\'ve ever seen. The quality is exceptional and delivery was super fast!', rating: 5, avatar: 'P' },
    { name: 'Rajan Kumar', role: 'Homeowner', text: 'Ordered Asian Paints Royale for my living room. The color matched perfectly and coverage was amazing. Highly recommend!', rating: 5, avatar: 'R' },
    { name: 'Meena Iyer', role: 'Architect', text: 'Great variety of exterior paints. The team helped me pick the right primer for my project. Excellent service!', rating: 5, avatar: 'M' },
    { name: 'Suresh Babu', role: 'Contractor', text: 'I order in bulk regularly. Sri Amman Paints always delivers on time and the prices are very competitive. My go-to store!', rating: 4, avatar: 'S' },
];

const SkeletonCard = () => (
    <div className="product-card skeleton-card">
        <div className="skeleton" style={{ height: '200px', borderRadius: '16px 16px 0 0' }} />
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="skeleton" style={{ height: '14px', width: '60%' }} />
            <div className="skeleton" style={{ height: '20px', width: '80%' }} />
            <div className="skeleton" style={{ height: '14px', width: '40%' }} />
            <div className="skeleton" style={{ height: '40px', borderRadius: '9999px' }} />
        </div>
    </div>
);

const StarRating = ({ rating }) => (
    <div className="star-rating">
        {[1, 2, 3, 4, 5].map(i => (
            <FiStar key={i} size={14} fill={i <= rating ? '#ffd166' : 'none'} color={i <= rating ? '#ffd166' : '#ced4da'} />
        ))}
    </div>
);

const Home = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [addedId, setAddedId] = useState(null);
    const [testimonialIdx, setTestimonialIdx] = useState(0);
    const [selectedSizes, setSelectedSizes] = useState({}); // { productId: sizeObj }
    const [customerCount, setCustomerCount] = useState(0);
    const { addToCart } = useCart();
    const testimonialTimer = useRef(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
                const snap = await getDocs(q);
                setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        const fetchStats = async () => {
             try {
                 const orderSnap = await getDocs(collection(db, 'orders'));
                 const uniqueCustomers = new Set();
                 orderSnap.docs.forEach(d => {
                     const o = d.data();
                     const key = o.customerEmail || o.userEmail || o.customerName;
                     if (key) uniqueCustomers.add(key);
                 });
                 setCustomerCount(uniqueCustomers.size);
             } catch (err) {
                 console.error(err);
             }
        };
        fetchProducts();
        fetchStats();
    }, []);

    // Auto-scroll testimonials
    useEffect(() => {
        testimonialTimer.current = setInterval(() => {
            setTestimonialIdx(i => (i + 1) % TESTIMONIALS.length);
        }, 4000);
        return () => clearInterval(testimonialTimer.current);
    }, []);

    const handleAddToCart = (product) => {
        const size = selectedSizes[product.id] || (product.sizes?.length > 0 ? product.sizes[0] : null);
        addToCart(product, size);
        setAddedId(product.id);
        setTimeout(() => setAddedId(null), 1500);
    };

    const filtered = products.filter(p => {
        const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase());
        const matchCat = activeCategory === 'All' || p.category === activeCategory;
        return matchSearch && matchCat;
    });

    const displayPrice = p => p.discountPrice || p.price;
    const discount = p => p.discountPrice && p.price
        ? Math.round(((p.price - p.discountPrice) / p.price) * 100)
        : null;

    return (
        <div className="home-page">
            {/* ── Hero ─────────────────────────────────────────────── */}
            <section className="hero-section">
                {/* Floating paint blobs */}
                <div className="paint-blob blob-1" />
                <div className="paint-blob blob-2" />
                <div className="paint-blob blob-3" />
                <div className="paint-blob blob-4" />
                <div className="paint-blob blob-5" />

                <div className="container">
                    <div className="hero-content">
                        <h1 className="hero-title fade-in">
                            Bring Your Walls
                            <span className="hero-title-accent"> To Life</span>
                        </h1>
                        <p className="hero-subtitle fade-in">
                            Discover {products.length}+ premium paints — from vibrant interiors to weather-proof exteriors.
                            Expert color consultation, fast delivery, and unbeatable prices.
                        </p>
                        <div className="hero-actions fade-in">
                            <a href="#products" className="btn btn-primary btn-lg hero-cta-primary" onClick={(e) => {
                                e.preventDefault();
                                document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
                            }}>
                                Shop Now <FiArrowRight size={18} />
                            </a>
                        </div>
                        <div className="hero-stats fade-in">
                            <div className="hero-stat">
                                <span className="hero-stat-num">{products.length > 0 ? products.length : '...'}</span>
                                <span className="hero-stat-label">Paint Shades</span>
                            </div>
                            <div className="hero-stat-divider" />
                            <div className="hero-stat">
                                <span className="hero-stat-num">{customerCount > 0 ? customerCount : '...'}</span>
                                <span className="hero-stat-label">Happy Customers</span>
                            </div>
                            <div className="hero-stat-divider" />
                            <div className="hero-stat">
                                <span className="hero-stat-num">Fast</span>
                                <span className="hero-stat-label">Delivery</span>
                            </div>
                        </div>
                    </div>

                    {/* Hero visual */}
                    <div className="hero-visual fade-in">
                        <div className="paint-palette-card">
                            <div className="palette-row">
                                {['#ff6b6b', '#ffd166', '#2ec4b6', '#4cc9f0', '#9b5de5'].map(c => (
                                    <div key={c} className="palette-dot" style={{ background: c }} />
                                ))}
                            </div>
                            <div className="palette-preview" style={{ background: 'linear-gradient(135deg, #ff6b6b22, #4cc9f022, #2ec4b622)' }}>
                                <span className="palette-preview-text">Your Perfect Shade</span>
                            </div>
                            <div className="palette-swatches">
                                {[
                                    { name: 'Coral Bliss', hex: '#ff6b6b' },
                                    { name: 'Ocean Teal', hex: '#2ec4b6' },
                                    { name: 'Sky Dream', hex: '#4cc9f0' },
                                    { name: 'Sunny Gold', hex: '#ffd166' },
                                ].map(s => (
                                    <div key={s.name} className="swatch-item">
                                        <div className="swatch-color" style={{ background: s.hex }} />
                                        <span className="swatch-name">{s.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Products ─────────────────────────────────────────── */}
            <section className="products-section" id="products">
                <div className="container">
                    <div className="products-header fade-in">
                        <div>
                            <h2 className="section-title">Our Products</h2>
                            <p className="section-subtitle">Premium paints for every surface and style</p>
                        </div>
                        {/* Search */}
                        <div className="search-box">
                            <FiSearch size={16} className="search-icon" />
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search paints..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Category Tabs */}
                    <div className="category-tabs fade-in">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                className={`cat-tab ${activeCategory === cat ? 'active' : ''}`}
                                onClick={() => setActiveCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Grid */}
                    <div className="products-grid">
                        {loading
                            ? Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)
                            : filtered.length === 0
                                ? (
                                    <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                                        <div className="empty-icon">🎨</div>
                                        <h3>No products found</h3>
                                        <p>Try a different search or category</p>
                                    </div>
                                )
                                : filtered.map((product, i) => {
                                    const disc = discount(product);
                                    const added = addedId === product.id;
                                    const currentSize = product.sizes?.length > 0 ? (selectedSizes[product.id] || product.sizes[0]) : null;
                                    const currentStock = currentSize ? (currentSize.stock !== undefined ? currentSize.stock : product.stock) : product.stock;
                                    return (
                                        <div key={product.id} className="product-card fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                                            {disc && <div className="discount-tag">-{disc}%</div>}
                                            <Link to={`/product/${product.id}`} className="product-img-wrapper">
                                                {product.imageUrl
                                                    ? <img src={product.imageUrl} alt={product.name} className="product-img" />
                                                    : <div className="product-img-placeholder">🎨</div>
                                                }
                                            </Link>
                                            <div className="product-info">
                                                <span className="product-category">{product.category}</span>
                                                <Link to={`/product/${product.id}`}>
                                                    <h3 className="product-name">{product.name}</h3>
                                                </Link>

                                                {/* Size pills */}
                                                {product.sizes?.length > 0 && (
                                                    <div className="product-card-sizes">
                                                        {product.sizes.map(s => {
                                                            const sel = selectedSizes[product.id] || product.sizes[0];
                                                            return (
                                                                <button
                                                                    key={s.label}
                                                                    className={`card-size-pill ${sel.label === s.label ? 'active' : ''}`}
                                                                    onClick={() => setSelectedSizes(prev => ({ ...prev, [product.id]: s }))}
                                                                >
                                                                    {s.label}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                <div className="product-pricing">
                                                    <span className="product-price">
                                                        ₹{(
                                                            product.sizes?.length > 0
                                                                ? (selectedSizes[product.id] || product.sizes[0]).price
                                                                : displayPrice(product)
                                                        )?.toLocaleString()}
                                                    </span>
                                                    {(!product.sizes || product.sizes.length === 0) && product.discountPrice && (
                                                        <span className="product-original">₹{product.price?.toLocaleString()}</span>
                                                    )}
                                                </div>
                                                <div className="product-footer">
                                                    <span className={`stock-badge ${currentStock === 0 ? 'out' : currentStock <= 5 ? 'low' : 'in'}`}>
                                                        {currentStock === 0 ? 'Out of Stock' : currentStock <= 5 ? `Only ${currentStock} left` : 'In Stock'}
                                                    </span>
                                                    <button
                                                        className={`add-to-cart-btn ${added ? 'added' : ''}`}
                                                        onClick={() => handleAddToCart(product)}
                                                        disabled={currentStock === 0}
                                                    >
                                                        {added ? <><FiCheck size={14} /> Added!</> : <><FiShoppingCart size={14} /> Add</>}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                        }
                    </div>
                </div>
            </section>

            {/* ── Why Choose Us ────────────────────────────────────── */}
            <ScrollReveal>
                <section className="why-section">
                    <div className="container">
                        <div className="why-header fade-in">
                            <h2 className="section-title">Why Choose Sri Amman Paints?</h2>
                            <p className="section-subtitle">We make painting your space easy, affordable, and beautiful</p>
                        </div>
                        <div className="why-grid">
                            {WHY_CHOOSE.map((item, i) => (
                                <div key={i} className="why-card fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                                    <div className="why-icon" style={{ background: item.bg, color: item.color }}>
                                        {item.icon}
                                    </div>
                                    <h3 className="why-title">{item.title}</h3>
                                    <p className="why-desc">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </ScrollReveal>


            {/* ── Footer ───────────────────────────────────────────── */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-grid">
                        <div className="footer-brand">
                            <div className="footer-logo">
                                <div className="logo-icon">S</div>
                                <span className="logo-text">Sri Amman <span>Paints</span></span>
                            </div>
                            <p className="footer-tagline">
                                Bringing color and life to every space since 2020. Your trusted partner for premium paints.
                            </p>
                        </div>
                        <div className="footer-col">
                            <h4 className="footer-col-title">Shop</h4>
                            <ul className="footer-links">
                                <li><Link to="/">Interior Paints</Link></li>
                                <li><Link to="/">Exterior Paints</Link></li>
                                <li><Link to="/">Primers</Link></li>
                                <li><Link to="/">Enamels</Link></li>
                            </ul>
                        </div>
                        <div className="footer-col">
                            <h4 className="footer-col-title">Company</h4>
                            <ul className="footer-links">
                                <li><a href="#">About Us</a></li>
                                <li><a href="#">Color Consultation</a></li>
                                <li><a href="#">Careers</a></li>
                                <li><a href="#">Contact</a></li>
                            </ul>
                        </div>
                        <div className="footer-col">
                            <h4 className="footer-col-title">Support</h4>
                            <ul className="footer-links">
                                <li><Link to="/orders">Track Order</Link></li>
                                <li><a href="#">Returns</a></li>
                                <li><a href="#">FAQ</a></li>
                                <li><a href="#">Privacy Policy</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>© 2026 Sri Amman Paints. All rights reserved.</p>
                        <div className="footer-bottom-links">
                            <a href="#">Terms</a>
                            <a href="#">Privacy</a>
                            <a href="#">Cookies</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
