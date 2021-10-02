const getHost = () => chrome.extension.getBackgroundPage().host;

const hotLoadPlugin = (plugin, host = getHost()) => chrome.extension.getBackgroundPage().sendHostMsg(host, { loadPlugin: [ plugin ] })
const hotUnloadPlugin = (name, host = getHost()) => chrome.extension.getBackgroundPage().sendHostMsg(host, { unloadPlugin: [ name ] })

const friendlyNameFromHost = (host) => {
  const aliases = { // Special aliases, commonly for special casing
    'youtube': 'YouTube'
  };

  const pretty = (name) => aliases[name] || (name[0].toUpperCase() + name.substring(1).toLowerCase());

  const dotSplit = host.split('.');
  const sub = dotSplit[0];
  const main = dotSplit[1];

  if (sub !== 'www' && sub !== 'app') return pretty(sub);
  return pretty(main);
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
    
    setTimeout(() => {
      if (value) switchEl.classList.add('on');
      else switchEl.classList.remove('on');
    }, 160);

    listener(value);
  };
  
  switchEl.appendChild(switchInputChildEl);
  
  const switchDivChildEl = document.createElement('div');
  switchEl.appendChild(switchDivChildEl);
  
  return switchEl;
};

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

    const nameTitleEl = document.createElement('span');
    nameTitleEl.textContent = item[0].title;

    const nameSubEl = document.createElement('span');
    
    const nameSubImgEl = document.createElement('img');
    nameSubImgEl.src = item[0].img;

    const nameSubTextEl = document.createElement('span');
    nameSubTextEl.textContent = item[0].sub;

    nameSubEl.append(item[0].img ? nameSubImgEl : '', nameSubTextEl);
    nameEl.append(nameTitleEl, nameSubEl);
    
    el.appendChild(nameEl);
    
    const switchEl = makeSwitch(item[2], item[1]);
    
    el.appendChild(switchEl);
    
    target.appendChild(el);
  }
};

const makePluginOptions = (target, host, pluginsHost, header) => {
  makeOptions(target, header, plugins[pluginsHost].map((x) => ([
    { title: x.file.split('.').slice(0, -1).join('.'), img: x.author.picture, sub: x.author.name },
    pluginsEnabled[host + '-' + x.file],
    (value) => {
      pluginsEnabled[host + '-' + x.file] = value;

      if (localStorage.getItem('Sync Themes') === 'true') {
        for (const hostSync in plugins) {
          if (plugins.hasOwnProperty(hostSync)) {
            pluginsEnabled[hostSync + '-' + x.file] = value;

            if (value) hotLoadPlugin(x, hostSync);
              else hotUnloadPlugin(x.file, hostSync)
          }
        }
      } else {
        if (value) hotLoadPlugin(x);
          else hotUnloadPlugin(x.file);
      }

      chrome.storage.local.set({ enabled: JSON.stringify(pluginsEnabled) });
    }
  ])), false);
};

const makePluginContent = (target, themes = false) => {
  const host = getHost();
  
  if (!plugins[host]) return;

  target.innerHTML = '';

  if (themes) {
    makePluginOptions(target, host, 'discord-themes', 'Discord Themes');
    makePluginOptions(target, host, 'vscode-themes', 'VSCode Themes');
  } else {
    makePluginOptions(target, host, host, 'Plugins for ' + friendlyNameFromHost(host));
    makePluginOptions(target, host, 'generic', 'Cross-app Plugins');
  }
};

const init = async () => {
  await new Promise((res) => {
    chrome.storage.local.get(null, (data) => {
      pluginsEnabled = JSON.parse(data.enabled || '{}');
      
      res();
    });
  });

  plugins = await (await import(chrome.runtime.getURL('lib/getPlugins.js'))).default();
  
  const activeTab = localStorage.getItem('activeTab') || 'plugins';

  const tabs = {
    'plugins': pluginsTab,
    'themes': themesTab,
    'settings': settingsTab
  };

  transitionActiveTab(tabs[activeTab]);


  if (activeTab === 'settings') {
    return openSettings();
  }
  
  makePluginContent(document.querySelector('.content'), activeTab === 'themes');
};

init();

const themesTab = document.getElementById('themes-tab');
const pluginsTab = document.getElementById('plugins-tab');
const settingsTab = document.getElementById('settings-tab');

const tabHighlight = document.getElementById('tab-highlight');

const transitionActiveTab = (el) => {
  [themesTab, pluginsTab, settingsTab].forEach((x) => x.classList.remove('active'));

  const box = el.getBoundingClientRect();

  tabHighlight.style.borderRadius = getComputedStyle(el).borderRadius;

  tabHighlight.style.left = box.left + 'px';
  tabHighlight.style.top = box.top + 'px';
  tabHighlight.style.width = box.width + 'px';
  tabHighlight.style.height = box.height + 'px';

  setTimeout(() => {
    el.classList.add('active');
  }, 130);
};

pluginsTab.onclick = () => {
  transitionActiveTab(pluginsTab);
  
  makePluginContent(document.querySelector('.content'), false);
  localStorage.setItem('activeTab', 'plugins');
};

themesTab.onclick = () => {
  transitionActiveTab(themesTab);
  
  makePluginContent(document.querySelector('.content'), true);
  localStorage.setItem('activeTab', 'themes');
};

settingsTab.onclick = () => {
  transitionActiveTab(settingsTab);
  
  openSettings();
  localStorage.setItem('activeTab', 'settings');
};

const openSettings = () => {
  const target = document.querySelector('.content');

  target.innerHTML = '';

  const settingDescriptions = {
    'Disable App Accents': 'Disables app-specific theming of polyglot\'s UI',
    'Sync Themes': 'Use same themes across all apps (resets themes)'
  };

  makeOptions(target, 'UI', ['Disable App Accents'].map((x) => ([
    { title: x, sub: settingDescriptions[x] },
    localStorage.getItem(x) === 'true',
    (value) => {
      localStorage.setItem(x, value);

      setTimeout(() => { location.reload() }, 300);
    }
  ])), false);

  makeOptions(target, 'Plugins', ['Sync Themes'].map((x) => ([
    { title: x, sub: settingDescriptions[x] },
    localStorage.getItem(x) === 'true',
    (value) => {
      localStorage.setItem(x, value);

      if (x === 'Sync Themes' && value) {
        for (const themesHost of Object.keys(plugins).filter((x) => x.endsWith('themes'))) {
          for (const plugin of plugins[themesHost]) {
            Object.keys(pluginsEnabled).filter((x) => x.endsWith('-' + plugin.file)).forEach((x) => { delete pluginsEnabled[x]; });
          }
        }

        chrome.storage.local.set({ enabled: JSON.stringify(pluginsEnabled) });
      }

      setTimeout(() => { location.reload() }, 300);
    }
  ])), false);
};

document.body.id = getHost();

if (localStorage.getItem('Disable App Accents') !== 'true') document.body.classList.add('app-accents');