# Manual Testing
Many of the functions in `groups.js` and `group-details.js` directly manipulate the HTML DOM, and due to the constraints of Jasmine not being able to check for modified DOM elements when running the groups script functions from the tests scripts, I manually tested my UI input fields, buttons, etc. 

###  Main groups page sidebar
#### `searchGroupName`
_Search bar on the main groups page sidebar for searching groups by `name`_
| Test case | Expected Result | Observed Result (Y/N) |
| ------ | ------ | ------ |
| Press keyboard "enter" key to search | `getAllGroups` is called with `query=name` returning new groups matching search query, search input field contains `name` | - [x] Y |
| Click the blue search icon button to search | Same result as above | - [x] Y |
| Select a user from the dropdown **and** with the search query | `getAllGroups` is called with `query=memberKey` returning new groups with that user, search input field is empty and user-sel dropdown contains `memberKey` | - [x] Y |
| Click the X button to clear search results | `getAllGroups` is called without a query parameter returning original groups, search input field is empty | - [x] Y |

#### `selectUser`
_Select dropdown input on the main groups page sidebar for filtering groups by `memberKey`, the user email address, to return all groups containing that member_
| Test case | Expected Result | Observed Result (Y/N) |
| ------ | ------ | ------ |
| Select a user from the dropdown | `getAllGroups` is called with `query=memberKey` returning new groups with that user, user-sel dropdown contains `memberKey` | - [x] Y |
| Search by group name **and** with a user selected | `getAllGroups` is called with `query=name` returning new groups matching search query, user-sel input shows "Select User..." and search input field contains `name` | - [x] Y |
| Select default "Select User..." from the dropdown | `getAllGroups` is called without a query parameter returning original groups, user-sel input field shows "Select User..." | - [x] Y |

#### `selectOrderBy`, `selectViewGroups`
_Select dropdown input on the main groups sidebar for filtering groups in order of `order_by` and only displaying `view_total` groups at once_
| Test case | Expected Result | Observed Result (Y/N) |
| ------ | ------ | ------ |
| Select "Email" from the order by dropdown | `getAllGroups` is called with `orderBy=email` returning new groups ordered by email alphabetically, order-by-sel dropdown shows "Email" | - [x] Y |
| Select any number from the view # of groups dropdown | `getAllGroups` is called with `maxResults=view_total` returning given number of groups, view-total-sel dropdown contains `view_total` | - [x] Y |

#### `checkParentGroups`, `checkFlattenGroups`
_Checkboxes on the main groups page sidebar for toggling the display of nested groups. By default, `showOnlyParentGroups` is true and `flattenGroups` is false._
| Test case | Expected Result | Observed Result (Y/N) |
| ------ | ------ | ------ |
| Check show parent groups | There are no repeating groups unless the group is a descendant of two or more parent groups | - [x] Y |
| Check show parent groups, check flatten groups |  There are no repeating groups unless the group is a descendant of two or more parent groups, but only the direct members of each group are shown (depth <= 2) | - [x] Y |
| Check flatten groups | All groups in a domain are shown, but only the direct members of each group are shown (depth <= 2 ) | - [x] Y |
| Check neither | All groups in a domain are shown, with all of their members | - [x] Y |

#### `clearFilters`
_Button on the main groups page sidebar to clear or reset all the searches and filters applied to the display_
| Test case | Expected Result | Observed Result (Y/N) |
| ------ | ------ | ------ |
| Click the "Reset all" button | `getAllGroups` is called with default parameters returning groups in a domain where there are no repeating groups unless the group is a descendant of two or more parent groups, search input field is empty, user-sel input field shows "Select User...", order-by-sel dropdown shows "Select category...", and view-total-sel dropdown shows 200, `showOnlyParentGroups` is true and `flattenGroups` is false | - [x] Y |

###  Group details page sidebar
#### `selectAccessType`
_Under the settings section of the group details page sidebar, the user can select a specific access type using the radio buttons to modify the access and membership settings for one group. There are 5 different access types: public, team, announcement only, restricted, and custom._
| Test case | Expected Result | Observed Result (Y/N) |
| ------ | ------ | ------ |
| Select public access type | Access and membership settings checkbox table is changed, anyone in the organization can join, and disallow members outside your organization | - [x] Y |
| Select team access type | Access and membership settings checkbox table is changed, anyone in the organization can ask, and disallow members outside your organization | - [x] Y |
| Select announcement only type | Access and membership settings checkbox table is changed, anyone in the organization can join, and disallow members outside your organization | - [x] Y |
| Select restricted access type | Access and membership settings checkbox table is changed, anyone in the organization can ask, and disallow members outside your organization | - [x] Y |
| Select custom type | Nothing changes | - [x] Y |

## Unit Testing

You can find the Jasmine unit testing scripts for groups in `test-groups.js` and `test-group-details.js` in the `src/test/javascript` directory.
