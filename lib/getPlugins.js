export default async () => {
  const env = await (await fetch(chrome.runtime.getURL('env.json'))).json();

  const plugins = {};

  for (const sourceUrl of env.pluginSources) {
    const sourcePlugins = await (await fetch(`${sourceUrl}/plugins.json?_${Date.now()}`)).json();

    for (const host in sourcePlugins) {
      if (sourcePlugins.hasOwnProperty(host)) {
        if (!plugins[host]) plugins[host] = [];

        plugins[host].push(...sourcePlugins[host].map((x) => ({ source: sourceUrl, ...x })));
      }
    }
  }

  return plugins;
};