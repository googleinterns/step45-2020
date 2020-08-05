beforeEach(function () {
    loadFixtures('test-user.html');
});

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
        var testid = document.getElementById("num-filter-users");
        testid.innerText = 5;

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

describe("Test building org unit path for single user", function(){
    var flatdata = [
        {name: "West-coast", path: "/West-coast", parentPath: "/", users: []},
        {name: "East-coast", path: "/East-coast", parentPath: "/", users: []},
        {name: "GRoot Test", path: "/", parentPath: null, users: []}
    ];

    it("org unit path with 1 level", function(done) {
        var singleBranchOUs = [];
        $.getScript('/src/main/webapp/scripts/user-details-script.js', function() {
            addOUToSingleBranch("/", singleBranchOUs, flatdata);
            expect(singleBranchOUs.length).toEqual(1);
            expect(singleBranchOUs[0].path).toEqual('/');
            done();
        })
    })

    it("org unit path with 2 levels", function(done) {
        var singleBranchOUs = [];
        $.getScript('/src/main/webapp/scripts/user-details-script.js', function() {
            addOUToSingleBranch("/East-coast", singleBranchOUs, flatdata);
            expect(singleBranchOUs.length).toEqual(2);
            expect(singleBranchOUs[0].path).toEqual('/East-coast');
            expect(singleBranchOUs[1].path).toEqual('/');
            done();
        })
    })
});

describe("Test add path selections for editing org unit path for single user", function(){
    var ous = [
        {name: "West-coast", orgUnitPath: "/West-coast"},
        {name: "East-coast", orgUnitPath: "/East-coast"}
    ];

    it("addPathSelections", function(done) {
        $.getScript('/src/main/webapp/scripts/user-details-script.js', function() {
            expect($('#paths').children().length).toBe(0);
            addPathSelections(ous, "/East-coast");
            expect($('#paths').children().length).toBe(2);
            done();
        });
    });
});

describe("Test user details page: list groups", function(){
    var groups = [
        {id: "02y3w24745z8hy8", name: "AC SRE SVL", email: "acsresvl@groot-test.1bot2.info"},
        {id: "01d96cc03ttea2i", name: "cornell-2022", email: "cornell-class-of-2022@groot-test.1bot2.info"},
        {id: "02p2csry3w979pn", name: "test-group-exclude-dolde", email: "test-group-exclude-dolde@groot-test.1bot2.info"}
    ]

    it("addUserGroups with 3 groups", function(done) {
        $.getScript('/src/main/webapp/scripts/user-details-script.js', function() {
            expect($('#user-groups').children().length).toBe(0);
            addUserGroups(groups);
            expect($('#user-groups').children().length).toBe(3);
            done();
        });
    });

    it("addUserGroups with 0 group", function(done) {
        $.getScript('/src/main/webapp/scripts/user-details-script.js', function() {
            expect($('#user-groups').children().length).toBe(0);
            addUserGroups([]);
            expect($('#user-groups').children().length).toBe(0);
            done();
        });
    });
});
