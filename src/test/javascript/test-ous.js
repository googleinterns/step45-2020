describe("Test OUDepthSort", function() {
    
  var shortPath = {"orgUnitPath": "/onedepth"};
  var longPath = {"orgUnitPath": "/three/depth/path"};

  it("difference of path depths", function(done) {
    var depthDifference = 0;
    
    $.getScript('/src/main/webapp/scripts/ou-utils.js', function() {
        var depthDifference = ouDepthSort(longPath, shortPath)
        expect(depthDifference).toBe(2); 
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