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
    const json = await response.json();
    console.log(json)

    if (response.status == 200) {
        var accessType = document.getElementById("access-type");
        accessType.innerHTML = getAccessType(json);

        var joinGroup = document.getElementById("join-group");
        joinGroup.innerHTML = json.whoCanJoin == "ALL_IN_DOMAIN_CAN_JOIN" ? "Anyone in the organization can join" : json.whoCanJoin == "CAN_REQUEST_TO_JOIN" ? "Anyone in the organization can ask" : "Only invited users";

        var membersOutsideOrg = document.getElementById("members-outside-org");
        membersOutsideOrg.innerHTML = json.allowExternalMembers == "true" ? "Yes" : "No";

        setAccessMembershipSettingsTable(json);
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
        whoCanDevareAnyPost: "OWNERS_AND_MANAGERS",	
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
function setAccessMembershipSettingsTable(json) {
    // create the access and membership settings table chart
    var accessSettingsCheckboxes = [
            [document.getElementById("contact-owners-group-owners"),
            document.getElementById("contact-owners-group-managers"),
            document.getElementById("contact-owners-group-members"),
            document.getElementById("contact-owners-entire-organization"),
            document.getElementById("contact-owners-external"),],
            [document.getElementById("view-members-group-owners"),
            document.getElementById("view-members-group-managers"),
            document.getElementById("view-members-group-members"),
            document.getElementById("view-members-entire-organization"),],
            [document.getElementById("view-topics-group-owners"),
            document.getElementById("view-topics-group-managers"),
            document.getElementById("view-topics-group-members"),
            document.getElementById("view-topics-entire-organization"),
            document.getElementById("view-topics-external"),],
            [document.getElementById("publish-posts-group-owners"),
            document.getElementById("publish-posts-group-managers"),
            document.getElementById("publish-posts-group-members"),
            document.getElementById("publish-posts-entire-organization"),
            document.getElementById("publish-posts-external"),],
        ]
    accessSettingsChecked = [
            [true, false, false, false, false,],
            [true, false, false, false,],
            [true, false, false, false, false,],
            [false, false, false, false, false,],
        ]
    var membershipSettingsCheckboxes = [
            document.getElementById("manage-members-group-owners"),
            document.getElementById("manage-members-group-managers"),
            document.getElementById("manage-members-group-members"),
        ]
    membershipSettingsChecked = [
            false, false, false,
        ]

    // contact owners
    if (json.whoCanContactOwner == "ANYONE_CAN_CONTACT") {
        accessSettingsChecked[0] = [true, true, true, true, true];
    } else if (json.whoCanContactOwner == "ALL_IN_DOMAIN_CAN_CONTACT") {
        accessSettingsChecked[0] = [true, true, true, true, false];
    } else if (json.whoCanContactOwner == "ALL_MEMBERS_CAN_CONTACT") {
        accessSettingsChecked[0] = [true, true, true, false, false];
    } else if (json.whoCanContactOwner == "ALL_MANAGERS_CONTACT") {
        accessSettingsChecked[0] = [true, true, false, false, false];
    } else if (json.whoCanContactOwner == "ALL_OWNERS_CAN_CONTACT") {
        accessSettingsChecked[0] = [true, false, false, false, false];
    }
    // view members
    if (json.whoCanViewMembership == "ALL_IN_DOMAIN_CAN_VIEW") {
        accessSettingsChecked[1] = [true, true, true, true];
    } else if (json.whoCanViewMembership == "ALL_MEMBERS_CAN_VIEW") {
        accessSettingsChecked[1] = [true, true, true, false];
    } else if (json.whoCanViewMembership == "ALL_MANAGERS_CAN_VIEW") {
        accessSettingsChecked[1] = [true, true, false, false];
    } else if (json.whoCanViewMembership == "ALL_OWNERS_CAN_VIEW") {
        accessSettingsChecked[1] = [true, false, false, false];
    }
    // view topics
    if (json.whoCanViewGroup == "ANYONE_CAN_VIEW") {
        accessSettingsChecked[2] = [true, true, true, true, true];
    } else if (json.whoCanViewGroup == "ALL_IN_DOMAIN_CAN_VIEW") {
        accessSettingsChecked[2] = [true, true, true, true, false];
    } else if (json.whoCanViewGroup == "ALL_MEMBERS_CAN_VIEW") {
        accessSettingsChecked[2] = [true, true, true, false, false];
    } else if (json.whoCanViewGroup == "ALL_MANAGERS_CAN_VIEW") {
        accessSettingsChecked[2] = [true, true, false, false, false];
    } else if (json.whoCanViewGroup == "ALL_OWNERS_CAN_VIEW") {
        accessSettingsChecked[2] = [true, false, false, false, false];
    }
    // publish posts
    if (json.whoCanPostMessage == "ANYONE_CAN_POST") {
        accessSettingsChecked[3] = [true, true, true, true, true];
    } else if (json.whoCanPostMessage == "ALL_IN_DOMAIN_CAN_POST") {
        accessSettingsChecked[3] = [true, true, true, true, false];
    } else if (json.whoCanPostMessage == "ALL_MEMBERS_CAN_POST") {
        accessSettingsChecked[3] = [true, true, true, false, false];
    } else if (json.whoCanPostMessage == "ALL_MANAGERS_CAN_POST") {
        accessSettingsChecked[3] = [true, true, false, false, false];
    } else if (json.whoCanPostMessage == "ALL_OWNERS_CAN_POST") {
        accessSettingsChecked[3] = [true, false, false, false, false];
    } else if (json.whoCanPostMessage == "NONE_CAN_POST") {
        accessSettingsChecked[3] = [false, false, false, false, false];
    }

    // manage members
    if (json.whoCanModifyMembers == "ALL_MEMBERS") {
        membershipSettingsChecked = [true, true, true];
    } else if (json.whoCanModifyMembers == "OWNERS_AND_MANAGERS") {
        membershipSettingsChecked = [true, true, false];
    } else if (json.whoCanModifyMembers == "OWNERS_ONLY") {
        membershipSettingsChecked = [true, false, false];
    } else if (json.whoCanModifyMembers == "NONE") {
        membershipSettingsChecked = [false, false, false];
    }

    // iterate through each checkbox input and toggle checked
    for (var i = 0; i < accessSettingsCheckboxes.length; i++) {
        for (var j = 0; j < accessSettingsCheckboxes[i].length; j++) {
            accessSettingsCheckboxes[i][j].checked = accessSettingsChecked[i][j];
        }
    }
    for (var i = 0; i < membershipSettingsCheckboxes.length; i++) {
        membershipSettingsCheckboxes[i].checked = membershipSettingsChecked[i];
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