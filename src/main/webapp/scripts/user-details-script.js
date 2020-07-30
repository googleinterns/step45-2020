const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
var userid = urlParams.get('user');

/** User details page */
// user detail onload
async function userdetailOnload(){
    loginStatus(); 
    var response = await fetch("https://www.googleapis.com/admin/directory/v1/users/" + userid, {
    headers: {
        'authorization': `Bearer ` + token,
    }
    });
    var user = await response.json();
    var relations = user.relations ? user.relations : null;
    var manager;
    if(relations){
        for(var i = 0; i < relations.length; i++){
            if(relations[i].type === "manager"){
                manager = relations[i].value;
            }
        }
    }
    var managerElement = document.getElementById("manager");
    managerElement.innerText = manager ? manager : "No manager";

    var userNameElement = document.getElementById("user-name");
    userNameElement.innerText = user.name.fullName;
    var userEmailElement = document.getElementById("user-email");
    userEmailElement.innerText = user.primaryEmail;
    var userOrgUnitElement = document.getElementById("user-orgUnit");
    userOrgUnitElement.innerText = user.orgUnitPath;
    var userName2Element = document.getElementsByClassName("username");

    // set rename user modal default values
    var firstnameInput = document.getElementById("edit-firstname");
    firstnameInput.value = user.name.givenName;
    var lastnameInput = document.getElementById("edit-lastname");
    lastnameInput.value = user.name.familyName;
    var emailInput = document.getElementById("edit-email");
    emailInput.value = user.primaryEmail.substring(0, user.primaryEmail.indexOf("@"));
    var emailDomainElement = document.getElementById("email-domain");
    emailDomainElement.innerText = "@"+domain;

    for (var i = 0; i < userName2Element.length; i++){
        each = userName2Element[i];
        console.log(each);
        each.innerText = user.name.fullName;
    }
    var src = await getPhoto(user.id);
    var imageElement = document.getElementById("profile");
    imageElement.src = src;
    getSingleBranchOfOU(user);

    // delete group modal: click confirm delete to trigger the request
    $('#deleteGroupModal').on('show.bs.modal', function (event) {
        var groupId = $(event.relatedTarget).siblings(".card-text")[0].textContent;
        $('#delete-group').click(async function() {
            var response = await fetch('https://www.googleapis.com/admin/directory/v1/groups/' + groupId + '/members/' + userid, {
                method: 'DELETE',
                headers: {
                'authorization': `Bearer ` + token,
                }
            });
            console.log(response);
            location.reload();
        });
    });
}

// retrive user profile image
async function getPhoto(userid){
    try{
        var response = await fetch("https://www.googleapis.com/admin/directory/v1/users/" + userid + "/photos/thumbnail", {
            headers: {
                'authorization': `Bearer ` + token,
            }
        });
        if(response.status === 404){
            Promise.reject('The user hasnt uploaded profile image.');
            return '../images/default-profile.jpeg';
        }
    }
    catch(err){
        console.log(error); 
    }
    var json = await response.json();
    var image = json.photoData;
    return "data:" + json.mimeType + ";base64," + image.replace(/_/g, '/').replace(/-/g,'+');
}

// get the path of OUs for a single user
function getSingleBranchOfOU(user){
    var singleBranchOUs = [];
    var theUser = {"name": user.name.fullName, "path": user.name.fullName, "parent": user.orgUnitPath};
    singleBranchOUs.push(theUser);
    fetch('https://www.googleapis.com/admin/directory/v1/customer/my_customer/orgunits?type=all', {
    headers: {
        'authorization': `Bearer ` + token,
    }
    }).
    then(response => response.json())
    .then((ousjson) => {
        var ous = ousjson['organizationUnits'];
        addPathSelections(ous, user.orgUnitPath);
        for(var i = 0; i < ous.length; i++){
            var eachOU = ous[i];
            var childElement = {"name": eachOU["name"], "path": eachOU["orgUnitPath"], "parentPath": eachOU["parentOrgUnitPath"], "users": []};
            flatdata.push(childElement);
        }
        // add root OrgUnit to data
        for(var i = 0; i < ous.length; i++){
            if(ous[i]['parentOrgUnitPath'] === "/"){
                var rootID = ous[i]['parentOrgUnitId'];
                fetch('https://www.googleapis.com/admin/directory/v1/customer/my_customer/orgunits/' + rootID, {
                headers: {
                    'authorization': `Bearer ` + token,
                }
                }).
                then(response => response.json())
                    .then((root) => {
                        console.log(root);
                        var rootElement = {"name": root["name"], "path": root["orgUnitPath"], "parentPath": null, "users": []};
                        flatdata.push(rootElement);
                        addOUToSingleBranch(user.orgUnitPath);
                        // convert flatdata to nested
                        treeData = d3.stratify()
                            .id(function(d) { return d.path; })
                            .parentId(function(d) { return d.parent; })
                            (singleBranchOUs);
                        
                        var oupath = document.getElementById("single-user-OU-branch");
                        while(treeData.children){
                            var span = document.createElement("span");
                            span.textContent = treeData.data.name;
                            oupath.append(span);
                            var icon = document.createElement("i");
                            icon.setAttribute("class", "fa fa-angle-right");
                            icon.setAttribute("aria-hidden", "true");
                            oupath.append(icon);
                            treeData = treeData.children[0];
                        }
                        var span = document.createElement("span");
                        span.textContent = treeData.data.name;
                        oupath.append(span);
                        getGroups(user.id, user.name.fullName);
                    })
                .catch((error) => {
                    console.error('Error:', error);
                });
                break;
            }
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });

    function addOUToSingleBranch(path){
        if(path === null){
            return;
        }
        for(var i = 0; i < flatdata.length; i++){
            if(flatdata[i].path === path){
                var branchOU = {"name": flatdata[i].name, "path": path, "parent": flatdata[i].parentPath};
                singleBranchOUs.push(branchOU);
                addOUToSingleBranch(flatdata[i].parentPath);
            }
        }
    }
}

// get the direct groups a user is in
function getGroups(userid, username){
    fetch("https://www.googleapis.com/admin/directory/v1/groups?userKey=" + userid,{
    headers: {
        'authorization': `Bearer ` + token,
    }
    }).
    then(response => response.json())
    .then((groupsJson) => {
        var userGroups = [];
        var userGroupIds = [];
        if(groupsJson.hasOwnProperty('groups')){
            groups = groupsJson.groups;
            for(var i = 0; i < groups.length; i++){
                var group = groups[i];
                groupElement = {"id": group.id, "name": group.name, "email": group.email, "parent": username};
                userGroups.push(groupElement);
                userGroupIds.push(group.id);
            }
        }
        addUserGroups(userGroups);
        addGroupSelections(userGroupIds);
    })
    .catch((error) => {
        console.error(error);
    });
}

// rename a user with input
async function renameUser(){
    var firstname = document.getElementById("edit-firstname").value;
    var lastname = document.getElementById("edit-lastname").value;
    var email = document.getElementById("edit-email").value + "@" + domain;
    var updatedInfo = {
        "primaryEmail": email,
        "name": {
        "givenName": firstname,
        "familyName": lastname
        }
    }
    var response = await fetch('https://www.googleapis.com/admin/directory/v1/users/' + userid,{
        method: 'PUT',
        headers: {
            'authorization': `Bearer ` + token,
            'dataType': 'application/json'
        },
        body: JSON.stringify(updatedInfo),
    })
    location.reload();
}

// request to delete the user
async function deleteUser(){
    var response = await fetch('https://www.googleapis.com/admin/directory/v1/users/' + userid,{
        method: 'DELETE',
        headers: {
            'authorization': `Bearer ` + token,
        }
    });
    window.location.replace("user.html");
}

// display all groups (userGroups) the user is in
function addUserGroups(userGroups){
    var container = document.getElementById("user-groups");
    for(var i = 0; i < userGroups.length; i++){
        var group = userGroups[i];
        var card = document.createElement("div");
        card.setAttribute("class", "card");
        var cardBody = document.createElement("div");
        cardBody.setAttribute("class", "card-body")
        var cardTitle = document.createElement("h5");
        cardTitle.setAttribute("class", "card-title");
        cardTitle.textContent = group.name;
        var cardText = document.createElement("p");
        cardText.setAttribute("class", "card-text");
        cardText.textContent = group.email;
        var cardLink = document.createElement("a");
        cardLink.setAttribute("class", "card-link");
        cardLink.setAttribute("href", "/pages/groupdetails.html?group=" + group.id);
        cardLink.textContent = "Click to view more";
        var deleteButton = document.createElement("button");
        deleteButton.setAttribute("class", "card-right btn btn-danger");
        deleteButton.setAttribute("data-toggle", "modal");
        deleteButton.setAttribute("data-target", "#deleteGroupModal");
        deleteButton.setAttribute("data", group.id)
        var icon = document.createElement("i");
        icon.setAttribute("class", "fa fa-times");
        icon.setAttribute("aria-hidden", "true");

        cardBody.appendChild(deleteButton);
        cardBody.appendChild(cardTitle);
        cardBody.appendChild(cardText);
        cardBody.appendChild(cardLink);
        deleteButton.appendChild(icon);
        card.appendChild(cardBody);
        container.appendChild(card);
    }
}

// populate the selection for possible org unit paths to switch to
function addPathSelections(ous, userpath){
    var pathsContainer = document.getElementById("paths");
    var selection = document.createElement("option");
    selection.setAttribute("value", "/");
    selection.innerHTML = "Root" + ":  " + "/";
    pathsContainer.append(selection);
    for (var i = 0; i < ous.length; i++) {
        if(userpath == ous[i].orgUnitPath)
            continue;     
        var selection = document.createElement("option");
        selection.setAttribute("value", ous[i].orgUnitPath);
        selection.innerHTML = ous[i].name + "  " + ous[i].orgUnitPath;
        pathsContainer.append(selection);
    }
}

// change the org unit path for current user
async function changePath() {
    var sel = document.getElementById('paths');
    var response = await fetch('https://www.googleapis.com/admin/directory/v1/users/' + userid, {
        method: 'PUT',
        headers: {
            'authorization': `Bearer ` + token,
        },
        body: JSON.stringify({"orgUnitPath": sel.value})
    })
    console.log(response);
    location.reload();
}

// populate the selection for possible groups the current user can add
async function addGroupSelections(userGroupIds){
    var response = await fetch('https://www.googleapis.com/admin/directory/v1/groups?domain=' + domain + '&customer=my_customer', {
        headers: {
            'authorization': `Bearer ` + token,
        }
    });
    var json = await response.json();
    var groups = json.groups;
    var groupsContainer = document.getElementById("groups");
    for (var i = 0; i < groups.length; i++) {
        if(userGroupIds.includes(groups[i].id))
            continue;
        var selection = document.createElement("option");
        selection.setAttribute("value", groups[i].id);
        selection.textContent = groups[i].name;
        groupsContainer.append(selection);
    }
}

// add selected group for current user
async function addGroup() {
    var sel = document.getElementById('groups');
    var newMember = {
        "id": userid,
        "role": "MEMBER"
    }
    var response = await fetch('https://www.googleapis.com/admin/directory/v1/groups/' + sel.value + '/members',{
        method: 'POST',
        headers: {
            'authorization': `Bearer ` + token,
        },
        body: JSON.stringify(newMember)
    })
    location.reload();
}
/** End of user details page */
