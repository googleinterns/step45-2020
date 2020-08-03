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
    for (var i = 0; i < groups.length; i++) {
        // iterate through all the groups and get their direct members
        promises.push(getGroupMembers(groups[i].id));
    }

    Promise.all(promises)
    .then(async function(results) {
        var newData = await loadGroupsDFS(group);
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
    var groupNameTitle = document.getElementById("group-name-title");
    groupNameTitle.innerHTML = group.name;

    var groupName = document.getElementById("group-name");
    groupName.innerHTML = group.name;

    var groupEmail = document.getElementById("group-email");
    groupEmail.innerHTML = group.email;

    var groupDescription = document.getElementById("group-description");
    if (group.description) groupDescription.innerHTML = group.description;

    var numGroups = document.getElementById("num-groups");
    numGroups.innerHTML = Object.keys(visited).length;

    var numUsers = document.getElementById("num-users");
    numUsers.innerHTML = usersDisplayed.length;
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

        var accessType = document.getElementById("access-type");
        accessType.innerHTML = getAccessType(accessSettingsJson);

        var joinGroup = document.getElementById("join-group");
        joinGroup.innerHTML = accessSettingsJson.whoCanJoin == "ALL_IN_DOMAIN_CAN_JOIN" ? "Anyone in the organization can join" : accessSettingsJson.whoCanJoin == "CAN_REQUEST_TO_JOIN" ? "Anyone in the organization can ask" : "Only invited users";

        var membersOutsideOrg = document.getElementById("members-outside-org");
        membersOutsideOrg.innerHTML = accessSettingsJson.allowExternalMembers == "true" ? "Yes" : "No";

        setAccessMembershipSettingsTable(accessSettingsJson);
    }
}

/** Returns the access type based on this group's settings */
function getAccessType() {
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
    var settingsChart = document.getElementById("group-settings-chart");
    if (settingsChart.classList.contains("hidden")) {
        settingsChart.classList.remove("hidden")
    } else {
        settingsChart.classList.add("hidden")
    }
}

/** Fills in the checkbox table for access and membership settings */
function setAccessMembershipSettingsTable(accessSettingsJson) {
    // contact owners
    var whoCanContactOwnerCheckboxMap = {
        "ANYONE_CAN_CONTACT": [
            "contact-owners-group-owners",
            "contact-owners-group-managers",
            "contact-owners-group-members",
            "contact-owners-entire-organization",
            "contact-owners-external",
            ],
        "ALL_IN_DOMAIN_CAN_CONTACT": [
            "contact-owners-group-owners",
            "contact-owners-group-managers",
            "contact-owners-group-members",
            "contact-owners-entire-organization",
            ],
        "ALL_MEMBERS_CAN_CONTACT": [
            "contact-owners-group-owners",
            "contact-owners-group-managers",
            "contact-owners-group-members",],
        "ALL_MANAGERS_CONTACT": [
            "contact-owners-group-owners",
            "contact-owners-group-managers",],
        "ALL_OWNERS_CAN_CONTACT": ["contact-owners-group-owners",],
    }
    // view members
    var whoCanViewMembershipCheckboxMap = {
        "ALL_IN_DOMAIN_CAN_VIEW": [
            "view-members-group-owners",
            "view-members-group-managers",
            "view-members-group-members",
            "view-members-entire-organization",
            ],
        "ALL_MEMBERS_CAN_VIEW": [
            "view-members-group-owners",
            "view-members-group-managers",
            "view-members-group-members",
            ],
        "ALL_MANAGERS_CAN_VIEW": [
            "view-members-group-owners",
            "view-members-group-managers",
            ],
        "ALL_OWNERS_CAN_VIEW": ["view-members-group-owners",],
    }
    // view topics
    var whoCanViewGroupCheckboxMap = {
        "ANYONE_CAN_VIEW": ["view-topics-group-owners",
            "view-topics-group-managers",
            "view-topics-group-members",
            "view-topics-entire-organization",
            "view-topics-external",],
        "ALL_IN_DOMAIN_CAN_VIEW": [
            "view-topics-group-owners",
            "view-topics-group-managers",
            "view-topics-group-members",
            "view-topics-entire-organization",
            ],
        "ALL_MEMBERS_CAN_VIEW": [
            "view-topics-group-owners",
            "view-topics-group-managers",
            "view-topics-group-members",
            ],
        "ALL_MANAGERS_CAN_VIEW": ["view-topics-group-owners",
            "view-topics-group-managers",],
        "ALL_OWNERS_CAN_VIEW": ["view-topics-group-owners",],
    }
    // publish posts
    var whoCanPostMessageCheckboxMap = {
        "ANYONE_CAN_POST": [
            "publish-posts-group-owners",
            "publish-posts-group-managers",
            "publish-posts-group-members",
            "publish-posts-entire-organization",
            "publish-posts-external",
            ],
        "ALL_IN_DOMAIN_CAN_POST": [
            "publish-posts-group-owners",
            "publish-posts-group-managers",
            "publish-posts-group-members",
            "publish-posts-entire-organization",
            ],
        "ALL_MEMBERS_CAN_POST": [
            "publish-posts-group-owners",
            "publish-posts-group-managers",
            "publish-posts-group-members",
            ],
        "ALL_MANAGERS_CAN_POST": [
            "publish-posts-group-owners",
            "publish-posts-group-managers",
            ],
        "ALL_OWNERS_CAN_POST": ["publish-posts-group-owners",],
        "NONE_CAN_POST": [],
    }
    // manage members
    var whoCanModifyMembersCheckboxMap = {
        "ALL_MEMBERS": [
            "manage-members-group-owners",
            "manage-members-group-managers",
            "manage-members-group-members",
            ],
        "OWNERS_AND_MANAGERS": [
            "manage-members-group-owners",
            "manage-members-group-managers",
            ],
        "OWNERS_ONLY": ["manage-members-group-owners",],
        "NONE": [],
    }
    
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
    var viewInformation = document.getElementById("view-information-form");
    viewInformation.classList.add("hidden");
    var editInformation = document.getElementById("edit-information-form");
    editInformation.classList.remove("hidden");
    var showEditInformation = document.getElementById("show-edit-information-form");
    showEditInformation.classList.add("hidden");
    var saveInformation = document.getElementById("save-information-form");
    saveInformation.classList.remove("hidden");
    var closeEditInformation = document.getElementById("close-edit-information-form");
    closeEditInformation.classList.remove("hidden");

    var groupName = document.getElementById("group-name-field");
    groupName.value = group.name;

    var groupEmail = document.getElementById("group-email-field");
    groupEmail.value = group.email.split("@")[0];

    var groupEmailDomain = document.getElementById("group-email-domain");
    groupEmailDomain.innerHTML = "@" + domain;

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
    var viewInformation = document.getElementById("view-information-form");
    viewInformation.classList.remove("hidden");
    var editInformation = document.getElementById("edit-information-form");
    editInformation.classList.add("hidden");
    var showEditInformation = document.getElementById("show-edit-information-form");
    showEditInformation.classList.remove("hidden");
    var saveInformation = document.getElementById("save-information-form");
    saveInformation.classList.add("hidden");
    var closeEditInformation = document.getElementById("close-edit-information-form");
    closeEditInformation.classList.add("hidden");
}

/** Shows the edit fields for the settings section */
function showEditSettingsForm() {
    // Buttons
    var showEditSettings = document.getElementById("show-edit-settings-form");
    showEditSettings.classList.add("hidden");
    var saveSettings = document.getElementById("save-settings-form");
    saveSettings.classList.remove("hidden");
    var closeEditSettings = document.getElementById("close-edit-settings-form");
    closeEditSettings.classList.remove("hidden");

    // Inputs
    var accessTypeValue = document.getElementById("access-type");
    accessTypeValue.classList.add("hidden");
    var accessTypeRadio = document.getElementById("access-type-radio-group");
    accessTypeRadio.classList.remove("hidden");
    var joinGroupValue = document.getElementById("join-group");
    joinGroupValue.classList.add("hidden");
    var joinGroupSel = document.getElementById("join-group-sel-group");
    joinGroupSel.classList.remove("hidden");
    var membersOutsideOrgValue = document.getElementById("members-outside-org");
    membersOutsideOrgValue.classList.add("hidden");
    var membersOutsideOrgSwitch = document.getElementById("members-outside-org-switch-group");
    membersOutsideOrgSwitch.classList.remove("hidden");

    // Labels
    var saveSettingsLabel = document.getElementById("save-settings-label");
    saveSettingsLabel.classList.remove("hidden");

    // Set values based on current group settings
    var currentAccessType = document.getElementById("access-type-radio-" + accessType.replace(/ /g, '-').toLowerCase());
    currentAccessType.checked = true;
    var currentJoinGroup = document.getElementById("join-group-sel");
    currentJoinGroup.value = settings.whoCanJoin == "ALL_IN_DOMAIN_CAN_JOIN" ? "anyone-can-join" : settings.whoCanJoin == "CAN_REQUEST_TO_JOIN" ? "anyone-can-ask" : "only-invited";
    var currentMembersOutsideOrg = document.getElementById("members-outside-org-switch");
    currentMembersOutsideOrg.checked = settings.allowExternalMembers == "true" ? true : false;
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
    // Buttons
    var showEditSettings = document.getElementById("show-edit-settings-form");
    showEditSettings.classList.remove("hidden");
    var saveSettings = document.getElementById("save-settings-form");
    saveSettings.classList.add("hidden");
    var closeEditSettings = document.getElementById("close-edit-settings-form");
    closeEditSettings.classList.add("hidden");

    // Inputs
    var accessType = document.getElementById("access-type");
    accessType.classList.remove("hidden");
    var accessTypeRadio = document.getElementById("access-type-radio-group");
    accessTypeRadio.classList.add("hidden");
    var joinGroup = document.getElementById("join-group");
    joinGroup.classList.remove("hidden");
    var joinGroupSel = document.getElementById("join-group-sel-group");
    joinGroupSel.classList.add("hidden");
    var membersOutsideOrg = document.getElementById("members-outside-org");
    membersOutsideOrg.classList.remove("hidden");
    var membersOutsideOrgSwitch = document.getElementById("members-outside-org-switch-group");
    membersOutsideOrgSwitch.classList.add("hidden");

    // Labels
    var saveSettingsLabel = document.getElementById("save-settings-label");
    saveSettingsLabel.classList.add("hidden");

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

    var currentJoinGroup = document.getElementById("join-group-sel");
    currentJoinGroup.value = newSettings.whoCanJoin == "ALL_IN_DOMAIN_CAN_JOIN" ? "anyone-can-join" : newSettings.whoCanJoin == "CAN_REQUEST_TO_JOIN" ? "anyone-can-ask" : "only-invited";
    var currentMembersOutsideOrg = document.getElementById("members-outside-org-switch");
    currentMembersOutsideOrg.checked = newSettings.allowExternalMembers == "true" ? true : false;

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
