jQuery.sap.declare("retail.store.receiveproduct.Z_SBO017B_RECV_PROD.Component");
// use the load function for getting the optimized preload file if present
sap.ui.component.load({
	name: "retail.store.receiveproduct",
	// Use the below URL to run the extended application when SAP-delivered application is deployed on SAPUI5 ABAP Repository
	url: "/sap/bc/ui5_ui5/sap/RTST_RECV_PROD" // we use a URL relative to our own component
		// extension application is deployed with customer namespace
});
sap.ui.component.load({
	name: "picard.sbo025.tagcoloritem",
	// Use the below URL to run the extended application when SAP-delivered application is deployed on SAPUI5 ABAP Repository
	url: "/sap/bc/ui5_ui5/sap/Z_SBO025_TAG_IT" // we use a URL relative to our own component
		// extension application is deployed with customer namespace
});
this.retail.store.receiveproduct.Component.extend("retail.store.receiveproduct.Z_SBO017B_RECV_PROD.Component", {
	metadata: {
		version: "1.7",
		includes: ["css/CommonCustom.css", "/sap/bc/ui5_ui5/sap/Z_SBO025_TAG_IT/css/style.css"],
		config: {
			"sap.ca.i18Nconfigs": {
				bundleName: "retail.store.receiveproduct.Z_SBO017B_RECV_PROD.i18n.i18n"
			},
			"sap.ca.serviceConfigs": [{
				name: "ZSBO017B_RECEIVE_PRODUCT_SRV",
				serviceUrl: "/sap/opu/odata/sap/ZSBO017B_RECEIVE_PRODUCT_SRV/",
				isDefault: true
			}]
		},
		customizing: {
			"sap.ui.viewModifications": {
				"retail.store.receiveproduct.view.ProductList": {
					"receiveProductsSearchFieldProductsTablet": {
						"visible": false
					},
					"receiveProductsHBoxImagePlaceholderTablet": {
						"visible": false
					},
					"receiveProductsIconThumbnailTablet": {
						"visible": false
					}
				},
				"retail.store.receiveproduct.view.ProductDetails": {
					"receiveProductsLabelOpenQuantity": {
						"visible": false
					},
					"receiveProductsHBoxOpenQuantity": {
						"visible": false
					},
					"receiveProductsLabelMerchandiseCategory": {
						"visible": false
					},
					"receiveProductsTextMerchandiseCategory": {
						"visible": false
					}
				},
				"retail.store.receiveproduct.view.DocumentList": {
					"receiveProductsObjAttrDeliveryDate": {
						"visible": false
					}
				}
			},
			"sap.ui.controllerExtensions": {
				"retail.store.receiveproduct.Main": {
					"controllerName": "retail.store.receiveproduct.Z_SBO017B_RECV_PROD.MainCustom"
				},
				"retail.store.receiveproduct.view.ProductDetails": {
					"controllerName": "retail.store.receiveproduct.Z_SBO017B_RECV_PROD.view.ProductDetailsCustom"
				},
				"retail.store.receiveproduct.view.DocumentList": {
					"controllerName": "retail.store.receiveproduct.Z_SBO017B_RECV_PROD.view.DocumentListCustom"
				},
				"retail.store.receiveproduct.view.ProductList": {
					"controllerName": "retail.store.receiveproduct.Z_SBO017B_RECV_PROD.view.ProductListCustom"
				}
			},
			"sap.ui.viewExtensions": {
				"retail.store.receiveproduct.view.ProductDetails": {
					"quantitiesFormExtension": {
						"className": "sap.ui.core.Fragment",
						"fragmentName": "retail.store.receiveproduct.Z_SBO017B_RECV_PROD.view.ProductDetails_quantitiesFormExtensionCustom",
						"type": "XML"
					},
					"headerAttributeExtension": {
						"className": "sap.ui.core.Fragment",
						"fragmentName": "retail.store.receiveproduct.Z_SBO017B_RECV_PROD.view.ProductDetails_headerAttributeExtensionCustom",
						"type": "XML"
					},
					"pageContentExtension": {
						"className": "sap.ui.core.Fragment",
						"fragmentName": "retail.store.receiveproduct.Z_SBO017B_RECV_PROD.view.ProductDetails_pageContentExtensionCustom",
						"type": "XML"
					}
				},
				"retail.store.receiveproduct.view.DocumentList": {
					"listAttributeExtension": {
						"className": "sap.ui.core.Fragment",
						"fragmentName": "retail.store.receiveproduct.Z_SBO017B_RECV_PROD.view.DocumentList_listAttributeExtensionCustom",
						"type": "XML"
					}
				},
				"retail.store.receiveproduct.view.fragments.DocumentListFooterEdit": {
					"footerToolbarEditContentExtension": {
						"className": "sap.ui.core.Fragment",
						"fragmentName": "retail.store.receiveproduct.Z_SBO017B_RECV_PROD.view.fragments.DocumentListFooterEdit_footerToolbarEditContentExtensionCustom",
						"type": "XML"
					}
				},
				"retail.store.receiveproduct.view.ProductList": {
					"productAttributesGTINReplacement": {
						"className": "sap.ui.core.Fragment",
						"fragmentName": "retail.store.receiveproduct.Z_SBO017B_RECV_PROD.view.ProductList_productAttributesGTINReplacementCustom",
						"type": "XML"
					},
					"productAttributesExtension": {
						"className": "sap.ui.core.Fragment",
						"fragmentName": "retail.store.receiveproduct.Z_SBO017B_RECV_PROD.view.ProductList_productAttributesExtensionCustom",
						"type": "XML"
					},
					"productQuantitiesCellReplacement": {
						"className": "sap.ui.core.Fragment",
						"fragmentName": "retail.store.receiveproduct.Z_SBO017B_RECV_PROD.view.ProductList_productQuantitiesCellReplacementCustom",
						"type": "XML"
					},
					"productOpenQuantityCellReplacementTablet": {
						"className": "sap.ui.core.Fragment",
						"fragmentName": "retail.store.receiveproduct.Z_SBO017B_RECV_PROD.view.ProductList_productOpenQuantityCellReplacementTabletCustom",
						"type": "XML"
					},
					"tableHeaderToolbarExtension": {
						"className": "sap.ui.core.Fragment",
						"fragmentName": "retail.store.receiveproduct.Z_SBO017B_RECV_PROD.view.ProductList_tableHeaderToolbarExtensionCustom",
						"type": "XML"
					},
					"productTableColumnExtension": {
						"className": "sap.ui.core.Fragment",
						"fragmentName": "retail.store.receiveproduct.Z_SBO017B_RECV_PROD.view.ProductList_productTableColumnExtensionCustom",
						"type": "XML"
					},
					"productTableCellExtension": {
						"className": "sap.ui.core.Fragment",
						"fragmentName": "retail.store.receiveproduct.Z_SBO017B_RECV_PROD.view.ProductList_productTableCellExtensionCustom",
						"type": "XML"
					},
					"headerThirdStatusReplacement": {
						"className": "sap.ui.core.Fragment",
						"fragmentName": "retail.store.receiveproduct.Z_SBO017B_RECV_PROD.view.ProductList_headerThirdStatusReplacementCustom",
						"type": "XML"
					},
					"headerAttributeExtension": {
						"className": "sap.ui.core.Fragment",
						"fragmentName": "retail.store.receiveproduct.Z_SBO017B_RECV_PROD.view.ProductList_headerAttributeExtensionCustom",
						"type": "XML"
					}
				},
				"retail.store.receiveproduct.view.fragments.ProductDetailsFooter": {
					"footerBarReplacement": {
						"className": "sap.ui.core.Fragment",
						"fragmentName": "retail.store.receiveproduct.Z_SBO017B_RECV_PROD.view.fragments.ProductDetailsFooter_footerBarReplacementCustom",
						"type": "XML"
					}
				},
				"retail.store.receiveproduct.view.fragments.ProductListFooter": {
					"footerBarReplacement": {
						"className": "sap.ui.core.Fragment",
						"fragmentName": "retail.store.receiveproduct.Z_SBO017B_RECV_PROD.view.fragments.ProductListFooter_footerBarReplacementCustom",
						"type": "XML"
					}
				}
			}
		}
	}
});