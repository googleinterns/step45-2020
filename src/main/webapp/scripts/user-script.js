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

function getOUs(){
    fetch("/get-ous").then(response => response.json())
    .then((ous) => {
        data = ous;
        console.log(data);
        visualize();
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
        .then((ous) => {
            console.log(ous);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
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
        .attr("viewBox", [0.5, -30.5, width, height + 30])
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
            .data(d => (d === root ? name(d) : d.data.name).split(/(?=[A-Z][^A-Z])/g).concat(format(d.value)))
            .join("tspan")
            .attr("x", 3)
            .attr("y", (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`)
            .attr("fill-opacity", (d, i, nodes) => i === nodes.length - 1 ? 0.7 : null)
            .attr("font-weight", (d, i, nodes) => i === nodes.length - 1 ? "normal" : null)
            .text(d => d);

        group.call(position, root);
    }

    function position(group, root) {
        group.selectAll("g")
            .attr("transform", d => d === root ? `translate(0,-30)` : `translate(${x(d.x0)},${y(d.y0)})`)
        .select("rect")
            .attr("width", d => d === root ? width : x(d.x1) - x(d.x0))
            .attr("height", d => d === root ? 30 : y(d.y1) - y(d.y0));
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


