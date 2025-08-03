/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const searchInput = document.getElementById("searchInput");
const productsContainer = document.getElementById("productsContainer");
const selectedProductsList = document.getElementById("selectedProductsList");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const generateRoutineBtn = document.getElementById("generateRoutine");
const userInput = document.getElementById("userInput");

/* Detect RTL language and apply direction */
function detectAndApplyRTL() {
  const rtlLanguages = [
    'ar', 'ara', 'he', 'heb', 'fa', 'per', 'ur', 'urd', 'ps', 'pus', 'sd', 'snd', 
    'ckb', 'kur', 'prs', 'fa-AF', 'ar-SA', 'ar-IQ', 'ar-EG', 'he-IL', 'fa-IR', 
    'ur-PK', 'ps-AF', 'sd-PK', 'ckb-IQ', 'ckb-IR', 'prs-AF'
  ];
  const userLanguage = navigator.language || navigator.userLanguage;
  
  // Check if the language code starts with an RTL language code
  const isRTLLanguage = rtlLanguages.some(lang => 
    userLanguage.startsWith(lang.split('-')[0]) || 
    userLanguage === lang
  );
  
  if (isRTLLanguage) {
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', userLanguage);
  }
}

/* Call the RTL detection on page load */
document.addEventListener('DOMContentLoaded', detectAndApplyRTL);

/* Show initial placeholder until user selects a category or searches */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category or search for products
  </div>
`;

/* Array to store selected products */
let selectedProducts = [];

/* Load selected products from localStorage on page load */
function loadSelectedProductsFromStorage() {
  const savedProducts = localStorage.getItem("selectedProducts");
  if (savedProducts) {
    try {
      selectedProducts = JSON.parse(savedProducts);
    } catch (e) {
      console.error("Error parsing selected products from localStorage:", e);
      selectedProducts = [];
    }
  }
}

/* Save selected products to localStorage */
function saveSelectedProductsToStorage() {
  try {
    localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
  } catch (e) {
    console.error("Error saving selected products to localStorage:", e);
  }
}

/* Array to store conversation history */
let conversationHistory = [
  {
    role: "system",
    content:
      "You are a beauty expert helping customers with skincare, haircare, makeup, fragrance, and other beauty-related topics. Only answer questions related to these topics.",
  },
];

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product) => `
    <div class="product-card" data-product-id="${product.id}">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
        <button class="toggle-description" aria-label="Toggle description">Show Description</button>
        <div class="product-description">
          ${product.description}
        </div>
      </div>
    </div>
  `
    )
    .join("");

  // Add event listeners to product cards
  addProductCardEventListeners();

  // Add event listeners for toggle buttons
  addToggleEventListeners();
}

/* Add event listeners to product cards */
function addProductCardEventListeners() {
  const productCards = document.querySelectorAll(".product-card");
  productCards.forEach((card) => {
    card.addEventListener("click", handleProductCardClick);
  });
}

/* Handle product card click */
function handleProductCardClick(e) {
  const card = e.currentTarget;
  const productId = parseInt(card.getAttribute("data-product-id"));

  // Toggle selection state
  if (isProductSelected(productId)) {
    // Remove product from selection
    selectedProducts = selectedProducts.filter((id) => id !== productId);
    card.classList.remove("selected");
  } else {
    // Add product to selection
    selectedProducts.push(productId);
    card.classList.add("selected");
  }

  // Update selected products list
  updateSelectedProductsList();
}

/* Check if a product is already selected */
function isProductSelected(productId) {
  return selectedProducts.includes(productId);
}

/* Update the selected products list */
async function updateSelectedProductsList() {
  const products = await loadProducts();
  const selectedProductsData = products.filter((product) =>
    selectedProducts.includes(product.id)
  );

  selectedProductsList.innerHTML = selectedProductsData
    .map(
      (product) => `
      <div class="selected-product-item" data-product-id="${product.id}">
        <img src="${product.image}" alt="${product.name}">
        <div class="selected-product-info">
          <h4>${product.name}</h4>
          <p>${product.brand}</p>
        </div>
        <button class="remove-product-btn" data-product-id="${product.id}">✕</button>
      </div>
    `
    )
    .join("");

  // Add event listeners to remove buttons
  addRemoveButtonEventListeners();

  // Save selected products to localStorage
  saveSelectedProductsToStorage();
}

/* Add event listeners to remove buttons */
function addRemoveButtonEventListeners() {
  const removeButtons = document.querySelectorAll(".remove-product-btn");
  removeButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      const productId = parseInt(button.getAttribute("data-product-id"));
      removeProduct(productId);
    });
  });
}

/* Remove a product from selection */
function removeProduct(productId) {
  // Remove from selected products array
  selectedProducts = selectedProducts.filter((id) => id !== productId);

  // Update product card visual state
  const productCard = document.querySelector(
    `.product-card[data-product-id="${productId}"]`
  );
  if (productCard) {
    productCard.classList.remove("selected");
  }

  // Update selected products list
  updateSelectedProductsList();
}

/* Clear all selected products */
function clearAllProducts() {
  // Clear the selected products array
  selectedProducts = [];

  // Remove selected class from all product cards
  const productCards = document.querySelectorAll(".product-card");
  productCards.forEach((card) => {
    card.classList.remove("selected");
  });

  // Clear the selected products list display
  selectedProductsList.innerHTML = "";

  // Save empty array to localStorage
  saveSelectedProductsToStorage();
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  await filterAndDisplayProducts();
});

/* Filter and display products when search input changes */
searchInput.addEventListener("input", async (e) => {
  await filterAndDisplayProducts();
});

/* Filter and display products based on category and search term */
async function filterAndDisplayProducts() {
  const products = await loadProducts();
  const selectedCategory = categoryFilter.value;
  const searchTerm = searchInput.value.toLowerCase();

  /* Filter products by category and search term */
  const filteredProducts = products.filter((product) => {
    // Check if product matches category filter (if selected)
    const categoryMatch = selectedCategory === "" || product.category === selectedCategory;
    
    // Check if product matches search term (if entered)
    const searchMatch = 
      searchTerm === "" || 
      product.name.toLowerCase().includes(searchTerm) || 
      product.brand.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm);
    
    return categoryMatch && searchMatch;
  });

  displayProducts(filteredProducts);

  // Re-apply selection states to product cards
  applySelectionStates();
}

/* Filter and display products when category changes */
// categoryFilter.addEventListener("change", async (e) => {
//   const products = await loadProducts();
//   const selectedCategory = e.target.value;

//   /* filter() creates a new array containing only products 
//      where the category matches what the user selected */
//   const filteredProducts = products.filter(
//     (product) => product.category === selectedCategory
//   );

//   displayProducts(filteredProducts);

//   // Re-apply selection states to product cards
//   applySelectionStates();
// });

/* Apply selection states to product cards */
function applySelectionStates() {
  const productCards = document.querySelectorAll(".product-card");
  productCards.forEach((card) => {
    const productId = parseInt(card.getAttribute("data-product-id"));
    if (isProductSelected(productId)) {
      card.classList.add("selected");
    } else {
      card.classList.remove("selected");
    }
  });
}

/* Generate personalized routine using Cloudflare Worker */
async function generatePersonalizedRoutine() {
  // Show loading message
  chatWindow.innerHTML =
    '<div class="loading">Generating your personalized routine...</div>';

  try {
    // Get full product data for selected products
    const products = await loadProducts();
    const selectedProductsData = products.filter((product) =>
      selectedProducts.includes(product.id)
    );

    // If no products are selected, show a message
    if (selectedProductsData.length === 0) {
      chatWindow.innerHTML =
        "<div>Please select at least one product to generate a routine.</div>";
      return;
    }

    // Prepare the data to send to the worker
    const productsForAI = selectedProductsData.map((product) => ({
      name: product.name,
      brand: product.brand,
      category: product.category,
      description: product.description,
    }));

    // Create the prompt for the AI
    const prompt = `Create a personalized beauty routine using the following products:
    
${productsForAI
  .map(
    (product) =>
      `- ${product.name} by ${product.brand} (${product.category}): ${product.description}`
  )
  .join("\n")}

Please provide a step-by-step routine that incorporates all of these products in the correct order, with explanations for why each product is used at that step. Make the routine easy to follow and tailored to maximize the benefits of these specific products.`;

    // Call the Cloudflare Worker
    const response = await fetch(
      "https://08-prj-loreal-chatbot.kline2bm.workers.dev/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            conversationHistory[0], // Use the consistent system message
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      }
    );

    // Check if the response is ok
    if (!response.ok) {
      throw new Error(
        `Cloudflare Worker error: ${response.status} ${response.statusText}`
      );
    }

    // Parse the response
    const data = await response.json();
    const routine =
      data.response ||
      data.choices?.[0]?.message?.content ||
      "I couldn't generate a routine at this time. Please try again.";

    // Ensure routine is a string
    const routineText =
      typeof routine === "string" ? routine : JSON.stringify(routine);

    // Add the routine to conversation history
    conversationHistory = [
      conversationHistory[0], // Keep the system message
      {
        role: "assistant",
        content: `Here is your personalized routine:\n\n${routineText}`,
      },
    ];

    // Display the routine in the chat window
    const parsedRoutine = parseMarkdown(routineText);
    chatWindow.innerHTML = `<div class="routine-response"><h3>Your Personalized Routine:</h3><div class="message assistant-message"><strong>Beauty Expert:</strong> ${parsedRoutine}</div></div>`;

    // Scroll to the bottom of the chat window
    chatWindow.scrollTop = chatWindow.scrollHeight;
  } catch (error) {
    console.error("Error generating routine:", error);
    chatWindow.innerHTML = `<div class="error">Sorry, I encountered an error while generating your routine: ${error.message}</div>`;
  }
}

/* Add event listener to the Generate Routine button */
generateRoutineBtn.addEventListener("click", generatePersonalizedRoutine);

/* Chat form submission handler */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get user input
  const userMessage = userInput.value.trim();

  // If input is empty, do nothing
  if (!userMessage) return;

  // Add user message to conversation history
  conversationHistory.push({
    role: "user",
    content: userMessage,
  });

  // Display user message in chat window
  displayMessage(userMessage, "user");

  // Clear input field
  userInput.value = "";

  // Show loading indicator
  const loadingElement = document.createElement("div");
  loadingElement.className = "loading";
  loadingElement.textContent = "Thinking...";
  chatWindow.appendChild(loadingElement);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  try {
    // Call Cloudflare Worker with conversation history
    const response = await fetch(
      "https://08-prj-loreal-chatbot.kline2bm.workers.dev/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: conversationHistory,
        }),
      }
    );

    // Remove loading indicator
    chatWindow.removeChild(loadingElement);

    // Check if the response is ok
    if (!response.ok) {
      throw new Error(
        `Cloudflare Worker error: ${response.status} ${response.statusText}`
      );
    }

    // Parse the response
    const data = await response.json();
    const aiResponse =
      data.response ||
      data.choices?.[0]?.message?.content ||
      "I couldn't generate a response at this time. Please try again.";

    // Ensure aiResponse is a string
    const responseText =
      typeof aiResponse === "string" ? aiResponse : JSON.stringify(aiResponse);

    // Add AI response to conversation history
    conversationHistory.push({
      role: "assistant",
      content: responseText,
    });

    // Display AI response in chat window
    displayMessage(responseText, "assistant");
  } catch (error) {
    console.error("Error in chat:", error);

    // Remove loading indicator
    chatWindow.removeChild(loadingElement);

    // Display error message
    const errorElement = document.createElement("div");
    errorElement.className = "error";
    errorElement.textContent = `Sorry, I encountered an error: ${error.message}`;
    chatWindow.appendChild(errorElement);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
});

/* Function to parse basic markdown */
function parseMarkdown(text) {
  // Convert markdown bold (**text** or __text__) to HTML bold
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/__(.*?)__/g, '<strong>$1</strong>');
  
  // Convert markdown italic (*text* or _text_) to HTML italic
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  text = text.replace(/_(.*?)_/g, '<em>$1</em>');
  
  // Convert markdown links [text](url) to HTML links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
  
  // Convert markdown inline code `code` to HTML code
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Convert markdown headers (# Header) to HTML headers
  text = text.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  text = text.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  text = text.replace(/^# (.*$)/gm, '<h1>$1</h1>');
  
  // Convert markdown unordered lists (* item or - item) to HTML lists
  text = text.replace(/^\* (.*$)/gm, '<li>$1</li>');
  text = text.replace(/^- (.*$)/gm, '<li>$1</li>');
  
  // Wrap consecutive list items with <ul>
  text = text.replace(/(<li>.*<\/li>\s*)+/g, '<ul>$&</ul>');
  
  // Convert line breaks to <br> tags
  text = text.replace(/\n/g, '<br>');
  
  return text;
}

/* Function to display messages in the chat window */
function displayMessage(message, sender) {
  const messageElement = document.createElement("div");
  messageElement.classList.add("message", `${sender}-message`);

  if (sender === "user") {
    messageElement.innerHTML = `<strong>You:</strong> ${message}`;
  } else {
    // Parse markdown for assistant messages
    const parsedMessage = parseMarkdown(message);
    messageElement.innerHTML = `<strong>Beauty Expert:</strong> ${parsedMessage}`;
  }

  chatWindow.appendChild(messageElement);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Initialize the page with saved products */
document.addEventListener("DOMContentLoaded", async function () {
  // Load selected products from localStorage
  loadSelectedProductsFromStorage();

  // If there are saved products, update the display
  if (selectedProducts.length > 0) {
    // We need to wait for products to be loaded to update the display
    await updateSelectedProductsList();

    // Apply selection states to product cards
    applySelectionStates();
  }
  
  // Initialize search functionality
  await filterAndDisplayProducts();
});

/* Add event listeners for toggle buttons */
function addToggleEventListeners() {
  const toggleButtons = document.querySelectorAll(".toggle-description");
  toggleButtons.forEach((button) => {
    button.addEventListener("click", function (e) {
      e.stopPropagation();
      const productInfo = this.parentElement;
      const description = productInfo.querySelector(".product-description");

      if (description.classList.contains("expanded")) {
        description.classList.remove("expanded");
        this.textContent = "Show Description";
        this.setAttribute("aria-label", "Show description");
      } else {
        description.classList.add("expanded");
        this.textContent = "Hide Description";
        this.setAttribute("aria-label", "Hide description");
      }
    });
  });
}

// Add event listener for clear all button
document
  .getElementById("clearAllProducts")
  .addEventListener("click", clearAllProducts);
