/*==================================================
  Diplomat Cars Admin
  setup.js
==================================================*/

function showSetupWizard(){

const modal=document.getElementById("setupModal");

if(modal){
modal.classList.add("show");
}

loadSavedSetup();

}

function hideSetupWizard(){

const modal=document.getElementById("setupModal");

if(modal){
modal.classList.remove("show");
}

}

function loadSavedSetup(){

const settings=getSettings();

if(!settings.firebase)return;

setValue("firebaseApiKey",settings.firebase.apiKey);
setValue("firebaseAuthDomain",settings.firebase.authDomain);
setValue("firebaseProjectId",settings.firebase.projectId);
setValue("firebaseStorageBucket",settings.firebase.storageBucket);
setValue("firebaseMessagingSenderId",settings.firebase.messagingSenderId);
setValue("firebaseAppId",settings.firebase.appId);
setValue("oneSignalAppId",settings.oneSignalAppId||"");
setValue("oneSignalRestApi",settings.oneSignalRestApi||"");

}

function setValue(id,value){

const el=document.getElementById(id);

if(el){
el.value=value;
}

}
function saveSetup(){

const firebase={

apiKey:getValue("firebaseApiKey"),
authDomain:getValue("firebaseAuthDomain"),
projectId:getValue("firebaseProjectId"),
storageBucket:getValue("firebaseStorageBucket"),
messagingSenderId:getValue("firebaseMessagingSenderId"),
appId:getValue("firebaseAppId")

};

const settings=getSettings();

settings.firebase=firebase;
settings.oneSignalAppId=getValue("oneSignalAppId");
settings.oneSignalRestApi=getValue("oneSignalRestApi");

saveSettings(settings);

completeSetup();

hideSetupWizard();

if(typeof AuthManager!=="undefined"){
AuthManager.firstRunCheck();
}

}

function getValue(id){

const el=document.getElementById(id);

if(!el)return"";

return el.value.trim();

}

function resetSetupForm(){

[
"firebaseApiKey",
"firebaseAuthDomain",
"firebaseProjectId",
"firebaseStorageBucket",
"firebaseMessagingSenderId",
"firebaseAppId",
"oneSignalAppId",
"oneSignalRestApi"
].forEach(id=>{

setValue(id,"");

});

}

window.SetupManager={

show:showSetupWizard,
hide:hideSetupWizard,
save:saveSetup,
reset:resetSetupForm

};
function validateSetup(){

if(getValue("firebaseApiKey")==="")return false;
if(getValue("firebaseAuthDomain")==="")return false;
if(getValue("firebaseProjectId")==="")return false;
if(getValue("firebaseStorageBucket")==="")return false;
if(getValue("firebaseMessagingSenderId")==="")return false;
if(getValue("firebaseAppId")==="")return false;
if(getValue("oneSignalAppId")==="")return false;
if(getValue("oneSignalRestApi")==="")return false;

return true;

}

function finishSetup(){

if(!validateSetup()){

alert("يرجى تعبئة جميع الحقول");

return;

}

saveSetup();

}

window.addEventListener("load",()=>{

if(!setupCompleted()){

showSetupWizard();

}

});

console.log("Setup Manager Ready");
