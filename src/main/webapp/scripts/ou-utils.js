/*
 * Currently just returns the first OU matching the name search criterion.
*/
function searchOU(searchName) {
    for (ouElem of orgUnits) {
        if (ouElem['name'].includes(searchName)) {
            return ouElem;
        }
    }
    return null;
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