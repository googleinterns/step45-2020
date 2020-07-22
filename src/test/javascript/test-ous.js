describe("Test OUDepthSort", function() {
    
  var shortPath = {"orgUnitPath": "/onedepth"};
  var longPath = {"orgUnitPath": "/three/depth/path"};

  it("difference of path depths", function(done) {
    var depthDifference = 0;
    
    $.getScript('/src/main/webapp/scripts/ou-script.js', function() {
        var depthDifference = ouDepthSort(longPath, shortPath)
        expect(depthDifference).toBe(2); 
        done();
     });
  });
});