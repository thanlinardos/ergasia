function navDropdown(){
    document.querySelector("#dropdown").classList.toggle("show");
    direction = document.querySelector("#direction");
    current = direction.getAttribute("d");
    if(current === "M16 12l-4 4-4-4M12 8v7") direction.setAttribute("d","M16 12l-4-4-4 4M12 16V9");
    else direction.setAttribute("d","M16 12l-4 4-4-4M12 8v7");
}

function login(){
    window.location.href="/login/admin";
}
function hide(){
    list =document.querySelectorAll("#hide")
    list.forEach(element => {
        element.classList.toggle("hide");
    });
}

timeOutFunctionId=0;
        function work(){
            el = document.querySelector("#hide")
            if(window.innerWidth>610){
                if(el.classList.contains("hide")){
                    hide()
                }
            }
        }
        window.addEventListener("resize",function(){
            try{clearTimeout(timeOutFunctionId);
            }catch(err){console.log(err)}
            timeOutFunctionId = setTimeout(work, 500);
        })
