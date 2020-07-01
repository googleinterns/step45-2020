var params = JSON.parse(localStorage.getItem('oauth2-test-params'));
var token = params['access_token'];
var data = {}

function postAllOUs(){
    fetch('https://www.googleapis.com/admin/directory/v1/customer/my_customer/orgunits?type=all', {
    headers: {
        'authorization': `Bearer ` + token,
    }
    }).
    then(response => response.json())
    .then((ousjson) => {
        var ous = ousjson['organizationUnits'];
        postRootOU(ous);
        postChildOUs(ous);
        var parentPaths = new Set();
        for(var i = 0; i < ous.length; i++){
            parentPaths.add(ous[i]['parentOrgUnitPath']);
        }
        console.log(parentPaths);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

function postChildOUs(ous){
    var oulist = [];
    for(var i = 0; i < ous.length; i++){
        console.log(i);
        var ou = ous[i];
        var len = ou["orgUnitPath"].split("/").length;
        ou["depth"] = len;
        oulist.push(ou);
    }
    for(var i = 0; i < oulist.length; i++){
        postEachOU(oulist[i]);
    }
}

function postEachOU(ou){
    fetch("/user-storechildou", {
            method: 'POST',
                    body: JSON.stringify({
                        name: ou["name"],
                        path: ou["orgUnitPath"],
                        parentPath: ou["parentOrgUnitPath"],
                        depth: ou["depth"]
                    }),
                    headers: {
                        'Content-type': 'application/json; charset-UTF-8'
                    }
        }).
        then(response => response.json())
        .then((res) => {
            console.log(res);
        })  
        .catch((error) => {
            console.error('post ou Error:', error);
        });
}

function postRootOU(ous) {
    for(var i = 0; i < ous.length; i++){
        if(ous[i]['parentOrgUnitPath'] === "/"){
            var rootID = ous[i]['parentOrgUnitId'];
            console.log(rootID);
            fetch('https://www.googleapis.com/admin/directory/v1/customer/my_customer/orgunits/' + rootID, {
            headers: {
                'authorization': `Bearer ` + token,
            }
            }).
            then(response => response.json())
                .then((root) => {
                    console.log(root);
                    fetch("/user-storerootou", {
                        method: 'POST',
                        body: JSON.stringify({
                            name: root["name"],
                            path: root["orgUnitPath"],
                            parentPath: "root"
                        }),
                        headers: {
                            'Content-type': 'application/json; charset-UTF-8'
                        }
                    }).
                    then(response => response.json())
                        .then((res) => {
                            console.log(res);    
                        })  
                })
            .catch((error) => {
                console.error('Root Error:', error);
            });
            break;
        }
    }
}

async function getOUs(){
    fetch("/get-ous").then(response => response.json())
    .then((ous) => {
        data = ous;
        console.log(data);
        // fetch users
        getAllUsers();
        //visualize();
    })
    .catch((error) => {
        console.error(error);
    })
}

function getAllUsers(){
    console.log(token);
    fetch('https://www.googleapis.com/admin/directory/v1/users?domain=groot-test.1bot2.info', {
        headers: {
            'authorization': `Bearer ` + token,
        }
        }).
        then(response => response.json())
        .then((userJSON) => {
            let users = userJSON['users'];
            for(var i = 0; i < users.length; i++){
                let user = users[i];
                var fullname = user['name']['fullName'];
                var id = user['id'];
                var orgUnitPath = user['orgUnitPath'];
                var userJSON = {"name": fullname, "id": id, "orgUnitPath": orgUnitPath};
                addUsertoOUByPath(data, orgUnitPath, userJSON);
            }
            incrementUserCount(data);
            visualize();
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

// add user to the OU it's in by DFS 
function addUsertoOUByPath(node, path, user){
    if(node['path'] === path){
        node['users'].push(user);
        return;
    }
    else{
        var children = node['children'];
        for(var i = 0; i < children.length; i++){
            ou = children[i];
            if(path.includes(ou['path'])){
                addUsertoOUByPath(ou, path, user);
            }
        }
    }
}

// change value of each OU to the number of users in the OU
function incrementUserCount (node){
    var value = node['users'].length;
    node['value'] = value;
    var children = node['children'];
    if(children !== undefined){
        for(var i = 0; i < children.length; i++){
            incrementUserCount(children[i]);
        }
    }
}

// Visualization
function visualize() {
    console.log(data)
    function name(d) {
        return d.ancestors().reverse().map(d => d.data.name).join("/");
    }
    width = 600;
    height = 400;
    format = d3.format(",d");
    
    var treemap = data => d3.treemap()
        .tile(tile)
        (d3.hierarchy(data)
            .sum(d => d.value)
            .sort((a, b) => b.value - a.value));

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
            .text(d => `${name(d)}\n${format(d.value)}`);

        node.append("rect")
            .attr("id", function(d) { return d.data.id; })
            .attr("fill", d => d === root ? "#fff" : d.children ? "#ccc" : "#ddd")
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
            .attr("x", 10)
            .attr("y", 30)
            .append("xhtml:body")
            .append("div")
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
                console.log(userlist);
                return userlist
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
                console.log(userlist);
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
        var userName2tElement = document.getElementById("username");
        userName2tElement.innerText = user.name.fullName;
        getGroups(user.id, user.name.fullName);
    })
    .catch((error) => {
        console.error(error);
    });

}

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
        
        var userGroupsElement = document.getElementById("user-groups");
        console.log(userGroups);
        visualizeUserGroups(userGroups);
    })
    .catch((error) => {
        console.error(error);
    });
}

// ************** Generate the tree diagram	 *****************
function visualizeUserGroups(userGroups){
    // convert the flat data into a hierarchy 
    var treeData = d3.stratify()
    .id(function(d) { return d.name; })
    .parentId(function(d) { return d.parent; })
    (userGroups);

    // assign the name to each node
    treeData.each(function(d) {
        d.name = d.id;
    });

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
    var svg = d3.select("#user-groups").append("svg")
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