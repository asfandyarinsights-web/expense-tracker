const txtname=document.getElementById("textboxname");
let usernamep=document.getElementById("userrname");

let dailylimitp=document.getElementById("dailylimit");
const amount=document.getElementById("textboxamount");

const balance=document.getElementById("textboxbalance");

const dailylimitamount=document.getElementById("dropdownLimit");
// const transcationType=document.getElementById("dropdown");

const buttonspend=document.getElementById("spendbtn");
const buttonadd=document.getElementById("addbtn");

const expensetype=document.getElementById("Expense-Type");
const history=document.getElementById("history");

const addtransactionbtn=document.getElementById("addtranscation");

addtransactionbtn.addEventListener("click",function(){
    if(Isvalid()){

        let p1={
            username:txtname.value,
            currentbalance:balance.value,
            dailyLimit:dailylimitamount.value,
            expenseType:expensetype.value,
            Amount:amount.value,
    }
    array.push(p1); //pushing object into array
    let index=array.length-1; //storing index of array
    console.log(index);
    const tr=document.createElement("tr");
     const tb=document.getElementById("tablebody");
     let lastobject=array[array.length-1];//take the last index of array
     tr.innerHTML+=`<td>${lastobject.username}</td>`;
     tr.innerHTML+=`<td id="td">${lastobject.currentbalance}</td>`;
     tr.innerHTML+=`<td>${lastobject.dailyLimit}</td>`;
     tr.innerHTML+=`<td>${lastobject.expenseType}</td>`;
     tr.innerHTML+=`<td><button onclick="updateBalanceadd(${index})" class="btn btn-add">Add Balance</button></td>`;
     tr.innerHTML+=`<td><button onclick="updateBalanceSubtract(${index})" class="btn btn-subtract">Withdraw Balance</button></td>`;
    
    tb.appendChild(tr);
    console.log("transaction Added");
    clearboxes();
    console.log("button clicked");
    console.log(array);  
}
    else{
        alert("Enter Data First");
    }
});

let array=[];
//Add Button Event Handler
// buttonadd.addEventListener("click",function(){
//     if(Isvalid()){
//         let p1={
//             username:txtname.value,
//             currentbalance:balance.value,
//             dailyLimit:dailylimitamount.value,
//             expenseType:expensetype.value,
//             Amount:amount.value,
//     }
//     array.push(p1); //pushing object into array
//     let index=array.length-1; //storing index of array
//     console.log(index);
//     const tr=document.createElement("tr");
//      const tb=document.getElementById("tablebody");
//      let lastobject=array[array.length-1];//take the last index of array
//      tr.innerHTML+=`<td>${lastobject.username}</td>`;
//      tr.innerHTML+=`<td id="td">${lastobject.currentbalance}</td>`;
//      tr.innerHTML+=`<td>${lastobject.dailyLimit}</td>`;
//      tr.innerHTML+=`<td>${lastobject.expenseType}</td>`;
//      tr.innerHTML+=`<td><button onclick="updateBalanceadd(${index})" class="btn">Update Balance</button></td>`;
    
//     tb.appendChild(tr);
    
//     clearboxes();
//     console.log("button clicked");
//     console.log(array);  
// }
//     else{
//         alert("Enter Data First");
//     }
// });
// buttonspend.addEventListener("click",function(){
//     if(Isvalid()){
//         let p1={
//             username:txtname.value,
//             currentbalance:balance.value,
//             dailyLimit:dailylimitamount.value,
//             expenseType:expensetype.value,
//             Amount:amount.value,
//     }
//     array.push(p1); //pushing object into array
//     let index=array.length-1; //storing index of array
//     console.log(index);
//     const tr=document.createElement("tr");
//      const tb=document.getElementById("tablebody");
//      let lastobject=array[array.length-1];//take the last index of array
//      tr.innerHTML+=`<td>${lastobject.username}</td>`;
//      tr.innerHTML+=`<td id="td">${lastobject.currentbalance}</td>`;
//      tr.innerHTML+=`<td>${lastobject.dailyLimit}</td>`;
//      tr.innerHTML+=`<td>${lastobject.expenseType}</td>`;
//      tr.innerHTML+=`<td><button onclick="updateBalanceSubtract(${index})" class="btn">Update Balance</button></td>`;
    
//     tb.appendChild(tr);
    
//     clearboxes();
//     console.log("button clicked");
//     console.log(array);  
// }
//     else{
//         alert("Enter Data First");
//     }
// });
//update balance add
let newblance=0;
let currentbalance=0;
let tabletd=0;
function updateBalanceadd(index){
    tabletd=document.getElementById("td");
    currentbalance=parseFloat(array[index].currentbalance);
    console.log(currentbalance);
    newblance=parseFloat(prompt("Enter New Balance"));
    currentbalance+=newblance;

    array[index].currentbalance=currentbalance;
    console.log(currentbalance);
    tabletd.innerHTML=array[index].currentbalance;

    console.log(`index of array is ${index}`);  
    
   console.log(`table Row is ${tabletd.value}`);  
}
//update balance subtract
function updateBalanceSubtract(index){
    
    tabletd=document.getElementById("td");
    currentbalance=parseFloat(array[index].currentbalance);
    console.log(currentbalance);

    
    if(currentbalance!=0){
        newblance=parseFloat(prompt("Enter New Balance"));
    currentbalance-=newblance;
    
    console.log(currentbalance);
    
        array[index].currentbalance=currentbalance;
        console.log(currentbalance);
        tabletd.innerHTML=currentbalance;
        console.log("CR Balance is : "+currentbalance);
    }
    else if(currentbalance==0){
        tabletd.innerHTML=array[index].currentbalance;
        console.log("CR Balance is : "+currentbalance);
        tabletd.innerHTML=currentbalance;
        alert(`You Have With Drawn All Balance Current Balance is : ${currentbalance}`);
        }
}
//clearbox function
function clearboxes(){
    txtname.value="";
    amount.value="";
    dailylimitamount.value="";
    expensetype.value="";
    balance.value="";
}

//validation function
function Isvalid(){
    if(txtname.value!="" && dailylimitamount.value!="" && balance.value!="" 
        && amount.value!="" && expensetype.value!="")
    {
        return true;    
    }
    else{
        return false;
    }
}
//button enable Disable Events
/*
transcationType.addEventListener("change",function(){

    if (transcationType.value=="") {
        buttonspend.disabled=true;
        buttonadd.disabled=true;
        buttonadd.innerText="Add Amount Not Clickable";
        buttonspend.innerText="Withdraw Not Clickable";
    }
    else if(transcationType.value=="spend"){
         buttonspend.disabled=false;
        buttonadd.disabled=true;
        buttonadd.innerText="Add Amount Not Clickable";
        buttonspend.innerText="Withdraw Clickable";
    }
    else if(transcationType.value=="add"){
         buttonspend.disabled=true;
        buttonadd.disabled=false;
         buttonadd.innerText="Add Amount Clickable";
        buttonspend.innerText="Withdraw Not Clickable";
    }
});

*/


