describe("Test ComputeDepth", function() {

  // Note that this function would never be called with the root OU, '/' (which assumes depth of 1)
  var shortPathOU = {"orgUnitPath": "/layer1"};
  var longPathOU = {"orgUnitPath": "/depth/six/path/shown/here"};

  it("computing depth by path", function(done) {
    
    $.getScript('/src/main/webapp/scripts/ou-utils.js', function() {

        var shortPathDepth = computeDepth(shortPathOU);
        expect(shortPathDepth).toBe(2);

        var longPathDepth = computeDepth(longPathOU);
        expect(longPathDepth).toBe(6);

        done();
     });
  });
});



describe("Test OUDepthSort", function() {
    
  var shortPath = {"orgUnitPath": "/onedepth"};
  var longPath = {"orgUnitPath": "/three/depth/path"};

  it("difference of path depths", function(done) {
    var depthDifference = 0;
    
    $.getScript('/src/main/webapp/scripts/ou-utils.js', function() {
        var depthDifference = ouDepthSort(longPath, shortPath);
        expect(depthDifference).toBe(2); 
        done();
     });
  });
});



function createOUJSON(orgUnitPath, parentOrgUnitPath) {
    var outputOU = {};
    outputOU.orgUnitPath = orgUnitPath;
    outputOU.parentOrgUnitPath = parentOrgUnitPath;
    return outputOU;
}

describe("Test RetrieveOUParents", function() {
  var testOUs = [];

  // initialize the searched OU and its expected parents
  var queriedOU = createOUJSON("/NA/business/sales", "/NA/business");
  var topParentOU = createOUJSON("/NA", "/");
  var directParentOU = createOUJSON("/NA/business", "/NA");

  // add data under /NA/business
  testOUs.push(queriedOU);
  testOUs.push(createOUJSON("/NA/business/marketing", "/NA/business"));

  // add data under /EMEA
  testOUs.push(createOUJSON("/EMEA/business", "/EMEA"));

  // add data under root
  testOUs.push(topParentOU);
  testOUs.push(createOUJSON("/EMEA", "/"));
  testOUs.push(createOUJSON("/business", "/"));

  // add data under /NA
  testOUs.push(directParentOU);
  testOUs.push(createOUJSON("/NA/engineering", "/NA"));
  testOUs.push(createOUJSON("/NA/essentials", "/NA"));


  it("compile correct OU parents", function(done) {
    
    $.getScript('/src/main/webapp/scripts/ou-utils.js', function() {
        var parentOUsList = retrieveOUParents(queriedOU, testOUs);

        expect(parentOUsList.length).toBe(3);

        expect(parentOUsList).toContain(jasmine.objectContaining(queriedOU));
        expect(parentOUsList).toContain(jasmine.objectContaining(topParentOU));
        expect(parentOUsList).toContain(jasmine.objectContaining(directParentOU));

        done();
     });
  });
});



describe("Test SearchOU", function() {

  var ouNames = ['sales', 'sale', 'sa-les', 'SALes', 'WestCoastSalesPerson', '', '$'];
  var testOUs = [];
  var searchQuery = "sales";

  for (nameStr of ouNames) {
      var ouJSON = {"name": nameStr};
      testOUs.push(ouJSON);
  }

  it("list of search results", function(done) {
    
    $.getScript('/src/main/webapp/scripts/ou-utils.js', function() {
        var searchResultList = searchOU(testOUs, searchQuery);
        expect(searchResultList.length).toBe(3);

        expect(searchResultList).toContain(jasmine.objectContaining({"name": 'sales'}));
        expect(searchResultList).toContain(jasmine.objectContaining({"name": 'SALes'}));
        expect(searchResultList).toContain(jasmine.objectContaining({"name": 'WestCoastSalesPerson'}));

        done();
     });
  });
});