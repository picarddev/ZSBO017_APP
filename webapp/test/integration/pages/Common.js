sap.ui.define([
		"sap/ui/test/Opa5"
	], function(Opa5) {
		"use strict";

		function getFrameUrl (sHash, sUrlParameters) {
			var sUrl = jQuery.sap.getResourcePath("retail/store/receiveproduct/Z_SBO017B_RECV_PROD/", ".html");
			sHash = sHash || "";
			sUrlParameters = sUrlParameters ? "?" + sUrlParameters : "";

			if (sHash) {
				sHash = "#Article-Receive&/" + (sHash.indexOf("/") === 0 ? sHash.substring(1) : sHash);
			} else {
				sHash = "#Article-Receive";
			}

			return sUrl + sUrlParameters + sHash;
		}

		return Opa5.extend("retail.store.receiveproduct.Z_SBO017B_RECV_PROD.test.integration.pages.Common", {

			iStartTheApp : function (oOptions) {
				oOptions = oOptions || {};
				this.iStartMyAppInAFrame(getFrameUrl(oOptions.hash));
			},

			iStartTheAppWithDelay : function (sHash, iDelay) {
				this.iStartMyAppInAFrame(getFrameUrl(sHash, "serverDelay=" + iDelay));
			},

			iLookAtTheScreen : function () {
				return this;
			},

			iStartMyAppOnADesktopToTestErrorHandler : function (sParam) {
				this.iStartMyAppInAFrame(getFrameUrl("", sParam));
			},

			createAWaitForAnEntitySet : function  (oOptions) {
				return {
					success: function () {
						var bMockServerAvailable = false,
							aEntitySet;

						this.getMockServer().then(function (oMockServer) {
							aEntitySet = oMockServer.getEntitySetData(oOptions.entitySet);
							bMockServerAvailable = true;
						});

						return this.waitFor({
							check: function () {
								return bMockServerAvailable;
							},
							success : function () {
								oOptions.success.call(this, aEntitySet);
							}
						});
					}
				};
			},

			getMockServer : function () {
				return new Promise(function (success) {
					Opa5.getWindow().sap.ui.require(["retail/store/receiveproduct/Z_SBO017B_RECV_PROD/localService/mockserver"], function (mockserver) {
						success(mockserver.getMockServer());
					});
				});
			},

			theUnitNumbersShouldHaveTwoDecimals : function (sControlType, sViewName, sSuccessMsg, sErrMsg) {
				var rTwoDecimalPlaces =  /^-?\d+\.\d{2}$/;

				return this.waitFor({
					controlType : sControlType,
					viewName : sViewName,
					success : function (aNumberControls) {
						QUnit.ok(aNumberControls.every(function(oNumberControl){
								return rTwoDecimalPlaces.test(oNumberControl.getNumber());
							}),
							sSuccessMsg);
					},
					errorMessage : sErrMsg
				});
			}

		});

	}
);