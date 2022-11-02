let times = document.getElementsByClassName("time");
let n = new Date();
for(let t of times){
    let d = new Date(parseInt(t.innerHTML.split("%")[1]));
    let text;
    if(n.getFullYear() - d.getFullYear() > 0){
        text = `${n.getFullYear() - d.getFullYear()} سال`
    }else if(n.getMonth() - d.getMonth() > 0){
        text = `${n.getMonth() - d.getMonth()} ماه`
    }else if(n.getDate() - d.getDate() > 0){
        text = `${n.getDate() - d.getDate()} روز`
    }else if(n.getHours() - d.getHours() > 0){
        text = `${n.getHours() - d.getHours()} ساعت`
    }else if(n.getMinutes() - d.getMinutes() > 0){
        text = `${n.getMinutes() - d.getMinutes()} دقیقه`
    }else if(n.getSeconds() - d.getSeconds() > 0){
        text = `${n.getSeconds() - d.getSeconds()} ثانیه`
    }
    t.innerHTML = t.innerHTML.replace("%"+t.innerHTML.split("%")[1]+"%",text);
}

let docs = document.getElementsByClassName("enter");
for(let d of docs){
    d.innerHTML = d.innerHTML.replace(/\n/g,"<br/>");
}
let docs2 = document.getElementsByClassName("time");
let answers = document.getElementsByClassName("length")
for(let a of answers){
    a.innerHTML = a.innerHTML.replace("%LENGTH%",docs2.length - 1);
}
