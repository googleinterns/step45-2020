// function startUsers(){
//     //getAllOUs();
// }

// var obj = {  
//   method: 'GET',
//   headers: {
//     'Accept': 'application/json',
//     'Content-Type': 'application/json',
//     'Origin': '',
//     'Host': 'www.googleapis.com'
//   },
//   body: JSON.stringify({
//     'client_id': '597140288373-39l6n11c305hjurg77f99ue04gnp4evh.apps.googleusercontent.com',
//     'client_secret': 'd4KvDD6EFR6k-WYzUG3DfEHu',
//     'grant_type': 'client_credentials'
//   })
// }

// function getAllOUs(){
//     fetch('https://www.googleapis.com/admin/directory/v1/customer/my_customer/orgunits?orgUnitPath=/&type=all', {
//     headers: {
//         Authorization: `token ${token}`
//     }
//     }).
//     then(response => response.json())
//     .then((ous) => {
//         console.log(ous);
//     })
//     .catch((error) => {
//         console.error('Error:', error);
//     });
// }

// function onSignIn(googleUser){
//     console.log(googleUser.getBasicProfile(googleUser));
//     getAllOUs();
// }

// function signOut() {
//   gapi.auth2.getAuthInstance().signOut().then(function() {
//     console.log('user signed out')
//   })
// }
var YOUR_CLIENT_ID = '597140288373-39l6n11c305hjurg77f99ue04gnp4evh.apps.googleusercontent.com';
var YOUR_REDIRECT_URI = 'd4KvDD6EFR6k-WYzUG3DfEHu';
var fragmentString = location.hash.substring(1);

// Parse query string to see if page request is coming from OAuth 2.0 server.
var params = {};
var regex = /([^&=]+)=([^&]*)/g, m;
while (m = regex.exec(fragmentString)) {
params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
}
if (Object.keys(params).length > 0) {
localStorage.setItem('oauth2-test-params', JSON.stringify(params) );
if (params['state'] && params['state'] == 'try_sample_request') {
    trySampleRequest();
}
}

// If there's an access token, try an API request.
// Otherwise, start OAuth 2.0 flow.
function trySampleRequest() {
var params = JSON.parse(localStorage.getItem('oauth2-test-params'));
if (params && params['access_token']) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET',
        'https://www.googleapis.com/drive/v3/about?fields=user&' +
        'access_token=' + params['access_token']);
    xhr.onreadystatechange = function (e) {
    if (xhr.readyState === 4 && xhr.status === 200) {
        console.log(xhr.response);
    } else if (xhr.readyState === 4 && xhr.status === 401) {
        // Token invalid, so prompt for user permission.
        oauth2SignIn();
    }
    };
    xhr.send(null);
} else {
    oauth2SignIn();
}
}

/*
* Create form to request access token from Google's OAuth 2.0 server.
*/
function oauth2SignIn() {
    // Google's OAuth 2.0 endpoint for requesting an access token
    var oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth';

    // Create element to open OAuth 2.0 endpoint in new window.
    var form = document.createElement('form');
    form.setAttribute('method', 'GET'); // Send as a GET request.
    form.setAttribute('action', oauth2Endpoint);

    // Parameters to pass to OAuth 2.0 endpoint.
    var params = {'client_id': '597140288373-39l6n11c305hjurg77f99ue04gnp4evh.apps.googleusercontent.com',
                    'redirect_uri': 'https://8080-5686c74b-aced-4f8e-83f7-f129248a983f.us-east1.cloudshell.dev',
                    'scope': 'https://www.googleapis.com/auth/admin.directory.orgunit',
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
}