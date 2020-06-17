function startUsers(){
    getAllOUs();
}

function getAllOUs(){
    fetch('https://www.googleapis.com/admin/directory/v1/customer/my_customer/orgunits?orgUnitPath=/&type=all').then(response => response.json())
    .then((ous) => {
        console.log(ous);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}