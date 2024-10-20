// header.js
async function initializeHeader() {
    const isLoggedIn = localStorage.getItem('loggedIn') === 'true';
    const username = localStorage.getItem('username');
    let cartCount = 0;

    if (isLoggedIn && username) {
        try {
            const response = await fetch(`http://localhost:3000/cart/${username}`);
            if (response.ok) {
                const cartItems = await response.json();
                cartCount = Array.isArray(cartItems) ? cartItems.length : 0;
            }
        } catch (error) {
            console.error('Error loading cart count:', error);
        }
    }
    
    const nav = document.getElementById('nav-list');
    
    const commonLinks = `
        <li><a href="index.html">Home</a></li>
        <li><a href="about.html">About</a></li>
        <li><a href="features.html">Features</a></li>
        <li><a href="food-listings.html">Food Listings</a></li>
        <li><a href="contact.html"> Contact Us</a></li>
    `;
    
    const authLinks = isLoggedIn
        ? `
            <li><a href="cart.html">Cart <span id="cart-count" ${cartCount === 0 ? 'style="display:none"' : ''}>${cartCount}</span></a></li>
            <li><a href="#" id="logout">Logout (${username})</a></li>
          `
        : `
            <li><a href="login.html">Login</a></li>
            <li><a href="register.html">Register</a></li>
          `;
    
    nav.innerHTML = commonLinks + authLinks;
    
    if (isLoggedIn) {
        document.getElementById('logout').addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('loggedIn');
            localStorage.removeItem('username');
            window.location.href = 'login.html';
        });
    }
}

// Function to update cart count
function updateCartCount(count) {
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = count;
        cartCountElement.style.display = count === 0 ? 'none' : 'inline';
    }
}

// Export updateCartCount for use in other files
window.updateCartCount = updateCartCount;

document.addEventListener('DOMContentLoaded', initializeHeader);