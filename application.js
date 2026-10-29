'use strict';
// Set after the form owner's web app deployment is authorized.
const LOOKUP_ENDPOINT = '';
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
  results.replaceChildren();
  if (!LOOKUP_ENDPOINT) {
    event.preventDefault();
    status.textContent = '신청 내역 조회 연결을 준비 중입니다. 운영진에게 문의해 주세요.';
    return;
  }
  currentNonce = crypto.randomUUID();
  lookup.elements.nonce.value = currentNonce;
  lookup.action = LOOKUP_ENDPOINT;
  lookup.querySelector('button').disabled = true;
  lookup.setAttribute('aria-busy', 'true');
  status.textContent = '신청 내역을 확인하고 있습니다.';
  lookupTimer = setTimeout(() => {
    currentNonce = '';
    finishLookup('조회 시간이 초과되었습니다. 잠시 후 다시 확인해 주세요.');
  }, 30000);
});
window.addEventListener('message', event => {
  if (!/^https:\/\/(?:[a-z0-9-]+\.)?script\.googleusercontent\.com$/.test(event.origin) && event.origin !== 'https://script.google.com') return;
  const data = event.data;
  if (!currentNonce || !data || data.type !== 'xmas-lookup' || data.nonce !== currentNonce) return;
  currentNonce = '';
  if (!data.ok || !Array.isArray(data.records)) { finishLookup('조회할 수 없습니다. 잠시 후 다시 시도해 주세요.'); return; }
  finishLookup(data.records.length ? `${data.records.length}건의 신청 내역을 확인했습니다.` : data.message);
  data.records.forEach(record => {
    const card = document.createElement('section'); card.className = 'registration-note';
    const heading = document.createElement('h2'); heading.style.fontSize = '20px'; heading.textContent = record.status; card.append(heading);
    const list = document.createElement('dl'); list.className = 'join-details';
    [['신청 일시',record.date],['숙소',record.lodging],['가족 인원',`성인 ${record.adults}명 · 아동 ${record.children}명`],['도착 예정',record.arrival],['입금 예정 금액',record.amount]].forEach(([label,value]) => {
      const row = document.createElement('div'); const dt = document.createElement('dt'); dt.textContent = label; const dd = document.createElement('dd'); dd.textContent = value; row.append(dt,dd); list.append(row);
    });
    card.append(list); const note = document.createElement('p'); note.textContent = '신청 접수 내역입니다. 입금 확인 및 참가 확정 여부는 운영진에게 문의해 주세요.'; card.append(note); results.append(card);
  });
});
