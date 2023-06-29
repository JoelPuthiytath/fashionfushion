
let emailError=document.getElementById('emailError')
emailError.style.color="red";
function validateEmail(){
    
    let email=document.getElementById('email').value;
    console.log(email);

    if(email.length==0){
        emailError.innerHTML='Email is required';
        return false;
    }
    if(!email.match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)){
        emailError.innerHTML='Email invalid';
        return false;
    }
    emailError.innerHTML=' ';
    return true;
}