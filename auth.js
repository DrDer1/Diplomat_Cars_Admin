/*==================================================
  Diplomat Cars Admin
  auth.js
==================================================*/

let loginState=false;

function isLoggedIn(){
return loginState;
}

function login(password){

const saved=getPassword();

if(saved===""){
savePassword(password);
loginState=true;
return true;
}

if(password===saved){
loginState=true;
return true;
}

return false;

}

function logout(){

loginState=false;

}

function changePassword(oldPassword,newPassword){

const saved=getPassword();

if(saved!==oldPassword){
return{
success:false,
message:"كلمة المرور الحالية غير صحيحة"
};
}

if(!newPassword||newPassword.length<4){
return{
success:false,
message:"كلمة المرور قصيرة جداً"
};
}

savePassword(newPassword);

return{
success:true,
message:"تم تغيير كلمة المرور"
};

}

function passwordExists(){
return hasPassword();
}

function requireLogin(){

if(isLoggedIn())return true;

showLoginDialog();

return false;

}
function showLoginDialog(){

const dialog=document.getElementById("loginDialog");
const input=document.getElementById("loginPassword");

if(!dialog)return;

input.value="";
dialog.classList.add("show");

setTimeout(()=>{
input.focus();
},100);

}

function hideLoginDialog(){

const dialog=document.getElementById("loginDialog");

if(dialog){
dialog.classList.remove("show");
}

}

function submitLogin(){

const input=document.getElementById("loginPassword");

if(!input)return;

const password=input.value.trim();

if(login(password)){

hideLoginDialog();

if(typeof startAdmin==="function"){
startAdmin();
}

}else{

alert("كلمة المرور غير صحيحة");

input.value="";
input.focus();

}

}

function firstRunCheck(){

if(!setupCompleted()){

if(typeof showSetupWizard==="function"){
showSetupWizard();
}

return;

}

if(!passwordExists()){

if(typeof showCreatePassword==="function"){
showCreatePassword();
}

return;

}

showLoginDialog();

}

window.AuthManager={

login,

logout,

isLoggedIn,

changePassword,

passwordExists,

firstRunCheck,

showLoginDialog,

hideLoginDialog,

submitLogin

};
