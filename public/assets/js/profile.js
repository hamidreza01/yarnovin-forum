let card = document.getElementById("card-name");
let userName = document.getElementById("name");
let colors = ["#ec407a", "#ab47bc", "#ef5350", "#7e57c2", "#5c6bc0", "#ffa726"];
const random = (min, max) => Math.floor(Math.random() * (max - min) + min);
card.style.background = colors[random(0, colors.length)];
card.children[0].innerHTML = userName.innerHTML.substring(0, 2);
