jQuery.sap.require("retail.store.receiveproduct.Z_SBO017B_RECV_PROD.test.integration.StoreJourney");

sap.ui.define([], function() {
	"use strict";

	QUnit.module("Store List");

	opaTest("I should see the store list with 2 entries", function(Given, When, Then) {
		// Arrangements
		Given.iStartTheApp();

		//Actions
		When.onTheStoreDialog.iLookAtTheScreen();

		// Assertions
		Then.onTheStoreDialog.iShouldSeeTheList().and.theListShouldHaveNEntries(2);
	});

	opaTest("I select the first store", function(Given, When, Then) {
		//Actions
		When.onTheStoreDialog.iPressOnTheObjectAtPosition(0);

		//Actions
		When.onTheStoreDialog.iLookAtTheScreen();

		// Assertions
		Then.onTheStoreDialog.theListShouldBeClosed();
	});

});