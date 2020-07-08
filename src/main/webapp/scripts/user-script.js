var params = JSON.parse(localStorage.getItem('oauth2-test-params'));
var token = params['access_token'];
var domain = localStorage.getItem('domain');
var flatdata = [] // flatdata to contain all orgUnits, will be converted to hierarchical data 
var data = {} // data to contail all orgUnits and users 
var searchInput; // input for searchbar
var orgUnitInput = []; // input for filter by orgUnit
var groupInput = []; // input for filter by group

// the function called onload for user.html
function userOnload(){
    pagesLoginStatus(); 
    sidebar();
    fetchOUs();
}

// retrieve all OrgUnits from the API (the API returns all OrgUnits except the root OrgUnit)
function fetchOUs(){
    chartElement = document.getElementById("user-chart");
    chartElement.innerHTML = "";
    flatdata = [];
    data = {};
    fetch('https://www.googleapis.com/admin/directory/v1/customer/my_customer/orgunits?type=all', {
    headers: {
        'authorization': `Bearer ` + token,
    }
    }).
    then(response => response.json())
    .then((ousjson) => {
        var ous = ousjson['organizationUnits'];
        addOrgUnitsToData(ous);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

// Add all OrgUnits (including the root OrgUnit) to data
function addOrgUnitsToData(ous){
    for(var i = 0; i < ous.length; i++){
        var eachOU = ous[i];
        var childElement = {"name": eachOU["name"], "path": eachOU["orgUnitPath"], "parentPath": eachOU["parentOrgUnitPath"], "users": []};
        flatdata.push(childElement);
    }
    // add root OrgUnit to data
    for(var i = 0; i < ous.length; i++){
        if(ous[i]['parentOrgUnitPath'] === "/"){
            var rootID = ous[i]['parentOrgUnitId'];
            fetch('https://www.googleapis.com/admin/directory/v1/customer/my_customer/orgunits/' + rootID, {
            headers: {
                'authorization': `Bearer ` + token,
            }
            }).
            then(response => response.json())
                .then((root) => {
                    var rootElement = {"name": root["name"], "path": root["orgUnitPath"], "parentPath": null, "users": []};
                    flatdata.push(rootElement);
                    // convert flat data to nested json with hierachy
                    data = d3.stratify()
                                .id(function(d) {return d.path})
                                .parentId(function(d) {return d.parentPath})
                                (flatdata)
                    addUserToData();
            })
            .catch((error) => {
                console.error(error);
            })
        }
        break;
    }
}

// add users into the OUs they are in
async function addUserToData(){
    // if there's input in the search bar, only add users from search result
    // query users match the query input, query can be any prefix of name and email
    if(searchInput){
        console.log("search input");
        var encodedParam =  encodeURI(searchInput);
        var response = await fetch('https://www.googleapis.com/admin/directory/v1/users?domain=' + domain + '&query=' + encodedParam, {
                    headers: {
                        'authorization': `Bearer ` + token,
                    }
                });
        var json = await response.json();
        var numElement = document.getElementById('num-search-users');
        numElement.innerText = json.users.length;
        var users = json.users;
        for(var i = 0; i < users.length; i++){
            let user = users[i];
            var fullname = user['name']['fullName'];
            var id = user['id'];
            var orgUnitPath = user['orgUnitPath'];
            var userJSON = {"name": fullname, "id": id, "orgUnitPath": orgUnitPath};
            addUserToOUByPath(data, orgUnitPath, userJSON);
        }
        incrementUserCount(data);
        visualize();
    }
    // if there's filter, get users from filters
    else if(groupInput.length > 0 || orgUnitInput.length > 0){
        console.log("filter input");
        var userIds = new Set();
        // for each orgUnit id, get users of the orgUnit
        await Promise.all(orgUnitInput.map(async (orgUnit) => {
            var response = await fetch('https://www.googleapis.com/admin/directory/v1/users?domain=' + domain + '&query=orgUnitPath=' + orgUnit, {
                    headers: {
                        'authorization': `Bearer ` + token,
                    }
                });
            var json = await response.json();
            var users = json.users;
            if(users){
                for(var i = 0; i < users.length; i++){
                    userIds.add(users[i].id);
                }
            }
        }));
        // for each group id, get members of the group
        await Promise.all(groupInput.map(async (group) => {
            var response = await fetch('https://www.googleapis.com/admin/directory/v1/groups/' + group + '/members', {
                    headers: {
                        'authorization': `Bearer ` + token,
                    }
                });
            var json = await response.json();
            var members = json.members;
            for(var i = 0; i < members.length; i++){
                if(members[i].type === 'USER'){
                    userIds.add(members[i].id);
                }          
            }
        }));
        userIds = Array.from(userIds);
        var numElement = document.getElementById('num-filter-users');
        numElement.innerText = userIds.length;
        for(var i = 0; i < userIds.length; i++){
            var response = await fetch('https://www.googleapis.com/admin/directory/v1/users/' + userIds[i], {
                    headers: {
                        'authorization': `Bearer ` + token,
                    }
                });
            var json = await response.json();
            var userJSON = {"name": json.name.fullName, "id": json.id, "orgUnitPath": json.orgUnitPath};
            addUserToOUByPath(data, json.orgUnitPath, userJSON);
        }
        incrementUserCount(data);
        visualize();
    }
    // if there's no search and no filter
    else{
        var numSearchElement = document.getElementById('num-search-users');
        numSearchElement.innerText = 0;
        var numFilterElement = document.getElementById('num-filter-users');
        numFilterElement.innerText = 0;
        fetch('https://www.googleapis.com/admin/directory/v1/users?domain=' + domain, {
        headers: {
            'authorization': `Bearer ` + token,
        }
        }).
        then(response => response.json())
        .then((userJSON) => {
            var users = userJSON['users'];
            for(var i = 0; i < users.length; i++){
                let user = users[i];
                var fullname = user['name']['fullName'];
                var id = user['id'];
                var orgUnitPath = user['orgUnitPath'];
                var userJSON = {"name": fullname, "id": id, "orgUnitPath": orgUnitPath};
                addUserToOUByPath(data, orgUnitPath, userJSON);
            }
            incrementUserCount(data);
            visualize();
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    }
}

// add user to the OU it's in by DFS 
function addUserToOUByPath(node, path, user){
    if(node.data['path'] === path){
        node.data['users'].push(user);
        return;
    }
    else{
        var children = node['children'];
        for(var i = 0; i < children.length; i++){
            ou = children[i];
            if(path.includes(ou.data['path'])){
                addUserToOUByPath(ou, path, user);
            }
        }
    }
}

// change numUsers of each OU to the number of users in the OU, 
// numUsers is 1 more than the actual number of users to prevent empty orgUnits display issue 
function incrementUserCount (node){
    var numUsers = node.data['users'].length + 1;
    node.data['numUsers'] = numUsers;
    var children = node['children'];
    if(children !== undefined){
        for(var i = 0; i < children.length; i++){
            incrementUserCount(children[i]);
        }
    }
    else{
        return;
    }
}

// Visualization
function visualize() {
    console.log(data);
    function name(d) {
        return d.ancestors().reverse().map(d => d.data.name).join("/");
    }
    width = 600;
    height = 400;
    format = d3.format(",d");
    
    var treemap = data => d3.treemap()
        .tile(tile)
        (data
            .sum(d => d.numUsers)
            .sort((a, b) => b.numUsers - a.numUsers));

    const x = d3.scaleLinear().rangeRound([0, width]);
    const y = d3.scaleLinear().rangeRound([0, height]);

    const svg = d3.create("svg")
        .attr("viewBox", [0.5, -100.5, width, height + 100])
        .style("font", "10px sans-serif");

    let group = svg.append("g")
        .call(render, treemap(data));

    function render(group, root) {
        const node = group
            .selectAll("g")
            .data(root.children.concat(root))
            .join("g");

        node.filter(d => d === root ? d.parent : d.children)
            .attr("cursor", "pointer")
            .on("click", d => d === root ? zoomout(root) : zoomin(d));

        node.append("title")
            .text(d => `${name(d)}\n${format(d.numUsers)}`);

        node.append("rect")
            .attr("id", function(d) { return d.data.id; })
            .attr("fill", d => d === root ? "#fff" : d.children ? "#99bbff" : "#ccddff") //#99bbff is darker blue, #ccddff is lighter blue
            .attr("stroke", "#fff");

        node.append("clipPath")
            .attr("id", function(d) { return "clip-" + d.data.id; })
            .append("use")
            .attr("xlink:href", function(d) { return "#" + d.data.id; });

        node.append("text")
            .attr("clip-path", d => d.clipUid)
            .attr("font-weight", d => d === root ? "bold" : null)
            .selectAll("tspan")
            .data(d => (d === root ? name(d) : d.data.name).split(/(?=[])/g))
            .join("tspan")
            .attr("x", 3)
            .attr("y", (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`)
            .attr("fill-opacity", (d, i, nodes) => i === nodes.length - 1 ? 0.7 : null)
            .attr("font-weight", (d, i, nodes) => i === nodes.length - 1 ? "normal" : null)
            .text(d => d);

        var nodeSelect = node.append("foreignObject")
            .attr("width", function(d){return ( x(d.x1) - x(d.x0) - 15)})
            .attr("height", (d => (d === root ? 60 : y(d.y1) - y(d.y0) - 50)))
            .attr("x", 0)
            .attr("y", 20)
            .append("xhtml:body-user")
            .append("div")
            .attr("class", "list-container")
            .append("ul")
            .attr("style", (d => (d === root ? "max-height: 60px; overflow: auto" : "max-height: " + (y(d.y1) - y(d.y0) - 50)) + "; overflow: auto"))
        
        // add users with links to each node
        nodeSelect.selectAll("li")
            .data(function(d){
                var users = d.data.users;
                var userlist = []
                for(var i = 0; i < users.length; i++){
                    userlist.push(users[i].name);
                }
                return userlist;
            })
            .enter()
            .append("li")
            .append("a")
            .attr("href", "#")
            .attr("class", "userdetail")
            .text(function(d){ return d })

        // Change links to include user id 
        nodeSelect.selectAll("a.userdetail")
            .data(function(d){
                var users = d.data.users;
                var userlist = []
                for(var i = 0; i < users.length; i++){
                    userlist.push(users[i].id);
                }
                return userlist
            })
            .attr("href", (d => "userdetails.html?user=" + d))

        group.call(position, root);
    }

    function position(group, root) {
        group.selectAll("g")
            .attr("transform", d => d === root ? `translate(0,-100)` : `translate(${x(d.x0)},${y(d.y0)})`)
        .select("rect")
            .attr("width", d => d === root ? width : x(d.x1) - x(d.x0))
            .attr("height", d => d === root ? 100 : y(d.y1) - y(d.y0));
    }

    // When zooming in, draw the new nodes on top, and fade them in.
    function zoomin(d) {
    const group0 = group.attr("pointer-events", "none");
    const group1 = group = svg.append("g").call(render, d);

    x.domain([d.x0, d.x1]);
    y.domain([d.y0, d.y1]);

    svg.transition()
        .duration(750)
        .call(t => group0.transition(t).remove()
            .call(position, d.parent))
        .call(t => group1.transition(t)
            .attrTween("opacity", () => d3.interpolate(0, 1))
            .call(position, d));
    }

    // When zooming out, draw the old nodes on top, and fade them out.
    function zoomout(d) {
    const group0 = group.attr("pointer-events", "none");
    const group1 = group = svg.insert("g", "*").call(render, d.parent);

    x.domain([d.parent.x0, d.parent.x1]);
    y.domain([d.parent.y0, d.parent.y1]);

    svg.transition()
        .duration(750)
        .call(t => group0.transition(t).remove()
            .attrTween("opacity", () => d3.interpolate(1, 0))
            .call(position, d))
        .call(t => group1.transition(t)
            .call(position, d.parent));
    }
    var chartElement = document.getElementById("user-chart");
    chartElement.appendChild(svg.node());

    return svg.node();
}

function tile(node, x0, y0, x1, y1) {
  d3.treemapBinary(node, 0, 0, width, height);
  for (const child of node.children) {
    child.x0 = x0 + child.x0 / width * (x1 - x0);
    child.x1 = x0 + child.x1 / width * (x1 - x0);
    child.y0 = y0 + child.y0 / height * (y1 - y0);
    child.y1 = y0 + child.y1 / height * (y1 - y0);
  }
}


/** Sidebar functionality: search and filter */

// sidebar functionality, including getting domain name, searchbar, filter
async function sidebar(){
    // custom domain @
    domainElement = document.getElementById("domain-name");
    domainElement.innerText = domain;

    // search bar
    searchField = document.getElementById("user-search-input");
    searchButton = document.getElementById("user-search-btn");
    searchButton.addEventListener("click", function(event) {
        searchInput = searchField.value;
        orgUnitInput = []; 
        groupInput = [];
        $(':checkbox:enabled').prop('checked', false);
        var numFilterElement = document.getElementById('num-filter-users');
        numFilterElement.innerText = 0;
        pagesLoginStatus();
        fetchOUs();
    })

    searchField.addEventListener("search", function(event) {
            searchButton.click();
    });

    // filter by orgUnit(s)
    var response = await fetch('https://www.googleapis.com/admin/directory/v1/customer/my_customer/orgunits?type=all', {
        headers: {
            'authorization': `Bearer ` + token,
        }
    });
    var json = await response.json();
    var orgUnits = json.organizationUnits;
    var orgUnitOptions = [];
    for (var i = 0; i < orgUnits.length; i++) {
        orgUnitOptions.push("<input type='checkbox' class='form-check-input' id='" + orgUnits[i].orgUnitId + "' value='" + orgUnits[i].orgUnitPath + "'><label class='form-check-label' for='" + orgUnits[i].orgUnitPath + "'> " + orgUnits[i].name + "</label><br>");
    }
    document.getElementById("orgunit-sel").innerHTML = orgUnitOptions.join('');
    var checkboxElems = document.querySelectorAll("#orgunit-sel input[type='checkbox']");
    for (var i = 0; i < checkboxElems.length; i++) {
        checkboxElems[i].addEventListener("click", updateOrgUnitInput);
    }

    // filter by group(s)
    var response = await fetch('https://www.googleapis.com/admin/directory/v1/groups?domain=' + domain + '&customer=my_customer', {
        headers: {
            'authorization': `Bearer ` + token,
        }
    });
    var json = await response.json();
    var groups = json.groups;
    var groupOptions = [];
    for (var i = 0; i < groups.length; i++) {
        groupOptions.push("<input type='checkbox' class='form-check-input' id='" + groups[i].id + "' value='" + groups[i].id + "'><label class='form-check-label' for='" + groups[i].id + "'> " + groups[i].name + "</label><br>");
    }
    document.getElementById("group-sel").innerHTML = groupOptions.join('');
    var checkboxElems = document.querySelectorAll("#group-sel input[type='checkbox']");
    for (var i = 0; i < checkboxElems.length; i++) {
        checkboxElems[i].addEventListener("click", updateGroupInput);
    }
}

// clear search inputs
function clearSearch(){
    searchInput = "";
    var searchField = document.getElementById("user-search-input");
    searchField.value = "";
    var numSearchElement = document.getElementById('num-search-users');
    numSearchElement.innerText = 0;
}

// update variable orgUnitInput based on checkbox
function updateOrgUnitInput(e){
    var selections = {};
    var selectedOrgUnits = []
    if(e.target.checked){
        orgUnitInput.push(e.target.value);
    }
    else{
        var index = orgUnitInput.indexOf(e.target.value);
        if(index > -1){
            orgUnitInput.splice(index, 1);
        }
    }
    clearSearch();
    pagesLoginStatus();
    fetchOUs();
}

// update variable groupInput based on checkbox
function updateGroupInput(e) {
    var selections = {};
    var selectedGroups = []
    if(e.target.checked){
        groupInput.push(e.target.id);
    }
    else{
        var index = groupInput.indexOf(e.target.id);
        if(index > -1){
            groupInput.splice(index, 1);
        }
    }
    clearSearch();
    pagesLoginStatus();
    fetchOUs();
}

// clear all filters, display all users
function clearFilters(){ 
    orgUnitInput = []; 
    groupInput = [];
    $(':checkbox:enabled').prop('checked', false);
    var numFilterElement = document.getElementById('num-filter-users');
    numFilterElement.innerText = 0;
    pagesLoginStatus();
    fetchOUs();
}

/** End of sidebar functionality */


/** User details page */
// user detail onload
function userdetailOnload(){
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    var userid = urlParams.get('user');
    console.log(userid);
    fetch("https://www.googleapis.com/admin/directory/v1/users/" + userid, {
    headers: {
        'authorization': `Bearer ` + token,
    }
    }).
    then(response => response.json())
    .then((user) => {
        var userNameElement = document.getElementById("user-name");
        userNameElement.innerText = user.name.fullName;
        var userEmailElement = document.getElementById("user-email");
        userEmailElement.innerText = user.primaryEmail;
        var userOrgUnitElement = document.getElementById("user-orgUnit");
        userOrgUnitElement.innerText = user.orgUnitPath;
        var userName2Element = document.getElementsByClassName("username");
        console.log(userName2Element);
        for (var i = 0; i < userName2Element.length; i++){
            each = userName2Element[i];
            console.log(each);
            each.innerText = user.name.fullName;
        }
        getSingleBranchOfOU(user);
    })
    .catch((error) => {
        console.error(error);
    });

}

// visualize the path of OUs for a single user
function getSingleBranchOfOU(user){
    var singleBranchOUs = [];
    var theUser = {"name": user.name.fullName, "path": user.name.fullName, "parent": user.orgUnitPath};
    singleBranchOUs.push(theUser);
    fetch('https://www.googleapis.com/admin/directory/v1/customer/my_customer/orgunits?type=all', {
    headers: {
        'authorization': `Bearer ` + token,
    }
    }).
    then(response => response.json())
    .then((ousjson) => {
        console.log(ousjson);
        var ous = ousjson['organizationUnits'];
        for(var i = 0; i < ous.length; i++){
            var eachOU = ous[i];
            var childElement = {"name": eachOU["name"], "path": eachOU["orgUnitPath"], "parentPath": eachOU["parentOrgUnitPath"], "users": []};
            flatdata.push(childElement);
        }
        // add root OrgUnit to data
        for(var i = 0; i < ous.length; i++){
            if(ous[i]['parentOrgUnitPath'] === "/"){
                var rootID = ous[i]['parentOrgUnitId'];
                fetch('https://www.googleapis.com/admin/directory/v1/customer/my_customer/orgunits/' + rootID, {
                headers: {
                    'authorization': `Bearer ` + token,
                }
                }).
                then(response => response.json())
                    .then((root) => {
                        var rootElement = {"name": root["name"], "path": root["orgUnitPath"], "parentPath": null, "users": []};
                        flatdata.push(rootElement);
                        addOUToSingleBranch(user.orgUnitPath);
                        console.log(singleBranchOUs);
                        visualizeUser(singleBranchOUs, "single-user-OU-branch");
                        getGroups(user.id, user.name.fullName);
                    })
                .catch((error) => {
                    console.error('Error:', error);
                });
                break;
            }
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });

    function addOUToSingleBranch(path){
        if(path === null){
            return;
        }
        for(var i = 0; i < flatdata.length; i++){
            if(flatdata[i].path === path){
                var branchOU = {"name": flatdata[i].name, "path": path, "parent": flatdata[i].parentPath};
                singleBranchOUs.push(branchOU);
                addOUToSingleBranch(flatdata[i].parentPath);
            }
        }
    }
}
       
// visualize the direct groups a user is in
function getGroups(userid, username){
    fetch("https://www.googleapis.com/admin/directory/v1/groups?userKey=" + userid,{
    headers: {
        'authorization': `Bearer ` + token,
    }
    }).
    then(response => response.json())
    .then((groupsJson) => {
        console.log(groupsJson);
        var userGroups = [{"id": userid, "name": username, "parent": null}]
        if(groupsJson.hasOwnProperty('groups')){
            groups = groupsJson.groups;
            for(var i = 0; i < groups.length; i++){
                var group = groups[i];
                groupElement = {"id": group.id, "name": group.name, "parent": username}
                userGroups.push(groupElement);
            }
        }
        console.log(userGroups);
        visualizeUser(userGroups, "user-groups");
    })
    .catch((error) => {
        console.error(error);
    });
}

// Generate the tree diagram for a single user, either the OrgUnit branch or all direct groups, passed by params
function visualizeUser(userData, htmlid){
    var treeData;
    if(htmlid === "single-user-OU-branch"){
        treeData = d3.stratify()
            .id(function(d) { return d.path; })
            .parentId(function(d) { return d.parent; })
            (userData);

        // assign the name to each node
        treeData.each(function(d) {
            console.log(d.data.name);
            d.name = d.data.name; 
        });
    }
    // convert the flat data into a hierarchy 
    else{
        treeData = d3.stratify()
            .id(function(d) { return d.name; })
            .parentId(function(d) { return d.parent; })
            (userData);

        // assign the name to each node
        treeData.each(function(d) {
            d.name = d.id;
        });
    }

    // set the dimensions and margins of the diagram
    var margin = {top: 20, right: 160, bottom: 30, left: 160},
        width = 850 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    // declares a tree layout and assigns the size
    var treemap = d3.tree()
        .size([height, width]);

    //  assigns the data to a hierarchy using parent-child relationships
    var nodes = d3.hierarchy(treeData, function(d) {
        return d.children;
    });

    // maps the node data to the tree layout
    nodes = treemap(nodes);

    // append the svg object to the body of the page
    // appends a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    var svg = d3.select("#" + htmlid).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom),
        g = svg.append("g")
        .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

    // adds the links between the nodes
    var link = g.selectAll(".link")
        .data( nodes.descendants().slice(1))
    .enter().append("path")
        .attr("class", "link")
        .attr("d", function(d) {
        return "M" + d.y + "," + d.x
            + "C" + (d.y + d.parent.y) / 2.2 + "," + d.x
            + " " + (d.y + d.parent.y) / 2.2 + "," + d.parent.x
            + " " + d.parent.y + "," + d.parent.x;
        });

    // adds each node as a group
    var node = g.selectAll(".node")
        .data(nodes.descendants())
    .enter().append("g")
        .attr("class", function(d) { 
        return "node" + 
            (d.children ? " node--internal" : " node--leaf"); })
        .attr("transform", function(d) { 
        return "translate(" + d.y + "," + d.x + ")"; });

    // adds the circle to the node
    node.append("circle")
    .attr("r", 10);

    // adds the text to the node
    node.append("text")
    .attr("dy", ".35em")
    .attr("x", function(d) { return d.children ? -20 : 20; })
    .style("text-anchor", function(d) { 
        return d.children ? "end" : "start"; })
    .text(function(d) { return d.data.name; });
}
/** End of user details page */


