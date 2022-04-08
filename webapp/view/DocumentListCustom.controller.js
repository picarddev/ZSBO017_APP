jQuery.sap.require("retail.store.receiveproduct.Z_SBO017B_RECV_PROD.utils.Formatter");
jQuery.sap.require("retail.store.receiveproduct.Z_SBO017B_RECV_PROD.utils.DataManager");
jQuery.sap.require("retail.store.receiveproduct.Z_SBO017B_RECV_PROD.utils.FilterUtil");
sap.ui.controller("retail.store.receiveproduct.Z_SBO017B_RECV_PROD.view.DocumentListCustom", {

	_oMoveReasonPopover: null,
	_oMoveReasonList: null,

	/**
	 * TFS 2784 : Surcharge de la méthode standard. On ajoute la liste des motifs de 
	 *			  refus dans le footer de l'écran Master.
	 * @param {} 
	 * @returns {void} 
	 */

	init: function () {
		// Appel des traitements standard
		retail.store.receiveproduct.view.DocumentList.prototype.init.call(this);
		// Contruire la liste des motifs de refus
		this.setMoveReasonListBinding();

		if (sap && sap.Toolbar) {
			sap.Toolbar.setEnabled(false); // TFS 2784 : Désactivation de la Toolbar du SAP Fiori Client
		}
		
		//			
		// TFS 5050 : Migration vers la nouvelle gateway Fiori
		//			  Depuis la v1.30 le le SAP Fiori Launchpad applique automatiquement la classe sapUiSizeCompact
		//		      sur le tag <body> de la page. On supprime cette classe pour conserver un agencement correct
		//		      des contrôles graphiques UI5.
		
		if (jQuery(document.body).hasClass("sapUiSizeCompact")) {
			jQuery.sap.delayedCall(500, this, function() {
				jQuery(document.body).removeClass("sapUiSizeCompact");	
			});
		}
	},

	/**
	 * 
	 * TFS 2784 : Les motifs applicable aux Rolls sont différents s'il s'agit d'un roll supplémentaire.
	 *			  On valorise donc la liste des motifs dès que le 1er document est sélectionné côté 
	 *			  Master pour lire le context
	 * 
	 * @param {} 
	 * @returns {void} 
	 */

	readDocumentListData: function () {
		// Read documents for current store
		retail.store.receiveproduct.utils.DataManager.readDocuments(this._oStore.StoreID, this._oFilter, null, jQuery.proxy(function (oData) {
			// Success callback function
			var aResults = oData.results;

			// Refresh the data in the model and select the first item after the data is read (not for phone)
			this.resetDocumentList();
			this.getPage().scrollTo(0, 0);

			if (!sap.ui.Device.system.phone) {
				this.processAfterListUpdate(jQuery.proxy(function () {

					this.selectFirstItem();

					/**
					 *	TFS 2784 : Appel du backend pour lister les motifs applicables aux rolls coté backend.
					 *			   Les motifs sont différents s'il s'agit d'un roll supplémentaire.
					 */

					var sReceivingStoreID = this.getView().getModel().getProperty("ReceivingStoreID");

					if (sReceivingStoreID && sReceivingStoreID !== this._oStore.StoreID) {
						this.setMoveReasonListData(retail.store.receiveproduct.utils.Constants.Picard.moveReasonFilter.additionalGoodsReceipt);
					} else {
						this.setMoveReasonListData(retail.store.receiveproduct.utils.Constants.Picard.moveReasonFilter.goodsReceipt);
					}

				}, this));
			}

			// Set number of results in page title
			var iCount = oData.__count > 0 ? oData.__count : aResults.length;
			this.getPage().setTitle(sap.retail.store.lib.reuse.util.TextUtil.getText("MASTER_TITLE_NUMBER", [iCount]));

			// Set the document data to this view
			this.getView().getModel().setData({
				Documents: aResults
			});

			if (!sap.ui.Device.system.phone && aResults.length < 1) {
				// Hide the details view
				this.oRouter.navTo("toDocumentList", {
					StoreID: this._oStore.StoreID
				}, true);
				this.showEmptyPage();
			}
		}, this), function (oError) {
			// Error callback function
			retail.store.receiveproduct.utils.MessageUtil.showMessageBox({
				type: sap.ca.ui.message.Type.ERROR,
				message: sap.retail.store.lib.reuse.util.TextUtil.getText("ERROR_MSG_DOCUMENTS_REQUEST_FAILED"),
				details: sap.retail.store.lib.reuse.util.TextUtil.getMessageForErrorResponses([oError])
			});
		});

	},

	/**
	 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
	 * (NOT before the first rendering! onInit() is used for that one!).
	 * @memberOf retail.store.receiveproduct.Z_SBO017B_RECV_PROD.view.Test
	 */
	//	onBeforeRendering: function() {
	//
	//	},

	/**
	 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
	 * This hook is the same one that SAPUI5 controls get after being rendered.
	 * @memberOf retail.store.receiveproduct.Z_SBO017B_RECV_PROD.view.Test
	 */
	// onAfterRendering: function() {

	// },

	/**
	 * TFS 2784 : Supprimer les zéros devant le n° du Roll
	 *			  et l'unité carton devient UVC si le type
	 *			  de livraison est ZIPV ou ZSQL.
	 *
	 * @param {} 
	 * @returns {void} 
	 */

	onListUpdateFinished: function (oControlEvent) {
		// Appel des traitements standard
		retail.store.receiveproduct.view.DocumentList.prototype.onListUpdateFinished.call(this, oControlEvent);

		var oContext = null;
		var sDeliveryType = null;
		var aItems = this.getList().getItems();
		var oConstant = retail.store.receiveproduct.utils.Constants.Picard;
		var oTextUtil = sap.retail.store.lib.reuse.util.TextUtil;

		for (var i = 0; i < aItems.length; i++) {
			oContext = aItems[i].getBindingContext();
			if (!oContext) {
				continue;
			}

			// Get the delivery type of current item
			sDeliveryType = oContext.getProperty("DeliveryType");

			// Change unit number from ObjectListItem List
			if (oConstant.aDeliveryTypeWithNumberUnitException.indexOf(sDeliveryType) !== -1) {
				aItems[i].setNumberUnit(oTextUtil.getText("COMMON_PIECES_UVC"));
			}

			/* delete zeros padding */
			this.getView().getModel().setProperty(oContext.getPath() + "/DocumentDisplayID", parseInt(aItems[i].getTitle(), 10));
		}
	},

	/**
	 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
	 * @memberOf retail.store.receiveproduct.Z_SBO017B_RECV_PROD.view.Test
	 */
	//	onExit: function() {
	//
	//	}

	/**
	 * TFS 2784 : Contruire la liste des motifs de refus dans le footer du Master 
	 *
	 * @param {} 
	 * @returns {void} 
	 */

	setMoveReasonListBinding: function () {
		// Construire la liste des motifs et initialiser le binding
		this._oMoveReasonList = new sap.m.SelectList("receiveProductsListMoveReason").bindItems({
			path: "/MoveReasons",
			template: new sap.ui.core.Item({
				key: "{MoveReasonID}",
				text: "{MoveReasonName}"
			})
		});
		// Construire le popup affichant la liste des motifs
		this._oMoveReasonPopover = new sap.m.ResponsivePopover({
			content: [this._oMoveReasonList],
			placement: sap.m.PlacementType.Top,
			showHeader: false
		});
		// Ajoute le popup en dépendance à la vue
		this.getView().addDependent(this._oMoveReasonPopover);
	},

	/**
	 * TFS 2784 : Appel backend vers l'url /Store('xxx')/MoveReasons pour lister 
	 *			  les motifs de refus applicables à un roll entier (ZSBO017A).
	 * @param {} 
	 * @returns {void} 
	 */

	setMoveReasonListData: function (sTransactionCode) {
		// On filtre les motifs seulement applicable à un roll entier (ZSBO017A)
		var oFilter = new sap.ui.model.Filter("TransactionCode", sap.ui.model.FilterOperator.EQ, sTransactionCode);
		// Appel du service OData /MoveReasons
		retail.store.receiveproduct.utils.DataManager.readMoveReasons(this._oStore.StoreID, oFilter, null, jQuery.proxy(function (oData) {
			// Success callback function
			// Instancier un nouveau model associé au control "SelectList"
			var oModel = new sap.ui.model.json.JSONModel();
			this._oMoveReasonList.setModel(oModel);
			this._oMoveReasonList.getModel().setData({
				MoveReasons: oData.results
			});
			var oSelectListItem = new sap.ui.core.Item({
				key: "0000",
				text: sap.retail.store.lib.reuse.util.TextUtil.getText("MOVE_REASON_LIST_NONE")
			});
			this._oMoveReasonList.insertItem(oSelectListItem, 0);
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
	 * TFS 2784 : Cacher le bouton enregistrer du footer de la vue ProductList si la liste 
	 *			  des documents affichés coté Master est en mode "Multi sélection".
	 * @param {} 
	 * @returns {void} 
	 */

	switchListMode: function (sMode) {
		retail.store.receiveproduct.view.DocumentList.prototype.switchListMode.call(this, arguments);

		var oFooter = this.getListController().getPage().getFooter();
		var sTableMode = this.getList().getModel("mode").getProperty("/tableMode");

		if (!oFooter || !oFooter.getContent()) {
			return;
		}

		/*
			TFS 4990 : Masquer le bouton enregistrer lors de l'activation sélection multiple côté master
		*/ 
		var oResetButton = oFooter.getContent()[1];
		var oSubmitButton = oFooter.getContent()[2];
		if (sTableMode === sap.m.ListMode.MultiSelect || sMode === "Selection") {
			oResetButton.setVisible(false);
			oSubmitButton.setVisible(false);
		} else if (sTableMode === sap.m.ListMode.SingleSelectMaster || sMode === "Standard") {
			oResetButton.setVisible(true);
			oSubmitButton.setVisible(true);
		}
	},

	/**
	 * TFS 2784 : Surcharge de la méthode standard. On ajoute un grouping sur la livraison
	 *			  pour afficher les rolls par livraisons dans la liste des documents
	 * @param {} 
	 * @returns {void} 
	 */

	setDocumentListBinding: function () {
		// Bind item aggregation for master list
		var oList = this.getList();
		var oTemplate = oList.getItems()[0].clone();

		// TFS 2784 : Grouping sur AssignedDeliveryIDs
		var fGrouper = function (oContext) {
			var sType = oContext.getProperty("AssignedDeliveryIDs");
			return {
				key: sType,
				value: sType
			};
		};

		oList.bindAggregation("items", {
			path: "/Documents",
			template: oTemplate,
			// TFS 2784 : Tri sur AssignedDeliveryIDs avec Grouping
			sorter: [new sap.ui.model.Sorter("AssignedDeliveryIDs", false, fGrouper /* TFS 3654 : Grouping des rolls par BL */ )]
		});

		// Set new JSON model to mast list for controlling the mode of the table/items
		var oModelMode = new sap.ui.model.json.JSONModel();
		oModelMode.setData({
			tableMode: sap.m.ListMode.SingleSelectMaster,
			listItemType: sap.ui.Device.system.phone ? sap.m.ListType.Active : sap.m.ListType.Inactive
		});
		oList.setModel(oModelMode, "mode");

		// Refresh the binding for the "last changed" attribute every minute
		this._sIntervalIDLastChanged = jQuery.sap.intervalCall(60000, this, this.refreshLastChangedAttributes);
	},

	/**
	 * TFS 2784 : Avec le grouping des documents on contrôle que l'item 
	 *		      de la liste est un DocumentItem.
	 * 
	 * @param {} 
	 * @returns {void} 
	 */

	refreshLastChangedAttributes: function () {
		var oStatus = null;
		var oList = this.getList();
		if (!oList) {
			return;
		}

		var aItems = oList.getItems();
		var iLength = aItems.length;
		for (var i = 0; i < iLength; i++) {
			// Refresh binding for second status (last changed) in every item
			if (this.isDocumentItem(aItems[i])) {
				oStatus = aItems[i].getSecondStatus();
				if (oStatus) {
					oStatus.getBinding("text").refresh(true);
				}
			}
		}
	},

	/**
	 * 
	 * TFS 2784 : Les motifs applicable aux Rolls sont différents s'il s'agit d'un roll supplémentaire.
	 *			  On valorise donc la liste des motifs dès que le 1er document est sélectionné côté 
	 *			  Master pour lire le context
	 * 
	 * @param {} 
	 * @returns {void} 
	 */

	// selectFirstItem: function() {
	// 	retail.store.receiveproduct.view.DocumentList.prototype.selectFirstItem.call(this, arguments);

	// 	var oFirstListItem = this.getFirstVisibleDocumentListItem();

	// 	if (this.isDocumentItem(oFirstListItem) && oFirstListItem.getBindingContext()) {

	// 		var sStoreID = oFirstListItem.getBindingContext().getProperty("StoreID");
	// 		var sReceivingStoreID = oFirstListItem.getBindingContext().getProperty("ReceivingStoreID");

	// 		/**
	// 		 *	TFS 2784 : Appel du backend pour lister les motifs applicables aux rolls coté backend.
	// 		 *			   Les motifs sont différents s'il s'agit d'un roll supplémentaire.
	// 		 */

	// 		if (sReceivingStoreID && sReceivingStoreID !== sStoreID) {
	// 			this.setMoveReasonListData(retail.store.receiveproduct.utils.Constants.Picard.moveReasonFilter.additionalGoodsReceipt);
	// 		} else {
	// 			this.setMoveReasonListData(retail.store.receiveproduct.utils.Constants.Picard.moveReasonFilter.goodsReceipt);
	// 		}
	// 	}
	// },

	/**
	 * TFS 2784 : Afficher/Cacher la liste des motifs. 
	 * 
	 * @param {} 
	 * @returns {void} 
	 */

	onMoveReasonButtonPress: function (oEvent) {
		if (this.getList().getSelectedItems().length > 0) {
			// On ouvre la liste des motifs de refus 
			this._oMoveReasonPopover.openBy(oEvent.getSource());
			// Ecouter l'évenement Change (au changement de motif)
			this._oMoveReasonList.attachSelectionChange(function () {
				// Apply Move Reason
				this.applyMoveReasonOnSelectedDocuments();
				// Close Popup & Clear selection
				this._oMoveReasonPopover.close();
				this._oMoveReasonList.clearSelection();
			}.bind(this));
		} else {
			// Show warning message: nothing selected
			retail.store.receiveproduct.utils.MessageUtil.showMessageBox({
				type: sap.ca.ui.message.Type.WARNING,
				message: sap.retail.store.lib.reuse.util.TextUtil.getText("WARNING_MSG_NO_DOC_SELECTED")
			});
		}
	},

	/**
	 * TFS 2784 : Ajouter une popup de confirmation avant enregistrement complet du Roll
	 * 
	 * @param {} 
	 * @returns {void} 
	 */

	onPostButtonPress: function () {
		var oList = this.getList();
		var aItems = oList.getSelectedItems();

		if (aItems.length > 0) {
			var oText = new sap.m.Text({
				text: sap.retail.store.lib.reuse.util.TextUtil.getText("INFO_PRODUCTS_MSG_DOC_POSTING")
			});
			var oInput = new sap.m.Input({
				id: "receiveProductsUserIdentifierInput",
				maxLength: 10,
				required: true,
				type: sap.m.InputType.Number,
				placeholder: sap.retail.store.lib.reuse.util.TextUtil.getText("INFO_PRODUCTS_USER_ID_POSTING")
			});
			var oVBox = new sap.m.VBox({
				items: [
					oText,
					oInput
				]
			});
			sap.m.MessageBox.show(oVBox, {
				icon: sap.m.MessageBox.Icon.WARNING,
				title: sap.retail.store.lib.reuse.util.TextUtil.getText("DOCUMENT_CONFIRM_POST_TITLE"),
				actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
				onClose: function (oAction) {
					if (oAction === sap.m.MessageBox.Action.YES) {
						if (oInput.getValue().match(/\S/)) { // any non-space character?
							var oDocuments = this.getList().getSelectedItems();

							/*
							 *	Contruire un tableau avec les DocumentInternalID des documents sélectionnés
							 */
							var aDocumentIDs = oDocuments.map(function (o) {
								var oContext = o.getBindingContext();
								return oContext.getProperty("DocumentInternalID");
							});

							/*
							 *	TFS 3811 :Avoir la possibilité de "signer" le traitement d'un roll
							 */
							var oDataManager = retail.store.receiveproduct.utils.DataManager;
							oDataManager.updateUserIdentifierForDocuments(this._oStore.StoreID, aDocumentIDs, oInput.getValue().toUpperCase());

							// Post the selected documents
							this.postDocuments(aItems, false);

							// Switch to the standard list mode again
							this.switchListMode("Standard");

						} else {
							this.onPostButtonPress();
						}
					}
				}.bind(this)
			});
		} else {
			// Show warning message: nothing selected
			retail.store.receiveproduct.utils.MessageUtil.showMessageBox({
				type: sap.ca.ui.message.Type.WARNING,
				message: sap.retail.store.lib.reuse.util.TextUtil.getText("WARNING_MSG_NO_DOC_SELECTED")
			});
		}
	},

	/**
	 * TFS 2784 : Appliquer le motif sélectionné sur les documents sélectionnés dans l'écran Master.  
	 * 
	 * @param {} 
	 * @returns {void} 
	 */

	applyMoveReasonOnSelectedDocuments: function () {
		var oContext = null,
			aDocuments = [],
			oDocuments = this.getList().getSelectedItems(),
			Constants = retail.store.receiveproduct.utils.Constants;

		// Seuls les documents en statut "Non traités" ou "En Erreur" peuvent porter un Motif
		aDocuments = oDocuments.filter(function (o) {
			oContext = o.getBindingContext();
			return oContext.getProperty("ProcessingState") === Constants.processingState.unprocessed ||
				oContext.getProperty("ProcessingState") === Constants.processingState.error;
		});

		// Contruire un tableau avec les DocumentInternalID des documents sélectionnés
		var aDocumentIDs = aDocuments.map(function (o) {
			oContext = o.getBindingContext();
			return oContext.getProperty("DocumentInternalID");
		});

		if (this._oMoveReasonList.getSelectedItem()) {

			var sMoveReasonKey = this._oMoveReasonList.getSelectedItem().getKey();
			var sMoveReasonName = this._oMoveReasonList.getSelectedItem().getText();

			if (sMoveReasonKey === "0000") {
				sMoveReasonName = "";
			}

			retail.store.receiveproduct.utils.DataManager.updateMoveReasonForDocuments(this._oStore.StoreID, aDocumentIDs, sMoveReasonKey,
				sMoveReasonName);
		}
	},

	/**
	 * TFS 2784 : Cette méthode permet de lire l'instance du controller de la page Détail 
	 * 
	 * @param {} 
	 * @returns {void} 
	 */

	getDetailController: function () {
		var oDetailController = null;

		var aDetailPages = this.getView().getParent().getParent().getDetailPages();
		var oDetailView = jQuery.grep(aDetailPages, function (oItem) {
			return oItem.getViewName() === "retail.store.receiveproduct.view.ProductDetails";
		})[0];

		if (oDetailView && oDetailView.getController()) {
			oDetailController = oDetailView.getController();
		}

		return oDetailController;
	},

	/**
	 * TFS 2784 : Affiche une popup de demande confirmation dans le cas d'un Roll supplémentaire
	 * 
	 * @param {} 
	 * @returns {void} 
	 */

	handleScanSuccessDocument: function (oResponseScanInfo, oResponsePost, oResponseGetDocuments, aErrorResponses) {
		retail.store.receiveproduct.view.DocumentList.prototype.handleScanSuccessDocument.call(this, oResponseScanInfo, oResponsePost,
			oResponseGetDocuments, aErrorResponses);

		return; // En attente de réponse du métier concernant la gestion des Rolls supplémentaires, on interdit pour l'instant l'intégration des rolls supplémentaires...

		// Check if a posting request was submitted and handle the corresponding response
		if (oResponsePost && oResponsePost.statusCode === "201" && oResponsePost.data) {
			if (oResponsePost.data.PostingState === retail.store.receiveproduct.utils.Constants.postingState.inProgress) {
				// Remember that the posted document was not moved to the end yet
				this._sLastPostedDocumentID = oResponsePost.data.DocumentInternalID;

				// Display a message toast
				sap.ca.ui.message.showMessageToast(sap.retail.store.lib.reuse.util.TextUtil.getText("SUCCESS_MSG_DOC_POSTED"));

				// Register the posted documents for subsequent refresh (asynchronous posting in backend)
				retail.store.receiveproduct.utils.PostingUtil.registerPendingDocuments([this._sLastPostedDocumentID]);
			} else if (oResponsePost.data.PostingState === retail.store.receiveproduct.utils.Constants.postingState.notStarted ||
				oResponsePost.data.PostingState === retail.store.receiveproduct.utils.Constants.postingState.error) {
				// Show error message why the posting has not started or was erroneous
				if (oResponsePost.data.PostingMessage) {
					retail.store.receiveproduct.utils.MessageUtil.showMessageBox({
						type: sap.ca.ui.message.Type.WARNING,
						message: oResponsePost.data.PostingMessage
					});
				}
			}
		} else if (aErrorResponses && aErrorResponses.length > 0) {
			// Show error message: posting was not successful
			retail.store.receiveproduct.utils.MessageUtil.showMessageBox({
				type: sap.ca.ui.message.Type.ERROR,
				message: sap.retail.store.lib.reuse.util.TextUtil.getText("ERROR_MSG_POST_REQUEST_FAILED"),
				details: sap.retail.store.lib.reuse.util.TextUtil.getMessageForErrorResponses(aErrorResponses)
			});
		}

		var oItem = this.findItemByDocumentID(oResponseScanInfo.data.DocumentInternalID);
		if (oItem) {
			// The scanned document is already in the list
			retail.store.receiveproduct.utils.DataManager.triggerDocumentRefresh([oResponseScanInfo.data.DocumentInternalID]);
			oItem = this.findItemByDocumentID(oResponseScanInfo.data.DocumentInternalID); // Item might have been re-rendered again
			this.handleUniqueItemAfterRequest(oItem, oResponseScanInfo);
		} else {
			// The scanned document is not in the list yet --> check if document is for current store
			if (!oResponseScanInfo.data.ReceivingStoreID || oResponseScanInfo.data.ReceivingStoreID === oResponseScanInfo.data.StoreID) {
				// Document is for current store --> replace the data
				this.setDocumentDataFromScan(oResponseGetDocuments.data.results, this._bInsertNextDocAtStart, jQuery.proxy(function () {
					// Now the scanned document is in the list
					oItem = this.findItemByDocumentID(oResponseScanInfo.data.DocumentInternalID);
					if (oItem) {
						this.handleUniqueItemAfterRequest(oItem, oResponseScanInfo);
					} else {
						this._bNoHistoryForNavigationAfterScan = false;
						if (!sap.ui.Device.system.phone) {
							this.selectFirstItem();
						}
					}
				}, this));
			} else {
				// Document not for current store: display error message
				this._bNoHistoryForNavigationAfterScan = false;
				var sMessage = "";
				var aParams = [oResponseScanInfo.data.DocumentDisplayID, oResponseScanInfo.data.ReceivingStoreName, oResponseScanInfo.data.ReceivingStoreID];
				switch (oResponseScanInfo.data.ScannedIDType) {
				case retail.store.receiveproduct.utils.Constants.scannedIDType.handlingUnit:
					sMessage = sap.retail.store.lib.reuse.util.TextUtil.getText("ERROR_MSG_HANDLING_UNIT_OTHER_STORE", aParams);
					break;
				case retail.store.receiveproduct.utils.Constants.scannedIDType.delivery:
					sMessage = sap.retail.store.lib.reuse.util.TextUtil.getText("ERROR_MSG_DELIVERY_OTHER_STORE", aParams);
					break;
				case retail.store.receiveproduct.utils.Constants.scannedIDType.purchaseOrder:
					sMessage = sap.retail.store.lib.reuse.util.TextUtil.getText("ERROR_MSG_PURCHASE_ORDER_OTHER_STORE", aParams);
					break;
				}

				// TFS 2784 begin : Gestion des rolls supplémentaires
				sap.m.MessageBox.confirm(sMessage + ". Souhaitez-vous traiter ce roll ?", {
					icon: sap.m.MessageBox.Icon.Error,
					actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
					onClose: function (oAction) {
						if (oAction === sap.m.MessageBox.Action.YES) {
							this.readDocumentFromAnotherStore(oResponseScanInfo.data.ReceivingStoreID, oResponseScanInfo.data.DocumentInternalID);
						}
					}.bind(this)
				});
				// TFS 2784 end : Gestion des rolls supplémentaires
			}
		}
	},

	/**
	 * TFS 2784 : Traitements des Rolls Supplémentaires
	 * 
	 * @param {} 
	 * @returns {void} 
	 */
	readDocumentFromAnotherStore: function (sOwnerStoreID, sDocumentID) {
		if (sOwnerStoreID && sDocumentID) {

			var DataManager = retail.store.receiveproduct.utils.DataManager;

			// Load the data for the given document
			var mUrlParameters = {
				"$expand": "DocumentItems"
			};

			DataManager.readDocumentFromAnotherStore(sOwnerStoreID, this._oStore.StoreID, sDocumentID, mUrlParameters, jQuery.proxy(function (
				oData) {

				var oDocument = oData;

				if (oDocument && oDocument.DocumentInternalID) {

					oDocument.ReceivingStoreID = this._oStore.StoreID;

					// Set the document data to the master list
					this.getView().getModel().setData({
						Documents: [oDocument]
					});

					// Navigate to the item
					// this.setListItem(this.getList().getItems()[0]);
					this.selectFirstItem();

					// Adjust page title and hide the filter toolbar
					this.getPage().setTitle(sap.retail.store.lib.reuse.util.TextUtil.getText("MASTER_TITLE_NUMBER", [1]));
					this.getFilterToolbar().setVisible(false);
				}
			}, this));
		}
	},

	/*
	 *	Trusted Receiving: Start app with current filter (instead of empty): 
	 *	The hook is called once when the app is started. If it returns true 
	 *	and the app runs in Trusted mode, the master list uses the current 
	 *	filter to show the documents in the master list. Otherwise, it shows 
	 *	an empty list.
	 */
	extHookActivateStartWithFilterTrusted: function () {
		// Place your hook implementation code here
		return true;
	},

	/**
	 * TFS 2784 : Réactivation de la Toolbar du SAP Fiori Client
	 * 
	 * @param {} 
	 * @returns {void} 
	 */

	exit: function () {
		retail.store.receiveproduct.view.DocumentList.prototype.exit.call(this, arguments);

		if (sap && sap.Toolbar) {
			sap.Toolbar.setEnabled(true);
		}
	}
});