var params = JSON.parse(localStorage.getItem('oauth2-test-params'));
var token = params['access_token'];
var domain = "groot-test.1bot2.info"

/* d3 input data */
var data = {
    name: domain,
    children: [],
};

/* JSON lists */
var groups;
var users = [];

/* Tooltip hover card */
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
    // access token expires in 3600 sec after login; fix later
    console.log(token);
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
    
    // var groupOptions = [];
    // groupOptions.push("<option selected='selected'>Select group email...</option>");
    // for (var i = 0; i < groups.length; i++) {
    //     groupOptions.push("<option value='" + groups[i].email + "'>" + groups[i].email + " </option>");
    // }
    // document.getElementById("group-email-sel").innerHTML = groupOptions.join();

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

function clearSidebar() {
    searchName = null;
    searchMemberKey = null;
    orderBy = null;
    viewTotal = 200;

    document.getElementById("search").value = "";
    document.getElementById("user-sel").value = searchMemberKey;
    document.getElementById("order-by-sel").value = orderBy;
    document.getElementById("view-total-groups-sel").value = viewTotal;

    getAllGroups();
}

function selectUser() {
    var userSel = document.getElementById("user-sel");
    if (userSel.value == "null") searchMemberKey = null;
    else searchMemberKey = userSel.value

    checkSidebar(true);
    getAllGroups();
}

function selectOrderBy() {
    var orderBySel = document.getElementById("order-by-sel");
    if (orderBySel.value == "null") orderBy = null;
    else orderBy = orderBySel.value;

    checkSidebar();
    getAllGroups();
}

function viewGroups() {
    var viewSel = document.getElementById("view-total-groups-sel");
    viewTotal = viewSel.value;

    checkSidebar();
    getAllGroups();
}

function visualize() {
    d3.selectAll("svg > *").remove();

    var color = d3.scaleLinear()
    .domain([0, 5])
    .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
    .interpolate(d3.interpolateHcl)

    var format = d3.format(",d")

    var width = window.innerWidth * 3/4 - 80;
    var height = width

    var pack = data => d3.pack()
    .size([width, height])
    .padding(5)

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

    groupName = tooltip
    .append("h5")
    .classed("name", true)

    description = tooltip
    .append("div")
    .classed("description", true)

    email = tooltip
    .append("div")
    .classed("email", true)

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
        .on("click", () => zoom(root));

    const node = svg.append("g")
        .selectAll("circle")
        .data(root.descendants().splice(1))
        .join("circle")
        .attr("fill", d => d.children ? color(d.depth) : "white")
        // .attr("pointer-events", d => !d.children ? "none" : null)
        .on("mouseover", function(d) { 
            d3.select(this).attr("stroke", "#000");
            makeDivElement(d)
            return tooltip.style("visibility", "visible").style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");;
        })
        .on("mouseout", function(d) { 
            d3.select(this).attr("stroke", null); 
            return tooltip.style("visibility", "hidden");
        })
        // .on("mousemove", function(){return tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");})
        .on("click", d => focus !== d && (zoom(d), d3.event.stopPropagation()));

    const label = svg.append("g")
        .style("font", "10px sans-serif")
        .attr("pointer-events", "none")
        .attr("text-anchor", "middle")
        .selectAll("text")
        .data(root.descendants())
        .join("text")
        .style("fill-opacity", d => d.parent === root ? 1 : 0)
        .style("display", d => d.parent === root ? "inline" : "none")
        .style("font-size", "1.5em")
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
    if (chartElement.lastChild) chartElement.removeChild(chartElement.lastChild);
    chartElement.appendChild(svg.node());

    return svg.node();
}

/* Create each of the group <div> elements and display them */
async function loadGroups() {
    data = {
        name: domain,
        children: [],
    };
    users = [];

    // retrieve members from each group
    for (var i = 0; i < groups.length; i++) {
        // create a new data point in the global data object for this group
        var newCircle = {
            name: groups[i].name,
            children: [],
            id: groups[i].id
        }

        const response = await fetch('https://www.googleapis.com/admin/directory/v1/groups/'
        + groups[i].id 
        + '/members', {
            headers: {
                'authorization': `Bearer ` + token,
            }
        })
        const json = await response.json();
        console.log(json)

        if (response.status == 200) {
            var members = json.members;
            var containsSubGroups = false;
            var numUsers = 0;
            for (var j = 0; j < members.length; j++) {
                var type = members[j].type;
                if (type == "GROUP") {
                    // there is a nested group inside the current group
                    containsSubGroups = true;
                    var indexOfGroup = groups.findIndex(elem => elem.id == members[j].id)
                    var group;
                    if (indexOfGroup < 0) {
                        // retrieve group from API
                        group = await getGroup(members[j].id);
                    } else {
                        group = groups[indexOfGroup];
                    }
                    newCircle.children.push({
                        name: group.name,
                        value: parseInt(group.directMembersCount),
                        id: group.id
                    })
                } else if (type == "USER") {
                    var indexOfUser = users.findIndex(elem => elem.id == members[j].id)
                    if (indexOfUser < 0) {
                        // if not in the set already, add it
                        users.push(members[j])
                    }
                    numUsers++;
                }
            }
            if (!containsSubGroups) {
                newCircle.value = parseInt(groups[i].directMembersCount);
                delete newCircle.children
            }
            newCircle.value = parseInt(numUsers);
            data.children.push(newCircle);
        }
    }
    console.log(data)
    if (groups.length == 0) data = {};
    visualize();
    loadSidebar();
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

/** Creates the components of the hovering <div> element for each group */
function makeDivElement(d) {
    // tooltip.text(d.data.name)

    // find group with this id
    var group = groups[groups.findIndex(elem => elem.id == d.data.id)]
    groupName.text(group.name)
    description.text(group.description)
    email.text(group.email)
    directMembers.text(group.directMembersCount + " direct members")
}
