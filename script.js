let products = [];
let selectedFilters = [];
let searchQuery = '';

async function loadProducts() {
    try {
        const response = await fetch('products.json');
        products = await response.json();
        console.log('Products loaded:', products); // Debug
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function getFeaturedProducts() {
    const cart = JSON.parse(sessionStorage.getItem('receiptCart') || localStorage.getItem('cart') || '[]');
    const lastAddedProductId = Number(localStorage.getItem('lastAddedProductId'));
    const cartCategories = [...new Set(cart.map(item => {
        const product = products.find(p => p.id === item.id);
        return product ? product.category : null;
    }).filter(cat => cat))];

    let featured = [];
    // Always include product with id 66
    const pinnedProduct = products.find(p => p.id === 66);
    if (pinnedProduct && pinnedProduct.id !== lastAddedProductId) {
        featured.push(pinnedProduct);
    }

    // Add up to 3 other products based on cart categories
    let otherProducts = [];
    cartCategories.forEach(category => {
        const categoryProducts = products.filter(p => p.category === category && p.id !== 66 && p.id !== lastAddedProductId);
        otherProducts.push(...categoryProducts);
    });

    otherProducts = [...new Set(otherProducts.map(p => p.id))].map(id => products.find(p => p.id === id));
    otherProducts = otherProducts.sort(() => Math.random() - 0.5).slice(0, 4 - featured.length);
    featured.push(...otherProducts);

    return featured;
}

function displayProducts(filteredProducts = products, gridId = 'productGrid') {
    const productGrid = document.getElementById(gridId);
    if (!productGrid) return;

    productGrid.innerHTML = '';
    filteredProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.classList.add('product-card');
        productCard.innerHTML = `
            <img src="${product.image}" alt="${product.name}" loading="lazy">
            <h3>${product.name}</h3>
            <p>$${product.price.toFixed(2)}</p>
            <button class="btn" onclick="addToCart(${product.id})">Add to Cart</button>
        `;
        productGrid.appendChild(productCard);
    });
}

function filterProducts() {
    const checkboxes = document.querySelectorAll('.filter-options input:checked');
    selectedFilters = Array.from(checkboxes).map(cb => cb.value);

    const selectedFiltersDiv = document.getElementById('selectedFilters');
    if (selectedFiltersDiv) {
        selectedFiltersDiv.innerHTML = '';
        selectedFilters.forEach(filter => {
            const tag = document.createElement('span');
            tag.classList.add('filter-tag');
            tag.innerHTML = `${filter} <span class="remove-tag" onclick="removeFilter('${filter}')">✕</span>`;
            selectedFiltersDiv.appendChild(tag);
        });
    }

    let filteredProducts = products;
    if (searchQuery) {
        filteredProducts = filteredProducts.filter(product =>
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    if (selectedFilters.length > 0) {
        filteredProducts = filteredProducts.filter(product => selectedFilters.includes(product.category));
    }

    const featuredSection = document.getElementById('featuredSection');
    const featuredGrid = document.getElementById('featuredGrid');
    if (featuredSection && featuredGrid) {
        let featuredProducts = getFeaturedProducts();
        if (selectedFilters.length > 0) {
            featuredProducts = featuredProducts.filter(product => selectedFilters.includes(product.category));
        }
        if (searchQuery) {
            featuredProducts = featuredProducts.filter(product =>
                product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.category.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        featuredSection.style.display = featuredProducts.length > 0 ? 'block' : 'none';
        displayProducts(featuredProducts, 'featuredGrid');
    }

    displayProducts(filteredProducts, 'productGrid');
}

function removeFilter(filter) {
    const checkbox = document.querySelector(`.filter-options input[value="${filter}"]`);
    if (checkbox) checkbox.checked = false;
    filterProducts();
}

function loadCart() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    if (!cartItems || !cartTotal) return;

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const cartItemsMap = {};

    cart.forEach(item => {
        if (cartItemsMap[item.id]) {
            cartItemsMap[item.id].quantity += 1;
        } else {
            cartItemsMap[item.id] = { id: item.id, quantity: 1 };
        }
    });

    cartItems.innerHTML = '';
    let total = 0;

    Object.values(cartItemsMap).forEach((item, index) => {
        const product = products.find(p => p.id === item.id);
        if (product) {
            const itemTotal = product.price * item.quantity;
            total += itemTotal;
            const cartItem = document.createElement('div');
            cartItem.classList.add('cart-item');
            cartItem.style.animationDelay = `${index * 0.1}s`;
            cartItem.innerHTML = `
                <div class="cart-item-left">
                    <img src="${product.image}" alt="${product.name}" loading="lazy">
                    <span>${product.name} ($${itemTotal.toFixed(2)})</span>
                </div>
                <div class="cart-item-right">
                    <div class="quantity-controls">
                        <button onclick="decreaseQuantity(${item.id})">-</button>
                        <span class="quantity-display">${item.quantity}</span>
                        <button onclick="increaseQuantity(${item.id})">+</button>
                    </div>
                    <button class="btn" onclick="removeFromCart(${item.id})">Remove</button>
                </div>
            `;
            cartItems.appendChild(cartItem);
        }
    });

    cartTotal.textContent = total.toFixed(2);
}

function increaseQuantity(productId) {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    cart.push({ id: productId });
    localStorage.setItem('cart', JSON.stringify(cart));
    localStorage.setItem('lastAddedProductId', productId);
    loadCart();
    if (window.location.pathname.includes('shop.html')) {
        filterProducts();
    }
}

function decreaseQuantity(productId) {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const index = cart.findIndex(item => item.id === productId);
    if (index !== -1) {
        cart.splice(index, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        if (cart.length === 0) {
            localStorage.removeItem('lastAddedProductId');
        }
        loadCart();
        if (window.location.pathname.includes('shop.html')) {
            filterProducts();
        }
    }
}

function addToCart(productId) {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    cart.push({ id: productId });
    localStorage.setItem('cart', JSON.stringify(cart));
    localStorage.setItem('lastAddedProductId', productId);
    const product = products.find(p => p.id === productId);
    if (product) {
        alert(`${product.name} added to cart!`);
    }
    if (window.location.pathname.includes('cart.html')) {
        loadCart();
    }
    if (window.location.pathname.includes('shop.html')) {
        filterProducts();
    }
}

function removeFromCart(productId) {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const filteredCart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(filteredCart));
    if (filteredCart.length === 0) {
        localStorage.removeItem('lastAddedProductId');
    }
    loadCart();
    if (window.location.pathname.includes('shop.html')) {
        filterProducts();
    }
}

function generateReceiptData() {
    const cart = JSON.parse(sessionStorage.getItem('receiptCart') || localStorage.getItem('cart') || '[]');
    console.log('Cart for receipt:', cart); // Debug
    const cartItemsMap = {};
    cart.forEach(item => {
        if (cartItemsMap[item.id]) {
            cartItemsMap[item.id].quantity += 1;
        } else {
            cartItemsMap[item.id] = { id: item.id, quantity: 1 };
        }
    });

    let subtotal = 0;
    const receiptItems = Object.values(cartItemsMap).map(item => {
        const product = products.find(p => p.id === item.id);
        if (product) {
            const total = (product.price * item.quantity).toFixed(2);
            subtotal += parseFloat(total);
            return {
                name: product.name,
                quantity: item.quantity,
                price: product.price.toFixed(2),
                total: total
            };
        }
        return null;
    }).filter(item => item);

    console.log('Receipt items:', receiptItems); // Debug
    const gst = (subtotal * 0.12).toFixed(2);
    const discount = (subtotal * 0.02).toFixed(2);
    const grandTotal = (subtotal + parseFloat(gst) - parseFloat(discount)).toFixed(2);

    return { receiptItems, subtotal: subtotal.toFixed(2), gst, discount, grandTotal };
}

function loadReceipt() {
    const receiptItems = document.getElementById('receiptItems');
    const subtotalEl = document.getElementById('subtotal');
    const gstEl = document.getElementById('gst');
    const discountEl = document.getElementById('discount');
    const grandTotalEl = document.getElementById('grandTotal');

    if (!receiptItems || !subtotalEl || !gstEl || !discountEl || !grandTotalEl) {
        console.error('Receipt elements not found'); // Debug
        return;
    }

    if (products.length === 0) {
        console.warn('Products not loaded yet, waiting...'); // Debug
        loadProducts().then(() => {
            const data = generateReceiptData();
            renderReceipt(data);
        });
    } else {
        const data = generateReceiptData();
        renderReceipt(data);
    }
}

function renderReceipt({ receiptItems, subtotal, gst, discount, grandTotal }) {
    const receiptItemsEl = document.getElementById('receiptItems');
    const subtotalEl = document.getElementById('subtotal');
    const gstEl = document.getElementById('gst');
    const discountEl = document.getElementById('discount');
    const grandTotalEl = document.getElementById('grandTotal');

    console.log('Rendering receipt with data:', { receiptItems, subtotal, gst, discount, grandTotal }); // Debug

    receiptItemsEl.innerHTML = '';
    receiptItems.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>$${item.price}</td>
            <td>$${item.total}</td>
        `;
        receiptItemsEl.appendChild(row);
    });

    subtotalEl.textContent = `$${subtotal}`;
    gstEl.textContent = `$${gst}`;
    discountEl.textContent = `$${discount}`;
    grandTotalEl.textContent = `$${grandTotal}`;
}

function downloadReceipt() {
    const { receiptItems, subtotal, gst, discount, grandTotal } = generateReceiptData();
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Title and company
    doc.setFontSize(20);
    doc.setTextColor(220, 38, 38); // #DC2626
    doc.text('Luxe Beauty', 105, 20, { align: 'center' });
    doc.setFontSize(16);
    doc.text('Purchase Receipt', 105, 30, { align: 'center' });

    // Table headers
    doc.setFontSize(12);
    doc.setTextColor(255, 247, 237); // #FFF7ED
    doc.setFillColor(236, 72, 153); // #EC4899
    doc.rect(20, 40, 170, 10, 'F');
    doc.text('Product', 25, 47);
    doc.text('Quantity', 110, 47, { align: 'right' });
    doc.text('Price', 140, 47, { align: 'right' });
    doc.text('Total', 170, 47, { align: 'right' });

    // Table rows
    doc.setTextColor(75, 85, 99); // #4B5563
    let y = 55;
    receiptItems.forEach(item => {
        doc.text(item.name, 25, y);
        doc.text(item.quantity.toString(), 110, y, { align: 'right' });
        doc.text(`$${item.price}`, 140, y, { align: 'right' });
        doc.text(`$${item.total}`, 170, y, { align: 'right' });
        y += 10;
    });

    // Totals
    y += 5;
    doc.text('Subtotal', 25, y);
    doc.text(`$${subtotal}`, 170, y, { align: 'right' });
    y += 10;
    doc.text('GST (12%)', 25, y);
    doc.text(`$${gst}`, 170, y, { align: 'right' });
    y += 10;
    doc.text('Discount (2%)', 25, y);
    doc.text(`$${discount}`, 170, y, { align: 'right' });
    y += 10;
    doc.text('Grand Total', 25, y);
    doc.text(`$${grandTotal}`, 170, y, { align: 'right' });

    // Footer
    y += 20;
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99); // #4B5563
    doc.text('Thank you for shopping with Luxe Beauty!', 105, y, { align: 'center' });
    doc.text('© 2025 Luxe Beauty', 105, y + 5, { align: 'center' });

    // Download
    doc.save('luxe-receipt.pdf');
}

function checkout() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    if (cart.length > 0) {
        sessionStorage.setItem('receiptCart', JSON.stringify(cart)); // Store cart for receipt
        console.log('Stored cart for receipt:', cart); // Debug
        window.open('receipt.html', '_blank');
        localStorage.removeItem('cart');
        localStorage.removeItem('lastAddedProductId');
        loadCart();
        if (window.location.pathname.includes('shop.html')) {
            filterProducts();
        }
        alert('Thank you for your purchase!');
    } else {
        alert('Your cart is empty!');
    }
}

function submitContact() {
    const contactForm = document.getElementById('contactForm');
    const thankYouMessage = document.getElementById('thankYouMessage');
    const nameInput = document.getElementById('nameInput');
    const emailInput = document.getElementById('emailInput');
    const messageInput = document.getElementById('messageInput');
    const nameError = document.getElementById('nameError');
    const emailError = document.getElementById('emailError');
    const messageError = document.getElementById('messageError');

    if (!contactForm || !thankYouMessage || !nameInput || !emailInput || !messageInput || !nameError || !emailError || !messageError) return;

    nameError.textContent = '';
    emailError.textContent = '';
    messageError.textContent = '';

    const nameRegex = /^[A-Za-z\s-]+$/;
    let isValid = true;

    if (!nameInput.value.trim()) {
        nameError.textContent = 'Please enter your name';
        isValid = false;
    } else if (!nameRegex.test(nameInput.value.trim()) || nameInput.value.trim().length < 3) {
        nameError.textContent = 'Please enter a valid name (letters, spaces, or hyphens only, at least 3 characters)';
        isValid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailInput.value.trim()) {
        emailError.textContent = 'Please enter your email';
        isValid = false;
    } else if (!emailRegex.test(emailInput.value.trim())) {
        emailError.textContent = 'Please enter a valid email address';
        isValid = false;
    }

    if (!messageInput.value.trim()) {
        messageError.textContent = 'Please enter a message';
        isValid = false;
    }

    if (isValid) {
        contactForm.style.display = 'none';
        thankYouMessage.style.display = 'flex';
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Page loaded:', window.location.pathname);
    await loadProducts();

    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.classList.toggle('active', link.href === window.location.href);
    });

    if (window.location.pathname.includes('shop.html')) {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                searchQuery = searchInput.value.trim();
                filterProducts();
            });
        }
        filterProducts();
    } else if (window.location.pathname.includes('cart.html')) {
        loadCart();
    } else if (window.location.pathname.includes('receipt.html')) {
        loadReceipt();
    }
});