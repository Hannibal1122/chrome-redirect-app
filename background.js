let _id;
let rulesId = 2;
let saveMap;
let rules = {};
const openSocketMap = new Map();

// Первоначальная инициализация
chrome.storage.sync.get('map', async ({ map }) => {
    saveMap = map;

    if (!saveMap) {
        saveMap = {};
        chrome.storage.sync.set({ map: saveMap });
    }
    Object.keys(saveMap).forEach((key) => {
        const { activate, id } = saveMap[key];
        if (activate) connectTo(id);
    });
    const ids = Object.keys(saveMap).map((key) => key);
    _id = ids.length ? Math.max(...ids) + 1 : 1;
    console.log('ID', _id);
});

chrome.runtime.onInstalled.addListener(() => {});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.appendRule) {
        const { activate, angular, domain, fromDomain, fromBundle } = request.appendRule;
        const id = _id++;
        saveMap[id] = { id, activate, angular, domain, fromDomain, fromBundle };
        console.log('[Append]', activate, angular, domain, fromDomain, fromBundle);
        chrome.storage.sync.set({ map: saveMap });

        if (activate) connectTo(id);
        sendResponse({ state: 'append' });
    }
    if (request.activateRule) {
        const { id, activate } = request.activateRule;

        saveMap[id].activate = activate;
        chrome.storage.sync.set({ map: saveMap });

        if (activate) connectTo(id);
        else {
            closeSocket(id);
            removeRule(id, saveMap[id].domain);
        }
        sendResponse({ state: 'activate' });
    }
    if (request.removeRule) {
        const { id } = request.removeRule;
        delete saveMap[id];
        chrome.storage.sync.set({ map: saveMap });
        sendResponse({ state: 'remove' });
    }
    if (request.log) {
        console.log(request.log);
    }
});

function connectTo(id) {
    const { domain } = saveMap[id];
    if (openSocketMap.has(domain)) return;
    const socket = new WebSocket(`ws://${domain}/ws`);
    openSocketMap.set(domain, socket);

    console.log(socket);

    socket.onopen = function (e) {
        console.log(`[${domain}] Соединение установлено`);
    };

    socket.onmessage = function (event) {
        console.log(`[message] Данные получены с сервера: ${event.data}`);
        const data = JSON.parse(event.data);
        if (data.type == 'hash') {
            appendRule(id, data.data, 'main');
            appendRule(id, data.data, 'vendor');
            appendRule(id, data.data, 'runtime');
            appendRule(id, data.data, 'polyfills');
            console.log(`[${domain}] ${data.data}`);
        }
    };

    socket.onclose = function (event) {
        if (event.wasClean) {
            console.log(`[${domain}] Соединение закрыто чисто, код=${event.code} причина=${event.reason}`);
        } else {
            // например, сервер убил процесс или сеть недоступна
            // обычно в этом случае event.code 1006
            console.log(`[${domain}] Соединение прервано`);
        }
        openSocketMap.delete(domain);
    };

    socket.onerror = function (error) {
        console.log(`[${domain}] error`);
    };
}

function closeSocket(id) {
    const { domain } = saveMap[id];
    if (!openSocketMap.has(domain)) return;
    openSocketMap.get(domain).close();
}

function appendRule(id, hash, name) {
    const { domain, fromDomain, fromBundle } = saveMap[id];
    if (!rules[id]) rules[id] = {};

    let ruleId = rules[id][name];
    if (!ruleId) {
        ruleId = rulesId++;
        rules[id][name] = ruleId;
    }

    let toSrc = `http://${domain}/assets/bundles/${name}-${hash}.js`;
    const rule = createNewRedirectRule(fromDomain, fromBundle.replace('main-', name + '-'), toSrc, ruleId);
    chrome.declarativeNetRequest.updateDynamicRules(rule, () => {
        console.log(`[${domain}]`, fromDomain, `${name}-${hash}`, toSrc);
    });
}

function removeRule(id, domain) {
    if (rules[id]) {
        chrome.declarativeNetRequest.updateDynamicRules(
            {
                removeRuleIds: Object.keys(rules[id]).map((key) => rules[id][key]),
            },
            () => {
                console.log(`[${domain}]`, 'remove rule');
            },
        );
    }
}

function createNewRedirectRule(fromDomain, fromBundle, toSrc, adblockRuleID) {
    return {
        addRules: [
            {
                action: {
                    type: 'redirect',
                    redirect: {
                        url: toSrc,
                    },
                },
                condition: {
                    urlFilter: fromBundle, // block URLs that starts with this
                    domains: [fromDomain],
                    resourceTypes: ['script'],
                },
                id: adblockRuleID,
                priority: 1,
            },
        ],
        removeRuleIds: [adblockRuleID], // this removes old rule if any
    };
}
