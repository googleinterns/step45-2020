describe("Test OUDepthSort", function() {
    
  var shortPath = "/onedepth";
  var longPath = "/three/depth/path";


  it("difference of path depths", function() {
    var depthDifference = 0;
    $.getScript('/src/main/webapp/scripts/ou-script.js', function() {
        var depthDifference = ouDepthSort(longPath, shortPath)
        expect(depthDifference).toBe(2); 
     });
  });
});
