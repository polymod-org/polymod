let plugins, pluginsEnabled;
let loaded = {};

let env = {};

const init = async () => {
  await new Promise((res) => {
    chrome.storage.local.get(null, (data) => {
      pluginsEnabled = JSON.parse(data.enabled || '{}');

      res();
    });
  });

  env = await (await fetch(chrome.runtime.getURL('env.json'))).json();

  plugins = await (await fetch(`${env.endpoints.plugins}/plugins.json?_${Date.now()}`)).json();
  
  setTimeout(loadPlugins, 3000);
};

const loadPlugin = async (host, name) => {
  console.log('loadPlugin', host, name);

  const ext = name.split('.').slice(1).join('.');

  switch (ext) {
    case 'css': {
      const CSS = await import(`https://polyglot-mod.github.io/standard/src/css.js?_${Date.now()}`);

      loaded[name] = {
        load: async () => {
          CSS.add(await (await fetch(`${env.endpoints.plugins}/${host}/${name}?_${Date.now()}`)).text());
        },
  
        unload: () => {
          CSS.remove();
        }
      };

      break;
    }

    default: {
      loaded[name] = await import(`${env.endpoints.plugins}/${host}/${name}?_${Date.now()}`);
      break;
    }
  }

  if (loaded[name].vscode) { // VSCode Theme embedded
    const theme = loaded[name].vscode;
    const VSCode = await import(`https://polyglot-mod.github.io/standard/src/theme-compat/vscode.js?_${Date.now()}`);

    loaded[name] = {
      load: async () => {
        VSCode.add(theme);
      },
  
      unload: () => {
        VSCode.remove();
      }
    };
  }

  loaded[name].load();
};

const unloadPlugin = async (name) => {
  console.log('unloadPlugin', name);

  loaded[name].unload();
  delete loaded[name];
}

const loadPlugins = () => {
  const host = location.host;

  for (const plugin of plugins[host].filter((x) => pluginsEnabled[host + '-' + x.file])) {
    loadPlugin(host, plugin.file);
  }

  for (const themesHost of Object.keys(plugins).filter((x) => x.endsWith('themes'))) {
    for (const plugin of plugins[themesHost].filter((x) => pluginsEnabled[host + '-' + x.file])) {
      loadPlugin(themesHost, plugin.file);
    }
  }

  for (const plugin of plugins['generic'].filter((x) => pluginsEnabled[host + '-' + x.file])) {
    loadPlugin('generic', plugin.file);
  }
};

const port = chrome.runtime.connect({ name: location.host });

port.onMessage.addListener((msg) => {
  if (msg.loadPlugin) {
    loadPlugin(...msg.loadPlugin);
  }

  if (msg.unloadPlugin) {
    unloadPlugin(...msg.unloadPlugin);
  }
});

const sendHost = () => {
  port.postMessage({ active: true });
};
sendHost();

document.addEventListener("visibilitychange", () => {
  if (document.hidden) return;
  sendHost();
});

init();