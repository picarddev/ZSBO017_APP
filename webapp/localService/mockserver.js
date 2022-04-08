sap.ui.define([
	"sap/ui/core/util/MockServer",
	"sap/ui/model/json/JSONModel"
], function(MockServer, JSONModel) {
	"use strict";
	var oMockServer,
		_sAppModulePath = "retail/store/receiveproduct/Z_SBO017B_RECV_PROD/",
		_sJsonFilesModulePath = _sAppModulePath + "localService/mockdata/",
		_sMetadataUrl = _sJsonFilesModulePath + "metadata",
		_sMainDataSourceUrl = "/sap/opu/odata/sap/ZSBO017B_RECEIVE_PRODUCT_SRV/";
	return {
		/**
		 * Initializes the mock server.
		 * You can configure the delay with the URL parameter "serverDelay".
		 * The local mock data in this folder is returned instead of the real data for testing.
		 * @public
		 */
		init: function() {

			var oUriParameters = jQuery.sap.getUriParameters(),
				sJsonFilesUrl = jQuery.sap.getModulePath(_sJsonFilesModulePath),
				sEntity = "Document",
				sErrorParam = oUriParameters.get("errorType"),
				iErrorCode = sErrorParam === "badRequest" ? 400 : 500,
				sMetadataUrl = jQuery.sap.getModulePath(_sMetadataUrl, ".xml");

			oMockServer = new MockServer({
				rootUri: _sMainDataSourceUrl
			});

			// configure mock server with a delay of 1s
			MockServer.config({
				autoRespond: true,
				autoRespondAfter: (oUriParameters.get("serverDelay") || 1000)
			});

			oMockServer.simulate(sMetadataUrl, {
				sMockdataBaseUrl: sJsonFilesUrl,
				bGenerateMissingMockData: true
			});

			var aRequests = oMockServer.getRequests();

			// aRequests.push({
			// 	method: "MERGE",
			// 	path: new RegExp("(.*)Order(.*)"),
			// 	response: function(oXhr, sUrlParams) {
			// 		debugger;
			// 		jQuery.sap.log.debug("Mock Server: Incoming request for order");
			// 		var oResponse = {
			// 			data: {},
			// 			headers: {
			// 				"Content-Type": "application/json;charset=utf-8",
			// 				"DataServiceVersion": "1.0"
			// 			},
			// 			status: "204",
			// 			statusText: "No Content"
			// 		};
			// 		oXhr.respond(oResponse.status, oResponse.headers, JSON.stringify({
			// 			d: oResponse.data
			// 		}));
			// 	}
			// });

			aRequests.push({
				method: "POST",
				path: new RegExp("(.*)UpdateUserDefaultFilterValue(.*)"),
				response: function(oXhr, sUrlParams) {
					oXhr.respond(200, {
						headers: {
							"Content-Type": "application/json;charset=utf-8",
							"DataServiceVersion": "1.0"
						}
					}, JSON.stringify({}));
				}
			});

			aRequests.push({
				method: "POST",
				path: new RegExp("(.*)DeleteUserDefaultFilterValues(.*)"),
				response: function(oXhr, sUrlParams) {
					oXhr.respond(200, {
						headers: {
							"Content-Type": "application/json;charset=utf-8",
							"DataServiceVersion": "1.0"
						}
					}, JSON.stringify({}));
				}
			});

			// aRequests.push({
			// 	method: "POST",
			// 	path: new RegExp("(.*)PostDocuments"),
			// 	response: function(oXhr, sUrlParams) {
			// 		//debugger;
			// 		jQuery.sap.log.debug("Mock Server: Incoming request for order");
			// 		var oResponse = {
			// 			status: 201,
			// 			statusText: "Created",
			// 			headers: {
			// 				"Content-Type": "application/json;charset=utf-8",
			// 				"DataServiceVersion": "1.0"
			// 			},
			// 			data: {
			// 				"StoreID": "0056",
			// 				// "DocumentInternalID": "X0007966125",
			// 				// "Barcode": "",
			// 				// "DocumentDisplayID": "000000087000980001",
			// 				"DocumentType": "X",
			// 				"PostingState": "8",
			// 				"PostingMessage": "",
			// 				"ProcessingState": "",
			// 				"LastProcessedTime": "\/Date(1521803188000)\/",
			// 				// "TotalItemsCount": "66.0",
			// 				// "PostedItemsCount": "66.0",
			// 				// "CheckedItemsCount": "66.0",
			// 				"MoveReasonID": "0000"
			// 					// "ReceivingStoreID": "",
			// 					// "UserIdentifier": ""
			// 			}
			// 		};
			// 		oXhr.respond(oResponse.status, oResponse.headers, JSON.stringify({
			// 			d: oResponse.data
			// 		}));
			// 	}
			// });

			oMockServer.setRequests(aRequests);

			var fnResponse = function(iErrCode, sMessage, aRequest) {
				aRequest.response = function(oXhr) {
					oXhr.respond(iErrCode, {
						"Content-Type": "text/plain;charset=utf-8"
					}, sMessage);
				};
			};

			// handling the metadata error test
			if (oUriParameters.get("metadataError")) {
				aRequests.forEach(function(aEntry) {
					if (aEntry.path.toString().indexOf("$metadata") > -1) {
						fnResponse(500, "metadata Error", aEntry);
					}
				});
			}

			// Handling request errors
			if (sErrorParam) {
				aRequests.forEach(function(aEntry) {
					if (aEntry.path.toString().indexOf(sEntity) > -1) {
						fnResponse(iErrorCode, sErrorParam, aEntry);
					}
				});
			}

			oMockServer.start();
			jQuery.sap.log.info("Running the app with mock data");
		},
		/**
		 * @public returns the mockserver of the app, should be used in integration tests
		 * @returns {sap.ui.core.util.MockServer} the mockserver instance
		 */
		getMockServer: function() {
			return oMockServer;
		}
	};
});