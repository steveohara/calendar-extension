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
const options = {};

// Immediately persist options changes
document.getElementById("showOptionalEvents").addEventListener("change", (event) => {
  options.optionalEvents = event.target.value;
  chrome.storage.sync.set(options);
});
document.getElementById("hideOptionalEvents").addEventListener("change", (event) => {
  options.optionalEvents = event.target.value;
  chrome.storage.sync.set(options);
});
document.getElementById("deEmphasiseOptionalEvents").addEventListener("change", (event) => {
  options.optionalEvents = event.target.value;
  chrome.storage.sync.set(options);
});

document.getElementById("hideMornings").addEventListener("change", (event) => {
  options.hideMornings = event.target.checked;
  chrome.storage.sync.set(options);
});
document.getElementById("hideMorningsTime").addEventListener("change", (event) => {
  options.hideMorningsTime = event.target.value;
  chrome.storage.sync.set(options);
});

// Initialize the form with the user's option settings
const data = await chrome.storage.sync.get();
Object.assign(options, data);
document.getElementById("showOptionalEvents").checked = Boolean(options.optionalEvents === "showOptionalEvents");
document.getElementById("hideOptionalEvents").checked = Boolean(options.optionalEvents === "hideOptionalEvents");
document.getElementById("deEmphasiseOptionalEvents").checked = Boolean(options.optionalEvents === "deEmphasiseOptionalEvents");
document.getElementById("hideMornings").checked = options.hideMornings;
document.getElementById("hideMorningsTime").checked = options.hideMorningsTime;
