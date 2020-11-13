const headline = document.querySelectorAll(".logo-text span");
let delay = 0;
headline.forEach((l) => {
  delay += 30;
  l.style.color = "#222";
  setTimeout(() => {
    l.style.color = "#77c382";
  }, delay);
});

const link = document.querySelector(".logo-text .link");
link.style.color = "#222";
setTimeout(() => {
  link.style.color = "#77c382";
}, delay - 100);
