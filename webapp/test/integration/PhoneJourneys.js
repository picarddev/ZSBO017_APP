jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
jQuery.sap.require("sap.ui.test.opaQunit");
jQuery.sap.require("sap.ui.test.Opa5");

jQuery.sap.require("picard.test.opatest.test.integration.pages.Common");
jQuery.sap.require("picard.test.opatest.test.integration.pages.App");
jQuery.sap.require("picard.test.opatest.test.integration.pages.Browser");
jQuery.sap.require("picard.test.opatest.test.integration.pages.Master");
jQuery.sap.require("picard.test.opatest.test.integration.pages.Detail");
jQuery.sap.require("picard.test.opatest.test.integration.pages.NotFound");

sap.ui.test.Opa5.extendConfig({
	arrangements: new picard.test.opatest.test.integration.pages.Common(),
	viewNamespace: "picard.test.opatest.view."
});

jQuery.sap.require("picard.test.opatest.test.integration.NavigationJourneyPhone");
jQuery.sap.require("picard.test.opatest.test.integration.NotFoundJourneyPhone");
jQuery.sap.require("picard.test.opatest.test.integration.BusyJourneyPhone");
