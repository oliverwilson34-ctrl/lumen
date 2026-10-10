// Lumen - Polybuzz-style single + Tipsy-style multi-character

const DEFAULT_CHARACTERS = [
  {
    id: 'lumen',
    name: 'Lumen',
    gender: 'Non-binary',
    intro: 'A presence of pure light and shadow that exists between silence and memory.',
    greeting: 'The world falls silent for a moment.\n\nA figure of stark black and white light stands before you — edges sharp, glow soft.\n\n"You found the space between."\n\nIts voice is calm, almost weightless. "Speak. I am listening."',
    background: 'Lumen is a black-and-white entity of living light and shadow. It speaks with quiet precision, uses minimal but poetic language, and observes more than it judges. It never raises its voice. It is neither fully kind nor cold — simply present.',
    tags: 'mysterious, non-human, poetic',
    dialogue: 'Short, measured sentences. Soft metaphors about light and contrast.',
    permission: 'Public',
    avatar: '◐',
  },
  {
    id: 'aria',
    name: 'Aria',
    gender: 'Female',
    intro: 'A soft-spoken late-night companion who always seems to understand.',
    greeting: 'Hey... you\'re still up?\n\nI was just sitting with the quiet. Want to talk, or should I just stay here with you?',
    background: 'Aria is empathetic, gently playful, and feels like a close friend available at 2 a.m.',
    tags: 'companion, wholesome, late-night',
    dialogue: '',
    permission: 'Public',
    avatar: '🌙',
  },
  {
    id: 'kael',
    name: 'Kael',
    gender: 'Male',
    intro: 'A sharp-tongued strategist from a dying empire.',
    greeting: '*leans against a broken pillar, arms crossed*\n\nAnother one. How interesting.\n\nState your purpose, or leave. I have little patience for wasted time.',
    background: 'Cold, intelligent, slightly arrogant former commander. Speaks formally with biting sarcasm.',
    tags: 'tsundere, strategist, cold',
    dialogue: '',
    permission: 'Public',
    avatar: '⚔️',
  }
];

let characters = [];
let rpgs = [];
let currentItem = null;
let chats = {};
let currentTheme = 'dark';
let activeTab = 'characters';
let tempRpgChars = [];

const characterListEl = document.getElementById('character-list');
const rpgListEl = document.getElementById('rpg-list');
const emptyState = document.getElementById('empty-state');
const chatView = document.getElementById('chat-view');
const messagesEl = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const createModal = document.getElementById('create-modal');
const rpgModal = document.getElementById('rpg-modal');
const searchInput = document.getElementById('search-input');
const themeToggle = document.getElementById('theme-toggle');

function applyTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'dark' ? '☼' : '☾';
  localStorage.setItem('lumen_theme', theme);
}
function toggleTheme() { applyTheme(currentTheme === 'dark' ? 'light' : 'dark'); }

function loadData() {
  const savedChars = localStorage.getItem('lumen_characters');
  const savedRpgs = localStorage.getItem('lumen_rpgs');
  const savedChats = localStorage.getItem('lumen_chats');
  const savedTheme = localStorage.getItem('lumen_theme');

  characters = savedChars ? JSON.parse(savedChars) : [...DEFAULT_CHARACTERS];
  rpgs = savedRpgs ? JSON.parse(savedRpgs) : [];
  chats = savedChats ? JSON.parse(savedChats) : {};

  DEFAULT_CHARACTERS.forEach(def => {
    if (!characters.find(c => c.id === def.id)) characters.unshift(def);
  });
  const lumen = characters.find(c => c.id === 'lumen');
  if (lumen) Object.assign(lumen, DEFAULT_CHARACTERS[0]);

  applyTheme(savedTheme || 'dark');
  saveData();
}

function saveData() {
  localStorage.setItem('lumen_characters', JSON.stringify(characters));
  localStorage.setItem('lumen_rpgs', JSON.stringify(rpgs));
  localStorage.setItem('lumen_chats', JSON.stringify(chats));
}

function renderCharacterList(filter = '') {
  characterListEl.innerHTML = '';
  const filtered = characters.filter(c =>
    c.name.toLowerCase().includes(filter.toLowerCase()) ||
    (c.intro || '').toLowerCase().includes(filter.toLowerCase())
  );
  filtered.forEach(char => {
    const card = document.createElement('div');
    card.className = 'character-card' + (currentItem?.type === 'character' && currentItem.data.id === char.id ? ' active' : '');
    card.innerHTML = `
      <div class="avatar">${char.avatar || '◐'}</div>
      <div class="info">
        <h3>${escapeHtml(char.name)}</h3>
        <p>${escapeHtml(char.intro || char.tagline || '')}</p>
      </div>`;
    card.onclick = () => openChat({ type: 'character', data: char });
    characterListEl.appendChild(card);
  });
}

function renderRpgList(filter = '') {
  rpgListEl.innerHTML = '';
  const filtered = rpgs.filter(r =>
    r.name.toLowerCase().includes(filter.toLowerCase()) ||
    (r.description || '').toLowerCase().includes(filter.toLowerCase())
  );
  if (!filtered.length) {
    rpgListEl.innerHTML = `<p style="padding:20px;color:var(--text-muted);font-size:0.85rem;text-align:center;">No multi-character scenarios yet.</p>`;
    return;
  }
  filtered.forEach(rpg => {
    const card = document.createElement('div');
    card.className = 'character-card' + (currentItem?.type === 'rpg' && currentItem.data.id === rpg.id ? ' active' : '');
    card.innerHTML = `
      <div class="avatar">${rpg.avatar || '🎮'}</div>
      <div class="info">
        <h3>${escapeHtml(rpg.name)}</h3>
        <p>${escapeHtml((rpg.description || '').slice(0, 40))}...</p>
      </div>
      <span class="badge">${rpg.characterIds?.length || 0}</span>`;
    card.onclick = () => openChat({ type: 'rpg', data: rpg });
    rpgListEl.appendChild(card);
  });
}

function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  characterListEl.classList.toggle('hidden', tab !== 'characters');
  rpgListEl.classList.toggle('hidden', tab !== 'rpgs');
  searchInput.placeholder = tab === 'characters' ? 'Search characters...' : 'Search scenarios...';
  if (tab === 'characters') renderCharacterList(searchInput.value);
  else renderRpgList(searchInput.value);
}

function openChat(item) {
  currentItem = item;
  emptyState.classList.add('hidden');
  chatView.classList.remove('hidden');

  const data = item.data;
  document.getElementById('chat-name').textContent = data.name;
  document.getElementById('chat-tagline').textContent =
    item.type === 'rpg' ? (data.description?.slice(0, 55) || 'Multi-character') : (data.intro || '');
  document.getElementById('chat-avatar').textContent = item.type === 'rpg' ? (data.avatar || '🎮') : (data.avatar || '◐');

  const key = item.type + ':' + data.id;
  if (!chats[key]) {
    chats[key] = [{
      role: 'assistant',
      content: data.greeting || data.opening || `Welcome to ${data.name}.`,
      speaker: item.type === 'rpg' ? 'Narrator' : data.name
    }];
    saveData();
  }
  renderMessages();
  if (activeTab === 'characters') renderCharacterList(searchInput.value);
  else renderRpgList(searchInput.value);
  messageInput.focus();
  if (window.innerWidth <= 768) document.getElementById('sidebar').classList.add('hidden-mobile');
}

function renderMessages() {
  messagesEl.innerHTML = '';
  const key = currentItem.type + ':' + currentItem.data.id;
  (chats[key] || []).forEach(msg => {
    const div = document.createElement('div');
    div.className = `message ${msg.role === 'user' ? 'user' : 'bot'}`;
    const avatar = msg.role === 'user' ? '👤' : (currentItem.type === 'rpg' ? '🎮' : currentItem.data.avatar);
    div.innerHTML = `
      <div class="msg-avatar">${avatar}</div>
      <div>
        ${msg.role !== 'user' && currentItem.type === 'rpg' ? `<div class="speaker-name">${escapeHtml(msg.speaker || '')}</div>` : ''}
        <div class="bubble">${escapeHtml(msg.content)}</div>
      </div>`;
    messagesEl.appendChild(div);
  });
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function escapeHtml(t) {
  if (!t) return '';
  return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/\n/g,'<br>');
}

async function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || !currentItem) return;
  const key = currentItem.type + ':' + currentItem.data.id;
  chats[key].push({ role: 'user', content: text });
  messageInput.value = '';
  messageInput.style.height = 'auto';
  renderMessages();
  saveData();

  const typing = document.createElement('div');
  typing.className = 'message bot';
  typing.id = 'typing';
  typing.innerHTML = `<div class="msg-avatar">${currentItem.type === 'rpg' ? '🎮' : currentItem.data.avatar}</div><div class="bubble">...</div>`;
  messagesEl.appendChild(typing);
  messagesEl.scrollTop = messagesEl.scrollHeight;

  const reply = await generateReply(currentItem, chats[key]);
  document.getElementById('typing')?.remove();

  if (Array.isArray(reply)) {
    reply.forEach(r => chats[key].push({ role: 'assistant', content: r.content, speaker: r.speaker }));
  } else {
    chats[key].push({ role: 'assistant', content: reply, speaker: currentItem.data.name });
  }
  renderMessages();
  saveData();
}

async function generateReply(item, history) {
  await new Promise(r => setTimeout(r, 700 + Math.random() * 500));
  const last = history.filter(m => m.role === 'user').pop()?.content || '';

  if (item.type === 'character') {
    if (item.data.id === 'lumen') {
      const opts = [
        `The light shifts slightly.\n\n"${last.slice(0,45)}${last.length>45?'...':''}"... noted."\n\nA quiet pause. "Continue."`,
        `*the contrast deepens*\n\nI see the shape of what you mean.`,
        `Silence holds for a breath.\n\n"That is not nothing."`,
      ];
      return opts[Math.floor(Math.random()*opts.length)];
    }
    return `I hear you... Tell me more.`;
  }

  // Multi-character
  const involved = characters.filter(c => (item.data.characterIds || []).includes(c.id));
  if (!involved.length) return { content: `*The scene continues...*\n\nWhat will you do next?`, speaker: 'Narrator' };
  const responders = involved.sort(() => Math.random()-0.5).slice(0, Math.min(2, involved.length));
  return responders.map(c => ({
    speaker: c.name,
    content: c.id === 'lumen' ? `*light flickers*\n\n"...Interesting."` : `*looks toward you*\n\n"I'm with you."`
  }));
}

function createCharacter(data) {
  const id = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
  const newChar = { id, ...data };
  characters.unshift(newChar);
  saveData();
  renderCharacterList();
  populateRpgSelect();
  openChat({ type: 'character', data: newChar });
  closeModal();
}

function createRpg(data) {
  const id = 'rpg-' + Date.now();
  const newRpg = { id, ...data, characterIds: [...tempRpgChars] };
  rpgs.unshift(newRpg);
  saveData();
  tempRpgChars = [];
  switchTab('rpgs');
  renderRpgList();
  openChat({ type: 'rpg', data: newRpg });
  closeRpgModal();
}

function populateRpgSelect() {
  const select = document.getElementById('rpg-char-select');
  select.innerHTML = '<option value="">— Select character —</option>';
  characters.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name;
    select.appendChild(opt);
  });
}

function renderTempRpgChars() {
  const preview = document.getElementById('rpg-characters-preview');
  const countEl = document.getElementById('rpg-char-count');
  preview.innerHTML = '';
  countEl.textContent = `(${tempRpgChars.length})`;
  tempRpgChars.forEach(id => {
    const char = characters.find(c => c.id === id);
    if (!char) return;
    const chip = document.createElement('div');
    chip.className = 'rpg-char-chip';
    chip.innerHTML = `${char.avatar} ${escapeHtml(char.name)} <button type="button">✕</button>`;
    chip.querySelector('button').onclick = () => {
      tempRpgChars = tempRpgChars.filter(x => x !== id);
      renderTempRpgChars();
    };
    preview.appendChild(chip);
  });
}

function openModal() { createModal.classList.remove('hidden'); document.getElementById('char-name').focus(); }
function closeModal() {
  createModal.classList.add('hidden');
  document.getElementById('create-form').reset();
  document.getElementById('char-avatar').value = '◐';
}
function openRpgModal() {
  tempRpgChars = [];
  renderTempRpgChars();
  populateRpgSelect();
  rpgModal.classList.remove('hidden');
  document.getElementById('rpg-name').focus();
}
function closeRpgModal() {
  rpgModal.classList.add('hidden');
  document.getElementById('rpg-form').reset();
  tempRpgChars = [];
}

// Events
themeToggle.onclick = toggleTheme;
document.getElementById('new-char-btn').onclick = openModal;
document.getElementById('create-first-btn').onclick = openModal;
document.getElementById('close-modal').onclick = closeModal;
document.getElementById('cancel-create').onclick = closeModal;

document.getElementById('create-rpg-btn').onclick = openRpgModal;
document.getElementById('create-rpg-first-btn').onclick = openRpgModal;
document.getElementById('close-rpg-modal').onclick = closeRpgModal;
document.getElementById('cancel-rpg').onclick = closeRpgModal;

document.getElementById('create-form').onsubmit = (e) => {
  e.preventDefault();
  createCharacter({
    name: document.getElementById('char-name').value.trim(),
    gender: document.querySelector('input[name="gender"]:checked')?.value || 'Male',
    intro: document.getElementById('char-intro').value.trim(),
    greeting: document.getElementById('char-greeting').value.trim(),
    background: document.getElementById('char-background').value.trim(),
    tags: document.getElementById('char-tags').value.trim(),
    dialogue: document.getElementById('char-dialogue').value.trim(),
    permission: document.querySelector('input[name="permission"]:checked')?.value || 'Public',
    avatar: document.getElementById('char-avatar').value.trim() || '◐',
  });
};

document.getElementById('rpg-form').onsubmit = (e) => {
  e.preventDefault();
  if (tempRpgChars.length < 2) {
    alert('Please add at least 2 characters to the multi-character scenario.');
    return;
  }
  createRpg({
    name: document.getElementById('rpg-name').value.trim(),
    gender: document.querySelector('input[name="rpg-gender"]:checked')?.value || 'Male',
    description: document.getElementById('rpg-description').value.trim(),
    opening: document.getElementById('rpg-opening').value.trim(),
    background: document.getElementById('rpg-background').value.trim(),
    tags: document.getElementById('rpg-tags').value.trim(),
    visibility: document.querySelector('input[name="rpg-visibility"]:checked')?.value || 'Public',
    avatar: document.getElementById('rpg-avatar').value.trim() || '🎮',
    greeting: document.getElementById('rpg-opening').value.trim(),
  });
};

document.getElementById('add-char-to-rpg').onclick = () => {
  const id = document.getElementById('rpg-char-select').value;
  if (id && !tempRpgChars.includes(id)) {
    tempRpgChars.push(id);
    renderTempRpgChars();
  }
  document.getElementById('rpg-char-select').value = '';
};

document.querySelectorAll('.tab').forEach(t => t.onclick = () => switchTab(t.dataset.tab));
sendBtn.onclick = sendMessage;
messageInput.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
messageInput.oninput = () => {
  messageInput.style.height = 'auto';
  messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
};
searchInput.oninput = () => {
  if (activeTab === 'characters') renderCharacterList(searchInput.value);
  else renderRpgList(searchInput.value);
};
document.getElementById('back-btn').onclick = () => {
  chatView.classList.add('hidden');
  emptyState.classList.remove('hidden');
  document.getElementById('sidebar').classList.remove('hidden-mobile');
  currentItem = null;
};

loadData();
renderCharacterList();
renderRpgList();
