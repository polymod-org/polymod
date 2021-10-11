const ports = {};

window.sendHostMsg = (host, msg) => {
  for (const port of (ports[host] || [])) {
    try {
      port.postMessage(msg);
    } catch (e) {
      console.error('Failed to post message to port', port, msg, e);
    }
  }
};

chrome.runtime.onConnect.addListener((port) => {
  const host = new URL(port.sender.tab.url).host;
  
  if (!ports[host]) ports[host] = [];
  ports[host].push(port);

  port.onMessage.addListener((msg) => {
    if (msg.active) window.host = host;

    return true;
  });

  return true;
});