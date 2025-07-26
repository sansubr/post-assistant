import { auth, db } from './firebase-init.js';
import { doc, setDoc } from 'firebase/firestore';

const googleButton = document.getElementById('google-btn');
const messageDiv = document.getElementById('message');

// --- Event listener for Google Sign-In ---
googleButton.addEventListener('click', async () => {
  messageDiv.textContent = ''; // Clear previous messages
  // Redirect to your web application's login page
  chrome.tabs.create({ url: 'https://blinkpost.getstrategiq.com/login.html' });
  window.close();
});