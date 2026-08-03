/*==================================================
  Diplomat Cars Admin
  scheduler.js
==================================================*/

let schedulerTimer=null;

function startScheduler(){

stopScheduler();

const settings=getSettings();

const minutes=settings.notificationInterval||60;

schedulerTimer=setInterval(

runScheduledNotification,

minutes*60*1000

);

console.log("Scheduler Started");

}

function stopScheduler(){

if(schedulerTimer){

clearInterval(schedulerTimer);

schedulerTimer=null;

}

}

async function runScheduledNotification(){

const settings=getSettings();

if(!settings.autoNotification)return;

const list=settings.savedNotifications||[];

if(list.length===0)return;

const index=settings.notificationIndex||0;

const item=list[index];

await NotificationManager.send({

title:item.title,

message:item.message,

image:item.image||"",

url:APP_CONFIG.APP_URL

});

settings.notificationIndex=(index+1)%list.length;

saveSettings(settings);

}
function addScheduledNotification(title,message,image=""){

const settings=getSettings();

if(!settings.savedNotifications){
settings.savedNotifications=[];
}

settings.savedNotifications.push({

title:title,

message:message,

image:image

});

saveSettings(settings);

}

function removeScheduledNotification(index){

const settings=getSettings();

if(!settings.savedNotifications)return;

settings.savedNotifications.splice(index,1);

saveSettings(settings);

}

function getScheduledNotifications(){

const settings=getSettings();

return settings.savedNotifications||[];

}

function setSchedulerEnabled(enabled){

const settings=getSettings();

settings.autoNotification=enabled;

saveSettings(settings);

if(enabled){

startScheduler();

}else{

stopScheduler();

}

}

window.SchedulerManager={

start:startScheduler,

stop:stopScheduler,

add:addScheduledNotification,

remove:removeScheduledNotification,

list:getScheduledNotifications,

enable:setSchedulerEnabled

};

console.log("Scheduler Manager Ready");
