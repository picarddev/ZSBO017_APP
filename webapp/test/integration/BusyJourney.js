sap.ui.define([
	], function () {
		"use strict";

		QUnit.module("Desktop busy indication");

		opaTest("Should see a global busy indication while loading the metadata", function (Given, When, Then) {
			// Arrangements
			Given.iStartTheAppWithDelay("", 5000);

			// Actions
			When.onTheAppPage.iLookAtTheScreen();

			// Assertions
			Then.onTheAppPage.iShouldSeeTheBusyIndicator().
				and.iTeardownMyAppFrame();
		});

		opaTest("Should see a busy indication on the master and detail after loading the metadata", function (Given, When, Then) {
			// Arrangements
			Given.iStartTheAppWithDelay("", 5000);

			// Actions
			When.onTheAppPage.iWaitUntilTheBusyIndicatorIsGone();

			// Assertions
			Then.onTheMasterPage.iShouldSeeTheBusyIndicator().
				and.theListHeaderDisplaysZeroHits();
			Then.onTheDetailPage.iShouldSeeTheBusyIndicator().
				and.iTeardownMyAppFrame();
		});

	}
);