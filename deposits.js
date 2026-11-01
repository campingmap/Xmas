'use strict';
const depositForm=document.getElementById('deposit-admin');
const depositStatus=document.getElementById('deposit-status');
let depositNonce='';let depositTimer;
depositForm.addEventListener('submit',()=>{depositNonce=crypto.randomUUID();depositForm.elements.nonce.value=depositNonce;depositForm.action=CAMP_LOOKUP_URL;depositForm.querySelector('button').disabled=true;depositStatus.textContent='입금 내역을 확인하고 있습니다.';clearTimeout(depositTimer);depositTimer=setTimeout(()=>{depositNonce='';depositForm.querySelector('button').disabled=false;depositStatus.textContent='조회가 지연됩니다. 잠시 후 다시 확인해 주세요.';},25000);});
window.addEventListener('message',event=>{
 if(!/^https:\/\/[a-z0-9-]+(?:-script|\.script)\.googleusercontent\.com$/.test(event.origin)&&event.origin!=='https://script.google.com')return;
 const d=event.data;if(!depositNonce||!d||d.type!=='xmas-deposits'||d.nonce!==depositNonce)return;
 clearTimeout(depositTimer);depositNonce='';depositForm.querySelector('button').disabled=false;
 const list=document.getElementById('deposit-records');list.replaceChildren();
 if(!d.ok||!Array.isArray(d.records)){depositStatus.textContent='조회키를 확인해 주세요.';return;}
 depositStatus.textContent=`감지된 입금 ${d.records.length}건`;
 d.records.forEach(r=>{const card=document.createElement('section');card.className='registration-note';const title=document.createElement('h2');title.style.fontSize='19px';title.textContent=({confirmed:'입금 자동 확인',ambiguous:'여러 신청 일치 · 확인 필요',unmatched:'일치 신청 없음'})[r.status]||'확인 필요';card.append(title);const text=document.createElement('p');text.style.whiteSpace='pre-line';text.textContent=`${r.time} · ${r.sender}\n${Number(r.amount).toLocaleString('ko-KR')}원 · 계좌 끝번호 ${r.account}\n${(r.candidates||[]).map(c=>`${c.name} / ${c.nickname} (${c.matchedBy})`).join('\n')||'대조 가능한 신청 없음'}${r.repeats?`\n같은 내용 재수신 ${r.repeats}회 · 실제 거래 확인 필요`:''}`;card.append(text);list.append(card);});
});
