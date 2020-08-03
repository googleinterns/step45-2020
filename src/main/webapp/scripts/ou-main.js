// Denotes whether or not the latest OU data has been loaded on the page
var ouDataLoaded = false;

// Show refresh button and overlay
var isLoading;

// Org Units data
var orgUnits;

// Search criteria
var searchName;

// OUs filtered by search (set to orgunits if no query)
var filteredOUs;

// Display criteria
var layersToRender;
var totalLayers;

/*
 * Loads the page, fetching all OUs and adding necessary events.
 */
async function onloadOUPage() {
    loginStatus();

    var searchButton = document.getElementById("search-enter-btn");
    searchButton.addEventListener("click", function(event) {
        searchName = searchBar.value;
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
        const confirmDeleteElem = document.getElementById("delete-modal-orgunit");
        confirmDeleteElem.innerHTML = '';
    });

    orgUnits = await fetchOUs();

    layersToRender = parseInt(document.getElementById("limit-layer-num").value);
    filteredOUs = orgUnits;

    renderOUs(orgUnits);
}

/*
 * Refreshes the page.
 */
async function refreshOUPage() {
    loginStatus();

    document.getElementById("search").value = '';
    searchName = '';

    orgUnits = await fetchOUs();
    filteredOUs = orgUnits;

    renderOUs(orgUnits);
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

        if (orgUnits == undefined) {
            orgUnits = [];
            // latest OU data has changed
            ouDataLoaded = false;
        }

        return orgUnits;
    } catch (error) {
        console.error('Error:', error);
    }
}

/*
 * Calls all the functions to manipulate OU data, and loads the sidebar and visualization.
*/
function renderOUs(displayOUs) {
    isLoading = true;
    setLoadingOverlay();

    if (displayOUs.length == 0) {
        loadSidebar(displayOUs);
        if (ouDataLoaded) {
            // if latest OU data has been loaded, then an empty list just means a failed query
            removeVisualization();
            noSearchResult("There were no results for your search.");
        } else {
            // otherwise, there were no OUs to begin with
            noSearchResult("You have no OUs in your domain.");
        }
        return;
    }

    // limit layers code
    displayOUs.sort(ouDepthSort); // sort by depth
    displayOUs = limitLayers(displayOUs);

    loadSidebar(displayOUs);
    var parentChildOUs = constructD3JSON(displayOUs); // transform into parent-child JSON

    if (ouDataLoaded) {
        removeVisualization();
    }

    ouDataLoaded = true;
    
    visualize(parentChildOUs); // visualize with D3
    addListeners();
}

/* Fill in informational fields on the sidebar of the page */
function loadSidebar(limitedOUs) {
    const domainName = document.getElementById("domain-name");
    domainName.innerHTML = "@" + domain;

    var displayOUCountEl = document.getElementById("display-ous");
    var displayLayerCountEl = document.getElementById("display-layers");

    var displayLimit = document.getElementById("limit-layer-num");
    displayLimit.value = layersToRender;
    displayLimit.setAttribute("max", totalLayers);
    
    if (limitedOUs.length == 0) {
        displayLayerCountEl.innerHTML = 0;
        displayOUCountEl.innerHTML = 0;
    } else {
        displayLayerCountEl.innerHTML = computeDepth(limitedOUs[limitedOUs.length - 1]);
        displayOUCountEl.innerHTML = limitedOUs.length + 1;
    }

    document.getElementById("total-layers").innerHTML = totalLayers;
    document.getElementById("total-ous").innerHTML = orgUnits.length + 1;
}


// Search and Layer Limit code below


/*
 * Given a search query, determines which OUs to render.
*/
function executeSearch() {
    // set global var
    filteredOUs = orgUnits;

    if (searchName) {
        var searchedOUList = searchOU(searchName);
        if (searchedOUList.length == 0) {
            // no matches
            filteredOUs = [];
            renderOUs(filteredOUs);
        } else if (searchedOUList.length == 1) {
            // render the tree of the one matching OU
            var searchedOU = searchedOUList[0];
            filteredOUs = retrieveOUParents(searchedOU);
            renderOUs(filteredOUs);
        } else {
            // else open selection modal
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
        renderOUs(filteredOUs);
    }
}

/*
 * Once the user has selected from the searched OUs, display it.
*/
function displayOUSelected() {
    var ouToDisplay = JSON.parse(document.getElementById("search-matches-select").value);
    $('#multiple-query-modal').modal('hide');
    // construct the tree for this chosen OU
    filteredOUs = retrieveOUParents(ouToDisplay);
    renderOUs(filteredOUs);
}

/*
 * Constructs the no matching search results screen.
 */
function noSearchResult(displayString) {
    if (document.getElementById("no-search-result-elem")) {
        isLoading = false;
        setLoadingOverlay();
        return;
    }
    var noResultsDiv = document.createElement("div");
    noResultsDiv.classList.add("no-search-results");
    noResultsDiv.id = "no-search-result-elem";

    var noResultText = document.createElement("P");
    noResultText.innerHTML = displayString;

    var refreshOUPageButton = document.createElement("BUTTON");
    refreshOUPageButton.innerHTML = "Reset display";
    refreshOUPageButton.classList.add("btn");
    refreshOUPageButton.classList.add("btn-primary");
    refreshOUPageButton.onclick = refreshOUPage;

    noResultsDiv.appendChild(noResultText);
    noResultsDiv.appendChild(refreshOUPageButton);
    document.getElementById('chart-container').append(noResultsDiv);

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
    if (totalLayers <= layersToRender) {
        layersToRender = totalLayers;
        return limitedOUs;
    } else {
        limitedOUList = [];

        for (currentOU of limitedOUs) {
            if (computeDepth(currentOU) > layersToRender) {
                break;
            }
            limitedOUList.push(currentOU);
        }

        return limitedOUList;
    }
}

/*
 * Rerenders visualization with new layer limit criteria.
*/
function renderLayers() {
    layersToRender = parseInt(document.getElementById("limit-layer-num").value);
    if (Number.isNaN(layersToRender) || layersToRender < 2) {
        layersToRender = 3;
    }
    // ensures we never display more than the available number of layers
    if (layersToRender > totalLayers) {
        layersToRender = totalLayers;
    }

    renderOUs(filteredOUs);
}
