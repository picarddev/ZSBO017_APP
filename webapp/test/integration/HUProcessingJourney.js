jQuery.sap.require("retail.store.receiveproduct.Z_SBO017B_RECV_PROD.test.integration.HUProcessingJourney");

sap.ui.define([], function() {
	"use strict";

	QUnit.module("HU Processing");

	opaTest("i should see the Store List Dialog", function(Given, When, Then) {
		// Arrangements
		Given.iStartTheApp();

		// Actions
		When.onTheMasterPage.iWaitUntilTheStoreListIsLoaded();

		// Assertions
		Then.onTheMasterPage.iShouldSeeStoreListDialog();
	});

	opaTest("i choose the first store", function(Given, When, Then) {
		//Actions
		When.onTheMasterPage.iPressOnTheStoreAtPosition(0);

		// Assertions
		Then.onTheMasterPage.theListHasEntries();
	});

	opaTest("the first document should be selected", function(Given, When, Then) {
		// Assertions
		Then.onTheMasterPage.theFirstItemShouldBeSelected();
	});

	opaTest("the Master list should have 4 entries", function(Given, When, Then) {
		// Assertions
		Then.onTheMasterPage.theListShouldHaveNEntries(4);
	});

	opaTest("the header should display all entries", function(Given, When, Then) {
		// Assertions
		Then.onTheMasterPage.theHeaderShouldDisplayAllEntries();
	});

	opaTest("the title property is equal to 87000995001", function(Given, When, Then) {
		// Assertions
		Then.onTheMasterPage.theFirstItemPropertyShouldBeEqualTo("getTitle", "87000995001");
	});

	opaTest("the number property is equal to 10", function(Given, When, Then) {
		// Assertions
		Then.onTheMasterPage.theFirstItemPropertyShouldBeEqualTo("getNumber", "10");
	});

	opaTest("the processing state should be unprocessed", function(Given, When, Then) {
		// Assertions
		Then.onTheMasterPage.theProcessingStateSouldBeUnprocessed();
	});

	opaTest("the DeliveryType should be ZPDV", function(Given, When, Then) {
		// Assertions
		Then.onTheMasterPage.theDeliveryTypeSouldBeZPDV();
	});

	opaTest("i press on the edit mode button", function(Given, When, Then) {
		// Action
		When.onTheMasterPage.iPressOnEditModeButtonInHeader();

		// Assertions
		Then.onTheMasterPage.theListHasAllItemsOnMultiSelectMode();
	});

	opaTest("List should have 2 selected entries", function(Given, When, Then) {
		// Action
		When.onTheMasterPage.iPressOnTheObjectAtPosition(1).and.iPressOnTheObjectAtPosition(2);

		// Assertions
		Then.onTheMasterPage.theListShouldHaveNSelectedEntries(2);
	});

	opaTest("i press MoveReason button in master footer", function(Given, When, Then) {
		// Action
		When.onTheMasterPage.iPressMoveReasonButtonInFooter();

		// Assertions
		Then.onTheMasterPage.theMoveReasonMasterListShouldHaveNEntries(5);
	});

	opaTest("i press on the MoveReason list at position 4", function(Given, When, Then) {
		// Action
		When.onTheMasterPage.iPressOnTheMoveReasonObjectAtPosition(4);

		// Assertions
		Then.onTheMasterPage.selectedDocumentsShouldHaveMoveReason();
	});

	opaTest("i press save button in master footer", function(Given, When, Then) {
		// Action
		When.onTheMasterPage.iPressSaveDocumentsButtonInFooter();

		// Assertions
		Then.onTheMasterPage.iShouldSeeSaveConfirmDialog();
	});
	
	// opaTest("i press save button in master page footer", function(Given, When, Then) {
	// 	// Action
	// 	When.onTheMasterPage.iPressOnTheObjectAtPosition(1).and.iPressOnTheObjectAtPosition(2);

	// 	// Assertions
	// 	Then.onTheMasterPage.theListShouldHaveNSelectedEntries(2);
	// });

	// opaTest("", function(Given, When, Then) {
	// 	// Assertions
	// 	Then.onTheMasterPage.theProcessingStateSouldBeUnprocessed();
	// });

	// opaTest("i can see 4 items in master list page", function(Given, When, Then) {

	// 	// Assertions
	// 	Then.onTheMasterPage.theMasterListPageHasEntries(4);
	// });

	// opaTest("i choose the first store item", function(Given, When, Then) {
	// 	//Actions
	// 	When.onTheMasterPage.iPressOnTheStoreAtPosition(0);

	// 	// Assertions
	// 	Then.onTheMasterPage.theFirstItemShouldBeSelected();
	// });
});