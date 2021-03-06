var QUnit = require("steal-qunit");
var nodeRoute = require("node-route");
var $ = require("jquery");

var SPAN_ID = "0.1.0.0.0.1.0";

QUnit.module("node-route", {
	setup: function(){
		nodeRoute.purgeID(SPAN_ID);
		$("#qunit-test-area").html(
			"<div style='display:none;'><ul><li></li><li><span></span></li></ul></div>"
		);
	}
});

QUnit.test("creates correct route for dom elements", function(){
	var span = $("#qunit-test-area span")[0];
	var route = nodeRoute.getID(span);

	equal(route, SPAN_ID, "route is correct");
});

QUnit.test("finds the element at a route", function(){
	var span = $("#qunit-test-area span")[0];
	var node = nodeRoute.getNode(SPAN_ID);

	equal(span, node, "Got the correct element");
});

QUnit.test("purges nodes correctly", function(){
	var span = $("#qunit-test-area span")[0];
	var node = nodeRoute.getNode(SPAN_ID);
	var id = nodeRoute.getCachedID(node);

	nodeRoute.purgeNode(node);
	node.parentNode.removeChild(node);

	QUnit.equal(nodeRoute.nodeCache[id], undefined, "Node was purged");
});

QUnit.test("purge sibilings works even with getNode", function(){
	var firstLi = $("#qunit-test-area li")[0];
	$(firstLi).attr("first", true);
	// This should
	nodeRoute.getID(firstLi);

	var newLi = $("<li>")[0];
	firstLi.parentNode.insertBefore(newLi, firstLi);

	nodeRoute.purgeSiblings(newLi);

	var parentBranch = nodeRoute.getCachedInfo(firstLi.parentNode).branch;

	QUnit.equal(parentBranch[0].element, newLi, "Branch replaced with the new li");
});

QUnit.module("getRoute")

QUnit.test("{collapseTextNodes} returns information on sibling TextNodes", function(){
	var ctn = function(v) { return document.createTextNode(v); };
	var container = document.createElement("div");

	var tn1 = ctn("One")
	container.appendChild(tn1);

	var tn2 = ctn("Two");
	container.appendChild(tn2);

	var info = nodeRoute.getRoute(tn2, { collapseTextNodes: true });

	QUnit.equal(info.id, "0.0", "Found the right one");
	QUnit.equal(info.value, "OneTwo", "Returned the value as well");
});

QUnit.test("{collapseTextNodes} works when there are elements mixins with text nodes", function(){
	var ctn = function(v) { return document.createTextNode(v); };
	var container = document.createElement("div");

	container.appendChild(ctn("One"));
	container.appendChild(ctn("Two"));
	container.appendChild(document.createElement("span"));

	var tn1 = ctn("Three")
	container.appendChild(tn1);

	var tn2 = ctn("Four");
	container.appendChild(tn2);

	var info = nodeRoute.getRoute(tn2, { collapseTextNodes: true });

	QUnit.equal(info.id, "0.2", "Found the right one");
	QUnit.equal(info.value, "ThreeFour", "Returned the value as well");
});

QUnit.test("{collapseTextNodes} ignores whitespace TextNodes", function(){
	var cel = document.createElement.bind(document);
	var ctn = document.createTextNode.bind(document);
	var container = cel("html");
	container.appendChild(ctn(""));
	container.appendChild(cel("head"));
	var body = cel("body");
	container.appendChild(body);

	body.appendChild(cel("p"));
	body.appendChild(ctn(""));
	body.appendChild(cel("span"));
	body.appendChild(ctn("\n"));

	var last = cel("p");
	body.appendChild(last);

	var id = nodeRoute.getID(last, { collapseTextNodes: true });

	QUnit.equal(id, "0.1.4", "correct id");
});

QUnit.module("nodeRoute.indexOfParent");

QUnit.test("{collapseTextNodes} option skips texts nodes", function(){
	var cel = document.createElement.bind(document);
	var ctn = document.createTextNode.bind(document);

	var container = cel("div");
	container.appendChild(ctn("One"));
	container.appendChild(cel("section"));
	container.appendChild(ctn(""));
	var three = ctn("Three");
	container.appendChild(three);

	QUnit.equal(nodeRoute.indexOfParent(container, three), 3, "Is 3 when the collapseTextNodes option is not provided");
	var opts = { collapseTextNodes: true };
	QUnit.equal(nodeRoute.indexOfParent(container, three, opts), 2, "Is 2 when the collapseTextNodes option is provided");
});
