# Manual Testing
Many of the functions in `users.js` and `user-details.js` make API calls to admin SDK and are nested. It's hard to unit test them with Jasmine, so they are maunally tested as follow. 

###  Main users page sidebar
#### `addUserToData` case with search input 
_Search bar on the main users page sidebar for searching users by `name` or `email`_
| Test case | Expected Result | Observed Result (Y/N) |
| ------ | ------ | ------ |
| Press "enter" key to search by name prefix  | `addUserToData` with the 'if(searchInput)' case is called, the svg graph contains users match by name prefix | - [x] Y |
| Click the blue search icon button to search | Same result as above | - [x] Y |
| Press "enter" key or click blue search icon to search by user adress "admin@" | `addUserToData` with the 'if(searchInput)' case is called, the svg graph contains users match by email prefix | - [x] Y |
| Click the X button to clear search results | variable 'searchInput' is empty, 'addUserToData' executes the cases with no search input| - [x] Y |

#### `orderBy'
_Select dropdown menu under `Order by` to order users alphebatically_
| Test case | Expected Result | Observed Result (Y/N) |
| ------ | ------ | ------ |
| Under the order by dropdown menu, select first name | `orderBy` is called with order value `firstname` and display users ordered alphabetically by first name | - [x] Y |
| Under the order by dropdown menu, select last name | `orderBy` is called with order value `firstname` and display users ordered alphabetically by first name | - [x] Y |

### Manipulate users: add, delete, rename, edit org unit path, edit groups
#### `triggerAdd`
_Hover over org unit name to display the info card with add user button_
| Test case | Expected Result | Observed Result (Y/N) |
| ------ | ------ | ------ |
| Click the add user button under each org unit | A modal to add user under the certain org unit path would pop up with auto populated domain | - [x] Y |
| Enter a valid (with no empty field and password longer than 8 characters) new user information to add the user | POST API call to add a user is sent and response is success. The page would auto refresh and the new user would appear under the right org unit. | - [x] Y |
| Enter an invalid password less then 8 characters | An error message in red would appear immediately and the function won't execute API request even if clicking `add` | - [x] Y |
| Enter a user with empty field | An error message in red would appear after clicking `Add` and the function won't call API execute API request | - [x] Y |
| Enter a new user with existing email address | The API call would be exceuted and return reponse with error, a window would pop up displaying that there's an error | - [x] Y |

#### `triggerDelete`
_Hover over user name to display the info card with `delete user` icon. Or in user details page, click the `Delete User` button in sidebar_ 
| Test case | Expected Result | Observed Result (Y/N) |
| ------ | ------ | ------ |
| In `user.html` page, delete a user by clicking the delete icon on user info card | A modal would pop up for confirmation, if click `delete`, `triggerDelete` would be executed and call the DELETE API, the user would disappear inside the rectangle | - [x] Y |
| In `userdetails.httml` page, delete a user by clicking the delete button in the side bar | A modal would pop up for confirmation, if click `delete`, `triggerDelete` would be executed and the window will redirect to `user.html` page and the deleted user disappeaers | - [x] Y |

#### `renameModal` and `renameUser`
_Hover over user name to display the info card with `edit user` icon. Or in user details page, click the `Rename User` button in sidebar_
| Test case | Expected Result | Observed Result (Y/N) |
| ------ | ------ | ------ |
| In `user.html` page, rename a user by clicking the `edit` icon on user info card | A modal to rename user would pop up with auto populated information of the user currently, after editing the information and clicking `Rename`, `renameUser` is called, the PUT API request would be executed and the user would be renamed | - [x] Y |
| In `userdetails.html` page, rename a user by clicking the `rename` button in the side bar | A modal to rename user would pop up with auto populated information of the user currently, after editing the information and clicking `Rename`, `renameUser` is called, the PUT API request would be executed and the user would be renamed | - [x] Y |

#### `addPathSelections` and `changePath`
_In `userdetails.html` page, click the `Edit Path` button to change the org unit path for the user_
| Test case | Expected Result | Observed Result (Y/N) |
| ------ | ------ | ------ |
| In `userdetails.html`, click `Edit Path` button | `addPathSelections` is called, a modal to edit org unit path would pop up with a dropdown menu selection of all org units except the one the user is currently in | - [x] Y |
| Select the target org unit to change to, then click `Change` button | `changePath` is called, a PUT API request is executed, the user's org unit path would be changed | - [x] Y |

#### `addGroupSelections` and `addGroup`
_In `userdetails.html` page, click the `Add Group` button to assign the current user as a member of the additional group_
| Test case | Expected Result | Observed Result (Y/N) |
| ------ | ------ | ------ |
| In `userdetails.html`, click `Add group` button | `addGroupSelections` is called, a modal to add groups would pop up with a dropdown menu selection of all groups except the ones the user is currently a member of | - [x] Y |
| Select the target group to add, then click `Add` button | `addGroup` is called, a POST API request is executed, the user would be assignedj to the new group | - [x] Y |

#### `deleteGroupModal`
_In `userdetails.html` page, there's a red `delete` icon for each group the user is a member of, click it to remove the user from that group_
| Test case | Expected Result | Observed Result (Y/N) |
| ------ | ------ | ------ |
| Click any `delete` icon on the group cards | The group will disappear in the `userdetails.html` page | - [x] Y |



## Unit Testing

You can find the Jasmine unit testing scripts for groups in `test-groups.js` and `test-group-details.js` in the `src/test/javascript` directory.
