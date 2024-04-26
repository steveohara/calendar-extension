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
const storageCache = {
  optionalEvents: "showOptionalEvents",
  hideMornings: false,
  hideMorningsTime: "08:00",
};

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
    if (key === "optionalEvents") {
      chrome.contextMenus.update(newValue, {checked: true});
    }
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
 * out the manipulation of the DOM based on the action
 *
 * @param action Type of action to carry out
 * @param hideMornings True if we should hide the morning part of the calendar
 * @param hideMorningsTime The time we should hide till
 */
function injectOptionalEvents(action, hideMornings, hideMorningsTime) {

  // Check if we are changing the optional events
  if (action !== "showOptionalEvents") {
    let hide = action === "hideOptionalEvents"
    document.querySelectorAll("div.GTG3wb.Epw9Dc").forEach(function (element, index) {
      if (hide) {
        element.style.display = "none";
      }
      else {
        element.style.opacity = 0.2;
      }
    });
  }

  // Are we trying to hide the morning
  if (hideMornings && hideMorningsTime !== "") {
    let time = hideMorningsTime.replace(/[:].+/g, "") * 1;
    time = time > 12 ? ((time - 12) + "PM") : (time + " AM")
    document.querySelectorAll("span.wO6pL.iHNmdb").forEach(function (element, index) {
      if (element.innerText === time) {
        let offset = element.closest("div.RuAPDb.T8M5bd").getBoundingClientRect().y +
                              element.getBoundingClientRect().y;
        document.querySelector("div.uEzZIb").style.marginTop = -offset + "px";
      }
    });
  }

  // Calendar builds in phases, so we can't be sure that it's all
  // painted at this stage so we will check for the presence of parts of the DOM
  // as an indicator that it's ready and keep trying until it is
  if (!document.alreadyRun || document.alreadyRun < 5) {
    setTimeout(function() {
      injectOptionalEvents(action)
      document.alreadyRun = document.alreadyRun ? document.alreadyRun + 1 : 1;
    }, 1000);
  }
  document.alreadyRun = document.querySelector("span.wO6pL.iHNmdb") ? 5 : document.alreadyRun;
}

/**
 * Called whenever a page is loaded in the browser or it changes
 * It checks to see if it's a Google Calendar and if the option is enabled
 * and if so, will inject the code that actually does the hiding of screen elements
 * @param details The event details containing the URL and tab ID
 */
function checkAction(details) {
  if (/https:\/\/calendar.google.com\/calendar\/u\/0\/r.*/.test(details.url)) {

    // Check if we need to change the visibility of the optional events
    // and/or do something else with the display
    if (storageCache.optionalEvents !== "showOptionalEvents" || storageCache.hideMornings) {
      chrome.scripting.executeScript({
        target: {tabId: details.tabId},
        func: injectOptionalEvents,
        args: [
                storageCache.optionalEvents,
                storageCache.hideMornings,
                storageCache.hideMorningsTime
        ]
      });
    }
  }
}
