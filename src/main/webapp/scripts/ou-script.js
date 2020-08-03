// Notes to self
// IF we have no orgunits in admin console, response.json()['organizationUnits'] is undefined
// blockInheritance can be undefined for some orgunits in our response, means it was never set
// we can use the API to return all org units STARTING at a certain org unit (makes layers up / layers down code easy)
// because not saving on API calls (one to get all OUs), just have limit layers make those 3 layers expanded rather than ONLY showing those 3 layers OR reword limit depth to limit display of or something

// prevent visualization from being potentially dragged off the screen
// determine size for svg based on size of visualization somehow?
// layers and search work independently now (aka you have to hit Render) to get layer limiting, won't just do it on search. might want to change that



// clean up path that appears in delete modal

// Show refresh button and overlay
var isLoading;

// Org Units data in JSON forms
var orgUnits;
var parentChildOUs;

// Search criteria
var searchName;


var hereAreTheSearchedOUs;



// Display criteria
var layerLimitNum;
var totalLayers;

function removeVisualization() {
    // either remove the no-search-result-element or the visualization
    noSearchResultScreen = document.getElementById('no-search-result-elem');
    if (noSearchResultScreen) {
        noSearchResultScreen.remove();
    } else {
        // removing just the svg messes up the listeners
        d3.select("#tree-chart").remove();
        // need to add a new tree-chart elem
        var container = document.getElementById("chart-container");
        var newChartElem = document.createElement('div');
        newChartElem.setAttribute("id", "tree-chart");
        container.appendChild(newChartElem);
    }
}

/*
 * Loads the page, fetching all OUs and adding necessary events.
 */
async function onloadOUPage() {
    checkLoginAndSetUp();

    var searchButton = document.getElementById("search-enter-btn");
    searchButton.addEventListener("click", function(event) {
        searchName = searchBar.value;
        console.log(searchName);
        executeSearch();
    });

    var searchBar = document.getElementById("search");
    // Execute a function when the user presses enter or erases the input
    searchBar.addEventListener("search", function(event) {
        searchButton.click();
    });

    // clear modals upon closure
    $("#multiple-query-modal").on("hidden.bs.modal", function() {
        var searchMatchSelectEl = document.getElementById("search-matches-select");
        searchMatchSelectEl.innerHTML = '';
    });
    $("#delete-modal").on("hidden.bs.modal", function() {
        const confirmOUElem = document.getElementById("delete-modal-orgunit");
        confirmOUElem.innerHTML = '';
    });

    orgUnits = await fetchOUs();
    layerLimitNum = parseInt(document.getElementById("limit-layer-num").value);
    hereAreTheSearchedOUs = orgUnits;

    getAllOUs(orgUnits);
}

/*
 * Refreshes the page.
 */
async function refreshOUPage() {
    loginStatus();

    document.getElementById("search").value = '';
    searchName = '';

    orgUnits = await fetchOUs();
    hereAreTheSearchedOUs = orgUnits;

    refreshAllOUs(orgUnits);
}

/*
 * Fetches all OUs from the Admin SDK.
*/
async function fetchOUs() {
    // fetch all OUs from API
    try {
        const response = await fetch('https://www.googleapis.com/admin/directory/v1/customer/my_customer/orgunits?orgUnitPath=/&type=all', {
            headers: {
                'authorization': `Bearer ` + token,
            }
        });
        const directoryOUs = await response.json();
        orgUnits = directoryOUs['organizationUnits'];
        return orgUnits;
    } catch (error) {
        console.error('Error:', error);
    }
}

/*
 * Given an OU, finds all its parents up to the root OU.
*/
function retrieveOUParents(searchedOU) {
    // assemble the matching query's parents
    var limitedOUs = [];
    var parentOrgUnitPath = searchedOU['parentOrgUnitPath'];
    parentArr = parentOrgUnitPath.split('/');
    // first elem is always empty
    parentArr.shift();

    // need to match OUs by paths (which are unique) rather than by names
    var pathSoFar = '';

    while (parentArr.length != 0) {
        pathSoFar = pathSoFar + '/' + parentArr.shift();

        for (unit of orgUnits) {
            if (unit['orgUnitPath'] == pathSoFar) {
                limitedOUs.push(unit);
                break;
            }
        }
    }

    // no sort needed, as OUs added in order of increasing depth
    limitedOUs.push(searchedOU);
    return limitedOUs;
}


/*
 * Given a search query, determines which OUs to render.
*/
function executeSearch() {
    // set global var
    hereAreTheSearchedOUs = orgUnits;

    if (searchName) {
        var searchedOUList = searchOU(searchName);
        if (searchedOUList.length == 0) {
            // no matches
            hereAreTheSearchedOUs = [];
            console.log("expecting this to print");
            refreshAllOUs(hereAreTheSearchedOUs);
        } else if (searchedOUList.length == 1) {
            // render the tree of the one matching OU
            var searchedOU = searchedOUList[0];
            hereAreTheSearchedOUs = retrieveOUParents(searchedOU);
            refreshAllOUs(hereAreTheSearchedOUs);
        } else {
            // else open selection modal
            console.log(searchedOUList);
            var searchMatchSelectEl = document.getElementById("search-matches-select");
            for (matchingOU of searchedOUList) {
                var optionEl = document.createElement("option");
                optionEl.textContent = matchingOU['orgUnitPath'];
                optionEl.value = JSON.stringify(matchingOU);
                searchMatchSelectEl.appendChild(optionEl);
            }
            $('#multiple-query-modal').modal('show');
        }
    } else {
        refreshAllOUs(hereAreTheSearchedOUs);
    }
}

/*
 * Once the user has selected from the searched OUs, display it.
*/
function displayOUSelected() {
    var ouToDisplay = JSON.parse(document.getElementById("search-matches-select").value);
    console.log(ouToDisplay);
    $('#multiple-query-modal').modal('hide');
    // now construct the tree for this one OU
    hereAreTheSearchedOUs = retrieveOUParents(ouToDisplay);
    refreshAllOUs(hereAreTheSearchedOUs);
}

/*
 * Calls all the functions to manipulate OU data, and loads the sidebar and visualization.
*/
function getAllOUs(limitedOUs) {
    isLoading = true;
    setLoadingOverlay();

    // this ends up being an onload only. so check if OUs are undefined here -> display screen "You have no OUs."
    if (limitedOUs.length == 0) {
        loadSidebar(limitedOUs);
        noSearchResult();
        return;
    }

    // limit layers code
    limitedOUs.sort(ouDepthSort); // sort by depth
    limitedOUs = limitLayers(limitedOUs);

    loadSidebar(limitedOUs);
    parentChildOUs = constructD3JSON(limitedOUs); // transform into parent-child JSON
    visualize(parentChildOUs); // visualize with D3
    addListeners();
}

/*
 * Very different.
*/
function refreshAllOUs(limitedOUs) {
    console.log("entered refresh");

    isLoading = true;
    setLoadingOverlay();

    if (limitedOUs.length == 0) {
        loadSidebar(limitedOUs);
        removeVisualization();
        noSearchResult();
        return;
    }

    // limit layers code
    limitedOUs.sort(ouDepthSort); // sort by depth
    limitedOUs = limitLayers(limitedOUs);

    loadSidebar(limitedOUs);
    parentChildOUs = constructD3JSON(limitedOUs); // transform into parent-child JSON

    removeVisualization();

    visualize(parentChildOUs); // visualize with D3
    addListeners();
}

/*
 * Constructs the no matching search results screen.
 */
function noSearchResult() {
    if (document.getElementById("no-search-result-elem")) {
        isLoading = false;
        setLoadingOverlay();
        return;
    }
    var div = document.createElement("div");
    div.classList.add("no-search-results");
    div.id = "no-search-result-elem";
    var p = document.createElement("P");
    p.innerHTML = "There were no results for your search."; 
    var refreshOUPageButton = document.createElement("BUTTON");
    refreshOUPageButton.innerHTML = "Reset all";
    refreshOUPageButton.classList.add("btn");
    refreshOUPageButton.classList.add("btn-primary");
    refreshOUPageButton.onclick = refreshOUPage;

    div.appendChild(p);
    div.appendChild(refreshOUPageButton);
    document.getElementById('chart-container').append(div);

    // loading is over
    isLoading = false;
    setLoadingOverlay();
}

/*
 * Returns a list of OUs within the layer depth limit.
*/
function limitLayers(limitedOUs) {
    if (limitedOUs.length == 0) {
        // set global
        totalLayers = 1;
        return [];
    }
    var lastElementDepth = computeDepth(limitedOUs[limitedOUs.length - 1]);
    // set the totalLayers global var
    totalLayers = lastElementDepth;
    if (totalLayers <= layerLimitNum) {
        layerLimitNum = totalLayers;
        return limitedOUs;
    } else {
        limitedOUList = [];

        for (current of limitedOUs) {
            if (computeDepth(current) > layerLimitNum) {
                break;
            }
            limitedOUList.push(current);
        }

        return limitedOUList;
    }
}

/* Fill in informational fields on the sidebar of the page */
function loadSidebar(limitedOUs) {
    const domainName = document.getElementById("domain-name");
    domainName.innerHTML = "@" + domain;

    const displayOUs = document.getElementById("display-ous");
    const displayLayers = document.getElementById("display-layers");
    const totalOUs = document.getElementById("total-ous");
    const totalLayerCount = document.getElementById("total-layers");

    var displayLimit = document.getElementById("limit-layer-num");
    displayLimit.value = layerLimitNum;
    displayLimit.setAttribute("max", totalLayers);
    
    if (limitedOUs.length == 0) {
        displayLayers.innerHTML = 0;
        displayOUs.innerHTML = 0;
    } else {
        displayLayers.innerHTML = computeDepth(limitedOUs[limitedOUs.length - 1]);
        displayOUs.innerHTML = limitedOUs.length + 1;
    }

    totalLayerCount.innerHTML = totalLayers;
    totalOUs.innerHTML = orgUnits.length + 1;
}

/*
 * Constructs parent-child JSON by iterating over the OUs from API after sorting.
*/
function constructD3JSON(sortedOUs) {
    // initialize root OU
    var outputJson = {};
    outputJson['name'] = 'root';
    outputJson['description'] = 'The root organizational unit.';
    outputJson['orgUnitPath'] = '/';
    outputJson['parentOrgUnitPath'] = '';
    outputJson['blockInheritance'] = false;
    outputJson['children'] = [];

    for (var i = 0; i < sortedOUs.length; i++) {
        addToJSON(sortedOUs[i], outputJson);
    }
    return outputJson;
}

/*
 * Adds each OU to the output JSON in level-order (parents always in before children).
*/
function addToJSON(ou, outputJson) {
    var parentOrgUnitPath = ou['parentOrgUnitPath'];

    ou.children = [];

    if (parentOrgUnitPath === '/') {
        // can add directly as child of root
        outputJson['children'].push(ou);
        return;
    }

    var parentArr = parentOrgUnitPath.split('/');
     // first element of split will always be empty string
    parentArr.shift();

    currentLevel = outputJson['children'];
    // keep searching deeper until we've reached the OU's direct parent
    while (parentArr.length !== 0) {
        var parentQuery = parentArr.shift(); // pops off highest level parent
        // scan this level's OUs for the queried parent
        for (orgUnit of currentLevel) {
            if (orgUnit['name'] == parentQuery) {
                currentLevel = orgUnit['children'];
                break;
            }
        }
    }

    // once reached direct parent, append the OU to children
    currentLevel.push(ou);
}

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

    var i = 0,
        duration = 750,
        root;

    // declares a tree layout and assigns the size
    var treemap = d3.tree().size([height, width]);

    // Assigns parent, children, height, depth
    root = d3.hierarchy(orgUnitsTree, function(d) { return d.children; });
    root.x0 = height / 2;
    root.y0 = 0;



    // Collapse after the second level
    // root.children.forEach(collapse);

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

/*
 * Adds interactivity (zoom, drag) to the D3 visualization; adds onChange functions to form.
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

/*
 * Rerenders visualization with new layer limit criteria.
*/
function renderLayers() {
    layerLimitNum = parseInt(document.getElementById("limit-layer-num").value);
    if (Number.isNaN(layerLimitNum) || layerLimitNum < 2) {
        layerLimitNum = 3;
    }
    // ensures we never display more than the available number of layers
    if (layerLimitNum > totalLayers) {
        layerLimitNum = totalLayers;
    }

    refreshAllOUs(hereAreTheSearchedOUs);
}
