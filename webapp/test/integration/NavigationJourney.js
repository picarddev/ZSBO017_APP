sap.ui.define([
	], function () {
		"use strict";

		QUnit.module("Desktop navigation");

		opaTest("Should start the app with empty hash: the hash should reflect the selection of the first item in the list", function (Given, When, Then) {
			// Arrangements
			Given.iStartTheApp();

			//Actions
			When.onTheMasterPage.iRememberTheSelectedItem();

			// Assertions
			Then.onTheMasterPage.theFirstItemShouldBeSelected();
			Then.onTheDetailPage.iShouldSeeTheRememberedObject().and.iShouldSeeNoBusyIndicator();
			Then.onTheBrowserPage.iShouldSeeTheHashForTheRememberedObject();
		});

		opaTest("Should react on hashchange", function (Given, When, Then) {
			// Actions
			When.onTheMasterPage.iRememberTheIdOfListItemAtPosition(3);
			When.onTheBrowserPage.iChangeTheHashToTheRememberedItem();

			// Assertions
			Then.onTheDetailPage.iShouldSeeTheRememberedObject().and.iShouldSeeNoBusyIndicator();
			Then.onTheMasterPage.theRememberedListItemShouldBeSelected();
		});


		opaTest("Should navigate on press", function (Given, When, Then) {
			// Actions
			When.onTheMasterPage.iRememberTheIdOfListItemAtPosition(2).
				and.iPressOnTheObjectAtPosition(2);

			// Assertions
			Then.onTheDetailPage.iShouldSeeTheRememberedObject();
		});

		opaTest("Navigate to an object not on the client: no item should be selected and the object page should be displayed", function (Given, When, Then) {
			//Actions
			When.onTheMasterPage.iRememberAnIdOfAnObjectThatsNotInTheList();
			When.onTheBrowserPage.iChangeTheHashToTheRememberedId();

			// Assertions
			Then.onTheDetailPage.iShouldSeeTheRememberedObject().
				and.iTeardownMyAppFrame();
		});

		opaTest("Start the App and simulate metadata error: MessageBox should be shown", function (Given, When, Then) {
			//Arrangement
			Given.iStartMyAppOnADesktopToTestErrorHandler("metadataError=true");

			// Assertions
			Then.onTheAppPage.iShouldSeeTheMessageBox("metadataErrorMessageBox").
				and.iTeardownMyAppFrame();
		});

		opaTest("Start the App and simulate bad request error: MessageBox should be shown", function (Given, When, Then) {
			//Arrangement
			Given.iStartMyAppOnADesktopToTestErrorHandler("errorType=serverError");

			// Assertions
			Then.onTheAppPage.iShouldSeeTheMessageBox("serviceErrorMessageBox").
				and.iTeardownMyAppFrame();
		});

	}
);