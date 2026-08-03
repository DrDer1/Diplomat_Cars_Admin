/*==================================================
  Diplomat Cars Admin
  firebase.js
==================================================*/

import {initializeApp} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
getStorage,
ref,
uploadBytes,
getDownloadURL,
deleteObject
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-storage.js";

let firebaseApp=null;
let storage=null;

function firebaseConfigured(){

const settings=getSettings();

return(
settings.firebase&&
settings.firebase.apiKey&&
settings.firebase.authDomain&&
settings.firebase.projectId&&
settings.firebase.storageBucket&&
settings.firebase.messagingSenderId&&
settings.firebase.appId
);

}

function initFirebase(){

if(firebaseApp)return true;

const settings=getSettings();

if(!settings.firebase){

console.error("Firebase Settings Missing");

return false;

}

firebaseApp=initializeApp(settings.firebase);

storage=getStorage(firebaseApp);

console.log("Firebase Ready");

return true;

}

function getStorageInstance(){

if(!storage){

initFirebase();

}

return storage;

}

function createImageName(file){

const ext=file.name.split(".").pop().toLowerCase();

const name=
Date.now()+
"_"+
Math.random().toString(36).substring(2,10);

return APP_CONFIG.FOLDERS.IMAGES+
"/"+
name+
"."+
ext;

}

async function uploadCarImage(file){

if(!initFirebase())return null;

try{

const imagePath=createImageName(file);

const imageRef=ref(
getStorageInstance(),
imagePath
);

await uploadBytes(imageRef,file);

const url=await getDownloadURL(imageRef);

return{
success:true,
url:url,
path:imagePath
};

}catch(error){

console.error(error);

return{
success:false,
url:"",
path:"",
error:error
};

}

}

async function replaceCarImage(oldPath,file){

const result=await uploadCarImage(file);

if(!result.success)return result;

if(oldPath){

try{

await deleteCarImage(oldPath);

}catch(e){}

}

return result;

}

async function deleteCarImage(path){

if(!initFirebase())return false;

if(!path)return true;

try{

const imageRef=ref(
getStorageInstance(),
path
);

await deleteObject(imageRef);

return true;

}catch(error){

console.error(error);

return false;

}

}
