var flatdata = [] // flatdata to contain all orgUnits, will be converted to hierarchical data 
var data = {} // data to contail all orgUnits and users 
var allUsers; 
var searchInput; // input for searchbar
var orgUnitInput = []; // input for filter by orgUnit
var groupInput = []; // input for filter by group
var oulength = 0; // length of all ous
var rootID;
var isLoading;

// the function called onload for user.html
function userOnload(){
    loginStatus(); 
    loadInstruction();
    sidebar();
    fetchOUs();
}

function loadInstruction(){
    var collapse = document.getElementsByClassName("collapse")[0];
    var icon = document.getElementsByClassName("card-header")[0].getElementsByClassName("fa")[0];
    if(collapse.classList.contains("show")){
        icon.classList.remove("fa-plus");
        icon.classList.add("fa-minus");
    }
    else{
        icon.classList.remove("fa-minus");
        icon.classList.add("fa-plus");
    }
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
        oulength = ous.length;
        addOrgUnitsToData(ous);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

async function fetchUsers(){
    var response = await fetch('https://www.googleapis.com/admin/directory/v1/users?domain=' + domain, {
        headers: {
            'authorization': `Bearer ` + token,
        }
    });
    var userJSON = await response.json();
    var users = userJSON['users'];
    allUsers = [];
    for(var i = 0; i < users.length; i++){
        let user = users[i];
        var fullname = user['name']['fullName'];
        var id = user['id'];
        var orgUnitPath = user['orgUnitPath'];
        var userJSON = {"name": fullname, "id": id, "orgUnitPath": orgUnitPath};
        allUsers.push(userJSON);
    }
    return allUsers;
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
            rootID = ous[i]['parentOrgUnitId'];
            fetch('https://www.googleapis.com/admin/directory/v1/customer/my_customer/orgunits/' + rootID, {
            headers: {
                'authorization': `Bearer ` + token,
            }
            }).
            then(response => response.json())
                .then((root) => {
                    var rootElement = {"name": root["name"], "path": root["orgUnitPath"], "parentPath": null, "users": []};
                    rootOUName = root["name"];
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
    isLoading = true; 
    setLoadingOverlay();
    var allUsers = await fetchUsers();
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
        numElement.innerText = json.users ? json.users.length : 0;
        var users = json.users;
        if(json.users){
            for(var i = 0; i < users.length; i++){
                let user = users[i];
                var fullname = user['name']['fullName'];
                var id = user['id'];
                var orgUnitPath = user['orgUnitPath'];
                var userJSON = {"name": fullname, "id": id, "orgUnitPath": orgUnitPath};
                addUserToOUByPath(data, orgUnitPath, userJSON);
            }
        }
        
        incrementUserCount(data);
        visualize(null);
    }
    // if there's input for filering, get users match both orgUnit filters and group filters
    else if((groupInput.length > 0 || orgUnitInput.length > 0)){
        var userIds = new Set();
        // for each orgUnit id, get users of the orgUnit
        for(var i = 0; i < allUsers.length; i++){
            let user = allUsers[i];
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
                for(var i = 0; i < members.length; i++){
                    if(members[i].type === 'USER'){
                        userIds.add(members[i].id);
                    }          
                }
            }
            
        }));
        // for each user id, find and add the user
        userIds = Array.from(userIds);
        var numElement = document.getElementById('num-filter-users');
        numElement.innerText = userIds.length;
        for(var i = 0; i < allUsers.length; i++){
            var user = allUsers[i];
            if(userIds.includes(user.id)){
                addUserToOUByPath(data, user["orgUnitPath"], user);
            }
        }
        incrementUserCount(data);
        visualize(null);
    }
    // if there's no search and no filter
    else{
        var numSearchElement = document.getElementById('num-search-users');
        numSearchElement.innerText = 0;
        var numFilterElement = document.getElementById('num-filter-users');
        numFilterElement.innerText = 0;
        for(var i = 0; i < allUsers.length; i++){
            var user = allUsers[i];
            addUserToOUByPath(data, user["orgUnitPath"], user);
        }
        incrementUserCount(data);
        visualize(null);
    }
    isLoading = false; 
    setLoadingOverlay();
}

// add user to the OU it's in by DFS 
function addUserToOUByPath(node, path, user){
    if(node.data['path'] === path){
        node.data['users'].push(user);
        return;
    }
    else{
        if(node['children'] === undefined)
            return;
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
function visualize(order) {
    console.log(data);
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
            .text(d => `${name(d)}\n${format(d.numUsers)}`);

        var rect = node.append("rect")
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
            .attr("x", 10)
            .attr("y", (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`)
            .attr("fill-opacity", (d, i, nodes) => i === nodes.length - 1 ? 0.7 : null)
            .attr("font-weight", (d, i, nodes) => i === nodes.length - 1 ? "600" : null)
            .text(d => d);
        
        var nodeSelect = node.append("foreignObject")
            .attr("x", 8)
            .attr("y", 20)
            .append("xhtml:body-user")
            .append("div")
            .attr("class", "list-container")
            .append("ul")
            .attr("style", (d => (d === root ? "max-height: 60px; overflow: auto" : "max-height: " + (y(d.y1) - y(d.y0) - 50)) + "; overflow: auto"))
        
        // icon to add users
        var addNode = nodeSelect.insert("div", ".list-container")
            .attr("type", "button")
            .attr("class", "iconadd")
            
            .append("i")
            .attr("id", function(d){ return d.data.path })
            .attr("class", "fa fa-user-plus")
            .attr("onclick", function(){  return  "event.stopPropagation(); triggerAdd(event)"})
            .attr("aria-hidden", "true")

        // add users with links to each node
        var nodeselect = nodeSelect.selectAll("li")
            .data(function(d){
                var users = d.data.users;
                if(order === "firstname"){
                    users.sort(function(a, b) {
                        return a.name.toLowerCase() == b.name.toLowerCase()
                            ? 0
                            : (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1);
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
                for(var i = 0; i < users.length; i++){
                    var userInfo = {"name": users[i].name, "id": users[i].id }
                    userlist.push(userInfo);
                }
                return userlist;
            })
            .enter()
            .append("li")

        nodeselect
            .append("a")
            .attr("href", "#")
            .attr("class", "userdetail")
            .text(function(d){ return d.name })
        
        nodeselect
            .append("div")
            .attr("type", "button")
            .attr("class", "icon")
            .attr("onclick", function(){  return  "event.stopPropagation(); triggerDelete(event)"})
            .append("i")
            .attr("id", function(d){ return d.id })
            .attr("class", "icon fa fa-trash")
            .attr("aria-hidden", "true")
            

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

        group.selectAll("foreignObject")
            .attr("width", function(d){return ( x(d.x1) - x(d.x0) - 10)})
            .attr("height", (d => (d === root ? 60 : y(d.y1) - y(d.y0) - 20)));
    }

    // When zooming in, draw the new nodes on top, and fade them in.
    function zoomin(d) {
        const group0 = group.attr("pointer-events", "none");
        const group1 = group = svg.append("g").call(render, d);

        console.log(x.domain, y.domain);
       
        x.domain([d.x0, d.x1]);
        y.domain([d.y0, d.y1]);
        console.log("zoom in ", d.x0, d.x1, x.domain, y.domian);

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

        console.log(x.domain, y.domain);
        x.domain([d.parent.x0, d.parent.x1]);
        y.domain([d.parent.y0, d.parent.y1]);
        console.log("zoom out", d.x0, d.x1, x.domain, y.domain);
        console.log("zoom out", d.parent.x0, d.parent.x1);

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

// trigger delete modal in user.html
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

// trigger warning if password is too short
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

// trigger add modal in user.html
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
        loginStatus();
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
    for(var i = 0; i < orgUnits.length; i++){
        if(orgUnits[i]['parentOrgUnitPath'] === "/"){
            rootID = orgUnits[i]['parentOrgUnitId'];
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
    for (var i = 0; i < orgUnits.length; i++) {
        orgUnitOptions.push("<div class='checkboxes'><input type='checkbox' class='form-check-input' id='" + orgUnits[i].orgUnitId + "' value='" + orgUnits[i].orgUnitPath + "'><label class='form-check-label' for='" + orgUnits[i].orgUnitPath + "'> " + orgUnits[i].name + "</label></div>");
    }
    document.getElementById("orgunit-sel").innerHTML = orgUnitOptions.join('');
    var checkboxElems = document.querySelectorAll("#orgunit-sel input[type='checkbox']");
    for (var i = 0; i < checkboxElems.length; i++) {
        var checkbox = checkboxElems[i];
        checkboxElems[i].addEventListener("click", function(e) {
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
    for (var i = 0; i < groups.length; i++) {
        groupOptions.push("<div class='checkboxes'><input type='checkbox' class='form-check-input' id='" + groups[i].id + "' value='" + groups[i].id + "'><label class='form-check-label' for='" + groups[i].id + "'> " + groups[i].name + "</label></div>");
    }
    document.getElementById("group-sel").innerHTML = groupOptions.join('');
    var checkboxElems = document.querySelectorAll("#group-sel input[type='checkbox']");
    for (var i = 0; i < checkboxElems.length; i++) {
        checkboxElems[i].addEventListener("click", function(e) {
            updateGroupInput(e.target);
        });
    }
}

// search filter-checkboxes
function searchFilter(){
    console.log("searchfilter");
    searchCheckboxInput = document.getElementById("search-checkbox-input").value.toLowerCase();
    var checkboxes = document.getElementsByClassName("checkboxes");
    for(var k = 0; k < checkboxes.length; k++){
        var checkbox = checkboxes[k];
        var checkboxName = checkbox.getElementsByTagName("label")[0].innerText;
        if(checkboxName.toLowerCase().indexOf(searchCheckboxInput) > -1){
            console.log("find", checkboxName);
            checkbox.style.display = "";
        }
        else{
            checkbox.style.display = "none";
        }
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

$(document).ready(function(){
    // Add minus icon for collapse element which is open by default
    $(".collapse.show").each(function(){
        $(this).prev().prev(".section-right").find(".fa").addClass("fa-minus").removeClass("fa-plus");
    });
    
    // Toggle plus minus icon on show hide of collapse element
    $(".collapse").on('show.bs.collapse', function(){
        $(this).prev().prev(".section-right").find(".fa").removeClass("fa-plus").addClass("fa-minus");
    }).on('hide.bs.collapse', function(){
        $(this).prev().prev(".section-right").find(".fa").removeClass("fa-minus").addClass("fa-plus");
    });
});

// update variable orgUnitInput based on checkbox
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
    loginStatus();
    fetchOUs();
    return orgUnitInput;
}

// update variable groupInput based on checkbox
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
    loginStatus();
    fetchOUs();
    return groupInput;
}

// clear all filters, display all users
function clearFilters(){ 
    orgUnitInput = []; 
    groupInput = [];
    $(':checkbox:enabled').prop('checked', false);
    var numFilterElement = document.getElementById('num-filter-users');
    numFilterElement.innerText = 0;
    loginStatus();
    fetchOUs();
}

function checkAllOUFilters(){
    var ouchecks = document.getElementById("orgunit-sel").getElementsByTagName("input");
    orgUnitInput = []; 
    for(var i = 0; i < ouchecks.length; i++){
        ouchecks[i].checked = true;
        orgUnitInput.push(ouchecks[i].value);
    }  
    clearSearch();
    loginStatus();
    fetchOUs();
}

function checkAllGroupFilters(){
    var groupchecks = document.getElementById("group-sel").getElementsByTagName("input");
    groupInput = []; 
    for(var i = 0; i < groupchecks.length; i++){
        groupchecks[i].checked = true;
        groupInput.push(groupchecks[i].value);
    }  
    clearSearch();
    loginStatus();
    fetchOUs();
}

function orderBy(){
    var order = document.getElementById("order-by-sel").value;
    chartElement = document.getElementById("user-chart");
    chartElement.innerHTML = "";
    visualize(order);
}
/** End of sidebar functionality */


/** User details page */
// user detail onload
async function userdetailOnload(){
    loginStatus(); 
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    var userid = urlParams.get('user');
    console.log(userid);
    var response = await fetch("https://www.googleapis.com/admin/directory/v1/users/" + userid, {
    headers: {
        'authorization': `Bearer ` + token,
    }
    });
    var user = await response.json();
    var relations = user.relations ? user.relations : null;
    var manager;
    if(relations){
        for(var i = 0; i < relations.length; i++){
            if(relations[i].type === "manager"){
                manager = relations[i].value;
            }
        }
    }
    var managerElement = document.getElementById("manager");
    managerElement.innerText = manager ? manager : "No manager";

    var userNameElement = document.getElementById("user-name");
    userNameElement.innerText = user.name.fullName;
    var userEmailElement = document.getElementById("user-email");
    userEmailElement.innerText = user.primaryEmail;
    var userOrgUnitElement = document.getElementById("user-orgUnit");
    userOrgUnitElement.innerText = user.orgUnitPath;
    var userName2Element = document.getElementsByClassName("username");

    // set rename user modal default values
    var firstnameInput = document.getElementById("edit-firstname");
    firstnameInput.value = user.name.givenName;
    var lastnameInput = document.getElementById("edit-lastname");
    lastnameInput.value = user.name.familyName;
    var emailInput = document.getElementById("edit-email");
    emailInput.value = user.primaryEmail.substring(0, user.primaryEmail.indexOf("@"));
    var emailDomainElement = document.getElementById("email-domain");
    emailDomainElement.innerText = "@"+domain;

    for (var i = 0; i < userName2Element.length; i++){
        each = userName2Element[i];
        console.log(each);
        each.innerText = user.name.fullName;
    }
    var src = await getPhoto(user.id);
    var imageElement = document.getElementById("profile");
    imageElement.src = src;
    getSingleBranchOfOU(user);
}

async function getPhoto(userid){
    try{
        var response = await fetch("https://www.googleapis.com/admin/directory/v1/users/" + userid + "/photos/thumbnail", {
            headers: {
                'authorization': `Bearer ` + token,
            }
        });
        if(response.status === 404){
            Promise.reject('The user hasnt uploaded profile image.');
            return '../images/default-profile.jpeg';
        }
    }
    catch(err){
        console.log(error);
        
    }
    var json = await response.json();
    var image = json.photoData;
    return "data:" + json.mimeType + ";base64," + image.replace(/_/g, '/').replace(/-/g,'+');
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
        width = 800 - margin.left - margin.right,
        height = 560 - margin.top - margin.bottom;

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
        return "M" + d.x + "," + d.y
            + "C" + (d.x + d.parent.x) / 2.2 + "," + d.y
            + " " + (d.x + d.parent.x) / 2.2 + "," + d.parent.y
            + " " + d.parent.x + "," + d.parent.y;
        });

    // adds each node as a group
    var node = g.selectAll(".node")
        .data(nodes.descendants())
    .enter().append("g")
        .attr("class", function(d) { 
        return "node" + 
            (d.children ? " node--internal" : " node--leaf"); })
        .attr("transform", function(d) { 
        return "translate(" + d.x + "," + d.y + ")"; });

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

async function renameUser(){
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    var userid = urlParams.get('user');
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
            'dataType': 'application/json',
        },
        body: JSON.stringify(updatedInfo),
    })
    console.log(response);
    location.reload();
}

async function deleteUser(){
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    var userid = urlParams.get('user');
    var response = await fetch('https://www.googleapis.com/admin/directory/v1/users/' + userid,{
        method: 'DELETE',
        headers: {
            'authorization': `Bearer ` + token,
        }
    });
    console.log(response);
    window.location.replace("user.html");
}
/** End of user details page */


