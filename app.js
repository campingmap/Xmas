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

const carol = document.getElementById('camp-carol');
const musicToggle = document.getElementById('music-toggle');
const musicLabel = document.getElementById('music-label');
const musicStatus = document.getElementById('music-status');
const musicPreference = 'xmas-carol-enabled';
let musicEnabled = true;
try { musicEnabled = localStorage.getItem(musicPreference) !== 'off'; } catch {}
carol.volume = 0.25;
musicToggle.hidden = false;
function updateMusicControl() {
  const playing = !carol.paused && !carol.error;
  musicToggle.setAttribute('aria-pressed', String(playing));
  musicToggle.setAttribute('aria-label', playing ? '캐롤 배경음악 끄기' : '캐롤 배경음악 재생');
  musicLabel.textContent = playing ? '캐롤 끄기' : '캐롤 재생';
}
async function playCarol() {
  if (!musicEnabled || !carol.paused) return;
  try {
    await carol.play();
    // A pending play request may finish after the visitor has turned music off.
    if (!musicEnabled) carol.pause();
  } catch (error) {
    musicStatus.textContent = error.name === 'NotAllowedError'
      ? '화면을 터치하거나 캐롤 재생 버튼을 누르면 음악이 시작됩니다.'
      : '음악을 불러오지 못했습니다. 캐롤 재생 버튼으로 다시 시도해 주세요.';
  }
  updateMusicControl();
}
function startCarolOnInteraction(event) {
  if (event.target instanceof Element && event.target.closest('#music-toggle')) return;
  if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) return;
  void playCarol();
}
musicToggle.addEventListener('click', () => {
  musicEnabled = carol.paused;
  try { localStorage.setItem(musicPreference, musicEnabled ? 'on' : 'off'); } catch {}
  if (musicEnabled) void playCarol();
  else carol.pause();
  updateMusicControl();
});
carol.addEventListener('playing', () => {
  musicStatus.textContent = '캐롤 배경음악이 재생 중입니다.';
  updateMusicControl();
});
carol.addEventListener('pause', updateMusicControl);
carol.addEventListener('error', () => {
  musicStatus.textContent = '음악을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
  updateMusicControl();
});
document.addEventListener('click', startCarolOnInteraction);
document.addEventListener('keydown', startCarolOnInteraction);
updateMusicControl();
carol.autoplay = musicEnabled;
if (musicEnabled) void playCarol();
