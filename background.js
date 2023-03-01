const map = {};
let _id = 2;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ map });
});

/* chrome.declarativeNetRequest.updateDynamicRules(); */

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.connectTo) {
    connectTo(request.connectTo);
    sendResponse({ state: "connect" });
  }
  if (request.appendRule) {
    const { activate, angular, domain, fromSrc, name } = request.appendRule;
    const id = _id++;
    map[id] = { id, activate, angular, domain, fromSrc, name };
    console.log("[Append]", activate, angular, domain, fromSrc, name);
    chrome.storage.sync.set({ map });

    if (activate) connectTo(domain);
    sendResponse({ state: "append" });
  }
});

chrome.storage.sync.get("map", async ({ map }) => {
  console.log(map);
  Object.keys(map).forEach((key) => {
    const { activate, domain } = map[key];
    if (activate) connectTo(domain);
  });
});

function connectTo(src, id) {
  let socket = new WebSocket(`ws://${src}/ws`);

  console.log(socket);

  socket.onopen = function (e) {
    console.log("[open] Соединение установлено");
    console.log("Отправляем данные на сервер");
    socket.send("Меня зовут Джон");
  };

  socket.onmessage = function (event) {
    /* console.log(`[message] Данные получены с сервера: ${event.data}`); */
    const data = JSON.parse(event.data);
    if (data.type == "hash") console.log(data.data);
  };

  socket.onclose = function (event) {
    if (event.wasClean) {
      console.log(
        `[close] Соединение закрыто чисто, код=${event.code} причина=${event.reason}`
      );
    } else {
      // например, сервер убил процесс или сеть недоступна
      // обычно в этом случае event.code 1006
      console.log("[close] Соединение прервано");
    }
  };

  socket.onerror = function (error) {
    console.log(`[error]`);
  };
}

function createNewRedirectRule(
  domain = "localhost",
  fromSrc = "floor-3a8b8e9d4e09cfbc226e.js",
  toSrc = "http://localhost:3001/assets/bundles/main-d266aca318608de9ec4a.js",
  adblockRuleID = 2
) {
  return (
    {
      addRules: [
        {
          action: {
            type: "redirect",
            redirect: {
              url: toSrc,
            },
          },
          condition: {
            urlFilter: fromSrc, // block URLs that starts with this
            domains: [domain],
            resourceTypes: ["script"],
          },
          id: adblockRuleID,
          priority: 1,
        },
      ],
      removeRuleIds: [adblockRuleID], // this removes old rule if any
    },
    () => {
      console.log("block rule added");
    }
  );
}
