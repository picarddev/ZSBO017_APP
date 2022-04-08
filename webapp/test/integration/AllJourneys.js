jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
jQuery.sap.require("sap.ui.test.opaQunit");
jQuery.sap.require("sap.ui.test.Opa5");

jQuery.sap.require("retail.store.receiveproduct.Z_SBO017B_RECV_PROD.test.integration.pages.Common");
jQuery.sap.require("retail.store.receiveproduct.Z_SBO017B_RECV_PROD.test.integration.pages.App");
jQuery.sap.require("retail.store.receiveproduct.Z_SBO017B_RECV_PROD.test.integration.pages.Browser");
jQuery.sap.require("retail.store.receiveproduct.Z_SBO017B_RECV_PROD.test.integration.pages.Store");
jQuery.sap.require("retail.store.receiveproduct.Z_SBO017B_RECV_PROD.test.integration.pages.Master");
jQuery.sap.require("retail.store.receiveproduct.Z_SBO017B_RECV_PROD.test.integration.pages.Detail");
jQuery.sap.require("retail.store.receiveproduct.Z_SBO017B_RECV_PROD.test.integration.pages.NotFound");

sap.ui.test.Opa5.extendConfig({
	arrangements: new retail.store.receiveproduct.Z_SBO017B_RECV_PROD.test.integration.pages.Common(),
	viewNamespace: "retail.store.receiveproduct.view."
});

jQuery.sap.require("retail.store.receiveproduct.Z_SBO017B_RECV_PROD.test.integration.StoreJourney");
// jQuery.sap.require("retail.store.receiveproduct.Z_SBO017B_RECV_PROD.test.integration.MasterJourney");
//jQuery.sap.require("retail.store.receiveproduct.Z_SBO017B_RECV_PROD.test.integration.HUProcessingJourney");
// jQuery.sap.require("retail.store.receiveproduct.Z_RTST_RECV_PROD.test.integration.NavigationJourney");
// jQuery.sap.require("retail.store.receiveproduct.Z_RTST_RECV_PROD.test.integration.NotFoundJourney");
// jQuery.sap.require("retail.store.receiveproduct.Z_RTST_RECV_PROD.test.integration.BusyJourney");
// jQuery.sap.require("retail.store.receiveproduct.Z_RTST_RECV_PROD.test.integration.FLPIntegrationJourney");