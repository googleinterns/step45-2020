var params = JSON.parse(localStorage.getItem('oauth2-test-params'));
var token = params['access_token'];

function getAllGroups(){
    // access token expires in 3600 sec after login; fix later
    console.log(token);
    fetch('https://www.googleapis.com/admin/directory/v1/groups?domain=groot-test.1bot2.info', {
    headers: {
        'authorization': `Bearer ` + token,
    }
    }).
    then(response => response.json())
    .then((res) => {
        console.log(res);
        loadSidebar(res.groups);
        loadGroups(res.groups);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

/* Fill in informational fields on the sidebar of the page */
function loadSidebar(groups) {
    
}

/* Create each of the group <div> elements and display them */
function loadGroups(groups) {
    let groupsContainer = document.getElementById("groups");
    for (var i = 0; i < groups.length; i++) {
        groupsContainer.appendChild(createGroupElement(groups[i]));
    }
}

/** Creates an <div> element for a group. */
function createGroupElement(group) {
    const divElement = document.createElement("div");
    divElement.classList.add("group")
    divElement.classList.add("card")

    const nameElement = document.createElement("h5");
    nameElement.classList.add("name")
    nameElement.innerText = group.name;
    divElement.appendChild(nameElement);

    const descriptionElement = document.createElement("div");
    descriptionElement.classList.add("description")
    descriptionElement.innerText = group.description;
    divElement.appendChild(descriptionElement);
    
    const emailElement = document.createElement("div");
    emailElement.classList.add("email")
    emailElement.innerText = group.email;
    divElement.appendChild(emailElement);
    
    const directMembersElement = document.createElement("span");
    directMembersElement.classList.add("direct-members")
    directMembersElement.innerText = group.directMembersCount + " direct members";
    divElement.appendChild(directMembersElement);

    return divElement;
}
