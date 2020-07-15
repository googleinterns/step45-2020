var params = JSON.parse(localStorage.getItem('oauth2-test-params'));
var token = params['access_token'];
var domain = "groot-test.1bot2.info";

/*
 * Deletes an existing OU given its path.
*/
function deleteOU() {
    const ouPath = document.getElementById('delete-path').value;
    
    fetch(('https://www.googleapis.com/admin/directory/v1/customer/my_customer/orgunits/' + ouPath), {
    headers: {
        'authorization': `Bearer ` + token,
    },
    method: 'DELETE'
    })
    .then(response => {
        // refresh the page (getAllOUs call alone doesn't work, as puts new visual directly above old)
        location.reload();
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

/*
 * Adds a new OU given a name, the parent's path, and (optionally) description / inheritance setting.
*/
function createOU() {
    var parentPath = '/' + document.getElementById('create-path').value.trim();
    var name = document.getElementById('create-name').value.trim();
    var descript =  document.getElementById('create-descript').value.trim();
    var blockInherit = document.getElementById('create-inherit').value.trim();

    if (blockInherit == 'block') {
        blockInherit = true;
    } else {
        blockInherit = false;
    }

    var newOU = {
            "name": name,
            "description": descript,
            "parentOrgUnitPath": parentPath,
            "blockInheritance": blockInherit
        };

    fetch(('https://www.googleapis.com/admin/directory/v1/customer/my_customer/orgunits'), {
    headers: {
        'authorization': `Bearer ` + token,
        'dataType': 'application/json',
        'Content-Type': 'application/json'
    },
    method: 'POST',
    body: JSON.stringify(newOU)
    })
    .then(response => {
        // refresh the page (getAllOUs call alone doesn't work, as puts new visual directly above old)
        location.reload();
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

/*
 * Updates an OU with a new name, parent path, description, or inheritance setting.
*/
function updateOU() {

    var updateOU = {};

    var ouPath = document.getElementById('update-path').value.trim();

    var parentPath = document.getElementById('update-parent-path').value.trim();
    var name = document.getElementById('update-name').value.trim();
    var descript =  document.getElementById('update-descript').value.trim();
    var blockInherit = document.getElementById('update-inherit').value.trim();

    // update fields if non-empty
    if (parentPath != '') {
        updateOU.parentOrgUnitPath = '/' + parentPath;
    }
    if (name != '') {
        updateOU.name = name;
    }
    if (descript != '') {
        updateOU.description = descript;
    }
    if (blockInherit == 'block') {
        updateOU.blockInheritance = true;
    }
    if (blockInherit == 'unblock') {
        updateOU.blockInheritance = false;
    }

    fetch(('https://www.googleapis.com/admin/directory/v1/customer/my_customer/orgunits/' + ouPath), {
    headers: {
        'authorization': `Bearer ` + token,
        'dataType': 'application/json',
        'Content-Type': 'application/json'
    },
    method: 'PUT',
    body: JSON.stringify(updateOU)
    })
    .then(response => {
        // refresh the page (getAllOUs call alone doesn't work, as puts new visual directly above old)
        // location.reload();
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}