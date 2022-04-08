jQuery.sap.require("retail.store.receiveproduct.Z_SBO017B_RECV_PROD.utils.DataChangeUtil");
jQuery.sap.require("retail.store.receiveproduct.Z_SBO017B_RECV_PROD.utils.PostingUtil");
sap.ui.controller("retail.store.receiveproduct.Z_SBO017B_RECV_PROD.view.ProductListCustom", {

	_mDialogs: {}, // Dialogs for the productlist view (e.g. filter dialog)
	_sCurrentMoveReasonTCode: "",
	_sUserIdentifier: null,

	//			
	// TFS 5050 : Migration vers la nouvelle gateway Fiori
	//			  Depuis la v1.30 le le SAP Fiori Launchpad applique automatiquement la classe sapUiSizeCompact
	//		      sur le tag <body> de la page. On supprime cette classe pour conserver un agencement correct
	//		      des contrôles graphiques UI5.

	init: function () {
		// Appel des traitements standard
		retail.store.receiveproduct.view.ProductList.prototype.init.call(this);

		if (jQuery(document.body).hasClass("sapUiSizeCompact")) {
			jQuery.sap.delayedCall(500, this, function () {
				jQuery(document.body).removeClass("sapUiSizeCompact");
			});
		}
	},

	/**
	 * TFS 4955 : Le système contrôle la validité de la qté reçue saisie (point et virgule sont autorisés)
	 *			  sinon un message bloquant informe l'utilisateur.
	 *		   
	 *			  Le système contrôle que la quantité reçue est un multiple du PCB.
	 *			  sinon un message d'alerte non bloquant informe l'utilisateur..
	 * 
	 * @param {oEvent} 
	 * @returns {void} 
	 */

	onReceiveQuantityChange: function (oEvent) {
		var oInput = oEvent.getSource();
		var sValue = oEvent.getParameter("value");
		sValue = sValue.replace(",", "."); // autoriser la virgule et le point comme séparateur valide

		// Check if an invalid value was entered
		if (!retail.store.receiveproduct.utils.Formatter.isValidReceiveQuantity(sValue)) {
			// Display error message
			retail.store.receiveproduct.utils.MessageUtil.showMessageBox({
				type: sap.ca.ui.message.Type.ERROR,
				message: sap.retail.store.lib.reuse.util.TextUtil.getText("ERROR_MSG_NOT_NUMERIC")
			});

			// Reset the value of the input field to the last valid state
			oInput.getBinding("value").refresh(true);
		} else {
			// vérifier que la quantité livrée est un multiple du PCB
			var fNumberOfLowerLevelUoM = retail.store.receiveproduct.utils.DataManager.getNumberOfLowerLevelUoM(oInput.getBindingContext().getObject());
			//TFS-5567 : Début AMAHJOUB(-) enlever la vérification sur multiple PCB.
			/*if (!retail.store.receiveproduct.utils.Formatter.isValidReceiveQuantityWithBaseUnit(sValue, fNumberOfLowerLevelUoM)) {
				// Display warning message
				retail.store.receiveproduct.utils.MessageUtil.showMessageBox({
					type: sap.ca.ui.message.Type.WARNING,
					message: sap.retail.store.lib.reuse.util.TextUtil.getText("ERROR_MSG_NOT_CONVERSION_FACTOR")
				});
			}*/
			var oItem = oInput.getParent().getParent();
			retail.store.receiveproduct.utils.ScanUtil.handleReceiveQuantityChange(oItem, Number(sValue));
		}
	},

	/**
	 * TFS 5833 : Cette méthode est une copie de la méthode standard. On vérifie que la  
	 *			  qté reçue est un multiple du PCB sinon un message d'alerte non bloquant
	 *			  informe l'utilisateur.  
	 * 
	 * @param {} 
	 * @returns {void} 
	 */

	checkReceiveQuantityChange: function () {
		var sQuantity, oInput, sValue;

		var aItems = this.getProductTable().getItems();
		for (var i = 0; i < aItems.length; i++) {
			// Get current receive quantity in model
			sQuantity = aItems[i].getBindingContext().getProperty("ReceiveQuantity");
			// Compare with value in Input field
			oInput = this.findInputField(aItems[i]);
			if (oInput) {
				sValue = oInput.getValue();
				if (Number(sValue) !== retail.store.receiveproduct.utils.Formatter.formatReceiveQuantityForInput(sQuantity)) {
					// Check if an invalid value was entered
					if (!retail.store.receiveproduct.utils.Formatter.isValidReceiveQuantity(sValue)) {
						// Display error message
						retail.store.receiveproduct.utils.MessageUtil.showMessageBox({
							type: sap.ca.ui.message.Type.ERROR,
							message: sap.retail.store.lib.reuse.util.TextUtil.getText("ERROR_MSG_NOT_NUMERIC")
						});
						// Reset the value of the input field to the last valid state
						oInput.getBinding("value").refresh(true);
					} else {
						retail.store.receiveproduct.utils.ScanUtil.handleReceiveQuantityChange(aItems[i], Number(sValue));
					}
					// Qté livrée multiple du PCB ?
					var fNumberOfLowerLevelUoM = retail.store.receiveproduct.utils.DataManager.getNumberOfLowerLevelUoM(oInput.getBindingContext().getObject());
					//TFS-5567 : Début AMAHJOUB(-) enlever la vérification sur multiple PCB.
					/*	if (!retail.store.receiveproduct.utils.Formatter.isValidReceiveQuantityWithBaseUnit(sValue, fNumberOfLowerLevelUoM)) {
							// Display warning message
							retail.store.receiveproduct.utils.MessageUtil.showMessageBox({
								type: sap.ca.ui.message.Type.WARNING,
								message: sap.retail.store.lib.reuse.util.TextUtil.getText("ERROR_MSG_NOT_CONVERSION_FACTOR")
							});
						}*/
				}
			}
		}

		/**
		 * 
		 * TFS 4391 : Contrôler le stock réserve sur les évènements de la page :
		 *			  onUpButtonPress, onDownButtonPress, onNavBack.
		 */
		this.checkStockRoomQuantityChange();
	},

	/**
	 * 
	 * TFS 4391 : Contrôler et mettre à jour le model et le backend du stock réserve
	 *
	 * @returns {void} 
	 */

	checkStockRoomQuantityChange: function () {
		var sQuantity, oInput, sValue;

		var aItems = this.getProductTable().getItems();
		for (var i = 0; i < aItems.length; i++) {
			// Get current receive quantity in model
			sQuantity = aItems[i].getBindingContext().getProperty("StockRoomQuantity");
			// Compare with value in Input field
			oInput = this.findStockRoomInputField(aItems[i]); // TFS ? : 
			if (oInput) {
				sValue = oInput.getValue();
				if (Number(sValue) !== retail.store.receiveproduct.utils.Formatter.formatReceiveQuantityForInput(sQuantity)) {
					// Check if an invalid value was entered
					if (!retail.store.receiveproduct.utils.Formatter.isValidReceiveQuantity(sValue)) {
						// Display error message
						retail.store.receiveproduct.utils.MessageUtil.showMessageBox({
							type: sap.ca.ui.message.Type.ERROR,
							message: sap.retail.store.lib.reuse.util.TextUtil.getText("ERROR_MSG_STOCK_ROOM_NOT_NUMERIC")
						});
						// Reset the value of the input field to the last valid state
						oInput.getBinding("value").refresh(true);
					} else {
						this.setNewStockRoomQuantity(aItems[i], Number(sValue));
					}
				}
			}
		}
	},

	/**
	 * 
	 * TFS ? : Return stock room input control reference 
	 *
	 * @returns {void} 
	 */

	findStockRoomInputField: function (oItem) {
		var aInputElements = jQuery("input", oItem.getDomRef());
		if (aInputElements.length > 0) {
			return jQuery(aInputElements[1]).control(0);
		} else {
			return null;
		}
	},

	/**
	 * TFS 2784 : Cette méthode effectue le binding de la vue ProductList à partir du backend.
	 *			  1) On Surchage la méthode standard pour ajouter la gestion des Rolls Supplémentaires. 
	 *			  2) On gère également la liste des motifs de refus applicable aux postes avec l'appel
	 *				 à la méthode createMoveReasonModel.
	 * 
	 * @param {sStoreID} String Code Magasin
	 * @param {sDocumentID} String N° du document (roll)
	 * @param {bItemsOnly} Seul les postes du documents sont traités et maj à partir du backend
	 * @returns {void} 
	 */

	setDocumentAndItemData: function (sStoreID, sDocumentID, bItemsOnly) {
		var oTable = this.getProductTable();
		var oDocItemsDeferred;
		var oTextUtil = sap.retail.store.lib.reuse.util.TextUtil;
		var oConstant = retail.store.receiveproduct.utils.Constants.Picard;

		var fnSetDocumentData = jQuery.proxy(function (oDocData) {
			// Set the document data to the view
			this.getView().getModel("Document").setData(oDocData);

			// Display navigation button on phone or in case of sub HU
			var oPage = this.getPage();
			if (sap.ui.Device.system.phone ||
				(oDocData.HighestLevelHUDocumentInternalID && oDocData.HighestLevelHUDocumentInternalID !== oDocData.DocumentInternalID)) {
				oPage.setShowNavButton(true);
			} else {
				oPage.setShowNavButton(false);
			}

			/* TFS 3709 : RDG150A : Modifier les informations du roll en entête de l’écran  */
			var oStore = this.getMasterController()._oStore;
			if (oStore.StoreID && oStore.StoreName) {
				oPage.setTitle(oTextUtil.getText("PRODUCT_LIST_TITLE_STORE", [oStore.StoreID, oStore.StoreName]));
			} else {
				oPage.setTitle(oTextUtil.getText("PRODUCT_LIST_TITLE"));
			}

			// TFS 4975 : Cacher la colonne vers réserve si lme PDV n'a pas les autorisations
			var oModel = this.getOwnerComponent().getModel("layoutStatus");
			oModel.setProperty("/StockRoomUseAllowed", oStore.StockRoomUseAllowed);

			// Change unit number from ObjectListItem List
			if (oConstant.aDeliveryTypeWithNumberUnitException.indexOf(oDocData.DeliveryType) !== -1) {
				this.byId("receiveProductsObjectHeaderDocument").setNumberUnit(oTextUtil.getText("COMMON_PIECES_UVC"));
			} else {
				this.byId("receiveProductsObjectHeaderDocument").setNumberUnit(oTextUtil.getText("COMMON_PIECES"));
			}

			// Update the action sheet buttons (bookmark, share, ...)
			// this.updateActionSheetButtons();

			/**
			 *	TFS 2784 : Appel du backend pour lister les motifs de postes coté backend.
			 *			   Les motifs sont différents s'il s'agit d'un roll supplémentaire		
			 */

			if (oDocData.hasOwnProperty("OwnerStoreID") && oDocData.OwnerStoreID !== oDocData.StoreID) {
				this.createMoveReasonModel(sStoreID, retail.store.receiveproduct.utils.Constants.Picard.moveReasonFilter.additionalRollProcessing);
			} else {
				this.createMoveReasonModel(sStoreID, retail.store.receiveproduct.utils.Constants.Picard.moveReasonFilter.rollProcessing);
			}

		}, this);

		var fnSetDocumentItemData = jQuery.proxy(function (oData) {

			// Success callback
			oTable.setProductData(oData.results);

			// The document items are available now
			oDocItemsDeferred.resolve();

			// Scroll to top after new document was selected
			this.getPage().scrollTo(0, 0);

			var sLastScannedProduct = retail.store.receiveproduct.utils.ScanUtil.getLastScannedProduct();
			var sBarcode = retail.store.receiveproduct.utils.ScanUtil.getLastScannedBarcode();
			if (sLastScannedProduct) {
				// Focus the last scanned product after the list was updated
				this.processAfterListUpdate(jQuery.proxy(this.processLastScannedProduct, this, sLastScannedProduct, sBarcode));
			}
		}, this);

		// Set product table to busy mode
		oTable.setBusy(true);
		oDocItemsDeferred = jQuery.Deferred();
		oDocItemsDeferred.always(function () {
			oTable.setBusy(false);
		});

		if (!bItemsOnly) {

			// Get the document
			var oDocument = retail.store.receiveproduct.utils.DataManager.getDocument(sStoreID, sDocumentID);

			// Use expand feature of GET Documents if supported by OData service
			var mUrlParameters;
			if (this.getView().getModel("appMode").getProperty("/perfOptAvailable")) {
				mUrlParameters = {
					"$expand": "DocumentItems/Product/ProductQuantityUnit,DocumentItems/Product/ProductGlobalTradeItemNumber"
				};
			}

			/**
			 * TFS 2784 : Si la propriété OwnerStoreID est valorisée (cf DocumentListCustom.readDocumentFromAnotherStore) alors
			 *			  il s'agit du traitement d'un roll supplémentaire. On appelle la méthode readDocumentFromAnotherStore.
			 */
			if (oDocument && oDocument.hasOwnProperty("OwnerStoreID") && oDocument.OwnerStoreID !== oDocument.StoreID) {
				fnSetDocumentData(oDocument);
				// Re-read the document
				retail.store.receiveproduct.utils.DataManager.readDocumentFromAnotherStore(oDocument.OwnerStoreID, sStoreID, sDocumentID,
					mUrlParameters,
					function (oData) {
						// Trigger a refresh for the document
						retail.store.receiveproduct.utils.DataManager.triggerDocumentRefresh([sDocumentID]);
						if (oData.DocumentItems.results) {
							fnSetDocumentItemData(oData.DocumentItems);
						}
					});
			} else if (oDocument) {
				fnSetDocumentData(oDocument);
				// Re-read the document
				retail.store.receiveproduct.utils.DataManager.readSingleDocument(sStoreID, sDocumentID, mUrlParameters, function (oData) {
					// Trigger a refresh for the document
					retail.store.receiveproduct.utils.DataManager.triggerDocumentRefresh([sDocumentID]);
					if (oData.DocumentItems.results) {
						fnSetDocumentItemData(oData.DocumentItems);
					}
				});
			} else {
				// Try to read the document from backend
				retail.store.receiveproduct.utils.DataManager.readSingleDocument(sStoreID, sDocumentID, mUrlParameters, function (oData) {
					if (oData && oData.DocumentInternalID) {
						if (oData.DocumentItems.results) {
							fnSetDocumentItemData(oData.DocumentItems);
							oData.DocumentItems = {
								results: null
							};
						}
						fnSetDocumentData(oData);
					}
				}, function (oError) {
					// Error callback
					retail.store.receiveproduct.utils.MessageUtil.showMessageBox({
						type: sap.ca.ui.message.Type.ERROR,
						message: sap.retail.store.lib.reuse.util.TextUtil.getText("ERROR_MSG_DOC_NOT_FOUND"),
						details: sap.retail.store.lib.reuse.util.TextUtil.getMessageForErrorResponses([oError])
					});
				});
			}
		}

		if (bItemsOnly || !mUrlParameters) {
			// Read products for current document
			retail.store.receiveproduct.utils.DataManager.readItemsForDocument(sStoreID, sDocumentID, fnSetDocumentItemData, function (oError) {
				// Error callback
				oTable.setProductData(null);
				retail.store.receiveproduct.utils.MessageUtil.showMessageBox({
					type: sap.ca.ui.message.Type.ERROR,
					message: sap.retail.store.lib.reuse.util.TextUtil.getText("ERROR_MSG_DOC_ITEM_REQUEST_FAILED"),
					details: sap.retail.store.lib.reuse.util.TextUtil.getMessageForErrorResponses([oError])
				});
				oDocItemsDeferred.fail();
			});
		}
	},

	/**
	 * 
	 * TFS 4391 : Make sure that the content of the input field for return quantities is preselected when focused
	 * 
	 * @returns {void} 
	 */

	handleDeviceSpecificFeatures: function () {
		// Appel des traitements standard
		retail.store.receiveproduct.view.ProductList.prototype.handleDeviceSpecificFeatures.call(this);

		var fnFocusIn = function () {
			// Call the select method, which works for some device/browser combinations
			jQuery.sap.delayedCall(0, this.getFocusDomRef(), "select");

			// Additionally call the selectText method, which works for some other device/browser combinations
			if (this.selectText) {
				jQuery.sap.delayedCall(100, this, "selectText", [0, this.getValue().length]);
			} else {
				jQuery.sap.delayedCall(100, jQuery(this.getFocusDomRef()), "selectText", [0, this.getValue().length]);
			}

			if (sap.ui.Device.system.desktop) {
				if (this.getId().indexOf("receiveProductsInputReceiveQuantitySwitch") !== -1 || this.getId().indexOf(
						"receiveProductsInputReceiveQuantityTablet") !== -1 || this.getId().indexOf("receiveProductsInputStockRoomQuantityLargeLayout") !==
					-1) {
					this.setType(sap.m.InputType.Text);
				}
			}
		};

		var oInput = this.getView().byId("receiveProductsInputStockRoomQuantityLargeLayout");
		oInput.addEventDelegate({
			onfocusin: fnFocusIn
		}, oInput);

		oInput = this.getView().byId("receiveProductsInputReceiveQuantityTablet");
		oInput.addEventDelegate({
			onfocusin: fnFocusIn
		}, oInput);

		oInput = this.getView().byId("receiveProductsInputReceiveQuantitySwitch");
		oInput.addEventDelegate({
			onfocusin: fnFocusIn
		}, oInput);
	},

	/**
	 * 
	 * TFS 2784 : Cette méthode affiche la popup d'ajout d'un article non prévu dans le bon de livraison
	 * TFS 3974 : Ajouter article via Scan 
	 * @param {oEvent} event 
	 * @returns {void} 
	 */

	onAddProductButtonPress: function (oEvent) {
		this.switchTableMode("Standard");
		var oDocument = this.getView().getModel("Document").getData();
		var sStoreID = oDocument.StoreID;
		// Lock barcode scanning before opening the message box
		sap.retail.store.lib.reuse.util.BarcodeScanHandler.lockBarcodeScanHandling();

		var oDialog = this._mDialogs.ProductID;
		if (!oDialog) {
			// Create input dialog
			var oLabelProductID = new sap.m.Label({
				text: sap.retail.store.lib.reuse.util.TextUtil.getText("ADD_PRODUCT_ID_LABEL")
			});
			var oInputProductID = new sap.m.Input({
				type: sap.m.InputType.Number
			});

			var fnCloseDialog = function () {
				sap.retail.store.lib.reuse.util.BarcodeScanHandler.unlockBarcodeScanHandling();
				oInputProductID.setValue("");
				oDialog.close();
			};
			var fnSubmitDialog = function () {
				var sProductID = oInputProductID.getValue();
				if (sProductID.match(/^\d{2,6}$/)) { // limit the length of a product id (6 caracters max)
					fnCloseDialog();
					this.createPostDocumentItem(sProductID);
				}
			}.bind(this);
			var fnAddScannedArticle = function () {
				sap.retail.store.lib.reuse.util.BarcodeScanHandler.unlockBarcodeScanHandling();
				sap.ndc.BarcodeScanner.scan(
					function (oResult) {
						//success
						var sArticle;
						var sBarcode;
						if (oResult.text) {
							sBarcode = oResult.text.trim();
						}
						retail.store.receiveproduct.utils.DataManager.barCodeGetArticle(
							sStoreID,
							sBarcode, jQuery.proxy(function (oData) {
								sArticle = oData.ProductID;
								oInputProductID.setValue(sArticle);
								fnSubmitDialog();
							}, this),
							function (oError) {
								// Error callback
								retail.store.receiveproduct.utils.MessageUtil.showMessageBox({
									type: sap.ca.ui.message.Type.ERROR,
									message: sap.retail.store.lib.reuse.util.TextUtil.getText("ERROR_MSG_DOC_ADD_ITEM_NOT_FOUND"),
									details: sap.retail.store.lib.reuse.util.TextUtil.getMessageForErrorResponses([oError])
								});
							});

					},
					function (oError) {
						// Error callback
						retail.store.receiveproduct.utils.MessageUtil.showMessageBox({
							type: sap.ca.ui.message.Type.ERROR,
							message: sap.retail.store.lib.reuse.util.TextUtil.getText("ERROR_MSG_DOC_ADD_ITEM_NOT_FOUND"),
							details: sap.retail.store.lib.reuse.util.TextUtil.getMessageForErrorResponses([oError])
						});
					},
					function (oResult) {
						//handle input dialog change
						var sArticle;
						var sBarcode;
						if (oResult.text) {
							sBarcode = oResult.text.trim();
						}
						retail.store.receiveproduct.utils.DataManager.barCodeGetArticle(
							sStoreID,
							sBarcode, jQuery.proxy(function (oData) {
								sArticle = oData.ProductID;
								oInputProductID.setValue(sArticle);
							}, this),
							function (oError) {
								// Error callback
								retail.store.receiveproduct.utils.MessageUtil.showMessageBox({
									type: sap.ca.ui.message.Type.ERROR,
									message: sap.retail.store.lib.reuse.util.TextUtil.getText("ERROR_MSG_DOC_ADD_ITEM_NOT_FOUND"),
									details: sap.retail.store.lib.reuse.util.TextUtil.getMessageForErrorResponses([oError])
								});
							});
					}
				);
			};
			var oOkBtn = new sap.m.Button({
				text: sap.retail.store.lib.reuse.util.TextUtil.getText("COMMON_OK"),
				press: jQuery.proxy(function () {
					fnSubmitDialog();
				}, this)
			});
			var oCancelBtn = new sap.m.Button({
				text: sap.retail.store.lib.reuse.util.TextUtil.getText("COMMON_CANCEL"),
				press: fnCloseDialog
			});
			jQuery.sap.require("sap.ndc.BarcodeScanner");
			var oAddScanBtn = new sap.m.Button({
				icon: "sap-icon://bar-code",
				press: fnAddScannedArticle
			});
			if (sap.ui.Device.system.desktop) {
				oDialog = new sap.m.Dialog({
					title: sap.retail.store.lib.reuse.util.TextUtil.getText("NEW_PRODUCT_ID_TITLE"),
					type: "Message",
					content: [
						oLabelProductID,
						oInputProductID
					],
					buttons: [
						oOkBtn,
						oCancelBtn
					]
				});
			} else {
				oDialog = new sap.m.Dialog({
					title: sap.retail.store.lib.reuse.util.TextUtil.getText("NEW_PRODUCT_ID_TITLE"),
					type: "Message",
					content: [
						oLabelProductID,
						oInputProductID
					],
					buttons: [
						oAddScanBtn,
						oOkBtn,
						oCancelBtn
					]
				});
			}
			oInputProductID.onsapenter = function (e) {
				jQuery.sap.delayedCall(100, this, fnSubmitDialog);
			};
			this._mDialogs.ProductID = oDialog;
			this.getView().addDependent(oDialog);

			if (this.getView().$().closest(".sapUiSizeCompact").length) {
				jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), oDialog);
			}
		}

		oDialog.open();

		jQuery.sap.delayedCall(200, oDialog, function () {
			this.getContent()[1].focus();
		});
	},

	/**
	 * TFS 2784 : Cette méthode ajoute à la liste des articles du roll l'article non prévu dans le bon de livraison
	 * 
	 * @param {sProductID} code article du produit à ajouter 
	 * @returns {void} 
	 */

	createPostDocumentItem: function (sProductID) {
		var oDocument = this.getView().getModel("Document").getData();
		var sStoreID = oDocument.StoreID;
		var sDocumentID = oDocument.DocumentInternalID;
		// Read product data from backend
		retail.store.receiveproduct.utils.DataManager.createPostDocumentItem(sStoreID, sDocumentID, sProductID, jQuery.proxy(function (
			oNewDocumentItem) {
			if (oNewDocumentItem) {
				this.oRouter.navTo("toProductDetails", {
					StoreID: sStoreID,
					DocumentID: oNewDocumentItem.DocumentInternalID,
					DocumentItemID: oNewDocumentItem.DocumentItemInternalID
				}, !sap.ui.Device.system.phone);
			}
		}, this), function (oError) { // sollte nicht vorkommen
			// Error callback
			retail.store.receiveproduct.utils.MessageUtil.showMessageBox({
				type: sap.ca.ui.message.Type.ERROR,
				message: sap.retail.store.lib.reuse.util.TextUtil.getText("ERROR_MSG_DOC_ADD_ITEM_NOT_FOUND"),
				details: sap.retail.store.lib.reuse.util.TextUtil.getMessageForErrorResponses([oError])
			});
		});
	},

	/**
	 * TFS 3729 : Les articles ajoutés par la RDG160A peuvent être supprimés
	 * 
	 * @param {oEvent} 
	 * @returns {void} 
	 */

	onRemoveDocumentItemButtonPress: function (oEvent) {
		var oSource = oEvent.getSource();
		var oContext = oSource.getBindingContext();
		var sStoreID = oContext.getProperty("StoreID");
		var sDocumentID = oContext.getProperty("DocumentInternalID");
		var sDocumentItemID = oContext.getProperty("DocumentItemInternalID");
		var sProductID = oContext.getProperty("ProductID");

		var fnConfirm = jQuery.proxy(function () {
			retail.store.receiveproduct.utils.DataManager.removePostDocumentItem(sStoreID, sDocumentID, sDocumentItemID, jQuery.proxy(
				function () {
					this.setDocumentAndItemData(sStoreID, sDocumentID, false);
				},
				this), function (oError) { // sollte nicht vorkommen
				// Error callback
				retail.store.receiveproduct.utils.MessageUtil.showMessageBox({
					type: sap.ca.ui.message.Type.ERROR,
					message: sap.retail.store.lib.reuse.util.TextUtil.getText("ERROR_MSG_DOC_ITEM_REQUEST_FAILED"),
					details: sap.retail.store.lib.reuse.util.TextUtil.getMessageForErrorResponses([oError])
				});
			});
		}, this);

		sap.m.MessageBox.show(sap.retail.store.lib.reuse.util.TextUtil.getText("INFO_REMOVE_PRODUCTS_ITEM", [sProductID]), {
			icon: sap.m.MessageBox.Icon.WARNING,
			title: sap.retail.store.lib.reuse.util.TextUtil.getText("DOCUMENT_CONFIRM_POST_TITLE"),
			actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
			onClose: function (oAction) {
				if (oAction === sap.m.MessageBox.Action.YES) {
					fnConfirm();
				}
			}.bind(this)
		});
	},

	/*
	 *
	 *	RDG190M : Décorrélation du pavé  « Vers Réserve » de la validation du roll au niveau master (TFS 4391)
	 *	
	 *	L’utilisateur à la possibilité de saisir en avance de phase des valeurs dans le pavé « Vers Réserve ». 
	 *	(sans avoir reçu physiquement la marchandise) Quand il reçoit le roll, celui ci doit pouvoir être refusé 
	 *	completement en cas d’anomalie sur le roll (ex : refus température). Le système doit permettre le refus 
	 *	du roll au niveau master et ignorer les valeurs saisies dans le pavé «Vers Réserve ». On autorise 
	 *	l'annulation des saisies pour retrouver le roll dans son état initiale.
	 *
	 */

	onResetDocumentButtonPress: function () {
		var oDocument = this.getView().getModel("Document").getData();
		var sStoreID = oDocument.StoreID;
		var sDocumentID = oDocument.DocumentInternalID;

		var fnConfirm = jQuery.proxy(function () {
			retail.store.receiveproduct.utils.DataManager.removePostDocument(sStoreID, sDocumentID, function () {
				this.setDocumentAndItemData(sStoreID, sDocumentID, false);
			}.bind(this), function (oError) {
				// Error callback
				retail.store.receiveproduct.utils.MessageUtil.showMessageBox({
					type: sap.ca.ui.message.Type.ERROR,
					message: sap.retail.store.lib.reuse.util.TextUtil.getText("ERROR_MSG_DOC_ADD_ITEM_NOT_FOUND"),
					details: sap.retail.store.lib.reuse.util.TextUtil.getMessageForErrorResponses([oError])
				});
			});
		}, this);

		sap.m.MessageBox.show(sap.retail.store.lib.reuse.util.TextUtil.getText("INFO_RESET_DOCUMENT", [oDocument.DocumentDisplayID]), {
			icon: sap.m.MessageBox.Icon.WARNING,
			title: sap.retail.store.lib.reuse.util.TextUtil.getText("DOCUMENT_CONFIRM_POST_TITLE"),
			actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
			onClose: function (oAction) {
				if (oAction === sap.m.MessageBox.Action.YES) {
					fnConfirm();
				}
			}
		});
	},

	/**
	 * TFS 2784 : Cette méthode appelle le service oData Store('xxx')/MoveReasons pour lister 
	 *			  les motifs de refus applicables aux postes d'un roll (ZSBO017B).
	 * @param {sStoreID} String Code Magasin
	 * @returns {void} 
	 */

	createMoveReasonModel: function (sStoreID, sTransactionCode) {
		var oOwnerComponent = this.getOwnerComponent();

		// if (oOwnerComponent.getModel("MoveReasons")) {
		// 	return; 
		// }

		// la liste des motifs existe déjà dans le model on sort !
		if (this._sCurrentMoveReasonTCode === sTransactionCode) {
			return;
		}

		// on initialise 
		this._sCurrentMoveReasonTCode = sTransactionCode;

		// On filtre les motifs seulement applicable aux postes (ZSBO017B)
		var oFilter = new sap.ui.model.Filter("TransactionCode", sap.ui.model.FilterOperator.EQ, sTransactionCode);

		// Appel du service OData /MoveReasons
		retail.store.receiveproduct.utils.DataManager.readMoveReasons(sStoreID, oFilter, null, jQuery.proxy(function (oData) {

			var oModel = new sap.ui.model.json.JSONModel();

			oData.results.unshift({
				IsBatchMandatory: false,
				IsDestructionMandatory: false,
				IsFree: false,
				IsNoDisputeSite: false,
				IsPackageMandatory: false,
				IsReturnOrder: false,
				IsSellByDateMandatory: false,
				MoveReasonID: "0000", // Sans Motif
				MoveReasonName: "",
				MovementType: "",
				StorageLocation: "",
				StoreID: "",
				TransactionCode: sTransactionCode
			});

			// Success callback function
			oModel.setData({
				results: oData.results
			});

			oOwnerComponent.setModel(oModel, "MoveReasons"); // Conserver de façon globale à l'application ! 

		}, this), function (oError) {
			// Error callback function
			retail.store.receiveproduct.utils.MessageUtil.showMessageBox({
				type: sap.ca.ui.message.Type.ERROR,
				message: sap.retail.store.lib.reuse.util.TextUtil.getText("ERROR_MSG_MOVEREASONS_REQUEST_FAILED"),
				details: sap.retail.store.lib.reuse.util.TextUtil.getMessageForErrorResponses([oError])
			});
		});
	},

	/**
	 * TFS 2784 : Ajouter une popup de confirmation avant enregistrement complet du Roll au 
	 *			  niveau des postes.
	 * 
	 * @param {} 
	 * @returns {void} 
	 */

	onPostAllButtonPress: function () {
		var aItems = this.getProductTable().getProductData();
		if (aItems.length > 0) {
			var oText = new sap.m.Text({
				text: sap.retail.store.lib.reuse.util.TextUtil.getText("INFO_PRODUCTS_MSG_DOC_POSTING")
			});
			var oInput = new sap.m.Input({
				type: sap.m.InputType.Number,
				maxLength: 10,
				required: true,
				value: this._sUserIdentifier ? this._sUserIdentifier : "",
				initialFocus: sap.m.MessageBox.Action.YES,
				placeholder: sap.retail.store.lib.reuse.util.TextUtil.getText("INFO_PRODUCTS_USER_ID_POSTING"),
				liveChange: function (oEvent) {
					this._sUserIdentifier = oEvent.getParameter("value");
				}.bind(this)
			});
			var oVBox = new sap.m.VBox({
				items: [
					oText,
					oInput
				]
			});
			sap.m.MessageBox.show(oVBox, {
				//initialFocus: oCheck
				dialogId: "picardInfoProductsMessagePosting",
				icon: sap.m.MessageBox.Icon.WARNING,
				title: sap.retail.store.lib.reuse.util.TextUtil.getText("DOCUMENT_CONFIRM_POST_TITLE"),
				actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
				onClose: function (oAction) {
					if (oAction === sap.m.MessageBox.Action.YES) {
						if (oInput.getValue().match(/\S/)) { // any non-space character?

							/*
							 *	TFS 5659 : Interdire la double validation d'un Roll 
							 *		|	Rafraichir la liste des postes avant enregistrement et prévenir 
							 *		|	le traitement simultané sur TUL et sur tablette.
							 */
							var oData = this.getView().getModel("Document").getData();
							this.setDocumentAndItemData(oData.StoreID, oData.DocumentInternalID, false);

							/*
							 *	Attendre le retour de setDocumentAndItemData
							 */
							jQuery.sap.delayedCall(1000, this, function () {
								var oDocument = this.getView().getModel("Document").getData();

								/*
								 *	TFS 3811 : Avoir la possibilité de "signer" le traitement d'un roll
								 */
								retail.store.receiveproduct.utils.DataManager.updateUserIdentifierForDocuments(
									oDocument.StoreID, [oDocument.DocumentInternalID],
									oInput.getValue().toUpperCase()
								);

								if (oDocument.ProcessingState !== retail.store.receiveproduct.utils.Constants.processingState.completed) {
									this.postDocumentItems(this.getProductTable().getProductData());
								}
							});

						} else {
							this.onPostAllButtonPress();
						}
					}
				}.bind(this)
			});
		}
	},

	/**
	 * TFS 4391 : RDG180M - Validation et mise à jour à la volée du stock réserve
	 * 
	 * TFS 4955 : Le système contrôle la validité de la qté reçue saisie (point et virgule sont autorisés)
	 *			  sinon un message bloquant informe l'utilisateur.
	 * 
	 * @param {oEvent} 
	 * @returns {void} 
	 */

	onStockRoomQuantityChange: function (oEvent) {
		var oInput = oEvent.getSource();

		// Check if an invalid value was entered
		var sValue = oEvent.getParameter("value");
		sValue = sValue.replace(",", "."); // autoriser la virgule et le point comme séparateur valide  

		if (!retail.store.receiveproduct.utils.Formatter.isValidReceiveQuantity(sValue)) {
			// Display error message
			retail.store.receiveproduct.utils.MessageUtil.showMessageBox({
				type: sap.ca.ui.message.Type.ERROR,
				message: sap.retail.store.lib.reuse.util.TextUtil.getText("ERROR_MSG_STOCK_ROOM_NOT_NUMERIC")
			});

			// Reset the value of the input field to the last valid state
			oInput.getBinding("value").refresh(true);
			return;
		}

		var fValue = Number(sValue);
		var fMaxQuantity = retail.store.receiveproduct.Z_SBO017B_RECV_PROD.utils.DataChangeUtil.getMaxStockRoomQuantity();

		if (fValue > fMaxQuantity) {
			// Display error message
			retail.store.receiveproduct.utils.MessageUtil.showMessageBox({
				type: sap.ca.ui.message.Type.ERROR,
				message: sap.retail.store.lib.reuse.util.TextUtil.getText("ERROR_MSG_MAX_QTY_EXCEEDED", [fMaxQuantity])
			});

			// Reset the value of the input field to the last valid state
			oInput.getBinding("value").refresh(true);
			return;
		} else if (fValue < 0 || fValue % 0.5 !== 0) {
			// Display error message
			retail.store.receiveproduct.utils.MessageUtil.showMessageBox({
				type: sap.ca.ui.message.Type.ERROR,
				message: sap.retail.store.lib.reuse.util.TextUtil.getText("ERROR_MSG_QTY_FAILED")
			});

			// Reset the value of the input field to the last valid state
			oInput.getBinding("value").refresh(true);
			return;
		} else {
			var oItem = oInput.getParent().getParent();
			this.setNewStockRoomQuantity(oItem, Number(sValue));
		}
	},

	/**
	 * 
	 * TFS 4391 : Mettre à jour le model et le backend du stock réserve
	 *
	 * @returns {void} 
	 */

	setNewStockRoomQuantity: function (oItem, fQuantity) {
		var oContext = oItem.getBindingContext();

		// don't change the quantity, if item is finished
		if (oContext.getProperty("ReceivingIsFinished")) {
			return;
		}

		var sStoreID = oContext.getProperty("StoreID");
		var sDocumentID = oContext.getProperty("DocumentInternalID");
		var sDocumentItemID = oContext.getProperty("DocumentItemInternalID");

		retail.store.receiveproduct.utils.DataManager.updateStockRoomQuantity({
			StoreID: sStoreID,
			DocumentID: sDocumentID,
			DocumentItemID: sDocumentItemID,
			StockRoomQuantity: fQuantity
		});

		retail.store.receiveproduct.utils.DataManager.submitDocumentItemChanges({
			StoreID: sStoreID,
			DocumentID: sDocumentID,
			DocumentItemID: sDocumentItemID
		}, null, function (oError) {
			// Error callback function
			retail.store.receiveproduct.utils.MessageUtil.showMessageBox({
				type: sap.ca.ui.message.Type.ERROR,
				message: sap.retail.store.lib.reuse.util.TextUtil.getText("ERROR_MSG_UPDATE_REQUEST_FAILED"),
				details: sap.retail.store.lib.reuse.util.TextUtil.getMessageForErrorResponses([oError])
			});
		});
	},

	/**
	 * -----------------------------------------------------------------------
	 * Incrémenter/décrémenter le stock réserve en unité carton
	 * -----------------------------------------------------------------------
	 * 
	 *	- TFS 4391 : L'utilisateur modifie le stock réserve d'un article en utilisant 
	 *				 les boutons +1 ou +0.5. Le bouton 1 incrémente par pas de 1 unité 
	 *				 l'occurrence article sélectionnée dans la liste. 
	 * 
	 */

	onAddOneBoxButtonPress: function (oEvent) {
		var oSource = oEvent.getSource();
		var oContext = oSource.getBindingContext();

		var sStoreID = oContext.getProperty("StoreID");
		var sDocumentID = oContext.getProperty("DocumentInternalID");
		var sDocumentItemID = oContext.getProperty("DocumentItemInternalID");
		var sStockRoomQuantity = oContext.getProperty("StockRoomQuantity");

		retail.store.receiveproduct.Z_SBO017B_RECV_PROD.utils.DataChangeUtil.increaseStockRoomQuantity({
			StoreID: sStoreID,
			DocumentID: sDocumentID,
			DocumentItemID: sDocumentItemID,
			StockRoomQuantity: sStockRoomQuantity
		}, 1);

		// envoi vers le backend pour persister les données
		retail.store.receiveproduct.utils.DataManager.submitDocumentItemChanges({
			StoreID: sStoreID,
			DocumentID: sDocumentID,
			DocumentItemID: sDocumentItemID
		}, null, function (oError) {
			// Error callback function
			retail.store.receiveproduct.utils.MessageUtil.showMessageBox({
				type: sap.ca.ui.message.Type.ERROR,
				message: sap.retail.store.lib.reuse.util.TextUtil.getText("ERROR_MSG_UPDATE_REQUEST_FAILED"),
				details: sap.retail.store.lib.reuse.util.TextUtil.getMessageForErrorResponses([oError])
			});
		});
	},

	/**
	 * -----------------------------------------------------------------------
	 * Incrémenter/décrémenter le stock réserve en unité carton
	 * -----------------------------------------------------------------------
	 * 
	 *	- TFS 4391 : L'utilisateur modifie le stock réserve d'un article en utilisant 
	 *				 les boutons +1 ou +0.5. Le bouton 0.5 incrémente par pas de 0.5 
	 *				 unité l'occurrence article sélectionnée dans la liste.
	 * 
	 */

	onAddHalfBoxButtonPress: function (oEvent) {
		var oSource = oEvent.getSource();
		var oContext = oSource.getBindingContext();

		var sStoreID = oContext.getProperty("StoreID");
		var sDocumentID = oContext.getProperty("DocumentInternalID");
		var sDocumentItemID = oContext.getProperty("DocumentItemInternalID");
		var sStockRoomQuantity = oContext.getProperty("StockRoomQuantity");

		retail.store.receiveproduct.Z_SBO017B_RECV_PROD.utils.DataChangeUtil.increaseStockRoomQuantity({
			StoreID: sStoreID,
			DocumentID: sDocumentID,
			DocumentItemID: sDocumentItemID,
			StockRoomQuantity: sStockRoomQuantity
		}, 0.5);

		// envoi vers le backend pour persister les données
		retail.store.receiveproduct.utils.DataManager.submitDocumentItemChanges({
			StoreID: sStoreID,
			DocumentID: sDocumentID,
			DocumentItemID: sDocumentItemID
		}, null, function (oError) {
			// Error callback function
			retail.store.receiveproduct.utils.MessageUtil.showMessageBox({
				type: sap.ca.ui.message.Type.ERROR,
				message: sap.retail.store.lib.reuse.util.TextUtil.getText("ERROR_MSG_UPDATE_REQUEST_FAILED"),
				details: sap.retail.store.lib.reuse.util.TextUtil.getMessageForErrorResponses([oError])
			});
		});
	},

	/**
	 * -----------------------------------------------------------------------
	 * Remise à zéro du stock réserve en unité carton	 
	 * -----------------------------------------------------------------------
	 * 
	 *	- TFS 4391 : L'utilisateur modifie le stock réserve d'un article en utilisant 
	 *				 les boutons "poubelle".
	 * 
	 */

	onDeleteButtonPress: function (oEvent) {
		var oSource = oEvent.getSource();
		var oContext = oSource.getBindingContext();

		var sStoreID = oContext.getProperty("StoreID");
		var sDocumentID = oContext.getProperty("DocumentInternalID");
		var sDocumentItemID = oContext.getProperty("DocumentItemInternalID");

		retail.store.receiveproduct.utils.DataManager.updateStockRoomQuantity({
			StoreID: sStoreID,
			DocumentID: sDocumentID,
			DocumentItemID: sDocumentItemID,
			StockRoomQuantity: 0
		});

		// envoi vers le backend pour persister les données
		retail.store.receiveproduct.utils.DataManager.submitDocumentItemChanges({
			StoreID: sStoreID,
			DocumentID: sDocumentID,
			DocumentItemID: sDocumentItemID
		}, null, function (oError) {
			// Error callback function
			retail.store.receiveproduct.utils.MessageUtil.showMessageBox({
				type: sap.ca.ui.message.Type.ERROR,
				message: sap.retail.store.lib.reuse.util.TextUtil.getText("ERROR_MSG_UPDATE_REQUEST_FAILED"),
				details: sap.retail.store.lib.reuse.util.TextUtil.getMessageForErrorResponses([oError])
			});
		});
	},

	/**
	 * -----------------------------------------------------------------------
	 * Remise à zéro du stock réserve en unité carton	 
	 * -----------------------------------------------------------------------
	 *  
	 *	- Bug 5809 : Affichage erronée des litiges
	 *	- Bug 5805 : Anomalie Quantité vers stock réserve			 
	 * 
	 */

	refreshDocumentItemData: function (sDocumentID, aDocumentItemIDs) {
		var bRefresh = false;
		var iItemCount = aDocumentItemIDs.length;

		if (aDocumentItemIDs && aDocumentItemIDs.length > 0) {
			// Just refresh the currently visible items
			var oTable = this.getProductTable(); // TFS 5805, 5809
			var oModel = oTable.getModel(); // TFS 5805, 5809
			// var aProductData = oModel.getData().Products; // TFS 5805, 5809
			var aProductData = oTable.getProductData();
			for (var i = 0; i < aProductData.length; i++) {
				var index = aDocumentItemIDs.indexOf(aProductData[i].DocumentItemInternalID);
				if (aProductData[i].DocumentInternalID === sDocumentID && index >= 0) {
					// Get document item data from data manager, enrich it and set it to the model
					aProductData[i] = retail.store.receiveproduct.utils.DataManager.getDocumentItem(aProductData[i].StoreID, aProductData[i].DocumentInternalID,
						aProductData[i].DocumentItemInternalID);
					bRefresh = true;
					if (--iItemCount === 0) { // all items refreshed
						break;
					}
				}
			}

			if (bRefresh) {
				oModel.refresh();
				oTable.setProductData(aProductData); // TFS 5805, 5809
			}
		} else {
			// Re-read all items for the given document and set them to this view
			var oDocument = this.getView().getModel("Document").getData();
			if (oDocument && oDocument.DocumentInternalID === sDocumentID) {
				this.setDocumentAndItemData(oDocument.StoreID, sDocumentID, true);
			}
		}
	},

	/**
	 * -----------------------------------------------------------------------
	 * TFS 5833 : Afficher le libellé de l'étiquette sélectionnée 
	 * -----------------------------------------------------------------------
	 */

	onTagColorItemPress: function (oEvent) {
		var oContext = oEvent.getSource().getBindingContext();
		var oData = oContext.getObject();

		sap.m.MessageToast.show(
			oData.TagName, {
				width: "18rem",
				autoClose: false
			});
	},

	/**
	 * TFS 3729 : Clean des objets 
	 * --------
	 *	
	 * @param 
	 * @returns {void} 
	 */

	cleanup: function () {
		// Appel des traitements standard
		retail.store.receiveproduct.view.ProductList.prototype.cleanup.call(this);
		// 
		this._mDialogs = {};
		this._sUserIdentifier = null;
	},

	/**
	 * @ControllerHook [Move products to the end of the list after setting them to finished]
	 * The hook is called once when the app is started. It can be used to activate the automatic moving of
	 * products to the end of the list after they are set to finished via the switch.
	 * @callback sap.ca.scfld.md.controller.ScfldMasterController~extHookActivateProductMovementAfterFinished
	 * @return {boolean} The indicator if products shold be moved to the end after setting them to finished.
	 */
	extHookActivateProductMovementAfterFinished: function () {
		return true;
	},

	/**
	 * TFS 4391 : Cette méthode déplace les unités du rolls à la fin de la liste dès que l'utilisateur 
	 *			  bascule l'unité à l'état terminé. (correctif bogue méthode standard)
	 * 
	 * @param {aDocumentItemIDsStart} String Code Magasin
	 * @param {aDocumentItemIDsEnd} String N° du document (roll)
	 * @param {fnCallback} Seul les postes du documents sont traités et maj à partir du backend
	 * @returns {void} 
	 */

	moveItemsToStartOrEnd: function (aDocumentItemIDsStart, aDocumentItemIDsEnd, fnCallback) {
		var oDocumentItem = null;
		var iIndex = 0;
		var i = 0;

		if (!this._mSettings.ActivateProductMovementAfterFinished) {
			// Do nothing (but execute the callback)
			if (fnCallback) {
				fnCallback(true);
			}
			return;
		}

		var oTable = this.getProductTable();
		var aData = oTable.getProductData();

		if (aDocumentItemIDsStart) {
			for (i = 0; i < aDocumentItemIDsStart.length; i++) {
				// Get the document item with the given ID
				iIndex = this.getDocumentItemIndexByID(aDocumentItemIDsStart[i], aData);

				/* 
					TFS 4897 : Traitement des rolls disparation des modifications lors de la mise à jour des lignes 
				*/

				// mise à jour de l'unité du roll à partir du model
				oDocumentItem = retail.store.receiveproduct.utils.DataManager.getDocumentItem(
					aData[iIndex].StoreID,
					aData[iIndex].DocumentInternalID,
					aData[iIndex].DocumentItemInternalID
				);

				if (oDocumentItem) {
					// Remove the document from the current position
					aData.splice(iIndex, 1);

					// Insert the product again at the beginning
					aData.unshift(oDocumentItem);
				}
			}
		}

		if (aDocumentItemIDsEnd) {
			for (i = 0; i < aDocumentItemIDsEnd.length; i++) {
				// Get the document item with the given ID
				iIndex = this.getDocumentItemIndexByID(aDocumentItemIDsEnd[i], aData);

				/* 
					TFS 4897 : Traitement des rolls disparation des modifications lors de la mise à jour des lignes 
				*/

				// mise à jour de l'unité du roll à partir du model
				oDocumentItem = retail.store.receiveproduct.utils.DataManager.getDocumentItem(
					aData[iIndex].StoreID,
					aData[iIndex].DocumentInternalID,
					aData[iIndex].DocumentItemInternalID
				);

				if (oDocumentItem) {
					// Remove the document from the current position
					aData.splice(iIndex, 1);

					// Get index for correct insert before the first blocked item
					iIndex = this.getIndexForInsertBeforeFirstBlockedItem(aData);

					// Insert the product again at the end
					aData.splice(iIndex, 0, oDocumentItem);
				}
			}
		}

		// Register a callback when the data in the list is updated
		if (fnCallback) {
			this.processAfterListUpdate(fnCallback);
		}

		// Set the modified data to the model again in order to update the product table on the UI
		this.getProductTable().setProductData(aData, true);
	},

	/**
	 * @ControllerHook [Change paging of product table]
	 * The hook is called once when the app is started. It can be used to change the paging of the
	 * product table. The table data is completely loaded to the UI. If paging is enabled and the
	 * table has more items than defined by page size, only a subset of the table data is displayed
	 * on the UI, together with paging buttons.
	 * Default is paging with 20 items per page, but only on mobile devices.
	 * @callback sap.ca.scfld.md.controller.ScfldMasterController~extHookChangeProductListPaging
	 * @return {number} The number of items to be displayed on one page. Set to 0 in order to disable paging
	 */
	extHookChangeProductListPaging: function () {
		return 50;
	}

});