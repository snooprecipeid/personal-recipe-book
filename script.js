/* Snoop Recipe ID - Fixed version */

if (!localStorage.getItem('password')) localStorage.setItem('password', 'recipe123');

const fmt = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

function login(){
  const username=document.getElementById('username').value.trim();
  const password=document.getElementById('password').value.trim();
  const saved=localStorage.getItem('password')||'recipe123';
  const err=document.getElementById('login-error');
  if(username==='admin'&&password===saved){
    localStorage.setItem('isLoggedIn','true');
    showMainUI();renderAll();
  }else{
    err.innerText='Incorrect username or password!';
    setTimeout(()=>err.innerText='',3000);
  }
}

function logout(){localStorage.removeItem('isLoggedIn');location.reload();}
function showMainUI(){
  document.getElementById('login-box').style.display='none';
  document.getElementById('recipe-list').style.display='block';
  document.getElementById('add-recipe').style.display='block';
  document.querySelector('.dashboard').style.display='flex';
}
function showLoginUI(){
  document.getElementById('login-box').style.display='block';
  document.getElementById('recipe-list').style.display='none';
  document.getElementById('add-recipe').style.display='none';
  document.querySelector('.dashboard').style.display='none';
}

function toggleResetForm(){
  const f=document.getElementById('reset-form');
  f.classList.toggle('hidden');
  document.getElementById('reset-message').innerText='';
}

function setNewPassword(){
  const np=document.getElementById('new-password').value;
  const cp=document.getElementById('confirm-password').value;
  const msg=document.getElementById('reset-message');
  if(!np||!cp){msg.innerText='Please fill both fields.';return;}
  if(np!==cp){msg.innerText='Passwords do not match.';return;}
  localStorage.setItem('password',np);
  msg.innerText='Password updated.';
  setTimeout(()=>{msg.innerText='';document.getElementById('reset-form').classList.add('hidden');},1500);
}

const recipeImageInput=document.getElementById('recipe-image');
const previewImages=document.getElementById('preview-images');
let imageFiles=[];
if(recipeImageInput){
  recipeImageInput.addEventListener('change',function(){
    previewImages.innerHTML='';imageFiles=[];
    Array.from(this.files).forEach(f=>{
      const r=new FileReader();
      r.onload=e=>{
        const img=document.createElement('img');
        img.src=e.target.result;
        previewImages.appendChild(img);
        imageFiles.push(e.target.result);
      };
      r.readAsDataURL(f);
    });
  });
}

function getRecipes(){return JSON.parse(localStorage.getItem('recipes')||'[]');}
function saveRecipes(l){localStorage.setItem('recipes',JSON.stringify(l));}
function clearAllRecipes(){if(confirm('Delete all saved recipes?')){localStorage.removeItem('recipes');renderAll();}}

function addRecipe(){
  const n=document.getElementById('recipe-name').value.trim();
  const i=document.getElementById('recipe-ingredients').value.trim();
  const s=document.getElementById('recipe-steps').value.trim();
  const c=Number(document.getElementById('recipe-cost').value||0);
  if(!n||!i||!s||isNaN(c)){alert('Please complete all fields.');return;}
  const list=getRecipes();
  list.unshift({id:Date.now(),name:n,ingredients:i,steps:s,cost:c,images:imageFiles.slice(),rating:0});
  saveRecipes(list);
  document.getElementById('recipe-name').value='';
  document.getElementById('recipe-ingredients').value='';
  document.getElementById('recipe-steps').value='';
  document.getElementById('recipe-cost').value='';
  recipeImageInput.value='';previewImages.innerHTML='';imageFiles=[];
  renderAll();
}

function deleteRecipe(id){
  if(!confirm('Delete this recipe?'))return;
  let r=getRecipes();
  r=r.filter(x=>x.id!==id);
  saveRecipes(r);
  renderAll();
}

function rateRecipe(id,stars){
  const r=getRecipes();
  const idx=r.findIndex(x=>x.id===id);
  if(idx===-1)return;
  r[idx].rating=stars;
  saveRecipes(r);
  renderAll();
}

function renderSummary(r){
  const total=r.length;
  const cost=r.reduce((a,b)=>a+(Number(b.cost)||0),0);
  const avg=total?r.reduce((a,b)=>a+(b.rating||0),0)/total:0;
  document.getElementById('total-recipes').innerText=total;
  document.getElementById('total-cost').innerText=fmt.format(cost);
  document.getElementById('avg-rating').innerText=avg?avg.toFixed(1):'0.0';
}

function escapeHtml(str){return str?str.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'):'';}

function renderRecipes(list){
  const c=document.getElementById('recipes-container');
  c.innerHTML='';
  if(!list.length){c.innerHTML='<div class="muted">No recipes yet.</div>';return;}
  list.forEach(r=>{
    const card=document.createElement('div');card.className='recipe-card';
    const img=(r.images&&r.images.length)?`<img src="${r.images[0]}" alt="${escapeHtml(r.name)}">`:'';
    let stars='';for(let i=1;i<=5;i++){const cls=i<=(r.rating||0)?'fa-star active-star':'fa-star';stars+=`<i class="fa-solid ${cls}" onclick="rateRecipe(${r.id},${i})"></i>`;}
    card.innerHTML=`${img}<h4>${escapeHtml(r.name)}</h4><p><strong>Ingredients:</strong><br>${escapeHtml(r.ingredients).replace(/\n/g,'<br>')}</p><p><strong>Instructions:</strong><br>${escapeHtml(r.steps).replace(/\n/g,'<br>')}</p><div class="recipe-meta"><div class="cost">💰 ${fmt.format(r.cost)}</div><div class="rating">${stars}</div></div><div class="recipe-actions"><button class="btn" onclick="deleteRecipe(${r.id})"><i class="fa-solid fa-trash"></i></button></div>`;
    c.appendChild(card);
  });
}

function renderFiltered(){
  const q=(document.getElementById('search-input').value||'').toLowerCase();
  const sort=document.getElementById('sort-select').value;
  let r=getRecipes();
  if(q)r=r.filter(x=>(x.name||'').toLowerCase().includes(q));
  if(sort==='cost-asc')r.sort((a,b)=>(a.cost||0)-(b.cost||0));
  else if(sort==='cost-desc')r.sort((a,b)=>(b.cost||0)-(a.cost||0));
  else if(sort==='rating-desc')r.sort((a,b)=>(b.rating||0)-(a.rating||0));
  else r.sort((a,b)=>b.id-a.id);
  renderSummary(r);
  renderRecipes(r);
}

function renderAll(){renderFiltered();}

document.addEventListener('DOMContentLoaded',()=>{
  const loggedIn=localStorage.getItem('isLoggedIn')==='true';
  if(loggedIn){showMainUI();renderAll();}
  else showLoginUI();
});
