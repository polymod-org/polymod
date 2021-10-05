let plugins, pluginsEnabled;
let loaded = {};

const init = async () => {
  await new Promise((res) => {
    chrome.storage.local.get(null, (data) => {
      pluginsEnabled = JSON.parse(data.enabled || '{}');

      res();
    });
  });

  plugins = await (await import(chrome.runtime.getURL('lib/getPlugins.js'))).default();

  setTimeout(loadPlugins, 2000);
};

const loadPlugin = async ({ file, host, source }) => {
  console.log('loadPlugin', host, file);

  const ext = file.split('.').slice(1).join('.');

  switch (ext) {
    case 'css': {
      let el;

      loaded[file] = {
        load: async () => {
          el = document.createElement('style');

          el.appendChild(document.createTextNode(await (await fetch(`${source}/${host}/${file}?_${Date.now()}`)).text()));
        
          document.body.appendChild(el);
        },
  
        unload: () => {
          if (el) el.remove();
        }
      };

      break;
    }

    default: {
      loaded[file] = await import(`${source}/${host}/${file}?_${Date.now()}`);

      if (!loaded[file].load && loaded[file].default) loaded[file] = loaded[file].default; // If default is exported use that if no load / other funcs, use exported default object (plugin generators)

      break;
    }
  }

  if (loaded[file].vscode) { // VSCode Theme embedded
    const theme = loaded[file].vscode;
    const VSCode = await import(`https://standard.polymod.dev/theme-compat/vscode.js`);

    loaded[file] = {
      load: async () => {
        VSCode.add(theme);
      },
  
      unload: () => {
        VSCode.remove();
      }
    };
  }

  loaded[file].load();
};

const unloadPlugin = async (name) => {
  console.log('unloadPlugin', name);

  loaded[name].unload();
  delete loaded[name];
}

const loadPlugins = () => {
  const host = location.host;

  for (const plugin of plugins[host].filter((x) => pluginsEnabled[host + '-' + x.file])) {
    loadPlugin(plugin);
  }

  for (const themesHost of Object.keys(plugins).filter((x) => x.endsWith('themes'))) {
    for (const plugin of plugins[themesHost].filter((x) => pluginsEnabled[host + '-' + x.file])) {
      loadPlugin(plugin);
    }
  }

  for (const plugin of plugins['generic'].filter((x) => pluginsEnabled[host + '-' + x.file])) {
    loadPlugin(plugin);
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