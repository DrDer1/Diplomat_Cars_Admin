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

DEFAULT_PHONES:{
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

FOLDERS:{
IMAGES:"cars",
TEMP:"temp"
},

DEFAULT_SETTINGS:{
AUTO_NOTIFICATION:false,
AUTO_NOTIFICATION_HOURS:24,
AUTO_DELETE_UNUSED_IMAGES:true,
CHECK_FOR_NEW_CARS_MINUTES:5,
LANGUAGE:"ar",
THEME:"dark"
},

READY_NOTIFICATIONS:[
{
title:"🚗 سيارة جديدة",
message:"تمت إضافة سيارة جديدة إلى المعرض."
},
{
title:"⭐ أحدث السيارات",
message:"اطلع الآن على أحدث السيارات المتوفرة."
},
{
title:"🔥 عروض جديدة",
message:"تابع أحدث السيارات والعروض الحصرية."
}
],

LOCAL_KEYS:{
PASSWORD:"dc_password",
SETUP_DONE:"dc_setup_done",
SETTINGS:"dc_settings",
PHONES:"dc_phones",
READY_MESSAGES:"dc_ready_messages",
AUTO_NOTIFICATION:"dc_auto_notification",
AUTO_NOTIFICATION_HOURS:"dc_auto_notification_hours",
LAST_SYNC:"dc_last_sync",
LAST_CARS:"dc_last_cars",
LAST_IMAGES:"dc_last_images"
}

};

function load(key,defaultValue=null){
const value=localStorage.getItem(key);
if(value===null)return defaultValue;
try{
return JSON.parse(value);
}catch(e){
return value;
}
}

function save(key,value){
localStorage.setItem(key,JSON.stringify(value));
}

function remove(key){
localStorage.removeItem(key);
}

function setupCompleted(){
return localStorage.getItem(APP_CONFIG.LOCAL_KEYS.SETUP_DONE)==="true";
}

function completeSetup(){
localStorage.setItem(APP_CONFIG.LOCAL_KEYS.SETUP_DONE,"true");
}

function resetSetup(){
localStorage.removeItem(APP_CONFIG.LOCAL_KEYS.SETUP_DONE);
}

function savePassword(password){
localStorage.setItem(APP_CONFIG.LOCAL_KEYS.PASSWORD,password);
}

function getPassword(){
return localStorage.getItem(APP_CONFIG.LOCAL_KEYS.PASSWORD)||"";
}

function hasPassword(){
return getPassword()!=="";
}

function saveSettings(settings){
save(APP_CONFIG.LOCAL_KEYS.SETTINGS,settings);
}

function getSettings(){
return load(APP_CONFIG.LOCAL_KEYS.SETTINGS,{});
}

function savePhones(data){
save(APP_CONFIG.LOCAL_KEYS.PHONES,data);
}

function getPhones(){
return load(APP_CONFIG.LOCAL_KEYS.PHONES,APP_CONFIG.DEFAULT_PHONES);
}

function saveReadyNotifications(data){
save(APP_CONFIG.LOCAL_KEYS.READY_MESSAGES,data);
}

function getReadyNotifications(){
return load(
APP_CONFIG.LOCAL_KEYS.READY_MESSAGES,
APP_CONFIG.READY_NOTIFICATIONS
);
}

function saveAutoNotification(enabled){
save(
APP_CONFIG.LOCAL_KEYS.AUTO_NOTIFICATION,
enabled
);
}

function getAutoNotification(){
return load(
APP_CONFIG.LOCAL_KEYS.AUTO_NOTIFICATION,
APP_CONFIG.DEFAULT_SETTINGS.AUTO_NOTIFICATION
);
}

function saveAutoNotificationHours(hours){
save(
APP_CONFIG.LOCAL_KEYS.AUTO_NOTIFICATION_HOURS,
hours
);
}

function getAutoNotificationHours(){
return load(
APP_CONFIG.LOCAL_KEYS.AUTO_NOTIFICATION_HOURS,
APP_CONFIG.DEFAULT_SETTINGS.AUTO_NOTIFICATION_HOURS
);
}

function saveLastSync(date){
save(
APP_CONFIG.LOCAL_KEYS.LAST_SYNC,
date
);
}

function getLastSync(){
return load(
APP_CONFIG.LOCAL_KEYS.LAST_SYNC,
null
);
}

function saveLastCars(data){
save(
APP_CONFIG.LOCAL_KEYS.LAST_CARS,
data
);
}

function getLastCars(){
return load(
APP_CONFIG.LOCAL_KEYS.LAST_CARS,
[]
);
}

function saveLastImages(data){
save(
APP_CONFIG.LOCAL_KEYS.LAST_IMAGES,
data
);
}

function getLastImages(){
return load(
APP_CONFIG.LOCAL_KEYS.LAST_IMAGES,
{}
);
}

function exportSettings(){

return{

password:getPassword(),

settings:getSettings(),

phones:getPhones(),

readyNotifications:getReadyNotifications(),

autoNotification:getAutoNotification(),

autoNotificationHours:getAutoNotificationHours(),

lastSync:getLastSync()

};

}

function importSettings(data){

if(data.password)
savePassword(data.password);

if(data.settings)
saveSettings(data.settings);

if(data.phones)
savePhones(data.phones);

if(data.readyNotifications)
saveReadyNotifications(data.readyNotifications);

if(data.autoNotification!==undefined)
saveAutoNotification(data.autoNotification);

if(data.autoNotificationHours)
saveAutoNotificationHours(data.autoNotificationHours);

if(data.lastSync)
saveLastSync(data.lastSync);

completeSetup();

}

function clearAllLocalData(){

Object.values(APP_CONFIG.LOCAL_KEYS).forEach(key=>{
localStorage.removeItem(key);
});

}

console.log(
APP_CONFIG.APP_NAME+
" v"+
APP_CONFIG.APP_VERSION+
" Config Loaded"
);
