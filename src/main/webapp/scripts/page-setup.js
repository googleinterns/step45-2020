var CLIENT_ID = '597140288373-39l6n11c305hjurg77f99ue04gnp4evh.apps.googleusercontent.com';
var windowstr;
var REDIRECT_URI;
var domain;
if(typeof windowstr === "undefined"){
    windowstr = window.location.href;
    REDIRECT_URI = windowstr.substring(
        0, windowstr.lastIndexOf("/")
    );
}

var fragmentString = location.hash.substring(1);

/** Global variables */
var isLoggedIn = false;
var token;
var domain;

// Parse query string to see if page request is coming from OAuth 2.0 server.
var params = {}
var regex = /([^&=]+)=([^&]*)/g, m;
while (m = regex.exec(fragmentString)) {
    params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
}
if (Object.keys(params).length > 0) {
    localStorage.setItem('oauth2-test-params', JSON.stringify(params));
}

// If there's an access token, try an API request.
// Otherwise, start OAuth 2.0 flow.
function checkLoginAndSetUp() {
    params = JSON.parse(localStorage.getItem('oauth2-test-params'));
    if (params && params['access_token']) {
        // user is logged in
        isLoggedIn = true;
        token = params['access_token'];
        getDomain();
        updateIndexPage();
        getUserProfile();
        checkSessionExpired();
    } else {
        // user is not logged in
        logout();
    }
}

// If isLoggedIn is true, then show the 3 main pages and the navbar
// Otherwise, show tcheckLoginAndSetUp form page
function updateIndexPage() {
    var pageTitle = document.getElementsByClassName("page-title")[0];
    if (isLoggedIn) {
        showElements(["header-navbar", pageTitle, "home-container"]);
        hideElements(["login-navbar", "login-form-container"]);
    } else {
        hideElements(["header-navbar", pageTitle, "home-container"]);
        showElements(["login-navbar", "login-form-container"]);
    }
}

/** Get the profile of the currently signed in user */
function getUserProfile() {
    fetch('https://www.googleapis.com/oauth2/v1/userinfo?access_token=' + token)
    .then(response => response.json())
    .then((user_info) => {
        console.log(user_info);
        if(user_info.error){
            console.log("user info error");
            logout();
        } else {
            document.getElementById("dropdown-user-item").href = "/pages/userdetails.html?user=" + user_info.id;
            document.getElementById("dropdown-user-picture").src = user_info.picture;
            document.getElementById("dropdown-user-name").innerHTML = user_info.name;
            document.getElementById("dropdown-user-email").innerHTML = user_info.email;
        }
    })
    .catch((error) => {
        console.error(error);
    });
}

function oauth2SignIn() {
    // Google's OAuth 2.0 endpoint for requesting an access token
    var oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth';

    // Create element to open OAuth 2.0 endpoint in new window.
    var form = document.createElement('form');
    form.setAttribute('method', 'GET'); // Send as a GET request.
    form.setAttribute('action', oauth2Endpoint);
    // http scopes
    var scopeArray = [
        'https://www.googleapis.com/auth/admin.directory.orgunit',
        'https://www.googleapis.com/auth/admin.directory.group',
        'https://www.googleapis.com/auth/admin.directory.user', 
        'https://www.googleapis.com/auth/admin.directory.customer.readonly', 
        'https://www.googleapis.com/auth/apps.groups.settings',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
    ];
    // Parameters to pass to OAuth 2.0 endpoint.
    var params = {'client_id': CLIENT_ID,
                    'redirect_uri': REDIRECT_URI,
                    'scope': scopeArray.join(' '), // join all urls in scopeArray with space inbetween them
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
    // if user is not on index page, redirect
    if (window.location.href.substr(window.location.href.length - 10) != "index.html") {
        window.location.href = "../index.html";
    }
    updateIndexPage();
}

// if the user's oauth session is expired, force logout and prompt to log in again
function checkSessionExpired() {
    fetch('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + token)
    .then(response => response.json())
    .then((token_info) => {
        console.log(token_info);
        if (token_info.error) {
            console.log("token expires");
            logout();
        } else {
            console.log("token still valid");
        }
    })
    .catch((error) => {
        console.error(error);
    });
}

// store current domain of customer into local storage
function getDomain() {
    domain = localStorage.getItem('domain');
    if (!domain) {
        fetch('https://www.googleapis.com/admin/directory/v1/customers/my_customer', {
            headers: {
                'authorization': `Bearer ` + token,
            }
        })
        .then(response => response.json())
        .then((customer) => {
            console.log(customer);
            localStorage.setItem('domain', customer.customerDomain);
            domain = localStorage.getItem('domain');
        })
        .catch((error) => {
            console.error(error);
        })
    }
}

// set loading icon while waiting for async calls
function setLoadingOverlay() {
    var overlay = document.getElementsByClassName("overlay");
    var overlayArray = Array.from(overlay);
    if (isLoading) {
        overlayArray.map(elem => elem.classList.remove("hidden"))
    } else {
        overlayArray.map(elem => elem.classList.add("hidden"))
    }
}

// Adds the class "hidden" to the array of elements
function hideElements(elementIds) {
    for (elemId of elementIds) {
        var elem = document.getElementById(elemId);
        if (elem) elem.classList.add("hidden");
    }
}

// Removes the class "hidden" from the array of elements
function showElements(elementIds) {
    for (elemId of elementIds) {
        var elem = document.getElementById(elemId);
        if (elem) elem.classList.remove("hidden");
    }
}

// toggle instruction icon
$(document).ready(function(){
    // Add minus icon for collapse element which is open by default
    $(".collapse.show").each(function(){
        $(this).prev(".card-header").find(".fa").addClass("fa-minus").removeClass("fa-plus");
    });
    
    // Toggle plus minus icon on show hide of collapse element
    $(".collapse").on('show.bs.collapse', function(){
        $(this).prev(".card-header").find(".fa").removeClass("fa-plus").addClass("fa-minus");
    }).on('hide.bs.collapse', function(){
        $(this).prev(".card-header").find(".fa").removeClass("fa-minus").addClass("fa-plus");
    });
});