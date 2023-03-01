/* // Initialize button with users' preferred color
const changeColor = document.getElementById("changeColor");
const fromSrc = document.getElementById("fromSrc");
const toSrc = document.getElementById("toSrc");

console.log(changeColor);
console.log(fromSrc);
console.log(toSrc);

chrome.storage.sync.get("color", ({ color }) => {
  changeColor.style.backgroundColor = color;
});

// When the button is clicked, inject setPageBackgroundColor into current page
changeColor.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: setPageBackgroundColor,
  });

  chrome.storage.sync.set({ color: "red" });
});

// The body of this function will be executed as a content script inside the
// current page
function setPageBackgroundColor() {
  chrome.storage.sync.get("color", ({ color }) => {
    document.body.style.backgroundColor = color;
  });
}

load.onclick = async () => {
  const response = await chrome.runtime.sendMessage({ greeting: "hello" });
  // do something with response here, not outside the function
  console.log(response);
};
 */
chrome.storage.sync.get("map", ({ map }) => {
  Object.keys(map).forEach((key) => {
    appendRow([
      map[key].id,
      map[key].activate,
      map[key].angular,
      map[key].domain,
      map[key].fromSrc,
      map[key].name,
    ]);
  });
});

/* chrome.storage.sync.get("websocket_src", async ({ websocket_src }) => {
  log(websocket_src);
  websocketSrc.value = websocket_src;
  const response = await chrome.runtime.sendMessage({ connectTo: websocketSrc.value });
});
connect.onclick = async () => {
  log(websocketSrc.value);
  
  const response = await chrome.runtime.sendMessage({ connectTo: websocketSrc.value });
  // do something with response here, not outside the function
  chrome.storage.sync.set({ websocket_src: websocketSrc.value });
}; */
append.onclick = async () => {
  const response = await chrome.runtime.sendMessage({
    appendRule: {
      activate: activate.checked,
      angular: angular.checked,
      domain: domain.value,
      fromSrc: fromSrc.value,
      name: nameProject.value,
    },
  });
};

function log(text) {
  myLog.append(`${text}`);
}

function appendRow(data) {
  const row = document.createElement("tr");
  data.forEach((item) => {
    const cell = document.createElement("td");
    cell.innerHTML = item;
    row.appendChild(cell);
  });
  tableList.appendChild(row);
}
