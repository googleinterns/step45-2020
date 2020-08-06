/*
 * Constructs parent-child JSON by iterating over the OUs from API after level-order sorting.
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
        addOUToJSON(sortedOUs[i], outputJson);
    }
    return outputJson;
}

/*
 * Adds each OU to the output JSON.
*/
function addOUToJSON(ou, outputJson) {
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

    var currentLevel = outputJson['children'];
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
 * Returns a list of OUs matching the name search criterion.
*/
function searchOU(orgUnits, searchName) {
    var ouSearchMatches = [];
    var searchNameStd = searchName.trim().toLowerCase();

    for (ouElem of orgUnits) {
        var ouName = ouElem['name'].trim().toLowerCase();

        if (ouName.includes(searchNameStd)) {
            ouSearchMatches.push(ouElem);
        }
    }
    return ouSearchMatches;
}

/*
 * Computes an org unit's depth using the number of slashes in its path.
*/
function computeDepth(orgUnit) {
    // +1, as the root OU is considered layer 1
    return (orgUnit['orgUnitPath'].match(/\//g) || []).length + 1;
}

/*
 * Compare function; sorts by by file depth, with parents first.
*/
function ouDepthSort(ou1, ou2) {
    ouDepth1 = computeDepth(ou1);
    ouDepth2 = computeDepth(ou2);
    return ouDepth1 - ouDepth2;
}

/*
 * Given an OU, finds all its parents. Used for Search display.
*/
function retrieveOUParents(searchedOU, orgUnits) {
    // assemble the matching query's parents
    var limitedOUs = [];
    var parentOrgUnitPath = searchedOU['parentOrgUnitPath'];
    var parentArr = parentOrgUnitPath.split('/');
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

    limitedOUs.push(searchedOU);
    return limitedOUs;
}