var params = JSON.parse(localStorage.getItem('oauth2-test-params'));
var token = params['access_token'];
var domain = "groot-test.1bot2.info"

var data = {
    name: domain,
    children: [],
};

function getAllGroups(){
    // access token expires in 3600 sec after login; fix later
    console.log(token);
    fetch('https://www.googleapis.com/admin/directory/v1/groups?domain=' + domain + '&customer=my_customer', {
    headers: {
        'authorization': `Bearer ` + token,
    }
    }).
    then(response => response.json())
    .then((res) => {
        console.log(res);
        loadSidebar(res.groups);
        loadGroups(res.groups);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

/* Fill in informational fields on the sidebar of the page */
function loadSidebar(groups) {
    const domainName = document.getElementById("domain-name");
    domainName.innerHTML = "@" + domain;

    const numGroups = document.getElementById("num-groups");
    numGroups.innerHTML = groups.length;
}

function visualize() {
    var color = d3.scaleLinear()
    .domain([0, 5])
    .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
    .interpolate(d3.interpolateHcl)

    var format = d3.format(",d")

    var width = window.innerWidth * 3/4 - 80;
    var height = width

    var pack = data => d3.pack()
    .size([width, height])
    .padding(3)
  (d3.hierarchy(data)
    .sum(d => d.value)
    .sort((a, b) => b.value - a.value))

    const root = pack(data);
    let focus = root;
    let view;

    const svg = d3.create("svg")
        .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
        .style("display", "block")
        .style("margin", "0 -14px")
        .style("background", color(0))
        .style("cursor", "pointer")
        .on("click", () => zoom(root));

    const node = svg.append("g")
        .selectAll("circle")
        .data(root.descendants().slice(1))
        .join("circle")
        .attr("fill", d => d.children ? color(d.depth) : "white")
        .attr("pointer-events", d => !d.children ? "none" : null)
        .on("mouseover", function() { d3.select(this).attr("stroke", "#000"); })
        .on("mouseout", function() { d3.select(this).attr("stroke", null); })
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

    var chartElement = document.getElementById("chart")
    chartElement.appendChild(svg.node())

    return svg.node();
}

/* Create each of the group <div> elements and display them */
async function loadGroups(groups) {
    var groupsContainer = document.getElementById("groups");
    // retrieve members from each group
    for (var i = 0; i < groups.length; i++) {
        groupsContainer.appendChild(createGroupElement(groups[i]));
        // create a new data point in the global data object for this group
        var newCircle = {
            name: groups[i].name,
            children: []
        }

        const response = await fetch('https://www.googleapis.com/admin/directory/v1/groups/' + groups[i].id + '/members', {
        headers: {
            'authorization': `Bearer ` + token,
        }
        })
        const json = await response.json();
        console.log(json)

        if (response.status == 200) {
            var members = json.members;
            var containsSubGroups = false;
            for (var j = 0; j < members.length; j++) {
                var type = members[j].type;
                if (type == "GROUP") {
                    // there is a nested group inside the current group
                    containsSubGroups = true;
                    var group = groups[groups.findIndex(elem => elem.id == members[j].id)];
                    newCircle.children.push({
                        name: group.name,
                        value: parseInt(group.directMembersCount)
                    })
                }
            }
            if (!containsSubGroups) {
                newCircle.value = parseInt(groups[i].directMembersCount);
                delete newCircle.children
            }
            data.children.push(newCircle);
        }
    }
    console.log(data)
    visualize();
}

/** Creates an <div> element for a group. */
function createGroupElement(group) {
    const divElement = document.createElement("div");
    divElement.classList.add("group")
    divElement.classList.add("card")

    const nameElement = document.createElement("h5");
    nameElement.classList.add("name")
    nameElement.innerText = group.name;
    divElement.appendChild(nameElement);

    const descriptionElement = document.createElement("div");
    descriptionElement.classList.add("description")
    descriptionElement.innerText = group.description;
    divElement.appendChild(descriptionElement);
    
    const emailElement = document.createElement("div");
    emailElement.classList.add("email")
    emailElement.innerText = group.email;
    divElement.appendChild(emailElement);
    
    const directMembersElement = document.createElement("span");
    directMembersElement.classList.add("direct-members")
    directMembersElement.innerText = group.directMembersCount + " direct members";
    divElement.appendChild(directMembersElement);

    return divElement;
}
