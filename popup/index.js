const getHost = () => chrome.extension.getBackgroundPage().host;

const hostFriendlyNames = {
  'app.revolt.chat': 'Revolt',
  'app.element.io': 'Element'
};

let pluginsEnabled, plugins;

const makeSwitch = (listener, initial = false) => {
  const switchEl = document.createElement('label');
  switchEl.className = 'switch';
  if (initial) switchEl.classList.add('on');
  
  const switchInputChildEl = document.createElement('input');
  switchInputChildEl.type = 'checkbox';
  switchInputChildEl.checked = initial;
  
  switchInputChildEl.onchange = () => {
    const value = switchInputChildEl.checked;
    listener(value);
    
    setTimeout(() => {
      if (value) switchEl.classList.add('on');
      else switchEl.classList.remove('on');
    }, 150);
  };
  
  switchEl.appendChild(switchInputChildEl);
  
  const switchDivChildEl = document.createElement('div');
  switchEl.appendChild(switchDivChildEl);
  
  return switchEl;
};

const makeOptions = (target, header, items) => {
  target.innerHTML = '';
  
  const hostEl = document.createElement('div');
  hostEl.className = 'header';
  hostEl.textContent = header;
  
  target.appendChild(hostEl);
  
  for (const item of items) {
    const el = document.createElement('div');
    el.className = 'item';
    
    const nameEl = document.createElement('div');
    nameEl.className = 'item-name';
    nameEl.textContent = item[0];
    
    el.appendChild(nameEl);
    
    const switchEl = makeSwitch(item[2], item[1]);
    
    el.appendChild(switchEl);
    
    target.appendChild(el);
  }
};

const makePluginContent = (target, themes = false) => {
  let host = getHost();
  
  if (!plugins[host]) return;
  
  document.body.id = host;
  
  makeOptions(target, themes ? 'Themes' : 'Plugins for ' + hostFriendlyNames[host], (themes ? plugins.themes : plugins[host]).map((x) => ([
    x,
    pluginsEnabled[host + '-' + x],
    (value) => {
      console.log(value);
      
      pluginsEnabled[host + '-' + x] = value;
      chrome.storage.local.set({ enabled: JSON.stringify(pluginsEnabled) });
    }
  ])));
};

const init = async () => {
  await new Promise((res) => {
    chrome.storage.local.get(null, (data) => {
      pluginsEnabled = JSON.parse(data.enabled || '{}');
      
      res();
    });
  });
  
  plugins = await (await fetch(`https://polyglot-mod.github.io/plugins/plugins.json?_${Date.now()}`)).json();
  
  const activeTab = localStorage.getItem('activeTab') || 'plugins';
  
  if (activeTab === 'themes') {
    themesTab.classList.add('active');
    pluginsTab.classList.remove('active');
  }
  
  if (activeTab === 'settings') {
    settingsTab.classList.add('active');
    pluginsTab.classList.remove('active');
    
    openSettings();
    
    return;
  }
  
  makePluginContent(document.querySelector('.content'), activeTab === 'themes');
};

init();

const themesTab = document.getElementById('themes-tab');
const pluginsTab = document.getElementById('plugins-tab');
const settingsTab = document.getElementById('settings-tab');

pluginsTab.onclick = () => {
  pluginsTab.classList.add('active');
  themesTab.classList.remove('active');
  settingsTab.classList.remove('active');
  
  makePluginContent(document.querySelector('.content'), false);
  localStorage.setItem('activeTab', 'plugins');
};

themesTab.onclick = () => {
  pluginsTab.classList.remove('active');
  themesTab.classList.add('active');
  settingsTab.classList.remove('active');
  
  makePluginContent(document.querySelector('.content'), true);
  localStorage.setItem('activeTab', 'themes');
};

settingsTab.onclick = () => {
  pluginsTab.classList.remove('active');
  themesTab.classList.remove('active');
  settingsTab.classList.add('active');
  
  openSettings();
  localStorage.setItem('activeTab', 'settings');
};

const openSettings = () => {
  makeOptions(document.querySelector('.content'), 'Settings', [].map((x) => ([x, localStorage.getItem(x) === 'true', (value) => localStorage.setItem(x, value)])));
};