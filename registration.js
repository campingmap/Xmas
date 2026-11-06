'use strict';
const form = document.getElementById('application');
const fields = document.getElementById('fields');
const money = value => `${value.toLocaleString('ko-KR')}원`;
function element(tag, attributes = {}, text = '') {
  const node = document.createElement(tag);
  Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
  node.textContent = text;
  return node;
}
function choice(entry, value, type) {
  const label = element('label', { class: 'choice' });
  const input = element('input', { type, name: `entry.${entry.id}`, value });
  // Consent choices are mutually exclusive; preserve their exact Google values.
  if (entry.required && type === 'radio') input.required = true;
  const text = element('span', {}, value);
  if (entry.id === 1592266769 && value === '캠핑카 / 카라반 / 캠핑 트레일러') {
    text.textContent = `${value} 사이트`;
    text.append(element('small', {class: 'choice-note'}, '숙소가 아닌 캠핑 사이트입니다. 개인 캠핑카·카라반·캠핑 트레일러를 가져오시는 분만 신청할 수 있습니다.'));
  }
  label.append(input, text);
  return label;
}
registrationFields.forEach(question => {
  const field = element('fieldset', { class: 'form-field' });
  const required = question.entries.some(entry => entry.required);
  const legend = element('legend', {}, question.title);
  if (required) legend.append(element('span', { class: 'required' }, ' *'));
  field.append(legend);
  if (question.entries[0].id === 1912926423 && !question.description) field.append(element('p', { class: 'field-description' }, '입금자명과 동일하게 작성해 주세요. 관리자가 신청자와 입금 내역을 대조할 때 사용합니다.'));
  if (question.description) field.append(element('p', { class: 'field-description' }, question.description));
  const group = element('div');
  question.entries.forEach(entry => {
    const name = `entry.${entry.id}`;
    const attrs = { name, id: name };
    if (entry.required) attrs.required = '';
    if (question.type === 7) {
      field.id = 'family-size';
      field.classList.add('family-field');
      const row = element('fieldset', { class: 'person-count' });
      row.append(element('legend', {}, entry.row));
      const options = element('div', { class: 'count-options' });
      entry.options.forEach(value => {
        const label = choice(entry, value, 'radio');
        label.querySelector('span').textContent = `${value}명`;
        options.append(label);
      });
      row.append(options); group.append(row);
    } else if (question.type === 3) {
      const label = element('label', { for: name }, entry.row);
      const select = element('select', { ...attrs, 'aria-label': entry.row || question.title });
      select.append(element('option', { value: '' }, '선택해 주세요'));
      entry.options.forEach(value => select.append(element('option', { value }, value)));
      label.append(select); group.append(label);
      if (question.type === 7) group.className = 'counts';
    } else if (question.type === 2 || question.type === 4) {
      const consent = [1833005978, 2000713890].includes(entry.id);
      entry.options.forEach(value => group.append(choice(entry, value, question.type === 2 || consent ? 'radio' : 'checkbox')));
    } else if (question.type === 10) {
      const time = element('input', { type: 'time', id: 'arrival', value: '12:00', required: '', 'aria-label': question.title });
      group.append(time);
      ['hour', 'minute'].forEach(part => group.append(element('input', { type: 'hidden', name: `${name}_${part}` })));
    } else {
      const input = element(question.type === 1 ? 'textarea' : 'input', { ...attrs, 'aria-label': question.title });
      if (question.type !== 1) input.type = entry.id === 1239222796 ? 'tel' : 'text';
      const limits = {196725166:100,1912926423:80,372074511:80,1005991624:300,710258770:1500};
      if (limits[entry.id]) input.maxLength = limits[entry.id];
      if (entry.id === 1912926423) input.autocomplete = 'name';
      if (entry.id === 1244916950) {
        input.type = 'email'; input.autocomplete = 'email'; input.inputMode = 'email'; input.maxLength = 254; input.pattern = '[^\\s@]+@[^\\s@]+\\.[^\\s@]+'; input.placeholder = 'name@naver.com';
        input.addEventListener('blur', () => { input.value = input.value.trim(); });
      }
      if (entry.id === 1239222796) {
        CAMP_CONTACT.configurePhone(input); input.placeholder = '01012345678';
        if (!question.description) group.append(element('p', { class: 'field-description' }, '연락처는 하이픈(-) 없이 숫자만 입력해 주세요. 예: 01012345678'));
      }
      group.append(input);
    }
  });
  field.append(group); fields.append(field);
  if (question.entries[0].id === 372074511) {
    const extra = element('div', { class: 'form-field' });
    const label = element('label', { for: 'extra-cars' }, '추가 차량 수 · 기본 1대 외');
    const select = element('select', { id: 'extra-cars', name: 'entry.126976328', required: '' });
    for (let n = 0; n <= 2; n++) {
      const label = n === 0 ? '차량추가 없음 (기본 차량 1대)' : `${n}대 추가 (총 ${n + 1}대)`;
      select.append(element('option', { value: label }, label));
    }
    label.append(select); extra.append(label, element('p', { class: 'field-description' }, '기본 차량 1대가 포함되어 있습니다. 추가 차량은 1대당 10,000원입니다.')); fields.append(extra);
  }
});
const lodgingOptions = registrationFields.find(q => q.entries[0].id === 1592266769).entries[0].options;
const basePrices = [180000, 180000, 190000, 480000];
function calculate() {
  const data = new FormData(form);
  const index = lodgingOptions.indexOf(data.get('entry.1592266769'));
  const adults = data.get('entry.1357739873');
  const children = data.get('entry.1724175323');
  const includedPeople = index === 3 ? 4 : 2;
  const extraAdults = Math.max(0, Number(adults) - includedPeople);
  const extraChildren = Math.max(0, Number(children) - includedPeople);
  const extraPeople = extraAdults + extraChildren;
  const rate = index >= 3 ? 20000 : 10000;
  const extraCars = Math.max(0, document.getElementById('extra-cars').selectedIndex - (index === 3 ? 1 : 0));
  const base = basePrices[index] || 0;
  return { index, adults, children, extraAdults, extraChildren, extraPeople, rate, extraCars, base, total: base + extraPeople * rate + extraCars * 10000 };
}
function updatePrice() {
  const p = calculate();
  const lines = document.getElementById('price-lines'); lines.replaceChildren();
  if (p.index >= 0) {
    [['숙박 기본 요금 (2박 3일)', money(p.base)], [`추가 인원 ${p.extraPeople}명 × ${money(p.rate)}`, money(p.extraPeople * p.rate)], [`추가 차량 ${p.extraCars}대 × 10,000원`, money(p.extraCars * 10000)]].forEach(([title, amount]) => {
      const row = element('div'); row.append(element('dt', {}, title), element('dd', {}, amount)); lines.append(row);
    });
  }
  document.getElementById('total').textContent = p.index < 0 ? '숙소 선택 필요' : p.adults == null || p.children == null || p.adults === '' || p.children === '' ? '인원 선택 필요' : money(p.total);
  document.getElementById('price-warning').textContent = '모든 숙소는 성인 2명 + 아동 2명 기준입니다. 각각 2명을 넘는 인원에 추가 요금을 계산합니다. 다자녀 한 가족 면제는 추후 적용 예정이며 현재 금액에는 반영되지 않습니다.';
}
form.addEventListener('input', updatePrice);
form.addEventListener('change', updatePrice);
let submitting = false;
let submissionAttempt = 0;
const submitButton = form.querySelector('[type=submit]');
const submitButtonLabel = submitButton.textContent;
const pendingReceiptKey = 'xmas-pending-receipt';
let pendingReceipt = null;
function lockSubmission(label) {
  submitting = true;
  submitButton.disabled = true;
  submitButton.textContent = label;
  submitButton.setAttribute('aria-busy', 'true');
  form.setAttribute('aria-busy', 'true');
}
function readPendingReceipt() {
  if (pendingReceipt) return pendingReceipt;
  try {
    const saved = JSON.parse(sessionStorage.getItem(pendingReceiptKey) || 'null');
    if (saved && typeof saved.reference === 'string' && typeof saved.name === 'string' && /^\d{10,11}$/.test(saved.phone) && Array.isArray(saved.details)) pendingReceipt = saved;
  } catch { /* The in-memory lock still protects this page when storage is unavailable. */ }
  return pendingReceipt;
}
async function checkExistingApplication(name, phone) {
  const nonce = crypto.randomUUID();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(CAMP_LOOKUP_URL, {
      method: 'POST', credentials: 'omit', signal: controller.signal,
      body: new URLSearchParams({action: 'registration-check', name, phone, nonce, transport: 'json'})
    });
    if (!response.ok) throw new Error('duplicate_check_failed');
    const result = await response.json();
    if (!result || result.type !== 'xmas-lookup' || result.nonce !== nonce || !result.ok || typeof result.exists !== 'boolean') throw new Error('duplicate_check_failed');
    return result.exists;
  } finally { clearTimeout(timer); }
}
function releaseSubmission() {
  submitting = false;
  submitButton.disabled = false;
  submitButton.textContent = submitButtonLabel;
  submitButton.removeAttribute('aria-busy');
  form.removeAttribute('aria-busy');
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (submitting || readPendingReceipt()) return;
  const status = document.getElementById('form-status'); status.textContent = '';
  const p = calculate();
  if (Number(p.adults) + Number(p.children) === 0) { status.textContent = '참가 인원을 1명 이상 선택해 주세요.'; return; }
  if (new FormData(form).get('entry.2000713890') !== '동의') { status.textContent = '촬영 비동의 시 참가 신청을 진행할 수 없습니다.'; return; }
  const name = form.elements.namedItem('entry.1912926423').value.trim();
  const phone = form.elements.namedItem('entry.1239222796').value;
  const attempt = ++submissionAttempt;
  lockSubmission('신청 처리 중…');
  status.textContent = '이미 접수된 신청이 있는지 확인하고 있습니다. 잠시만 기다려 주세요.';
  try {
    const existing = await checkExistingApplication(name, phone);
    if (attempt !== submissionAttempt) return;
    if (existing) {
      status.textContent = '같은 성함과 연락처로 이미 접수된 신청이 있습니다. 새로 제출하지 마시고 기존 신청을 조회한 뒤 수정해 주세요. 별도 가족의 추가 신청이 필요하면 호캠프 Q&A 게시판으로 문의해 주세요.';
      if (!document.getElementById('existing-application-link')) status.after(element('a', {id:'existing-application-link', class:'button lookup-link', href:'application.html'}, '기존 신청 확인·수정하기 ↗'));
      releaseSubmission();
      return;
    }
  } catch {
    if (attempt !== submissionAttempt) return;
    status.textContent = '기존 신청 여부를 확인하지 못해 아직 제출하지 않았습니다. 입력 내용은 그대로 유지됩니다. 잠시 후 다시 제출해 주세요.';
    releaseSubmission();
    return;
  }
  // Recheck after the asynchronous lookup: the participant may have edited a field.
  if (!form.reportValidity()) { releaseSubmission(); status.textContent = '입력 내용을 확인한 후 다시 제출해 주세요.'; return; }
  if (name !== form.elements.namedItem('entry.1912926423').value.trim() || phone !== form.elements.namedItem('entry.1239222796').value) { releaseSubmission(); status.textContent = '성함 또는 연락처가 변경되었습니다. 다시 제출해 신청 여부를 확인해 주세요.'; return; }
  const currentPrice = calculate();
  if (Number(currentPrice.adults) + Number(currentPrice.children) === 0 || new FormData(form).get('entry.2000713890') !== '동의') { releaseSubmission(); status.textContent = '참가 인원과 촬영 동의 항목을 확인해 주세요.'; return; }
  const reference = crypto.randomUUID();
  const [hour, minute] = document.getElementById('arrival').value.split(':');
  form.elements.namedItem('entry.782972763_hour').value = String(Number(hour));
  form.elements.namedItem('entry.782972763_minute').value = String(Number(minute));
  const submittedData = new FormData(form);
  const submittedDetails = registrationFields.map(question => ({label: question.title, value: question.type === 10 ? document.getElementById('arrival').value : question.entries.map(entry => { const values = submittedData.getAll(`entry.${entry.id}`); return entry.row ? `${entry.row}: ${values.join(' · ')}` : values.join(' · '); }).join(' · ') || '미작성'}));
  submittedDetails.push({label: '추가 차량', value: document.getElementById('extra-cars').value});
  const memo = form.elements.namedItem('entry.710258770');
  // A separate hidden value preserves the user's memo if navigation fails or they return.
  memo.disabled = true;
  form.querySelector('[data-calculated-memo]')?.remove();
  form.append(element('input', { type: 'hidden', name: 'entry.710258770', 'data-calculated-memo': '', value: `${memo.value}\n\n[홈페이지 자동 계산]\n기본 ${money(currentPrice.base)} / 추가 성인 ${currentPrice.extraAdults}명·아동 ${currentPrice.extraChildren}명: ${money(currentPrice.extraPeople * currentPrice.rate)} / 추가 차량 ${currentPrice.extraCars}대: ${money(currentPrice.extraCars * 10000)}\n입금 예정 금액: ${money(currentPrice.total)} (다자녀 면제 미반영)\n[접수 확인 코드: ${reference}]` }));
  // Persist before sending: reload/back must verify this receipt, never send it again.
  pendingReceipt = {reference, name, phone, details: submittedDetails};
  try { sessionStorage.setItem(pendingReceiptKey, JSON.stringify(pendingReceipt)); } catch { /* Keep the in-memory lock. */ }
  document.getElementById('existing-application-link')?.remove();
  startConfirmation(reference, name, phone, submittedDetails);
  status.textContent = '신청서를 제출하고 있습니다. 잠시 후 접수 결과를 확인해 주세요.';
  HTMLFormElement.prototype.submit.call(form);
});
window.addEventListener('pageshow', () => {
  ++submissionAttempt;
  const pending = readPendingReceipt();
  if (pending) {
    lockSubmission('신청 접수 확인 중…');
    document.getElementById('form-status').textContent = '이미 제출한 신청의 접수 결과를 확인하고 있습니다. 신청서는 다시 전송하지 않습니다.';
    if (!verification || verification.reference !== pending.reference) startConfirmation(pending.reference, pending.name, pending.phone, pending.details);
    return;
  }
  releaseSubmission();
  form.querySelector('[data-calculated-memo]')?.remove();
  form.elements.namedItem('entry.710258770').disabled = false;
  document.getElementById('form-status').textContent = '';
});
document.getElementById('copy-account').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(CAMP_PAYMENT.account); document.getElementById('copy-status').textContent = '계좌번호를 복사했습니다.'; }
  catch { document.getElementById('copy-status').textContent = `계좌번호 ${CAMP_PAYMENT.account}을 직접 복사해 주세요.`; }
});
updatePrice();

document.getElementById('registration-account').textContent = `${CAMP_PAYMENT.bank} · ${CAMP_PAYMENT.holder} · ${CAMP_PAYMENT.account}`;
let verification;
let verificationTimeout;
let queryNonce = '';
function startConfirmation(reference, name, phone, details) {
  lockSubmission('신청 접수 확인 중…');
  verification = { reference, name, phone, details, attempts: 0 };
  setTimeout(checkConfirmation, 2500);
}
function checkConfirmation() {
  if (!verification) return;
  if (++verification.attempts > 8) { confirmationDelayed(); return; }
  queryNonce = crypto.randomUUID();
  const nonce=queryNonce;
  clearTimeout(verificationTimeout);
  verificationTimeout=setTimeout(confirmationDelayed,20000);
  fetch(CAMP_LOOKUP_URL,{method:'POST',body:new URLSearchParams({name:verification.name,phone:verification.phone,nonce,transport:'json'}),credentials:'omit'}).then(response=>{if(!response.ok)throw new Error('verification_connection');return response.json();}).then(receiveConfirmation).catch(()=>{if(queryNonce===nonce)confirmationDelayed();});
}
function confirmationDelayed() {
  clearTimeout(verificationTimeout); queryNonce = '';
  submitButton.disabled = true;
  submitButton.textContent = '제출됨 · 접수 확인 필요';
  submitButton.removeAttribute('aria-busy');
  form.removeAttribute('aria-busy');
  document.getElementById('form-status').textContent = '접수 확인이 지연되고 있습니다. 중복 제출하지 마시고 신청 내역 확인하기에서 조회해 주세요.';
  if (!document.getElementById('verification-retry')) {
    const retry = element('button',{type:'button',id:'verification-retry',class:'text-link'},'접수 여부 다시 확인하기');
    retry.addEventListener('click',()=>{if(queryNonce)return; lockSubmission('신청 접수 확인 중…'); verification.attempts=0; document.getElementById('form-status').textContent='접수 여부를 다시 확인하고 있습니다. 신청서는 다시 전송하지 않습니다.'; checkConfirmation();});
    document.getElementById('form-status').after(retry);
  }
}
window.addEventListener('message', event => {
  if (!/^https:\/\/[a-z0-9-]+(?:-script|\.script)\.googleusercontent\.com$/.test(event.origin) && event.origin !== 'https://script.google.com') return;
  receiveConfirmation(event.data);
});
function receiveConfirmation(data) {
  if (!verification || !queryNonce || !data || data.type !== 'xmas-lookup' || data.nonce !== queryNonce) return;
  clearTimeout(verificationTimeout); queryNonce = '';
  if (!data.ok || !Array.isArray(data.records)) { confirmationDelayed(); return; }
  const saved = data.records.find(record => record.reference === verification.reference);
  if (!saved) { setTimeout(checkConfirmation, 4000); return; }
  try {
    sessionStorage.setItem('xmas-confirmed-receipt', JSON.stringify({...saved, details: verification.details}));
    sessionStorage.removeItem(pendingReceiptKey);
    pendingReceipt = null;
  }
  catch { document.getElementById('form-status').textContent='신청이 접수되었습니다. 이 기기에서 완료 내역을 보관할 수 없어 신청 내역 확인하기에서 조회해 주세요.'; return; }
  location.assign('complete.html');
}
