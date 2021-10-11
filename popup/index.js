const getHost = () => chrome.extension.getBackgroundPage().host;

const hotLoadPlugin = (plugin, host = getHost()) => chrome.extension.getBackgroundPage().sendHostMsg(host, { loadPlugin: [ plugin ] })
const hotUnloadPlugin = (name, host = getHost()) => chrome.extension.getBackgroundPage().sendHostMsg(host, { unloadPlugin: [ name ] })

const friendlyNameFromHost = (host) => {
  const aliases = { // Special aliases, commonly for special casing
    'youtube': 'YouTube',
    'duckduckgo': 'DuckDuckGo'
  };

  const pretty = (name) => aliases[name] || (name[0].toUpperCase() + name.substring(1).toLowerCase());

  const dotSplit = host.split('.');
  const sub = dotSplit[0];
  const main = dotSplit[1];

  if (sub !== 'www' && sub !== 'app' && sub !== 'open') return pretty(sub);
  return pretty(main);
};

let pluginsEnabled, plugins;

const regenItemEnds = () => {
  document.querySelectorAll('.item').forEach((x) => x.style.borderBottom = ''); // Reset all

  let last;
  for (const item of document.querySelectorAll('.content .item:not([style*="display: none;"]), .content .header')) {
    if (item.className === 'header') {
      item.style.display = '';
    }

    if (!last) {
      last = item;
      continue;
    }

    if (item.className === 'header') {
      if (last.className === 'header') {
        last.style.display = 'none';
      } else {
        last.style.borderBottom = 'none';
      }
    } else {
      item.style.borderBottom = '';
    }

    last = item;
  }

  if (last.className === 'header') {
    last.style.display = 'none';
  } else {
    last.style.borderBottom = 'none';
  }
};

const makePopout = (items) => {
  const el = document.createElement('div');
  el.className = 'popout';

  for (const item of items) {
    const itemEl = document.createElement('div');
    itemEl.className = 'item';
    
    if (item === items[items.length - 1]) {
      itemEl.style.borderBottom = 'none';
    }

    const nameEl = document.createElement('div');
    nameEl.className = 'item-name';

    const nameTitleEl = document.createElement('span');
    nameTitleEl.textContent = item[0];

    nameEl.append(nameTitleEl);
    
    itemEl.appendChild(nameEl);
    
    const switchEl = makeSwitch(item[2], item[1]);
    
    itemEl.appendChild(switchEl);
    
    el.appendChild(itemEl);
  }

  return el;
};

const handleFiltering = (search = localStorage.getItem('Search'), installedOnly = (localStorage.getItem('Installed Only') === 'true')) => {
  const fuzzyReg = new RegExp(`.*${search}.*`, 'i');

  for (const el of document.querySelectorAll('.content .item')) {
    el.style.display =
      (installedOnly && !el.children[1].classList.contains('on')) ||
      (search?.length > 0 && !fuzzyReg.test(el.children[0].children[0].textContent)) ? 'none' : '';
  }

  regenItemEnds();

  localStorage.setItem('Installed Only', installedOnly);
  localStorage.setItem('Search', search);
};

const makeNavbar = () => {
  const el = document.createElement('div');
  el.className = 'navbar';

  const searchEl = document.createElement('input');
  searchEl.type = 'text';
  searchEl.placeholder = 'Search';
  searchEl.value = localStorage.getItem('Search');

  searchEl.oninput = () => {
    handleFiltering(searchEl.value, undefined);
  };

  el.appendChild(searchEl);
  
  const filterButtonEl = document.createElement('button');
  filterButtonEl.innerHTML = `<svg height='300px' width='300px' xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 100 100" style="enable-background:new 0 0 100 100;" xml:space="preserve"><g><path d="M19.5,3.2h60.9c6.4,0,10,7.2,6.3,12.4l-24.2,33c-1,1.3-1.5,2.9-1.5,4.6v36c0,6.2-6.9,9.9-12,6.5l-6.5-4.3   c-2.2-1.4-3.5-3.9-3.5-6.5V53.1c0-1.7-0.5-3.3-1.5-4.6l-24.2-33C9.5,10.4,13.2,3.2,19.5,3.2z"></path></g></svg>`;
  filterButtonEl.id = 'filter-button';

  filterButtonEl.onclick = () => {
    if (document.querySelector('.popout')) return; // Clicking to hide already existing one, ignore

    const popout = makePopout([
      ['Installed Only', localStorage.getItem('Installed Only') === 'true', (value) => {
        handleFiltering(undefined, value);
      }]
    ]);

    filterButtonEl.classList.add('active');

    let initialClick = true;

    const closePopout = (e) => {
      if (initialClick) {
        initialClick = false;
        return;
      }

      if (!e.path.some((x) => x.classList?.contains?.('popout'))) {
        popout.remove();
        filterButtonEl.classList.remove('active');

        document.body.removeEventListener('click', closePopout);
      }
    };

    document.body.addEventListener('click', closePopout);

    document.body.appendChild(popout);

    popout.style.top = (filterButtonEl.getBoundingClientRect().bottom + 12) + 'px';
    popout.style.left = (filterButtonEl.getBoundingClientRect().right - popout.offsetWidth) + 'px';
  };

  el.appendChild(filterButtonEl);

  /* const sortButtonEl = document.createElement('button');
  sortButtonEl.innerHTML = `<svg height='300px' width='300px' xmlns:x="http://ns.adobe.com/Extensibility/1.0/" xmlns:i="http://ns.adobe.com/AdobeIllustrator/10.0/" xmlns:graph="http://ns.adobe.com/Graphs/1.0/" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 64 64" enable-background="new 0 0 64 64" xml:space="preserve"><metadata><sfw xmlns="http://ns.adobe.com/SaveForWeb/1.0/"><slices></slices><sliceSourceBounds y="-8160" x="-8165" width="16389" height="16384" bottomLeftOrigin="true"></sliceSourceBounds></sfw></metadata><g><g><path d="M22.586,44.586L20,47.172V12c0-1.104-0.896-2-2-2s-2,0.896-2,2v35.172l-2.586-2.586c-0.78-0.781-2.048-0.781-2.828,0    c-0.781,0.781-0.781,2.047,0,2.828l6,6C16.976,53.805,17.488,54,18,54s1.024-0.195,1.414-0.586l6-6    c0.781-0.781,0.781-2.047,0-2.828C24.634,43.805,23.366,43.805,22.586,44.586z"></path><path d="M40,36H30c-1.104,0-2,0.896-2,2s0.896,2,2,2h10c1.104,0,2-0.896,2-2S41.104,36,40,36z"></path><path d="M44,26H30c-1.104,0-2,0.896-2,2s0.896,2,2,2h14c1.104,0,2-0.896,2-2S45.104,26,44,26z"></path><path d="M50,16H30c-1.104,0-2,0.896-2,2s0.896,2,2,2h20c1.104,0,2-0.896,2-2S51.104,16,50,16z"></path></g></g></svg>`;

  sortButtonEl.onclick = () => {

  };

  el.appendChild(sortButtonEl); */

  return el;
};

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
    
    if (item === items[items.length - 1]) {
      el.style.borderBottom = 'none';
    }

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

  target.appendChild(makeNavbar());

  if (themes) {
    makePluginOptions(target, host, 'discord-themes', 'Discord Themes');
    makePluginOptions(target, host, 'vscode-themes', 'VSCode Themes');
  } else {
    makePluginOptions(target, host, host, 'Plugins for ' + friendlyNameFromHost(host));
    makePluginOptions(target, host, 'generic', 'Cross-app Plugins');
  }

  handleFiltering();
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