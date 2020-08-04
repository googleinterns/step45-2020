var UIFramework = (function() {
    function button(id, onclick) {
        var element = document.createElement("button");
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

    function select(id, onchange) {
        var element = document.createElement("input");
        element.id = id;
        element.onchange = onchange;
        return element;
    }

    return {
        button: button,
        input: input
    }
})();

// groups-script.js
//  Groups visualization sidebar
//      Load groups sidebar information (loadGroupsSidebar)
//      Check if user selected filter options (checkGroupsSidebar(memberKey))
//  Groups search and filter
//      Clear searches and filters (clearFilters)
//      selectUser, selectOrderBy, selectViewGroups, checkParentGroups, checkFlattenGroups
//      Check that functions were called (getAllGroups, checkGroupsSidebar)
//  Groups editing
//      createGroup
//      selectRole
//      removeMember
//      addMember
// group-details-script.js
//  Group details sidebar
//      loadGroupDetailsSidebar (setGroupInformation, setGroupSettings)
//      getAccessType
//      setAccessMembershipSettingsTable(accessSettings)
//  Group editing
//      saveInformationForm
//      saveSettingsForm
//      selectAccessType
//      deleteGroup

// describe("Test groups search and filters", function() {
//     var checkbox1 = UIFramework.input("checkbox", "checkbox-value1");
    
//     it("test adding and removing orgunits to filter", function(done) {
//         var orgUnitInput = ["checkbox-value1"];

//         $.getScript('/src/main/webapp/scripts/users-script.js', function() { 
//             spyOn(window, "clearSearch");
//             spyOn(window, "loginStatus");
//             spyOn(window, "fetchOUs");

//             // uncheck to remove input from orgUnitInput
//             checkbox1.checked = false;
//             expect(orgUnitInput).toEqual(["checkbox-value1"]);
//             orgUnitInput = updateOrgUnitInput(checkbox1);
//             expect(orgUnitInput).toEqual([]);

//             // check to add input to orgUnitInput
//             checkbox1.checked = true;
//             orgUnitInput = updateOrgUnitInput(checkbox1);
//             expect(orgUnitInput).toEqual(["checkbox-value1"]);
//             done();
//         });
//     });
// });

// describe("Test add user to data", function(){
//     var data = {
//         data: {name: "GRoot Test", path: "/", parentPath: null, users: [], numUsers: 3},
//         children:[
//             {data: {name: "East-coast", path: "/East-coast", parentPath: "/", users: [], numUsers: 3}}
//         ]
//     }

//     it("add user to childpath", function(done) {
//         $.getScript('/src/main/webapp/scripts/users-script.js', function() {
//             var orgUnitPath = "/East-coast";
//             var userJSON = {"name": "test user", "id": "23456", "orgUnitPath": orgUnitPath};
//             expect(data.children[0].data.users.length).toEqual(0);
//             addUserToOUByPath(data, orgUnitPath, userJSON);
//             expect(data.children[0].data.users.length).toEqual(1);
//             done();
//         });
//     });
// });
