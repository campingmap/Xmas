'use strict';
// Normalize formatting before validation. Never shorten an identifier to make it fit.
const CAMP_CONTACT = Object.freeze({
  normalizePhone(value) {
    let digits = String(value || '').normalize('NFKC').replace(/\D/g, '');
    const international = digits.match(/^(?:0082|82)(0?1\d*)$/);
    if (international) digits = '0' + international[1].replace(/^0/, '');
    return digits;
  },
  configurePhone(input) {
    input.type = 'tel';
    input.autocomplete = 'tel';
    input.inputMode = 'numeric';
    input.pattern = '0[0-9]{9,10}';
    input.minLength = 10;
    input.maxLength = 24;
    const normalize = () => {
      input.value = CAMP_CONTACT.normalizePhone(input.value);
      input.setCustomValidity(input.value.length > 11 ? '연락처가 너무 깁니다. 휴대폰 번호를 확인해 주세요.' : '');
    };
    input.addEventListener('input', normalize);
    input.addEventListener('change', normalize);
    input.addEventListener('blur', normalize);
  }
});
