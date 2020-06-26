var params = JSON.parse(localStorage.getItem('oauth2-test-params'));
var token = params['access_token'];
var domain = "groot-test.1bot2.info"

function getAllGroups(){
    // access token expires in 3600 sec after login; fix later
    console.log(token);
    fetch('https://www.googleapis.com/admin/directory/v1/groups?domain=' + domain + '&customer=my_customer', {
    headers: {
        'authorization': `Bearer ` + token,
    }
    }).
    then(response => response.json())
    .then((res) => {
        console.log(res);
        loadSidebar(res.groups);
        loadGroups(res.groups);
        visualize();
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

/* Fill in informational fields on the sidebar of the page */
function loadSidebar(groups) {
    const domainName = document.getElementById("domain-name");
    domainName.innerHTML = "@" + domain;

    const numGroups = document.getElementById("num-groups");
    numGroups.innerHTML = groups.length;
}

function visualize() {
    var color = d3.scaleLinear()
    .domain([0, 5])
    .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
    .interpolate(d3.interpolateHcl)

    var format = d3.format(",d")

    var width = 932
    var height = width

    var pack = data => d3.pack()
    .size([width, height])
    .padding(3)
  (d3.hierarchy(data)
    .sum(d => d.value)
    .sort((a, b) => b.value - a.value))

    var data = {
 "name": "flare",
 "children": [
  {
   "name": "analytics",
   "children": [
    {
     "name": "cluster",
     "children": [
      {"name": "AgglomerativeCluster", "value": 3938},
      {"name": "CommunityStructure", "value": 3812},
      {"name": "HierarchicalCluster", "value": 6714},
      {"name": "MergeEdge", "value": 743}
     ]
    },
    {
     "name": "graph",
     "children": [
      {"name": "BetweennessCentrality", "value": 3534},
      {"name": "LinkDistance", "value": 5731},
      {"name": "MaxFlowMinCut", "value": 7840},
      {"name": "ShortestPaths", "value": 5914},
      {"name": "SpanningTree", "value": 3416}
     ]
    },
    {
     "name": "optimization",
     "children": [
      {"name": "AspectRatioBanker", "value": 7074}
     ]
    }
   ]
  },
  {
   "name": "animate",
   "children": [
    {"name": "Easing", "value": 17010},
    {"name": "FunctionSequence", "value": 5842},
    {
     "name": "interpolate",
     "children": [
      {"name": "ArrayInterpolator", "value": 1983},
      {"name": "ColorInterpolator", "value": 2047},
      {"name": "DateInterpolator", "value": 1375},
      {"name": "Interpolator", "value": 8746},
      {"name": "MatrixInterpolator", "value": 2202},
      {"name": "NumberInterpolator", "value": 1382},
      {"name": "ObjectInterpolator", "value": 1629},
      {"name": "PointInterpolator", "value": 1675},
      {"name": "RectangleInterpolator", "value": 2042}
     ]
    },
    {"name": "ISchedulable", "value": 1041},
    {"name": "Parallel", "value": 5176},
    {"name": "Pause", "value": 449},
    {"name": "Scheduler", "value": 5593},
    {"name": "Sequence", "value": 5534},
    {"name": "Transition", "value": 9201},
    {"name": "Transitioner", "value": 19975},
    {"name": "TransitionEvent", "value": 1116},
    {"name": "Tween", "value": 6006}
   ]
  },
  {
   "name": "data",
   "children": [
    {
     "name": "converters",
     "children": [
      {"name": "Converters", "value": 721},
      {"name": "DelimitedTextConverter", "value": 4294},
      {"name": "GraphMLConverter", "value": 9800},
      {"name": "IDataConverter", "value": 1314},
      {"name": "JSONConverter", "value": 2220}
     ]
    },
    {"name": "DataField", "value": 1759},
    {"name": "DataSchema", "value": 2165},
    {"name": "DataSet", "value": 586},
    {"name": "DataSource", "value": 3331},
    {"name": "DataTable", "value": 772},
    {"name": "DataUtil", "value": 3322}
   ]
  },
  {
   "name": "display",
   "children": [
    {"name": "DirtySprite", "value": 8833},
    {"name": "LineSprite", "value": 1732},
    {"name": "RectSprite", "value": 3623},
    {"name": "TextSprite", "value": 10066}
   ]
  },
  {
   "name": "flex",
   "children": [
    {"name": "FlareVis", "value": 4116}
   ]
  },
  {
   "name": "physics",
   "children": [
    {"name": "DragForce", "value": 1082},
    {"name": "GravityForce", "value": 1336},
    {"name": "IForce", "value": 319},
    {"name": "NBodyForce", "value": 10498},
    {"name": "Particle", "value": 2822},
    {"name": "Simulation", "value": 9983},
    {"name": "Spring", "value": 2213},
    {"name": "SpringForce", "value": 1681}
   ]
  },
  {
   "name": "query",
   "children": [
    {"name": "AggregateExpression", "value": 1616},
    {"name": "And", "value": 1027},
    {"name": "Arithmetic", "value": 3891},
    {"name": "Average", "value": 891},
    {"name": "BinaryExpression", "value": 2893},
    {"name": "Comparison", "value": 5103},
    {"name": "CompositeExpression", "value": 3677},
    {"name": "Count", "value": 781},
    {"name": "DateUtil", "value": 4141},
    {"name": "Distinct", "value": 933},
    {"name": "Expression", "value": 5130},
    {"name": "ExpressionIterator", "value": 3617},
    {"name": "Fn", "value": 3240},
    {"name": "If", "value": 2732},
    {"name": "IsA", "value": 2039},
    {"name": "Literal", "value": 1214},
    {"name": "Match", "value": 3748},
    {"name": "Maximum", "value": 843},
    {
     "name": "methods",
     "children": [
      {"name": "add", "value": 593},
      {"name": "and", "value": 330},
      {"name": "average", "value": 287},
      {"name": "count", "value": 277},
      {"name": "distinct", "value": 292},
      {"name": "div", "value": 595},
      {"name": "eq", "value": 594},
      {"name": "fn", "value": 460},
      {"name": "gt", "value": 603},
      {"name": "gte", "value": 625},
      {"name": "iff", "value": 748},
      {"name": "isa", "value": 461},
      {"name": "lt", "value": 597},
      {"name": "lte", "value": 619},
      {"name": "max", "value": 283},
      {"name": "min", "value": 283},
      {"name": "mod", "value": 591},
      {"name": "mul", "value": 603},
      {"name": "neq", "value": 599},
      {"name": "not", "value": 386},
      {"name": "or", "value": 323},
      {"name": "orderby", "value": 307},
      {"name": "range", "value": 772},
      {"name": "select", "value": 296},
      {"name": "stddev", "value": 363},
      {"name": "sub", "value": 600},
      {"name": "sum", "value": 280},
      {"name": "update", "value": 307},
      {"name": "variance", "value": 335},
      {"name": "where", "value": 299},
      {"name": "xor", "value": 354},
      {"name": "_", "value": 264}
     ]
    },
    {"name": "Minimum", "value": 843},
    {"name": "Not", "value": 1554},
    {"name": "Or", "value": 970},
    {"name": "Query", "value": 13896},
    {"name": "Range", "value": 1594},
    {"name": "StringUtil", "value": 4130},
    {"name": "Sum", "value": 791},
    {"name": "Variable", "value": 1124},
    {"name": "Variance", "value": 1876},
    {"name": "Xor", "value": 1101}
   ]
  },
  {
   "name": "scale",
   "children": [
    {"name": "IScaleMap", "value": 2105},
    {"name": "LinearScale", "value": 1316},
    {"name": "LogScale", "value": 3151},
    {"name": "OrdinalScale", "value": 3770},
    {"name": "QuantileScale", "value": 2435},
    {"name": "QuantitativeScale", "value": 4839},
    {"name": "RootScale", "value": 1756},
    {"name": "Scale", "value": 4268},
    {"name": "ScaleType", "value": 1821},
    {"name": "TimeScale", "value": 5833}
   ]
  },
  {
   "name": "util",
   "children": [
    {"name": "Arrays", "value": 8258},
    {"name": "Colors", "value": 10001},
    {"name": "Dates", "value": 8217},
    {"name": "Displays", "value": 12555},
    {"name": "Filter", "value": 2324},
    {"name": "Geometry", "value": 10993},
    {
     "name": "heap",
     "children": [
      {"name": "FibonacciHeap", "value": 9354},
      {"name": "HeapNode", "value": 1233}
     ]
    },
    {"name": "IEvaluable", "value": 335},
    {"name": "IPredicate", "value": 383},
    {"name": "IValueProxy", "value": 874},
    {
     "name": "math",
     "children": [
      {"name": "DenseMatrix", "value": 3165},
      {"name": "IMatrix", "value": 2815},
      {"name": "SparseMatrix", "value": 3366}
     ]
    },
    {"name": "Maths", "value": 17705},
    {"name": "Orientation", "value": 1486},
    {
     "name": "palette",
     "children": [
      {"name": "ColorPalette", "value": 6367},
      {"name": "Palette", "value": 1229},
      {"name": "ShapePalette", "value": 2059},
      {"name": "SizePalette", "value": 2291}
     ]
    },
    {"name": "Property", "value": 5559},
    {"name": "Shapes", "value": 19118},
    {"name": "Sort", "value": 6887},
    {"name": "Stats", "value": 6557},
    {"name": "Strings", "value": 22026}
   ]
  },
  {
   "name": "vis",
   "children": [
    {
     "name": "axis",
     "children": [
      {"name": "Axes", "value": 1302},
      {"name": "Axis", "value": 24593},
      {"name": "AxisGridLine", "value": 652},
      {"name": "AxisLabel", "value": 636},
      {"name": "CartesianAxes", "value": 6703}
     ]
    },
    {
     "name": "controls",
     "children": [
      {"name": "AnchorControl", "value": 2138},
      {"name": "ClickControl", "value": 3824},
      {"name": "Control", "value": 1353},
      {"name": "ControlList", "value": 4665},
      {"name": "DragControl", "value": 2649},
      {"name": "ExpandControl", "value": 2832},
      {"name": "HoverControl", "value": 4896},
      {"name": "IControl", "value": 763},
      {"name": "PanZoomControl", "value": 5222},
      {"name": "SelectionControl", "value": 7862},
      {"name": "TooltipControl", "value": 8435}
     ]
    },
    {
     "name": "data",
     "children": [
      {"name": "Data", "value": 20544},
      {"name": "DataList", "value": 19788},
      {"name": "DataSprite", "value": 10349},
      {"name": "EdgeSprite", "value": 3301},
      {"name": "NodeSprite", "value": 19382},
      {
       "name": "render",
       "children": [
        {"name": "ArrowType", "value": 698},
        {"name": "EdgeRenderer", "value": 5569},
        {"name": "IRenderer", "value": 353},
        {"name": "ShapeRenderer", "value": 2247}
       ]
      },
      {"name": "ScaleBinding", "value": 11275},
      {"name": "Tree", "value": 7147},
      {"name": "TreeBuilder", "value": 9930}
     ]
    },
    {
     "name": "events",
     "children": [
      {"name": "DataEvent", "value": 2313},
      {"name": "SelectionEvent", "value": 1880},
      {"name": "TooltipEvent", "value": 1701},
      {"name": "VisualizationEvent", "value": 1117}
     ]
    },
    {
     "name": "legend",
     "children": [
      {"name": "Legend", "value": 20859},
      {"name": "LegendItem", "value": 4614},
      {"name": "LegendRange", "value": 10530}
     ]
    },
    {
     "name": "operator",
     "children": [
      {
       "name": "distortion",
       "children": [
        {"name": "BifocalDistortion", "value": 4461},
        {"name": "Distortion", "value": 6314},
        {"name": "FisheyeDistortion", "value": 3444}
       ]
      },
      {
       "name": "encoder",
       "children": [
        {"name": "ColorEncoder", "value": 3179},
        {"name": "Encoder", "value": 4060},
        {"name": "PropertyEncoder", "value": 4138},
        {"name": "ShapeEncoder", "value": 1690},
        {"name": "SizeEncoder", "value": 1830}
       ]
      },
      {
       "name": "filter",
       "children": [
        {"name": "FisheyeTreeFilter", "value": 5219},
        {"name": "GraphDistanceFilter", "value": 3165},
        {"name": "VisibilityFilter", "value": 3509}
       ]
      },
      {"name": "IOperator", "value": 1286},
      {
       "name": "label",
       "children": [
        {"name": "Labeler", "value": 9956},
        {"name": "RadialLabeler", "value": 3899},
        {"name": "StackedAreaLabeler", "value": 3202}
       ]
      },
      {
       "name": "layout",
       "children": [
        {"name": "AxisLayout", "value": 6725},
        {"name": "BundledEdgeRouter", "value": 3727},
        {"name": "CircleLayout", "value": 9317},
        {"name": "CirclePackingLayout", "value": 12003},
        {"name": "DendrogramLayout", "value": 4853},
        {"name": "ForceDirectedLayout", "value": 8411},
        {"name": "IcicleTreeLayout", "value": 4864},
        {"name": "IndentedTreeLayout", "value": 3174},
        {"name": "Layout", "value": 7881},
        {"name": "NodeLinkTreeLayout", "value": 12870},
        {"name": "PieLayout", "value": 2728},
        {"name": "RadialTreeLayout", "value": 12348},
        {"name": "RandomLayout", "value": 870},
        {"name": "StackedAreaLayout", "value": 9121},
        {"name": "TreeMapLayout", "value": 9191}
       ]
      },
      {"name": "Operator", "value": 2490},
      {"name": "OperatorList", "value": 5248},
      {"name": "OperatorSequence", "value": 4190},
      {"name": "OperatorSwitch", "value": 2581},
      {"name": "SortOperator", "value": 2023}
     ]
    },
    {"name": "Visualization", "value": 16540}
   ]
  }
 ]
}


    const root = pack(data);
    let focus = root;
    let view;

    const svg = d3.create("svg")
        .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
        .style("display", "block")
        .style("margin", "0 -14px")
        .style("background", color(0))
        .style("cursor", "pointer")
        .on("click", () => zoom(root));

    const node = svg.append("g")
        .selectAll("circle")
        .data(root.descendants().slice(1))
        .join("circle")
        .attr("fill", d => d.children ? color(d.depth) : "white")
        .attr("pointer-events", d => !d.children ? "none" : null)
        .on("mouseover", function() { d3.select(this).attr("stroke", "#000"); })
        .on("mouseout", function() { d3.select(this).attr("stroke", null); })
        .on("click", d => focus !== d && (zoom(d), d3.event.stopPropagation()));

    const label = svg.append("g")
        .style("font", "10px sans-serif")
        .attr("pointer-events", "none")
        .attr("text-anchor", "middle")
        .selectAll("text")
        .data(root.descendants())
        .join("text")
        .style("fill-opacity", d => d.parent === root ? 1 : 0)
        .style("display", d => d.parent === root ? "inline" : "none")
        .text(d => d.data.name);


    zoomTo([root.x, root.y, root.r * 2]);

    function zoomTo(v) {
        const k = width / v[2];

        view = v;

        label.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
        node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
        node.attr("r", d => d.r * k);
    }

    function zoom(d) {
        const focus0 = focus;

        focus = d;

        const transition = svg.transition()
            .duration(d3.event.altKey ? 7500 : 750)
            .tween("zoom", d => {
            const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
            return t => zoomTo(i(t));
            });

        label
        .filter(function(d) { return d.parent === focus || this.style.display === "inline"; })
        .transition(transition)
            .style("fill-opacity", d => d.parent === focus ? 1 : 0)
            .on("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
            .on("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });
    }

    var chartElement = document.getElementById("chart")
    chartElement.appendChild(svg.node())

    return svg.node();
}

/* Create each of the group <div> elements and display them */
function loadGroups(groups) {
    let groupsContainer = document.getElementById("groups");
    for (var i = 0; i < groups.length; i++) {
        groupsContainer.appendChild(createGroupElement(groups[i]));
    }
}

/** Creates an <div> element for a group. */
function createGroupElement(group) {
    const divElement = document.createElement("div");
    divElement.classList.add("group")
    divElement.classList.add("card")

    const nameElement = document.createElement("h5");
    nameElement.classList.add("name")
    nameElement.innerText = group.name;
    divElement.appendChild(nameElement);

    const descriptionElement = document.createElement("div");
    descriptionElement.classList.add("description")
    descriptionElement.innerText = group.description;
    divElement.appendChild(descriptionElement);
    
    const emailElement = document.createElement("div");
    emailElement.classList.add("email")
    emailElement.innerText = group.email;
    divElement.appendChild(emailElement);
    
    const directMembersElement = document.createElement("span");
    directMembersElement.classList.add("direct-members")
    directMembersElement.innerText = group.directMembersCount + " direct members";
    divElement.appendChild(directMembersElement);

    return divElement;
}
