const tabs = [...document.querySelectorAll('[role="tab"]')];
function activateTab(tab, focus = false) {
  tabs.forEach(item => {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
    document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
  });
  if (focus) tab.focus();
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateTab(tab));
  tab.addEventListener('keydown', event => {
    let target;
    if (event.key === 'ArrowRight') target = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') target = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') target = 0;
    if (event.key === 'End') target = tabs.length - 1;
    if (target !== undefined) { event.preventDefault(); activateTab(tabs[target], true); }
  });
});
const posterDialog = document.getElementById('poster-dialog');
let posterTrigger;
document.querySelectorAll('#poster-open, .poster-button').forEach(button => {
  button.addEventListener('click', () => {
    posterTrigger = button;
    posterDialog.showModal();
    document.body.classList.add('dialog-open');
  });
});
posterDialog.querySelector('.dialog-close').addEventListener('click', () => posterDialog.close());
posterDialog.addEventListener('click', event => {
  const bounds = posterDialog.getBoundingClientRect();
  if (event.target === posterDialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) posterDialog.close();
});
posterDialog.addEventListener('close', () => {
  document.body.classList.remove('dialog-open');
  posterTrigger?.focus({ preventScroll: true });
});
