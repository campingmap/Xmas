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
  label.append(input, element('span', {}, value));
  return label;
}
registrationFields.forEach(question => {
  const field = element('fieldset', { class: 'form-field' });
  const required = question.entries.some(entry => entry.required);
  const legend = element('legend', {}, question.title);
  if (required) legend.append(element('span', { class: 'required' }, ' *'));
  field.append(legend);
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
      const time = element('input', { type: 'time', id: 'arrival', required: '', 'aria-label': question.title });
      group.append(time);
      ['hour', 'minute'].forEach(part => group.append(element('input', { type: 'hidden', name: `${name}_${part}` })));
    } else {
      const input = element(question.type === 1 ? 'textarea' : 'input', { ...attrs, 'aria-label': question.title });
      if (question.type !== 1) input.type = entry.id === 1239222796 ? 'tel' : 'text';
      if (entry.id === 1912926423) input.autocomplete = 'name';
      if (entry.id === 1239222796) { input.autocomplete = 'tel'; input.inputMode = 'tel'; }
      group.append(input);
    }
  });
  field.append(group); fields.append(field);
  if (question.entries[0].id === 372074511) {
    const extra = element('div', { class: 'form-field' });
    const label = element('label', { for: 'extra-cars' }, '추가 차량 수 · 기본 1대 외');
    const select = element('select', { id: 'extra-cars' });
    for (let n = 0; n <= 4; n++) select.append(element('option', { value: n }, `${n}대${n ? ` (+${money(n * 10000)})` : ''}`));
    label.append(select); extra.append(label, element('p', { class: 'field-description' }, '추가 차량 정보와 계산 내역은 구글폼의 ‘하고 싶은 말’에 함께 저장됩니다.')); fields.append(extra);
  }
});
const lodgingOptions = registrationFields.find(q => q.entries[0].id === 1592266769).entries[0].options;
const basePrices = [180000, 180000, 190000, 220000, 480000];
function calculate() {
  const data = new FormData(form);
  const index = lodgingOptions.indexOf(data.get('entry.1592266769'));
  const adults = data.get('entry.1357739873');
  const children = data.get('entry.1724175323');
  const extraPeople = Math.max(0, Number(adults) - 2) + Math.max(0, Number(children) - 2);
  const rate = index >= 3 ? 20000 : 10000;
  const extraCars = Number(document.getElementById('extra-cars').value);
  const base = basePrices[index] || 0;
  return { index, adults, children, extraPeople, rate, extraCars, base, total: base + extraPeople * rate + extraCars * 10000 };
}
function updatePrice() {
  const p = calculate();
  const lines = document.getElementById('price-lines'); lines.replaceChildren();
  if (p.index >= 0) {
    [['숙박 기본 요금 (2박 3일)', money(p.base)], [`추가 인원 ${p.extraPeople}명 × ${money(p.rate)}`, money(p.extraPeople * p.rate)], [`추가 차량 ${p.extraCars}대 × 10,000원`, money(p.extraCars * 10000)]].forEach(([title, amount]) => {
      const row = element('div'); row.append(element('dt', {}, title), element('dd', {}, amount)); lines.append(row);
    });
  }
  document.getElementById('total').textContent = p.index < 0 ? '숙소 선택 필요' : p.adults === '' || p.children === '' ? '인원 선택 필요' : money(p.total);
  document.getElementById('price-warning').textContent = '모든 숙소는 성인 2명 + 아동 2명 기준입니다. 각각 2명을 넘는 인원에 추가 요금을 계산합니다. 다자녀 한 가족 면제는 추후 적용 예정이며 현재 금액에는 반영되지 않습니다.';
}
form.addEventListener('input', updatePrice);
form.addEventListener('change', updatePrice);
let submitting = false;
form.addEventListener('submit', event => {
  const status = document.getElementById('form-status'); status.textContent = '';
  if (submitting) { event.preventDefault(); return; }
  const p = calculate();
  if (Number(p.adults) + Number(p.children) === 0) { event.preventDefault(); status.textContent = '참가 인원을 1명 이상 선택해 주세요.'; return; }
  if (new FormData(form).get('entry.2000713890') !== '동의') { event.preventDefault(); status.textContent = '원본 신청서 안내에 따라 촬영 비동의 시 참가 신청을 진행할 수 없습니다.'; return; }
  const [hour, minute] = document.getElementById('arrival').value.split(':');
  form.elements.namedItem('entry.782972763_hour').value = String(Number(hour));
  form.elements.namedItem('entry.782972763_minute').value = String(Number(minute));
  const memo = form.elements.namedItem('entry.710258770');
  // A separate hidden value preserves the user's memo if navigation fails or they return.
  memo.disabled = true;
  form.querySelector('[data-calculated-memo]')?.remove();
  form.append(element('input', { type: 'hidden', name: 'entry.710258770', 'data-calculated-memo': '', value: `${memo.value}\n\n[홈페이지 자동 계산]\n기본 ${money(p.base)} / 추가 성인 ${Math.max(0, Number(p.adults) - 2)}명·아동 ${Math.max(0, Number(p.children) - 2)}명: ${money(p.extraPeople * p.rate)} / 추가 차량 ${p.extraCars}대: ${money(p.extraCars * 10000)}\n입금 예정 금액: ${money(p.total)} (다자녀 면제 미반영)` }));
  submitting = true;
  status.textContent = 'Google으로 제출 중입니다. Google의 제출 결과를 확인해 주세요.';
});
window.addEventListener('pageshow', () => {
  submitting = false;
  form.querySelector('[data-calculated-memo]')?.remove();
  form.elements.namedItem('entry.710258770').disabled = false;
  document.getElementById('form-status').textContent = '';
});
document.getElementById('copy-account').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText('79423591938'); document.getElementById('copy-status').textContent = '계좌번호를 복사했습니다.'; }
  catch { document.getElementById('copy-status').textContent = '계좌번호 79423591938을 직접 복사해 주세요.'; }
});
updatePrice();
