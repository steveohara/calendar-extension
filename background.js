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
const storageCache = { optionalEvents: "showOptionalEvents" };

// Asynchronously retrieve data from storage.sync, then cache it.
const initStorageCache = chrome.storage.sync.get().then((items) => {
  Object.assign(storageCache, items);
});

// A generic onclick callback function
chrome.contextMenus.onClicked.addListener(genericOnClick);

/**
 * The menu click callback function
 *
 * @param info Details of the menu item clicked
 */
function genericOnClick(info) {
  storageCache.optionalEvents = info.menuItemId;
  chrome.storage.sync.set(storageCache);
}

// On installation, create the context menus
chrome.runtime.onInstalled.addListener(function () {

  // Create the menu item list for just the 'page' context
  // Others available are; 'selection', 'link', 'editable', 'image', 'video', 'audio'
  chrome.contextMenus.create({
    title: 'Show optional events',
    type: 'radio',
    contexts: ['page'],
    checked: storageCache.optionalEvents === "hideOptionalEvents",
    id: 'showOptionalEvents'
  });
  chrome.contextMenus.create({
    title: 'Hide optional events',
    type: 'radio',
    contexts: ['page'],
    checked: storageCache.optionalEvents === "hideOptionalEvents",
    id: 'hideOptionalEvents'
  });
  chrome.contextMenus.create({
    title: 'De-Emphasise optional events',
    type: 'radio',
    contexts: ['page'],
    checked: storageCache.optionalEvents === "deEmphasiseOptionalEvents",
    id: 'deEmphasiseOptionalEvents'
  });
});

// Catch any changes to the storage whether they come from the context menu or the popup
chrome.storage.onChanged.addListener((changes, namespace) => {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    chrome.contextMenus.update(newValue, {checked: true});
    storageCache[key] = newValue;
  }

  // Reload any calendar tabs
  chrome.tabs.query({url: "https://calendar.google.com/calendar/u/0/r*"}, function(tabs) {
    tabs.forEach(function(tab) {
      chrome.tabs.reload(tab.id);
    })
  });
});

// Catch the loading of pages from scratch
chrome.webNavigation.onCompleted.addListener((details) => {
  checkAction(details)
});

// Catch the page updates through the SPA
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  checkAction(details)
});


/**
 * This function is injected into the Calendar document space and carries
 * out the maniplation of the DOM based on the action
 *
 * @param action Type of action to carry out
 */
function injectOptionalEvents(action) {
  let hide = action === "hideOptionalEvents";
  document.querySelectorAll("div.GTG3wb.Epw9Dc").forEach(function(element, index) {
    if (hide) {
      element.style.display = "none";
    }
    else {
      element.style.opacity = 0.2;
    }
  });

  // Nasty little hack for whe we're viewing the Day - for some reason, Calendar
  // paints the screen twice
  if (!document.alreadyRun) {
    setTimeout(function() {
      injectOptionalEvents(action)
      document.alreadyRun = true;
    }, 1000);
  }
}

/**
 * Called whenever a page is loaded in the browser or changes
 * It checks to see if it's a Google Calendar and if the option is enabled
 * and if so, will inject the code that actually does the hiding of screen elements
 * @param details The event details containing th URL and tab ID
 */
function checkAction(details) {
  if ((storageCache.optionalEvents !== "showOptionalEvents") &&
       /https:\/\/calendar.google.com\/calendar\/u\/0\/r.*/.test(details.url)) {

    chrome.scripting.executeScript({
      target: { tabId: details.tabId },
      func: injectOptionalEvents,
      args: [storageCache.optionalEvents]
    });
  }
}
