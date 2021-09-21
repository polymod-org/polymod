const importHost = 'https://polyglot-mod.github.io/plugins';

let plugins, pluginsEnabled;
let loaded = {};


const init = async () => {
  await new Promise((res) => {
    chrome.storage.local.get(null, (data) => {
      pluginsEnabled = JSON.parse(data.enabled || '{}');

      res();
    });
  });

  plugins = await (await fetch(`https://polyglot-mod.github.io/plugins/plugins.json?_${Date.now()}`)).json();
  
  setTimeout(loadPlugins, 5000);
};

const loadPlugin = async (host, name) => {
  console.log('loadPlugin', host, name);

  loaded[name] = await import(`${importHost}/${host}/${name}.js?_${Date.now()}`);
  loaded[name].load();
};

const unloadPlugin = async (name) => {
  console.log('unloadPlugin', name);

  loaded[name].unload();
  delete loaded[name];
}

const loadPlugins = () => {
  const host = location.host;

  for (const plugin of plugins[host].filter((x) => pluginsEnabled[host + '-' + x])) {
    loadPlugin(host, plugin);
  }

  for (const plugin of plugins['themes'].filter((x) => pluginsEnabled[host + '-' + x])) {
    loadPlugin('themes', plugin);
  }
};

const port = browser.runtime.connect({ name: location.host });

port.onMessage.addListener((msg) => {
  if (msg.loadPlugin) {
    loadPlugin(...msg.loadPlugin);
  }

  if (msg.unloadPlugin) {
    unloadPlugin(...msg.unloadPlugin);
  }
});

const sendHost = () => {
  chrome.runtime.sendMessage({ host: location.host });
};
sendHost();

document.addEventListener("visibilitychange", () => {
  if (document.hidden) return;
  sendHost();
});

init();