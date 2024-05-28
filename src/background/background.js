// 监听书签变化事件
chrome.bookmarks.onCreated.addListener(sendBookmarksToServer);
chrome.bookmarks.onRemoved.addListener(sendBookmarksToServer);
chrome.bookmarks.onChanged.addListener(sendBookmarksToServer);

while (true) {
  console.log("background.js正在被调用");
}

// 将书签数据转换为 JSON 并发送到服务器
function sendBookmarksToServer() {
  //
  console.log("sendBookmarksToServer正在被调用");
  chrome.bookmarks.getTree((bookmarkTreeNodes) => {
    const bookmarksJSON = convertBookmarksToJSON(bookmarkTreeNodes);
    sendJSONToServer(bookmarksJSON);
  });
}

function convertBookmarksToJSON(bookmarkTreeNodes) {
  const bookmarksJSON = [];
  for (const node of bookmarkTreeNodes) {
    if (node.children) {
      bookmarksJSON.push(...convertBookmarksToJSON(node.children));
    } else {
      const bookmark = {
        title: node.title,
        url: node.url,
        icon: "", // 初始化图标URL为空
      };
      bookmarksJSON.push(bookmark);
      fetchFavicon(node.url).then((iconUrl) => {
        bookmark.icon = iconUrl;
      });
    }
  }
  return bookmarksJSON;
}

function fetchFavicon(url) {
  return fetch(url)
    .then((response) => response.text())
    .then((htmlString) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlString, "text/html");
      const iconLink = doc.querySelector('link[rel~="icon"]');
      if (iconLink) {
        return iconLink.href;
      } else {
        // 如果没有找到favicon，使用默认的favicon路径
        return new URL("/favicon.ico", url).toString();
      }
    })
    .catch(() => {
      // 如果有任何错误，例如网络问题，返回一个空字符串或默认图标
      return "";
    });
}

// 发送 JSON 数据到服务器
function sendJSONToServer(jsonData) {
  const serverUrl = "https://localhost:8000/api/user/syncBookmarkConfig";
  fetch(serverUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(jsonData),
  })
    .then((response) => response.json())
    .then((data) => console.log("Success:", data))
    .catch((error) => console.error("Error:", error));
}
