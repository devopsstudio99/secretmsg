// DOM elements
const messageForm = document.getElementById('messageForm');
const contentTextarea = document.getElementById('content');
const passwordInput = document.getElementById('password');
const submitBtn = document.getElementById('submitBtn');
const charCount = document.getElementById('charCount');
const contentError = document.getElementById('contentError');
const passwordError = document.getElementById('passwordError');
const formError = document.getElementById('formError');
const resultSection = document.getElementById('resultSection');
const messageUrl = document.getElementById('messageUrl');
const qrCode = document.getElementById('qrCode');
const copyUrlBtn = document.getElementById('copyUrlBtn');
const downloadQrBtn = document.getElementById('downloadQrBtn');
const createAnotherBtn = document.getElementById('createAnotherBtn');

// Character counter
contentTextarea.addEventListener('input', () => {
  const length = contentTextarea.value.length;
  charCount.textContent = length;
  
  // Update color based on length
  if (length > 9500) {
    charCount.style.color = '#e74c3c';
  } else if (length > 8000) {
    charCount.style.color = '#f39c12';
  } else {
    charCount.style.color = '#888';
  }
});

// Client-side validation
function validateContent(content) {
  if (!content || content.trim().length === 0) {
    return 'Message content cannot be empty';
  }
  if (content.length > 10000) {
    return 'Message content cannot exceed 10000 characters';
  }
  return null;
}

function validatePassword(password) {
  if (!password || password.length === 0) {
    return 'Password cannot be empty';
  }
  if (password.length < 4) {
    return 'Password must be at least 4 characters';
  }
  if (password.length > 128) {
    return 'Password cannot exceed 128 characters';
  }
  return null;
}

function showError(element, message) {
  element.textContent = message;
  element.classList.add('show');
}

function hideError(element) {
  element.textContent = '';
  element.classList.remove('show');
}

function clearAllErrors() {
  hideError(contentError);
  hideError(passwordError);
  hideError(formError);
}

// Real-time validation
contentTextarea.addEventListener('blur', () => {
  const error = validateContent(contentTextarea.value);
  if (error) {
    showError(contentError, error);
  } else {
    hideError(contentError);
  }
});

passwordInput.addEventListener('blur', () => {
  const error = validatePassword(passwordInput.value);
  if (error) {
    showError(passwordError, error);
  } else {
    hideError(passwordError);
  }
});

// Form submission
messageForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAllErrors();

  const content = contentTextarea.value;
  const password = passwordInput.value;

  // Client-side validation
  const contentValidationError = validateContent(content);
  const passwordValidationError = validatePassword(password);

  if (contentValidationError) {
    showError(contentError, contentValidationError);
    return;
  }

  if (passwordValidationError) {
    showError(passwordError, passwordValidationError);
    return;
  }

  // Disable submit button during request
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating...';

  try {
    // Call POST /api/messages
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Display validation errors from server
      if (data.error) {
        showError(formError, data.error.message || 'An error occurred');
      } else {
        showError(formError, 'Failed to create message');
      }
      return;
    }

    // Success - display result
    displayResult(data);
  } catch (error) {
    showError(formError, 'Network error. Please try again.');
    console.error('Error creating message:', error);
  } finally {
    // Re-enable submit button
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Secret Message';
  }
});

// Display result
function displayResult(data) {
  // Hide form
  messageForm.style.display = 'none';
  
  // Show result section
  resultSection.style.display = 'block';
  
  // Set URL
  messageUrl.value = data.url;
  
  // Set QR code
  qrCode.src = data.qrCodeDataUrl;
  
  // Store QR code data for download
  qrCode.dataset.dataUrl = data.qrCodeDataUrl;
}

// Copy URL to clipboard
copyUrlBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(messageUrl.value);
    copyUrlBtn.textContent = 'Copied!';
    copyUrlBtn.classList.add('copied');
    
    setTimeout(() => {
      copyUrlBtn.textContent = 'Copy';
      copyUrlBtn.classList.remove('copied');
    }, 2000);
  } catch (error) {
    console.error('Failed to copy:', error);
    // Fallback for older browsers
    messageUrl.select();
    document.execCommand('copy');
  }
});

// Download QR code
downloadQrBtn.addEventListener('click', () => {
  const dataUrl = qrCode.dataset.dataUrl;
  const link = document.createElement('a');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  link.download = `secret-message-${timestamp}.png`;
  link.href = dataUrl;
  link.click();
});

// Create another message
createAnotherBtn.addEventListener('click', () => {
  // Reset form
  messageForm.reset();
  charCount.textContent = '0';
  clearAllErrors();
  
  // Show form, hide result
  messageForm.style.display = 'flex';
  resultSection.style.display = 'none';
});
