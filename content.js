const importHost = 'https://polyglot-mod.github.io/plugins';

const plugins = {
  'app.revolt.chat': [ 'DTCompat' ],
  'app.element.io': [ 'DTCompat' ]
};

let pluginsEnabled;

const init = async () => {
  await new Promise((res) => {
    chrome.storage.local.get(null, (data) => {
      pluginsEnabled = JSON.parse(data.enabled || '{}');
      
      for (const host in plugins) {
        for (const plugin of plugins[host]) {
          const id = host + '-' + plugin;
          
          if (pluginsEnabled[id] === undefined) pluginsEnabled[id] = true;
        }
      }
      
      chrome.storage.local.set({ enabled: JSON.stringify(pluginsEnabled) });
      res();
    });
  });
  
  setTimeout(loadPlugins, 5000);
};

const loadPlugins = () => {
  const loadPlugin = async (host, name) => {
    console.log('loadPlugin', host, name);
    const js = await (await fetch(`${importHost}/${host}/${name}.js?_${Date.now()}`)).text();
    eval('(async () => {\n' + js + '\n})();');
  };

  const host = location.host;

  for (const plugin of plugins[host].filter((x) => pluginsEnabled[host + '-' + x])) {
    loadPlugin(host, plugin);
  }
};

const sendHost = () => {
  chrome.runtime.sendMessage({ host: location.host });
};
sendHost();

document.addEventListener("visibilitychange", () => {
  if (document.hidden) return;
  sendHost();
});

init();