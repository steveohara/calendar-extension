// Copyright Steve O'Hara
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Where we will expose all the data we retrieve from storage.sync.
const storageCache = { hideOptionalEvents: false };

// Asynchronously retrieve data from storage.sync, then cache it.
const initStorageCache = chrome.storage.sync.get().then((items) => {
  // Copy the data retrieved from storage into storageCache.
  Object.assign(storageCache, items);
});

// A generic onclick callback function
chrome.contextMenus.onClicked.addListener(genericOnClick);

// A generic onclick callback function.
function genericOnClick(info) {
  switch (info.menuItemId) {
    case 'hideOptionalEvents':
      storageCache.hideOptionalEvents = info.checked;
      chrome.storage.sync.set(storageCache);
      console.log('Changed state of hide optional events Status:', info.checked);
      break;
    default:
      console.log('Standard context menu item clicked.');
  }
}

// On installation, create the context menu
chrome.runtime.onInstalled.addListener(function () {

  // Create the menu item list for just the 'page' context
  // Others available are; 'selection', 'link', 'editable', 'image', 'video', 'audio'
  chrome.contextMenus.create({
    title: 'Hide optional events',
    type: 'checkbox',
    contexts: ['page'],
    checked: storageCache.hideOptionalEvents,
    id: 'hideOptionalEvents'
  });
});

// Catch any changes to the storage whether they come from the context menu or the popup
chrome.storage.onChanged.addListener((changes, namespace) => {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    if (key === 'hideOptionalEvents') {
      chrome.contextMenus.update(key, {checked: newValue});
    }
    storageCache[key] = newValue;
    chrome.tabs.reload();
  }
});

// Catch the loading of pages from scratch
chrome.webNavigation.onCompleted.addListener((details) => {
  checkAction(details)
});

// Catch the pge updates through the SPA
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  checkAction(details)
});

/**
 * Called whenever a page is loaded in the browser or changes
 * It checks to see if it's a Google Calendar and if the option is enabled
 * and if so, will inject the code that actually does the hiding of screen elements
 * @param details The event details containing th URL and tab ID
 */
function checkAction(details) {
  if (storageCache.hideOptionalEvents && /https:\/\/calendar.google.com\/calendar\/u\/0\/r.*/.test(details.url)) {
    console.log("Running script in " + details.tabId + " for " + details.url);
    chrome.scripting.executeScript({
      target: { tabId: details.tabId },
      files: ["content.js"]
    });
  }
}
