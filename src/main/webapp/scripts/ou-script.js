var params = JSON.parse(localStorage.getItem('oauth2-test-params'));
var token = params['access_token'];

function getAllOUs(){
    console.log(token);
    fetch('https://www.googleapis.com/admin/directory/v1/customer/my_customer/orgunits?orgUnitPath=/&type=all', {
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