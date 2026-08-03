/*==================================================
  Diplomat Cars Admin
  config.js
==================================================*/

const APP_CONFIG={

APP_NAME:"الدبلوماسي للسيارات",
APP_VERSION:"1.0.0",

GOOGLE_SHEETS:{
RUSTAQ:"1KIgAoTO0sbKtvVNt775ZCyuSAW8Bf8HbFyUXCY9pIV0",
MABELA:"1C_zsV_9l_SN0O5YN118OT49ng9H67sFIBWvk1Qr_3Gg"
},

FIREBASE:{
apiKey:"AIzaSyAQXzehspAW6XYellWZVues_Px9Au4Pb4Q",
authDomain:"diplomat-cars-70ed3.firebaseapp.com",
projectId:"diplomat-cars-70ed3",
storageBucket:"diplomat-cars-70ed3.firebasestorage.app",
messagingSenderId:"189200582804",
appId:"1:189200582804:web:8651f2945b86dcfafa0c81"
},

ONESIGNAL:{
APP_ID:"a5ef5e42-56c9-4af7-a4e2-4cf17c8d7505"
},

DEFAULT_PHONES={
rustaq:[
"96872222242",
"96898825877",
"96895096865"
],
mabela:[
"96892256223",
"96878080132"
]
},

SETTINGS_KEYS:{
PASSWORD:"dc_admin_password",
REST_API:"dc_rest_api",
ONESIGNAL_APP_ID:"dc_onesignal_appid",
PHONES:"dc_phones",
AUTO_NOTIFY:"dc_auto_notify",
AUTO_NOTIFY_TIME:"dc_auto_notify_time",
READY_NOTIFICATIONS:"dc_ready_notifications"
},

PATHS:{
IMAGES_FOLDER:"cars",
TEMP_FOLDER:"temp"
},

AUTO_NOTIFICATION:{
ENABLED:false,
EVERY_HOURS:24
},

READY_MESSAGES:[
{
title:"🚗 سيارة جديدة",
message:"تمت إضافة سيارة جديدة إلى المعرض."
},
{
title:"🔥 أحدث السيارات",
message:"اطلع الآن على أحدث السيارات المتوفرة."
},
{
title:"⭐ عروض مميزة",
message:"لا تفوت أحدث عروض الدبلوماسي للسيارات."
}
]

};

function getSetting(key,defaultValue=null){
const value=localStorage.getItem(key);
if(value===null)return defaultValue;
try{
return JSON.parse(value);
}catch(e){
return value;
}
}

function saveSetting(key,value){
localStorage.setItem(key,JSON.stringify(value));
}

function removeSetting(key){
localStorage.removeItem(key);
}

function hasRestApi(){
return localStorage.getItem(APP_CONFIG.SETTINGS_KEYS.REST_API)!==null;
}

function hasPassword(){
return localStorage.getItem(APP_CONFIG.SETTINGS_KEYS.PASSWORD)!==null;
}

function getPhones(){
return getSetting(APP_CONFIG.SETTINGS_KEYS.PHONES,DEFAULT_PHONES);
}

function savePhones(data){
saveSetting(APP_CONFIG.SETTINGS_KEYS.PHONES,data);
}

function getRestApi(){
return localStorage.getItem(APP_CONFIG.SETTINGS_KEYS.REST_API)||"";
}

function saveRestApi(key){
localStorage.setItem(APP_CONFIG.SETTINGS_KEYS.REST_API,key.trim());
}

function getOneSignalAppId(){
return localStorage.getItem(APP_CONFIG.SETTINGS_KEYS.ONESIGNAL_APP_ID)||APP_CONFIG.ONESIGNAL.APP_ID;
}

function saveOneSignalAppId(id){
localStorage.setItem(APP_CONFIG.SETTINGS_KEYS.ONESIGNAL_APP_ID,id.trim());
}

function getPassword(){
return localStorage.getItem(APP_CONFIG.SETTINGS_KEYS.PASSWORD)||"";
}

function savePassword(password){
localStorage.setItem(APP_CONFIG.SETTINGS_KEYS.PASSWORD,password);
}
