jQuery.sap.require("retail.store.receiveproduct.Z_SBO017B_RECV_PROD.utils.Formatter");
jQuery.sap.require("retail.store.receiveproduct.Z_SBO017B_RECV_PROD.utils.DataChangeUtil");
sap.ui.controller("retail.store.receiveproduct.Z_SBO017B_RECV_PROD.view.ProductDetailsCustom", {

	_bBatchNumberLiveChange: false,
	_bReturnQuantityLiveChange: false,
	_bStockRoomQuantityLiveChange: false,

	/**
	 * TFS 2784 : Surcharge de la méthode standard pour instancier un nouveau
	 *			  model MoveReason à partir de la liste des motifs.	
	 * @param {} 
	 * @returns {void} 
	 */

	init: function () {
		// Appel des traitements standard
		retail.store.receiveproduct.view.ProductDetails.prototype.init.call(this);

		// Set the model for the app status
		var oView = this.getView();
		var oModel = this.getOwnerComponent().getModel("MoveReasons");
		oView.setModel(oModel, "MoveReasons");

		// TFS 4975 : Cacher la colonne vers réserve si lme PDV n'a pas les autorisations
		retail.store.receiveproduct.utils.DataManager.getStorePromise().progress(function (oStore) {
			var appMode = this.getView().getModel("appMode");
			appMode.setProperty("/StockRoomUseAllowed", oStore.StockRoomUseAllowed);
		}.bind(this));

		this.disableSelectReceiveQuantityUnit();
	},

	/**
	 * TFS 3687 : Désactiver la liste déroulante des unités pour n'autoriser 
	 * --------   que UVC et KG.
	 * 
	 * @returns {void} 
	 */

	disableSelectReceiveQuantityUnit: function () {
		var oSelect = this.byId("receiveProductsSelectReceiveQuantityUnit");
		oSelect.unbindProperty("enabled", true);

		jQuery.sap.delayedCall(500, null, function () {
			oSelect.setEnabled(false);
		});
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
		var oFormatter = retail.store.receiveproduct.utils.Formatter;

		if (!this._bReceiveQuantityLiveChange) {
			// There was no live change event yet, so it cannot be the case that the user changed
			// the value of the currently displayed product; this situation might occur when the
			// user changes the receive quantity and directly navigates to another product
			oInput.getBinding("value").refresh(true);
			return;
		}

		// Check if an invalid value was entered
		var sValue = oEvent.getParameter("value");
		sValue = sValue.replace(",", "."); // autoriser la virgule et le point comme séparateur valide  

		if (!oFormatter.isValidReceiveQuantity(sValue)) {
			// Display error message
			retail.store.receiveproduct.utils.MessageUtil.showMessageBox({
				type: sap.ca.ui.message.Type.ERROR,
				message: sap.retail.store.lib.reuse.util.TextUtil.getText("ERROR_MSG_NOT_NUMERIC")
			});

			// Reset the value of the input field to the last valid state
			oInput.getBinding("value").refresh(true);
			return;
		}

		var oModel = this.getView().getModel("DocumentItem");
		var oDocumentItem = oModel.getData();

		if (oDocumentItem) {
			var fNumberOfLowerLevelUoM = retail.store.receiveproduct.utils.DataManager.getNumberOfLowerLevelUoM(oDocumentItem);
			//TFS-5567 : Début AMAHJOUB(-) enlever la vérification sur multiple PCB.
			/*if (!oFormatter.isValidReceiveQuantityWithBaseUnit(sValue, fNumberOfLowerLevelUoM)) {
				// Display warning message
				retail.store.receiveproduct.utils.MessageUtil.showMessageBox({
					type: sap.ca.ui.message.Type.WARNING,
					message: sap.retail.store.lib.reuse.util.TextUtil.getText("ERROR_MSG_NOT_CONVERSION_FACTOR")
				});
			}*/
		}

		var fQuantityModel = this.getView().getModel("DocumentItem").getProperty("/ReceiveQuantity");

		if (sValue !== Number(oFormatter.formatReceiveQuantityForInput(fQuantityModel))) {
			// The value in the input field was actually changed -> propagate it
			this.setNewReceiveQuantity(sValue);
		}
	},

	/**
	 * TFS 2784 : Surcharge de la méthode standard 
	 * --------
	 *	
	 * @param
	 * @returns {void} 
	 */

	handleProductDetailsRoute: function (oEvent) {
		// Appel des traitements standard
		retail.store.receiveproduct.view.ProductDetails.prototype.handleProductDetailsRoute.call(this, oEvent);

		// Remember that there was no live change event yet
		this._bReturnQuantityLiveChange = false;
		this._bBatchNumberLiveChange = false;
		this._bStockRoomQuantityLiveChange = false;
	},

	/**
	 * TFS 2784 : Surcharge de la méthode standard 
	 * TFS 5833 : Afficher les étiquettes de couleurs assocées à l'article (Balisage)
	 * 
	 * @param {sStoreID} String code magasin 
	 * @param {sDocumentID} N° du document
	 * @param {sDocumentItemID} N° de l'item du document
	 * @returns {void} 
	 */

	setDocumentItemData: function (sStoreID, sDocumentID, sDocumentItemID) {
		var fnSetDocumentItemData = jQuery.proxy(function (oDocumentItemData) {
			// Adjust some data before the document item is set to the view
			this.adjustDataForDocumentItem(oDocumentItemData);

			// Set the document item data to the view
			var oView = this.getView();
			oView.getModel("DocumentItem").setData(oDocumentItemData);
			oView.getModel("Product").setData(oDocumentItemData.Product);

			// Refresh Input field (in case that the last item has same value in model, but other value in the input field)
			var oInput = this.byId("receiveProductsInputReceiveQuantity");
			oInput.getBinding("value").refresh(true);

			// Bug 3722 : réclamation sous différents motifs
			oInput = this.byId("receiveProductsInputReturnQuantity");
			oInput.getBinding("value").refresh(true);

			// Bug 3722 : réclamation sous différents motifs
			oInput = this.byId("receiveProductsInputStockRoomQuantity");
			oInput.getBinding("value").refresh(true);

			// Refresh Select field
			var oSelect = this.byId("receiveProductsSelectReceiveQuantityUnit");
			oSelect.getBinding("selectedKey").refresh(true);

			// gestion du composant TagColorItem
			this._updateTagColorProduct();

			// Display/hide the large product image panel
			this.adjustProductImagePanel(oDocumentItemData.Product);

			// Update the action sheet buttons (bookmark, share, ...)
			this.updateActionSheetButtons();

		}, this);

		// Get the document
		var oDocument = retail.store.receiveproduct.utils.DataManager.getDocument(sStoreID, sDocumentID);
		if (oDocument) {
			this.setDocumentData(oDocument);
		} else {
			// Try to read the document from backend
			retail.store.receiveproduct.utils.DataManager.readSingleDocument(sStoreID, sDocumentID, null, jQuery.proxy(function (oData) {
				oDocument = oData;
				if (oDocument && oDocument.DocumentInternalID) {
					this.setDocumentData(oDocument);
				}
			}, this), function (oError) {
				// Error callback
				retail.store.receiveproduct.utils.MessageUtil.showMessageBox({
					type: sap.ca.ui.message.Type.ERROR,
					message: sap.retail.store.lib.reuse.util.TextUtil.getText("ERROR_MSG_DOC_NOT_FOUND"),
					details: sap.retail.store.lib.reuse.util.TextUtil.getMessageForErrorResponses([oError])
				});
			});
		}

		// Get the document item
		var oDocumentItem = retail.store.receiveproduct.utils.DataManager.getDocumentItem(sStoreID, sDocumentID, sDocumentItemID);
		if (oDocumentItem) {
			fnSetDocumentItemData(oDocumentItem);
		} else {
			// Try to read the document from backend
			retail.store.receiveproduct.utils.DataManager.readSingleDocumentItem(sStoreID, sDocumentID, sDocumentItemID, function (oData) {
				oDocumentItem = oData;
				if (oDocumentItem && oDocumentItem.DocumentInternalID) {
					fnSetDocumentItemData(oDocumentItem);
				}
			}, function (oError) {
				// Error callback
				retail.store.receiveproduct.utils.MessageUtil.showMessageBox({
					type: sap.ca.ui.message.Type.ERROR,
					message: sap.retail.store.lib.reuse.util.TextUtil.getText("ERROR_MSG_DOC_ITEM_NOT_FOUND"),
					details: sap.retail.store.lib.reuse.util.TextUtil.getMessageForErrorResponses([oError])
				});
			});
		}
	},

	/**
	 * Cette méthode permet d'instancier le composant réutilisable PICARD.SBO025.TAGCOLORITEM
	 * et envoi les informations permettant de lire les couleurs de balisage de l'article.
	 * 
	 * https://www.nabisoft.com/tutorials/sapui5/implementing-re-use-components-in-sapui5-libraries-and-consuming-them-in-sapui5-apps
	 * 
	 */
	_updateTagColorProduct: function () {
		var sAppID = "ZSBO017";
		var oView = this.getView();
		var sStoreID = oView.getModel("DocumentItem").getProperty("/StoreID");
		var sProductID = oView.getModel("Product").getProperty("/ProductID");
		var oContainer = this.getTagColorComponentContainer(); // lire le conteneur posé sur la page

		if (!oContainer.getComponent()) { // Si le composant n'existe pas, créer l'instance du composant
			sap.ui.component({
				name: "picard.sbo025.tagcoloritem",
				settings: {},
				componentData: {},
				async: true,
				manifestFirst: true, //deprecated - replaced with "manifest" from 1.49+
				manifest: true //SAPUI5 >= 1.49
			}).then(function (oComp) {
				oContainer.setComponent(oComp); // Associer l'instance du composant au container pour l'afficher dans la vue Détail
				oComp.attachTagColorItemPress(this.onTagColorItemPress.bind(this)); // On écoute la mise à jour du balisage sur l'article
				oComp.attachTagColorDeletePress(this.onTagColorDeletePress.bind(this)); // On écoute la mise à jour du balisage sur l'article
				oComp.setTagColorParameters(sStoreID, sProductID, sAppID); // On envoi les données au composant pour afficher les couleurs de balisage de l'article
			}.bind(this)).catch(function (oError) {
				jQuery.sap.log.error(oError);
			});
		} else { // le composant existe déjà 
			var oInstance = oContainer.getComponentInstance();
			oInstance.setTagColorParameters(sStoreID, sProductID, sAppID); // On envoi les données au composant pour afficher les couleurs de balisage de l'article
		}
	},

	/**
	 * -----------------------------------------------------------------------
	 *	TFS 5833 : Récupérer l'instance du re-use component container TagColor
	 * -----------------------------------------------------------------------
	 * 
	 * XPO le 23.05.2019 :
	 * ------------------
	 *	- TFS 5833 : 
	 */

	getTagColorComponentContainer: function () {
		return this.byId("tagColorComponentContainer");
	},

	/**
	 * -----------------------------------------------------------------------
	 *	TFS 5833 : Synchroniser le balisage vers la vue ProductList
	 * -----------------------------------------------------------------------
	 * 
	 * XPO le 23.05.2019 :
	 * ------------------
	 *	- TFS 5833 : 
	 */

	onTagColorItemPress: function (oEvent) {
		var oModel = this.getView().getModel("DocumentItem");
		var sStoreID = oModel.getProperty("/StoreID");
		var sDocumentID = oModel.getProperty("/DocumentInternalID");
		var sDocumentItemID = oModel.getProperty("/DocumentItemInternalID");
		var oTagColor = oEvent.getParameters("Tags");

		retail.store.receiveproduct.utils.DataManager.updateProductTagColors({
			StoreID: sStoreID,
			DocumentID: sDocumentID,
			DocumentItemID: sDocumentItemID,
			TagColor: oTagColor
		});
	},

	/**
	 * -----------------------------------------------------------------------
	 *	TFS 5833 : Synchroniser le balisage vers la vue ProductList
	 * -----------------------------------------------------------------------
	 * 
	 * XPO le 18.06.2019 :
	 * ------------------
	 *	- TFS 5833 : 
	 */

	onTagColorDeletePress: function (oEvent) {
		var oController = this.getListController();
		if (oController) {
			var oModel = this.getView().getModel("DocumentItem");
			var sStoreID = oModel.getProperty("/StoreID");
			var sDocumentID = oModel.getProperty("/DocumentInternalID");
			// Re-read all items for the given document and set them to this view
			oController.setDocumentAndItemData(sStoreID, sDocumentID, true);
		}
	},

	/**
	 * TFS 2784 : surcharge de la méthode standard pour maj du model 
	 *			  avec le motif sélectionné.
	 * @param {oDocumentItem} Object Item du document
	 * @returns {void} 
	 */

	adjustDataForDocumentItem: function (oDocumentItem) {
		// Appel des traitements standard
		retail.store.receiveproduct.view.ProductDetails.prototype.adjustDataForDocumentItem.call(this, oDocumentItem);

		// Adjust data for selected Move Reason
		this.adjustDataForMoveReason(oDocumentItem);
	},

	/**
	 * TFS 2784 : Enrichir l'objet oDocumentItem par afficher ou cacher les 
	 *			  zones Lot/Dluo à l'écran en fonction du motif sélectionné
	 *			  dans la liste au chargement de la page.
	 * @param {oDocumentItem} Object objet item de document
	 * @returns {void} 
	 */

	adjustDataForMoveReason: function (oDocumentItem) {
		var oData = this.getView().getModel("MoveReasons").getData();

		var oMoveReason = oData.results.find(function (item) {
			return item.MoveReasonID === oDocumentItem.MoveReasonID;
		});

		oDocumentItem.IsBatchMandatory = oMoveReason.IsBatchMandatory;
		oDocumentItem.IsSellByDateMandatory = oMoveReason.IsSellByDateMandatory;
	},

	/**
	 * TFS 2784 : Evènements appelé sur sélection d'un motif de refus 
	 * --------	  dans la vue Détail.
	 *	
	 * @param {oEvent} Object Control graphique "Select"
	 * @returns {void} 
	 */

	onMoveReasonSelectChange: function (oEvent) {
		// Get selected quantity unit
		var sMoveReasonID = oEvent.getParameter("selectedItem").getKey();
		var sMoveReasonText = oEvent.getParameter("selectedItem").getText();

		var oModel = this.getView().getModel("DocumentItem");
		var sStoreID = oModel.getProperty("/StoreID");
		var sDocumentID = oModel.getProperty("/DocumentInternalID");
		var sDocumentItemID = oModel.getProperty("/DocumentItemInternalID");

		// maj du model
		retail.store.receiveproduct.utils.DataManager.updateMoveReasonForDocumentItem({
			StoreID: sStoreID,
			DocumentID: sDocumentID,
			DocumentItemID: sDocumentItemID,
			MoveReasonID: sMoveReasonID,
			MoveReasonText: sMoveReasonText
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

		/*
		 *	TFS 4411 : impossible de positionner le focus sur iPad alors on vide le champs pour simplifier la saisie
		 */
		jQuery.sap.delayedCall(200, this, function () {
			var oInput = this.getView().byId("receiveProductsInputReturnQuantity");
			oInput.setValue("");
			oInput.focus();
			// if (sap.ui.Device.system.phone) {
			// 	oInput.setValue(""); 
			// } else {
			// 	oInput.focus();
			// }
		});
	},

	/**
	 * TFS 2784 : 
	 * ---------
	 *	
	 * @param {oEvent} Object Control graphique "Input"
	 * @returns {void} 
	 */

	onReturnQuantityLiveChange: function (oEvent) {
		// Remember that there was at least one live change event
		this._bReturnQuantityLiveChange = true;
	},

	/**
	 * TFS 2784 : Contrôle le format numérique de la qté retournée
	 * --------
	 *	
	 * @param {oEvent} Object Control graphique "Input"
	 * @returns {void} 
	 */

	onReturnQuantityChange: function (oEvent) {
		var oInput = oEvent.getSource();

		if (!this._bReturnQuantityLiveChange) {
			// There was no live change event yet, so it cannot be the case that the user changed
			// the value of the currently displayed product; this situation might occur when the
			// user changes the receive quantity and directly navigates to another product
			oInput.getBinding("value").refresh(true);
			return;
		}

		// Check if an invalid value was entered
		var sValue = oEvent.getParameter("value");
		sValue = sValue.replace(",", "."); // autoriser la virgule et le point comme séparateur valide  

		if (!retail.store.receiveproduct.utils.Formatter.isValidReceiveQuantity(sValue)) {
			// Display error message
			retail.store.receiveproduct.utils.MessageUtil.showMessageBox({
				type: sap.ca.ui.message.Type.ERROR,
				message: sap.retail.store.lib.reuse.util.TextUtil.getText("ERROR_MSG_NOT_NUMERIC")
			});

			// Reset the value of the input field to the last valid state
			oInput.getBinding("value").refresh(true);
			return;
		}

		var fValue = Number(sValue);
		var fQuantityModel = this.getView().getModel("DocumentItem").getProperty("/ReturnQuantity");
		if (fValue !== Number(retail.store.receiveproduct.utils.Formatter.formatReceiveQuantityForInput(fQuantityModel))) {
			// The value in the input field was actually changed -> propagate it
			this.setNewReturnQuantity(fValue);
		}
	},

	/**
	 * TFS 2784 : Maj de la qté retournér sur la vue et coté backend dans la table RTST_RP_STAT_ITM
	 * --------
	 *	
	 * @param {oEvent} Object Control graphique "Input"
	 * @returns {void} 
	 */

	setNewReturnQuantity: function (fQuantity) {
		var oModel = this.getView().getModel("DocumentItem");
		var sStoreID = oModel.getProperty("/StoreID");
		var sDocumentID = oModel.getProperty("/DocumentInternalID");
		var sDocumentItemID = oModel.getProperty("/DocumentItemInternalID");

		retail.store.receiveproduct.utils.DataManager.updateReturnQuantity({
			StoreID: sStoreID,
			DocumentID: sDocumentID,
			DocumentItemID: sDocumentItemID,
			ReturnQuantity: fQuantity
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
	 * TFS 2784 : Contrôle et Maj de la DLUO 
	 * --------
	 *	
	 * @param {oEvent} Object Control graphique "DatePiker"
	 * @returns {void} 
	 */

	onBestBeforeDateChange: function (oEvent) {
		var oInput = oEvent.getSource();

		// Check if an invalid value was entered
		var sValue = oEvent.getParameter("value");
		if (!retail.store.receiveproduct.utils.Formatter.isValidBestBeforeDate(sValue)) {
			// Display error message
			retail.store.receiveproduct.utils.MessageUtil.showMessageBox({
				type: sap.ca.ui.message.Type.ERROR,
				message: sap.retail.store.lib.reuse.util.TextUtil.getText("ERROR_MSG_NOT_DATE")
			});

			// Reset the value of the input field to the last valid state
			oInput.getBinding("value").refresh(true);
			return;
		}

		var fValue = sValue ? new Date(sValue) : null;
		this.setNewBestBeforeDate(new Date(fValue));
	},

	/**
	 * TFS 2784 : Maj de la DLUO sur la vue et coté backend dans la table RTST_RP_STAT_ITM
	 * --------
	 *	
	 * @param {fDate} Dluo au format date
	 * @returns {void} 
	 */

	setNewBestBeforeDate: function (fDate) {
		var oModel = this.getView().getModel("DocumentItem");
		var sStoreID = oModel.getProperty("/StoreID");
		var sDocumentID = oModel.getProperty("/DocumentInternalID");
		var sDocumentItemID = oModel.getProperty("/DocumentItemInternalID");

		retail.store.receiveproduct.utils.DataManager.updateBestBeforeDate({
			StoreID: sStoreID,
			DocumentID: sDocumentID,
			DocumentItemID: sDocumentItemID,
			BestBeforeDate: fDate
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
	 * TFS 2784 : 
	 * ---------
	 *	
	 * @param {oEvent} Object Control graphique "Input"
	 * @returns {void} 
	 */

	onBatchNumberLiveChange: function (oEvent) {
		// Remember that there was at least one live change event
		this._bBatchNumberLiveChange = true;
	},

	/**
	 * TFS 2784 : Contrôle et Maj du n° de Lot
	 * --------
	 *	
	 * @param {oEvent} Object Control graphique "DatePiker"
	 * @returns {void} 
	 */

	onBatchNumberChange: function (oEvent) {
		var oInput = oEvent.getSource();

		if (!this._bBatchNumberLiveChange) {
			// There was no live change event yet, so it cannot be the case that the user changed
			// the value of the currently displayed product; this situation might occur when the
			// user changes the receive quantity and directly navigates to another product
			oInput.getBinding("value").refresh(true);
			return;
		}

		// Check if an invalid value was entered
		var sValue = oEvent.getParameter("value");
		if (!retail.store.receiveproduct.utils.Formatter.isValidBatchNumber(sValue)) {
			// Display error message
			retail.store.receiveproduct.utils.MessageUtil.showMessageBox({
				type: sap.ca.ui.message.Type.ERROR,
				message: sap.retail.store.lib.reuse.util.TextUtil.getText("ERROR_MSG_NOT_DATE")
			});

			// Reset the value of the input field to the last valid state
			oInput.getBinding("value").refresh(true);
			return;
		}

		var fValue = sValue;
		var fBatchNumberModel = this.getView().getModel("DocumentItem").getProperty("/BatchNumber");
		if (fValue !== fBatchNumberModel) {
			// The value in the input field was actually changed -> propagate it
			this.setNewBatchNumber(fValue);
		}
	},

	/**
	 * TFS 2784 : Maj du n° du lot sur la vue et coté backend dans la table RTST_RP_STAT_ITM
	 * --------
	 *	
	 * @param {fDate} Dluo au format date
	 * @returns {void} 
	 */

	setNewBatchNumber: function (fBatchNumber) {
		var oModel = this.getView().getModel("DocumentItem");
		var sStoreID = oModel.getProperty("/StoreID");
		var sDocumentID = oModel.getProperty("/DocumentInternalID");
		var sDocumentItemID = oModel.getProperty("/DocumentItemInternalID");

		retail.store.receiveproduct.utils.DataManager.updateBatchNumber({
			StoreID: sStoreID,
			DocumentID: sDocumentID,
			DocumentItemID: sDocumentItemID,
			BatchNumber: fBatchNumber
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

	handleDeviceSpecificFeatures: function () {
		var oInput = this.getView().byId("receiveProductsInputReceiveQuantity");

		// Make sure that the content of the input field for return quantities is preselected when focused
		var oInputReturnQuantity = this.getView().byId("receiveProductsInputReturnQuantity");
		var oInputBatchNumber = this.getView().byId("receiveProductsInputBatchNumber");
		var oInputStockRoomQuantity = this.getView().byId("receiveProductsInputStockRoomQuantity");

		var fnFocusIn = function () {
			// Call the select method, which works for some device/browser combinations
			jQuery.sap.delayedCall(0, this.getFocusDomRef(), "select");

			// Additionally call the selectText method, which works for some other device/browser combinations
			if (oInput.selectText) {
				jQuery.sap.delayedCall(100, this, "selectText", [0, this.getValue().length]);
			} else {
				jQuery.sap.delayedCall(100, jQuery(this.getFocusDomRef()), "selectText", [0, this.getValue().length]);
			}

			if (sap.ui.Device.system.desktop) {
				if (this.getId().indexOf("receiveProductsInputReceiveQuantity") !== -1 || this.getId().indexOf("receiveProductsInputReturnQuantity") !==
					-1 || this.getId().indexOf("receiveProductsInputStockRoomQuantity") !== -1) {
					this.setType(sap.m.InputType.Text);
				}
			}
		};

		oInput.addEventDelegate({
			onfocusin: fnFocusIn
		}, oInput);

		oInputReturnQuantity.addEventDelegate({
			onfocusin: fnFocusIn
		}, oInputReturnQuantity);

		oInputBatchNumber.addEventDelegate({
			onfocusin: fnFocusIn
		}, oInputBatchNumber);

		oInputStockRoomQuantity.addEventDelegate({
			onfocusin: fnFocusIn
		}, oInputStockRoomQuantity);
	},

	/**
	 * TFS 4391 : Remember that there was at least one live change event
	 * --------
	 *	
	 * @returns {void} 
	 */

	onStockRoomQuantityLiveChange: function (oEvent) {
		this._bStockRoomQuantityLiveChange = true;
	},

	/**
	 * 
	 * TFS 4391 : RDG180M :  Validation et mise à jour à la volée du stock réserve
	 *
	 * @returns {void} 
	 */

	onStockRoomQuantityChange: function (oEvent) {
		var oInput = oEvent.getSource();

		if (!this._bStockRoomQuantityLiveChange) {
			// There was no live change event yet, so it cannot be the case that the user changed
			// the value of the currently displayed product; this situation might occur when the
			// user changes the stock room quantity and directly navigates to another product
			oInput.getBinding("value").refresh(true);
			return;
		}

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
			var fQuantityModel = this.getView().getModel("DocumentItem").getProperty("/StockRoomQuantity");
			if (fValue !== Number(retail.store.receiveproduct.utils.Formatter.formatReceiveQuantityForInput(fQuantityModel))) {
				// The value in the input field was actually changed -> propagate it
				this.setNewStockRoomQuantity(fValue);
			}
		}
	},

	/**
	 * 
	 * TFS 4391 : Contrôler le stock réserve sur les évènements de la page :
	 *			  onUpButtonPress, onDownButtonPress, onNavBack.
	 *
	 * @returns {void} 
	 */

	checkReceiveQuantityChange: function () {
		retail.store.receiveproduct.view.ProductDetails.prototype.checkReceiveQuantityChange.call(this);

		// 
		this.checkStockRoomQuantityChange();
	},

	/**
	 * 
	 * TFS 4391 : Contrôler et mettre à jour le model et le backend du stock réserve
	 *
	 * @returns {void} 
	 */

	checkStockRoomQuantityChange: function () {
		var oInput = this.byId("receiveProductsInputStockRoomQuantity");
		var sValue = oInput.getValue();

		if (!retail.store.receiveproduct.utils.Formatter.isValidReceiveQuantity(sValue)) {
			return;
		}

		var fValue = Number(sValue);
		var fQuantityModel = this.getView().getModel("DocumentItem").getProperty("/StockRoomQuantity");
		if (fValue !== Number(retail.store.receiveproduct.utils.Formatter.formatReceiveQuantityForInput(fQuantityModel))) {
			// A changed value in the input field was not propagated yet
			this.setNewStockRoomQuantity(fValue);
		}
	},

	/**
	 * 
	 * TFS 4391 : Mettre à jour le model et le backend du stock réserve
	 *
	 * @returns {void} 
	 */

	setNewStockRoomQuantity: function (fQuantity) {
		var oModel = this.getView().getModel("DocumentItem");
		var sStoreID = oModel.getProperty("/StoreID");
		var sDocumentID = oModel.getProperty("/DocumentInternalID");
		var sDocumentItemID = oModel.getProperty("/DocumentItemInternalID");

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
		var oModel = this.getView().getModel("DocumentItem");
		var sStoreID = oModel.getProperty("/StoreID");
		var sDocumentID = oModel.getProperty("/DocumentInternalID");
		var sDocumentItemID = oModel.getProperty("/DocumentItemInternalID");
		var sStockRoomQuantity = oModel.getProperty("/StockRoomQuantity");

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
	 *				 les boutons +1 ou +0.5. Le bouton 0.5 incrémente par pas de 0.5 unité 
	 *				 l'occurrence article sélectionnée dans la liste. 
	 * 
	 */

	onAddHalfBoxButtonPress: function (oEvent) {
		var oModel = this.getView().getModel("DocumentItem");
		var sStoreID = oModel.getProperty("/StoreID");
		var sDocumentID = oModel.getProperty("/DocumentInternalID");
		var sDocumentItemID = oModel.getProperty("/DocumentItemInternalID");
		var sStockRoomQuantity = oModel.getProperty("/StockRoomQuantity");

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
		var oModel = this.getView().getModel("DocumentItem");
		var sStoreID = oModel.getProperty("/StoreID");
		var sDocumentID = oModel.getProperty("/DocumentInternalID");
		var sDocumentItemID = oModel.getProperty("/DocumentItemInternalID");

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
	 * Bug 5051 : Dysfonctionnement du bouton retour au niveau détail du 
	 *			  traitement des rolls.
	 * -----------------------------------------------------------------------
	 * 
	 */

	onNavBack: function () {
		if (this.getView().getModel("appMode").getProperty("/displayDetails")) {
			// First make sure that there are no unsubmitted changes in the input field
			this.checkReceiveQuantityChange();
		}

		// begin of ins 5051 : Forcer le navTo

		// var oHistory = sap.ui.core.routing.History.getInstance();
		// var sPreviousHash = oHistory.getPreviousHash();

		// // The history contains a previous entry
		// if (sPreviousHash) {
		// 	/* eslint-disable sap-browser-api-warning */
		// 	window.history.go(-1);
		// 	/* eslint-enable sap-browser-api-warning */
		// } else {
		// Navigate to product list (without history entry)
		var oDocument = this.getView().getModel("Document").getData();
		if (oDocument) {
			this.oRouter.navTo("toProductList", {
				StoreID: oDocument.StoreID,
				DocumentID: oDocument.DocumentInternalID
			}, true);
		}
		// }

		// end of ins 5051 
	},

	/**
	 * TFS 2784 : 
	 * --------
	 *	
	 * @param {oEvent} Object Control graphique "Input"
	 * @returns {void} 
	 */

	cleanup: function () {
		// Appel des traitements standard
		retail.store.receiveproduct.view.ProductDetails.prototype.cleanup.call(this);
		this._bReturnQuantityLiveChange = false;
		this._bBatchNumberLiveChange = false;
		this._bStockRoomQuantityLiveChange = false;
	}

});