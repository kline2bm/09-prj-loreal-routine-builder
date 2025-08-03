/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const selectedProductsList = document.getElementById("selectedProductsList");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const generateRoutineBtn = document.getElementById("generateRoutine");
const userInput = document.getElementById("userInput");

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Array to store selected products */
let selectedProducts = [];

/* Load selected products from localStorage on page load */
function loadSelectedProductsFromStorage() {
  const savedProducts = localStorage.getItem('selectedProducts');
  if (savedProducts) {
    try {
      selectedProducts = JSON.parse(savedProducts);
    } catch (e) {
      console.error('Error parsing selected products from localStorage:', e);
      selectedProducts = [];
    }
  }
}

/* Save selected products to localStorage */
function saveSelectedProductsToStorage() {
  try {
    localStorage.setItem('selectedProducts', JSON.stringify(selectedProducts));
  } catch (e) {
    console.error('Error saving selected products to localStorage:', e);
  }
}

/* Array to store conversation history */
let conversationHistory = [
  {
    role: "system",
    content: "You are a beauty expert helping customers with skincare, haircare, makeup, fragrance, and other beauty-related topics. Only answer questions related to these topics."
  }
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
}

/* Add event listeners to product cards */
function addProductCardEventListeners() {
  const productCards = document.querySelectorAll('.product-card');
  productCards.forEach(card => {
    card.addEventListener('click', handleProductCardClick);
  });
}

/* Handle product card click */
function handleProductCardClick(e) {
  const card = e.currentTarget;
  const productId = parseInt(card.getAttribute('data-product-id'));
  
  // Toggle selection state
  if (isProductSelected(productId)) {
    // Remove product from selection
    selectedProducts = selectedProducts.filter(id => id !== productId);
    card.classList.remove('selected');
  } else {
    // Add product to selection
    selectedProducts.push(productId);
    card.classList.add('selected');
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
  const selectedProductsData = products.filter(product => 
    selectedProducts.includes(product.id)
  );
  
  selectedProductsList.innerHTML = selectedProductsData
    .map(product => `
      <div class="selected-product-item" data-product-id="${product.id}">
        <img src="${product.image}" alt="${product.name}">
        <div class="selected-product-info">
          <h4>${product.name}</h4>
          <p>${product.brand}</p>
        </div>
        <button class="remove-product-btn" data-product-id="${product.id}">✕</button>
      </div>
    `)
    .join("");
  
  // Add event listeners to remove buttons
  addRemoveButtonEventListeners();
  
  // Save selected products to localStorage
  saveSelectedProductsToStorage();
}

/* Add event listeners to remove buttons */
function addRemoveButtonEventListeners() {
  const removeButtons = document.querySelectorAll('.remove-product-btn');
  removeButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const productId = parseInt(button.getAttribute('data-product-id'));
      removeProduct(productId);
    });
  });
}

/* Remove a product from selection */
function removeProduct(productId) {
  // Remove from selected products array
  selectedProducts = selectedProducts.filter(id => id !== productId);
  
  // Update product card visual state
  const productCard = document.querySelector(`.product-card[data-product-id="${productId}"]`);
  if (productCard) {
    productCard.classList.remove('selected');
  }
  
  // Update selected products list
  updateSelectedProductsList();
}

/* Clear all selected products */
function clearAllProducts() {
  // Clear the selected products array
  selectedProducts = [];
  
  // Remove selected class from all product cards
  const productCards = document.querySelectorAll('.product-card');
  productCards.forEach(card => {
    card.classList.remove('selected');
  });
  
  // Clear the selected products list display
  selectedProductsList.innerHTML = '';
  
  // Save empty array to localStorage
  saveSelectedProductsToStorage();
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  /* filter() creates a new array containing only products 
     where the category matches what the user selected */
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
  
  // Re-apply selection states to product cards
  applySelectionStates();
});

/* Apply selection states to product cards */
function applySelectionStates() {
  const productCards = document.querySelectorAll('.product-card');
  productCards.forEach(card => {
    const productId = parseInt(card.getAttribute('data-product-id'));
    if (isProductSelected(productId)) {
      card.classList.add('selected');
    } else {
      card.classList.remove('selected');
    }
  });
}

/* Generate personalized routine using OpenAI API */
async function generatePersonalizedRoutine() {
  // Show loading message
  chatWindow.innerHTML = '<div class="loading">Generating your personalized routine...</div>';
  
  try {
    // Get full product data for selected products
    const products = await loadProducts();
    const selectedProductsData = products.filter(product => 
      selectedProducts.includes(product.id)
    );
    
    // If no products are selected, show a message
    if (selectedProductsData.length === 0) {
      chatWindow.innerHTML = '<div>Please select at least one product to generate a routine.</div>';
      return;
    }
    
    // Prepare the data to send to OpenAI
    const productsForAI = selectedProductsData.map(product => ({
      name: product.name,
      brand: product.brand,
      category: product.category,
      description: product.description
    }));
    
    // Create the prompt for OpenAI
    const prompt = `Create a personalized beauty routine using the following products:
    
${productsForAI.map(product => 
  `- ${product.name} by ${product.brand} (${product.category}): ${product.description}`
).join('\n')}

Please provide a step-by-step routine that incorporates all of these products in the correct order, with explanations for why each product is used at that step. Make the routine easy to follow and tailored to maximize the benefits of these specific products.`;
    
    // Call the OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${window.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          conversationHistory[0], // Use the consistent system message
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7
      })
    });
    
    // Check if the response is ok
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }
    
    // Parse the response
    const data = await response.json();
    const routine = data.choices[0].message.content;
    
    // Add the routine to conversation history
    conversationHistory = [
      conversationHistory[0], // Keep the system message
      {
        role: "assistant",
        content: `Here is your personalized routine:\n\n${routine}`
      }
    ];
    
    // Display the routine in the chat window
    chatWindow.innerHTML = `<div class="routine-response"><h3>Your Personalized Routine:</h3><p>${routine.replace(/\n/g, '</p><p>')}</p></div>`;
    
    // Scroll to the bottom of the chat window
    chatWindow.scrollTop = chatWindow.scrollHeight;
  } catch (error) {
    console.error('Error generating routine:', error);
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
    content: userMessage
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
    // Call OpenAI API with conversation history
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${window.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: conversationHistory,
        temperature: 0.7
      })
    });
    
    // Remove loading indicator
    chatWindow.removeChild(loadingElement);
    
    // Check if the response is ok
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }
    
    // Parse the response
    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // Add AI response to conversation history
    conversationHistory.push({
      role: "assistant",
      content: aiResponse
    });
    
    // Display AI response in chat window
    displayMessage(aiResponse, "assistant");
  } catch (error) {
    console.error('Error in chat:', error);
    
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

/* Function to display messages in the chat window */
function displayMessage(message, sender) {
  const messageElement = document.createElement("div");
  messageElement.classList.add("message", `${sender}-message`);
  
  if (sender === "user") {
    messageElement.innerHTML = `<strong>You:</strong> ${message}`;
  } else {
    messageElement.innerHTML = `<strong>Beauty Expert:</strong> ${message}`;
  }
  
  chatWindow.appendChild(messageElement);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Initialize the page with saved products */
document.addEventListener('DOMContentLoaded', async function() {
  // Load selected products from localStorage
  loadSelectedProductsFromStorage();
  
  // If there are saved products, update the display
  if (selectedProducts.length > 0) {
    // We need to wait for products to be loaded to update the display
    await updateSelectedProductsList();
    
    // Apply selection states to product cards
    applySelectionStates();
  }
});

// Add event listener for clear all button
document.getElementById('clearAllProducts').addEventListener('click', clearAllProducts);
