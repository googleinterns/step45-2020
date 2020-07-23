/** Access and membership settings checkbox table */
var accessSettingsChecked;
var membershipSettingsChecked;

async function onloadGroupDetails() {
    loginStatus();
    
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    var groupId = urlParams.get('group');
    
    var group = await getGroup(groupId);

    loadGroup(group);
}

/** Load the group into data for d3 */
async function loadGroup(group) {
    isLoading = true;
    setLoadingOverlay();

    // reset data and unique users
    users = [];
    data = {
            name: domain,
            children: [],
        };
    // create the visited hash set for groups already processed, containing group IDs
    visited = {};

    // initialize empty groups list
    groups = [];
        
    var newData = await loadGroupsDFS(group);
    data.children.push(newData);
    
    visualize();
    loadGroupDetailsSidebar(group);
}

/** Fill in informational fields on the sidebar of the page */
function loadGroupDetailsSidebar(group) {
    setGroupInformation(group);
    setGroupSettings(group);
}

/** Set group information for specific group */
function setGroupInformation(group) {
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
    numUsers.innerHTML = users.length;
}

/** Set group settings for specific group */
async function setGroupSettings(group) {
    const response = await fetch('https://www.googleapis.com/groups/v1/groups/'
    + group.email + "?alt=json", {
        headers: {
            'authorization': `Bearer ` + token,
        }
    })
    const accessSettingsJson = await response.json();
    console.log(accessSettingsJson)

    if (response.status == 200) {
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
function getAccessType(group) {
    // Default public settings object
    var publicSettings = {
        whoCanAdd: "ALL_MANAGERS_CAN_ADD",	
        whoCanAddReferences: "NONE",
        whoCanApproveMembers: "ALL_MANAGERS_CAN_APPROVE",	
        whoCanApproveMessages: "OWNERS_AND_MANAGERS",	
        whoCanAssignTopics: "NONE",	
        whoCanAssistContent: "NONE",	
        whoCanBanUsers: "OWNERS_AND_MANAGERS",	
        whoCanContactOwner: "ANYONE_CAN_CONTACT",	
        whoCanDeleteAnyPost: "OWNERS_AND_MANAGERS",	
        whoCanDeleteTopics: "OWNERS_AND_MANAGERS",	
        whoCanDiscoverGroup: "ALL_IN_DOMAIN_CAN_DISCOVER",	
        whoCanEnterFreeFormTags: "NONE",	
        whoCanHideAbuse: "NONE",	
        whoCanInvite: "ALL_MANAGERS_CAN_INVITE",	
        whoCanJoin: "ALL_IN_DOMAIN_CAN_JOIN",	
        whoCanLeaveGroup: "ALL_MEMBERS_CAN_LEAVE",	
        whoCanLockTopics: "OWNERS_AND_MANAGERS",	
        whoCanMakeTopicsSticky: "NONE",	
        whoCanMarkDuplicate: "NONE",	
        whoCanMarkFavoriteReplyOnAnyTopic: "NONE",	
        whoCanMarkFavoriteReplyOnOwnTopic: "NONE",	
        whoCanMarkNoResponseNeeded: "NONE",	
        whoCanModerateContent: "OWNERS_AND_MANAGERS",	
        whoCanModerateMembers: "OWNERS_AND_MANAGERS",	
        whoCanModifyMembers: "OWNERS_AND_MANAGERS",	
        whoCanModifyTagsAndCategories: "NONE",	
        whoCanMoveTopicsIn: "OWNERS_AND_MANAGERS",	
        whoCanMoveTopicsOut: "OWNERS_AND_MANAGERS",	
        whoCanPostAnnouncements: "OWNERS_AND_MANAGERS",	
        whoCanPostMessage: "ALL_IN_DOMAIN_CAN_POST",	
        whoCanTakeTopics: "NONE",	
        whoCanUnassignTopic: "NONE",	
        whoCanUnmarkFavoriteReplyOnAnyTopic: "NONE",	
        whoCanViewGroup: "ALL_IN_DOMAIN_CAN_VIEW",	
        whoCanViewMembership: "ALL_IN_DOMAIN_CAN_VIEW"
    }
    // Differences for team
    var teamDiffs = {
        whoCanJoin: "CAN_REQUEST_TO_JOIN"
    }
    // Differences for announcement only
    var announcementDiffs = {
        whoCanPostMessage: "ALL_MANAGERS_CAN_POST",
        whoCanViewMembership: "ALL_MANAGERS_CAN_VIEW"
    }
    // Differences for restricted
    var restrictedDiffs = {
        whoCanJoin: "CAN_REQUEST_TO_JOIN",
        whoCanPostMessage: "ALL_MEMBERS_CAN_POST",
        whoCanViewGroup: "ALL_MEMBERS_CAN_VIEW",
        whoCanViewMembership: "ALL_MEMBERS_CAN_VIEW",
    }
    // Find out differences between this group's settings and default public settings
    var diffs = diff(group, publicSettings);
    console.log(diffs)
    if (Object.keys(diffs).length == 0) {
        return "Public";
    } else if (Object.keys(diff(teamDiffs, diffs)).length == 0) {
        return "Team";
    } else if (Object.keys(diff(announcementDiffs, diffs)).length == 0) {
        return "Announcement Only";
    } else if (Object.keys(diff(restrictedDiffs, diffs)).length == 0) {
        return "Restricted";
    } else {
        return "Custom";
    }
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
    for (checkBox in document.getElementsByClassName("table-checkbox-input")) {
        checkBox.checked = false;
    }
}

/** sets check boxes true */
function setCheckBoxesTrue(checkBoxes) {
    for (checkBoxId of checkBoxes) {
        document.getElementById(checkBoxId).checked = true;
    }
}

/** Toggles showing the edit fields for the information section */
function showEditInformationForm() {

}

/** Toggles showing the edit fields for the settings section */
function showEditSettingsForm() {

}

/** Deletes the current group */
function deleteGroup() {

}