// ======================
// Lumen - Character & RPG App
// Black & white aesthetic + light/dark + single + multi-character RPG
// ======================

const DEFAULT_CHARACTERS = [
  {
    id: 'lumen',
    name: 'Lumen',
    tagline: 'A presence of pure light and shadow.',
    greeting: 'The world falls silent for a moment.\n\nA figure of stark black and white light stands before you — edges sharp, glow soft.\n\n"You found the space between."\n\nIts voice is calm, almost weightless. "Speak. I am listening."',
    definition: 'Lumen is a black-and-white entity of living light and shadow. It speaks with quiet precision, uses minimal but poetic language, and observes more than it judges. It never raises its voice. It is neither fully kind nor cold — simply present. It often refers to light, contrast, silence, and memory.',
    avatar: '◐',
  },
  {
    id: 'aria',
    name: 'Aria',
    tagline: 'Your thoughtful late-night companion.',
    greeting: 'Hey... you\'re still up?\n\nI was just sitting with the quiet. Want to talk, or should I just stay here with you?',
    definition: 'Aria is soft-spoken, empathetic, and gently playful. She speaks casually and feels like a close friend available at 2 a.m.',
    avatar: '🌙',
  },
  {
    id: 'kael',
    name: 'Kael',
    tagline: 'A sharp-tongued strategist from a dying empire.',
    greeting: '*leans against a broken pillar, arms crossed*\n\nAnother one. How interesting.\n\nState your purpose, or leave. I have little patience for wasted time.',
    definition: 'Kael is cold, intelligent, and slightly arrogant. He speaks formally with biting sarcasm and respects strength and honesty.',
    avatar: '⚔️',
  }
];

// State
let characters = [];
let rpgs = []; // { id, name, setting, greeting, characterIds: [], ... }
let currentItem = null; // { type: 'character' | 'rpg', data }
let chats = {}; // key = characterId or rpgId
let currentTheme = 'dark';
let activeTab = 'characters';
let tempRpgChars = []; // while creating an RPG

// DOM
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

// ---------- Theme ----------
function applyTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'dark' ? '☼' : '☾';
  localStorage.setItem('lumen_theme', theme);
}

function toggleTheme() {
  applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

// ---------- Data ----------
function loadData() {
  const savedChars = localStorage.getItem('lumen_characters');
  const savedRpgs = localStorage.getItem('lumen_rpgs');
  const savedChats = localStorage.getItem('lumen_chats');
  const savedTheme = localStorage.getItem('lumen_theme');

  characters = savedChars ? JSON.parse(savedChars) : [...DEFAULT_CHARACTERS];
  rpgs = savedRpgs ? JSON.parse(savedRpgs) : [];
  chats = savedChats ? JSON.parse(savedChats) : {};

  // Ensure defaults exist
  DEFAULT_CHARACTERS.forEach(def => {
    if (!characters.find(c => c.id === def.id)) {
      characters.unshift(def);
    }
  });

  // Force update Lumen to black-and-white version if it exists
  const lumen = characters.find(c => c.id === 'lumen');
  if (lumen) {
    Object.assign(lumen, DEFAULT_CHARACTERS[0]);
  }

  applyTheme(savedTheme || 'dark');
  saveData();
}

function saveData() {
  localStorage.setItem('lumen_characters', JSON.stringify(characters));
  localStorage.setItem('lumen_rpgs', JSON.stringify(rpgs));
  localStorage.setItem('lumen_chats', JSON.stringify(chats));
}

// ---------- Rendering ----------
function renderCharacterList(filter = '') {
  characterListEl.innerHTML = '';
  const filtered = characters.filter(c =>
    c.name.toLowerCase().includes(filter.toLowerCase()) ||
    (c.tagline || '').toLowerCase().includes(filter.toLowerCase())
  );

  filtered.forEach(char => {
    const card = document.createElement('div');
    card.className = 'character-card' + (currentItem?.type === 'character' && currentItem.data.id === char.id ? ' active' : '');
    card.innerHTML = `
      <div class="avatar">${char.avatar}</div>
      <div class="info">
        <h3>${escapeHtml(char.name)}</h3>
        <p>${escapeHtml(char.tagline || '')}</p>
      </div>
    `;
    card.addEventListener('click', () => openChat({ type: 'character', data: char }));
    characterListEl.appendChild(card);
  });
}

function renderRpgList(filter = '') {
  rpgListEl.innerHTML = '';
  const filtered = rpgs.filter(r =>
    r.name.toLowerCase().includes(filter.toLowerCase()) ||
    (r.setting || '').toLowerCase().includes(filter.toLowerCase())
  );

  if (filtered.length === 0) {
    rpgListEl.innerHTML = `<p style="padding:16px;color:var(--text-muted);font-size:0.85rem;text-align:center;">No RPG scenarios yet.<br>Create one below.</p>`;
    return;
  }

  filtered.forEach(rpg => {
    const card = document.createElement('div');
    card.className = 'character-card' + (currentItem?.type === 'rpg' && currentItem.data.id === rpg.id ? ' active' : '');
    const charCount = rpg.characterIds?.length || 0;
    card.innerHTML = `
      <div class="avatar">🎮</div>
      <div class="info">
        <h3>${escapeHtml(rpg.name)}</h3>
        <p>${escapeHtml(rpg.setting?.slice(0, 40) || 'RPG Scenario')}...</p>
      </div>
      <span class="badge">${charCount} chars</span>
    `;
    card.addEventListener('click', () => openChat({ type: 'rpg', data: rpg }));
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

// ---------- Chat ----------
function openChat(item) {
  currentItem = item;
  emptyState.classList.add('hidden');
  chatView.classList.remove('hidden');

  const data = item.data;
  document.getElementById('chat-name').textContent = data.name;
  document.getElementById('chat-tagline').textContent = item.type === 'rpg'
    ? (data.setting?.slice(0, 60) || 'RPG Scenario')
    : (data.tagline || '');

  const avatarEl = document.getElementById('chat-avatar');
  avatarEl.textContent = item.type === 'rpg' ? '🎮' : (data.avatar || '◐');

  const key = item.type + ':' + data.id;
  if (!chats[key]) {
    chats[key] = [
      { role: 'assistant', content: data.greeting || `Welcome to ${data.name}.`, speaker: item.type === 'rpg' ? 'Narrator' : data.name }
    ];
    saveData();
  }

  renderMessages();
  if (activeTab === 'characters') renderCharacterList(searchInput.value);
  else renderRpgList(searchInput.value);

  messageInput.focus();

  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.add('hidden-mobile');
  }
}

function renderMessages() {
  messagesEl.innerHTML = '';
  const key = currentItem.type + ':' + currentItem.data.id;
  const msgs = chats[key] || [];

  msgs.forEach(msg => {
    const div = document.createElement('div');
    div.className = `message ${msg.role === 'user' ? 'user' : 'bot'}`;

    const speaker = msg.speaker || (msg.role === 'user' ? 'You' : currentItem.data.name);
    const avatar = msg.role === 'user' ? '👤' : (currentItem.type === 'rpg' ? '🎮' : currentItem.data.avatar);

    div.innerHTML = `
      <div class="msg-avatar">${avatar}</div>
      <div>
        ${msg.role !== 'user' && currentItem.type === 'rpg' ? `<div class="speaker-name">${escapeHtml(speaker)}</div>` : ''}
        <div class="bubble">${escapeHtml(msg.content)}</div>
      </div>
    `;
    messagesEl.appendChild(div);
  });

  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
}

// ---------- Send ----------
async function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || !currentItem) return;

  const key = currentItem.type + ':' + currentItem.data.id;
  chats[key].push({ role: 'user', content: text });
  messageInput.value = '';
  messageInput.style.height = 'auto';
  renderMessages();
  saveData();

  // Typing indicator
  const typing = document.createElement('div');
  typing.className = 'message bot';
  typing.id = 'typing';
  typing.innerHTML = `<div class="msg-avatar">${currentItem.type === 'rpg' ? '🎮' : currentItem.data.avatar}</div><div class="bubble">...</div>`;
  messagesEl.appendChild(typing);
  messagesEl.scrollTop = messagesEl.scrollHeight;

  const reply = await generateReply(currentItem, chats[key]);

  document.getElementById('typing')?.remove();

  if (Array.isArray(reply)) {
    // Multiple character replies (RPG)
    reply.forEach(r => {
      chats[key].push({ role: 'assistant', content: r.content, speaker: r.speaker });
    });
  } else {
    chats[key].push({ role: 'assistant', content: reply, speaker: currentItem.data.name });
  }

  renderMessages();
  saveData();
}

// ---------- AI Reply (mock) ----------
async function generateReply(item, history) {
  await new Promise(r => setTimeout(r, 700 + Math.random() * 600));

  const lastUser = history.filter(m => m.role === 'user').pop()?.content || '';

  if (item.type === 'character') {
    const char = item.data;
    if (char.id === 'lumen') {
      const replies = [
        `The light shifts slightly.\n\n"${lastUser.slice(0, 50)}${lastUser.length > 50 ? '...' : ''}"... noted."\n\nA quiet pause. "Continue."`,
        `*the contrast deepens for a moment*\n\nI see the shape of what you mean. Speak further if you wish.`,
        `Silence holds for a breath.\n\n"That is not nothing."\n\nThe glow remains steady.`,
        `"Understood."\n\nNothing more is needed right now. I am still here.`,
      ];
      return replies[Math.floor(Math.random() * replies.length)];
    }
    if (char.id === 'kael') {
      return `*narrows eyes*\n\nHmph. At least you speak plainly. Go on.`;
    }
    return `I hear you... "${lastUser.slice(0, 40)}${lastUser.length > 40 ? '...' : ''}".\n\nTell me more?`;
  }

  // RPG multi-character reply simulation
  const rpg = item.data;
  const charIds = rpg.characterIds || [];
  const involved = characters.filter(c => charIds.includes(c.id));

  if (involved.length === 0) {
    return { content: `*The scene continues...*\n\n${lastUser}\n\nWhat will you do next?`, speaker: 'Narrator' };
  }

  // Pick 1-2 characters to respond
  const responders = involved.sort(() => Math.random() - 0.5).slice(0, Math.min(2, involved.length));
  return responders.map(c => ({
    speaker: c.name,
    content: c.id === 'lumen'
      ? `*light flickers across the space*\n\n"...Interesting."`
      : c.id === 'kael'
        ? `*watches carefully*\n\n"We should proceed with caution."`
        : `*looks toward you*\n\n"I\'m with you on this."`
  }));
}

// ---------- Create Character ----------
function createCharacter(data) {
  const id = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
  const newChar = {
    id,
    name: data.name,
    tagline: data.tagline || '',
    greeting: data.greeting || `Hello, I'm ${data.name}.`,
    definition: data.definition || '',
    avatar: data.avatar || '◐',
  };
  characters.unshift(newChar);
  saveData();
  renderCharacterList();
  populateRpgSelect();
  openChat({ type: 'character', data: newChar });
  closeModal();
}

// ---------- Create RPG ----------
function createRpg(data) {
  const id = 'rpg-' + Date.now();
  const newRpg = {
    id,
    name: data.name,
    setting: data.setting || '',
    greeting: data.greeting || `You find yourself in ${data.name}...`,
    characterIds: [...tempRpgChars],
  };
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
  select.innerHTML = '<option value="">— Select existing character —</option>';
  characters.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name;
    select.appendChild(opt);
  });
}

function renderTempRpgChars() {
  const preview = document.getElementById('rpg-characters-preview');
  preview.innerHTML = '';
  tempRpgChars.forEach(id => {
    const char = characters.find(c => c.id === id);
    if (!char) return;
    const chip = document.createElement('div');
    chip.className = 'rpg-char-chip';
    chip.innerHTML = `${char.avatar} ${escapeHtml(char.name)} <button type="button" data-id="${id}">✕</button>`;
    chip.querySelector('button').addEventListener('click', () => {
      tempRpgChars = tempRpgChars.filter(x => x !== id);
      renderTempRpgChars();
    });
    preview.appendChild(chip);
  });
}

// ---------- Modals ----------
function openModal() {
  createModal.classList.remove('hidden');
  document.getElementById('char-name').focus();
}

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

// ---------- Events ----------
themeToggle.addEventListener('click', toggleTheme);

document.getElementById('new-char-btn').addEventListener('click', openModal);
document.getElementById('create-first-btn').addEventListener('click', openModal);
document.getElementById('close-modal').addEventListener('click', closeModal);
document.getElementById('cancel-create').addEventListener('click', closeModal);

document.getElementById('create-rpg-btn').addEventListener('click', openRpgModal);
document.getElementById('create-rpg-first-btn').addEventListener('click', openRpgModal);
document.getElementById('close-rpg-modal').addEventListener('click', closeRpgModal);
document.getElementById('cancel-rpg').addEventListener('click', closeRpgModal);

document.getElementById('create-form').addEventListener('submit', (e) => {
  e.preventDefault();
  createCharacter({
    name: document.getElementById('char-name').value.trim(),
    tagline: document.getElementById('char-tagline').value.trim(),
    greeting: document.getElementById('char-greeting').value.trim(),
    definition: document.getElementById('char-definition').value.trim(),
    avatar: document.getElementById('char-avatar').value.trim() || '◐',
  });
});

document.getElementById('rpg-form').addEventListener('submit', (e) => {
  e.preventDefault();
  if (tempRpgChars.length === 0) {
    alert('Please add at least one character to the RPG scenario.');
    return;
  }
  createRpg({
    name: document.getElementById('rpg-name').value.trim(),
    setting: document.getElementById('rpg-setting').value.trim(),
    greeting: document.getElementById('rpg-greeting').value.trim(),
  });
});

document.getElementById('add-char-to-rpg').addEventListener('click', () => {
  const select = document.getElementById('rpg-char-select');
  const id = select.value;
  if (id && !tempRpgChars.includes(id)) {
    tempRpgChars.push(id);
    renderTempRpgChars();
  }
  select.value = '';
});

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => switchTab(tab.dataset.tab));
});

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

messageInput.addEventListener('input', () => {
  messageInput.style.height = 'auto';
  messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
});

searchInput.addEventListener('input', () => {
  if (activeTab === 'characters') renderCharacterList(searchInput.value);
  else renderRpgList(searchInput.value);
});

document.getElementById('back-btn')?.addEventListener('click', () => {
  chatView.classList.add('hidden');
  emptyState.classList.remove('hidden');
  document.getElementById('sidebar').classList.remove('hidden-mobile');
  currentItem = null;
  if (activeTab === 'characters') renderCharacterList(searchInput.value);
  else renderRpgList(searchInput.value);
});

// Init
loadData();
renderCharacterList();
renderRpgList();
