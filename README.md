# GRoot
### The [STEP intern](https://buildyourfuture.withgoogle.com/programs/step/) project for Google's AC Admin SRE team.
Welcome to GRoot - Admin Console Visualizer! 

GRoot helps you to better visualize the structure and relationships for organizational units, groups, and users. You could also perform admin 
operations, such as adding, deleting, editing, smoothly with our interative interface.

![Organization Unit](src/Screenshot-OU?raw=true "Organization Unit")
![Group](src/Screenshot-Group?raw=true "Group")
![User](src/Screenshot-User?raw=true "User")

Because G Suite Admin SDK contains sensitive user data, to prevent potential privacy issues, we recommend you to clone 
our repository and make your own instance of GCP App Engine. 

### Clone the Repo and set up your own instance
1. Open up your terminal, we recommand [Google Cloud Shell](https://ssh.cloud.google.com/cloudshell/) if you have a Google account, you can log in with your admin account.
2. Use `cd` to change directory to your target path, then clone the repo: `git clone https://github.com/googleinterns/step45-2020.git`
3. `cd step45-2020`
4. `sudo apt install ./google-chrome-beta_current_amd64.deb`
5. run `$ mvn package appengine:run -DskipTests=true`
6. After seeing `Dev app Server is now running`, click the rectangle button left to three dots in top right -> `Preview on port 8080`, the project is not set up yet, but you need to copy your server url, i.e. https://8080-5686c74b-aced-4f8e-83f7-f129248a983f.us-east1.cloudshell.dev
7. `ctrl + c` to interrupt the running project. 

### Cloud console configuration
#### Create the project
In the cloud console (https://console.cloud.google.com/), first login to your test account, then select create your own project `groot`. Then, APIs & Services -> OAuth consent screen

#### Eable Admin SDK API
APIs & Services -> Dashboard -> ENABLE APIS AND SERVICES -> Search for `Admin SDK` -> ENABLE

#### OAuth Consent screen 
1. APIs & Services -> OAuth consent screen
2. Select `User Type` to be Internal, then click `Create`.
3. Click `Add scope`, then enter the following scopes: `https://www.googleapis.com/auth/admin.directory.orgunit`, `https://www.googleapis.com/auth/admin.directory.group`, `https://www.googleapis.com/auth/admin.directory.user`
4. Under `Authorized domains`, add `cloudshell.dev`
5. `Save` the changes

#### Credential
1. APIs & Services -> Credentials -> Create Credentials -> OAuth Client ID -> Web client 1
2. Click the edit button
3. Under Authorized JavaScript origins -> URIs and Authorized redirect URIs -> URIs, add your server url, i.e. https://8080-5686c74b-aced-4f8e-83f7-f129248a983f.us-east1.cloudshell.dev

### To run locally:
1. run `$ mvn package appengine:run -DskipTests=true` or `mvn package appengine:run` (the later command will run test cases)
   * This runs your localhost:8080 cloudshell server
   * Copy the URL from the browser search bar, i.e. https://8080-5686c74b-aced-4f8e-83f7-f129248a983f.us-east1.cloudshell.dev

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
3. `mvn test`

Alternatively, you can create a .customize_environment file based on the sample file provided under samples/ 
Cloud Shell will execute this script every time Cloud Shell starts.