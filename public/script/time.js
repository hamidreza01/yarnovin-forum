let times = document.getElementsByClassName("time");
for(let t of times){
    let d = new Date(Number(t.innerHTML));
    t.innerHTML = d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate() 
}
let s = document.getElementById("search");

s.addEventListener("keypress", event => {
    if (event.key === "Enter") {
        window.open(encodeURI("https://google.com/search?q=site:forum.yarnovin.ir "+s.value))
    }
});

let sc = document.getElementById("sclick");
sc.addEventListener("click",()=>{
    window.open(encodeURI('https://google.com/search?q=site:forum.yarnovin.ir '+s.value))
})