const cspAllowAll = [
  'connect-src',
  'style-src',
  'img-src',
  'font-src'
];

/* chrome.webRequest.onHeadersReceived.addListener(({ responseHeaders, url }) => {
  let csp = responseHeaders.find((x) => x.name === 'content-security-policy');

  if (csp) {
    for (let p of cspAllowAll) {
      csp.value = csp.value.replace(`${p}`, `${p} * blob: data:`); // * does not include data: URIs
    }
  }

	return {
    responseHeaders
  };
},

  {
    urls: [
      '*://*\/*'
    ]
  },

  ['blocking', 'responseHeaders']
); */

const ports = {};

const sendHostMsg = (host, msg) => {
  ports[host].postMessage(msg);
};

chrome.runtime.onConnect.addListener((port) => {
  const host = new URL(port.sender.tab.url).host;
  ports[host] = port;

  port.onMessage.addListener((msg) => {
    if (msg.active) window.host = host;
  });
});