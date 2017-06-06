/*node-route@1.1.1#src/dom-id*/
var slice = [].slice;
var nodeCache = exports.nodeCache = {};
var nodeTree = exports.nodeTree = [];
var SEPARATOR = '.';
var rootNode = exports.rootNode = function (root) {
    if (!root) {
        return document.documentElement;
    }
    return root.documentElement || root;
};
var createRouteInfo = function (id, branch, value) {
    var routeInfo = Object.create(null);
    routeInfo.id = id;
    routeInfo.branch = branch;
    if (value !== undefined) {
        routeInfo.value = value;
    }
    return routeInfo;
};
var cache = function (node, routeInfo) {
    node.__routeInfo = routeInfo;
    nodeCache[routeInfo.id] = node;
};
var getID = exports.getID = function (node, options) {
    var id = getCachedID(node);
    if (!id) {
        var routeInfo = getRoute(node, options);
        id = routeInfo.id;
    }
    return id;
};
exports.getRoute = getRoute;
var getCachedInfo = exports.getCachedInfo = function (node) {
    return node.__routeInfo;
};
var getCachedID = exports.getCachedID = function (node) {
    var info = getCachedInfo(node);
    return info && info.id;
};
var getIndex = exports.getIndex = function (id) {
    return +id.substr(id.lastIndexOf('.') + 1);
};
function getBranch(index, element, parentBranch) {
    parentBranch = parentBranch || nodeTree;
    var branch = parentBranch[index];
    if (!branch) {
        branch = parentBranch[index] = [];
        branch.element = element;
    } else if (branch.element !== element) {
        branch.element = element;
    }
    return branch;
}
exports.indexOfParent = function indexOfParent(parent, node) {
    var index = -1;
    var child = parent.firstChild;
    while (child) {
        index++;
        if (child === node) {
            break;
        }
        child = child.nextSibling;
    }
    return index;
};
function getRoute(node, options) {
    var id = '', nodeType;
    var collapseTextNodes = options && options.collapseTextNodes;
    var parent = node.parentNode;
    var index = -1;
    if (!parent) {
        return { id: '0' };
    }
    var child = parent.firstChild;
    var prevNodeType, siblingTag, value;
    while (child) {
        if (collapseTextNodes && child.nodeType === 3) {
            siblingTag = child.nextSibling && child.nextSibling.nodeName;
            if (prevNodeType === 3) {
                value += child.nodeValue;
            } else if (siblingTag !== 'HEAD') {
                value = child.nodeValue;
                index++;
            }
        } else {
            value = undefined;
            index++;
        }
        if (child === node) {
            break;
        }
        prevNodeType = child.nodeType;
        child = child.nextSibling;
    }
    var parentInfo = parent.nodeType === 9 ? { id: '' } : getCachedInfo(parent) || getRoute(parent, options);
    var parentId = parentInfo.id;
    id = (parentId ? parentId + SEPARATOR : '') + index;
    var routeInfo = createRouteInfo(id, getBranch(index, node, parentInfo.branch), collapseTextNodes ? value : undefined);
    cache(node, routeInfo);
    return routeInfo;
}
var findNode = exports.findNode = function (id, root) {
    var node = rootNode(root);
    var ids = id.split('.');
    var idIndex = 1;
    while (node) {
        var currentIndex = ids[idIndex];
        if (currentIndex == null) {
            break;
        }
        var nodeIndex = 0;
        var child = node.firstChild;
        while (child) {
            if (nodeIndex == currentIndex) {
                node = child;
                break;
            }
            nodeIndex++;
            child = child.nextSibling;
        }
        idIndex++;
        node = child;
    }
    return node;
};
exports.getNode = function (id, root) {
    var node;
    node = nodeCache[id];
    if (node && !root) {
        return node;
    }
    node = findNode(id, root);
    if (!root) {
        cache(node, { id: id });
    }
    return node;
};
exports.purgeID = function (id) {
    var node = nodeCache[id];
    if (node) {
        delete node.__routeInfo;
        delete nodeCache[id];
    }
};
exports.purgeNode = function (node) {
    var routeInfo = getCachedInfo(node);
    if (!routeInfo)
        return;
    var parentRouteInfo = getCachedInfo(node.parentNode);
    if (parentRouteInfo && parentRouteInfo.branch) {
        var parentBranch = parentRouteInfo.branch;
        var index = getIndex(routeInfo.id);
        parentBranch.splice(index, 1);
        routeInfo.branch.length = 0;
        nodeCache = exports.nodeCache = {};
    } else {
        exports.purgeID(routeInfo.id);
    }
};
exports.purgeSiblings = function (node) {
    var routeInfo = getCachedInfo(node);
    if (!routeInfo) {
        exports.getID(node);
        routeInfo = getCachedInfo(node);
    }
    var parentRouteInfo = getCachedInfo(node.parentNode);
    if (parentRouteInfo && parentRouteInfo.branch) {
        var parentBranch = parentRouteInfo.branch;
        var index = getIndex(routeInfo.id);
        var staleBranch = false;
        parentBranch.forEach(function (branch, i) {
            if (i > index || i === index && branch.element !== node) {
                staleBranch = true;
                return false;
            }
        });
        if (staleBranch) {
            parentBranch.length = 0;
            parentBranch[index] = routeInfo.branch;
        }
    }
};
exports.purgeCache = function () {
    nodeCache = exports.nodeCache = {};
    nodeTree = exports.nodeTree = [];
};