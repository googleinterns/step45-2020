var params = JSON.parse(localStorage.getItem('oauth2-test-params'));
var token = params['access_token'];

function postAllOUs(){
    fetch('https://www.googleapis.com/admin/directory/v1/customer/my_customer/orgunits?type=all', {
    headers: {
        'authorization': `Bearer ` + token,
    }
    }).
    then(response => response.json())
    .then((ousjson) => {
        var ous = ousjson['organizationUnits'];
        postRootOU(ous);
        postChildOUs(ous);
        var parentPaths = new Set();
        for(var i = 0; i < ous.length; i++){
            parentPaths.add(ous[i]['parentOrgUnitPath']);
        }
        console.log(parentPaths);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

function postChildOUs(ous){
    var oulist = [];
    for(var i = 0; i < ous.length; i++){
        console.log(i);
        var ou = ous[i];
        var len = ou["orgUnitPath"].split("/").length;
        ou["depth"] = len;
        oulist.push(ou);
    }
    for(var i = 0; i < oulist.length; i++){
        postEachOU(oulist[i]);
    }
}

function postEachOU(ou){
    fetch("/user-storechildou", {
            method: 'POST',
                    body: JSON.stringify({
                        name: ou["name"],
                        path: ou["orgUnitPath"],
                        parentPath: ou["parentOrgUnitPath"],
                        depth: ou["depth"]
                    }),
                    headers: {
                        'Content-type': 'application/json; charset-UTF-8'
                    }
        }).
        then(response => response.json())
        .then((res) => {
            console.log(res);
        })  
        .catch((error) => {
            console.error('post ou Error:', error);
        });
}

function postRootOU(ous) {
    for(var i = 0; i < ous.length; i++){
        if(ous[i]['parentOrgUnitPath'] === "/"){
            var rootID = ous[i]['parentOrgUnitId'];
            console.log(rootID);
            fetch('https://www.googleapis.com/admin/directory/v1/customer/my_customer/orgunits/' + rootID, {
            headers: {
                'authorization': `Bearer ` + token,
            }
            }).
            then(response => response.json())
                .then((root) => {
                    console.log(root);
                    fetch("/user-storerootou", {
                        method: 'POST',
                        body: JSON.stringify({
                            name: root["name"],
                            path: root["orgUnitPath"],
                            parentPath: "root"
                        }),
                        headers: {
                            'Content-type': 'application/json; charset-UTF-8'
                        }
                    }).
                    then(response => response.json())
                        .then((res) => {
                            console.log(res);    
                        })  
                })
            .catch((error) => {
                console.error('Root Error:', error);
            });
            break;
        }
    }
}

function getOUs(){
    fetch("/get-ous").then(response => response.json())
    .then((ous) => {
        console.log(ous);
        const ousElement = document.getElementById('ous-container');
        ousElement.textContent = JSON.stringify(ous);
    })
    .catch((error) => {
        console.error(error);
    })
}


function getAllUsers(){
    console.log(token);
    fetch('https://www.googleapis.com/admin/directory/v1/users?domain=groot-test.1bot2.info', {
        headers: {
            'authorization': `Bearer ` + token,
        }
        }).
        then(response => response.json())
        .then((ous) => {
            console.log(ous);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

