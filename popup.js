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

// In-page cache of the user's options
const options = await chrome.storage.sync.get();

// Get a reference to the useful elements
const showOptionalEvents =  document.getElementById("showOptionalEvents");
const hideOptionalEvents =  document.getElementById("hideOptionalEvents");
const deEmphasiseOptionalEvents =  document.getElementById("deEmphasiseOptionalEvents");
const hideMornings = document.getElementById("hideMornings");
const hideMorningsTime = document.getElementById("hideMorningsTime");
const savedTabs = document.getElementById("savedTabs");
const tabSnapshot = document.getElementById("tabSnapshot");
const tabSnapshotName = document.getElementById("tabSnapshotName");

// Immediately persist options changes to any of the Calendar inputs
[showOptionalEvents, hideOptionalEvents, deEmphasiseOptionalEvents].forEach((option) => {
  option.addEventListener("change", (event) => {
    options.optionalEvents = event.target.value;
    chrome.storage.sync.set(options);
  });
})
hideMornings.addEventListener("change", (event) => {
  options.hideMornings = event.target.checked;
  chrome.storage.sync.set(options);
});
hideMorningsTime.addEventListener("change", (event) => {
  options.hideMorningsTime = event.target.value;
  chrome.storage.sync.set(options);
});
tabSnapshotName.addEventListener("keypress", (e) => {
  if (e.code === "Enter") {
    addNewSnapshot();
    e.preventDefault();
  }
});
tabSnapshot.addEventListener("click", addNewSnapshot);

// Initialize the form with the user's option settings
showOptionalEvents.checked = Boolean(options.optionalEvents === "showOptionalEvents");
hideOptionalEvents.checked = Boolean(options.optionalEvents === "hideOptionalEvents");
deEmphasiseOptionalEvents.checked = Boolean(options.optionalEvents === "deEmphasiseOptionalEvents");
hideMornings.checked = options.hideMornings;
hideMorningsTime.value = options.hideMorningsTime;

/**
 * Attempts to add a new snapshot to the list
 */
function addNewSnapshot() {
  if (tabSnapshotName.value.trim() === "") {
    alert("Must give the snapshot a name");
  }
  else {
    chrome.windows.getCurrent({
      populate: true
    }).then(function (window) {
      let selectedTab = 0;
      let tabUrls = [];
      window.tabs.forEach(function(tab, index) {
        tabUrls.push(tab.url);
        if (tab.highlighted) {
          selectedTab = index;
        }
      })
      options.tabs.push({
        name: tabSnapshotName.value,
        activeTab: selectedTab,
        tabs: tabUrls
      });
      chrome.storage.sync.set(options);
      tabSnapshotName.value = "";
      displayTabs();
    });
  }
}

/**
 * Displays the tabs in the popup
 */
function displayTabs() {
  let tmp = "<table>"
  let count = 0;
  options.tabs.forEach((tab) => {
    tmp += `<tr>
            <td><a class='show' id='show${count}' title='Replace current tabs with (${tab.tabs.length}) from storage'>${tab.name}</a></td>
            <td><a class='showwindow' id='showwindow${count}' title='Show this tab group in a new window'>&#10063;</a></td>
            <td><a class='delete' id='delete${count}' title='Delete this tab group'>&#128465;</a></td>
            </tr>`;
    count++;
  });
  tmp += "</table>";
  savedTabs.innerHTML = tmp;

  // Add action handlers for deleting and showing
  document.querySelectorAll("#savedTabs a").forEach((element) => {
    element.addEventListener("click", (event) => {

      // Check if this is a delete action
      if (/delete[0-9]+/.test(event.target.id)) {
        options.tabs.splice(event.target.id.replace("delete", ""), 1);
        chrome.storage.sync.set(options);
        displayTabs();
      }

      // Are we showing some tabs?
      else if (/show[0-9]+/.test(event.target.id)) {

        // Close all the tabs and add the selected tag group back
        chrome.windows.getCurrent({populate: true}).then(function(window) {
          let tabIds = [];
          window.tabs.forEach((tab) => {
            tabIds.push(tab.id);
          })

          // Need to add all the new tabs first, otherwise the window will close
          let snapshot = options.tabs[event.target.id.replace("show", "") * 1];
          snapshot.tabs.forEach(function(tab, index) {
            chrome.tabs.create({
              url: tab,
              active: snapshot.activeTab===index
            })
          });
          chrome.tabs.remove(tabIds);
        });
      }

      // Are we showing some tabs in a new window?
      else if (/showwindow[0-9]+/.test(event.target.id)) {
        let snapshot = options.tabs[event.target.id.replace("showwindow", "") * 1];
        chrome.windows.create({}, function(window) {
          snapshot.tabs.forEach(function(tab, index) {
            chrome.tabs.create({
              windowId: window.id,
              url: tab,
              active: snapshot.activeTab===index
            })
          });
          chrome.tabs.remove(window.tabs[0].id);
        });
      }
    });
  });
  tabSnapshotName.focus();
}

// Show all the tabs
displayTabs();
