import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../public/subtitle-data.js', import.meta.url), 'utf8');
const dataContext = { window: {} };
vm.runInNewContext(source, dataContext);
const cues = dataContext.window.DemoSubtitleData['08-safety4cut-example'];
assert.equal(cues.length, 21, 'the v85 example cue set is present');
assert.equal(cues.at(-1).end, 63.12, 'the complete 63.12-second timing data is present');

class Element {
  constructor() { this.hidden = false; this.textContent = ''; this.attributes = {}; this.listeners = {}; this.children = []; this.style = { setProperty: (name, value) => { this.style[name] = value; } }; }
  addEventListener(type, listener) { (this.listeners[type] ||= []).push(listener); }
  fire(type) { for (const listener of this.listeners[type] || []) listener({ target: this }); }
  setAttribute(name, value) { this.attributes[name] = value; }
  removeAttribute(name) { delete this.attributes[name]; }
  append(child) { this.children.push(child); }
  replaceChildren(...children) { this.children = children; }
}
const elements = Object.fromEntries(['video-subtitles', 'subtitle-line', 'subtitle-toggle', 'video'].map(id => [id, new Element()]));
const storage = new Map();
const context = {
  document: { getElementById: id => elements[id], createElement: () => new Element(), createTextNode: text => ({ text }), body: { classList: { toggle() {} } } },
  localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
  window: { DemoSubtitleData: dataContext.window.DemoSubtitleData },
};
vm.runInNewContext(fs.readFileSync(new URL('../public/subtitles.js', import.meta.url), 'utf8'), context);

const video = elements.video, panel = elements['video-subtitles'], line = elements['subtitle-line'], toggle = elements['subtitle-toggle'];
assert.equal(panel.hidden, false, 'subtitles default to ON');
assert.equal(toggle.textContent, '자막 ON');
video.currentTime = 0.5; video.fire('timeupdate');
assert.match(line.attributes['aria-label'], /^2025년 5월 17일/);
const firstWord = line.children.find(child => child.className === 'subtitle-word');
assert.equal(firstWord.style['--read'], '29.6%', 'word highlight follows media time');
video.currentTime = 3.2; video.fire('seeked');
assert.notEqual(line.attributes['aria-label'], '2025년 5월 17일', 'seeking selects the matching cue');
const seekLabel = line.attributes['aria-label'];
toggle.fire('click');
assert.equal(panel.hidden, true, 'toggle hides captions');
assert.equal(storage.get('tbm-demo-video-subtitles-enabled'), 'false', 'toggle preference is saved');
toggle.fire('click');
assert.equal(panel.hidden, false, 'captions can be restored');
assert.equal(line.attributes['aria-label'], seekLabel, 'reenabling re-renders at the current video time');
video.currentTime = 0; video.fire('seeked');
assert.match(line.attributes['aria-label'], /^2025년 5월 17일/, 'restarting returns the highlight to the opening words');
video.currentTime = 63.2; video.fire('timeupdate');
assert.equal(line.children.length, 0, 'captions clear after the final timed cue');
video.fire('emptied');
assert.equal(line.children.length, 0, 'clearing the video removes stale captions');

const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../public/style.css', import.meta.url), 'utf8');
assert.match(html, /src="assets\/video\.mp4" type="video\/mp4"/, 'the original MP4 source remains unchanged');
assert.match(html, /aria-controls="video-subtitles"/, 'the caption toggle controls the separate caption row');
assert.match(css, /\.video-subtitles\[hidden\]\{display:none\}/, 'the hidden state works despite the global hidden rule');
assert.match(css, /\.video-subtitles\{display:grid/, 'captions occupy a separate layout row below the video');
assert.match(css, /video\{max-height:calc\(100% - 285px\)\}/, 'the player leaves room for captions and controls');
console.log('Video subtitle regression checks passed.');
