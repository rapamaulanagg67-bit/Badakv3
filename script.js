const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
const intro=$("#intro"), app=$("#app"), video=$("#introVideo"), music=$("#bgMusic");
video.src="media/intro.mp4"; music.src="media/music.mp3";
let musicOn=false, selected=0;
let history=JSON.parse(localStorage.getItem("badakHistory")||"[]");
let profile=JSON.parse(localStorage.getItem("badakProfile")||'{"name":"BADAK USER","photo":""}');
$("#profileName").textContent=profile.name;
if(profile.photo) $("#profilePhoto").src=profile.photo;
$("#lastLogin").textContent=localStorage.getItem("badakLastLogin")||new Date().toLocaleString("id-ID");
localStorage.setItem("badakLastLogin",new Date().toLocaleString("id-ID"));

function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("toastShow");clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove("toastShow"),2200)}
async function startMusic(){if(!musicOn)return;try{await music.play()}catch(e){toast("Tekan tombol MUSIK untuk menyalakan audio.")}}
function enterApp(){
  if(intro.classList.contains("hidden")) return;
  intro.classList.add("hidden"); app.classList.remove("hidden"); app.animate([{opacity:0,transform:"scale(.97)"},{opacity:1,transform:"scale(1)"}],{duration:650,easing:"cubic-bezier(.2,.8,.2,1)"});
  startMusic(); renderHistory(); updateStats(); buildLudo(); buildChess();
}
let start=performance.now(), duration=15000;
function introTick(now){
  const p=Math.min((now-start)/duration,1);
  $("#introProgress").style.width=(p*100)+"%";
  $("#introSeconds").textContent=Math.max(0,Math.ceil((1-p)*15));
  if(p>=1) enterApp(); else requestAnimationFrame(introTick)
}
requestAnimationFrame(introTick);
$("#skipBtn").onclick=enterApp;
$("#musicBtn").onclick=async()=>{musicOn=!musicOn;$("#musicBtn").textContent=musicOn?"🔊 MUSIK":"🔇 MUSIK";if(musicOn){try{await music.play()}catch(e){toast("Browser memblokir autoplay. Tekan lagi.");}}else music.pause()};

function nav(page){
  $$(".page").forEach(p=>p.classList.toggle("active",p.id===page));
  $$(".navItem").forEach(n=>n.classList.toggle("active",n.dataset.page===page));
  $$(".sideItem[data-page]").forEach(n=>n.classList.toggle("active",n.dataset.page===page));
  $("#sideMenu").classList.remove("open");$("#backdrop").classList.remove("open");
  window.scrollTo({top:0,behavior:"smooth"});
}
$$("[data-page]").forEach(b=>b.onclick=()=>nav(b.dataset.page));
$("#menuBtn").onclick=()=>{$("#sideMenu").classList.add("open");$("#backdrop").classList.add("open")};
$("#closeMenu").onclick=$("#backdrop").onclick=()=>{$("#sideMenu").classList.remove("open");$("#backdrop").classList.remove("open")};
$("#profileQuick").onclick=()=>nav("profile");
function clock(){const d=new Date();$("#clock").textContent=d.toLocaleTimeString("id-ID");$("#date").textContent=d.toLocaleDateString("id-ID",{weekday:"long",day:"2-digit",month:"long",year:"numeric"})}clock();setInterval(clock,1000);

$$(".badakGrid button").forEach(b=>b.onclick=()=>{$$(".badakGrid button").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");selected=+b.dataset.count});
$("#confirmBtn").onclick=()=>{
 const number=$("#numberInput").value.replace(/\D/g,"");
 if(number.length<8)return toast("Masukkan nomor yang valid terlebih dahulu.");
 if(!selected)return toast("Silahkan pilih salah satu jumlah Badak.");
 $("#successBox").classList.add("hidden");$("#processBox").classList.remove("hidden");$("#confirmBtn").disabled=true;
 let p=0;$("#processProgress").style.width="0%";$("#percent").textContent="0%";
 const timer=setInterval(()=>{p+=2;$("#processProgress").style.width=p+"%";$("#percent").textContent=p+"%";if(p>=100){clearInterval(timer);finishProcess(number)}},45);
};
function finishProcess(number){
 $("#processBox").classList.add("hidden");$("#successBox").classList.remove("hidden");$("#confirmBtn").disabled=false;
 history.unshift({number,count:selected,status:"SUKSES",time:new Date().toLocaleString("id-ID")});
 history=history.slice(0,50);localStorage.setItem("badakHistory",JSON.stringify(history));
 $("#successText").textContent=`${selected} BADAK untuk ${number} berhasil diproses.`;
 renderHistory();updateStats();toast("BADAK SUKSES ✅");
}
function updateStats(){
 const ok=history.filter(x=>x.status==="SUKSES").length, fail=history.filter(x=>x.status==="GAGAL").length;
 $("#successCount").textContent=ok;$("#failCount").textContent=fail;$("#totalCount").textContent=history.length;
}
function renderHistory(){
 const box=$("#historyList"); if(!history.length){box.innerHTML='<div class="empty">Belum ada riwayat Badak.</div>';return}
 box.innerHTML=history.map(x=>`<div class="historyItem"><div><b>${x.count} BADAK • ${x.number}</b><small>${x.time}</small></div><b class="${x.status==="SUKSES"?"ok":"fail"}">${x.status==="SUKSES"?"✓ SUKSES":"✕ GAGAL"}</b></div>`).join("");
}
$("#clearHistory").onclick=()=>{history=[];localStorage.removeItem("badakHistory");renderHistory();updateStats();toast("Riwayat dibersihkan.")};

$("#changeNameBtn").onclick=()=>{const n=prompt("Masukkan nama baru:",profile.name);if(n&&n.trim()){profile.name=n.trim();localStorage.setItem("badakProfile",JSON.stringify(profile));$("#profileName").textContent=profile.name;toast("Nama berhasil diubah.")}};
$("#changePhotoBtn").onclick=()=>$("#photoInput").click();
$("#photoInput").onchange=e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{profile.photo=r.result;localStorage.setItem("badakProfile",JSON.stringify(profile));$("#profilePhoto").src=r.result;toast("Foto profil berhasil diubah.")};r.readAsDataURL(f)};
$("#logoutBtn").onclick=()=>{if(confirm("Keluar dari BADAK APPS?")){toast("Logout demo.");nav("dashboard")}};

// Game tabs
$$(".gameTab").forEach(btn=>btn.onclick=()=>{$$(".gameTab").forEach(b=>b.classList.remove("active"));btn.classList.add("active");$("#ludoGame").classList.toggle("hidden",btn.dataset.game!=="ludo");$("#chessGame").classList.toggle("hidden",btn.dataset.game!=="chess")});

// LUDO visual board — 15x15 colorful board
const ludo=document.querySelector("#ludoBoard");
function buildLudo(){
  ludo.innerHTML="";
  for(let r=0;r<15;r++){
    for(let c=0;c<15;c++){
      const cell=document.createElement("div"); cell.className="ludoCell";
      const inTL=r<6&&c<6, inTR=r<6&&c>8, inBL=r>8&&c<6, inBR=r>8&&c>8;
      if(inTL||inTR||inBL||inBR){
        cell.classList.add("ludoHome", inTL?"red":inTR?"green":inBL?"blue":"yellow");
        // Four home circles
        if((r===2&&c===2)||(r===2&&c===12)||(r===12&&c===2)||(r===12&&c===12)){
          cell.innerHTML='<div class="homeInner">'+(inTL?"🔴":inTR?"🟢":inBL?"🔵":"🟡")+'</div>';
        }
      } else if(r>=6&&r<=8&&c>=6&&c<=8){
        cell.className="ludoCell ludoCenter"; if(r===7&&c===7)cell.textContent="🦏";
      } else {
        // Cross-shaped playing path
        cell.classList.add("path");
        if(r>=6&&r<=8) cell.classList.add(r===7?"red":"green");
        if(c>=6&&c<=8) cell.classList.add(c===7?"blue":"yellow");
      }
      ludo.appendChild(cell);
    }
  }
}
let ludoPlayer=0, ludoColors=["Merah","Hijau","Biru","Kuning"];
$("#rollDice").onclick=()=>{const n=1+Math.floor(Math.random()*6);$("#diceResult").textContent=n; ludoPlayer=(ludoPlayer+1)%4;$("#ludoTurn").textContent="Giliran "+ludoColors[ludoPlayer];toast("Dadu: "+n+" • giliran berikutnya");};
$("#ludoReset").onclick=()=>{ludoPlayer=0;$("#ludoTurn").textContent="Giliran Merah";$("#diceResult").textContent="-";buildLudo()};

// CHESS
const initial=[
["♜","♞","♝","♛","♚","♝","♞","♜"],["♟","♟","♟","♟","♟","♟","♟","♟"],
["","","","","","","",""],["","","","","","","",""],["","","","","","","",""],["","","","","","","",""],
["♙","♙","♙","♙","♙","♙","♙","♙"],["♖","♘","♗","♕","♔","♗","♘","♖"]];
let board=JSON.parse(JSON.stringify(initial)), turn="white", selectedSquare=null;
const whitePieces="♙♖♘♗♕♔", blackPieces="♟♜♞♝♛♚";
function buildChess(){
 const b=$("#chessBoard");b.innerHTML="";
 board.forEach((row,r)=>row.forEach((piece,c)=>{const s=document.createElement("button");s.className="chessSquare "+((r+c)%2?"dark":"light");s.dataset.r=r;s.dataset.c=c;if(selectedSquare&&selectedSquare.r===r&&selectedSquare.c===c)s.classList.add("selected");if(piece)s.innerHTML=`<span class="piece">${piece}</span>`;s.onclick=()=>chessClick(r,c);b.appendChild(s)}));
 $("#chessTurn").textContent=turn==="white"?"Giliran Putih":"Giliran Hitam";
}
function colorOf(p){return whitePieces.includes(p)?"white":blackPieces.includes(p)?"black":null}
function chessClick(r,c){
 const p=board[r][c];
 if(selectedSquare){
   const sr=selectedSquare.r,sc=selectedSquare.c,sp=board[sr][sc];
   if(isLegalBasic(sr,sc,r,c,sp)&&(!p||colorOf(p)!==turn)){
     board[r][c]=sp;board[sr][sc]="";turn=turn==="white"?"black":"white";selectedSquare=null;buildChess();return;
   }
   if(p&&colorOf(p)===turn){selectedSquare={r,c};buildChess();return}
   selectedSquare=null;buildChess();return;
 }
 if(p&&colorOf(p)===turn){selectedSquare={r,c};buildChess()}
}
function isLegalBasic(sr,sc,r,c,p){
 const dr=r-sr,dc=c-sc, adR=Math.abs(dr),adC=Math.abs(dc),type=p.toLowerCase();
 if(type==="♟"){const dir=turn==="white"?-1:1;return (dc===0&&!board[r][c]&&dr===dir)||(dc===0&&!board[r][c]&&dr===2*dir&&sr===(turn==="white"?6:1)&&!board[sr+dir][sc])||(adC===1&&dr===dir&&board[r][c])}
 if(type==="♜")return (sr===r||sc===c)&&clearLine(sr,sc,r,c);
 if(type==="♝")return adR===adC&&clearLine(sr,sc,r,c);
 if(type==="♛")return (sr===r||sc===c||adR===adC)&&clearLine(sr,sc,r,c);
 if(type==="♚")return adR<=1&&adC<=1;
 if(type==="♞")return (adR===2&&adC===1)||(adR===1&&adC===2);
 return false;
}
function clearLine(sr,sc,r,c){const dr=Math.sign(r-sr),dc=Math.sign(c-sc);let x=sr+dr,y=sc+dc;while(x!==r||y!==c){if(board[x][y])return false;x+=dr;y+=dc}return true}
$("#chessReset").onclick=()=>{board=JSON.parse(JSON.stringify(initial));turn="white";selectedSquare=null;buildChess()};

buildLudo();buildChess();renderHistory();updateStats();
