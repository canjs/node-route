/*[global-shim-start]*/
(function(exports, global, doEval){ // jshint ignore:line
	var origDefine = global.define;

	var get = function(name){
		var parts = name.split("."),
			cur = global,
			i;
		for(i = 0 ; i < parts.length; i++){
			if(!cur) {
				break;
			}
			cur = cur[parts[i]];
		}
		return cur;
	};
	var set = function(name, val){
		var parts = name.split("."),
			cur = global,
			i, part, next;
		for(i = 0; i < parts.length - 1; i++) {
			part = parts[i];
			next = cur[part];
			if(!next) {
				next = cur[part] = {};
			}
			cur = next;
		}
		part = parts[parts.length - 1];
		cur[part] = val;
	};
	var useDefault = function(mod){
		if(!mod || !mod.__esModule) return false;
		var esProps = { __esModule: true, "default": true };
		for(var p in mod) {
			if(!esProps[p]) return false;
		}
		return true;
	};
	var modules = (global.define && global.define.modules) ||
		(global._define && global._define.modules) || {};
	var ourDefine = global.define = function(moduleName, deps, callback){
		var module;
		if(typeof deps === "function") {
			callback = deps;
			deps = [];
		}
		var args = [],
			i;
		for(i =0; i < deps.length; i++) {
			args.push( exports[deps[i]] ? get(exports[deps[i]]) : ( modules[deps[i]] || get(deps[i]) )  );
		}
		// CJS has no dependencies but 3 callback arguments
		if(!deps.length && callback.length) {
			module = { exports: {} };
			var require = function(name) {
				return exports[name] ? get(exports[name]) : modules[name];
			};
			args.push(require, module.exports, module);
		}
		// Babel uses the exports and module object.
		else if(!args[0] && deps[0] === "exports") {
			module = { exports: {} };
			args[0] = module.exports;
			if(deps[1] === "module") {
				args[1] = module;
			}
		} else if(!args[0] && deps[0] === "module") {
			args[0] = { id: moduleName };
		}

		global.define = origDefine;
		var result = callback ? callback.apply(null, args) : undefined;
		global.define = ourDefine;

		// Favor CJS module.exports over the return value
		result = module && module.exports ? module.exports : result;
		modules[moduleName] = result;

		// Set global exports
		var globalExport = exports[moduleName];
		if(globalExport && !get(globalExport)) {
			if(useDefault(result)) {
				result = result["default"];
			}
			set(globalExport, result);
		}
	};
	global.define.orig = origDefine;
	global.define.modules = modules;
	global.define.amd = true;
	ourDefine("@loader", [], function(){
		// shim for @@global-helpers
		var noop = function(){};
		return {
			get: function(){
				return { prepareGlobal: noop, retrieveGlobal: noop };
			},
			global: global,
			__exec: function(__load){
				doEval(__load.source, global);
			}
		};
	});
}
)({},window,function(__$source__, __$global__) { // jshint ignore:line
	eval("(function() { " + __$source__ + " \n }).call(__$global__);");
}
)
/*node-route@1.1.3#src/dom-id*/
define('node-route', function (require, exports, module) {
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
    var createRouteInfo = function (id, branch, value, collapsed) {
        var routeInfo = Object.create(null);
        routeInfo.id = id;
        routeInfo.branch = branch;
        routeInfo.collapsed = collapsed;
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
        var id;
        var info = getCachedInfo(node);
        if (info) {
            id = info.id;
            var invalid = info.collapsed !== (options && options.collapseTextNodes);
            if (invalid) {
                id = undefined;
            }
        }
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
    exports.indexOfParent = function indexOfParent(parent, node, options) {
        var index = -1;
        var collapseTextNodes = options && options.collapseTextNodes;
        var child = parent.firstChild, last, skip;
        while (child) {
            skip = collapseTextNodes && child.nodeType === 3 && last === 3;
            if (!skip)
                index++;
            if (child === node) {
                break;
            }
            last = child.nodeType;
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
        var parentInfo;
        if (parent.nodeType === 9) {
            parentInfo = { id: '' };
        } else {
            parentInfo = getCachedInfo(parent);
            if (!parentInfo || collapseTextNodes) {
                parentInfo = getRoute(parent, options);
            }
        }
        var parentId = parentInfo.id;
        id = (parentId ? parentId + SEPARATOR : '') + index;
        var routeInfo = createRouteInfo(id, getBranch(index, node, parentInfo.branch), collapseTextNodes ? value : undefined, collapseTextNodes);
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
});
/*[global-shim-end]*/
(function(){ // jshint ignore:line
	window._define = window.define;
	window.define = window.define.orig;
}
)();