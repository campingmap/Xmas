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
 d.records.forEach(r=>{const card=document.createElement('section');card.className='registration-note';const title=document.createElement('h2');title.style.fontSize='19px';title.textContent=({test:'문자 전송 테스트 · 합산 제외',confirmed:'입금 자동 확인',partial:'부분 입금 · 추가 입금 대기',refund_review:'환불 운영진 확인 필요',overpaid:'초과 입금 · 확인 필요',ambiguous:'동명이인 · 관리자 확인 필요',unmatched:'일치 신청 없음'})[r.status]||'확인 필요';card.append(title);const text=document.createElement('p');text.style.whiteSpace='pre-line';text.textContent=`${r.time} · ${r.sender}\n${Number(r.amount).toLocaleString('ko-KR')}원 · 계좌 끝번호 ${r.account}\n${(r.candidates||[]).map(c=>`${c.name} / ${c.nickname} (${c.matchedBy})${c.submittedAt ? `\n신청 ${new Date(c.submittedAt).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})} · 입금까지 약 ${c.minutesBeforeDeposit}분${c.timePriority ? ' · 시간상 우선 후보' : ''}` : ''}`).join('\n')||'대조 가능한 신청 없음'}${r.totalPaid ? `\n누적 입금 ${Number(r.totalPaid).toLocaleString('ko-KR')}원 / 예정 ${Number(r.expectedAmount).toLocaleString('ko-KR')}원${r.remaining ? ` · 잔액 ${Number(r.remaining).toLocaleString('ko-KR')}원` : ''}` : ''}${r.status==='ambiguous' ? '\n시간상 우선 후보는 참고 정보이며 자동 확정하지 않습니다.' : ''}${r.repeats?`\n같은 내용 재수신 ${r.repeats}회 · 실제 거래 확인 필요`:''}`;card.append(text);list.append(card);});
});
