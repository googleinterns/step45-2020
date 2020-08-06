# GRoot

### The [STEP intern](https://buildyourfuture.withgoogle.com/programs/step/) project for Google's AC Admin SRE team.
To get started run:
```mvn package appengine:run```

### OAuth steps:
1. In the cloud console (https://console.cloud.google.com/), first login to your test account, then select the project groot. Then, APIs & Services -> Credentials -> OAuth 2.0 Client IDs -> Web client 1
2. Click the edit button
3. Under Authorized JavaScript origins -> URIs and Authorized redirect URIs -> URIs, add your server url, i.e. https://8080-5686c74b-aced-4f8e-83f7-f129248a983f.us-east1.cloudshell.dev

### To run locally:
1. run `$ git add origin https://github.com/googleinterns/step45-2020.git`
2. run `$ git pull origin master`
3. run `$ mvn package appengine:run -DskipTests=true`
   * This runs your localhost:8080 cloudshell server
   * Copy the URL from the browser search bar, i.e. https://8080-5686c74b-aced-4f8e-83f7-f129248a983f.us-east1.cloudshell.dev
5. Go to the Google APIs & Services console for the project, and paste the URL you copied under the list of URIs under Authorized javaScript origins and Authorized Redirect URIs
   * see https://screenshot.googleplex.com/kAkHrgL8RJg (Google internal visibility)
6. Re-run your localhost server to view your changes
   * `$ mvn package appengine:run`
7. When you sign in, make sure to login with the test account, ending in @groot-test.1bot2.info

### Troubleshooting errors:
* `400 mismatch error`
  * Remember to have the exact URI in your code as the one in console.developers.google.com !! I had an extra slash at the end of my URI
* `403 error`
  * Remember to login with your test account
  * Do not use incognito window
  * If your google corp account is logged in automatically, open up the web console, then type “localStorage.clear();”
* `404 error`
  * Remember to follow step #4 in the instructions above
  
### Running tests
You can execute tests by running `mvn test` which will execute the javascript tests located under src/test/javascript
Mavin will download most of the requirments including the Chrome Webdriver, but Chrome will need to be installed. By default it uses the latest beta version.

For Cloud Shell, run the following commands at the start of your session to install Chrome beta
1. `wget https://dl.google.com/linux/direct/google-chrome-beta_current_amd64.deb`
2. `sudo apt install ./google-chrome-beta_current_amd64.deb`

Alternatively, you can create a .customize_environment file based on the sample file provided under samples/ 
Cloud Shell will execute this script every time Cloud Shell starts.

View manual tests here:
1. [Groups](/blob/master/src/test/manual/manual-test-groups.md)
