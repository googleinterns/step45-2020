/** User main page data */
var flatdata = [] // flatdata to contain all orgUnits, will be converted to hierarchical data 
var data = {} // data to contail all orgUnits and users 
var allUsers; 
var rootID;
var userid;

/** Search and filter viarbles */
var searchInput; // input for searchbar
var orgUnitInput = []; // input for filter by orgUnit
var groupInput = []; // input for filter by group
var oulength = 0; // length of all ous

/** Show refresh button and overlay*/
var isLoading;


/** Functions for user main page */

/** the function called onload for user.html */
function userOnload(){
    checkLoginAndSetUp(); 
    sidebar();
    fetchOUs();
}

/** retrieve all OrgUnits from the API (the API returns all OrgUnits except the root OrgUnit) */
async function fetchOUs(){
    chartElement = document.getElementById("user-chart");
    chartElement.innerHTML = "";  
    flatdata = [];
    data = {};

    var response = await fetch('https://www.googleapis.com/admin/directory/v1/customer/my_customer/orgunits?type=all', {
    headers: {
        'authorization': `Bearer ` + token,
    }
    });
    var ousJSON = await response.json();
    var ous = ousJSON['organizationUnits'];
    oulength = ous.length;
    addOrgUnitsToData(ous);
}

/** retrieve all users from the API */
async function fetchUsers(){
    var response = await fetch('https://www.googleapis.com/admin/directory/v1/users?domain=' + domain, {
        headers: {
            'authorization': `Bearer ` + token,
        }
    });
    var userJSON = await response.json();
    var users = userJSON['users'];
    allUsers = [];
    for(var user of users){
        var fullname = user['name']['fullName'];
        var id = user['id'];
        var orgUnitPath = user['orgUnitPath'];
        var email = user['primaryEmail'];
        var userJSON = {"name": fullname, "id": id, "orgUnitPath": orgUnitPath, 'email': email};
        allUsers.push(userJSON);
    }
    return allUsers;
}

/** Add all OrgUnits (including the root OrgUnit) to data */
async function addOrgUnitsToData(ous){
    for(var eachOU of ous){
        var childElement = {"name": eachOU["name"], "path": eachOU["orgUnitPath"], "parentPath": eachOU["parentOrgUnitPath"], "users": []};
        flatdata.push(childElement);
    }
    // add root OrgUnit to data
    for(var ou of ous){
        if(ou['parentOrgUnitPath'] === "/"){
            rootID = ou['parentOrgUnitId'];
            var response = await fetch('https://www.googleapis.com/admin/directory/v1/customer/my_customer/orgunits/' + rootID, {
                headers: {
                    'authorization': `Bearer ` + token,
                }
            });
            var root = await response.json();
            var rootElement = {"name": root["name"], "path": root["orgUnitPath"], "parentPath": null, "users": []};
            rootOUName = root["name"];
            flatdata.push(rootElement);

            // convert flat data to nested json with hierachy
            data = d3.stratify()
                        .id(function(d) {return d.path})
                        .parentId(function(d) {return d.parentPath})
                        (flatdata)
            addUserToData();
        }
        break;
    }
}

/** add users into the OUs they are in */
async function addUserToData(){
    isLoading = true; 
    setLoadingOverlay();

    var allUsers = await fetchUsers();

    // if there's input in the search bar, only add users from search result
    // query users match the query input, query can be any prefix of name and email
    if(searchInput){
        var encodedParam =  encodeURI(searchInput);
        var response = await fetch('https://www.googleapis.com/admin/directory/v1/users?domain=' + domain + '&query=' + encodedParam, {
            headers: {
                'authorization': `Bearer ` + token,
            }
        });
        var json = await response.json();
        var numElement = document.getElementById('num-search-users');
        numElement.innerText = json.users ? json.users.length : 0;
        var users = json.users;
        if(json.users){
            for(var user of users){
                var fullname = user['name']['fullName'];
                var id = user['id'];
                var orgUnitPath = user['orgUnitPath'];
                var email = user['primaryEmail'];
                var userJSON = {"name": fullname, "id": id, "orgUnitPath": orgUnitPath, "email": email};
                addUserToOUByPath(data, orgUnitPath, userJSON);
            }
        }
    }
    
    // if there's input for filering, get users match both orgUnit filters and group filters
    else if((groupInput.length > 0 || orgUnitInput.length > 0)){
        var userIds = new Set();
        // for each orgUnit id, get users of the orgUnit
        for(var user of allUsers){
            if(orgUnitInput.includes(user.orgUnitPath))
                userIds.add(user.id);
        }
        // for each group id, get members of the group
        await Promise.all(groupInput.map(async (group) => {
            var response = await fetch('https://www.googleapis.com/admin/directory/v1/groups/' + group + '/members', {
                    headers: {
                        'authorization': `Bearer ` + token,
                    }
                });
            var json = await response.json();
            var members = json.members;
            if(members){
                for(var member of members){
                    if(member.type === 'USER'){
                        userIds.add(member.id);
                    }          
                }
            }
        }));
        // for each user id, find and add the user
        userIds = Array.from(userIds);
        var numElement = document.getElementById('num-filter-users');
        numElement.innerText = userIds.length;
        for(var user of allUsers){
            if(userIds.includes(user.id)){
                addUserToOUByPath(data, user["orgUnitPath"], user);
            }
        }
    }

    // if there's no search and no filter
    else{
        var numSearchElement = document.getElementById('num-search-users');
        numSearchElement.innerText = 0;
        var numFilterElement = document.getElementById('num-filter-users');
        numFilterElement.innerText = 0;
        for(var user of allUsers){
            addUserToOUByPath(data, user["orgUnitPath"], user);
        }    
    }

    incrementUserCount(data);
    visualize(null);
    isLoading = false; 
    setLoadingOverlay();
}

/** add user to the OU it's in by DFS */
function addUserToOUByPath(node, path, user){
    if(node.data['path'] === path){
        node.data['users'].push(user);
        return;
    }
    else{
        if(node['children'] === undefined)
            return;
        var children = node['children'];
        for(var ou of children){
            if(path.includes(ou.data['path'])){
                addUserToOUByPath(ou, path, user);
            }
        }
    }
}

/** change numUsers of each OU to the number of users in the OU, 
    numUsers is 1 more than the actual number of users to prevent empty orgUnits display issue */
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

/** Visualization */
function visualize(order) {
    function name(d) {
        return d.ancestors().reverse().map(d => d.data.name).join("/");
    }
    width = 650;
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
        .attr("width", "100%")
        .attr("height", "100%")
        .style("font", "12px Courier monospace");

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
            .text(d => `${name(d)}`);

        var rect = node.append("rect")
            .attr("id", function(d) { return d.data.id; })
            .attr("fill", d => d === root ? "#fff" : d.children ? "#99bbff" : "#ccddff") //#99bbff is darker blue, #ccddff is lighter blue
            .attr("stroke", "#fff")

        node.append("clipPath")
            .attr("id", function(d) { return "clip-" + d.data.id; })
            .append("use")
            .attr("xlink:href", function(d) { return "#" + d.data.id; });

        /** hovering card for org unit */ 
        var orgUnitHover = d3.select("body")
            .append("a")
            .classed("card", true)
            .style("position", "absolute")
            .style("z-index", "10")
            .style("visibility", "hidden")
            .on("mouseover", function() {
                return orgUnitHover.style("visibility", "visible");
            })
            .on("mouseout", function(d) { 
                return orgUnitHover.style("visibility", "hidden");
            })

        var orgUnitCardbody = orgUnitHover
            .append("div")
            .classed("card-body", true)

        var addUserButton = orgUnitCardbody
            .append("div")
            .attr("type", "button")
            .classed("card-right", true)
            .attr("class", "icon")
            .append("i")
            .attr("class", "icon fa fa-user-plus")
            .attr("aria-hidden", "true")

        var orgUnitName = orgUnitCardbody
            .append("h5")
            .classed("card-title", true)

        node.append("text")
            // hover event for org unit name
            .on("mouseover", function(d){
                var pageY = event.pageY;
                var pageX = event.pageX;
                orgUnitName.text(d.data.name);
                addUserButton.attr("id", d.data.path);
                addUserButton.attr("onclick", function(){  return  "event.stopPropagation(); triggerAdd(event)"})
                orgUnitHover.style("top", (pageY-8)+"px").style("left",(pageX)+"px")
                orgUnitHover.style("visibility", "visible");
            })
            .on("mouseout", function(d) { 
                return orgUnitHover.style("visibility", "hidden");
            })

            .attr("clip-path", d => d.clipUid)
            .attr("font-weight", d => d === root ? "bold" : null)
            .selectAll("tspan")
            .data(d => (d === root ? name(d) : d.data.name).split(/(?=[])/g))
            .join("tspan")
            .attr("x", 10)
            .attr("y", (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`)
            .attr("fill-opacity", (d, i, nodes) => i === nodes.length - 1 ? 0.7 : null)
            .attr("font-weight", (d, i, nodes) => i === nodes.length - 1 ? "600" : null)
            .text(d => d)           
        
        var nodeSelect = node.append("foreignObject")
            .attr("x", 8)
            .attr("y", 20)
            .append("xhtml:body-user")
            .append("div")
            .attr("class", "list-container")
            .append("ul")
            .attr("style", (d => (d === root ? "max-height: 60px; overflow: auto" : "max-height: " + (y(d.y1) - y(d.y0) - 50)) + "; overflow: auto"))

        // add users with links to each node
        var nodeselect = nodeSelect.selectAll("li")
            .data(function(d){
                var users = d.data.users;
                if(order === "firstname"){
                    users.sort(function(a, b) {
                        return a.name.toLowerCase() == b.name.toLowerCase() ? 0 : (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1);
                    });
                }
                else if(order === "lastname"){
                    users.sort(function(a, b) {
                        var lastname1 = a.name.toLowerCase().split(" ")[1];
                        var lastname2 = b.name.toLowerCase().split(" ")[1];
                        return lastname1 == lastname2
                            ? 0
                            : (lastname1 > lastname2 ? 1 : -1);
                    });
                }
                var userlist = []
                for(var user of users){
                    var userInfo = {"name": user.name, "id": user.id, "email": user.email }
                    userlist.push(userInfo);
                }
                return userlist;
            })
            .enter()
            .append("li")

        // hovering card for user 
        var tooltip = d3.select("body")
            .append("a")
            .classed("card", true)
            .style("position", "absolute")
            .style("z-index", "10")
            .style("visibility", "hidden")
            .on("mouseover", function() {
                return tooltip.style("visibility", "visible");
            })
            .on("mouseout", function(d) { 
                return tooltip.style("visibility", "hidden");
            })

        var cardbody = tooltip
            .append("div")
            .classed("card-body", true)

        var renameUserButton = cardbody
            .append("div")
            .attr("type", "button")
            .attr("class", "icon")
            .classed("card-right", true)
            .attr("data-toggle", "modal")
            .attr("data-target", "#renameModal")
            .append("i")
            .attr("class", "icon fa fa-edit")
            .attr("aria-hidden", "true")

        var deleteUserButton = cardbody
            .append("div")
            .attr("type", "button")
            .attr("class", "icon")
            .classed("card-right", true)
            .attr("onclick", function(){  return  "event.stopPropagation(); triggerDelete(event)"})
            .append("i")
            .attr("class", "icon fa fa-trash")
            .attr("aria-hidden", "true")

        var tooltipName = cardbody
            .append("h5")
            .classed("card-title", true)

        var tooltipEmail = cardbody
            .append("p")
            .classed("card-text", true)

        var tooltipLink = cardbody
            .append("a")
            .classed("card-link", true)
            .text("Click to view more")

        nodeselect
            .append("a")
            .attr("href", "#")
            .attr("class", "userdetail")
            // hover event for user
            .on("mouseover", function(d){
                var pageY = event.pageY;
                var pageX = event.pageX;
                tooltipName.text(d.name)
                tooltipEmail.text(d.email);
                deleteUserButton.attr("id", d.id);
                tooltipLink.attr("href", "userdetails.html?user=" + d.id);
                tooltip.style("top", (pageY-8)+"px").style("left",(pageX)+"px")
                tooltip.style("visibility", "visible");
            })
            .on("mouseout", function(d) { 
                return tooltip.style("visibility", "hidden");
            })
            .text(function(d){ return d.name })
            
        // Change links to include user id 
        nodeSelect.selectAll("a.userdetail")
            .attr("href", (d => "userdetails.html?user=" + d.id))

        group.call(position, root);
    }

    function position(group, root) {
        group.selectAll("g")
            .attr("transform", d => d === root ? `translate(0,-100)` : `translate(${x(d.x0)},${y(d.y0)})`)
        .select("rect")
            .attr("width", d => d === root ? width : x(d.x1) - x(d.x0))
            .attr("height", d => d === root ? 100 : y(d.y1) - y(d.y0));

        group.selectAll("foreignObject")
            .attr("width", function(d){return ( x(d.x1) - x(d.x0) - 10)})
            .attr("height", (d => (d === root ? 60 : y(d.y1) - y(d.y0) - 20)));
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

    /** populate rename modal with selected user */
    $('#renameModal').on('show.bs.modal', function (event) {
        var email =  $(event.relatedTarget).siblings(".card-text")[0].textContent;
        var name =  $(event.relatedTarget).siblings(".card-title")[0].textContent;
        var link = $(event.relatedTarget).siblings(".card-link")[0].href;
        var id = link.split("=")[1];
        userid = id;

        var firstnameInput = document.getElementById("edit-firstname");
        firstnameInput.value = name.split(" ")[0];
        var lastnameInput = document.getElementById("edit-lastname");
        lastnameInput.value = name.split(" ")[1];
        var emailInput = document.getElementById("edit-email");
        emailInput.value = email.substring(0, email.indexOf("@"));
        var emailDomainElement = document.getElementById("email-domain");
        emailDomainElement.innerText = "@"+domain;
    });

    return svg.node();
}

/** rename a user with input */
async function renameUser(){
    var firstname = document.getElementById("edit-firstname").value;
    var lastname = document.getElementById("edit-lastname").value;
    var email = document.getElementById("edit-email").value + "@" + domain;
    var updatedInfo = {
        "primaryEmail": email,
        "name": {
        "givenName": firstname,
        "familyName": lastname
        }
    }
    var response = await fetch('https://www.googleapis.com/admin/directory/v1/users/' + userid,{
        method: 'PUT',
        headers: {
            'authorization': `Bearer ` + token,
            'dataType': 'application/json'
        },
        body: JSON.stringify(updatedInfo),
    })
    location.reload();
}

/** trigger delete modal in user.html */
function triggerDelete(e){
    var userid = e.target.id;
    $('#deleteModal').modal('show');
    var deleteElement = document.getElementById("deleteButton");
    deleteElement.addEventListener("click", async function(){
        var response = await fetch('https://www.googleapis.com/admin/directory/v1/users/' + userid,{
            method: 'DELETE',
            headers: {
                'authorization': `Bearer ` + token,
            }
        });
        console.log(response);
        location.reload();
    })
}

/** trigger warning if password is too short */
function shortPassword(){
    var password = document.getElementById("add-password").value;
    var passwordWarning = document.getElementById("password-warning");
    if(password.length < 8){
        console.log("password too short");    
        passwordWarning.style.display = "block";
    }
    else{
        passwordWarning.style.display = "none";
    }
}

/** trigger add modal in user.html */
function triggerAdd(e){
    var selectedPath = e.target.id;
    var emailDomainElement = document.getElementById("add-email-domain");
    emailDomainElement.innerText = "@"+domain;
    document.getElementById("add-firstname").value = "";
    document.getElementById("add-lastname").value = "";
    document.getElementById("add-email").value = "";
    document.getElementById("add-password").value = "";
    $('#addModal').modal('show');
    var addElement = document.getElementById("addButton");
    addElement.addEventListener("click", async function(){ 
        var firstname = document.getElementById("add-firstname").value;
        var lastname = document.getElementById("add-lastname").value;
        var email = document.getElementById("add-email").value + "@" + domain;
        var password = document.getElementById("add-password").value;
        var emptyWarning = document.getElementById("empty-warning");
        var passwordWarning = document.getElementById("password-warning");
        if(firstname === "" || lastname === "" || email === "@" + domain || password === ""){
            console.log("empty field");
            emptyWarning.style.display = "inline";
            return;
        }
        else if(password.length < 8)
            return;
        emptyWarning.style.display = "none";
        passwordWarning.style.display = "none";
        var userInfo = {
            "primaryEmail": email,
            "name": {
                "givenName": firstname,
                "familyName": lastname,
                "fullName": firstname + ' ' + lastname,
            },
            "password": password,
            "orgUnitPath": selectedPath
        }
        console.log(userInfo);
        var response = await fetch('https://www.googleapis.com/admin/directory/v1/users',{
            method: 'POST',
            headers: {
                'authorization': `Bearer ` + token,
                'dataType': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userInfo),
        }) 
        console.log(response);
        if(response.status === 200){
            $('#addModal').modal('hide');
            window.alert("Add user successfully");
        }
        else{
            window.alert("Some errors");
        }
        location.reload();
    })
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

/** sidebar functionality, including getting domain name, searchbar, filter */
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
        checkLoginAndSetUp();
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
    // add root OU
    for(var orgUnit of orgUnits){
        if(orgUnit['parentOrgUnitPath'] === "/"){
            rootID = orgUnit['parentOrgUnitId'];
            var rootresponse = await fetch('https://www.googleapis.com/admin/directory/v1/customer/my_customer/orgunits/' + rootID, {
            headers: {
                'authorization': `Bearer ` + token,
            }
            });
            break;
        }
    }
    var rootobject = await rootresponse.json();
    var rootname = rootobject.name;
    var newdiv = document.createElement("div");
    newdiv.innerHTML = "<div class='checkboxes'><input type='checkbox' class='form-check-input' id='" + rootID + "' value='" + "/" + "'><label class='form-check-label' for='" + "/" + "'> " + rootname + "</label></div>"
    orgUnitOptions.push("<div class='checkboxes'><input type='checkbox' class='form-check-input' id='" + rootID + "' value='" + "/" + "'><label class='form-check-label' for='" + "/" + "'> " + rootname + "</label></div>");
    for(var orgUnit of orgUnits) {
        orgUnitOptions.push("<div class='checkboxes'><input type='checkbox' class='form-check-input' id='" + orgUnit.orgUnitId + "' value='" + orgUnit.orgUnitPath + "'><label class='form-check-label' for='" + orgUnit.orgUnitPath + "'> " + orgUnit.name + "</label></div>");
    }
    document.getElementById("orgunit-sel").innerHTML = orgUnitOptions.join('');
    var checkboxElems = document.querySelectorAll("#orgunit-sel input[type='checkbox']");
    for(var checkbox of checkboxElems) {
        checkbox.addEventListener("click", function(e) {
            updateOrgUnitInput(e.target);
        });
    }

    // filter by group(s)
    var response = await fetch('https://www.googleapis.com/admin/directory/v1/groups?domain=' + domain + '&customer=my_customer', {
        headers: {
            'authorization': `Bearer ` + token,
        }
    });
    var json = await response.json();
    var groups = json.groups;
    console.log(groups);
    var groupOptions = [];
    for(var group of groups) {
        groupOptions.push("<div class='checkboxes'><input type='checkbox' class='form-check-input' id='" + group.id + "' value='" + group.id + "'><label class='form-check-label' for='" + group.id + "'> " + group.name + "</label></div>");
    }
    document.getElementById("group-sel").innerHTML = groupOptions.join('');
    var checkboxElems = document.querySelectorAll("#group-sel input[type='checkbox']");
    for(var checkbox of checkboxElems) {
        checkbox.addEventListener("click", function(e) {
            updateGroupInput(e.target);
        });
    }
}

/** search filter-checkboxes */
function searchFilter(){
    console.log("searchfilter");
    searchCheckboxInput = document.getElementById("search-checkbox-input").value.toLowerCase();
    var checkboxes = document.getElementsByClassName("checkboxes");
    for(var checkbox of checkboxes){
        var checkboxName = checkbox.getElementsByTagName("label")[0].innerText;
        if(checkboxName.toLowerCase().indexOf(searchCheckboxInput) > -1){
            checkbox.style.display = "";
        }
        else{
            checkbox.style.display = "none";
        }
    }
}

/** clear search inputs */
function clearSearch(){
    searchInput = "";
    var searchField = document.getElementById("user-search-input");
    searchField.value = "";
    var numSearchElement = document.getElementById('num-search-users');
    numSearchElement.innerText = 0;
}

/** update variable orgUnitInput based on checkbox */
function updateOrgUnitInput(input){
    if(input.checked){
        orgUnitInput.push(input.value);
    }
    else{
        var index = orgUnitInput.indexOf(input.value);
        if(index > -1){
            orgUnitInput.splice(index, 1);
        }
    }
    clearSearch();
    checkLoginAndSetUp();
    fetchOUs();
    return orgUnitInput;
}

/** update variable groupInput based on checkbox */
function updateGroupInput(input) {
    if(input.checked){
        groupInput.push(input.id);
    }
    else{
        var index = groupInput.indexOf(input.id);
        if(index > -1){
            groupInput.splice(index, 1);
        }
    }
    clearSearch();
    checkLoginAndSetUp();
    fetchOUs();
    return groupInput;
}

/** clear all filters, by default display all users */
function clearFilters(){ 
    orgUnitInput = []; 
    groupInput = [];
    $(':checkbox:enabled').prop('checked', false);
    var numFilterElement = document.getElementById('num-filter-users');
    numFilterElement.innerText = 0;
    checkLoginAndSetUp();
    fetchOUs();
}

/** check all filters for org units*/
function checkAllOUFilters(){
    var ouchecks = document.getElementById("orgunit-sel").getElementsByTagName("input");
    orgUnitInput = []; 
    for(var oucheck of ouchecks){
        oucheck.checked = true;
        orgUnitInput.push(oucheck.value);
    }  
    clearSearch();
    checkLoginAndSetUp();
    fetchOUs();
}

/** check all filters for groups */
function checkAllGroupFilters(){
    var groupchecks = document.getElementById("group-sel").getElementsByTagName("input");
    groupInput = []; 
    for(var groupcheck of groupchecks){
        groupcheck.checked = true;
        groupInput.push(groupcheck.value);
    }  
    clearSearch();
    checkLoginAndSetUp();
    fetchOUs();
}

/** order users alphabetically */
function orderBy(){
    var order = document.getElementById("order-by-sel").value;
    chartElement = document.getElementById("user-chart");
    chartElement.innerHTML = "";
    visualize(order);
}
/** End of sidebar functionality */