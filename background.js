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

browser.runtime.onConnect.addListener((port) => {
  console.log(port.sender.tab);
});

chrome.runtime.onMessage.addListener((msg) => {
  if (!msg.host) return;

  console.log(msg.host);
  window.host = msg.host;
});