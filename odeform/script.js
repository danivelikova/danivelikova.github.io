'use strict';
const panels = [...document.querySelectorAll('.demo-panel')];
const playButton = document.querySelector('#play-toggle');
const timeline = document.querySelector('#timeline');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let currentPanel = document.querySelector('#demo-gaussian');
let playing = false;
let animationFrame;
let playbackGeneration = 0;
const videos = () => [...currentPanel.querySelectorAll('video')];

function setButton() {
  playButton.textContent = playing ? 'Pause' : 'Play';
  playButton.setAttribute('aria-label', (playing ? 'Pause' : 'Play') + ' demonstration');
}
function pause() {
  playbackGeneration++;
  document.querySelectorAll('.demo-panel video').forEach(v => v.pause());
  playing = false; setButton(); cancelAnimationFrame(animationFrame);
}
function updateTimeline() {
  const [master, ...followers] = videos();
  if (master && Number.isFinite(master.duration) && master.duration > 0) {
    timeline.value = Math.round(master.currentTime / master.duration * 1000);
    for (const v of followers) {
      if (Number.isFinite(v.duration) && Math.abs(v.currentTime - master.currentTime) > .12) v.currentTime = master.currentTime;
    }
  }
  if (playing) animationFrame = requestAnimationFrame(updateTimeline);
}
async function play() {
  const generation = ++playbackGeneration;
  const active = videos();
  const results = await Promise.allSettled(active.map(v => v.play()));
  if (generation !== playbackGeneration || active[0] !== videos()[0]) {
    return;
  }
  playing = results.every(r => r.status === 'fulfilled');
  if (!playing) active.forEach(v => v.pause());
  setButton(); cancelAnimationFrame(animationFrame); if (playing) updateTimeline();
}
document.querySelectorAll('.demo-panel video').forEach(v => { v.controls = false; });
document.querySelector('.playback').hidden = false;
playButton.addEventListener('click', () => playing ? pause() : play());
timeline.addEventListener('input', () => {
  pause();
  videos().forEach(v => { if (Number.isFinite(v.duration)) v.currentTime = Math.min(Number(timeline.value) / 1000 * v.duration, Math.max(0, v.duration - .001)); });
});
document.querySelectorAll('[data-demo]').forEach(button => button.addEventListener('click', () => {
  pause();
  document.querySelectorAll('[data-demo]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  panels.forEach(p => { p.hidden = p.id !== 'demo-' + button.dataset.demo; });
  currentPanel = document.querySelector('#demo-' + button.dataset.demo);
  timeline.value = 0;
  videos().forEach(v => { if (v.readyState > 0) v.currentTime = 0; });
  if (!reducedMotion.matches) play();
}));
document.querySelectorAll('[data-result]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-result]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  document.querySelectorAll('[id^="result-"]').forEach(p => { p.hidden = p.id !== 'result-' + button.dataset.result; });
}));
document.querySelector('#copy-citation').addEventListener('click', async () => {
  const text = document.querySelector('#bibtex').textContent;
  const status = document.querySelector('#copy-status');
  try {
    await navigator.clipboard.writeText(text);
    status.textContent = 'BibTeX copied to clipboard.';
  } catch {
    const range = document.createRange(); range.selectNodeContents(document.querySelector('#bibtex'));
    const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
    status.textContent = 'Citation selected. Press Ctrl+C or ⌘C to copy.';
  }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
if ('IntersectionObserver' in window) {
  new IntersectionObserver(entries => { if (!entries[0].isIntersecting) pause(); }, {threshold: .05}).observe(document.querySelector('.showcase'));
}
reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) pause(); });
// Motion is opt-in; the first frame stays still until the visitor presses Play.

const meshDemos = {"contact": {"cat": {"label": "Cat", "ours": {"src": "assets/contact-cat-ours.mp4", "poster": "assets/contact-cat-ours.jpg"}, "reference": {"src": "assets/contact-cat-reference.mp4", "poster": "assets/contact-cat-reference.jpg"}}, "bottle": {"label": "Bottle", "ours": {"src": "assets/contact-bottle-ours.mp4", "poster": "assets/contact-bottle-ours.jpg"}, "reference": {"src": "assets/contact-bottle-reference.mp4", "poster": "assets/contact-bottle-reference.jpg"}}, "dog": {"label": "Dog", "ours": {"src": "assets/contact-dog-ours.mp4", "poster": "assets/contact-dog-ours.jpg"}, "reference": {"src": "assets/contact-dog-reference.mp4", "poster": "assets/contact-dog-reference.jpg"}}, "pillow": {"label": "Pillow", "ours": {"src": "assets/contact-pillow-ours.mp4", "poster": "assets/contact-pillow-ours.jpg"}, "reference": {"src": "assets/contact-pillow-reference.mp4", "poster": "assets/contact-pillow-reference.jpg"}}, "flipflop": {"label": "Flipflop", "ours": {"src": "assets/contact-flipflop-ours.mp4", "poster": "assets/contact-flipflop-ours.jpg"}, "reference": {"src": "assets/contact-flipflop-reference.mp4", "poster": "assets/contact-flipflop-reference.jpg"}}}, "geometry": {"5": {"label": "Flipflop 1", "src": "assets/unseen-flipflop-5.mp4", "poster": "assets/unseen-flipflop-5.jpg"}, "6": {"label": "Flipflop 2", "src": "assets/unseen-flipflop-6.mp4", "poster": "assets/unseen-flipflop-6.jpg"}, "7": {"label": "Flipflop 3", "src": "assets/unseen-flipflop-7.mp4", "poster": "assets/unseen-flipflop-7.jpg"}, "9": {"label": "Flipflop 4", "src": "assets/unseen-flipflop-9.mp4", "poster": "assets/unseen-flipflop-9.jpg"}}};

function replaceVideo(video, item, label) {
  video.poster = item.poster;
  video.querySelector('source').src = item.src;
  const fallback = video.querySelector('a');
  if (fallback) fallback.href = item.src;
  video.setAttribute('aria-label', label);
  video.load();
}
document.querySelectorAll('[data-mesh]').forEach(button => button.addEventListener('click', () => {
  pause(); timeline.value = 0;
  const group = button.dataset.meshGroup;
  document.querySelectorAll('[data-mesh-group="' + group + '"]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  const item = meshDemos[group][button.dataset.mesh];
  if (group === 'contact') {
    const pair = document.querySelectorAll('#demo-contact video');
    replaceVideo(pair[0], item.ours, 'ODeform prediction for the ' + item.label + ' mesh');
    replaceVideo(pair[1], item.reference, 'Simulation reference for the ' + item.label + ' mesh');
    document.querySelector('#demo-contact .demo-caption').textContent = item.label + ': deformation under an unseen contact condition. Left: ODeform. Right: ground-truth simulation.';
  } else {
    replaceVideo(document.querySelector('#demo-geometry video'), item, 'Predicted deformation of unseen ' + item.label);
    document.querySelector('#demo-geometry .demo-caption').textContent = item.label + ': learned deformation transferred to a reconstructed HouseCAT6D mesh within the same object category.';
  }
  if (!reducedMotion.matches) play();
}));
