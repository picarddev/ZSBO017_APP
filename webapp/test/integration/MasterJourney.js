jQuery.sap.require("retail.store.receiveproduct.Z_SBO017B_RECV_PROD.test.integration.MasterJourney");

sap.ui.define([], function() {
	"use strict";

	QUnit.module("Master List");

	opaTest("Should see the Master List with 8 documents", function(Given, When, Then) {
		// Arrangements
		Given.iStartTheApp();

		//Actions
		When.onTheMasterPage.iWaitUntilTheStoreListIsLoaded().iPressOnTheStoreAtPosition(0);

		// Assertions
		Then.onTheMasterPage.iShouldSeeTheList().and.theListShouldHaveNEntries(8).
												 and.theHeaderShouldDisplayAllEntries();
	});

	opaTest("First document should be selected", function (Given, When, Then) {
		//Actions
		When.onTheMasterPage.iWaitUntilTheListIsLoaded();

		// Assertions
		Then.onTheMasterPage.theFirstItemShouldBeSelected();
	});

	opaTest("Search a document number in Master List", function (Given, When, Then) {
		//Actions
		When.onTheMasterPage.iPressEnterDocumentSearchButtonInFooter();

		// Assertions
		// Then.onTheMasterPage.theFirstItemShouldBeSelected();
	});
	
	// opaTest("Search for the First object should deliver results that contain the firstObject in the name", function (Given, When, Then) {
	// 	//Actions
	// 	When.onTheMasterPage.iSearchForTheFirstObject();

	// 	// Assertions
	// 	Then.onTheMasterPage.theListShowsOnlyObjectsWithTheSearchStringInTheirTitle();
	// });

	// opaTest("Entering something that cannot be found into search field and pressing search field's refresh should leave the list as it was", function (Given, When, Then) {
	// 	//Actions
	// 	When.onTheMasterPage.iTypeSomethingInTheSearchThatCannotBeFound().
	// 		and.iTriggerRefresh();

	// 	// Assertions
	// 	Then.onTheMasterPage.theListHasEntries();
	// });

	// opaTest("Entering something that cannot be found into search field and pressing 'search' should display the list's 'not found' message", function (Given, When, Then) {
	// 	//Actions
	// 	When.onTheMasterPage.iSearchForSomethingWithNoResults();

	// 	// Assertions
	// 	Then.onTheMasterPage.iShouldSeeTheNoDataTextForNoSearchResults().
	// 		and.theListHeaderDisplaysZeroHits();
	// });

	// opaTest("Should display items again if the searchfield is emptied", function (Given, When, Then) {
	// 	//Actions
	// 	When.onTheMasterPage.iClearTheSearch();

	// 	// Assertions
	// 	Then.onTheMasterPage.theListShouldHaveAllEntries().
	// 		and.iTeardownMyAppFrame();
	// });

});