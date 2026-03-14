"""
Apply Buy This Color feature to PaintPreview.jsx cleanly.
Handles both LF and CRLF line endings.
"""

with open('src/pages/PaintPreview.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Normalize to LF for matching, will preserve original endings on write
NL = '\r\n' if '\r\n' in content else '\n'
c = content.replace('\r\n', '\n')  # normalize to LF for matching

# ── 1. Add new imports ──────────────────────────────────────────────────────
old_imports = (
    "import React, { useState, useRef, useEffect, useCallback } from 'react';\n"
    "import { FiUpload, FiDownload, FiRefreshCw, FiHeart, FiClock, FiSliders, FiZoomIn, FiZoomOut, FiEye, FiCheck, FiX } from 'react-icons/fi';\n"
    "import toast from 'react-hot-toast';\n"
    "import './PaintPreview.css';"
)
new_imports = (
    "import React, { useState, useRef, useEffect, useCallback } from 'react';\n"
    "import { FiUpload, FiDownload, FiRefreshCw, FiHeart, FiClock, FiSliders, FiZoomIn, FiZoomOut, FiEye, FiCheck, FiX, FiShoppingCart } from 'react-icons/fi';\n"
    "import { collection, getDocs, query, orderBy } from 'firebase/firestore';\n"
    "import { db } from '../firebase';\n"
    "import { useCart } from '../context/CartContext';\n"
    "import toast from 'react-hot-toast';\n"
    "import './PaintPreview.css';"
)
assert old_imports in c, "Import block not found!"
c = c.replace(old_imports, new_imports, 1)
print("1. Imports updated")

# ── 2. Add useCart after animFrameRef ──────────────────────────────────────
old_refs = "    const animFrameRef = useRef(null);\n\n    const [originalImage"
new_refs = "    const animFrameRef = useRef(null);\n    const { addToCart } = useCart();\n\n    const [originalImage"
assert old_refs in c, "Refs block not found!"
c = c.replace(old_refs, new_refs, 1)
print("2. useCart added")

# ── 3. Add products state ─────────────────────────────────────────────────
old_tab = "    const [activeTab, setActiveTab] = useState('brand'); // 'brand' | 'custom'\n\n    // Load default wall"
new_tab = (
    "    const [activeTab, setActiveTab] = useState('brand'); // 'brand' | 'custom'\n"
    "\n"
    "    // Products for Buy This Color panel\n"
    "    const [products, setProducts] = useState([]);\n"
    "    const [productsLoading, setProductsLoading] = useState(true);\n"
    "    const [selectedSizes, setSelectedSizes] = useState({});\n"
    "    const [addedId, setAddedId] = useState(null);\n"
    "\n"
    "    // Load default wall"
)
assert old_tab in c, "activeTab block not found!"
c = c.replace(old_tab, new_tab, 1)
print("3. Products state added")

# ── 4. Add fetch useEffect ─────────────────────────────────────────────────
old_wall = "        loadImageFromSrc(src);\n    }, []);\n\n    const loadImageFromSrc"
new_wall = (
    "        loadImageFromSrc(src);\n"
    "    }, []);\n"
    "\n"
    "    // Fetch products from Firestore\n"
    "    useEffect(() => {\n"
    "        const fetchProducts = async () => {\n"
    "            try {\n"
    "                const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));\n"
    "                const snap = await getDocs(q);\n"
    "                const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));\n"
    "                setProducts(all.filter(p => p.stock > 0));\n"
    "            } catch (err) {\n"
    "                console.error('Products fetch error:', err);\n"
    "            } finally {\n"
    "                setProductsLoading(false);\n"
    "            }\n"
    "        };\n"
    "        fetchProducts();\n"
    "    }, []);\n"
    "\n"
    "    const loadImageFromSrc"
)
assert old_wall in c, "Wall useEffect not found!"
c = c.replace(old_wall, new_wall, 1)
print("4. Fetch useEffect added")

# ── 5. Add handleBuyAddToCart ──────────────────────────────────────────────
old_return = "        applyColor(hex);\n    };\n\n    return ("
new_return = (
    "        applyColor(hex);\n"
    "    };\n"
    "\n"
    "    const handleBuyAddToCart = (product) => {\n"
    "        const size = selectedSizes[product.id] || (product.sizes?.length > 0 ? product.sizes[0] : null);\n"
    "        addToCart(product, size);\n"
    "        setAddedId(product.id);\n"
    "        setTimeout(() => setAddedId(null), 1500);\n"
    "    };\n"
    "\n"
    "    return ("
)
assert old_return in c, "return block not found!"
c = c.replace(old_return, new_return, 1)
print("5. handleBuyAddToCart added")

# ── 6. Add Buy This Color panel before closing divs ───────────────────────
# Find the closing sequence: </div> for pp-quick-colors then 4 closing </div>s
old_end = (
    "                        </div>\n"
    "                    </div>\n"
    "                </div>\n"
    "            </div>\n"
    "        </div>\n"
    "    );\n"
    "};\n"
    "\n"
    "export default PaintPreview;"
)

buy_panel_jsx = (
    "                        </div>\n"
    "\n"
    "                        {/* ── Buy This Color Panel ─────────────────── */}\n"
    "                        {colorApplied && (\n"
    "                            <div className=\"pp-buy-panel\">\n"
    "                                <div className=\"pp-buy-header\">\n"
    "                                    <div className=\"pp-buy-color-chip\" style={{ background: selectedColor }} />\n"
    "                                    <div>\n"
    "                                        <h3 className=\"pp-buy-title\">Buy This Color</h3>\n"
    "                                        <p className=\"pp-buy-subtitle\">\n"
    "                                            {BRAND_COLORS.find(c => c.hex === selectedColor)?.name || selectedColor.toUpperCase()} \u2014 Available in stock\n"
    "                                        </p>\n"
    "                                    </div>\n"
    "                                </div>\n"
    "                                {productsLoading ? (\n"
    "                                    <div className=\"pp-buy-loading\">\n"
    "                                        <div className=\"pp-spinner\" />\n"
    "                                        <span>Loading products...</span>\n"
    "                                    </div>\n"
    "                                ) : products.length === 0 ? (\n"
    "                                    <div className=\"pp-buy-empty\">\n"
    "                                        <p>\U0001f614 No products in stock. <a href=\"tel:+919999999999\">Call us</a> to order.</p>\n"
    "                                    </div>\n"
    "                                ) : (\n"
    "                                    <div className=\"pp-buy-grid\">\n"
    "                                        {products.map(product => {\n"
    "                                            const currentSize = selectedSizes[product.id] || (product.sizes?.length > 0 ? product.sizes[0] : null);\n"
    "                                            const currentStock = currentSize ? currentSize.stock : product.stock;\n"
    "                                            const displayPrice = currentSize ? currentSize.price : product.price;\n"
    "                                            const isAdded = addedId === product.id;\n"
    "                                            return (\n"
    "                                                <div key={product.id} className=\"pp-buy-card\">\n"
    "                                                    <div className=\"pp-buy-img-wrap\">\n"
    "                                                        {product.imageUrl\n"
    "                                                            ? <img src={product.imageUrl} alt={product.name} className=\"pp-buy-img\" />\n"
    "                                                            : <div className=\"pp-buy-img-placeholder\">\U0001f3a8</div>\n"
    "                                                        }\n"
    "                                                    </div>\n"
    "                                                    <div className=\"pp-buy-info\">\n"
    "                                                        <span className=\"pp-buy-category\">{product.category}</span>\n"
    "                                                        <p className=\"pp-buy-name\">{product.name}</p>\n"
    "                                                        <p className=\"pp-buy-price\">\u20b9{displayPrice?.toLocaleString()}</p>\n"
    "                                                        {product.sizes?.length > 0 && (\n"
    "                                                            <div className=\"pp-buy-size-pills\">\n"
    "                                                                {product.sizes.map(s => {\n"
    "                                                                    const sel = selectedSizes[product.id] || product.sizes[0];\n"
    "                                                                    return (\n"
    "                                                                        <button\n"
    "                                                                            key={s.label}\n"
    "                                                                            className={`pp-buy-size-pill ${sel.label === s.label ? 'active' : ''}`}\n"
    "                                                                            onClick={() => setSelectedSizes(prev => ({ ...prev, [product.id]: s }))}\n"
    "                                                                        >\n"
    "                                                                            {s.label}\n"
    "                                                                        </button>\n"
    "                                                                    );\n"
    "                                                                })}\n"
    "                                                            </div>\n"
    "                                                        )}\n"
    "                                                        <div className=\"pp-buy-footer\">\n"
    "                                                            <span className={`pp-buy-stock ${currentStock === 0 ? 'out' : currentStock <= 5 ? 'low' : 'in'}`}>\n"
    "                                                                {currentStock === 0 ? 'Out of Stock' : currentStock <= 5 ? `Only ${currentStock} left` : 'In Stock'}\n"
    "                                                            </span>\n"
    "                                                            <button\n"
    "                                                                className={`pp-buy-add-btn ${isAdded ? 'added' : ''}`}\n"
    "                                                                onClick={() => handleBuyAddToCart(product)}\n"
    "                                                                disabled={currentStock === 0}\n"
    "                                                            >\n"
    "                                                                {isAdded\n"
    "                                                                    ? <><FiCheck size={13} /> Added!</>\n"
    "                                                                    : <><FiShoppingCart size={13} /> Add</>}\n"
    "                                                            </button>\n"
    "                                                        </div>\n"
    "                                                    </div>\n"
    "                                                </div>\n"
    "                                            );\n"
    "                                        })}\n"
    "                                    </div>\n"
    "                                )}\n"
    "                            </div>\n"
    "                        )}\n"
    "                    </div>\n"
    "                </div>\n"
    "            </div>\n"
    "        </div>\n"
    "    );\n"
    "};\n"
    "\n"
    "export default PaintPreview;"
)

assert old_end in c, "Closing end block not found!"
c = c.replace(old_end, buy_panel_jsx, 1)
print("6. Buy This Color panel added")

# ── 7. Restore original line endings and write ─────────────────────────────
if NL == '\r\n':
    c = c.replace('\n', '\r\n')

with open('src/pages/PaintPreview.jsx', 'w', encoding='utf-8') as f:
    f.write(c)

# ── 8. Verify ──────────────────────────────────────────────────────────────
import re
opens = len(re.findall(r'<div[\s>]', c))  # <div followed by space or >
closes = c.count('</div>')
self_closing = len(re.findall(r'<div\s[^>]*/\s*>', c))
print(f"div opens={opens}, closes={closes}, self-closing={self_closing}")
print(f"Real opens (opens - self_closing) = {opens - self_closing}, should equal closes={closes}")
if (opens - self_closing) == closes:
    print("SUCCESS: JSX divs are balanced!")
else:
    print(f"WARNING: imbalance of {(opens - self_closing) - closes}")

lines = c.count('\n')
print(f"Total lines: {lines}")
