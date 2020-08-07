/** Show refresh button and overlay */
var isLoading;

/** d3 input data */
var data;

/** JSON lists and maps */
var groups;
var users;
var usersDisplayed;

/** JSON maps */
var visited;
var members;

/** Tooltip hover card */
var displayTooltip;
var tooltip;
var tooltipName;
var tooltipEmail;
var tooltipDescription;
var tooltipRole;
var tooltipLink;
var tooltipRemove;
var tooltipAddMember;

/** Search and filters */
var searchName;
var searchMemberKey;
var orderBy;
var viewTotal = 200;
var showOnlyParentGroups = true;
var flattenGroups = false;

function onloadGroupsPage() {
    checkLoginAndSetUp();

    Promise.all([getAllGroups(true), getAllUsers()])
    .then(async function(results) {
        loadGroups();
    })
}

function getAllGroups(noLoadGroups) {
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
    return fetch(url, {
        headers: {
            'authorization': `Bearer ` + token,
        }
    })
    .then(response => response.json())
    .then((res) => {
        if (res.groups) {
            groups = res.groups;
        } else {
            groups = [];
        }
        if (!noLoadGroups) {
            loadGroups();
        } else {
            isLoading = false;
            setLoadingOverlay();
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

function getAllUsers() {
    isLoading = true;
    setLoadingOverlay();

    var url = 'https://www.googleapis.com/admin/directory/v1/users?domain=' + domain + '&customer=my_customer'
    return fetch(url, {
        headers: {
            'authorization': `Bearer ` + token,
        }
    })
    .then(response => response.json())
    .then((res) => {
        if (res.users) {
            users = res.users;
        } else {
            users = [];
        }
        isLoading = false;
        setLoadingOverlay();
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

/** Fill in informational fields on the sidebar of the page */
function loadGroupsSidebar() {
    document.getElementById("domain-name").innerHTML = "@" + domain;
    document.getElementById("num-groups").innerHTML = groups.length;
    document.getElementById("num-users").innerHTML = usersDisplayed.length;

    // Execute a function when the user presses enter or erases the input
    document.getElementById("search-enter-btn").addEventListener("click", searchGroupName)
    document.getElementById("search").addEventListener("search", searchGroupName);

    var userOptions = [];
    userOptions.push("<option value=null selected='selected'>Select user...</option>");
    for (user of users) {
        userOptions.push("<option value='" + user.primaryEmail + "' id='" + user.primaryEmail + "'>" + user.primaryEmail + " </option>");
    }
    document.getElementById("user-sel").innerHTML = userOptions.join();

    // select preexisting values
    checkGroupsSidebar();
}

/** Check if the user has selected filter options or searched; cannot search for group name or email AND memberKey simultaneously */
function checkGroupsSidebar(memberKey) {
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

/** Clear all the searches and filter options in the sidebar */
function clearFilters() {
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

/** Function called when user clicks on search button or presses enter */
function searchGroupName() {
    searchName = document.getElementById("search").value;

    checkGroupsSidebar();
    getAllGroups();
}

/** Function called when the user selects an option for memberKey */
function selectUser() {
    var userSel = document.getElementById("user-sel");
    if (userSel.value == "null") {
        searchMemberKey = null;
    } else {
        searchMemberKey = userSel.value
    }

    checkGroupsSidebar(true);
    getAllGroups();
}

/** Function called when the user selects an option for order by */
function selectOrderBy() {
    var orderBySel = document.getElementById("order-by-sel");
    if (orderBySel.value == "null") {
        orderBy = null;
    } else {
        orderBy = orderBySel.value;
    }

    checkGroupsSidebar();
    getAllGroups();
}

/** Function called when the user selects an option for view number of total groups */
function selectViewGroups() {
    viewTotal = document.getElementById("view-total-groups-sel").value;

    checkGroupsSidebar();
    getAllGroups();
}

/** Function called when the user toggles whether to show parent groups only */
function checkParentGroups() {
    showOnlyParentGroups = !showOnlyParentGroups;

    checkGroupsSidebar();
    getAllGroups();
}

/** Function called when the user toggles whether to show parent groups only */
function checkFlattenGroups() {
    flattenGroups = !flattenGroups;

    checkGroupsSidebar();
    getAllGroups();
}

/** d3 master function to display all groups using data */
function visualize() {
    d3.selectAll("svg > *").remove();

    var color = d3.scaleLinear()
    .domain([0, 5])
    .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
    .interpolate(d3.interpolateHcl)

    var format = d3.format(",d")

    var width = document.getElementById('chart').clientWidth;
    var height = width

    var pack = data => d3.pack()
    .size([width, height])
    .padding(10)

    (d3.hierarchy(data)
    .sum(d => d.value)
    .sort((a, b) => b.value - a.value))

    tooltip = d3.select("body")
	.append("div")
	.style("position", "absolute")
	.style("z-index", "10")
	.style("visibility", "hidden")
    .classed("card", true)
    .classed("group", true)
    .on("mouseover", function() {
        return tooltip.style("visibility", "visible");
    })

    tooltipName = tooltip
    .append("h5")
    .classed("name", true)

    tooltipEmail = tooltip
    .append("div")
    .classed("email", true)

    tooltipDescription = tooltip
    .append("div")
    .classed("description", true)
    
    tooltipRole = tooltip
    .append("select")
    .classed("role", true)
    .classed("form-control", true)
    .attr("id", "tooltip-role-sel")

    var tooltipRoleMember = tooltipRole
    .append("option")
    .attr("value", "Member")
    .text("Member")
    var tooltipRoleManager = tooltipRole
    .append("option")
    .attr("value", "Manager")
    .text("Manager")
    var tooltipRoleOwner = tooltipRole
    .append("option")
    .attr("value", "Owner")
    .text("Owner")

    tooltipLink = tooltip
    .append("a")
    .classed("link", true)
    .text("Click to view more")

    tooltipRemove = tooltip
    .append("button")
    .classed("btn", true)
    .classed("btn-collapse", true)
    .attr("id", "remove-btn")

    var tooltipRemoveSpan = tooltipRemove
    .append("span")
    .attr("data-hover", "Remove member")
    var tooltipRemoveIcon = tooltipRemoveSpan
    .append("i")
    .classed("fa", true)
    .classed("fa-times", true)

    tooltipAddMember = tooltip
    .append("button")
    .classed("btn", true)
    .classed("btn-collapse", true)
    .attr("id", "add-member-btn")

    var tooltipAddMemberSpan = tooltipAddMember
    .append("span")
    .attr("data-hover", "Add member")
    var tooltipAddMemberIcon = tooltipAddMemberSpan
    .append("i")
    .classed("fa", true)
    .classed("fa-user-plus", true)

    const root = pack(data);
    var focus = root;
    var view;

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
        .attr("fill", d => d.data.type == "USER" ? "white" : (d.data.children ? color(d.depth) : "rgb(116, 215, 202)"))
        .on("mouseover", function(d) { 
            d3.select(this).attr("stroke", "#000");
            if (d.data.type == "USER") {
                makeUserTooltip(d, d.parent.data.id)
                tooltipDescription.classed("hidden", true)
                tooltipRole.classed("hidden", false)
                tooltipAddMember.classed("hidden", true)
            } else {
                makeGroupTooltip(d, d.parent.data.id);
                tooltipRole.classed("hidden", true)
                tooltipDescription.classed("hidden", false)
                tooltipAddMember.classed("hidden", false)
            }
            if (!d.parent.data.id) {
                tooltipRemove.classed("hidden", true);
            } else {
                tooltipRemove.classed("hidden", false);
            }
            var pageY = event.pageY;
            var pageX = event.pageX;
            displayTooltip = true;
            tooltip.style("top", (pageY)+"px").style("left",(pageX+10)+"px")
            // show hover card after 500 ms if cursor is still on the same circle
            setTimeout(function() {
                if (displayTooltip == true) return tooltip.style("visibility", "visible");
            }, 500)
        })
        .on("mouseout", function(d) { 
            d3.select(this).attr("stroke", null);
            displayTooltip = false;
            return tooltip.style("visibility", "hidden");
        })
        .on("click", function(d) {
            if (d.data.type != "USER" && d.data.children) focus !== d && (zoom(d), d3.event.stopPropagation())
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
    while (chartElement.lastElementChild.id != "create-btn") {
        chartElement.removeChild(chartElement.lastChild);
    }
    chartElement.appendChild(svg.node());

    if (groups.length > 0) {
        zoomTo([root.x, root.y, root.r * 2]);
    } else {
        // Show no search results
        var div = document.createElement("div");
        div.classList.add("no-search-results")
        var p = document.createElement("P");
        p.innerHTML = "There were no results for your search."; 
        var btn = document.createElement("BUTTON");
        btn.innerHTML = "Reset all";
        btn.classList.add("btn");
        btn.classList.add("btn-light");
        btn.onclick = clearFilters;

        div.appendChild(p);
        div.appendChild(btn);
        chartElement.appendChild(div);
    }

    isLoading = false;
    setLoadingOverlay();

    return svg.node();
}

/** Creates the components of the hovering <div> element for each group */
function makeGroupTooltip(d, parentId) {
    // find group with this id
    var group = groups[groups.findIndex(elem => elem.id == d.data.id)]
    tooltipName.text(group.name)
    tooltipEmail.text(group.email)
    tooltipDescription.text(group.description)
    tooltipLink.attr("href", "/pages/groupdetails.html?group=" + d.data.id)
    tooltipRemove.attr("onclick", "removeMemberModal('" + d.data.id +  "', '" + parentId + "')")
    tooltipAddMember.attr("onclick", "addMemberModal('" + d.data.id +  "')")
}

/** Creates the components of the hovering <div> element for each user */
function makeUserTooltip(d, parentId) {
    // find user with this id
    var user = usersDisplayed[usersDisplayed.findIndex(elem => elem.id == d.data.id)]
    tooltipName.text(user.name.fullName)
    tooltipEmail.text(user.primaryEmail)
    document.getElementById("tooltip-role-sel").value = user.roles[parentId][0].toUpperCase() + user.roles[parentId].slice(1).toLowerCase();
    tooltipRole.attr("onchange", "selectRole('" + d.data.id +  "', '" + parentId + "')")
    tooltipLink.attr("href", "/pages/userdetails.html?user=" + d.data.id)
    tooltipRemove.attr("onclick", "removeMemberModal('" + d.data.id +  "', '" + parentId + "')")
}

/** Load all of the groups into data for d3 */
async function loadGroups() {
    isLoading = true;
    setLoadingOverlay();

    // reset data and unique users
    // if empty groups, data should also be empty
    usersDisplayed = [];
    if (groups.length == 0) {
        data = {};
        visualize();
        loadGroupsSidebar();
    } else {
        data = {
            name: domain,
            children: [],
        };
        // create the visited hash set for groups already processed, containing group IDs
        visited = {};
        members = {};

        // collect all the promises
        var promises = [];
        for (group of groups) {
            // iterate through all the groups and get their direct members
            promises.push(getGroupMembers(group.id));
        }

        Promise.all(promises)
        .then(async function(results) {
            for (group of groups) {
                // if already visited, then add the circle data
                if (visited.hasOwnProperty(group.id)) {
                    if (!showOnlyParentGroups) {
                        var visitedGroup = visited[group.id];
                        data.children.push(visitedGroup)
                    }
                } else {
                    // recursive DFS on the new group to get the new data
                    var newData = await loadGroupsDFS(group, null);
                    data.children.push(newData);
                }
            }
            visualize();
            loadGroupsSidebar();
        })
    }
}

async function loadGroupsDFS(currGroup, parentGroup) {
    if (currGroup.type == "USER") {
        var userData;
        // a user can have different roles depending on which group
        var userIndex = usersDisplayed.findIndex(elem => elem.id == currGroup.id)
        if (userIndex < 0) {
            // if not visited user yet, get user from users map
            userIndex = users.findIndex(elem => elem.id == currGroup.id)
            if (userIndex < 0) {
                userData = await getUser(currGroup.id);
            } else {
                userData = users[userIndex];
            }
            userData.roles = {};
            usersDisplayed.push(userData);
        } else {
            userData = usersDisplayed[userIndex];
        }
        userData.roles[parentGroup.id] = currGroup.role;
        return {
            name: userData.name.fullName,
            value: 1,
            id: userData.id,
            type: currGroup.type
        }
    }
    // create a new circle for this current group with an initial empty children list
    var newCircle = {
        name: currGroup.name,
        children: [],
        value: parseInt(currGroup.directMembersCount == 0 ? 1 : currGroup.directMembersCount),
        id: currGroup.id
    }
    // if members for this group does not exist
    var currMembers
    if (!members[currGroup.id]) {
        currMembers = await getGroupMembers(currGroup.id);
    } else {
        currMembers = members[currGroup.id];
    }
    for (member of currMembers) {
        // if already visited, then add the circle into newCircle children list
        if (visited.hasOwnProperty(member.id)) {
            var visitedGroup = visited[member.id];

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
            // if group, get the group with the name
            if (member.type == "GROUP") {
                var indexOfGroup = groups.findIndex(elem => elem.id == member.id);
                if (indexOfGroup < 0) {
                    member = await getGroup(member.id);
                } else {
                    member = groups[indexOfGroup];
                }
            }
            var newData = await loadGroupsDFS(member, currGroup);

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

/** Returns the corresponding list of members for the group with the id */
async function getGroupMembers(id) {
    var currId = id;
    return fetch('https://www.googleapis.com/admin/directory/v1/groups/' + currId + '/members', {
        headers: {
            'authorization': `Bearer ` + token,
        }
    })
    .then(response => response.json())
    .then(data => {
        var currMembers;
        // if data.members is undefined, return empty array
        if (data.members) {
            currMembers = data.members;
        } else {
            currMembers = [];
        }
        // if members does not exist, return instead of assigning to dict
        if (members) {
            members[currId] = currMembers;
        }
        return currMembers;
    });
}

/** Returns the corresponding group with the id */
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

/** Returns the corresponding user with the id */
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

/** Creates a new group */
async function createGroup() {
    isLoading = true;
    setLoadingOverlay();

    var form = document.getElementById('create-group-form');
    form.classList.add('was-validated');
    if (form.checkValidity() === false) {
        isLoading = false;
        setLoadingOverlay();
        return;
    }

    var groupName = document.getElementById("group-name-field").value;
    var groupEmail = document.getElementById("group-email-field").value;
    var groupDescription = document.getElementById("group-description-field").value;

    const response = await fetch('https://www.googleapis.com/admin/directory/v1/groups',
    {
        headers: {
            'authorization': `Bearer ` + token,
            'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({"name": groupName, "email": groupEmail + "@" + domain, "description": groupDescription})
    })
    const json = await response.json();
    console.log(json)

    if (response.status == 200) {
        $('#createModal').modal('hide');
        isLoading = false;
        setLoadingOverlay();
        if (window.location.href.split("pages/")[1].split(".html")[0] == "groups") {
            onloadGroupsPage();
        } else if (window.location.href.split("pages/")[1].split(".html")[0] == "groupdetails") {
            onloadGroupDetails();
        }
    }
}

/** Shows the create form for making a new group */
function createGroupModal() {
    $('#createModal').modal('show');
    document.getElementById("modal-group-email-domain").innerHTML = "@" + domain;
}

/** Function is called when the user selects a role for the member */
async function selectRole(id, parentId) {
    isLoading = true;
    setLoadingOverlay();

    var role = document.getElementById("tooltip-role-sel").value;
    var user = usersDisplayed[usersDisplayed.findIndex(elem => elem.id == id)];

    const response = await fetch('https://www.googleapis.com/admin/directory/v1/groups/' 
    + parentId + '/members/' + user.primaryEmail,
    {
        headers: {
            'authorization': `Bearer ` + token,
            'Content-Type': 'application/json'
        },
        method: 'PUT',
        body: JSON.stringify({"email": user.primaryEmail, "role": role.toUpperCase()})
    })
    const json = await response.json();
    console.log(json)

    if (response.status == 200) {
        isLoading = false;
        setLoadingOverlay();
        if (window.location.href.split("pages/")[1].split(".html")[0] == "groups") {
            onloadGroupsPage();
        } else if (window.location.href.split("pages/")[1].split(".html")[0] == "groupdetails") {
            onloadGroupDetails();
        }
    }
}

/** Remove membership from this group */
async function removeMember(memberEmail, parentId) {
    isLoading = true;
    setLoadingOverlay();

    const response = await fetch('https://www.googleapis.com/admin/directory/v1/groups/' 
    + parentId + '/members/' + memberEmail,
    {
        headers: {
            'authorization': `Bearer ` + token
        },
        method: 'DELETE'
    })
    if (response.status == 204) {
        $('#removeModal').modal('hide');
        isLoading = false;
        setLoadingOverlay();
        if (window.location.href.split("pages/")[1].split(".html")[0] == "groups") {
            onloadGroupsPage();
        } else if (window.location.href.split("pages/")[1].split(".html")[0] == "groupdetails") {
            onloadGroupDetails();
        }
    }
}

/** Double checks that the user wants to remove this membership */
function removeMemberModal(id, parentId) {
    $('#removeModal').modal('show');
    var memberEmail;
    var userIndex = usersDisplayed.findIndex(elem => elem.id == id);
    if (userIndex < 0) {
        memberEmail = groups[groups.findIndex(elem => elem.id == id)].email;
    } else {
        memberEmail = usersDisplayed[userIndex].primaryEmail;
    }

    document.getElementById("removeMemberButton").onclick = () => removeMember(memberEmail, parentId);

    document.getElementById("memberEmail").innerHTML = memberEmail;
    document.getElementById("parentGroupEmailRemove").innerHTML = groups[groups.findIndex(elem => elem.id == parentId)].email;

    displayTooltip = false;
    return tooltip.style("visibility", "hidden");
}

/** Add member to this group */
async function addMember(id) {
    isLoading = true;
    setLoadingOverlay();

    var form = document.getElementById('add-member-form');
    form.classList.add('was-validated');
    if (form.checkValidity() === false) {
        isLoading = false;
        setLoadingOverlay();
        return;
    }

    var selectedMemberEmail = document.getElementById("add-member-sel").value;

    const response = await fetch('https://www.googleapis.com/admin/directory/v1/groups/' 
    + id + '/members',
    {
        headers: {
            'authorization': `Bearer ` + token,
            'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({"email": selectedMemberEmail, "role": "MEMBER"})
    })
    const json = response.json();
    console.log(json);

    if (response.status == 200) {
        $('#addModal').modal('hide');
        isLoading = false;
        setLoadingOverlay();
        if (window.location.href.split("pages/")[1].split(".html")[0] == "groups") {
            onloadGroupsPage();
        } else if (window.location.href.split("pages/")[1].split(".html")[0] == "groupdetails") {
            onloadGroupDetails();
        }
    }
}

/** Shows the modal for user to select which member to add */
function addMemberModal(id) {
    $('#addModal').modal('show');
    document.getElementById("addMemberButton").onclick = () => addMember(id);
    document.getElementById("parentGroupEmailAdd").innerHTML = groups[groups.findIndex(elem => elem.id == id)].email;

    // add all groups and users as options
    var memberOptions = [];
    memberOptions.push("<option value=null selected='selected'>Select member...</option>");
    for (user of users) {
        memberOptions.push("<option value='" + user.primaryEmail + "' id='" + user.primaryEmail + "'>" + user.primaryEmail + " </option>");
    }
    for (group of groups) {
        memberOptions.push("<option value='" + group.email + "' id='" + group.email + "'>" + group.email + " </option>");
    }
    document.getElementById("add-member-sel").innerHTML = memberOptions.join();

    displayTooltip = false;
    return tooltip.style("visibility", "hidden");
}