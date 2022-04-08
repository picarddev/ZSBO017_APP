sap.ui.define([
	"sap/ui/test/Opa5",
	"retail/store/receiveproduct/Z_SBO017B_RECV_PROD/test/integration/pages/Common",
	"sap/ui/test/matchers/AggregationLengthEquals",
	"sap/ui/test/matchers/AggregationFilled",
	"sap/ui/test/matchers/PropertyStrictEquals"
], function(Opa5, Common, AggregationLengthEquals, AggregationFilled, PropertyStrictEquals) {
	"use strict";

	var sViewName = "DocumentList";

	Opa5.createPageObjects({
		onTheStoreDialog: {
			baseClass: Common,

			actions: {

				iPressOnTheObjectAtPosition: function(iPositon) {
					return this.waitFor({
						controlType: "sap.m.SelectDialog",
						viewName: sViewName,
						matchers: function(oList) {
							return oList.getItems()[iPositon];
						},
						success: function(oListItem) {
							oListItem[0].$().trigger("tap");
						},
						errorMessage: "List 'list' in view '" + sViewName + "' does not contain an ObjectListItem at position '" + iPositon + "'"
					});
				}

			},

			assertions: {

				iShouldSeeTheList: function() {
					return this.waitFor({
						controlType: "sap.m.SelectDialog",
						viewName: sViewName,
						success: function(oList) {
							QUnit.ok(oList[0], "Found the object List");
						},
						errorMessage: "Can't see the store list."
					});
				},

				theListShouldHaveNEntries: function(iObjIndex) {
					return this.waitFor({
						controlType: "sap.m.SelectDialog",
						viewName: sViewName,
						matchers: [new AggregationLengthEquals({
							name: "items",
							length: iObjIndex
						})],
						success: function(oList) {
							QUnit.strictEqual(oList[0].getItems().length, iObjIndex, "The list has " + oList[0].getItems().length + " items");
						},
						errorMessage: "Store list does not have " + iObjIndex + " entries."
					});
				},

				theListShouldBeClosed: function() {
					return this.waitFor({
						controlType: "sap.m.SelectDialog",
						viewName: sViewName,
						success: function(oList) {
							QUnit.ok(true, "The list is closed");
						},
						errorMessage: "The list is opened"
					});
				}
			}
		}
	});

});