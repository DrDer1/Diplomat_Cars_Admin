/*==================================================
  Diplomat Cars Admin
  notifications.js
==================================================*/

async function sendNotification(data){

const settings=getSettings();

const headers={

"Content-Type":"application/json",

"Authorization":"Key "+settings.oneSignalRestApi

};

const body={

app_id:settings.oneSignalAppId,

included_segments:["All"],

headings:{
en:data.title,
ar:data.title
},

contents:{
en:data.message,
ar:data.message
}

};

if(data.image){

body.big_picture=data.image;

body.chrome_web_image=data.image;

}

if(data.url){

body.url=data.url;

}

const response=await fetch(

"https://onesignal.com/api/v1/notifications",

{

method:"POST",

headers,

body:JSON.stringify(body)

}

);

return await response.json();

}
async function sendManualNotification(){

const title=document.getElementById("notifyTitle").value.trim();

const message=document.getElementById("notifyMessage").value.trim();

const image=document.getElementById("notifyImage").value.trim();

if(title===""){
alert("أدخل عنوان الإشعار");
return;
}

if(message===""){
alert("أدخل نص الإشعار");
return;
}

const result=await sendNotification({

title:title,

message:message,

image:image,

url:APP_CONFIG.APP_URL

});

if(result.id){

alert("تم إرسال الإشعار بنجاح");

clearNotificationForm();

}else{

alert("فشل إرسال الإشعار");

console.error(result);

}

}

function clearNotificationForm(){

document.getElementById("notifyTitle").value="";
document.getElementById("notifyMessage").value="";
document.getElementById("notifyImage").value="";

}
async function sendNewCarNotification(car){

const title="🚗 سيارة جديدة";

const message=
`${car.category}
${car.name}
موديل ${car.model}
${car.price} ر.ع`;

return await sendNotification({

title:title,

message:message,

url:APP_CONFIG.APP_URL

});

}

async function checkForNewCars(){

const added=await SheetsManager.checkNewCars();

if(added.length===0)return;

for(const car of added){

await sendNewCarNotification(car);

}

}

let notificationTimer=null;

function startNotificationWatcher(){

if(notificationTimer){
clearInterval(notificationTimer);
}

notificationTimer=setInterval(

checkForNewCars,

APP_CONFIG.AUTO_CHECK_INTERVAL

);

}

window.NotificationManager={

send:sendNotification,

sendManual:sendManualNotification,

sendNewCar:sendNewCarNotification,

watch:startNotificationWatcher,

check:checkForNewCars

};

console.log("Notification Manager Ready");
