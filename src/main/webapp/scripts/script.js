var CLIENT_ID = '597140288373-39l6n11c305hjurg77f99ue04gnp4evh.apps.googleusercontent.com';
var REDIRECT_URI = 'https://8080-fc5ed130-8ae1-4bf8-b8f3-d2aab8ea572b.us-west1.cloudshell.dev';
var fragmentString = location.hash.substring(1);

var isLoggedIn = false;

// Parse query string to see if page request is coming from OAuth 2.0 server.
var params = {}
var regex = /([^&=]+)=([^&]*)/g, m;
while (m = regex.exec(fragmentString)) {
    params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
}
if (Object.keys(params).length > 0) {
    localStorage.setItem('oauth2-test-params', JSON.stringify(params) );
    if (params['state'] && params['state'] == 'try_sample_request') {
        loginStatus();
    }
}

// If there's an access token, try an API request.
// Otherwise, start OAuth 2.0 flow.
function loginStatus() {
    var params = JSON.parse(localStorage.getItem('oauth2-test-params'));
    if (params && params['access_token']) {
        // user is logged in
        isLoggedIn = true;
        getAllOUs(params['access_token']);
        // getAllGroups(params['access_token']);
        getAllUsers(params['access_token']);
    } else {
        // user is not logged in
        isLoggedIn = false;
    }
    updateIndexPage();
}

// If loginStatus is true, then show the 3 main pages and the navbar
// Otherwise, show the login form page
function updateIndexPage() {
    var headerNavbar = document.getElementById("header-navbar");
    var loginFormContainer = document.getElementById("login-form-container");
    if (isLoggedIn) {
        headerNavbar.classList.remove("hidden")
        loginFormContainer.classList.add("hidden")
    } else {
        headerNavbar.classList.add("hidden")
        loginFormContainer.classList.remove("hidden")
    }
}

function getAllOUs(token){
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

function getAllUsers(token){
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

function oauth2SignIn() {
    // Google's OAuth 2.0 endpoint for requesting an access token
    var oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth';

    // Create element to open OAuth 2.0 endpoint in new window.
    var form = document.createElement('form');
    form.setAttribute('method', 'GET'); // Send as a GET request.
    form.setAttribute('action', oauth2Endpoint);

    // Parameters to pass to OAuth 2.0 endpoint.
    var params = {'client_id': CLIENT_ID,
                    'redirect_uri': REDIRECT_URI,
                    'scope': 'https://www.googleapis.com/auth/admin.directory.orgunit https://www.googleapis.com/auth/admin.directory.group https://www.googleapis.com/auth/admin.directory.user', 
                    'state': 'pass-through value',
                    'include_granted_scopes': 'true',
                    'response_type': 'token'};

    // Add form parameters as hidden input values.
    for (var p in params) {
        var input = document.createElement('input');
        input.setAttribute('type', 'hidden');
        input.setAttribute('name', p);
        input.setAttribute('value', params[p]);
        form.appendChild(input);
    }

    // Add form to page and submit it to open the OAuth 2.0 endpoint.
    document.body.appendChild(form);
    form.submit();
    console.log(params);
}

function logout() {
    localStorage.clear();
    loginStatus();
}
