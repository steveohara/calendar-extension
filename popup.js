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
const optionsForm = document.getElementById("optionsForm");

// Immediately persist options changes
optionsForm.hideOptionalEvents.addEventListener("change", (event) => {
  options.hideOptionalEvents = event.target.checked;
  chrome.storage.sync.set(options);
});

// Initialize the form with the user's option settings
const data = await chrome.storage.sync.get();
Object.assign(options, data);
optionsForm.hideOptionalEvents.checked = Boolean(options.hideOptionalEvents);
