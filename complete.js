'use strict';
let receipt;
try { receipt = JSON.parse(sessionStorage.getItem('xmas-confirmed-receipt')); } catch {}
if (receipt && receipt.reference && Array.isArray(receipt.details)) {
  document.getElementById('completion-title').textContent = '신청이 완료되었습니다.';
  document.getElementById('completion-intro').textContent = '함께 반짝일 겨울을 기다릴게요. 아래 신청 내역과 입금 예정 금액을 확인해 주세요.';
  document.getElementById('completed-content').hidden = false;
  document.getElementById('completed-amount').textContent = receipt.amount;
  document.getElementById('completed-date').textContent = `접수 일시 · ${receipt.date}`;
  document.getElementById('account-info').textContent = `${CAMP_PAYMENT.bank} · ${CAMP_PAYMENT.holder}\n${CAMP_PAYMENT.account}`;
  const list = document.getElementById('completed-details');
  receipt.details.forEach(detail => {
    const row = document.createElement('div');
    const dt = document.createElement('dt'); dt.textContent = detail.label;
    const dd = document.createElement('dd'); dd.textContent = Array.isArray(detail.value) ? detail.value.join(' · ') : String(detail.value || '미작성');
    row.append(dt,dd); list.append(row);
  });
}
document.getElementById('copy-completed-account').addEventListener('click', async () => {
  const status = document.getElementById('account-status');
  try { await navigator.clipboard.writeText(CAMP_PAYMENT.account); status.textContent = '계좌번호를 복사했습니다.'; }
  catch { status.textContent = `계좌번호 ${CAMP_PAYMENT.account}을 직접 복사해 주세요.`; }
});
