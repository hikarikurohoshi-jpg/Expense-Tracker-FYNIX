// ============== Lucide icons + Password toggle ==============
lucide.createIcons();

document.addEventListener("click", (e) => {
  const toggle = e.target.closest(".toggle-password");
  if (!toggle) return;

  const pwd = document.getElementById("password");
  const show = pwd.type === "password";
  pwd.type = show ? "text" : "password";

  toggle.setAttribute("data-lucide", show ? "eye" : "eye-off");
  lucide.createIcons();
});

import {
  getAuth,
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import { app } from "../js/auth.js";

// 🔔 DOM Elements
const loginBtn = document.querySelector(".btn-login");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const rememberCheckbox = document.getElementById("remember");
const emailError = document.getElementById("email-error");
const passwordError = document.getElementById("password-error");

const auth = getAuth(app);

// Disable button during login
function setLoading(isLoading) {
  loginBtn.disabled = isLoading;
  loginBtn.textContent = isLoading ? "Logging in..." : "Log In";
}

// ============== Email/password login with Remember Me ==============
loginBtn.addEventListener("click", async () => {
  clearErrors();

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const remember = rememberCheckbox.checked;

  if (!email || !password) {
    if (!email) showError(emailError, "Please enter your email.");
    if (!password) showError(passwordError, "Please enter your password.");
    return;
  }

  setLoading(true);

  try {
    // Set login persistence based on Remember Me
    await setPersistence(
      auth,
      remember ? browserLocalPersistence : browserSessionPersistence
    );

    // Authenticate user
    const userCred = await signInWithEmailAndPassword(auth, email, password);

    // Save toast message to local storage
    localStorage.setItem(
      "toastMessage",
      JSON.stringify({
        message: "Welcome back!",
        subText: `Logged in successfully.`,
      })
    );

    // Redirect after short delay (allow toast to show)
    setTimeout(() => {
      window.location.href =
        "pages/dashboard/dashboard.html";
    }, 2000);
  } catch (err) {
    console.error("Firebase Login Error:", err); // Debug log
    handleFirebaseError(err);
  } finally {
    setLoading(false);
  }
});

// Handle Firebase Login Errors
function handleFirebaseError(err) {
  console.error("Firebase Error Code:", err.code); // Debug log

  switch (err.code) {
    case "auth/invalid-email":
      showError(emailError, "Please enter a valid email address.");
      break;
    case "auth/user-not-found":
      showError(emailError, "No user found with this email.");
      break;
    case "auth/wrong-password":
      showError(passwordError, "Incorrect password. Try again.");
      break;
    case "auth/invalid-credential":
      showError(emailError, "Invalid email or password.");
      showError(passwordError, "Invalid email or password.");
      break;
    default:
      showModal("error", err.message);
  }
}

// Helpers to show/hide error hints
function showError(element, message) {
  element.textContent = message;
  element.classList.add("visible");
}

function clearErrors() {
  [emailError, passwordError].forEach((el) => {
    el.textContent = "";
    el.classList.remove("visible");
  });
}

// ============== Google Login (Will auto remember based on Firebase default) ==============
document.querySelector(".btn-google").addEventListener("click", async () => {
  try {
    const provider = new GoogleAuthProvider();
    const userCred = await signInWithPopup(auth, provider);

    const user = userCred.user;

    const res = await fetch("./api/save_user.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: user.uid,
        email: user.email,
        name: user.displayName || "",
        profile_photo: user.photoURL || "",
      }),
    });

    const data = await res.json();
    if (data.status !== "ok") throw new Error(data.error);

    localStorage.setItem(
      "toastMessage",
      JSON.stringify({
        message: "Welcome!",
        subText: `Logged in successfully via Google.`,
      })
    );

    // Delay redirect to allow toast
    setTimeout(() => {
      window.location.href =
        "pages/dashboard/dashboard.html";
    }, 2000);
  } catch (err) {
    showModal("error", err.message);
  }
});
