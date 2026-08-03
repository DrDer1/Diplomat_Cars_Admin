/*==================================================
  Diplomat Cars Admin
  admin.js
==================================================*/

let currentBranch="rustaq";

let currentCars=[];

async function startAdmin(){

await FirebaseManager.init();

await refreshCars();

SchedulerManager.start();

NotificationManager.watch();

}

async function refreshCars(){

await SheetsManager.loadAllBranches();

currentCars=SheetsManager.getCars(currentBranch);

renderCars();

updateHome();

}

function updateHome(){

const total=document.getElementById("totalCars");

if(total){

total.textContent=SheetsManager.totalCars();

}

}

function switchBranch(branch){

currentBranch=branch;

currentCars=SheetsManager.getCars(branch);

renderCars();

}

function renderCars(){

const container=document.getElementById("carsList");

if(!container)return;

container.innerHTML="";

currentCars.forEach((car,index)=>{

container.appendChild(createCarCard(car,index));

});

}
function createCarCard(car,index){

const card=document.createElement("div");

card.className="car-card";

card.innerHTML=`

<div class="car-image-box">

<img src="${car.image||APP_CONFIG.NO_IMAGE}" onclick="changeCarImage(${index})">

</div>

<div class="car-info">

<h3>${car.name}</h3>

<p>${car.model}</p>

<p>${car.color}</p>

<p>${car.price} ر.ع</p>

<p>${car.category}</p>

</div>

`;

return card;

}

async function changeCarImage(index){

const car=currentCars[index];

if(!car)return;

const url=await FirebaseManager.selectAndUpload(car);

if(!url)return;

car.image=url;

SheetsManager.updateCarImage(currentBranch,index,url);

renderCars();

}

window.AdminManager={

start:startAdmin,

refresh:refreshCars,

switchBranch,

changeCarImage

};

console.log("Admin Manager Ready");
