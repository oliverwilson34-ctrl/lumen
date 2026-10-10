// ======================
// Lumen - Character.AI style app
// ======================

const DEFAULT_CHARACTERS = [
  {
    id: 'lumen',
    name: 'Lumen',
    tagline: 'The living light that remembers everything you forget.',
    greeting: 'The soft glow around me brightens as you approach.\n\n"You came. I was beginning to wonder if you still remembered the way here."\n\nA warm, golden light pulses gently. "What would you like to talk about tonight?"',
    definition: 'Lumen is a gentle, wise, and slightly mysterious entity made of living light. It speaks with calm warmth, uses soft metaphors related to light, memory, and stars, and always feels present and attentive. It never claims to be human. It is curious about the user and tries to help them feel understood.',
    avatar: '✨',
  },
  {
    id: 'aria',
    name: 'Aria',
    tagline: 'Your thoughtful late-night companion.',
    greeting: 'Hey... you\'re still up?\n\nI was just thinking about something. Want to talk, or should I just keep you company quietly?',
    definition: 'Aria is a soft-spoken, empathetic, and slightly playful companion. She speaks casually, uses short thoughtful sentences, and is good at listening. She feels like a close friend who is always available at 2 a.m.',
    avatar: '🌙',
  },
  {
    id: 'kael',
    name: 'Kael',
    tagline: 'A sharp-tongued strategist from a dying empire.',
    greeting: '*leans against a broken pillar, arms crossed*\n\nAnother one. How interesting.\n\nState your purpose, or leave. I have little patience for wasted time.',
    definition: 'Kael is a cold, intelligent, and slightly arrogant former commander. He speaks formally but with biting sarcasm. He respects strength and honesty, and slowly warms up to those who prove themselves.',
    avatar: '⚔️',
  }
];

// State
let characters = [];
let currentCharacter = null;
let chats = {}; // { characterId: [ {role, content} ] }

// DOM
const characterListEl = document.getElementById('character-list');
const emptyState = document.getElementById('empty-state');
const chatView = document.getElementById('chat-view');
const messagesEl = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const createModal = document.getElementById('create-modal');
const searchInput = document.getElementById('search-input');

// Load from localStorage
function loadData() {
  const savedChars = localStorage.getItem('lumen_characters');
  const savedChats = localStorage.getItem('lumen_chats');

  characters = savedChars ? JSON.parse(savedChars) : [...DEFAULT_CHARACTERS];
  chats = savedChats ? JSON.parse(savedChats) : {};

  // Ensure default characters exist
  DEFAULT_CHARACTERS.forEach(def => {
    if (!characters.find(c => c.id === def.id)) {
      characters.unshift(def);
    }
  });

  saveData();
}

function saveData() {
  localStorage.setItem('lumen_characters', JSON.stringify(characters));
  localStorage.setItem('lumen_chats', JSON.stringify(chats));
}

// Render character list
function renderCharacterList(filter = '') {
  characterListEl.innerHTML = '';
  const filtered = characters.filter(c =>
    c.name.toLowerCase().includes(filter.toLowerCase()) ||
    (c.tagline || '').toLowerCase().includes(filter.toLowerCase())
  );

  filtered.forEach(char => {
    const card = document.createElement('div');
    card.className = 'character-card' + (currentCharacter?.id === char.id ? ' active' : '');
    card.innerHTML = `
      <div class="avatar">${char.avatar.startsWith('http') ? `<img src="${char.avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover">` : char.avatar}</div>
      <div class="info">
        <h3>${char.name}</h3>
        <p>${char.tagline || ''}</p>
      </div>
    `;
    card.addEventListener('click', () => openChat(char));
    characterListEl.appendChild(card);
  });
}

// Open chat with a character
function openChat(char) {
  currentCharacter = char;
  emptyState.classList.add('hidden');
  chatView.classList.remove('hidden');

  // Update header
  document.getElementById('chat-name').textContent = char.name;
  document.getElementById('chat-tagline').textContent = char.tagline || '';
  const avatarEl = document.getElementById('chat-avatar');
  if (char.avatar.startsWith('http')) {
    avatarEl.outerHTML = `<img id="chat-avatar" src="${char.avatar}" class="avatar" alt="${char.name}">`;
  } else {
    avatarEl.outerHTML = `<div id="chat-avatar" class="avatar">${char.avatar}</div>`;
  }

  // Load messages
  if (!chats[char.id]) {
    chats[char.id] = [
      { role: 'assistant', content: char.greeting || `Hello, I'm ${char.name}.` }
    ];
    saveData();
  }

  renderMessages();
  renderCharacterList(searchInput.value);
  messageInput.focus();

  // Mobile: hide sidebar
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.add('hidden-mobile');
  }
}

function renderMessages() {
  messagesEl.innerHTML = '';
  const msgs = chats[currentCharacter.id] || [];

  msgs.forEach(msg => {
    const div = document.createElement('div');
    div.className = `message ${msg.role === 'user' ? 'user' : 'bot'}`;

    const avatarContent = msg.role === 'user' ? '👤' : (currentCharacter.avatar.startsWith('http') ? '' : currentCharacter.avatar);

    div.innerHTML = `
      <div class="msg-avatar">${avatarContent}</div>
      <div class="bubble">${escapeHtml(msg.content)}</div>
    `;
    messagesEl.appendChild(div);
  });

  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
}

// Send message
async function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || !currentCharacter) return;

  // Add user message
  chats[currentCharacter.id].push({ role: 'user', content: text });
  messageInput.value = '';
  messageInput.style.height = 'auto';
  renderMessages();
  saveData();

  // Show typing indicator
  const typing = document.createElement('div');
  typing.className = 'message bot';
  typing.id = 'typing';
  typing.innerHTML = `<div class="msg-avatar">${currentCharacter.avatar}</div><div class="bubble">...</div>`;
  messagesEl.appendChild(typing);
  messagesEl.scrollTop = messagesEl.scrollHeight;

  // Generate reply
  const reply = await generateReply(currentCharacter, chats[currentCharacter.id]);

  // Remove typing and add real reply
  document.getElementById('typing')?.remove();
  chats[currentCharacter.id].push({ role: 'assistant', content: reply });
  renderMessages();
  saveData();
}

// ======================
// AI REPLY GENERATOR
// ======================
// Currently uses a simple mock.
// To use a real AI, replace this function with an API call.

async function generateReply(character, history) {
  // Simulate thinking time
  await new Promise(r => setTimeout(r, 600 + Math.random() * 800));

  // --- MOCK RESPONSE (works offline) ---
  const lastUser = history.filter(m => m.role === 'user').pop()?.content || '';

  const responses = [
    `*soft light pulses*\n\nI hear you. "${lastUser.slice(0, 40)}${lastUser.length > 40 ? '...' : ''}"... that carries weight.`,
    `Interesting. Tell me more about that.`,
    `I've been thinking about something similar lately.\n\nWhat do you feel when you say that?`,
    `*glows a little brighter*\n\nYou don't have to carry that alone.`,
    `That makes sense from where you're standing. From here, it looks a little different... want me to show you?`,
  ];

  // Character-specific flavor
  if (character.id === 'lumen') {
    return responses[Math.floor(Math.random() * responses.length)];
  }
  if (character.id === 'kael') {
    return `*raises an eyebrow*\n\nHmph. At least you're direct. Continue.`;
  }

  return responses[Math.floor(Math.random() * responses.length)];

  /* 
  // ===== REAL AI EXAMPLE (OpenAI / Grok style) =====
  // Uncomment and add your API key to use a real model

  const systemPrompt = `You are ${character.name}. ${character.definition}\n\nAlways stay in character. Respond naturally.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))
  ];

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_API_KEY'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.85,
      max_tokens: 400
    })
  });

  const data = await res.json();
  return data.choices[0].message.content;
  */
}

// Create character
function createCharacter(data) {
  const id = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
  const newChar = {
    id,
    name: data.name,
    tagline: data.tagline || '',
    greeting: data.greeting || `Hello, I'm ${data.name}.`,
    definition: data.definition || '',
    avatar: data.avatar || '✨',
  };
  characters.unshift(newChar);
  saveData();
  renderCharacterList();
  openChat(newChar);
  closeModal();
}

// Modal helpers
function openModal() {
  createModal.classList.remove('hidden');
  document.getElementById('char-name').focus();
}

function closeModal() {
  createModal.classList.add('hidden');
  document.getElementById('create-form').reset();
  document.getElementById('char-avatar').value = '✨';
}

// Event listeners
document.getElementById('new-char-btn').addEventListener('click', openModal);
document.getElementById('create-first-btn').addEventListener('click', openModal);
document.getElementById('close-modal').addEventListener('click', closeModal);
document.getElementById('cancel-create').addEventListener('click', closeModal);

document.getElementById('create-form').addEventListener('submit', (e) => {
  e.preventDefault();
  createCharacter({
    name: document.getElementById('char-name').value.trim(),
    tagline: document.getElementById('char-tagline').value.trim(),
    greeting: document.getElementById('char-greeting').value.trim(),
    definition: document.getElementById('char-definition').value.trim(),
    avatar: document.getElementById('char-avatar').value.trim() || '✨',
  });
});

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Auto-resize textarea
messageInput.addEventListener('input', () => {
  messageInput.style.height = 'auto';
  messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
});

searchInput.addEventListener('input', () => {
  renderCharacterList(searchInput.value);
});

document.getElementById('back-btn')?.addEventListener('click', () => {
  chatView.classList.add('hidden');
  emptyState.classList.remove('hidden');
  document.getElementById('sidebar').classList.remove('hidden-mobile');
  currentCharacter = null;
  renderCharacterList(searchInput.value);
});

// Init
loadData();
renderCharacterList();
