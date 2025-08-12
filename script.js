if (window.Telegram && window.Telegram.WebApp) {
    Telegram.WebApp.ready();
    Telegram.WebApp.expand(); // Расширяет приложение на весь экран
    Telegram.WebApp.disableVerticalSwipes(); // Отключает закрытие свайпом вверх
}
document.addEventListener("DOMContentLoaded", () => {
  const productList = document.getElementById("product-list");
  const favoritesList = document.getElementById("favorites-list");
  const favoritesView = document.getElementById("favorites-view");
  const mainView = document.getElementById("main-view");
  const cartView = document.getElementById("cart-view");
  const favoritesCount = document.getElementById("favorites-count");
  const scrollToTopBtn = document.getElementById("scrollToTopBtn");
  const navStore = document.getElementById("nav-store");
  const navFavorites = document.getElementById("nav-favorites");
  const navCart = document.getElementById("nav-cart");
  const cartCountEl = document.getElementById("cart-count");
  const searchWrapper = document.querySelector(".top-panel");
  const header = document.querySelector(".header");
  const searchInput = document.getElementById("search-input");
  const notFoundMessage = document.getElementById("not-found-message");
  const suggestedProducts = document.getElementById("suggested-products");
  const cartItemsEl = document.getElementById("cart-items");

  let cartCount = 0;
  let favorites = [];
  let allProducts = [];
  let cart = [];
  let catalogScrollY = 0;
  let savedScrollPosition = 0;
  let lastScrollPosition = 0;
  let catalogState = {
  products: [],
  scrollY: 0,
  search: "",
  sort: null
};


  function renderCount() {
  cartCount = cart.reduce((sum, item) => sum + item.count, 0);
  cartCountEl.textContent = cartCount;
  cartCountEl.style.display = cartCount === 0 ? "none" : "block";

  favoritesCount.textContent = `${favorites.length} товар${favorites.length === 1 ? "" : favorites.length < 5 ? "а" : "ов"}`;
  const cartCountText = document.getElementById("cart-count-display");
  if (cartCountText) {
    cartCountText.textContent = `${cartCount} товар${cartCount === 1 ? "" : cartCount < 5 ? "а" : "ов"}`;
  }

  const total = cart.reduce((sum, item) => sum + item.product.price * item.count, 0);
  const totalPriceEl = document.getElementById("total-price");
  const cartSummaryEl = document.getElementById("cart-summary");

  if (totalPriceEl) {
    totalPriceEl.textContent = `${total.toLocaleString("ru-RU")} ₽`;
  }

  if (cartSummaryEl) {
    cartSummaryEl.style.display = cart.length > 0 ? "block" : "none";
  }
}

  function createCard(product, isFavorite = false) {
    const card = document.createElement("div");
    card.className = "product-card";
    card.dataset.id = product.id;

    const imageWrapper = document.createElement("div");
    imageWrapper.className = "image-wrapper";

    const image = document.createElement("img");
    image.className = "product-img";
    image.src = "images/" + product.images[0];
    imageWrapper.appendChild(image);

    const heart = document.createElement("img");
    heart.src = isFavorite ? "icons/сердце-заполнено.svg" : "icons/сердце.svg";
    heart.className = "heart-icon";
    heart.addEventListener("click", (e) => {
  e.stopPropagation(); // ⛔️ не даём карточке открыться
      const exists = favorites.find(f => f.id === product.id);
      if (exists) {
        favorites = favorites.filter(f => f.id !== product.id);
        heart.src = "icons/сердце.svg";
        if (favoritesView.style.display !== "none") renderFavorites();
      } else {
        favorites.push(product);
        heart.src = "icons/сердце-заполнено.svg";
      }
      renderCount();
    });

    imageWrapper.appendChild(heart);

  
    card.appendChild(imageWrapper);

    const name = document.createElement("h3");
    name.textContent = product.title;
    card.appendChild(name);

    const priceRow = document.createElement("div");
    priceRow.className = "price-row";

    const price = document.createElement("div");
    price.className = "price";
    price.textContent = `${product.price} ₽`;
    priceRow.appendChild(price);

    if (product.old_price) {
      const oldPrice = document.createElement("div");
      oldPrice.className = "old-price";
      oldPrice.textContent = `${product.old_price} ₽`;
      priceRow.appendChild(oldPrice);
    }

    card.appendChild(priceRow);

    const cartControls = document.createElement("div");
    cartControls.className = "cart-controls";
    const minusBtn = document.createElement("button");
    minusBtn.textContent = "-";
    minusBtn.className = "cart-btn counter-btn";
    const countDisplay = document.createElement("span");
    countDisplay.textContent = "1";
    countDisplay.className = "cart-count-display qty-display";
    const plusBtn = document.createElement("button");
    plusBtn.textContent = "+";
    plusBtn.className = "cart-btn counter-btn";
    cartControls.append(minusBtn, countDisplay, plusBtn);
    cartControls.style.display = "none";

    const button = document.createElement("button");
    button.className = "add-to-cart";
    button.textContent = "В КОРЗИНУ";

    let count = 1;

    const existing = cart.find(p => p.product.id === product.id);
    if (existing) {
      button.style.display = "none";
      cartControls.style.display = "flex";
      count = existing.count;
      countDisplay.textContent = count;
    }

   button.addEventListener("click", (e) => {
  e.stopPropagation();

  // Если открыт фильтр или меню — закрываем и выходим
  if (filterPopup.classList.contains("open") || menuPanel.classList.contains("open")) {
    filterPopup.classList.remove("open");
    menuPanel.classList.remove("open");
    return;
  }

  // Добавление в корзину
  button.style.display = "none";
  cartControls.style.display = "flex";
  count = 1;
  countDisplay.textContent = count;
  cart.push({ product, count });
  renderCount();
});

   plusBtn.addEventListener("click", (e) => {
  e.stopPropagation();
      count++;
      countDisplay.textContent = count;
      const item = cart.find(p => p.product.id === product.id);
      if (item) item.count = count;
      renderCount();
    });

    minusBtn.addEventListener("click", (e) => {
  e.stopPropagation();
      if (count > 1) {
        count--;
        countDisplay.textContent = count;
        const item = cart.find(p => p.product.id === product.id);
        if (item) item.count = count;
      } else {
        cart = cart.filter(p => p.product.id !== product.id);
        count = 1;
        cartControls.style.display = "none";
        button.style.display = "flex";
      }
      renderCount();
    });

    card.append(button, cartControls);
    return card;
  }

 function renderProducts(products) {
  productList.innerHTML = "";
  products.forEach(product => {
    const isFavorite = favorites.some(f => f.id === product.id);
    const card = createCard(product, isFavorite);
    productList.appendChild(card);
  });
   refreshScrollBtnVisibility(); // ← добавь сюда
}

  function renderFavorites() {
    favoritesList.innerHTML = "";

    if (favorites.length === 0) {
      favoritesList.innerHTML = '<p class="not-found-text empty-favorites">Пока нет избранных товаров</p>';
      return;
    }

    favorites.forEach(product => {
      const card = createCard(product, true);
      favoritesList.appendChild(card);
    });
    refreshScrollBtnVisibility();
  }

  function renderCart() {
  cartItemsEl.innerHTML = "";

  const total = cart.reduce((sum, item) => sum + item.product.price * item.count, 0);
  document.getElementById("total-price").textContent = `${total.toLocaleString("ru-RU")} ₽`;
  document.getElementById("cart-summary").style.display = cart.length > 0 ? "block" : "none";

  if (cart.length === 0) {
    cartItemsEl.innerHTML = '<p class="not-found-text empty-cart">Корзина пуста</p>';
    return;
  }

  cart.forEach(({ product, count }) => {
    const item = document.createElement("div");
    item.className = "cart-item";

    // 📦 Обёртка для изображения + крестика
    const imgWrapper = document.createElement("div");
    imgWrapper.style.position = "relative";

    const img = document.createElement("img");
    img.src = "images/" + product.images[0];
    imgWrapper.appendChild(img);
    item.appendChild(imgWrapper);

    const info = document.createElement("div");
    info.className = "cart-info";

    const title = document.createElement("h3");
    title.textContent = product.title;
    info.appendChild(title);

    const priceRow = document.createElement("div");
    priceRow.className = "price-row";

    const price = document.createElement("div");
    price.className = "price";
    price.textContent = `${product.price} ₽`;

    const controls = document.createElement("div");
    controls.className = "cart-controls-cart";

    const minus = document.createElement("button");
    minus.textContent = "-";

    const qty = document.createElement("span");
    qty.className = "qty";
    qty.textContent = count;

    const plus = document.createElement("button");
    plus.textContent = "+";

    controls.append(minus, qty, plus);
    priceRow.append(price, controls);

    info.append(title, priceRow);
    item.appendChild(info);
    cartItemsEl.appendChild(item);

    // 🔁 Обработка кнопок
    minus.addEventListener("click", () => {
      const item = cart.find(p => p.product.id === product.id);
      if (!item) return;

      if (item.count > 1) {
        item.count--;
      } else {
        cart = cart.filter(p => p.product.id !== product.id);
      }
      renderCart();
      renderProducts(allProducts);
      renderCount();
    });

    plus.addEventListener("click", () => {
      const item = cart.find(p => p.product.id === product.id);
      if (item) item.count++;
      renderCart();
      renderProducts(allProducts);
      renderCount();
    });
  });
}

  function handleSearch() {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) {
      notFoundMessage.style.display = "none";
      renderProducts(allProducts);
      return;
    }
    const partialMatches = allProducts.filter(p => p.title.toLowerCase().includes(query));
    if (partialMatches.length > 0) {
      notFoundMessage.style.display = "none";
      renderProducts(partialMatches);
    } else {
      productList.innerHTML = "";
      notFoundMessage.style.display = "block";
      suggestedProducts.innerHTML = "";
    }
  }

  fetch("products.json")
  .then(res => res.json())
  .then(products => {
    allProducts = products;
    renderProducts(products);
    refreshScrollBtnVisibility(); // ✅ добавь сюда
  });

  scrollToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  navStore.addEventListener("click", () => {
  // показываем только нужный блок
  mainView.style.display = "block";
  document.getElementById("checkout-view").style.display = "none";
  favoritesView.style.display = "none";
  cartView.style.display = "none";
  notFoundMessage.style.display = "none";

  navStore.classList.add("active");
  navFavorites.classList.remove("active");
  navCart.classList.remove("active");

  searchWrapper.style.display = "flex";
  header.style.display = "block";

  if (catalogState.products.length > 0) {
  renderProducts(catalogState.products);
  searchInput.value = catalogState.search;

  // применяем сортировку снова
  if (catalogState.sort) {
    document.querySelectorAll(".filter-option").forEach(opt => {
      opt.classList.remove("selected");
      if (opt.dataset.sort === catalogState.sort) {
        opt.classList.add("selected");
      }
    });
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.scrollTo(0, catalogState.scrollY || 0);
    });
  });
} else {
  renderProducts(allProducts);
  window.scrollTo(0, 0);
}

refreshScrollBtnVisibility();
});

  navFavorites.addEventListener("click", () => {
  lastScrollPosition = window.scrollY;
  mainView.style.display = "none";
  favoritesView.style.display = "block";
  document.getElementById("checkout-view").style.display = "none";
  cartView.style.display = "none";
  notFoundMessage.style.display = "none";

  navFavorites.classList.add("active");
  navStore.classList.remove("active");
  navCart.classList.remove("active");

  searchWrapper.style.display = "none";
  header.style.display = "none";

  savedScrollPosition = window.scrollY;

catalogState = {
  products: Array.from(productList.children).map(card => {
    const id = card.dataset.id;
    return allProducts.find(p => p.id == id);
  }),
  scrollY: window.scrollY,
  search: searchInput.value.trim(),
  sort: document.querySelector(".filter-option.selected")?.dataset.sort || null
};

  renderFavorites();
  refreshScrollBtnVisibility();
});


  navCart.addEventListener("click", () => {
    lastScrollPosition = window.scrollY;
    mainView.style.display = "none";
    favoritesView.style.display = "none";
    cartView.style.display = "block";
    document.getElementById("checkout-view").style.display = "none";
    notFoundMessage.style.display = "none";
    navCart.classList.add("active");
    navStore.classList.remove("active");
    navFavorites.classList.remove("active");
    searchWrapper.style.display = "none";
    header.style.display = "none";
    scrollToTopBtn.style.display = "none";
    savedScrollPosition = window.scrollY;
    catalogState = {
  products: Array.from(productList.children).map(card => {
    const id = card.dataset.id;
    return allProducts.find(p => p.id == id);
  }),
  scrollY: window.scrollY,
  search: searchInput.value.trim(),
  sort: document.querySelector(".filter-option.selected")?.dataset.sort || null
};
    renderCart();
    refreshScrollBtnVisibility();
  });
  
  searchInput.addEventListener("input", handleSearch);

  const searchIcon = document.getElementById("search-icon");
const backIcon = document.getElementById("back-icon");

searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim();

  if (query.length > 0) {
    searchIcon.style.display = "none";
    backIcon.style.display = "inline";
    const filtered = allProducts.filter(p => p.title.toLowerCase().includes(query.toLowerCase()));
    renderProducts(filtered);
  } else {
    searchIcon.style.display = "inline";
    backIcon.style.display = "none";
      notFoundMessage.style.display = "none";
    const suggestedContainer = document.getElementById("suggested-products-container");
    if (suggestedContainer) suggestedContainer.style.display = "none";
    suggestedProducts.innerHTML = "";

    renderProducts(allProducts);
  }
});

backIcon.addEventListener("click", () => {
  searchInput.value = "";
  searchInput.blur();
  searchIcon.style.display = "inline";
  backIcon.style.display = "none";
  notFoundMessage.style.display = "none";
  const suggestedContainer = document.getElementById("suggested-products-container");
  if (suggestedContainer) suggestedContainer.style.display = "none";
  suggestedProducts.innerHTML = "";

  renderProducts(allProducts);
});

  // === ФИЛЬТРЫ ===
  const filterIcon = document.querySelector(".filter-icon");
  const filterPopup = document.getElementById("filter-popup");
  const filterOptions = document.querySelectorAll(".filter-option");
  const resetBtn = document.getElementById("reset-filters");

  filterIcon.addEventListener("click", () => {
    lastScrollPosition = window.scrollY;
    filterPopup.classList.add("open");
  });

  filterOptions.forEach(option => {
    savedScrollPosition = window.scrollY;
    option.addEventListener("click", () => {
      filterOptions.forEach(opt => opt.classList.remove("selected"));
      option.classList.add("selected");
      const sortType = option.dataset.sort;
      applySort(sortType);
      filterPopup.classList.remove("open");
      savedScrollPosition = window.scrollY;
    });
  });

  function applySort(type) {
    let sorted = [...allProducts];
    if (type === "price-asc") sorted.sort((a, b) => a.price - b.price);
    else if (type === "price-desc") sorted.sort((a, b) => b.price - a.price);
    else if (type === "newest") sorted.sort((a, b) => b.id - a.id);
    renderProducts(sorted);
  }

  resetBtn.addEventListener("click", () => {
    filterOptions.forEach(opt => opt.classList.remove("selected"));
    renderProducts(allProducts);
    savedScrollPosition = window.scrollY;
    filterPopup.classList.remove("open");
    catalogState = {
  products: [],
  scrollY: 0,
  search: "",
  sort: null
};
  });

  // Закрытие фильтра при клике вне контента
  filterPopup.addEventListener("click", (e) => {
    const isInside = e.target.closest(".filter-content");
    if (!isInside) {
      filterPopup.classList.remove("open");
    }
  });

  const openMenuBtn = document.querySelector(".menu-button");
const closeMenuBtn = document.getElementById("close-menu");
const menuPanel = document.getElementById("menu-panel");
const categoryOptions = document.querySelectorAll(".menu-option");

openMenuBtn.addEventListener("click", () => {
  lastScrollPosition = window.scrollY;
  menuPanel.classList.add("open");
});

closeMenuBtn.addEventListener("click", () => {
  menuPanel.classList.remove("open");
});

categoryOptions.forEach((option) => {
  option.addEventListener("click", () => {
    option.classList.toggle("open");

    const submenu = option.nextElementSibling;
    if (submenu && submenu.classList.contains("submenu")) {
      submenu.style.display = submenu.style.display === "block" ? "none" : "block";
    }
  });
  
  const backToMain = document.getElementById("back-to-main");
backToMain.addEventListener("click", () => {
  // сбрасываем сохранённое состояние каталога
  catalogState = {
    products: [],
    scrollY: 0,
    search: "",
    sort: null
  };

  renderProducts(allProducts);
  menuPanel.classList.remove("open");
});
});

let uniqueBrands = [];

function renderBrandList() {
  const brandListEl = document.getElementById("brand-list");
  brandListEl.innerHTML = "";

  uniqueBrands.forEach((brand) => {
    const brandItem = document.createElement("div");
    brandItem.className = "brand-item";
    brandItem.textContent = brand;
    brandItem.addEventListener("click", () => {
      const filtered = allProducts.filter(p => p.brand?.toLowerCase() === brand.toLowerCase());
      renderProducts(filtered);
      menuPanel.classList.remove("open");
    });
    brandListEl.appendChild(brandItem);
  });
}

fetch("products.json")
  .then((res) => res.json())
  .then((products) => {
    allProducts = products;

    // 🔹 Получаем уникальные бренды
    const brandsSet = new Set(products.map(p => p.brand).filter(Boolean));
    uniqueBrands = Array.from(brandsSet).sort();

    renderBrandList(); // отрисуем список брендов

    renderProducts(products);
  });

  const backToMain = document.getElementById("back-to-main");

document.querySelector(".checkout-btn").addEventListener("click", () => {
  document.getElementById("main-view").style.display = "none";
  document.getElementById("favorites-view").style.display = "none";
  document.getElementById("cart-view").style.display = "none";
  document.getElementById("checkout-view").style.display = "block";

  scrollToTopBtn.style.display = "none"; // ⬅️ ВСТАВЬ ЗДЕСЬ

  // расчет итоговой суммы
  const total = cart.reduce((sum, item) => sum + item.product.price * item.count, 0);
  const deliveryRadio = document.querySelector('input[name="delivery"]:checked');
  const deliveryCost = deliveryRadio?.value === "Москва" ? 500 : 0;

  document.getElementById("checkout-total").textContent = `${(total + deliveryCost).toLocaleString("ru-RU")} ₽`;
  document.getElementById("checkout-delivery").textContent = `${deliveryCost.toLocaleString("ru-RU")} ₽`;
});

// обновляем сумму при переключении способа доставки
document.querySelectorAll('input[name="delivery"]').forEach(radio => {
  radio.addEventListener("change", () => {
    const total = cart.reduce((sum, item) => sum + item.product.price * item.count, 0);
    const deliveryCost = radio.value === "Москва" ? 500 : 0;

    document.getElementById("checkout-total").textContent = `${(total + deliveryCost).toLocaleString("ru-RU")} ₽`;
    document.getElementById("checkout-delivery").textContent = `${deliveryCost.toLocaleString("ru-RU")} ₽`;
  });
});
// === Карточка товара ===
const productDetailView = document.getElementById('product-detail-view');
const productDetailImage = document.getElementById('product-detail-image');
const productDetailDots = document.getElementById('product-detail-dots');
const productDetailName = document.getElementById('product-detail-name');
const productDetailSizes = document.getElementById('product-detail-sizes');
const productDetailPrice = document.getElementById('product-detail-price');
const addToCartDetail = document.getElementById('add-to-cart-detail');
const selectedSizeLabel = document.getElementById('selected-size-label');
const backToCatalogBtn = document.getElementById('back-to-catalog');

let currentProduct = null;
let selectedSize = null;

let startX = 0;
let endX = 0;

document.addEventListener("touchstart", (e) => {
  startX = e.touches[0].clientX;
});

document.addEventListener("touchend", (e) => {
  endX = e.changedTouches[0].clientX;
  handleGlobalSwipe();
});

function handleGlobalSwipe() {
  const distance = endX - startX;
  if (distance > 50 && menuPanel.classList.contains("open")) {
    menuPanel.classList.remove("open");
  }
}

let startY = 0;
let endY = 0;

document.addEventListener("touchstart", (e) => {
  startY = e.touches[0].clientY;
});

document.addEventListener("touchend", (e) => {
  endY = e.changedTouches[0].clientY;
  handleSwipeDown();
});

function handleSwipeDown() {
  const distance = endY - startY;
  if (distance > 50 && filterPopup.classList.contains("open")) {
    filterPopup.classList.remove("open");
  }
}

function showProductDetail(product) {
  lastScrollPosition = window.scrollY;
  catalogState = {
  products: Array.from(productList.children).map(card => {
    const id = card.dataset.id;
    return allProducts.find(p => p.id == id);
  }),
  scrollY: window.scrollY,
  search: searchInput.value.trim(),
  sort: document.querySelector(".filter-option.selected")?.dataset.sort || null
};
  currentProduct = product;
  selectedSize = null;

  scrollToTopBtn.style.display = 'none';

  productDetailName.textContent = product.title;

  document.getElementById('main-view').style.display = 'none';
  document.getElementById('favorites-view').style.display = 'none';
  document.getElementById('cart-view').style.display = 'none';
  document.querySelector('.header').style.display = 'none';
  document.querySelector('.top-panel').style.display = 'none';
  document.querySelector('.bottom-nav').style.display = 'none';

  let currentIndex = 0;
productDetailImage.src = 'images/' + product.images[currentIndex];

productDetailDots.innerHTML = '';
product.images.forEach((_, i) => {
  const dot = document.createElement('div');
  dot.className = 'dot';
  if (i === currentIndex) dot.classList.add('active');
  productDetailDots.appendChild(dot);
});

function updateImage(newIndex) {
  if (newIndex === currentIndex) return;

  const image = document.getElementById("product-detail-image");

  // Просто меняем src, без анимаций
  image.src = "images/" + currentProduct.images[newIndex];

  currentIndex = newIndex;

  // Обновляем точки
  document.querySelectorAll('#product-detail-dots .dot').forEach((d, i) => {
    d.classList.toggle('active', i === currentIndex);
  });
}

// 👉 Свайпы
let startX = 0;
productDetailImage.addEventListener("touchstart", (e) => {
  startX = e.touches[0].clientX;
});

productDetailImage.addEventListener("touchend", (e) => {
  const endX = e.changedTouches[0].clientX;
  const deltaX = endX - startX;

  if (Math.abs(deltaX) > 30) {
    if (deltaX < 0 && currentIndex < currentProduct.images.length - 1) {
      updateImage(currentIndex + 1);
    } else if (deltaX > 0 && currentIndex > 0) {
      updateImage(currentIndex - 1);
    }
  }
});

  productDetailName.textContent = product.title;
  productDetailPrice.textContent = product.price + ' ₽';

  productDetailSizes.innerHTML = '';
  product.sizes.forEach(size => {
    const span = document.createElement('div');
    span.className = 'size-option';
    span.textContent = size;
    span.addEventListener('click', () => {
      selectedSize = size;
      selectedSizeLabel.textContent = size;
      document.querySelectorAll('.size-option').forEach(s => s.classList.remove('selected'));
      span.classList.add('selected');
    });
    productDetailSizes.appendChild(span);
  });

  selectedSizeLabel.textContent = '';
  productDetailView.style.display = 'block';
}

backToCatalogBtn.addEventListener('click', () => {
  productDetailView.style.display = 'none';
  document.getElementById('main-view').style.display = 'block';

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.scrollTo(0, lastScrollPosition);
    });
  });

  setTimeout(() => {
    window.scrollTo(0, lastScrollPosition);
  }, 100);

  document.querySelector('.header').style.display = '';
  document.querySelector('.top-panel').style.display = '';
  document.querySelector('.bottom-nav').style.display = '';
});
  document.getElementById("add-to-cart-detail").onclick = () => {
    if (!selectedSize) {
      alert("Пожалуйста, выберите размер");
      return;
    }

    const existingItem = cart.find(item => item.product.id === currentProduct.id && item.size === selectedSize);
    if (existingItem) {
      existingItem.count += 1;
    } else {
      cart.push({
        product: currentProduct,
        count: 1,
        size: selectedSize
      });
    }

    renderCount();
    alert("Товар добавлен в корзину!");
  };

document.addEventListener("click", (e) => {
  const isFilterOpen = filterPopup.classList.contains("open");
  const isMenuOpen = menuPanel.classList.contains("open");
  const isSearchActive = searchInput.value.trim() !== "";

  const addToCartBtn = e.target.closest(".add-to-cart");
  const card = e.target.closest(".product-card");

  // Если открыт фильтр или меню и клик по карточке — просто закрываем, ничего не открываем
  if ((isFilterOpen || isMenuOpen || isSearchActive) && card) {
  if (isFilterOpen) filterPopup.classList.remove("open");
  if (isMenuOpen) menuPanel.classList.remove("open");
  if (isSearchActive) {
    searchInput.value = "";
    searchInput.blur();
    searchIcon.style.display = "inline";
    backIcon.style.display = "none";
    renderProducts(allProducts);
  }
  return;
}

  // Клик по кнопке "в корзину" при открытых фильтрах/меню — закрываем окна
  if ((isFilterOpen || isMenuOpen) && addToCartBtn) {
    filterPopup.classList.remove("open");
    menuPanel.classList.remove("open");
    return;
  }

  // Клик вне фильтра
  if (isFilterOpen && !e.target.closest(".filter-content") && !e.target.closest(".filter-icon")) {
    filterPopup.classList.remove("open");
    return;
  }

  // Клик вне меню
  if (isMenuOpen && !e.target.closest("#menu-panel") && !e.target.closest(".menu-button")) {
    menuPanel.classList.remove("open");
    return;
  }

  // Клик по карточке (если нет открытых окон) — показываем товар
  if (card && !isFilterOpen && !isMenuOpen && !isSearchActive) {
    lastScrollPosition = window.scrollY;
    const id = card.dataset.id;
    const product = allProducts.find(p => p.id == id);
    if (product) showProductDetail(product);
  }
});

scrollToTopBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

function updateScrollToTopButton() {
  const scrollTop = window.scrollY;

  const mainVisible = mainView && getComputedStyle(mainView).display !== "none";
  const favoritesVisible = favoritesView && getComputedStyle(favoritesView).display !== "none";
  const favoritesEmpty = !favoritesView.querySelector(".product-card");

  const shouldShowMain = mainVisible && scrollTop > 150;
  const shouldShowFavorites = favoritesVisible && !favoritesEmpty && scrollTop > 150;

  scrollToTopBtn.style.display = (shouldShowMain || shouldShowFavorites) ? "block" : "none";
}


// обновляем при переключении между экранами
function refreshScrollBtnVisibility() {
  setTimeout(updateScrollToTopButton, 50); // ждём пока DOM отрисуется
}

window.addEventListener("load", () => {
  updateScrollToTopButton();
});
window.addEventListener("scroll", updateScrollToTopButton);
}); 
