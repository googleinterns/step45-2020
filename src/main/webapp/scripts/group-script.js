var params = JSON.parse(localStorage.getItem('oauth2-test-params'));
var token = params['access_token'];
var domain = localStorage.getItem('domain');

/* Show refresh button and overlay */
var isLoading;

/* d3 input data */
var data;

/* JSON lists and maps */
var groups;
var users;
var visited;

/* Tooltip hover card */
var displayTooltip;
var tooltip;
var groupName;
var description;
var email;
var directMembers;

/* Search and filters */
var searchName;
var searchMemberKey;
var orderBy;
var viewTotal = 200;
var showOnlyParentGroups = true;
var flattenGroups = false;

/* Access and membership settings checkbox table */
var accessSettingsChecked;
var membershipSettingsChecked;

function onloadGroupsPage() {
    var searchButton = document.getElementById("search-enter-btn");
    searchButton.addEventListener("click", function(event) {
        searchName = searchBar.value;

        checkSidebar();
        getAllGroups();
    })

    var searchBar = document.getElementById("search");
    // Execute a function when the user presses enter or erases the input
    searchBar.addEventListener("search", function(event) {
        searchButton.click();
    });

    getAllGroups();
}

function getAllGroups() {
    isLoading = true;
    setLoadingOverlay();

    var url = 'https://www.googleapis.com/admin/directory/v1/groups?domain=' + domain + '&customer=my_customer'
    if (orderBy) {
        url += '&orderBy=' + orderBy;
    }
    if (viewTotal) {
        url += '&maxResults=' + viewTotal
    }
    url += "&query=";
    var hasPreviousQuery = false;
    if (searchName) {
        url += encodeURIComponent("name:" + searchName + "*");
    }
    if (searchMemberKey) {
        url += encodeURIComponent("memberKey=" + searchMemberKey);
    }
    if (url.split("&").pop() == "query=") {
        url = url.substring(0, url.length - 7)
    }
    fetch(url, {
        headers: {
            'authorization': `Bearer ` + token,
        }
    })
    .then(response => response.json())
    .then((res) => {
        console.log(res);
        if (res.groups) {
            groups = res.groups;
        } else {
            groups = [];
        }
        loadGroups();
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

/* Fill in informational fields on the sidebar of the page */
function loadSidebar() {
    const domainName = document.getElementById("domain-name");
    domainName.innerHTML = "@" + domain;

    const numGroups = document.getElementById("num-groups");
    numGroups.innerHTML = groups.length;

    const numUsers = document.getElementById("num-users");
    numUsers.innerHTML = users.length;

    var userOptions = [];
    userOptions.push("<option value=null selected='selected'>Select user...</option>");
    for (var i = 0; i < users.length; i++) {
        userOptions.push("<option value='" + users[i].email + "' id='" + users[i].email + "'>" + users[i].email + " </option>");
    }
    document.getElementById("user-sel").innerHTML = userOptions.join();

    // select preexisting values
    checkSidebar();
}

/* Check if the user has selected filter options or searched; cannot search for group name or email AND memberKey simultaneously */
function checkSidebar(memberKey) {
    if (searchName && !memberKey) {
        document.getElementById("search").value = searchName;
        document.getElementById("user-sel").value = null;
        searchMemberKey = null;
    }
    if (searchMemberKey) {
        document.getElementById("user-sel").value = searchMemberKey;
        document.getElementById("search").value = "";
        searchName = null;
    }
    if (orderBy) {
        document.getElementById("order-by-sel").value = orderBy;
    }
}

/* Clear all the searches and filter options in the sidebar */
function clearSidebar() {
    searchName = null;
    searchMemberKey = null;
    orderBy = null;
    viewTotal = 200;
    showOnlyParentGroups = true;
    flattenGroups = false;

    document.getElementById("search").value = "";
    document.getElementById("user-sel").value = searchMemberKey;
    document.getElementById("order-by-sel").value = orderBy;
    document.getElementById("view-total-groups-sel").value = viewTotal;
    document.getElementById("parent-groups-check").checked = showOnlyParentGroups;
    document.getElementById("flatten-groups-check").checked = flattenGroups;

    getAllGroups();
}

/* Function called when the user selects an option for memberKey */
function selectUser() {
    var userSel = document.getElementById("user-sel");
    if (userSel.value == "null") {
        searchMemberKey = null;
    } else {
        searchMemberKey = userSel.value
    }

    checkSidebar(true);
    getAllGroups();
}

/* Function called when the user selects an option for order by */
function selectOrderBy() {
    var orderBySel = document.getElementById("order-by-sel");
    if (orderBySel.value == "null") {
        orderBy = null;
    } else {
        orderBy = orderBySel.value;
    }

    checkSidebar();
    getAllGroups();
}

/* Function called when the user selects an option for view number of total groups */
function viewGroups() {
    var viewSel = document.getElementById("view-total-groups-sel");
    viewTotal = viewSel.value;

    checkSidebar();
    getAllGroups();
}

/* Function called when the user toggles whether to show parent groups only */
function checkParentGroups() {
    showOnlyParentGroups = !showOnlyParentGroups;

    checkSidebar();
    getAllGroups();
}

/* Function called when the user toggles whether to show parent groups only */
function checkFlattenGroups() {
    flattenGroups = !flattenGroups;

    checkSidebar();
    getAllGroups();
}

/* d3 master function to display all groups using data */
function visualize() {
    d3.selectAll("svg > *").remove();

    var color = d3.scaleLinear()
    .domain([0, 5])
    .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
    .interpolate(d3.interpolateHcl)

    var format = d3.format(",d")

    var minDimension = Math.min(window.innerWidth, window.innerHeight);
    var width = minDimension;
    var height = width

    var pack = data => d3.pack()
    .size([width, height])
    .padding(10)

    (d3.hierarchy(data)
    .sum(d => d.value)
    .sort((a, b) => b.value - a.value))

    tooltip = d3.select("body")
	.append("a")
	.style("position", "absolute")
	.style("z-index", "10")
	.style("visibility", "hidden")
    .classed("card", true)
    .classed("group", true)
    .on("mouseover", function(d) {
        return tooltip.style("visibility", "visible");
    })

    groupName = tooltip
    .append("h5")
    .classed("name", true)

    email = tooltip
    .append("div")
    .classed("email", true)

    description = tooltip
    .append("div")
    .classed("description", true)

    directMembers = tooltip
    .append("span")
    .classed("direct-members", true)

    const root = pack(data);
    let focus = root;
    let view;

    const svg = d3.create("svg")
        .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
        .style("display", "block")
        .style("background", color(0))
        .style("cursor", "pointer")
        .style("max-width", width + "px")
        .style("max-height", height + "px")
        .on("click", () => zoom(root));

    const node = svg.append("g")
        .selectAll("circle")
        .data(root.descendants().splice(1))
        .join("circle")
        .attr("fill", d => d.data.type == "user" ? "white" : (d.data.children ? color(d.depth) : "rgb(116, 215, 202)"))
        .attr("pointer-events", d => d.data.type == "user" ? "none" : null)
        .on("mouseover", function(d) { 
            if (d.type == "user") return;
            d3.select(this).attr("stroke", "#000");
            var pageY = event.pageY;
            var pageX = event.pageX;
            makeDivElement(d)
            displayTooltip = true;
            tooltip.style("top", (pageY-10)+"px").style("left",(pageX+10)+"px")
            setTimeout(function() {
                if (displayTooltip == true) return tooltip.style("visibility", "visible");
            }, 500)
        })
        .on("mouseout", function(d) { 
            if (d.data.type == "user") return;
            displayTooltip = false;
            d3.select(this).attr("stroke", null); 
            return tooltip.style("visibility", "hidden");
        })
        .on("click", function(d) {
            if (d.data.type == "user") return;
            focus !== d && (zoom(d), d3.event.stopPropagation())
        });

    const label = svg.append("g")
        .style("font", "1.25em sans-serif")
        .attr("pointer-events", "none")
        .attr("text-anchor", "middle")
        .selectAll("text")
        .data(root.descendants())
        .join("text")
        .style("fill-opacity", d => d.parent === root ? 1 : 0)
        .style("display", d => d.parent === root ? "inline" : "none")
        .text(d => d.data.name);

    zoomTo([root.x, root.y, root.r * 2]);

    function zoomTo(v) {
        const k = width / v[2];

        view = v;

        label.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
        node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
        node.attr("r", d => d.r * k);
    }

    function zoom(d) {
        const focus0 = focus;

        focus = d;

        const transition = svg.transition()
            .duration(d3.event.altKey ? 7500 : 750)
            .tween("zoom", d => {
            const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
            return t => zoomTo(i(t));
            });

        label
        .filter(function(d) { return d.parent === focus || this.style.display === "inline"; })
        .transition(transition)
            .style("fill-opacity", d => d.parent === focus ? 1 : 0)
            .on("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
            .on("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });
    }

    function hovered(hover) {
        return function(d) {
            d3.selectAll(d.ancestors().map(function(d) {}));
        };
    }

    var chartElement = document.getElementById("chart");
    if (chartElement.lastChild) {
        chartElement.removeChild(chartElement.lastChild);
    }
    chartElement.appendChild(svg.node());

    isLoading = false;
    setLoadingOverlay();

    return svg.node();
}

/* Load all of the groups into data for d3 */
async function loadGroups() {
    // reset data and unique users
    // if empty groups, data should also be empty
    users = [];
    if (groups.length == 0) {
        data = {};
    } else {
        data = {
            name: domain,
            children: [],
        };
        // create the visited hash set for groups already processed, containing group IDs
        visited = {};
        
        for (var i = 0; i < groups.length; i++) {
            // if already visited, then add the circle data
            if (visited.hasOwnProperty(groups[i].id)) {
                if (!showOnlyParentGroups) {
                    var visitedGroup = visited[groups[i].id];
                    data.children.push(visitedGroup)
                }
            } else {
                // recursive DFS on the new group to get the new data
                var newData = await loadGroupsDFS(groups[i]);
                data.children.push(newData);
            }
        }
    }
    
    visualize();
    loadSidebar();
}

async function loadGroupsDFS(currGroup) {
    if (currGroup.type == "USER") {
        users.push(currGroup);
        return {
            name: currGroup.email,
            value: 1,
            type: 'user',
            id: currGroup.id
        }
    }
    // create a new circle for this current group with an initial empty children list
    var newCircle = {
        name: currGroup.name,
        children: [],
        value: parseInt(currGroup.directMembersCount == 0 ? 1 : currGroup.directMembersCount),
        id: currGroup.id
    }
    // iterate through all the direct members of this current group
    const response = await fetch('https://www.googleapis.com/admin/directory/v1/groups/'+ currGroup.id + '/members', {
        headers: {
            'authorization': `Bearer ` + token,
        }
    })
    const json = await response.json();

    if (response.status == 200) {
        var members = json.members;
        if (members) {
            for (var j = 0; j < members.length; j++) {
                // if already visited, then add the circle into newCircle children list
                if (visited.hasOwnProperty(members[j].id)) {
                    var visitedGroup = visited[members[j].id];

                    // if flatten groups, then don't add this group to children
                    if (!flattenGroups) {
                        // find where the group is located in data
                        newCircle.children.push(visitedGroup);
                    }

                    // if only show parent groups, then delete this group from data
                    if (showOnlyParentGroups) {
                        var indexOfGroupData = data.children.findIndex(elem => elem.id == visitedGroup.id);
                        if (indexOfGroupData >= 0) {
                            data.children.splice(indexOfGroupData, 1);
                        }
                    }
                }
                // otherwise, recurse on the member and push to newCircle children list
                else {
                    var member = members[j];

                    // if group, get the group with the name
                    if (member.type == "GROUP") {
                        member = await getGroup(member.id);
                    }
                    var newData = await loadGroupsDFS(member);

                    // if flatten groups, then don't add this group to children
                    if (!flattenGroups) {
                        newCircle.children.push(newData);
                    } else {
                        if (member.type == "USER") {
                            newCircle.children.push(newData);
                        } else {
                            newCircle.value += newData.value;
                        }
                    }
                }
            }
        }
    }
    // if no children, delete
    if (newCircle.children.length == 0) {
        delete newCircle.children
    }
    // mark this current group as visited
    visited[currGroup.id] = newCircle;
    // if on group details page, then add to the groups list
    var indexOfGroup = groups.findIndex(elem => elem.id == currGroup.id);
    if (indexOfGroup < 0) {
        groups.push(currGroup);
    }
    return newCircle;
}

/* Returns the corresponding group with the id */
async function getGroup(id) {
    const response = await fetch('https://www.googleapis.com/admin/directory/v1/groups/'
    + id, {
        headers: {
            'authorization': `Bearer ` + token,
        }
    })
    const json = await response.json();
    console.log(json)

    if (response.status == 200) {
        return json;
    }
}

/* Returns the corresponding user with the id */
async function getUser(id) {
    const response = await fetch('https://www.googleapis.com/admin/directory/v1/users/'
    + id, {
        headers: {
            'authorization': `Bearer ` + token,
        }
    })
    const json = await response.json();
    console.log(json)

    if (response.status == 200) {
        return json;
    }
}

/** Creates the components of the hovering <div> element for each group */
function makeDivElement(d) {
    // find group with this id
    var group = groups[groups.findIndex(elem => elem.id == d.data.id)]
    groupName.text(group.name)
    description.text(group.description)
    email.text(group.email)
    directMembers.text(group.directMembersCount + " direct members")
    tooltip.attr("href", "/pages/group.html?group=" + d.data.id)
}

async function onloadGroupDetails() {
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
    setGroupDetails(group);
    setGroupSettings(group);
}

/** Set <div> content for group details */
function setGroupDetails(group) {
    const groupNameTitle = document.getElementById("group-name-title");
    groupNameTitle.innerHTML = group.name;

    const groupName = document.getElementById("group-name");
    groupName.innerHTML = group.name;

    const groupEmail = document.getElementById("group-email");
    groupEmail.innerHTML = group.email;

    const groupDescription = document.getElementById("group-description");
    if (group.description) groupDescription.innerHTML = group.description;

    const numGroups = document.getElementById("num-groups");
    numGroups.innerHTML = Object.keys(visited).length;

    const numUsers = document.getElementById("num-users");
    numUsers.innerHTML = users.length;
}

/** Get groups settings for specific group */
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
        const accessType = document.getElementById("access-type");
        accessType.innerHTML = getAccessType(json);

        const joinGroup = document.getElementById("join-group");
        joinGroup.innerHTML = json.whoCanJoin == "ALL_IN_DOMAIN_CAN_JOIN" ? "Anyone in the organization can join" : json.whoCanJoin == "CAN_REQUEST_TO_JOIN" ? "Anyone in the organization can ask" : "Only invited users";

        const membersOutsideOrg = document.getElementById("members-outside-org");
        membersOutsideOrg.innerHTML = json.allowExternalMembers == "true" ? "Yes" : "No";

        setAccessMembershipSettingsTable(json);
    }
}

/** Returns the access type based on this group's settings */
function getAccessType(group) {
    // Default public settings object
    let publicSettings = {
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
    let teamDiffs = {
        whoCanJoin: "CAN_REQUEST_TO_JOIN"
    }
    // Differences for announcement only
    let announcementDiffs = {
        whoCanPostMessage: "ALL_MANAGERS_CAN_POST",
        whoCanViewMembership: "ALL_MANAGERS_CAN_VIEW"
    }
    // Differences for restricted
    let restrictedDiffs = {
        whoCanJoin: "CAN_REQUEST_TO_JOIN",
        whoCanPostMessage: "ALL_MEMBERS_CAN_POST",
        whoCanViewGroup: "ALL_MEMBERS_CAN_VIEW",
        whoCanViewMembership: "ALL_MEMBERS_CAN_VIEW",
    }
    // Find out differences between this group's settings and default public settings
    let diffs = diff(group, publicSettings);
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

function setLoadingOverlay() {
    var overlay = document.getElementsByClassName("overlay");
    var overlayArray = Array.from(overlay);
    if (isLoading) {
        overlayArray.map(elem => elem.classList.remove("hidden"))
    } else {
        overlayArray.map(elem => elem.classList.add("hidden"))
    }
}
