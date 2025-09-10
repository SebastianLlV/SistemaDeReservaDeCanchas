const hamburger = document.querySelector(".nav__hamburger");
const navMenu = document.querySelector(".header__ul");

hamburger.addEventListener("click", () => {
  hamburger.classList.toggle("active");
  navMenu.classList.toggle("active");
});