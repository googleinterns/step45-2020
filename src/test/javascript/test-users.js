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

describe("Test checkboxes", function() {
    var checkbox1 = UIFramework.input("checkbox", "checkbox-value1");
   
    it("test adding and removing orgunits to filter", function(done) {
        var orgUnitInput = ["checkbox-value1"];

        $.getScript('/src/main/webapp/scripts/users-script.js', function() { 
            spyOn(window, "clearSearch");
            spyOn(window, "checkLoginAndSetUp");
            spyOn(window, "fetchOUs");

            // uncheck to remove input from orgUnitInput
            checkbox1.checked = false;
            expect(orgUnitInput).toEqual(["checkbox-value1"]);
            orgUnitInput = updateOrgUnitInput(checkbox1);
            expect(orgUnitInput).toEqual([]);

            // check to add input to orgUnitInput
            checkbox1.checked = true;
            orgUnitInput = updateOrgUnitInput(checkbox1);
            expect(orgUnitInput).toEqual(["checkbox-value1"]);
            done();
        });
    });

    it("test adding and removing groups to filter", function(done) {
        var groupInput = [];

        $.getScript('/src/main/webapp/scripts/users-script.js', function() { 
            spyOn(window, "clearSearch");
            spyOn(window, "checkLoginAndSetUp");
            spyOn(window, "fetchOUs");

            checkbox1.id = checkbox1.value;
            checkbox1.checked = true;
            groupInput = updateGroupInput(checkbox1);
            expect(groupInput).toEqual(["checkbox-value1"]);
            done();
        });
    });
});

describe("Test add user to data", function(){
    var data = {
        data: {name: "GRoot Test", path: "/", parentPath: null, users: [], numUsers: 3},
        children:[
            {data: {name: "East-coast", path: "/East-coast", parentPath: "/", users: [], numUsers: 3}}
        ]
    }

    it("add user to root", function(done) {
        expect(data.data.users.length).toEqual(0);
        $.getScript('/src/main/webapp/scripts/users-script.js', function() {
            var orgUnitPath = "/";
            var userJSON = {"name": "test name", "id": "12345", "orgUnitPath": orgUnitPath};
            window.addUserToOUByPath(data, orgUnitPath, userJSON);
            expect(data.data.users.length).toEqual(1);
            done();
        });
    });

    it("add user to childpath", function(done) {
        $.getScript('/src/main/webapp/scripts/users-script.js', function() {
            var orgUnitPath = "/East-coast";
            var userJSON = {"name": "test user", "id": "23456", "orgUnitPath": orgUnitPath};
            expect(data.children[0].data.users.length).toEqual(0);
            addUserToOUByPath(data, orgUnitPath, userJSON);
            expect(data.children[0].data.users.length).toEqual(1);
            done();
        });
    });
    
});

