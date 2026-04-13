let t = document.getElementById("t");
let d = document.getElementById("d");

d.textContent = localStorage.x || "";

function s() {
  localStorage.x = (localStorage.x || "") + "\n" + t.value;
  d.textContent = localStorage.x;
  t.value = "";
}
