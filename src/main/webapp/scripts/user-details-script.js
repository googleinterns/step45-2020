/** Get current user of the page */
var queryString = window.location.search;
var urlParams = new URLSearchParams(queryString);
var userid = urlParams.get('user');
var singleBranchOUs = [];

/** User details page */
/** user detail onload */
async function userdetailOnload(){
    checkLoginAndSetUp(); 
    var response = await fetch("https://www.googleapis.com/admin/directory/v1/users/" + userid, {
    headers: {
        'authorization': `Bearer ` + token,
    }
    });
    var user = await response.json();
    var relations = user.relations ? user.relations : null;
    var manager;
    if(relations){
        for(var relation of relations){
            if(relation.type === "manager"){
                manager = relation.value;
            }
        }
    }
    document.getElementById("manager").innerText = manager ? manager : "No manager";
    document.getElementById("user-email").innerText = user.primaryEmail;
    document.getElementById("user-orgUnit").innerText = user.orgUnitPath;
    var userNameElements = document.getElementsByClassName("username");
    for (var username of userNameElements){
        username.innerText = user.name.fullName;
    }

    // set rename user modal default values
    document.getElementById("edit-firstname").value = user.name.givenName;
    document.getElementById("edit-lastname").value = user.name.familyName;
    document.getElementById("edit-email").value = user.primaryEmail.substring(0, user.primaryEmail.indexOf("@"));
    document.getElementById("email-domain").innerText = "@"+domain;
    
    var src = await getPhoto(user.id);
    document.getElementById("profile").src = src;
    getSingleBranchOfOU(user);

    /** delete group modal: click confirm delete to trigger the request */
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

/** retrive user profile image */
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
    var photoJSON = await response.json();
    var image = photoJSON.photoData;
    return "data:" + photoJSON.mimeType + ";base64," + image.replace(/_/g, '/').replace(/-/g,'+');
}

/** get the path of OUs for a single user */
async function getSingleBranchOfOU(user){
    var theUser = {"name": user.name.fullName, "path": user.name.fullName, "parent": user.orgUnitPath};
    singleBranchOUs.push(theUser);
    var response  = await fetch('https://www.googleapis.com/admin/directory/v1/customer/my_customer/orgunits?type=all', {
        headers: {
            'authorization': `Bearer ` + token,
        }
    });
    var ousJSON = await response.json();
    var ous = ousJSON['organizationUnits'];
    addPathSelections(ous, user.orgUnitPath);
    for(var eachOU of ous){
        var childElement = {"name": eachOU["name"], "path": eachOU["orgUnitPath"], "parentPath": eachOU["parentOrgUnitPath"], "users": []};
        flatdata.push(childElement);
    }
    // add root OrgUnit to data
    for(var eachOU of ous){
        if(eachOU['parentOrgUnitPath'] === "/"){
            var rootID = eachOU['parentOrgUnitId'];
            var rootResponse = await fetch('https://www.googleapis.com/admin/directory/v1/customer/my_customer/orgunits/' + rootID, {
                headers: {
                    'authorization': `Bearer ` + token,
                }
            });
            var root = await rootResponse.json();
            var rootElement = {"name": root["name"], "path": root["orgUnitPath"], "parentPath": null, "users": []};
            flatdata.push(rootElement);
            addOUToSingleBranch(user.orgUnitPath, singleBranchOUs, flatdata);

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
                setAttributes(icon, {"class": "fa fa-angle-right", "aria-hidden": "true"});
                oupath.append(icon);
                treeData = treeData.children[0];
            }
            var span = document.createElement("span");
            span.textContent = treeData.data.name;
            oupath.append(span);
            getGroups(user.id, user.name.fullName);

            break;
        }
    }  
}

/** iterate through list of all org units, add the ones are parent of current user layer by layer */
function addOUToSingleBranch(path, singleBranchOUs, flatdata){
    if(path === null){
        return;
    }
    for(var i = 0; i < flatdata.length; i++){
        if(flatdata[i].path === path){
            var branchOU = {"name": flatdata[i].name, "path": path, "parent": flatdata[i].parentPath};
            singleBranchOUs.push(branchOU);
            addOUToSingleBranch(flatdata[i].parentPath, singleBranchOUs, flatdata);
        }
    }
}

/** get the direct groups a user is in */
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
            for(var group of groups){
                groupElement = {"id": group.id, "name": group.name, "email": group.email};
                userGroups.push(groupElement);
                userGroupIds.push(group.id);
            }
        }
        console.log(userGroups);
        addUserGroups(userGroups);
        addGroupSelections(userGroupIds);
    })
    .catch((error) => {
        console.error(error);
    });
}

/** request to delete the user */
async function deleteUser(){
    var response = await fetch('https://www.googleapis.com/admin/directory/v1/users/' + userid,{
        method: 'DELETE',
        headers: {
            'authorization': `Bearer ` + token,
        }
    });
    window.location.replace("user.html");
}

/** display all groups (userGroups) the user is in */
function addUserGroups(userGroups){
    var container = document.getElementById("user-groups");
    for(var group of userGroups){
        var card = document.createElement("div");
        card.setAttribute("class", "card");
        var cardBody = document.createElement("div");
        cardBody.setAttribute("class", "card-body");

        var cardTitle = document.createElement("h5");
        cardTitle.setAttribute("class", "card-title");
        cardTitle.textContent = group.name;

        var cardText = document.createElement("p");
        cardText.setAttribute("class", "card-text");
        cardText.textContent = group.email;

        var cardLink = document.createElement("a");
        setAttributes(cardLink, {"class": "card-link", "href": "/pages/groupdetails.html?group=" + group.id});
        cardLink.textContent = "Click to view more";

        var deleteButton = document.createElement("button");
        setAttributes(deleteButton, {"class": "card-right btn btn-danger", "data-toggle": "modal", "data-target": "#deleteGroupModal", "data": group.id});
        
        var icon = document.createElement("i");
        setAttributes(icon, {"class": "fa fa-times", "aria-hidden": "true"});
        deleteButton.appendChild(icon);

        var cardBodyChildren = [cardTitle, cardText, cardLink, deleteButton];
        for(var cardBodyChild of cardBodyChildren){
            cardBody.appendChild(cardBodyChild);
        }
        
        card.appendChild(cardBody);
        container.appendChild(card);
    }
}

/** populate the selection for possible org unit paths to switch to */
function addPathSelections(ous, userpath){
    var pathsContainer = document.getElementById("paths");
    var selection = document.createElement("option");
    selection.setAttribute("value", "/");
    selection.innerHTML = "Root" + ":  " + "/";
    pathsContainer.append(selection);
    for (var ou of ous) {
        if(userpath == ou.orgUnitPath)
            continue;     
        var selection = document.createElement("option");
        selection.setAttribute("value", ou.orgUnitPath);
        selection.innerHTML = ou.name + "  " + ou.orgUnitPath;
        pathsContainer.append(selection);
    }
}

/** change the org unit path for current user */
async function changePath() {
    var sel = document.getElementById('paths');
    var response = await fetch('https://www.googleapis.com/admin/directory/v1/users/' + userid, {
        method: 'PUT',
        headers: {
            'authorization': `Bearer ` + token,
        },
        body: JSON.stringify({"orgUnitPath": sel.value})
    })
    location.reload();
}

/** populate the selection for possible groups the current user can add */
async function addGroupSelections(userGroupIds){
    var response = await fetch('https://www.googleapis.com/admin/directory/v1/groups?domain=' + domain + '&customer=my_customer', {
        headers: {
            'authorization': `Bearer ` + token,
        }
    });
    var groupsJSON = await response.json();
    var groups = groupsJSON.groups;
    var groupsContainer = document.getElementById("groups");
    for (var group of groups) {
        if(userGroupIds.includes(group.id))
            continue;
        var selection = document.createElement("option");
        selection.setAttribute("value", group.id);
        selection.textContent = group.name;
        groupsContainer.append(selection);
    }
}

/** add selected group for current user */
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

/** Helper function to set attributes for elments el */
function setAttributes(el, attrs) {
  for(var key in attrs) {
    el.setAttribute(key, attrs[key]);
  }
}