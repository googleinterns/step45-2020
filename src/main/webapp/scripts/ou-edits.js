/*
 * Opens the delete OU confirmation modal.
*/
function openDeleteModal() {
    const confirmDeleteElem = document.getElementById("delete-modal-orgunit");
    const chosenDeletePath = document.getElementById('delete-path');

    confirmDeleteElem.innerHTML = chosenDeletePath.value.trim();

    $('#delete-modal').modal('show');
}

/*
 * Deletes an existing OU given its path.
*/
function deleteOU() {
    loginStatus();
    $('#delete-modal').modal('hide');
    const deleteOUPath = document.getElementById('delete-path');
    
    fetch(('https://www.googleapis.com/admin/directory/v1/customer/my_customer/orgunits/' + deleteOUPath.value.trim()), {
    headers: {
        'authorization': `Bearer ` + token,
    },
    method: 'DELETE'
    })
    .then(response => {
        deleteOUPath.value = '';
        refreshOUPage();
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

/*
 * Adds a new OU given a name, the parent's path, and (optionally) description / inheritance setting.
*/
function createOU() {
    loginStatus();
    var parentPath = document.getElementById('create-path');
    var name = document.getElementById('create-name');
    var descript =  document.getElementById('create-descript');
    var blockInherit = document.getElementById('create-inherit');
    var boolInherit;

    if (blockInherit.value.trim() == 'block') {
        boolInherit = true;
    } else {
        boolInherit = false;
    }

    var newOU = {
            "name": name.value.trim(),
            "description": descript.value.trim(),
            "parentOrgUnitPath": '/' + parentPath.value.trim(),
            "blockInheritance": boolInherit
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
        parentPath.value = '';
        name.value = '';
        descript.value = '';
        blockInherit.value = '';

        refreshOUPage();
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

/*
 * Updates an OU with a new name, parent path, description, or inheritance setting.
*/
function updateOU() {
    loginStatus();

    var updateOU = {};

    var updateOUPath = document.getElementById('update-path');

    var parentPath = document.getElementById('update-parent-path');
    var name = document.getElementById('update-name');
    var descript =  document.getElementById('update-descript');
    var blockInherit = document.getElementById('update-inherit');

    // update fields if non-empty
    if (parentPath.value.trim() != '') {
        updateOU.parentOrgUnitPath = '/' + parentPath.value.trim();
    }
    if (name.value.trim() != '') {
        updateOU.name = name.value.trim();
    }
    if (descript.value.trim() != '') {
        updateOU.description = descript.value.trim();
    }
    if (blockInherit.value.trim() == 'block') {
        updateOU.blockInheritance = true;
    }
    if (blockInherit.value.trim() == 'unblock') {
        updateOU.blockInheritance = false;
    }

    fetch(('https://www.googleapis.com/admin/directory/v1/customer/my_customer/orgunits/' + updateOUPath.value.trim()), {
    headers: {
        'authorization': `Bearer ` + token,
        'dataType': 'application/json',
        'Content-Type': 'application/json'
    },
    method: 'PUT',
    body: JSON.stringify(updateOU)
    })
    .then(response => {
        updateOUPath.value = '';
        parentPath.value = '';
        name.value = '';
        descript.value = '';
        blockInherit.value = '';

        refreshOUPage();
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}