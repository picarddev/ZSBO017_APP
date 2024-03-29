sap.ui.define([
		"sap/ui/test/Opa5",
		"retail/store/receiveproduct/Z_SBO017B_RECV_PROD/test/integration/pages/Common"
	], function(Opa5, Common) {
		"use strict";

		var sViewName = "App",
			sAppControl = "idAppControl";

		Opa5.createPageObjects({
			onTheAppPage : {
				baseClass : Common,

				actions : {

					iWaitUntilTheBusyIndicatorIsGone : function () {
						return this.waitFor({
							id : sAppControl,
							viewName : sViewName,
							// inline-matcher directly as function
							matchers : function(oRootView) {
								// we set the view busy, so we need to query the parent of the app
								return oRootView.getParent().getBusy() === false;
							},
							errorMessage : "The app is still busy."
						});
					}

				},

				assertions : {

					iShouldSeeTheBusyIndicator : function () {
						return this.waitFor({
							id : sAppControl,
							viewName : sViewName,
							success : function (oRootView) {
								// we set the view busy, so we need to query the parent of the app
								QUnit.ok(oRootView.getParent().getBusy(), "The app is busy");
							},
							errorMessage : "The app is not busy."
						});
					},

					iShouldSeeTheMessageBox : function (sMessageBoxId) {
						return this.waitFor({
							id : sMessageBoxId,
							success : function () {
								QUnit.ok(true, "the correct MessageBox was shown");
							}
						});
					}

				}

			}

		});

	}
);