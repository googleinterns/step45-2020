var CLIENT_ID = '597140288373-39l6n11c305hjurg77f99ue04gnp4evh.apps.googleusercontent.com';
const str = window.location.href;
const REDIRECT_URI = str.substring(
    0, str.lastIndexOf("/")
);
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
}

// If there's an access token, try an API request.
// Otherwise, start OAuth 2.0 flow.
function loginStatus() {
    var params = JSON.parse(localStorage.getItem('oauth2-test-params'));
    if (params && params['access_token']) {
        // user is logged in
        isLoggedIn = true;
    } else {
        // user is not logged 
        isLoggedIn = false;
    }
    updateIndexPage();
}

function pagesLoginStatus(){
    var params = JSON.parse(localStorage.getItem('oauth2-test-params'));
    if (params && params['access_token']) {
        // user is logged in
        isLoggedIn = true;
    } else {
        // user is not logged 
        isLoggedIn = false;
        window.location.href = "../index.html";
        updateIndexPage();
    }
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
    isLoggedIn = false;
    window.location.href='/index.html';
    updateIndexPage();
}
