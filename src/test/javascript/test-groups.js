//  loadGroupsDFS(currGroup, parentGroup, groups, users, members)
//  Groups editing
//      createGroup
//      selectRole
//      removeMember
//      addMember

describe("Test main groups visualization page", function() {

    xit("Test depth first traversal with mock groups", function(done) {

        // $.getScript('/src/main/webapp/scripts/groups-script.js', function() {
            // spyOn(window, "loadGroupsDFS");
            // spyOn(window, "getUser");
            // spyOn(window, "getGroupMembers");
            // spyOn(window, "getGroup");

            var data = {
                "name": "test-domain@domain.info",
                "children": [],
            };
            var groups = [
                {
                    "description": "",
                    "directMembersCount": 4,
                    "email": "1@1.1",
                    "id": "1",
                    "name": "One",
                },
                {
                    "description": "",
                    "directMembersCount": 4,
                    "email": "2@2.2",
                    "id": "2",
                    "name": "Two",
                },
                {
                    "description": "",
                    "directMembersCount": 2,
                    "email": "3@3.3",
                    "id": "3",
                    "name": "Three",
                },
                {
                    "description": "",
                    "directMembersCount": 1,
                    "email": "4@4.4",
                    "id": "4",
                    "name": "Four",
                },
            ];
            var users = [
                {
                    "id": "a",
                    "name": {
                        "fullName": "Apple"
                    },
                    "primaryEmail": "a@a.a",
                    "roles": {
                        "1": "MEMBER", 
                        "2": "OWNER",
                    },
                },
                {
                    "id": "b",
                    "name": {
                        "fullName": "Banana"
                    },
                    "primaryEmail": "b@b.b",
                    "roles": {
                        "1": "MEMBER",
                    },
                },
                {
                    "id": "c",
                    "name": {
                        "fullName": "Cherry"
                    },
                    "primaryEmail": "c@c.c",
                    "roles": {
                        "2": "MEMBER",
                    },
                },
                {
                    "id": "d",
                    "name": {
                        "fullName": "Durian"
                    },
                    "primaryEmail": "d@d.d",
                    "roles": {
                        "2": "MANAGER",
                    },
                },
                {
                    "id": "e",
                    "name": {
                        "fullName": "Elderberry"
                    },
                    "primaryEmail": "e@e.e",
                    "roles": {
                        "3": "MEMBER",
                    },
                },
                {
                    "id": "f",
                    "name": {
                        "fullName": "Fig"
                    },
                    "primaryEmail": "f@f.f",
                    "roles": {
                        "3": "MANAGER",
                    },
                },
                {
                    "id": "g",
                    "name": {
                        "fullName": "Grapes"
                    },
                    "primaryEmail": "g@g.g",
                    "roles": {
                        "4": "MEMBER",
                    },
                },
            ];
            var members = {
                "1": [
                    {
                        "email": "a@a.a",
                        "id": "a",
                        "role": "MEMBER",
                        "type": "USER",
                    },
                    {
                        "email": "b@b.b",
                        "id": "b",
                        "role": "MEMBER",
                        "type": "USER",
                    },
                    {
                        "email": "2@2.2",
                        "id": "2",
                        "role": "MEMBER",
                        "type": "GROUP",
                    },
                    {
                        "email": "4@4.4",
                        "id": "4",
                        "role": "MEMBER",
                        "type": "GROUP",
                    },
                ],
                "2": [
                    {
                        "email": "c@c.c",
                        "id": "c",
                        "role": "MEMBER",
                        "type": "USER",
                    },
                    {
                        "email": "d@d.d",
                        "id": "d",
                        "role": "MANAGER",
                        "type": "USER",
                    },
                    {
                        "email": "a@a.a",
                        "id": "a",
                        "role": "OWNER",
                        "type": "USER",
                    },
                    {
                        "email": "3@3.3",
                        "id": "3",
                        "role": "MEMBER",
                        "type": "GROUP",
                    },
                ],
                "3": [
                    {
                        "email": "e@e.e",
                        "id": "e",
                        "role": "MEMBER",
                        "type": "USER",
                    },
                    {
                        "email": "f@f.f",
                        "id": "f",
                        "role": "MANAGER",
                        "type": "USER",
                    },
                ],
                "4": [
                    {
                        "email": "g@g.g",
                        "id": "g",
                        "role": "MEMBER",
                        "type": "USER",
                    },
                ],
            };

            // spyOn(data.children, "push");
            
            // var testDFS = async function(groups, users, members) {
                loadGroupsDFS(groups[0], null, groups, users, members).then(function(res) {
                    
                    expect(res).toBeDefined();
                    data.children.push(res);
                    expect(data.name).toEqual("test-domain@domain.info");
                    expect(data.children.length).toEqual(1);
                    expect(data.children[0]).toBeDefined();
                    expect(data.children[0]).not.toBeNull();
                    expect(data.children[0].name).toEqual("One");
                    done();
                });
                // return data;
            // }
            // var testDFSRes = testDFS(groups, users, members);

            // testDFSRes.then(function() {
                // expect(data.name).toEqual("test-domain@domain.info");
                // expect(data.children.length).toEqual(1);
                // expect(data.children[0]).toBeDefined();
                // expect(data.children[0]).not.toBeNull();
                // expect(data.children[0].name).toEqual("One");
                // expect(data.children[0].id).toEqual("1");
                // expect(data.children[0].value).toEqual(4);
                // expect(data.children[0].children.length).toEqual(4);

                var correctData = {
                    "name": "test-domain@domain.info",
                    "children": [
                        {
                            "name": "One",
                            "id": "1",
                            "value": 4,
                            "children": [
                                {
                                    "name": "Apple",
                                    "id": "a",
                                    "value": 1,
                                    "type": "USER",
                                },
                                {
                                    "name": "Banana",
                                    "id": "b",
                                    "value": 1,
                                    "type": "USER",
                                },
                                {
                                    "name": "Two",
                                    "id": "2",
                                    "value": 4,
                                    "children": [
                                        {
                                            "name": "Cherry",
                                            "id": "c",
                                            "value": 1,
                                            "type": "USER",
                                        },
                                        {
                                            "name": "Durian",
                                            "id": "d",
                                            "value": 1,
                                            "type": "USER",
                                        },
                                        {
                                            "name": "Apple",
                                            "id": "a",
                                            "value": 1,
                                            "type": "USER",
                                        },
                                        {
                                            "name": "Three",
                                            "id": "3",
                                            "value": 2,
                                            "children": [
                                                {
                                                    "name": "Elderberry",
                                                    "id": "e",
                                                    "value": 1,
                                                    "type": "USER",
                                                },
                                                {
                                                    "name": "Fig",
                                                    "id": "f",
                                                    "value": 1,
                                                    "type": "USER",
                                                },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    "name": "Four",
                                    "id": "4",
                                    "value": 1,
                                    "children": [
                                        {
                                            "name": "Grapes",
                                            "id": "g",
                                            "value": 1,
                                            "type": "USER",
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                };

                // expect(data).toEqual(correctData);


                // done();
            // })

            // expect(loadGroupsDFS).toHaveBeenCalled();
            // done();
            // expect(data.children.push).toHaveBeenCalled();
        // });
    });
});
