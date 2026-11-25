const API_URL = "https://dummyjson.com/products?limit=100";
const STORAGE_KEY = "favoriteProductIds";

// DOM references
const searchInput = document.querySelector("#search-input");
const categorySelect = document.querySelector("#category-select");
const favoritesOnly = document.querySelector("#favorites-only");
const favCount = document.querySelector("#fav-count");
const resultCount = document.querySelector("#result-count");
const productGrid = document.querySelector("#product-grid");
const loadingEl = document.querySelector("#loading");
const errorEl = document.querySelector("#error");
const errorMessage = document.querySelector("#error-message");
const emptyEl = document.querySelector("#empty");
const retryBtn = document.querySelector("#retry-btn");

// Application data
let products = [];
let favoriteIds = loadFavorites();

// ---------- Local Storage ----------
function loadFavorites() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (err) {
    return [];
  }
}

function saveFavorites() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteIds));
}

// ---------- UI state helpers ----------
function showLoading() {
  loadingEl.classList.remove("hidden");
  errorEl.classList.add("hidden");
  emptyEl.classList.add("hidden");
  productGrid.innerHTML = "";
  resultCount.textContent = "";
}

function showError(message) {
  loadingEl.classList.add("hidden");
  emptyEl.classList.add("hidden");
  errorEl.classList.remove("hidden");
  errorMessage.textContent = message;
}

// ---------- API ----------
async function fetchProducts() {
  showLoading();
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error("Server responded with status " + response.status);
    }
    const data = await response.json();
    products = data.products;
    loadingEl.classList.add("hidden");
    populateCategories();
    render();
  } catch (err) {
    showError("Failed to load products. " + err.message);
  }
}

// ---------- Rendering ----------
function populateCategories() {
  const categories = [...new Set(products.map((p) => p.category))].sort();
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
}

function getFilteredProducts() {
  const query = searchInput.value.trim().toLowerCase();
  const category = categorySelect.value;

  return products
    .filter((p) => p.title.toLowerCase().includes(query))
    .filter((p) => category === "all" || p.category === category)
    .filter((p) => !favoritesOnly.checked || favoriteIds.includes(p.id));
}

function createCard(product) {
  const card = document.createElement("article");
  card.className = "card";

  const img = document.createElement("img");
  img.src = product.thumbnail;
  img.alt = product.title;

  const body = document.createElement("div");
  body.className = "card-body";

  const title = document.createElement("h3");
  title.className = "card-title";
  title.textContent = product.title;

  const category = document.createElement("span");
  category.className = "card-category";
  category.textContent = product.category;

  const price = document.createElement("span");
  price.className = "card-price";
  price.textContent = "$" + product.price.toFixed(2);

  const rating = document.createElement("span");
  rating.className = "card-rating";
  rating.textContent = "Rating: " + product.rating;

  const isFav = favoriteIds.includes(product.id);
  const favBtn = document.createElement("button");
  favBtn.className = "fav-btn" + (isFav ? " active" : "");
  favBtn.dataset.id = product.id;
  favBtn.textContent = isFav ? "Remove from favorites" : "Add to favorites";

  body.append(title, category, price, rating, favBtn);
  card.append(img, body);
  return card;
}

function render() {
  const filtered = getFilteredProducts();

  productGrid.innerHTML = "";
  favCount.textContent = favoriteIds.length;

  if (filtered.length === 0) {
    emptyEl.classList.remove("hidden");
    resultCount.textContent = "";
    return;
  }

  emptyEl.classList.add("hidden");
  resultCount.textContent = "Showing " + filtered.length + " product(s)";
  filtered.forEach((product) => {
    productGrid.appendChild(createCard(product));
  });
}

// ---------- Event handling ----------
searchInput.addEventListener("input", render);
categorySelect.addEventListener("change", render);
favoritesOnly.addEventListener("change", render);
retryBtn.addEventListener("click", fetchProducts);

productGrid.addEventListener("click", (event) => {
  const btn = event.target.closest(".fav-btn");
  if (!btn) return;

  const id = Number(btn.dataset.id);
  const product = products.find((p) => p.id === id);
  if (!product) return;

  if (favoriteIds.includes(id)) {
    favoriteIds = favoriteIds.filter((favId) => favId !== id);
  } else {
    favoriteIds.push(id);
  }
  saveFavorites();
  render();
});

// ---------- Start ----------
fetchProducts();
