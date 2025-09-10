const navLinks = document.querySelectorAll(".header__ul li:not(:last-child) a"); 
const underline = document.querySelector(".hover-underline");

navLinks.forEach(link => {
  link.addEventListener("mouseenter", e => {
    const { left, width } = e.target.getBoundingClientRect();
    const parentLeft = e.target.closest(".header__ul").getBoundingClientRect().left;
    underline.style.left = (left - parentLeft) + "px";
    underline.style.width = width + "px";
  });
});

document.querySelector(".header__ul").addEventListener("mouseleave", () => {
  underline.style.width = 0;
});