/*
 * Given a tree-like JSON, visualizes it with a tree diagram using D3.js.
*/
function visualize(orgUnitsTree) {
    // Set the dimensions and margins of the diagram
    var margin = {top: 40, right: 90, bottom: 50, left: 90},
        width = 1980 - margin.left - margin.right,
        height = 1500 - margin.top - margin.bottom;

    // append the svg object to the #tree-chart div
    // appends a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    var svg = d3.select("#tree-chart").append("svg")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform", "translate("
            + margin.left + "," + margin.top + ")");

    var duration = 750,
        root;

    // declares a tree layout and assigns the size
    var treemap = d3.tree().size([height, width]);

    // Assigns parent, children, height, depth
    root = d3.hierarchy(orgUnitsTree, function(d) { return d.children; });
    root.x0 = height / 2;
    root.y0 = 0;

    update(root);

    // Collapse the node and all its children
    function collapse(d) {
        if (d.children) {
            d._children = d.children
            d._children.forEach(collapse)
            d.children = null
        }
    }

    function update(source) {

        // Assigns the x and y position for the nodes
        var treeData = treemap(root);

        // Compute the new tree layout.
        var nodes = treeData.descendants(),
            links = treeData.descendants().slice(1);

        // Normalize for fixed-depth.
        nodes.forEach(function(d){ d.y = d.depth * 180});

        // ****************** Nodes section ***************************

        // used to uniquely ID each data node below
        var i = 0;

        // Update the nodes...
        var node = svg.selectAll('g.node')
            .data(nodes, function(d) {return d.id || (d.id = ++i); });

        // Enter any new modes at the parent's previous position.
        var nodeEnter = node.enter().append('g')
            .attr('class', 'node')
            .attr("transform", function(d) {
                return "translate(" + source.x0 + "," + source.y0 + ")";
            })
            .on('click.children', nodeClick)
            .on('click.getPath', populatePaths);

        // Add Circle for the nodes
        nodeEnter.append('circle')
            .attr('class', 'node')
            .attr('r', 1e-6)
            .style("fill", function(d) {
                return d._children ? "lightsteelblue" : "#fff";
            });

        // Add labels for the nodes
        nodeEnter.append('text')
            .attr("dy", ".35em")
            .attr("y", function(d) {
                return d.children || d._children ? -18 : 18;
            })
            .attr("text-anchor", "middle")
            .text(function(d) { return d.data.name; });

        // UPDATE
        var nodeUpdate = nodeEnter.merge(node);

        // Transition to the proper position for the node
        nodeUpdate.transition()
            .duration(duration)
            .attr("transform", function(d) { 
                return "translate(" + d.x + "," + d.y + ")";
            });

        // Update the node attributes and style
        nodeUpdate.select('circle.node')
            .attr('r', 10)
            .style("fill", function(d) {
                return d._children ? "lightsteelblue" : "#fff";
            })
            .attr('cursor', 'pointer');


        // Remove any exiting nodes
        var nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function(d) {
                return "translate(" + source.x + "," + source.y + ")";
            })
            .remove();

        // On exit reduce the node circles size to 0
        nodeExit.select('circle')
            .attr('r', 1e-6);

        // On exit reduce the opacity of text labels
        nodeExit.select('text')
            .style('fill-opacity', 1e-6);

        // ****************** links section ***************************

        // Update the links...
        var link = svg.selectAll('path.link')
            .data(links, function(d) { return d.id; });

        // Enter any new links at the parent's previous position.
        var linkEnter = link.enter().insert('path', "g")
            .attr("class", "link")
            .attr('d', function(d){
                var o = {x: source.x0, y: source.y0}
                return diagonal(o, o)
            });

        // UPDATE
        var linkUpdate = linkEnter.merge(link);

        // Transition back to the parent element position
        linkUpdate.transition()
            .duration(duration)
            .attr('d', function(d){ return diagonal(d, d.parent) });

        // Remove any exiting links
        var linkExit = link.exit().transition()
            .duration(duration)
            .attr('d', function(d) {
                var o = {x: source.x, y: source.y}
                return diagonal(o, o)
            })
            .remove();

        // Store the old positions for transition.
        nodes.forEach(function(d){
            d.x0 = d.x;
            d.y0 = d.y;
        });

        // Creates a curved (diagonal) path from parent to the child nodes
        function diagonal(s, d) {

            path = `M ${s.x} ${s.y}
                    C ${s.x} ${(s.y + d.y) / 2},
                    ${d.x} ${(s.y + d.y) / 2},
                    ${d.x} ${d.y}`

            return path
        }

        // Toggle children on click.
        function nodeClick(d) {
            if (d.children) {
                d._children = d.children;
                d.children = null;
            } else {
                d.children = d._children;
                d._children = null;
            }
            update(d);
        }
    }

    // d3 visualization has loaded
    isLoading = false;
    setLoadingOverlay();
}


/*
 * Removes the current visual element on the page.
*/
function removeVisualization() {
    // Either removes the no-search-result screen or the visualization
    noSearchResultScreen = document.getElementById('no-search-result-elem');
    if (noSearchResultScreen) {
        noSearchResultScreen.remove();
    } else {
        d3.select("#tree-chart").remove();
        var container = document.getElementById("chart-container");
        var newChartElem = document.createElement('div');
        newChartElem.setAttribute("id", "tree-chart");
        container.appendChild(newChartElem);
    }
}


/*
 * Adds interactivity (zoom, drag) to the D3 visualization; adds onChange functions to edit OU console.
*/
function addListeners() {
    var scale = 1,
    panning = false,
    xoff = 0,
    yoff = 0,
    start = {x: 0, y: 0},
    treeChart = document.getElementById("tree-chart");
    editSelect = document.getElementById("edit-choice");

    function setTransform() {
        treeChart.style.transform = "translate(" + xoff + "px, " + yoff + "px) scale(" + scale + ")";
    }

    treeChart.onmousedown = function(e) {
        e.preventDefault();
        start = {x: e.clientX - xoff, y: e.clientY - yoff};    
        panning = true;
    }

    treeChart.onmouseup = function(e) {
        panning = false;
    }

    treeChart.onmousemove = function(e) {
        e.preventDefault();         
        if (!panning) {
            return;
        }
        xoff = (e.clientX - start.x);
        yoff = (e.clientY - start.y);
        setTransform();
        
    }

    treeChart.onwheel = function(e) {
        e.preventDefault();
        // take the scale into account with the offset
        var xs = (e.clientX - xoff) / scale,
            ys = (e.clientY - yoff) / scale,
            delta = (e.wheelDelta ? e.wheelDelta : -e.deltaY);

        // get scroll direction & set zoom level (with limits on zooming)
        if (delta > 0) {
            (scale < 1.6) ? (scale *= 1.2) : (scale *= 1);
        } else {
            (scale > 0.6) ? (scale /= 1.2) : (scale *= 1);
        }

        // reverse the offset amount with the new scale
        xoff = e.clientX - xs * scale;
        yoff = e.clientY - ys * scale;

        setTransform();          
    }

    editSelect.onchange = function(event) {
        createDiv = document.getElementById("edit-create");
        updateDiv = document.getElementById("edit-update");
        deleteDiv = document.getElementById("edit-delete");

        if (editSelect.value == "create") {
            deleteDiv.style.display = "none";
            updateDiv.style.display = "none";
            createDiv.style.display = "block";
        } else if (editSelect.value == "update") {
            deleteDiv.style.display = "none";
            createDiv.style.display = "none";
            updateDiv.style.display = "block";
        } else {
            updateDiv.style.display = "none";
            createDiv.style.display = "none";
            deleteDiv.style.display = "block";
        }
    }
}


// Populates OU paths upon node click.
function populatePaths(node) {
    var deletePath = document.getElementById('delete-path');
    var createPath = document.getElementById('create-path');
    var updatePath = document.getElementById('update-path');

    // if updatePath populated, populate the updateParentPath
    if (updatePath.value) {
        var updateParentPath = document.getElementById('update-parent-path');
        updateParentPath.value = node.data.orgUnitPath.substring(1);
    } else {
        updatePath.value = node.data.orgUnitPath.substring(1);
    }

    deletePath.value = node.data.orgUnitPath.substring(1);
    createPath.value = node.data.orgUnitPath.substring(1);
}