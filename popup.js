chrome.storage.sync.get('map', ({ map }) => {
    Object.keys(map).forEach((key) => {
        const remove = document.createElement('button');
        remove.innerHTML = 'Удалить';
        remove.onclick = async () => {
            row.parentNode.removeChild(row);
            await chrome.runtime.sendMessage({
                removeRule: {
                    id: map[key].id,
                },
            });
        };
        const activate = document.createElement('input');
        activate.setAttribute("type", "checkbox");
        activate.checked = map[key].activate;
        activate.onchange = async () => {
            await chrome.runtime.sendMessage({
                activateRule: {
                    id: map[key].id,
                    activate: activate.checked,
                },
            });
        }

        const row = appendRow([
            String(map[key].id),
            activate,
            map[key].angular ? "yes" : "no",
            map[key].domain,
            map[key].fromDomain,
            map[key].fromBundle,
            remove,
        ]);
    });
});

append.onclick = async () => {
    const response = await chrome.runtime.sendMessage({
        appendRule: {
            activate: activate.checked,
            angular: angular.checked,
            domain: domain.value,
            fromDomain: fromDomain.value,
            fromBundle: fromBundle.value,
        },
    });
};

function appendRow(data) {
    const row = document.createElement('tr');
    data.forEach((item) => {
        const cell = document.createElement('td');
            if (typeof item == 'string') cell.innerHTML = item;
            else cell.appendChild(item);
        row.appendChild(cell);
    });
    tableList.appendChild(row);
    return row;
}
