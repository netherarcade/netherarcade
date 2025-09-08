

  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
  import {
    getAuth,
    onAuthStateChanged,
    signOut
  } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

  // Your Firebase config (same as in your login page)
  const firebaseConfig = {
    apiKey: "AIzaSyAHWjE1igMxmPQ65hivDN7ioNsBSB7nl7U",
    authDomain: "tester-f4444.firebaseapp.com",
    projectId: "tester-f4444",
    storageBucket: "tester-f4444.firebasestorage.app",
    messagingSenderId: "588985084600",
    appId: "1:588985084600:web:64816acb4d654f9a4ae24d"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  // Show user info if logged in
  const userInfoDiv = document.getElementById("user-info");

  onAuthStateChanged(auth, (user) => {
    if (user) {
      // You can show user.email, displayName, etc.
      const name = user.displayName || user.email;
      userInfoDiv.innerHTML = `
         Logged in as <strong>${name}</strong>
        <button id="logoutBtn">Logout</button>
      `;

      // Handle logout
      document.getElementById("logoutBtn").addEventListener("click", () => {
        signOut(auth).then(() => {
          location.reload();
        });
      });

    } else {
      // Not logged in
      userInfoDiv.innerHTML = `
       <a href="https://your-login-page.html">Login</a>
      `;
    }
  });


