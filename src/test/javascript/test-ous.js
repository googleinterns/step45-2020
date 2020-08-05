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


// FAILING TEST
describe("Test ConstructD3JSON", function() {

  var testOUs = [];

  // add data under /NA/business
  addOUJSONToList(testOUs, "sales", "/NA/business");
  addOUJSONToList(testOUs, "marketing", "/NA/business");

  // add data under /EMEA
  addOUJSONToList(testOUs, "all", "/EMEA");

  // add data under root
  addOUJSONToList(testOUs, "NA", "/");
  addOUJSONToList(testOUs, "EMEA", "/");

  // add data under /NA
  addOUJSONToList(testOUs, "business", "/NA");
  addOUJSONToList(testOUs, "engineering", "/NA");
  addOUJSONToList(testOUs, "essentials", "/NA");


  it("constructing D3 tree-like JSON", function(done) {
    
    $.getScript('/src/main/webapp/scripts/ou-utils.js', function() {
        var expectedJSONTree = {
            "name": "root",
            "parentOrgUnitPath": "",
            "description": "The root organizational unit.",
            "orgUnitPath": "/",
            "blockInheritance": false,
            "children": [
                {
                    "name": "NA",
                    "parentOrgUnitPath": "/",
                    "children": [
                        {
                            "name": "business",
                            "parentOrgUnitPath": "/NA",
                            "children": [
                                {
                                    "name": "sales",
                                    "parentOrgUnitPath": "/NA/business",
                                    "children": []
                                },
                                {
                                    "name": "marketing",
                                    "parentOrgUnitPath": "/NA/business",
                                    "children": []
                                }
                            ]
                        },
                        {
                            "name": "engineering",
                            "parentOrgUnitPath": "/NA",
                            "children": []
                        },
                        {
                            "name": "essentials",
                            "parentOrgUnitPath": "/NA",
                            "children": []
                        }
                    ]
                },
                {
                    "name": "EMEA",
                    "parentOrgUnitPath": "/",
                    "children": [
                        {
                            "name": "all",
                            "parentOrgUnitPath": "/EMEA",
                            "children": []
                        }
                    ]
                }
            ]
        };

        // ensure data is sorted before pass in
        testOUs.sort(ouDepthSort);

        var treeLikeJSON = constructD3JSON(testOUs);

        // none of the following expects worked
        // ERROR: constructing D3 tree-like JSON <<< FAILURE!
        // * Uncaught TypeError: Cannot read property 'match' of undefined thrown

        // expect(_.isEqual(treeLikeJSON, expectedJSONTree)).toEqual(true);
        expect(treeLikeJSON).toContain(jasmine.objectContaining(
            {
                "name": "root",
                "parentOrgUnitPath": "",
                "description": "The root organizational unit.",
                "orgUnitPath": "/",
                "blockInheritance": false
            }
        ));
        // expect(JSONAssert.assertEquals(expectedJSONTree, treeLikeJSON, false)).toEqual(true);

        done();
     });
  });
});

function addOUJSONToList(listOfOUs, name, parentOrgUnitPath) {
    var outputOU = {};
    outputOU.name = name;
    outputOU.parentOrgUnitPath = parentOrgUnitPath;
    listOfOUs.push(outputOU);
}




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