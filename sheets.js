/*==================================================
  Diplomat Cars Admin
  sheets.js
==================================================*/

const SHEETS={

rustaq:"1KIgAoTO0sbKtvVNt775ZCyuSAW8Bf8HbFyUXCY9pIV0",

mabela:"1C_zsV_9l_SN0O5YN118OT49ng9H67sFIBWvk1Qr_3Gg"

};

let carsCache={

rustaq:[],

mabela:[]

};

async function loadBranch(branch){

const id=SHEETS[branch];

const url=`https://docs.google.com/spreadsheets/d/${id}/export?format=csv`;

const text=await fetch(url).then(r=>r.text());

carsCache[branch]=parseCSV(text,branch);

return carsCache[branch];

}

async function loadAllBranches(){

await Promise.all([
loadBranch("rustaq"),
loadBranch("mabela")
]);

return carsCache;

}

function getCars(branch){

return carsCache[branch]||[];

}

function getAllCars(){

return[
...carsCache.rustaq,
...carsCache.mabela
];

}
function parseCSV(text,branch){

const cars=[];

const lines=text.split("\n");

let category="أخرى";

for(const line of lines){

const value=line.trim();

if(!value)continue;

const cols=value.split(",").map(v=>
v.replace(/^"|"$/g,"").trim()
);

const filled=cols.filter(v=>v!=="");

if(filled.length===0)continue;

if(
filled.length===1&&
!/^\d+$/.test(cols[0])&&
!/^(19|20)\d{2}$/.test(cols[0])
){

category=cols[0];

continue;

}

cars.push({

branch:branch,

category:category,

price:cols[0]||"",

color:cols[1]||"",

model:cols[2]||"",

name:cols[3]||"",

image:cols[4]||""

});

}

if(cars.length>0){
cars.pop();
}

return cars;

}

function getCar(branch,index){

if(!carsCache[branch])return null;

return carsCache[branch][index]||null;

}

function updateCarImage(branch,index,url){

if(!carsCache[branch])return;

if(!carsCache[branch][index])return;

carsCache[branch][index].image=url;

}

function totalCars(){

return(
carsCache.rustaq.length+
carsCache.mabela.length
);

}
function compareCars(oldCars,newCars){

const added=[];

newCars.forEach(car=>{

const exists=oldCars.find(item=>

item.name===car.name&&
item.model===car.model&&
item.price===car.price&&
item.branch===car.branch

);

if(!exists){
added.push(car);
}

});

return added;

}

async function checkNewCars(){

const oldCars=getLastCars();

await loadAllBranches();

const current=getAllCars();

const added=compareCars(oldCars,current);

saveLastCars(current);

return added;

}

window.SheetsManager={

loadBranch,

loadAllBranches,

getCars,

getCar,

getAllCars,

updateCarImage,

totalCars,

checkNewCars

};

console.log("Sheets Manager Ready");
