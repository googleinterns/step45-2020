# Manual Testing
Several of the functions across `ou-main.js`, `ou-edits.js`,  `ou-utils.js`, and `ou-visual.js` directly manipulate the HTML DOM or reference global variables, and due to the constraints of Jasmine not being able to check for modified DOM elements when running script functions from the tests scripts, I manually tested UI input fields, buttons, etc.

###  OU page sidebar
#### `executeSearch`
_Search bar on the OU page sidebar for searching organizational units by `name`_
| Test case | Expected Result | Observed Result (Y/N) |
| ------ | ------ | ------ |
| Press keyboard "enter" key to search | `searchOU` is called with `seachName=searchBar.value` and returns the OU matching the query as well as its parents up to `root`. Search input field contains the `searchName` | - [x] Y |
| Click the blue search icon button to search | Same result as above | - [x] Y |
| Search for an OU that doesn't exist | `renderOUs` is called with `displayOUs=[]`, prompting a no search results screen. Search input field contains the unmatched query | - [x] Y |
| Create a search with multiple matching OUs | `multiple-query-modal` is displayed to the user, with a dropdown containing all matching OUs for the user to select from. Closing the modal does not affect the visualization and the query remains in the search bar | - [x] Y |
| Search after limiting layers | 1. If the layers from `root` to the searched org unit exceed `layersToRender`, only the top `layersToRender` number of possible layers will be displayed - this will be reflected by the sidebar stating you are displaying `layersToRender` number of layers out of the total parent to child layers.  2. If the layers from `root` to the searched org unit fall below `layersToRender`, then `layersToRender` will be automatically adjusted to the max layers displayable. | - [x] Y |
| Click the X button to clear search results | `executeSearch` is called without a query parameter resulting in `renderOUs` returning all OUs, search input field is empty | - [x] Y |

#### `renderLayers`
_Number input on the OU page sidebar for limiting how many layers of the OU tree the user would like to render_
| Test case | Expected Result | Observed Result (Y/N) |
| ------ | ------ | ------ |
| Upon load or if the user provides no input | By default, only the top 3 layers of the tree are displayed. If the total number of layers is < 3, display all and update the layers value in the UI sidebar to default to this total (rather than 3) | - [x] Y |
| Negative input | Same as above | - [x] Y |
| Non-integer input | If negative, see above. If positive, displays `int(input)` layers, or `totalLayers` if the former is greater than the latter | - [x] Y |

###  OU data visualization

#### `constructD3JSON`
_Builds the tree-like JSON that is then passed into the `visualize` function in `ou-visual.js`_
| Test case | Expected Result | Observed Result (Y/N) |
| ------ | ------ | ------ |
| Upon any visualization load (Onload, Search, Limit Layers, Reset) | Tree or Parent Path represented at all times matches the structure of the data as depicted in the Google Admin Console | - [x] Y |

#### `ou-visual.js`
_All visualization code and interactivity_
| Test case | Expected Result | Observed Result (Y/N) |
| ------ | ------ | ------ |
| [Visualization] node click | The path to this node will autopopulate the OU path field for the Create, Update, and Delete tabs in the `Edit Console`. If the node is a parent, its children will be collapsed/revealed and the node color filling will change | - [x] Y |
| [Visualization] mouse click and drag |  The visualization will translate in the 2D plane according to the direction of the user's drag gesture. Note that one can possibly drag the visualization off the screen, in which case the `Reset Visualization` tool in the sidebar should be used | - [x] Y |
| [Visualization] mouse wheel | The magnification of the visualization will be adjusted per the user's mouse wheel scroll. Limits on how far in / out a user can zoom are enforced | - [x] Y |
| [Edit Console] `edit-choice` | Form input fields will automatically update based on which edit selection a user makes | - [x] Y |

#### Edge Case Checks
_Additional potentially hazardous user flows that were manually tested and resolved_
| Test case | Expected Result | Observed Result (Y/N) |
| ------ | ------ | ------ |
| No org units in the customer domain, resulting in `orgUnits=undefined` | `orgUnits` is checked for being undefined, and if so, is set to `[]`, preventing the `renderOUs` function from breaking | - [x] Y |
| Distinguishing between if there are no OUs in the customer's domain vs a failed  query | `ouDataLoaded` global variable that indicates whether or not the latest OU data has been loaded to the visualization. If `ouDataLoaded=false` and `displayOUs=[]`, this means the `fetch` returned no org units and we display a no existing OUs screen rather than no search results | - [x] Y |
| OU Search followed by deletion of searched OU | Resolved such that any OU edit (creation, update, or delete) would call `refreshOUPage`, refetching OUs from the API post-edit, clearing the search field, and displaying all OUs within the current layer limit | - [x] Y |
| Query followed by another query |  Former visualization or no results screen (whichever is being currently displayed) is always removed and replaced, except in the case of a no results query on the no results screen (in which case, this screen will just be kept) | - [x] Y |
| `treeChart` container | `removeVisualization` always removes this `treeChart` container, not just the SVG - else we will see buggy jumps every time the visualization is reset due to the listeners. Also ensures that the no results screen will not inherit the draggable, zoomable properties of the visualization | - [x] Y |
| `renderLayers` call following a search query that yielded multiple matches | Rather than once again running the search and asking the user which of the multiple matches they'd like to display, the desired displayOU and its parents will be stored in a `filteredOUs` global variable that can simply be rerendered based on the layer limit criteria | - [x] Y |

## Unit Testing

You can find the Jasmine unit testing scripts for org units in `test-ous.js` in the `src/test/javascript` directory.
