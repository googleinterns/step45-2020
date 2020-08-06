/** Group information */
var group;
var settings;
var accessType;

/** Access and membership settings checkbox table */
var accessSettingsChecked;
var membershipSettingsChecked;

async function onloadGroupDetails() {
    checkLoginAndSetUp();
    
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    var groupId = urlParams.get('group');
    
    Promise.all([getAllGroups(true), getAllUsers()])
    .then(async function(results) {
        group = await getGroup(groupId);
        loadGroup();
    })
}

/** Load the group into data for d3 */
async function loadGroup() {
    isLoading = true;
    setLoadingOverlay();

    // reset data and unique users
    usersDisplayed = [];
    data = {
            name: domain,
            children: [],
        };
    // create the visited hash set for groups already processed, containing group IDs
    visited = {};
    members = {};
        
    // collect all the promises
    var promises = [];
    for (g of groups) {
        // iterate through all the groups and get their direct members
        promises.push(getGroupMembers(g.id));
    }

    Promise.all(promises)
    .then(async function(results) {
        var newData = await loadGroupsDFS(group, null);
        data.children.push(newData);
        
        visualize();
        loadGroupDetailsSidebar();
    })  
}

/** Fill in informational fields on the sidebar of the page */
function loadGroupDetailsSidebar() {
    setGroupInformation();
    setGroupSettings();
}

/** Set group information for specific group */
function setGroupInformation() {
    document.getElementById("group-name-title").innerHTML = group.name;
    document.getElementById("group-name").innerHTML = group.name;
    document.getElementById("group-email").innerHTML = group.email;

    var groupDescription = document.getElementById("group-description");
    if (group.description) groupDescription.innerHTML = group.description;

    document.getElementById("num-groups").innerHTML = Object.keys(visited).length;
    document.getElementById("num-users").innerHTML = usersDisplayed.length;
}

/** Set group settings for specific group */
async function setGroupSettings() {
    const response = await fetch('https://www.googleapis.com/groups/v1/groups/'
    + group.email + "?alt=json", {
        headers: {
            'authorization': `Bearer ` + token,
        }
    })
    const accessSettingsJson = await response.json();
    console.log(accessSettingsJson)

    if (response.status == 200) {
        settings = accessSettingsJson;

        document.getElementById("access-type").innerHTML = getAccessType(accessSettingsJson);
        document.getElementById("join-group").innerHTML = accessSettingsJson.whoCanJoin == "ALL_IN_DOMAIN_CAN_JOIN" ? "Anyone in the organization can join" : accessSettingsJson.whoCanJoin == "CAN_REQUEST_TO_JOIN" ? "Anyone in the organization can ask" : "Only invited users";
        document.getElementById("members-outside-org").innerHTML = accessSettingsJson.allowExternalMembers == "true" ? "Yes" : "No";

        setAccessMembershipSettingsTable(accessSettingsJson);
    }
}

/** Returns the access type based on this group's settings */
function getAccessType(settings) {
    if (Object.keys(diff(settings, publicSettings)).length == 0) {
        accessType = "Public";
    } else if (Object.keys(diff(settings, teamSettings)).length == 0) {
        accessType = "Team";
    } else if (Object.keys(diff(settings, announcementOnlySettings)).length == 0) {
        accessType = "Announcement Only";
    } else if (Object.keys(diff(settings, restrictedSettings)).length == 0) {
        accessType = "Restricted";
    } else {
        accessType = "Custom";
    }
    return accessType;
}

/** Returns an object containing the key and value pairs for each difference between two objects
  * obj1: object you are comparing to default
  * obj2: default object
 */
function diff(obj1, obj2) {
    var diffs = {};
    for (key in obj2) {
        if (obj2.hasOwnProperty(key)) {
            if (obj1[key] !== obj2[key]) {
                diffs[key] = obj1[key];
            }
        }
    }
    return diffs;
}

/** Function called when user clicks to view access and membership settings */
function viewSettings() {
    hideElements(["view-settings-link"])
    showElements(["group-settings-chart", "hide-settings-link"])
}

/** Function called when user clicks to view access and membership settings */
function hideSettings() {
    showElements(["view-settings-link"])
    hideElements(["group-settings-chart", "hide-settings-link"])
}

/** Fills in the checkbox table for access and membership settings */
function setAccessMembershipSettingsTable(accessSettingsJson) {
    setAllCheckBoxesFalse(); // assume that all check box values should be overriden
    setCheckBoxesTrue(whoCanContactOwnerCheckboxMap[accessSettingsJson.whoCanContactOwner]);
    setCheckBoxesTrue(whoCanViewMembershipCheckboxMap[accessSettingsJson.whoCanViewMembership]);
    setCheckBoxesTrue(whoCanViewGroupCheckboxMap[accessSettingsJson.whoCanViewGroup]);
    setCheckBoxesTrue(whoCanPostMessageCheckboxMap[accessSettingsJson.whoCanPostMessage]);
    setCheckBoxesTrue(whoCanModifyMembersCheckboxMap[accessSettingsJson.whoCanModifyMembers]);
}

/** sets all check boxes for groups settings to false */
function setAllCheckBoxesFalse() {
    for (checkBox of document.getElementsByClassName("table-checkbox-input")) {
        checkBox.checked = false;
    }
}

/** sets check boxes true */
function setCheckBoxesTrue(checkBoxes) {
    for (checkBoxId of checkBoxes) {
        document.getElementById(checkBoxId).checked = true;
    }
}

/** Shows the edit fields for the information section */
function showEditInformationForm() {
    hideElements(["view-information-form", "show-edit-information-form"]);
    showElements(["edit-information-form", "save-information-form", "close-edit-information-form"]);

    document.getElementById("group-name-field").value = group.name;
    document.getElementById("group-email-field").value = group.email.split("@")[0];
    document.getElementById("group-email-domain").innerHTML = "@" + domain;

    var groupDescription = document.getElementById("group-description-field");
    if (group.description) groupDescription.value = group.description;
}

/** Saves the edit fields for the information section */
async function saveInformationForm() {
    isLoading = true;
    setLoadingOverlay();

    var groupName = document.getElementById("group-name-field").value;
    var groupEmail = document.getElementById("group-email-field").value;
    var groupDescription = document.getElementById("group-description-field").value;

    const response = await fetch('https://www.googleapis.com/admin/directory/v1/groups/'
    + group.id, {
        headers: {
            'authorization': `Bearer ` + token,
            'Content-Type': 'application/json'
        },
        method: 'PUT',
        body: JSON.stringify({"name": groupName, "email": groupEmail + "@" + domain, "description": groupDescription})
    })
    const groupJson = await response.json();
    console.log(groupJson)

    if (response.status == 200) {
        group = groupJson;
        setGroupInformation();
        closeInformationForm();
        isLoading = false;
        setLoadingOverlay();
    }
}

/** Hides the edit fields for the information section without saving */
function closeInformationForm() {
    showElements(["view-information-form", "show-edit-information-form"]);
    hideElements(["edit-information-form", "save-information-form", "close-edit-information-form"]);
}

/** Shows the edit fields for the settings section */
function showEditSettingsForm() {
    hideElements(["show-edit-settings-form", "access-type", "join-group", "members-outside-org"]);
    showElements(["save-settings-form", "close-edit-settings-form", "access-type-radio-group", "join-group-sel-group", "members-outside-org-switch-group", "save-settings-label"]);

    // Set values based on current group settings
    document.getElementById("access-type-radio-" + accessType.replace(/ /g, '-').toLowerCase()).checked = true;
    document.getElementById("join-group-sel").value = settings.whoCanJoin == "ALL_IN_DOMAIN_CAN_JOIN" ? "anyone-can-join" : settings.whoCanJoin == "CAN_REQUEST_TO_JOIN" ? "anyone-can-ask" : "only-invited";
    document.getElementById("members-outside-org-switch").checked = settings.allowExternalMembers == "true" ? true : false;
}

/** Saves the edit fields for the settings section */
async function saveSettingsForm() {
    isLoading = true;
    setLoadingOverlay();

    var newPartialSettings = selectAccessType();
    var newSettings = Object.assign(settings, newPartialSettings);

    const response = await fetch('https://www.googleapis.com/groups/v1/groups/'
    + group.email, {
        headers: {
            'authorization': `Bearer ` + token,
            'Content-Type': 'application/json'
        },
        method: 'PUT',
        body: JSON.stringify(newSettings)
    })
    const accessSettingsJson = await response.json();
    console.log(accessSettingsJson)

    if (response.status == 200) {
        settings = accessSettingsJson;
        setGroupSettings();
        closeSettingsForm();
        isLoading = false;
        setLoadingOverlay();
    }
}

/** Hides the edit fields for the settings section without saving */
function closeSettingsForm() {
    showElements(["show-edit-settings-form", "access-type", "join-group", "members-outside-org"]);
    hideElements(["save-settings-form", "close-edit-settings-form", "access-type-radio-group", "join-group-sel-group", "members-outside-org-switch-group", "save-settings-label"]);

    // Reset checkboxes to original settings
    setAccessMembershipSettingsTable(settings);
}

/** Function called when user selects a new access type */
function selectAccessType() {
    var accessTypeSelected = document.querySelector('input[name="access-type-radio"]:checked').value;
    // Select all the checkboxes that correspond to this access type
    var newSettings;
    if (accessTypeSelected == "public") {
        newSettings = publicSettings;
    } else if (accessTypeSelected == "team") {
        newSettings = teamSettings;
    } else if (accessTypeSelected == "announcement-only") {
        newSettings = announcementOnlySettings;
    } else if (accessTypeSelected == "restricted") {
        newSettings = restrictedSettings;
    } else {
        return;
    }

    document.getElementById("join-group-sel").value = newSettings.whoCanJoin == "ALL_IN_DOMAIN_CAN_JOIN" ? "anyone-can-join" : newSettings.whoCanJoin == "CAN_REQUEST_TO_JOIN" ? "anyone-can-ask" : "only-invited";
    document.getElementById("members-outside-org-switch").checked = newSettings.allowExternalMembers == "true" ? true : false;

    setAccessMembershipSettingsTable(newSettings);
    return newSettings;
}

/** Deletes the current group */
async function deleteGroup() {
    isLoading = true;
    setLoadingOverlay();

    const response = await fetch('https://www.googleapis.com/admin/directory/v1/groups/'
    + group.id, {
        headers: {
            'authorization': `Bearer ` + token
        },
        method: 'DELETE',
    })
    if (response.status == 200 || response.status == 204) {
        isLoading = false;
        setLoadingOverlay();
        window.location.href = "groups.html";
    }
}

/** Double checks that the user wants to delete this group */
function deleteGroupModal() {
    $('#deleteModal').modal('show');
}