with open('src/pages/PaintPreview.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the cutoff: </div> closing pp-quick-colors at indent=24
cutoff = None
for i in range(560, min(700, len(lines))):
    stripped = lines[i].strip()
    indent = len(lines[i]) - len(lines[i].lstrip())
    if stripped == '</div>' and indent == 24:
        context = ''.join(lines[max(0,i-5):i])
        if 'pp-quick' in context or 'selectAndApply' in context:
            cutoff = i + 1  # keep up to and including this line
            break

if cutoff is None:
    print("ERROR: Could not find cutoff")
    exit(1)

print(f"Cutoff at line {cutoff}")

# Keep only the first `cutoff` lines
keep = lines[:cutoff]

# Count divs in kept portion
kept_content = ''.join(keep)
k_opens = kept_content.count('<div')
k_closes = kept_content.count('</div')
print(f"Kept portion: div opens={k_opens}, closes={k_closes}, diff={k_opens - k_closes}")

# The kept portion should have some unclosed divs
# (pp-preview-panel, pp-layout, container, pp-page = 4 unclosed)
# If there are more, the kept content still contains broken data

tail = (
    "\r\n"
    "                        {/* Buy This Color Panel */}\r\n"
    "                        {colorApplied && (\r\n"
    "                            <div className=\"pp-buy-panel\">\r\n"
    "                                <div className=\"pp-buy-header\">\r\n"
    "                                    <div className=\"pp-buy-color-chip\" style={{ background: selectedColor }} />\r\n"
    "                                    <div>\r\n"
    "                                        <h3 className=\"pp-buy-title\">Buy This Color</h3>\r\n"
    "                                        <p className=\"pp-buy-subtitle\">\r\n"
    "                                            {BRAND_COLORS.find(c => c.hex === selectedColor)?.name || selectedColor.toUpperCase()} \u2014 Available products in stock\r\n"
    "                                        </p>\r\n"
    "                                    </div>\r\n"
    "                                </div>\r\n"
    "\r\n"
    "                                {productsLoading ? (\r\n"
    "                                    <div className=\"pp-buy-loading\">\r\n"
    "                                        <div className=\"pp-spinner\" />\r\n"
    "                                        <span>Loading products...</span>\r\n"
    "                                    </div>\r\n"
    "                                ) : products.length === 0 ? (\r\n"
    "                                    <div className=\"pp-buy-empty\">\r\n"
    "                                        <p>\U0001f614 No products in stock. <a href=\"tel:+919999999999\">Call us</a> to order.</p>\r\n"
    "                                    </div>\r\n"
    "                                ) : (\r\n"
    "                                    <div className=\"pp-buy-grid\">\r\n"
    "                                        {products.map(product => {\r\n"
    "                                            const currentSize = selectedSizes[product.id] || (product.sizes?.length > 0 ? product.sizes[0] : null);\r\n"
    "                                            const currentStock = currentSize ? currentSize.stock : product.stock;\r\n"
    "                                            const displayPrice = currentSize ? currentSize.price : product.price;\r\n"
    "                                            const isAdded = addedId === product.id;\r\n"
    "                                            return (\r\n"
    "                                                <div key={product.id} className=\"pp-buy-card\">\r\n"
    "                                                    <div className=\"pp-buy-img-wrap\">\r\n"
    "                                                        {product.imageUrl\r\n"
    "                                                            ? <img src={product.imageUrl} alt={product.name} className=\"pp-buy-img\" />\r\n"
    "                                                            : <div className=\"pp-buy-img-placeholder\">\U0001f3a8</div>\r\n"
    "                                                        }\r\n"
    "                                                    </div>\r\n"
    "                                                    <div className=\"pp-buy-info\">\r\n"
    "                                                        <span className=\"pp-buy-category\">{product.category}</span>\r\n"
    "                                                        <p className=\"pp-buy-name\">{product.name}</p>\r\n"
    "                                                        <p className=\"pp-buy-price\">\u20b9{displayPrice?.toLocaleString()}</p>\r\n"
    "                                                        {product.sizes?.length > 0 && (\r\n"
    "                                                            <div className=\"pp-buy-size-pills\">\r\n"
    "                                                                {product.sizes.map(s => {\r\n"
    "                                                                    const sel = selectedSizes[product.id] || product.sizes[0];\r\n"
    "                                                                    return (\r\n"
    "                                                                        <button\r\n"
    "                                                                            key={s.label}\r\n"
    "                                                                            className={`pp-buy-size-pill ${sel.label === s.label ? 'active' : ''}`}\r\n"
    "                                                                            onClick={() => setSelectedSizes(prev => ({ ...prev, [product.id]: s }))}\r\n"
    "                                                                        >\r\n"
    "                                                                            {s.label}\r\n"
    "                                                                        </button>\r\n"
    "                                                                    );\r\n"
    "                                                                })}\r\n"
    "                                                            </div>\r\n"
    "                                                        )}\r\n"
    "                                                        <div className=\"pp-buy-footer\">\r\n"
    "                                                            <span className={`pp-buy-stock ${currentStock === 0 ? 'out' : currentStock <= 5 ? 'low' : 'in'}`}>\r\n"
    "                                                                {currentStock === 0 ? 'Out of Stock' : currentStock <= 5 ? `Only ${currentStock} left` : 'In Stock'}\r\n"
    "                                                            </span>\r\n"
    "                                                            <button\r\n"
    "                                                                className={`pp-buy-add-btn ${isAdded ? 'added' : ''}`}\r\n"
    "                                                                onClick={() => handleBuyAddToCart(product)}\r\n"
    "                                                                disabled={currentStock === 0}\r\n"
    "                                                            >\r\n"
    "                                                                {isAdded\r\n"
    "                                                                    ? <><FiCheck size={13} /> Added!</>\r\n"
    "                                                                    : <><FiShoppingCart size={13} /> Add</>}\r\n"
    "                                                            </button>\r\n"
    "                                                        </div>\r\n"
    "                                                    </div>\r\n"
    "                                                </div>\r\n"
    "                                            );\r\n"
    "                                        })}\r\n"
    "                                    </div>\r\n"
    "                                )}\r\n"
    "                            </div>\r\n"
    "                        )}\r\n"
    "                    </div>\r\n"
    "                </div>\r\n"
    "            </div>\r\n"
    "        </div>\r\n"
    "    );\r\n"
    "};\r\n"
    "\r\n"
    "export default PaintPreview;\r\n"
)

with open('src/pages/PaintPreview.jsx', 'w', encoding='utf-8') as f:
    f.writelines(keep)
    f.write(tail)

# Final verification
with open('src/pages/PaintPreview.jsx', 'r', encoding='utf-8') as f:
    content = f.read()
opens = content.count('<div')
closes = content.count('</div')
total_lines = content.count('\n')
print(f"FINAL: div opens={opens}, closes={closes}, diff={opens-closes}, lines={total_lines}")
if opens == closes:
    print("SUCCESS: divs are balanced!")
else:
    print(f"WARNING: still {opens-closes} unbalanced divs")
