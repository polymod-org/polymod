const getHost = () => chrome.extension.getBackgroundPage().host;

const hotLoadPlugin = (host, name) => chrome.extension.getBackgroundPage().sendHostMsg(getHost(), { loadPlugin: [ host, name ] })
const hotUnloadPlugin = (name) => chrome.extension.getBackgroundPage().sendHostMsg(getHost(), { unloadPlugin: [ name ] })

const hostFriendlyNames = {
  'app.revolt.chat': 'Revolt',
  'app.element.io': 'Element',
  'www.guilded.gg': 'Guilded',
  'app.slack.com': 'Slack',
  'teams.microsoft.com': 'Teams'
};

let pluginsEnabled, plugins;

const makeSwitch_old = (listener, initial = false) => {
  const switchEl = document.createElement('label');
  switchEl.className = 'switch';
  if (initial) switchEl.classList.add('on');
  
  const switchInputChildEl = document.createElement('input');
  switchInputChildEl.type = 'checkbox';
  switchInputChildEl.checked = initial;
  
  switchInputChildEl.onchange = () => {
    const value = switchInputChildEl.checked;
    
    setTimeout(() => {
      if (value) switchEl.classList.add('on');
      else switchEl.classList.remove('on');
    }, 180);

    listener(value);
  };
  
  switchEl.appendChild(switchInputChildEl);
  
  const switchDivChildEl = document.createElement('div');
  switchEl.appendChild(switchDivChildEl);
  
  return switchEl;
};

const makeSwitch_new = (listener, initial = false) => {
  let value = initial;

  const buttonEl = document.createElement('div');
  buttonEl.className = 'plugin-button';

  buttonEl.classList.add(initial ? 'remove' : 'add');

  const regenIcon = () => buttonEl.innerHTML = !value ? `<svg aria-hidden="false" width="24" height="24" viewBox="0 0 18 18"><polygon fill-rule="nonzero" fill="currentColor" points="15 10 10 10 10 15 8 15 8 10 3 10 3 8 8 8 8 3 10 3 10 8 15 8"></polygon></svg>` : `<svg aria-hidden="false" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M15 3.999V2H9V3.999H3V5.999H21V3.999H15Z"></path><path fill="currentColor" d="M5 6.99902V18.999C5 20.101 5.897 20.999 7 20.999H17C18.103 20.999 19 20.101 19 18.999V6.99902H5ZM11 17H9V11H11V17ZM15 17H13V11H15V17Z"></path></svg>`;
  regenIcon();

  const regenLastAdded = () => { // CSS doesn't support this because sigh
    const els = [...document.querySelectorAll('.item.added:not(.moving)')];
    els.forEach((x) => x.classList.remove('last'));

    if (!document.querySelector('.item:not(.added)')) return;

    const last = els.pop();
    last?.classList?.add('last');
  };

  const transition = (el) => {
    const oldBox = el.getBoundingClientRect();

    el.classList.add('moving');
    el.classList.remove('last');

    if (value) el.classList.add('added');
      else el.classList.remove('added');

    const lastEl = document.querySelector('.item.added.last');

    const lastIndex = Array.prototype.indexOf.call(el.parentNode.children, lastEl);
    const thisIndex = Array.prototype.indexOf.call(el.parentNode.children, el);

    const willBeLast = lastEl && thisIndex > lastIndex && value;

    if (willBeLast) {
      lastEl.classList.remove('last');
      el.classList.add('last');
    }

    requestAnimationFrame(() => {
      const newBox = el.getBoundingClientRect();

      const deltaX = oldBox.left - newBox.left; 
      const deltaY = oldBox.top - newBox.top;

      el.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      el.style.transition = '';

      requestAnimationFrame(() => {
        el.style.transform = '';
        el.style.transition = 'transform .5s, margin-bottom .5s';
      });

      setTimeout(() => {
        el.classList.remove('moving');

        if (!willBeLast) regenLastAdded();
      }, 450);
    });
    
    if (!willBeLast) regenLastAdded();
  };

  buttonEl.onclick = () => {
    value = !value;

    regenIcon();

    if (value) buttonEl.className = 'plugin-button remove';
      else buttonEl.className = 'plugin-button add';

    transition(buttonEl.parentElement);

    listener(value);
  };

  setTimeout(() => {
    if (value) buttonEl.parentElement.classList.add('added');
      else buttonEl.parentElement.classList.remove('added');

    regenLastAdded();
  }, 10);

  return buttonEl;
};

const makeSwitch = localStorage.getItem('New UI') !== 'true' ? makeSwitch_old : makeSwitch_new;


const makeOptions = (target, header, items, clear = true) => {
  if (clear) target.innerHTML = '';

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
  const host = getHost();
  
  if (!plugins[host]) return;

  makeOptions(target, themes ? 'Themes' : 'Plugins for ' + hostFriendlyNames[host], (themes ? plugins.themes : plugins[host]).map((x) => ([
    x.split('.').slice(0, -1).join('.'),
    pluginsEnabled[host + '-' + x],
    (value) => {
      if (value) hotLoadPlugin(themes ? 'themes' : host, x);
        else hotUnloadPlugin(x);

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
  const target = document.querySelector('.content');

  target.innerHTML = '';

  makeOptions(target, 'UI', ['Disable App Accents', 'New UI'].map((x) => ([x, localStorage.getItem(x) === 'true', (value) => localStorage.setItem(x, value)])), false);
};

document.body.id = getHost();

if (localStorage.getItem('Disable App Accents') !== 'true') document.body.classList.add('app-accents');