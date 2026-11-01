'use strict';
// Set after the form owner's web app deployment is authorized.
const LOOKUP_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwf7RC4OYH2NgjxlItgN3kA1UUuKLUtV69xbcMzCTrzV7A4jBhjL3qnY53YbY6lMVJJyw/exec';
const lookup = document.getElementById('lookup-form');
const status = document.getElementById('lookup-status');
const results = document.getElementById('lookup-results');
const phone = document.getElementById('lookup-phone');
let currentNonce = '';
let lookupTimer;
phone.addEventListener('input', () => { phone.value = phone.value.replace(/\D/g, '').slice(0, 11); });
function finishLookup(message) {
  clearTimeout(lookupTimer);
  lookup.querySelector('button').disabled = false;
  lookup.removeAttribute('aria-busy');
  status.textContent = message;
}
lookup.addEventListener('submit', event => {
  event.preventDefault();
  results.replaceChildren();
  document.getElementById('lookup-payment').hidden = true;
  document.getElementById('lookup-account-status').textContent = '';
  if (!LOOKUP_ENDPOINT) {
    event.preventDefault();
    status.textContent = '신청 내역 조회 연결을 준비 중입니다. 아래 호캠프 Q&A 게시판으로 문의해 주세요.';
    return;
  }
  currentNonce = crypto.randomUUID();
  lookup.elements.nonce.value = currentNonce;
  lookup.action = LOOKUP_ENDPOINT;
  lookup.querySelector('button').disabled = true;
  lookup.setAttribute('aria-busy', 'true');
  status.textContent = '신청 내역을 확인하고 있습니다.';
  const nonce=currentNonce;
  fetch(LOOKUP_ENDPOINT,{method:'POST',body:new URLSearchParams({name:lookup.elements.name.value.trim(),phone:phone.value,nonce,transport:'json'}),credentials:'omit'}).then(response=>{if(!response.ok)throw new Error('lookup_failed');return response.json();}).then(data=>receiveLookup(data)).catch(()=>{if(currentNonce===nonce)finishLookup('조회 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.');});
  lookupTimer = setTimeout(() => {
    currentNonce = '';
    finishLookup('조회 시간이 초과되었습니다. 잠시 후 다시 확인해 주세요.');
  }, 30000);
});
window.addEventListener('message', event => {
  if (!/^https:\/\/[a-z0-9-]+(?:-script|\.script)\.googleusercontent\.com$/.test(event.origin) && event.origin !== 'https://script.google.com') return;
  receiveLookup(event.data);
});
function receiveLookup(data) {
  if (!currentNonce || !data || data.type !== 'xmas-lookup' || data.nonce !== currentNonce) return;
  currentNonce = '';
  if (!data.ok || !Array.isArray(data.records)) { finishLookup('조회할 수 없습니다. 잠시 후 다시 시도해 주세요.'); return; }
  finishLookup(data.records.length ? `${data.records.length}건의 신청 내역을 확인했습니다.` : data.message);
  document.getElementById('lookup-payment').hidden = data.records.length === 0;
  data.records.forEach(record => {
    const card = document.createElement('section'); card.className = 'registration-note';
    const heading = document.createElement('h2'); heading.style.fontSize = '20px'; heading.textContent = record.status; card.append(heading);
    const list = document.createElement('dl'); list.className = 'join-details';
    [['신청 일시',record.date],['숙소',record.lodging],['추가 차량',record.extraVehicles || '미기재'],['가족 인원',`성인 ${record.adults}명 · 아동 ${record.children}명`],['도착 예정',record.arrival],['입금 예정 금액',record.amount]].forEach(([label,value]) => {
      const row = document.createElement('div'); const dt = document.createElement('dt'); dt.textContent = label; const dd = document.createElement('dd'); dd.textContent = value; row.append(dt,dd); list.append(row);
    });
    if (record.paidAmount > 0) {
      const paid = document.createElement('p');
      paid.textContent = `누적 입금 ${Number(record.paidAmount).toLocaleString('ko-KR')}원 · ${record.paymentCount || 1}회 입금${record.remainingAmount > 0 ? ` · 추가 입금할 금액 ${Number(record.remainingAmount).toLocaleString('ko-KR')}원` : ''}`;
      card.append(paid);
    }
    card.append(list); const note = document.createElement('p'); note.textContent = record.paymentConfirmed ? '입금 문자와 신청 정보가 일치하여 입금 확인되었습니다.' : record.remainingAmount > 0 ? '부족한 금액을 추가 입금해 주세요. 합산 금액 확인 후 참가가 확정됩니다.' : '신청 접수 내역입니다. 입금 확인 전에는 참가가 확정되지 않습니다.'; card.append(note);
    if(record.refundAmount>0){note.textContent='신청 변경으로 '+Number(record.refundAmount).toLocaleString('ko-KR')+'원의 환불 확인이 필요합니다. 운영진이 확인 후 처리합니다.';}
    if(record.editRevision){card.append(Object.assign(document.createElement('p'),{className:'fine-print',textContent:'신청 수정 '+record.editRevision+'회 · 최신 내용'}));}
    attachApplicationEditor(card,record,{name:lookup.elements.name.value.trim(),phone:phone.value}); results.append(card);
  });
}

document.getElementById('lookup-account-info').textContent = `${CAMP_PAYMENT.bank} · ${CAMP_PAYMENT.holder}\n${CAMP_PAYMENT.account}`;
document.getElementById('copy-lookup-account').addEventListener('click', async () => {
  const accountStatus = document.getElementById('lookup-account-status');
  try { await navigator.clipboard.writeText(CAMP_PAYMENT.account); accountStatus.textContent = '계좌번호를 복사했습니다.'; }
  catch { accountStatus.textContent = `계좌번호 ${CAMP_PAYMENT.account}을 직접 복사해 주세요.`; }
});
