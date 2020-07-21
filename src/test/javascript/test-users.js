var body = $('body').first();

var UIFramework = (function() {
    function button(id, onclick) {
        var element = document.createElement("div");
        element.class = "btn";
        element.id = id;
        element.onclick = onclick;
        return element;
    }

    function input(type, value) {
      var element = document.createElement("input");
      element.type = type;
      element.value = value;
      return element;
    }

    return {
        button: button,
        input: input
    }
})();

// describe("Test clearFilters", function() {
//     var orgUnitInput = ['OU1', 'OU2']; 
//     var groupInput = ['group1', 'group2'];
//     var checkbox1 = UIFramework.input("checkbox", "checkbox-value1");
//     var checkbox2 = UIFramework.input("checkbox", "checkbox-value2");
//     body.append(checkbox1);
//     body.append(checkbox2);

//     $("#num-filter-users").val(4);
//     it("clearFilters function uncheck all checkboxes", function() {
//         $.getScript('/src/main/webapp/scripts/user-script.js', function() {   
            
//         });
//     });
// });

// describe("Test checkboxes", function() {
//     // create checkboxes
//     // var checkbox1 = UIFramework.input("checkbox", "checkbox-value1");
//     // var checkbox2 = UIFramework.input("checkbox", "checkbox-value2");
//     // body.append(checkbox1);
//     // body.append(checkbox2);
//     var checkbox1 = $("#checkbox1");
//     var orgUnitInput = [];
//     var groupInput = [];

//     
//     it("test adding orgunits to filter", function(done) {
//         var orgUnitInput = [];

//         $.getScript('/src/main/webapp/scripts/user-script.js', function() { 
//             var checkbox1 = $("#checkbox1");  
//             updateOrgUnitInput(checkbox1);
//             expect(orgUnitInput).toEqual(["value1"]);
//             done();
//         });
//     });
// });
//             // checkbox1.click(updateOrgUnitInput);
//             // // checkbox2.click(updateOrgUnitInput);
//             // checkbox1.trigger("click");
//             // checkbox2.trigger("click");

//             // add clicked checkbox
//             expect(orgUnitInput).toEqual(["checkbox-value1", "checkbox-value2"]);
//             expect(orgUnitInput).toContain("checkbox-value1");
//             expect(orgUnitInput).toContain("checkbox-value2");
//         });

//         it("test removing orgunits from filter", function() {
//             // remove clicked checkbox
//             checkbox2.trigger("click");
//             expect(orgUnitInput).toContain("checkbox-value1");
//             expect(orgUnitInput).not.toContain("checkbox-value2");
//         });

//         it("test adding groups to filter", function() {
//             checkbox1.click(updateGroupInput);
//             checkbox2.click(updateGroupInput);
//             checkbox1.trigger("click");
//             checkbox2.trigger("click");

//             // add clicked checkbox
//             expect(groupInput).toContain("checkbox-value1");
//             expect(groupInput).toContain("checkbox-value2");
//         });

//         it("test removing groups from filter", function() {
//             // remove clicked checkbox
//             checkbox2.trigger("click");
//             expect(groupInput).toContain("checkbox-value1");
//             expect(groupInput).not.toContain("checkbox-value2");
//         });

//     });
// });
  
describe("Test add user to data", function(){
    var data = {
        data: {name: "GRoot Test", path: "/", parentPath: null, users: [], numUsers: 3},
        children:[
            {data: {name: "East-coast", path: "/East-coast", parentPath: "/", users: [], numUsers: 3}}
        ]
    }

    var body = document.getElementsByTagName("body")[0];
    it("dumb", function(){
        expect(body).toBeDefined();
    })
    
    it("add user to root", function(done) {
        expect(data.data.users.length).toEqual(0);
        $.getScript('/src/main/webapp/scripts/user-script.js', function() {
            var orgUnitPath = "/";
            var userJSON = {"name": "test name", "id": "12345", "orgUnitPath": orgUnitPath};
            addUserToOUByPath(data, orgUnitPath, userJSON);
            expect(data.data.users.length).toEqual(1);
            done();
        });
    });

    it("add user to childpath", function(done) {
        $.getScript('/src/main/webapp/scripts/user-script.js', function() {
            var orgUnitPath = "/East-coast";
            var userJSON = {"name": "test user", "id": "23456", "orgUnitPath": orgUnitPath};
            expect(data.children[0].data.users.length).toEqual(0);
            addUserToOUByPath(data, orgUnitPath, userJSON);
            expect(data.children[0].data.users.length).toEqual(1);
            done();
        });
    });
    
});

// describe("Test d3js", function() {
//     var userGroups = [
//             {
//                 "id": "107619745798990508895",
//                 "name": "wenyi guo",
//                 "parent": null
//             },
//             {
//                 "id": "01d96cc03ttea2i",
//                 "name": "cornell-2022",
//                 "parent": "wenyi guo"
//             },
//             {
//                 "id": "02p2csry3w979pn",
//                 "name": "test-group-exclude-dolde",
//                 "parent": "wenyi guo"
//             }
//             ]

//     $.getScript('/src/main/webapp/scripts/user-script.js', function() {   
//         it("test visualize", function() {
//             visualizeUser(userGroups, "user-groups");

//             var svg = $('svg').first();
//             expect(svg).not.toBe(null);
//             expect(svg.children().first().length).toEqual(3);
//         });
//     });
// });


