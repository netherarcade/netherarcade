import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, sendPasswordResetEmail, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

 const auth = getAuth();

//inputs




const submit = document.getElementById('submit');
submit.addEventListener("click", function(event) {
    event.preventDefault()
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
   
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed up 

            const user = userCredential.user;
            alert("login ...")
           window.location.href = "https://netherarcade.qzz.io"
            // ...
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            alert(errorMessage)
            // ..
        });
})

//reset 
const reset = document.getElementById('reset');
reset.addEventListener("click", function(event){ 
event.preventDefault() 

const email = document.getElementById("email").value;

sendPasswordResetEmail(auth, email)
  .then(() => {
    // Password reset email sent!
    alert('Password reset email sent!')
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    alert(ErrorMessage)
    // ..
  });
 })
