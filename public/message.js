// DOM elements
const loadingSection = document.getElementById('loadingSection');
const notFoundSection = document.getElementById('notFoundSection');
const passwordSection = document.getElementById('passwordSection');
const messageSection = document.getElementById('messageSection');
const passwordForm = document.getElementById('passwordForm');
const passwordInput = document.getElementById('password');
const verifyBtn = document.getElementById('verifyBtn');
const passwordError = document.getElementById('passwordError');
const messageText = document.getElementById('messageText');

// Extract path from URL
function getPathFromUrl() {
  const urlPath = window.location.pathname;
  // Expected format: /message/{path}
  const match = urlPath.match(/^\/message\/([^/]+)$/);
  return match ? match[1] : null;
}

// Show error message
function showError(element, message) {
  element.textContent = message;
  element.classList.add('show');
}

// Hide error message
function hideError(element) {
  element.textContent = '';
  element.classList.remove('show');
}

// Show specific section and hide others
function showSection(section) {
  loadingSection.style.display = 'none';
  notFoundSection.style.display = 'none';
  passwordSection.style.display = 'none';
  messageSection.style.display = 'none';
  
  section.style.display = 'block';
}

// Load message metadata on page load
async function loadMessage() {
  const path = getPathFromUrl();
  
  if (!path) {
    showSection(notFoundSection);
    return;
  }

  try {
    // Call GET /api/messages/:path
    const response = await fetch(`/api/messages/${path}`);
    
    if (response.status === 404) {
      // Handle 404 error with "message not found" display
      showSection(notFoundSection);
      return;
    }

    if (!response.ok) {
      throw new Error('Failed to load message');
    }

    // Message exists, show password input form
    showSection(passwordSection);
  } catch (error) {
    console.error('Error loading message:', error);
    showSection(notFoundSection);
  }
}

// Handle password form submission
passwordForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError(passwordError);

  const path = getPathFromUrl();
  const password = passwordInput.value;

  if (!password) {
    showError(passwordError, 'Please enter a password');
    return;
  }

  // Disable verify button during request
  verifyBtn.disabled = true;
  verifyBtn.textContent = 'Verifying...';

  try {
    // Call POST /api/messages/:path/verify
    const response = await fetch(`/api/messages/${path}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });

    const data = await response.json();

    if (response.status === 401) {
      // Incorrect password
      showError(passwordError, data.error?.message || 'Incorrect password. Please try again.');
      passwordInput.value = '';
      passwordInput.focus();
      return;
    }

    if (response.status === 404) {
      // Message not found
      showSection(notFoundSection);
      return;
    }

    if (!response.ok) {
      throw new Error('Failed to verify password');
    }

    // Success - display message content
    displayMessage(data.content);
  } catch (error) {
    console.error('Error verifying password:', error);
    showError(passwordError, 'An error occurred. Please try again.');
  } finally {
    // Re-enable verify button
    verifyBtn.disabled = false;
    verifyBtn.textContent = 'View Message';
  }
});

// Display message content
function displayMessage(content) {
  messageText.textContent = content;
  showSection(messageSection);
}

// Initialize page
loadMessage();
