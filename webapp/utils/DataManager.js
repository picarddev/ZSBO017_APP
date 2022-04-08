jQuery.sap.declare("retail.store.receiveproduct.Z_SBO017B_RECV_PROD.utils.DataManager"); // This line of code declares my extended DataManager.js
jQuery.sap.require("retail.store.receiveproduct.Z_SBO017B_RECV_PROD.utils.Constants");
jQuery.sap.require("retail.store.receiveproduct.utils.DataManager"); // This line of code references the standard DataManager.js

/** 
 * TFS 6204 : Cette méthode enlève le filtre cmd d'achat de la liste Type de Documents
 * ---------
 * @param {sStoreID} Code du PDV
 * 
 * @returns {fnSuccess, fnError}
 **/
retail.store.receiveproduct.utils.DataManager.readFilters = function (sStoreID, fnSuccess, fnError) {
	var sPath = "/Stores('" + sStoreID + "')/Filters";
	var oFilter;
	var oDocFilter;
	this.onRequestSent();
	this._oDataModel.read(sPath, {
		success: jQuery.proxy(function (oData, oResponse) {
			this.onRequestCompleted();

			/** Début AMAHJOUB (+)
			 *  Suppression du filtre cmd d'achat du model de la liste Type de Documents
			 **/
			for (var i = 0; i < oData.results.length; i++) {
				if (oData.results[i].FilterID === "DocumentType") {
					oFilter = oData.results[i];
					for (var j = 0; j < oFilter.FilterValues.results.length; j++) {
						oDocFilter = oFilter.FilterValues.results[j];
						if (oDocFilter.FilterValueID === "V") { //Cmd D'achat ID est "V"
							oFilter.FilterValues.results.splice(j, 1);
							break;
						}
					}
					break;
				}
			}
			/** Fin AMAHJOUB (+) **/
			if (typeof fnSuccess === "function") {
				fnSuccess(oData, oResponse);
			}
		}, this),
		error: jQuery.proxy(function (oError) {
			this.onRequestCompleted();
			if (typeof fnError === "function") {
				fnError(oError);
			}
		}, this),
		urlParameters: {
			"$expand": "FilterValues"
		}
	});
};

/**
 * TFS 2784 : Cette méthode liste le référentiel des motifs de la table T157E coté backend.
 * ---------  
 *	
 * @param {sStoreID} Code du PDV	
 *		  {oFilter}	 Permet par ex de filtrer les motifs applicables à un roll entier ou seulement sur un poste des postes du roll 
 * 
 * @returns {void} 
 */

retail.store.receiveproduct.utils.DataManager.readMoveReasons = function (sStoreID, oFilter, mAdditionalParameters, fnSuccess, fnError) {
	// Set URL parameters
	var mUrlParameters = {
		"$inlinecount": "allpages"
	};
	this.enrichURLParameters(mUrlParameters, mAdditionalParameters);
	var sPath = "/Stores('" + sStoreID + "')/MoveReasons";
	this.onRequestSent();
	this._oDataModel.read(sPath, {
		success: jQuery.proxy(function (oData, oResponse) {
			this.onRequestCompleted();
			if (typeof fnSuccess === "function") {
				fnSuccess(oData, oResponse);
			}
		}, this),
		error: jQuery.proxy(function (oError) {
			this.onRequestCompleted();
			if (typeof fnError === "function") {
				fnError(oError);
			}
		}, this),
		filters: oFilter ? [oFilter] : null,
		urlParameters: mUrlParameters
	});
};

/**
 * TFS 2784 : Cette méthode permet de traiter le cas des Rolls supplémentaires 
 * ---------  
 *	
 * @param	{sStoreID} Code du PDV associé réellement asscocié au DocumentID passé en paramètre	
 *			{sReceivingStoreID} Code du PDV recevant finalement le Roll
 *			{sDocumentID} N° du Roll à lire côté backend
 * 
 * @returns {void} 
 */
retail.store.receiveproduct.utils.DataManager.readDocumentFromAnotherStore = function (sStoreID, sReceivingStoreID,
	sDocumentID, mUrlParameters, fnSuccess, fnError) {

	var sPath = "/Documents(StoreID='" + sStoreID + "',DocumentInternalID='" + sDocumentID + "')";
	this.onRequestSent();
	this._oDataModel.read(sPath, {
		success: jQuery.proxy(function (oData, oResponse) {
			this.onRequestCompleted();

			// Copy the data
			var oDocument = jQuery.extend({}, oData);

			if (oDocument.DocumentItems.results) {

				oDocument.DocumentItems.results.forEach(function (oItem) {
					/* 
						Modifier la propriété StoreID du Model DocumentItems par le PDV 
						courant pour que la vue réagisse comme un roll normal. 
					*/
					oItem.StoreID = sReceivingStoreID;
					/* 
						On conserve le véritable propriétaire (cf Méthode ProductListCustom.setDocumentAndItemData)
					*/
					oItem.OwnerStoreID = sStoreID;
				});

				// Merge the document items into the buffer
				this.mergeNewDocumentItems(oDocument.DocumentItems.results);

				// Delete the item data from the copied document data
				oDocument.DocumentItems = {
					results: null
				};
			}

			/* 
				Modifier la propriété StoreID du Model Document par le PDV courant 
				pour que la vue réagisse comme un roll normal. 
			*/
			oDocument.StoreID = sReceivingStoreID;
			/* 
				On conserve le véritable propriétaire (cf Méthode ProductListCustom.setDocumentAndItemData)
			*/
			oDocument.OwnerStoreID = sStoreID;

			// Merge the document data into the buffer
			var aResults = [oDocument];
			this.mergeNewDocuments(aResults);

			// Activate polling for currently pending documents
			this.activatePollForPendingDocuments(aResults);

			if (typeof fnSuccess === "function") {
				fnSuccess(oData, oResponse);
			}
		}, this),
		error: jQuery.proxy(function (oError) {
			this.onRequestCompleted();
			if (typeof fnError === "function") {
				fnError(oError);
			}
		}, this),
		urlParameters: mUrlParameters ? mUrlParameters : null
	});
};

/* ========================								 ======================== */
/* ======================== REFRESH DOCUMENT ITEM MODEL  ======================== */
/* ========================								 ======================== */

/**
 * TFS 2784 : Cette méthode valorise le motif sur la liste des documents passés en paramétre.
 * ---------  L'appel à triggerDocumentRefresh met à jour le model pour afficher le motif sur 
 *			  les documents sélectionnés sur l'écran Master.
 * 
 */

retail.store.receiveproduct.utils.DataManager.updateMoveReasonForDocuments = function (sStoreID, aDocumentIDs, sMoveReasonKey,
	sMoveReasonName) {
	var iIndexDocument = 0;

	// Set move reason on selected items
	for (var i = 0; i < aDocumentIDs.length; i++) {
		// Set the MoveReasonKey and MoveReasonName
		iIndexDocument = this.getDocumentIndexByID(sStoreID, aDocumentIDs[i]);
		this._aDocuments[iIndexDocument].MoveReasonID = sMoveReasonKey;
		this._aDocuments[iIndexDocument].MoveReasonName = sMoveReasonName;
	}

	// Trigger a refresh for the document to update Model
	this.triggerDocumentRefresh(aDocumentIDs);
};

/**
 * TFS 3811 : Avoir la possibilité de "signer" le traitement d'un roll
 * ---------  
 * 
 */

retail.store.receiveproduct.utils.DataManager.updateUserIdentifierForDocuments = function (sStoreID, aDocumentIDs, sUserID) {
	var iIndexDocument = 0;

	// Set move reason on selected items
	for (var i = 0; i < aDocumentIDs.length; i++) {
		// Set the UserIdentifier 
		iIndexDocument = this.getDocumentIndexByID(sStoreID, aDocumentIDs[i]);
		this._aDocuments[iIndexDocument].UserIdentifier = sUserID;
	}

	// Trigger a refresh for the document to update Model
	this.triggerDocumentRefresh(aDocumentIDs);
};

/**
 * TFS 2784 : Cette méthode est une copie de la méthode standard. Elle est appelée
 * ---------  dès que l'utilisateur sélectionne un motifs de refus dans la vue Détail.
 *	
 * @param {oUpdateInfo} Clé StoreID/DocumentID/DocumentItemID/MoveReasonID pour retourver 
 *						le DocumentItem correspondant pour mise à jour
 * 
 *		  {bNoRefresh}	true si la vue ne doit pas être mis à jour 
 * 
 * @returns {void} 
 */

retail.store.receiveproduct.utils.DataManager.updateMoveReasonForDocumentItem = function (oUpdateInfo, bNoRefresh) {

	var sStoreID = oUpdateInfo.StoreID;
	var sDocumentID = oUpdateInfo.DocumentID;
	var sDocumentItemID = oUpdateInfo.DocumentItemID;
	var sMoveReasonID = oUpdateInfo.MoveReasonID;
	var sMoveReasonText = oUpdateInfo.MoveReasonText;

	var iIndexDocument = this.getDocumentIndexByID(sStoreID, sDocumentID);
	var iIndexDocumentItem = this.getDocumentItemIndexByID(sStoreID, sDocumentID, sDocumentItemID);
	if (iIndexDocument < 0 || iIndexDocumentItem < 0) {
		return;
	}

	// Update the units and quantities
	var oDocumentItem = this._aDocumentItems[iIndexDocumentItem];
	oDocumentItem.MoveReasonID = sMoveReasonID;
	oDocumentItem.MoveReasonName = sMoveReasonText;

	if (sMoveReasonID === "0000") {
		oDocumentItem.ReturnQuantity = 0;
	}

	oDocumentItem.ReturnQuantityBase = 0;
	oDocumentItem.ReturnQuantityPostingState = retail.store.receiveproduct.utils.Constants.postingState.notStarted;

	oDocumentItem.BestBeforeDate = null;
	oDocumentItem.BestBeforeDatePostingState = retail.store.receiveproduct.utils.Constants.postingState.notStarted;

	oDocumentItem.BatchNumber = null;
	oDocumentItem.BatchNumberPostingState = retail.store.receiveproduct.utils.Constants.postingState.notStarted;

	if (!bNoRefresh) {
		// Trigger a refresh for the document item
		this.triggerDocumentItemRefresh(sDocumentID, [sDocumentItemID], true);
		// Set processing state and last processed time in parent document(s), also trigger a refresh for these
		this.setStatusForDocumentsAfterItemChange(sStoreID, sDocumentID);
	}
};

/**
 * TFS 2784 : Cette méthode est une copie de la méthode standard. Elle est appelée
 * ---------  si l'utilisateur modifie l'unité dans laquelle sont exprimés les 
 *			  quantités dans la vue détail. Elle met à jour le model pour afficher 
 *			  les qtés convertis dans l'unité sélectionnée.
 *	
 * @param {oUpdateInfo} Object Propriétés de l'objet DocumentItem necessaires à la maj
 *		  {bNoRefresh}	true si le modèle ne doit pas être mis à jour
 * 
 * @returns {void} 
 */

retail.store.receiveproduct.utils.DataManager.updateReceiveQuantityUnit = function (oUpdateInfo, bNoRefresh) {
	var fOldQuantity = 0;

	var sStoreID = oUpdateInfo.StoreID;
	var sDocumentID = oUpdateInfo.DocumentID;
	var sDocumentItemID = oUpdateInfo.DocumentItemID;
	var sUnit = oUpdateInfo.ReceiveQuantityUnit;

	var iIndexDocument = this.getDocumentIndexByID(sStoreID, sDocumentID);
	var iIndexDocumentItem = this.getDocumentItemIndexByID(sStoreID, sDocumentID, sDocumentItemID);
	if (iIndexDocument < 0 || iIndexDocumentItem < 0) {
		return;
	}

	// Update the units and quantities
	var oDocumentItem = this._aDocumentItems[iIndexDocumentItem];
	var sUnitName = this.getQuantityUnitName(sUnit, oDocumentItem);

	// Receive quantity
	fOldQuantity = Number(oDocumentItem.ReceiveQuantityBase);
	oDocumentItem.ReceiveQuantityUnitCode = sUnit;
	oDocumentItem.ReceiveQuantityUnitName = sUnitName;
	oDocumentItem.ReceiveQuantity = this.convertBaseQuantityToUnit(fOldQuantity, sUnit, oDocumentItem);

	// Expected quantity
	fOldQuantity = Number(oDocumentItem.ExpectedQuantityBase);
	oDocumentItem.ExpectedQuantityUnitCode = sUnit;
	oDocumentItem.ExpectedQuantityUnitName = sUnitName;
	oDocumentItem.ExpectedQuantity = this.convertBaseQuantityToUnit(fOldQuantity, sUnit, oDocumentItem);

	// Open quantity
	fOldQuantity = Number(oDocumentItem.OpenQuantityBase);
	oDocumentItem.OpenQuantityUnitCode = sUnit;
	oDocumentItem.OpenQuantityUnitName = sUnitName;
	oDocumentItem.OpenQuantity = this.convertBaseQuantityToUnit(fOldQuantity, sUnit, oDocumentItem);

	// Posted quantity
	fOldQuantity = Number(oDocumentItem.PostedQuantityBase);
	oDocumentItem.PostedQuantityUnitCode = sUnit;
	oDocumentItem.PostedQuantityUnitName = sUnitName;
	oDocumentItem.PostedQuantity = this.convertBaseQuantityToUnit(fOldQuantity, sUnit, oDocumentItem);

	// Begin ins. TFS 2784 : Return quantity
	fOldQuantity = Number(oDocumentItem.ReturnQuantityBase);
	oDocumentItem.ReturnQuantity = this.convertBaseQuantityToUnit(fOldQuantity, sUnit, oDocumentItem);
	// End ins.  : Return quantity

	// Update the corresponding GTIN of the selected unit
	var sSelectedGTIN = "";
	var aGTINs = oDocumentItem.Product && oDocumentItem.Product.ProductGlobalTradeItemNumber &&
		oDocumentItem.Product.ProductGlobalTradeItemNumber.results;
	if (aGTINs && aGTINs.length > 0) {
		// Check all GTINs against "main" flag and the selected unit
		for (var i = 0; i < aGTINs.length; i++) {
			if (aGTINs[i].IsMainGTINForQuantityUnit && aGTINs[i].QuantityUnitCode === sUnit) {
				// The main GTIN for the selected unit was found
				sSelectedGTIN = aGTINs[i].GlobalTradeItemNumber;
				break;
			}
		}
	}

	oDocumentItem.ReceiveQuantityGTIN = sSelectedGTIN;

	if (!bNoRefresh) {
		// Trigger a refresh for the document item
		this.triggerDocumentItemRefresh(sDocumentID, [sDocumentItemID], true);
	}
};

/**
 * TFS 2784 : Cette méthode est une copie de la méthode standard. Elle permet de modifier
 * ---------  le calcul de la quantité en litige et modifie le calcul de la propriété  
 *			  checkItemsCount pour afficher la barre de progression en UVC.
 *
 * @param {oUpdateInfo} Object Propriétés de l'objet DocumentItem necessaires à la maj
 * 
 * @returns {void} 
 */

retail.store.receiveproduct.utils.DataManager.updateReceiveQuantity = function (oUpdateInfo) {
	var sStoreID = oUpdateInfo.StoreID;
	var sDocumentID = oUpdateInfo.DocumentID;
	var sDocumentItemID = oUpdateInfo.DocumentItemID;
	var fReceiveQuantity = oUpdateInfo.ReceiveQuantity;
	var bAddQuantity = oUpdateInfo.bAddQuantity;

	var iIndexDocument = this.getDocumentIndexByID(sStoreID, sDocumentID);
	var iIndexDocumentItem = this.getDocumentItemIndexByID(sStoreID, sDocumentID, sDocumentItemID);
	if (iIndexDocument < 0 || iIndexDocumentItem < 0) {
		return;
	}
	var oDocumentItem = this._aDocumentItems[iIndexDocumentItem];

	var sUnit = oDocumentItem.ReceiveQuantityUnitCode;

	// Get the previous receive quantity and check whether the item was already counted
	var fReceiveQuantityOld = Number(oDocumentItem.ReceiveQuantity);
	var fReceiveQuantityOldBase = this.convertQuantityToBaseUnit(fReceiveQuantityOld, sUnit, oDocumentItem);
	var bItemCounted = this.getItemCounted(oDocumentItem);

	// Update the receive quantity in the buffer
	var fReceiveQuantityNew = bAddQuantity ? fReceiveQuantityOld + fReceiveQuantity : fReceiveQuantity;
	var fReceiveQuantityNewBase = this.convertQuantityToBaseUnit(fReceiveQuantityNew, sUnit, oDocumentItem);
	oDocumentItem.ReceiveQuantity = fReceiveQuantityNew;
	oDocumentItem.ReceiveQuantityBase = fReceiveQuantityNewBase;

	// Begin TFS 3644 : Affichage des qtés en litige au niveau détail du roll
	// Directly update the open quantity as well
	// oDocumentItem.OpenQuantity = Math.max(0, Math.min(Number(oDocumentItem.ExpectedQuantity),
	// 	Number(oDocumentItem.ExpectedQuantity) - Number(oDocumentItem.PostedQuantity) - Number(oDocumentItem.ReceiveQuantity)));
	// oDocumentItem.OpenQuantityBase = Math.max(0, Math.min(Number(oDocumentItem.ExpectedQuantityBase),
	// 	Number(oDocumentItem.ExpectedQuantityBase) - Number(oDocumentItem.PostedQuantityBase) - Number(oDocumentItem.ReceiveQuantityBase)));
	oDocumentItem.OpenQuantity = Math.max(Number(oDocumentItem.PostedQuantity), Number(oDocumentItem.ReceiveQuantity)) - Number(oDocumentItem
		.ExpectedQuantity);
	oDocumentItem.OpenQuantityBase = Math.max(Number(oDocumentItem.PostedQuantityBase), Number(oDocumentItem.ReceiveQuantityBase)) - Number(
		oDocumentItem.ExpectedQuantityBase);
	// End TFS 3644 : Affichage des qtés en litige au niveau détail du roll

	// Update some status variables
	oDocumentItem.ReceiveQuantityIsChanged = true;
	oDocumentItem.ReceiveQuantityPostingState = retail.store.receiveproduct.utils.Constants.postingState.notStarted;
	oDocumentItem.ReceiveQuantityPostingMessage = "";

	// Get the number of counted items
	var fCheckedItemsOld = Number(this._aDocuments[iIndexDocument].CheckedItemsCount);
	var fPostedQuantityBase = Number(oDocumentItem.PostedQuantityBase);

	var fAdd = 0;
	if (fPostedQuantityBase + fReceiveQuantityNewBase >= 0) {
		fAdd = fReceiveQuantityNewBase;
	}

	var fSubt = 0;
	if (fPostedQuantityBase + fReceiveQuantityOldBase >= 0) {
		fSubt = fReceiveQuantityOldBase;
	}

	var fDiff = 0;
	if (bItemCounted) {
		fDiff = fAdd - fSubt;
	} else {
		fDiff = fAdd;
	}

	// Convert the difference to order quantity unit
	var sNewUnit = oDocumentItem.OrderQuantityUnitCode;

	// Si l'article est un poids/prix, convertir vers l'unité UVC
	if (oDocumentItem.DeliveryQuantityUnitCode === "KG") {
		fDiff = this.convertBaseQuantityToUnit(fDiff, sNewUnit, oDocumentItem);
	}

	// Add the changed receive quantity to the counted items and set the document to "In Process" if necessary
	var fCheckedItemsNew = fCheckedItemsOld + parseInt(fDiff, 10);
	this._aDocuments[iIndexDocument].CheckedItemsCount = fCheckedItemsNew;

	// Set processing state and last processed time in parent document(s), also trigger a refresh for these
	this.setStatusForDocumentsAfterItemChange(sStoreID, sDocumentID);

	// Trigger a refresh for the document and the document item
	// with short delay, so that other event handler can fire
	this.triggerDocumentItemRefresh(sDocumentID, [sDocumentItemID], true, 200);
};

/**
 * TFS 5833 : Cette méthode est une copie de la méthode standard. Elle permet de modifier
 * ---------  le calcul de la propriété checkItemsCount pour afficher la barre de progression en UVC
 *			  lors du pointage du Roll à partir du bouton à bascule. 
 * 
 * @param {oUpdateInfo} Object Propriétés de l'objet DocumentItem necessaires à la maj
 * 
 * @returns {void} 
 */

retail.store.receiveproduct.utils.DataManager.updateItemFinished = function (oUpdateInfo) {
	var sStoreID = oUpdateInfo.StoreID;
	var sDocumentID = oUpdateInfo.DocumentID;
	var sDocumentItemID = oUpdateInfo.DocumentItemID;
	var bFinishedState = oUpdateInfo.ItemFinished;
	var bDocItemUpdateAsync = !!oUpdateInfo.DocItemUpdateAsync;

	var iIndexDocument = this.getDocumentIndexByID(sStoreID, sDocumentID);
	var iIndexDocumentItem = this.getDocumentItemIndexByID(sStoreID, sDocumentID, sDocumentItemID);
	if (iIndexDocument < 0 || iIndexDocumentItem < 0) {
		return;
	}
	var oDocumentItem = this._aDocumentItems[iIndexDocumentItem];

	// Update the finished state in the buffer
	oDocumentItem.ReceivingIsFinished = bFinishedState;

	// Check if number of counted items needs to be adjusted
	var fReceiveQuantity = Number(oDocumentItem.ReceiveQuantity);
	if (!oDocumentItem.ReceiveQuantityIsChanged && fReceiveQuantity > 0) {
		// Get the number of counted items
		var fCheckedItemsOld = Number(this._aDocuments[iIndexDocument].CheckedItemsCount);
		var fCheckedItemsNew = fCheckedItemsOld;

		// Item is not manually changed -> the counted quantity has to be adjusted
		var fReceiveQuantityBase = Number(oDocumentItem.ReceiveQuantityBase);
		var sOrderUoM = oDocumentItem.OrderQuantityUnitCode;
		// Begin of ins. tfs 3738 : Commenter le calcul en colis pour conserver l'unité UVC
		var fReceiveQuantityOrderUoM = fReceiveQuantityBase;
		// Si l'article est un poids/prix, convertir vers l'unité UVC
		if (oDocumentItem.DeliveryQuantityUnitCode === "KG") {
			fReceiveQuantityOrderUoM = this.convertBaseQuantityToUnit(fReceiveQuantityBase, sOrderUoM, oDocumentItem);
		}
		// End of ins. tfs 3738 : Commenter le calcul en colis pour conserver l'unité UVC
		if (bFinishedState) {
			// Add the receive quantity to the counted quantity in the document header
			fCheckedItemsNew += fReceiveQuantityOrderUoM;

			// Directly update the open quantity as well: receive quantity needs to be considered
			oDocumentItem.OpenQuantity = Math.max(0, Math.min(Number(oDocumentItem.ExpectedQuantity),
				Number(oDocumentItem.ExpectedQuantity) - Number(oDocumentItem.PostedQuantity) - Number(oDocumentItem.ReceiveQuantity)));
			oDocumentItem.OpenQuantityBase = Math.max(0, Math.min(Number(oDocumentItem.ExpectedQuantityBase),
				Number(oDocumentItem.ExpectedQuantityBase) - Number(oDocumentItem.PostedQuantityBase) - Number(oDocumentItem.ReceiveQuantityBase)));
		} else {
			// Subtract the receive quantity from the counted quantity in the document header
			fCheckedItemsNew -= fReceiveQuantityOrderUoM;

			// Directly update the open quantity as well: receive quantity must not be considered
			oDocumentItem.OpenQuantity = Math.max(0, Number(oDocumentItem.ExpectedQuantity) - Number(oDocumentItem.PostedQuantity));
			oDocumentItem.OpenQuantityBase = Math.max(0, Number(oDocumentItem.ExpectedQuantityBase) - Number(oDocumentItem.PostedQuantityBase));
		}

		this._aDocuments[iIndexDocument].CheckedItemsCount = fCheckedItemsNew;
	}

	// Trigger a refresh for the document item
	this.triggerDocumentItemRefresh(sDocumentID, [sDocumentItemID], bDocItemUpdateAsync);

	// Set processing state and last processed time in parent document(s), also trigger a refresh for these
	this.setStatusForDocumentsAfterItemChange(sStoreID, sDocumentID);
};
/**
 * TFS 2784 : Maj du modèle dès que la qté à retourner est modifiée	
 * ---------  (copie de la métohde updateReceiveQuantity)
 * 
 * @param {oUpdateInfo} Object Propriétés de l'objet DocumentItem necessaires à la maj
 * @returns {void} 
 */

retail.store.receiveproduct.utils.DataManager.updateReturnQuantity = function (oUpdateInfo) {
	var sStoreID = oUpdateInfo.StoreID;
	var sDocumentID = oUpdateInfo.DocumentID;
	var sDocumentItemID = oUpdateInfo.DocumentItemID;
	var fReturnQuantity = oUpdateInfo.ReturnQuantity;
	var bAddQuantity = oUpdateInfo.bAddQuantity;

	var iIndexDocument = this.getDocumentIndexByID(sStoreID, sDocumentID);
	var iIndexDocumentItem = this.getDocumentItemIndexByID(sStoreID, sDocumentID, sDocumentItemID);
	if (iIndexDocument < 0 || iIndexDocumentItem < 0) {
		return;
	}
	var oDocumentItem = this._aDocumentItems[iIndexDocumentItem];

	var sUnit = oDocumentItem.ReceiveQuantityUnitCode;

	// Get the previous receive quantity and check whether the item was already counted
	var fReturnQuantityOld = Number(oDocumentItem.ReturnQuantity);
	// var fReturnQuantityOldBase = this.convertQuantityToBaseUnit(fReturnQuantityOld, sUnit, oDocumentItem);
	// var bItemCounted = this.getItemCounted(oDocumentItem);

	// Update the receive quantity in the buffer
	var fReturnQuantityNew = bAddQuantity ? fReturnQuantityOld + fReturnQuantity : fReturnQuantity;
	var fReturnQuantityNewBase = this.convertQuantityToBaseUnit(fReturnQuantityNew, sUnit, oDocumentItem);
	oDocumentItem.ReturnQuantity = fReturnQuantityNew;
	oDocumentItem.ReturnQuantityBase = fReturnQuantityNewBase;

	// Directly update the open quantity as well
	// oDocumentItem.OpenQuantity = Math.max(0, Math.min(Number(oDocumentItem.ExpectedQuantity),
	// 	Number(oDocumentItem.ExpectedQuantity) - Number(oDocumentItem.PostedQuantity) - Number(oDocumentItem.ReceiveQuantity)));
	// oDocumentItem.OpenQuantityBase = Math.max(0, Math.min(Number(oDocumentItem.ExpectedQuantityBase),
	// 	Number(oDocumentItem.ExpectedQuantityBase) - Number(oDocumentItem.PostedQuantityBase) - Number(oDocumentItem.ReceiveQuantityBase)));

	// Update some status variables
	oDocumentItem.ReturnQuantityIsChanged = true;
	oDocumentItem.ReturnQuantityPostingState = retail.store.receiveproduct.utils.Constants.postingState.notStarted;
	oDocumentItem.ReturnQuantityPostingMessage = "";

	// Set processing state and last processed time in parent document(s), also trigger a refresh for these
	this.setStatusForDocumentsAfterItemChange(sStoreID, sDocumentID);

	// Trigger a refresh for the document and the document item
	// with short delay, so that other event handler can fire
	this.triggerDocumentItemRefresh(sDocumentID, [sDocumentItemID], true, 100);
};

/**
 * TFS 2784 : Mise à jour du modèle dès que la dluo est modifié
 * ---------
 * 
 * @param {oUpdateInfo} Object Propriétés de l'objet DocumentItem necessaires à la maj
 * @returns {void} 
 */

retail.store.receiveproduct.utils.DataManager.updateBestBeforeDate = function (oUpdateInfo) {
	var sStoreID = oUpdateInfo.StoreID;
	var sDocumentID = oUpdateInfo.DocumentID;
	var sDocumentItemID = oUpdateInfo.DocumentItemID;
	var fBestBeforeDate = oUpdateInfo.BestBeforeDate;

	var iIndexDocument = this.getDocumentIndexByID(sStoreID, sDocumentID);
	var iIndexDocumentItem = this.getDocumentItemIndexByID(sStoreID, sDocumentID, sDocumentItemID);
	if (iIndexDocument < 0 || iIndexDocumentItem < 0) {
		return;
	}
	var oDocumentItem = this._aDocumentItems[iIndexDocumentItem];

	// Update the BestBeforeDate in the buffer
	oDocumentItem.BestBeforeDate = fBestBeforeDate;

	// Update some status variables
	// oDocumentItem.BestBeforeDateIsChanged = true;
	oDocumentItem.BestBeforeDatePostingState = retail.store.receiveproduct.utils.Constants.postingState.notStarted;
	oDocumentItem.BestBeforeDatePostingMessage = "";

	// Set processing state and last processed time in parent document(s), also trigger a refresh for these
	this.setStatusForDocumentsAfterItemChange(sStoreID, sDocumentID);

	// Trigger a refresh for the document and the document item
	// with short delay, so that other event handler can fire
	this.triggerDocumentItemRefresh(sDocumentID, [sDocumentItemID], true, 100);
};

/**
 * TFS 2784 : Mise à jour du modèle dès que le n° de lot est modifié
 * ---------
 * 
 * @param {oUpdateInfo} Object Propriétés de l'objet DocumentItem necessaires à la maj
 * @returns {void} 
 */

retail.store.receiveproduct.utils.DataManager.updateBatchNumber = function (oUpdateInfo) {
	var sStoreID = oUpdateInfo.StoreID;
	var sDocumentID = oUpdateInfo.DocumentID;
	var sDocumentItemID = oUpdateInfo.DocumentItemID;
	var fBatchNumber = oUpdateInfo.BatchNumber;

	var iIndexDocument = this.getDocumentIndexByID(sStoreID, sDocumentID);
	var iIndexDocumentItem = this.getDocumentItemIndexByID(sStoreID, sDocumentID, sDocumentItemID);
	if (iIndexDocument < 0 || iIndexDocumentItem < 0) {
		return;
	}
	var oDocumentItem = this._aDocumentItems[iIndexDocumentItem];

	// Update the BatchNumber in the buffer
	oDocumentItem.BatchNumber = fBatchNumber;

	// Update some status variables
	// oDocumentItem.BatchNumberIsChanged = true;
	oDocumentItem.BatchNumberPostingState = retail.store.receiveproduct.utils.Constants.postingState.notStarted;
	oDocumentItem.BatchNumberPostingMessage = "";

	// Set processing state and last processed time in parent document(s), also trigger a refresh for these
	this.setStatusForDocumentsAfterItemChange(sStoreID, sDocumentID);

	// Trigger a refresh for the document and the document item
	// with short delay, so that other event handler can fire
	this.triggerDocumentItemRefresh(sDocumentID, [sDocumentItemID], true, 100);
};

/**
 * TFS 2784 : Cette méthode est une copie de la méthode standard. Elle est appelée
 * ---------  dès que l'utilisateur sélectionne un motifs de refus dans la vue Détail.
 *	
 * @param {oUpdateInfo} Clé StoreID/DocumentID/DocumentItemID/MoveReasonID pour retourver 
 *						le DocumentItem correspondant pour mise à jour
 * 
 *		  {bNoRefresh}	true si la vue ne doit pas être mis à jour 
 * 
 * @returns {void} 
 */

retail.store.receiveproduct.utils.DataManager.updateStockRoomQuantity = function (oUpdateInfo, bNoRefresh) {
	var sStoreID = oUpdateInfo.StoreID;
	var sDocumentID = oUpdateInfo.DocumentID;
	var sDocumentItemID = oUpdateInfo.DocumentItemID;
	var sStockRoomQuantity = oUpdateInfo.StockRoomQuantity;

	var iIndexDocument = this.getDocumentIndexByID(sStoreID, sDocumentID);
	var iIndexDocumentItem = this.getDocumentItemIndexByID(sStoreID, sDocumentID, sDocumentItemID);
	if (iIndexDocument < 0 || iIndexDocumentItem < 0) {
		return;
	}

	// Update the units and quantities
	var oDocumentItem = this._aDocumentItems[iIndexDocumentItem];
	oDocumentItem.StockRoomQuantity = sStockRoomQuantity;

	if (!bNoRefresh) {
		// Set processing state and last processed time in parent document(s), also trigger a refresh for these
		this.setStatusForDocumentsAfterItemChange(sStoreID, sDocumentID);

		// Trigger a refresh for the document item
		this.triggerDocumentItemRefresh(sDocumentID, [sDocumentItemID], true, 100);
	}
};

/**	
 * TFS 5833 : Cette méthode est appelée dès que l'utilisateur sélectionne ou désélectionne
 * ---------  une étiquette pour baliser un article dans la vue Détail.
 *	
 * @param {oUpdateInfo} Clé StoreID/DocumentID/DocumentItemID/TagColor pour retourver 
 *						le DocumentItem correspondant pour mise à jour
 * 
 * @returns {void} 
 */

retail.store.receiveproduct.utils.DataManager.updateProductTagColors = function (oUpdateInfo) {
	var sStoreID = oUpdateInfo.StoreID;
	var sDocumentID = oUpdateInfo.DocumentID;
	var sDocumentItemID = oUpdateInfo.DocumentItemID;
	var aTagColors = oUpdateInfo.TagColor;

	var iIndexDocument = this.getDocumentIndexByID(sStoreID, sDocumentID);
	var iIndexDocumentItem = this.getDocumentItemIndexByID(sStoreID, sDocumentID, sDocumentItemID);
	if (iIndexDocument < 0 || iIndexDocumentItem < 0) {
		return;
	}

	// Update the units and quantities
	var oDocumentItem = this._aDocumentItems[iIndexDocumentItem];
	oDocumentItem.Product.TagColorItem.results = aTagColors;

	// Trigger a refresh for the document item
	this.triggerDocumentItemRefresh(sDocumentID, [sDocumentItemID], true, 100);
};

/* ========================				======================== */
/* ======================== ODATA CALLS ======================== */
/* ========================				======================== */

/** 
 * TFS 2784 :	ENREGISTRER LA LISTE DE DOCUMENTS PASSES EN PARAMETRE
 * --------
 *	Cette méthode est une copie de la méthode standard. Elle est appelée
 *	lors de la sauvegarde du document coté Master. A été ajouté l'envoi
 *	du code motif lors d'un refus de Roll entier.
 */

retail.store.receiveproduct.utils.DataManager.postDocuments = function (sStoreID, aDocumentIDs, fnSuccess, fnError) {
	var i = 0;
	var sPath = "";
	var oEntityData = {};
	var oOperation = null;
	var iIndex = 0;
	var oDocument = null;

	this._oDataModel.clearBatch();
	for (i = 0; i < aDocumentIDs.length; i++) {
		sPath = "/PostDocuments";
		oEntityData = {};
		oEntityData.StoreID = sStoreID;
		oEntityData.DocumentInternalID = aDocumentIDs[i];

		iIndex = this.getDocumentIndexByID(sStoreID, aDocumentIDs[i]);
		oDocument = this._aDocuments[iIndex];

		// TFS 2784 save MoveReasonID 
		oEntityData.MoveReasonID = oDocument.MoveReasonID;
		// TFS 3811 Avoir la possibilité de "signer" le traitement d'un roll
		//oEntityData.UserIdentifier = oDocument.UserIdentifier;

		// Si la propriété OwnerStoreID est valorisée il s'agit du traitement d'un roll supplémentaire
		// if (oDocument.hasOwnProperty("OwnerStoreID") && oDocument.OwnerStoreID !== sStoreID) {
		// 	oEntityData.ReceivingStoreID = sStoreID;
		// 	oEntityData.StoreID = oDocument.OwnerStoreID;
		// }

		oOperation = this._oDataModel.createBatchOperation(sPath, "POST", oEntityData);
		this._oDataModel.addBatchChangeOperations([oOperation]);
	}

	// TFS 3811 : Avoir la possibilité de "signer" le traitement d'un roll
	var aMergeDocOperation = this.prepareMergeDocOperations(sStoreID, aDocumentIDs);
	var iMergeDocLength = aMergeDocOperation.length;

	if (iMergeDocLength > 0) {
		this._oDataModel.addBatchChangeOperations(aMergeDocOperation);
	}

	this.onRequestSent();
	this._oDataModel.submitBatch(jQuery.proxy(function (oData, oResponse, aErrorResponses) {
		this.onRequestCompleted();

		var oBatchResponse = null;
		var oChangeResponse = null;
		var aSuccDocumentIDs = [];
		var aPendingDocumentIDs = [];
		var iIndexDocument = 0;
		for (i = 0; i < aDocumentIDs.length; i++) {
			oBatchResponse = oData.__batchResponses[i];
			oChangeResponse = oBatchResponse.__changeResponses && oBatchResponse.__changeResponses[0];
			if (oChangeResponse && oChangeResponse.statusCode === "201" && oChangeResponse.data) {
				// Collect successful documents
				aSuccDocumentIDs.push(aDocumentIDs[i]);

				if (retail.store.receiveproduct.utils.OfflineUtil.isOffline()) {
					// Set the document to pending and update the last processed time in offline mode
					oChangeResponse.data.PostingState = retail.store.receiveproduct.utils.Constants.postingState.inProgress;
					oChangeResponse.data.LastProcessedTime = new Date();
				}

				if (oChangeResponse.data.PostingState === retail.store.receiveproduct.utils.Constants.postingState.inProgress) {
					// Collect pending documents
					aPendingDocumentIDs.push(aDocumentIDs[i]);
				}

				// Get the document from the data buffer
				iIndexDocument = this.getDocumentIndexByID(sStoreID, aDocumentIDs[i]);

				if (iIndexDocument > -1) {
					// Update the data of the document
					this.updateDocumentFromPostDocument(this._aDocuments[iIndexDocument], oChangeResponse.data);
				}
			}
		}

		// Call success function
		if (typeof fnSuccess === "function") {
			fnSuccess(aSuccDocumentIDs, aPendingDocumentIDs);
		}

		// Call error function if necessary
		if (aErrorResponses && aErrorResponses.length > 0 && typeof fnError === "function") {
			fnError(aErrorResponses);
		}
	}, this), jQuery.proxy(function (oError) {
		// Batch request failed
		this.onRequestCompleted();
		if (typeof fnError === "function") {
			fnError([oError]);
		}
	}, this));
};

/**
 * TFS 2784 : RDG 160A : En cas de présence dans le roll d’un produit non prévu dans le bon de livraison, 
 * ---------			 il est possible d’ajouter un article à la liste des articles du roll
 *	
 * @param {sStoreID} Code du PDV
 * @param {sDocumentID} n° du document
 * @param {sProductID} Code article à ajouter à la liste des articles du document
 *		  {fnSuccess} callback de succès
 *		  {fnError} callback d'erreur
 * 
 * @returns {void} 
 */

retail.store.receiveproduct.utils.DataManager.createPostDocumentItem = function (sStoreID, sDocumentID, sProductID, fnSuccess, fnError) {
	var bRefresh = false;
	var oEntityData = {};
	var sPath = "/PostDocumentItems";

	// Key part
	oEntityData.StoreID = sStoreID;
	oEntityData.DocumentInternalID = sDocumentID;
	oEntityData.DocumentItemInternalID = 0;
	oEntityData.ProductID = sProductID;

	this.onRequestSent();
	this._oDataModel.create(sPath, oEntityData, {
		success: jQuery.proxy(function (oData, oResponse) {
			this.onRequestCompleted();
			this.triggerDocumentItemRefresh(sDocumentID, []);
			this.setStatusForDocumentsAfterItemChange(sStoreID, sDocumentID);
			if (typeof fnSuccess === "function") {
				fnSuccess(oData, oResponse);
			}
		}, this),
		error: jQuery.proxy(function (oError) {
			this.onRequestCompleted();
			if (typeof fnError === "function") {
				fnError(oError);
			}
		}, this)
	});
};

/**
 * TFS 2784 : Suite de la RDG 160A, on autorise la suppression d'un article ajouter manuellement dans le Roll
 * --------
 * @param {sStoreID} Code du PDV
 * @param {sDocumentID} n° du document
 *		  {fnSuccess} callback de succès
 *		  {fnError} callback d'erreur
 * 
 * @returns {void} 
 */
retail.store.receiveproduct.utils.DataManager.removePostDocumentItem = function (sStoreID, sDocumentID, sDocumentItemID, fnSuccess, fnError) {
	// var sPath = "/PostDocumentItems";
	var iIndexDocumentItem = 0;

	iIndexDocumentItem = this.getDocumentItemIndexByID(sStoreID, sDocumentID, sDocumentItemID);

	if (iIndexDocumentItem < 0) {
		return;
	}

	var sPath = "/PostDocumentItems(StoreID='" + sStoreID +
		"',DocumentInternalID='" + sDocumentID +
		"',DocumentItemInternalID=" + sDocumentItemID + ")";

	this.onRequestSent();
	this._oDataModel.remove(sPath, {
		eTag: this._aDocumentItems[iIndexDocumentItem].__metadata.etag,
		success: jQuery.proxy(function (oResponse) {
			this.onRequestCompleted();
			this._aDocumentItems.splice(iIndexDocumentItem, 1);
			if (typeof fnSuccess === "function") {
				fnSuccess(oResponse);
			}
		}, this),
		error: jQuery.proxy(function (oError) {
			this.onRequestCompleted();
			if (typeof fnError === "function") {
				fnError(oError);
			}
		}, this)
	});
};

/**
 * TFS 4191 : Suite de la RDG 190M, on autorise l'annulation des sasies effectuées sur un document 
 * --------
 * @param {sStoreID} Code du PDV
 * @param {sDocumentID} n° du document
 *		  {fnSuccess} callback de succès
 *		  {fnError} callback d'erreur
 * 
 * @returns {void} 
 */

retail.store.receiveproduct.utils.DataManager.removePostDocument = function (sStoreID, sDocumentID, fnSuccess, fnError) {
	// var sPath = "/PostDocumentItems";
	var iIndexDocument = 0;

	iIndexDocument = this.getDocumentIndexByID(sStoreID, sDocumentID);

	if (iIndexDocument < 0) {
		return;
	}

	var sPath = "/PostDocuments(StoreID='" + sStoreID + "',DocumentInternalID='" + sDocumentID + "',Barcode='')";

	this.onRequestSent();
	this._oDataModel.remove(sPath, {
		success: jQuery.proxy(function (oResponse) {
			this.onRequestCompleted();
			this._aDocumentItems.splice(iIndexDocument, 1);
			if (typeof fnSuccess === "function") {
				fnSuccess(oResponse);
			}
		}, this),
		error: jQuery.proxy(function (oError) {
			this.onRequestCompleted();
			if (typeof fnError === "function") {
				fnError(oError);
			}
		}, this)
	});
};

/**
 * TFS 2784 : Retourne l'indice du 1er élément type DocumentItem du document passé en paramètre
 * ---------  
 * 
 * @returns {index} 
 */

retail.store.receiveproduct.utils.DataManager.getFirstDocumentItemIndexByID = function (sStoreID, sDocumentID) {
	var iIndex = -1;

	for (var i = 0; i < this._aDocumentItems.length; ++i) {
		if (this._aDocumentItems[i] &&
			this._aDocumentItems[i].StoreID === sStoreID &&
			this._aDocumentItems[i].DocumentInternalID === sDocumentID) {
			iIndex = i;
			break;
		}
	}

	return iIndex;
};

/**
 * TFS 5833 : Cette méthode permet de retourner l'unité de quantité de base de l'article 
 * 
 * @param {oDocumentItem} Objet valorisant les unités de mesures de l'article nécessaire au calcul de l'unité de base
 * @returns {void} 
 */

retail.store.receiveproduct.utils.DataManager.getNumberOfLowerLevelUoM = function (oDocumentItem) {
	var fNumberOfLowerLevelUoM = null;
	var oProductQuantityUnit = null;

	if (oDocumentItem && oDocumentItem.Product && oDocumentItem.Product.ProductQuantityUnit) {
		oProductQuantityUnit = oDocumentItem.Product.ProductQuantityUnit.results.find(function (oItem) {
			return oItem.QuantityUnitCode === oDocumentItem.DeliveryQuantityUnitCode;
		});
	}

	if (oProductQuantityUnit) {
		fNumberOfLowerLevelUoM = oProductQuantityUnit.Numerator / oProductQuantityUnit.Denominator;
	}

	return fNumberOfLowerLevelUoM;
};

/**
 * TFS 2784 : Cette méthode est une copie de la méthode standard. Elle est appelée si 
 * ---------  l'utilisateur modifie la quantité reçue, retournée, le motif, la dluo, 
 *			  le n° de lot ou le stock réserve et envoi les données au backend.
 *	
 * @param {oKey}		Object Clés StoreID/DocumentID/DocumentItemID pour retourver le 
 *						DocumentItem correspodant pour mise à jour.
 *		  {fnSuccess}	Callback en cas de succés
 *		  {fnError} 	Callback en cas d'erreur
 * 
 * @returns {void} 
 */

retail.store.receiveproduct.utils.DataManager.submitDocumentItemChangesInner = function (oKey, fnSuccess, fnError) {
	var sStoreID = oKey.StoreID;
	var sDocumentID = oKey.DocumentID;
	var sDocumentItemID = oKey.DocumentItemID;

	// Get document item index in buffer
	var iIndexDocumentItem = this.getDocumentItemIndexByID(sStoreID, sDocumentID, sDocumentItemID);

	var oChangedData = {};
	oChangedData.ReceiveQuantity = this.ensureQuantityAsString(this._aDocumentItems[iIndexDocumentItem].ReceiveQuantity);
	oChangedData.ReceiveQuantityUnitCode = this._aDocumentItems[iIndexDocumentItem].ReceiveQuantityUnitCode;
	oChangedData.ReceiveQuantityBase = this.ensureQuantityAsString(this._aDocumentItems[iIndexDocumentItem].ReceiveQuantityBase);
	oChangedData.ReceivingIsFinished = this._aDocumentItems[iIndexDocumentItem].ReceivingIsFinished;

	// Begin ins. TFS 2784 
	oChangedData.MoveReasonID = this._aDocumentItems[iIndexDocumentItem].MoveReasonID;
	oChangedData.ReturnQuantity = this.ensureQuantityAsString(this._aDocumentItems[iIndexDocumentItem].ReturnQuantity);
	oChangedData.ReturnQuantityBase = this.ensureQuantityAsString(this._aDocumentItems[iIndexDocumentItem].ReturnQuantityBase);
	oChangedData.ReturnQuantityIsChanged = this._aDocumentItems[iIndexDocumentItem].ReturnQuantityIsChanged;
	oChangedData.ReturnQuantityPostingState = this._aDocumentItems[iIndexDocumentItem].ReturnQuantityPostingState;
	var dBestBeforeDate = this._aDocumentItems[iIndexDocumentItem].BestBeforeDate;
	oChangedData.BestBeforeDatePostingState = this._aDocumentItems[iIndexDocumentItem].BestBeforeDatePostingState;
	oChangedData.BestBeforeDate = dBestBeforeDate ? dBestBeforeDate : null;
	oChangedData.BatchNumber = this._aDocumentItems[iIndexDocumentItem].BatchNumber;
	oChangedData.BatchNumberPostingState = this._aDocumentItems[iIndexDocumentItem].BatchNumberPostingState;
	// End ins. TFS 2784 

	// Begin ins. TFS 4391
	oChangedData.StockRoomQuantity = this.ensureQuantityAsString(this._aDocumentItems[iIndexDocumentItem].StockRoomQuantity);
	// End ins. TFS 4391

	// Build path for document item
	var sPath = "/DocumentItems(StoreID='" + sStoreID +
		"',DocumentInternalID='" + sDocumentID +
		"',DocumentItemInternalID=" + sDocumentItemID + ")";

	// Create batch operation for updating the entity: send the etag value, which contains the last processed time
	var oOperation = this._oDataModel.createBatchOperation(sPath, "MERGE", oChangedData, {
		sETag: this._aDocumentItems[iIndexDocumentItem].__metadata.etag
	});
	this._oDataModel.clearBatch();
	this._oDataModel.addBatchChangeOperations([oOperation]);

	// Error callback function
	var fnUpdateError = jQuery.proxy(function (oError) {
		// Update failed: re-read the document item
		this.readSingleDocumentItem(sStoreID, sDocumentID, sDocumentItemID, jQuery.proxy(function () {
			// Trigger a refresh for this document item
			this.triggerDocumentItemRefresh(sDocumentID, [sDocumentItemID]);
		}, this));

		// And re-read the document
		this.readSingleDocument(sStoreID, sDocumentID, null, jQuery.proxy(function () {
			// Trigger a refresh for the document
			this.triggerDocumentRefresh([sDocumentID]);
		}, this));

		if (typeof fnError === "function") {
			fnError(oError);
		}
		// Perform post-processing of submit request
		this.onSubmitDocItemRequestDone(oKey);
	}, this);

	// Perform the update on the document item entity (use batch request because we need the response for new etag value)
	this._oDataModel.submitBatch(jQuery.proxy(function (oData, oResponse, aErrorResponses) {
		var oBatchResponse = oData.__batchResponses[0];
		var oChangeResponse = oBatchResponse && oBatchResponse.__changeResponses && oBatchResponse.__changeResponses[0];
		if (oChangeResponse && oChangeResponse.statusCode === "204") {
			// Success case
			if (typeof fnSuccess === "function") {
				fnSuccess();
			}

			// Perform post-processing of submit request
			this.onSubmitDocItemRequestDone(oKey, oChangeResponse);
		} else {
			// Error case
			fnUpdateError(aErrorResponses[0]);
		}
	}, this), function (oError) {
		// Error case
		fnUpdateError(oError);
	});
};

/**
 * TFS 2784 : Cette méthode est une copie de la méthode standard. Elle est appelée si 
 * ---------  l'utilisateur enregistre ces saisies au niveau poste. On autorise l'envoi
 *			  des postes avec une quantité reçue renseignée à 0 et les postes bloqués.   
 *			  Par ex un produit peut ne pas du tout être reçu en point de vente, un 
 *			  litige doit être déclaré.
 *	
 * @param {oItem}		Document
 * @returns {boolean} 
 */

retail.store.receiveproduct.utils.DataManager.getItemPostable = function (oItem) {
	// if (oItem.IsBlockedForReceiving || Number(oItem.ReceiveQuantityBase) === 0 ) {
	// 	return false;
	// } else {
	// 	return true;
	// }
	return true;
};

/**
 * TFS 2784 : Cette méthode est une copie de la méthode standard. Elle est appelée si 
 * ---------  l'utilisateur enregistre ces saisies au niveau de la vue liste des 
 *			  produits pour finaliser son traitement au niveau postes.
 *	
 * @param {sStoreID}			Code du point de vente 
 *		  {sDocumentID}			ID du document principal
 *		  {aDocumentItemIDs}	liste des ID des items de documents
 *		  {fnSuccess}			Callback en cas de succès
 *		  {fnError} 			Callback en cas d'erreur
 * 
 * @returns {void} 
 */

retail.store.receiveproduct.utils.DataManager.preparePostDocumentItemOperations = function (sStoreID, sDocumentID, aDocumentItemIDs,
	fnSuccess, fnError) {
	var sPath = "/PostDocumentItems";
	var oEntityData = {};
	var oOperation = null;
	var aOperations = [];
	var iIndexDocumentItem = 0;
	var oSubmitDocItem = null;
	var oEntityPostDocWithItems = {};
	var aPostDocuments = [];
	var aDocumentItemIDsPending = [];
	var oResult = {};

	var oKey = {
		StoreID: sStoreID,
		DocumentID: sDocumentID,
		DocumentItemID: null
	};

	// check if at least one item is currently being updated
	if (this._aSubmitDocItems.length > 0) {
		this._oPostAfterSubmit = {};
		this._oPostAfterSubmit.StoreID = sStoreID;
		this._oPostAfterSubmit.DocumentID = sDocumentID;
		this._oPostAfterSubmit.DocumentItemIDs = aDocumentItemIDs;
		this._oPostAfterSubmit.fnSuccess = fnSuccess;
		this._oPostAfterSubmit.fnError = fnError;

		oResult.aDocumentItemIDsPending = aDocumentItemIDsPending;
		oResult.aOperations = aOperations;
		return oResult;
	}

	var iLength = aDocumentItemIDs.length;

	for (var i = 0; i < iLength; i++) {
		// Get the document item from the data buffer
		iIndexDocumentItem = this.getDocumentItemIndexByID(sStoreID, sDocumentID, aDocumentItemIDs[i]);
		if (iIndexDocumentItem < 0) {
			continue;
		}
		var oDocumentItem = this._aDocumentItems[iIndexDocumentItem];

		if (!this.getItemPostable(oDocumentItem)) {
			// item cannot be posted: just ignore them without message
			continue;
		}

		// Check if there is a pending submit for the current item
		oKey.DocumentItemID = aDocumentItemIDs[i];
		oSubmitDocItem = this.getSubmitDocItemByKey(oKey);
		if (oSubmitDocItem) {

			// Remember that the document item needs to be posted when the pending request comes back
			oSubmitDocItem.PostAfterSubmit = true;
			oSubmitDocItem.PostAfterSubmitSuccess = fnSuccess;
			oSubmitDocItem.PostAfterSubmitError = fnError;

			// Do not submit this item now
			continue;
		}

		// Set the posting state of the document item to "in progress"
		oDocumentItem.ReceiveQuantityPostingState = retail.store.receiveproduct.utils.Constants.postingState.inProgress;
		aDocumentItemIDsPending.push(aDocumentItemIDs[i]);

		// Create PostDocumentItem entity for posting the current item
		oEntityData = {};

		// Key part
		oEntityData.StoreID = sStoreID;
		oEntityData.DocumentInternalID = sDocumentID;
		oEntityData.DocumentItemInternalID = aDocumentItemIDs[i];

		// Receive quantity part
		oEntityData.ReceiveQuantity = this.ensureQuantityAsString(oDocumentItem.ReceiveQuantity);
		oEntityData.ReceiveQuantityUnitCode = oDocumentItem.ReceiveQuantityUnitCode;
		oEntityData.ReceiveQuantityBase = this.ensureQuantityAsString(oDocumentItem.ReceiveQuantityBase);
		oEntityData.ReceivingIsFinished = oDocumentItem.ReceivingIsFinished;
		oEntityData.ReceiveQuantityIsChanged = oDocumentItem.ReceiveQuantityIsChanged;
		oEntityData.ReceiveQuantityPostingState = retail.store.receiveproduct.utils.Constants.processingState.unprocessed; // TFS Bug 5534 :Un roll traité ne disparait pas de la liste des Rolls à traiter (Complément de la TFS 5272 ) : 

		// Posted quantity part
		oEntityData.PostedQuantity = this.ensureQuantityAsString(oDocumentItem.PostedQuantity);
		oEntityData.PostedQuantityUnitCode = oDocumentItem.PostedQuantityUnitCode;
		oEntityData.PostedQuantityBase = this.ensureQuantityAsString(oDocumentItem.PostedQuantityBase);

		// Begin ins. TFS 2784 
		oEntityData.ProductID = oDocumentItem.ProductID;
		oEntityData.MoveReasonID = oDocumentItem.MoveReasonID;
		oEntityData.ReturnQuantity = this.ensureQuantityAsString(oDocumentItem.ReturnQuantity);
		oEntityData.ReturnQuantityBase = this.ensureQuantityAsString(oDocumentItem.ReturnQuantityBase);
		oEntityData.ReturnQuantityIsChanged = oDocumentItem.ReturnQuantityIsChanged;
		var dBestBeforeDate = oDocumentItem.BestBeforeDate;
		oEntityData.BestBeforeDate = dBestBeforeDate ? dBestBeforeDate : null;
		oEntityData.BatchNumber = oDocumentItem.BatchNumber;
		// End ins. TFS 2784 

		// Begin ins. TFS 3729
		oEntityData.AdditionalItem = oDocumentItem.AssignedDeliveryItemID === 99999 ? true : false;
		// End ins. TFS 3729

		// Begin ins. TFS 4391
		oEntityData.StockRoomQuantity = this.ensureQuantityAsString(oDocumentItem.StockRoomQuantity);
		// End ins. TFS 4391

		// Remaining part
		oEntityData.ChangeID = this.getChangeIDByETag(oDocumentItem.__metadata.etag);

		if (this._mSettings.perfOptAvailable) {
			// prepare creation of deep entity data
			aPostDocuments.push(oEntityData);
		} else {
			// prepare createion of changeset with own create for each PostDocumentItem
			oOperation = this._oDataModel.createBatchOperation(sPath, "POST", oEntityData);
			aOperations.push(oOperation);
		}

	}

	if (this._mSettings.perfOptAvailable && aPostDocuments.length > 0) {
		// create deep entity request
		oEntityPostDocWithItems.StoreID = sStoreID;
		oEntityPostDocWithItems.DocumentInternalID = sDocumentID;
		oEntityPostDocWithItems.PostDocumentItems = aPostDocuments;

		sPath = "PostDocuments";

		oOperation = this._oDataModel.createBatchOperation(sPath, "POST", oEntityPostDocWithItems);
		aOperations.push(oOperation);
	}

	oResult.aDocumentItemIDsPending = aDocumentItemIDsPending;
	oResult.aOperations = aOperations;
	return oResult;
};

/**
 * TFS 2784 : Cette méthode est une copie de la méthode standard. Elle est appelée lors 
 * ---------  du retour du backend dès que l'utilisateur enregistre ces saisies au niveau 
 *		      de la vue liste des produits pour finaliser son traitement au niveau postes.
 *	
 * @param {sStoreID}			Code du point de vente 
 *		  {sDocumentID}			ID du document principal
 *		  {aDocumentItemIDs}	liste des ID des items de documents
 *		  {fnSuccess}			Callback en cas de succès
 *		  {fnError} 			Callback en cas d'erreur
 * 
 * @returns {void} 
 */

retail.store.receiveproduct.utils.DataManager.postDocumentItemsCreatePerItem = function (sStoreID, sDocumentID, aDocumentItemIDs, fnSuccess,
	fnError) {
	// Check and prepare the posting of the given document items	
	var oPrepResult = this.preparePostDocumentItemOperations(sStoreID, sDocumentID, aDocumentItemIDs, fnSuccess, fnError);
	var aPostDocItemOperations = oPrepResult.aOperations;

	var iPostDocItemLength = aPostDocItemOperations.length;
	if (iPostDocItemLength < 1) {
		// Nothing to do
		return;
	}

	this._oDataModel.clearBatch();
	this._oDataModel.addBatchChangeOperations(aPostDocItemOperations);

	// TFS 3811 : Avoir la possibilité de "signer" le traitement d'un roll
	var aMergeDocOperation = this.prepareMergeDocOperations(sStoreID, [sDocumentID]);
	var iMergeDocLength = aMergeDocOperation.length;

	if (iMergeDocLength > 0) {
		this._oDataModel.addBatchChangeOperations(aMergeDocOperation);
	}

	// Create GET request for reading the newest document data
	var aGetDocOperations = this.prepareGetDocOperations(sStoreID, [sDocumentID]);
	var iGetDocLength = aGetDocOperations.length;

	if (iGetDocLength > 0) {
		this._oDataModel.addBatchReadOperations(aGetDocOperations);
	}

	// Refresh the posted document items so that they are not changeable anymore
	this.triggerDocumentItemRefresh(sDocumentID, oPrepResult.aDocumentItemIDsPending, true);

	this.onRequestSent();
	this._oDataModel.submitBatch(jQuery.proxy(function (oData, oResponse, aErrorResponses) {
		this.onRequestCompleted();

		var i, iIndexDocumentItem;
		var oBatchResponseDoc = null;
		var oChangeResponse = null;
		var aSuccErrDocItemIDs = [];
		var aPendingDocumentItemIDs = [];
		var aErrorDocumentItems = [];
		var aResults = [];

		var oBatchResponseChange = oData.__batchResponses[0];
		for (i = 0; i < iPostDocItemLength; i++) {
			oChangeResponse = oBatchResponseChange.__changeResponses && oBatchResponseChange.__changeResponses[i];
			if (oChangeResponse && oChangeResponse.statusCode === "201" && oChangeResponse.data) {

				switch (oChangeResponse.data.ReceiveQuantityPostingState) {
				case retail.store.receiveproduct.utils.Constants.postingState.empty: // TFS 4979 : A l'enregistrement d'un Roll côté détail s'il une erreur apparait les postes se grisent
				case retail.store.receiveproduct.utils.Constants.postingState.success:
				case retail.store.receiveproduct.utils.Constants.postingState.notStarted:
					// Collect successful document item IDs
					aSuccErrDocItemIDs.push(oChangeResponse.data.DocumentItemInternalID);
					break;
				case retail.store.receiveproduct.utils.Constants.postingState.inProgress:
					// Collect pending document item IDs
					aPendingDocumentItemIDs.push(oChangeResponse.data.DocumentItemInternalID);
					break;
				case retail.store.receiveproduct.utils.Constants.postingState.error:
					// Collect erroneous document item IDs
					aSuccErrDocItemIDs.push(oChangeResponse.data.DocumentItemInternalID);
					// Collect already erroneous document items
					aErrorDocumentItems.push({
						DocumentID: oChangeResponse.data.DocumentInternalID,
						DocumentItemID: oChangeResponse.data.DocumentItemInternalID,
						Message: oChangeResponse.data.ReceiveQuantityPostingMessage
					});
					break;
				}

				// TFS 2784 : Gestion des erreurs sur ma qté retournée
				switch (oChangeResponse.data.ReturnQuantityPostingState) {
				case retail.store.receiveproduct.utils.Constants.postingState.success:
				case retail.store.receiveproduct.utils.Constants.postingState.notStarted:
					// Collect successful document item IDs
					aSuccErrDocItemIDs.push(oChangeResponse.data.DocumentItemInternalID);
					break;
				case retail.store.receiveproduct.utils.Constants.postingState.inProgress:
					// Collect pending document item IDs
					aPendingDocumentItemIDs.push(oChangeResponse.data.DocumentItemInternalID);
					break;
				case retail.store.receiveproduct.utils.Constants.postingState.error:
					// Collect erroneous document item IDs
					aSuccErrDocItemIDs.push(oChangeResponse.data.DocumentItemInternalID);
					// Collect already erroneous document items
					aErrorDocumentItems.push({
						DocumentID: oChangeResponse.data.DocumentInternalID,
						DocumentItemID: oChangeResponse.data.DocumentItemInternalID,
						Message: oChangeResponse.data.ReturnQuantityPostingMessage
					});
					break;
				}

				// TFS 2784 : Gestion des erreurs sur la DLUO
				switch (oChangeResponse.data.BestBeforeDatePostingState) {
				case retail.store.receiveproduct.utils.Constants.postingState.success:
				case retail.store.receiveproduct.utils.Constants.postingState.notStarted:
					// Collect successful document item IDs
					aSuccErrDocItemIDs.push(oChangeResponse.data.DocumentItemInternalID);
					break;
				case retail.store.receiveproduct.utils.Constants.postingState.inProgress:
					// Collect pending document item IDs
					aPendingDocumentItemIDs.push(oChangeResponse.data.DocumentItemInternalID);
					break;
				case retail.store.receiveproduct.utils.Constants.postingState.error:
					// Collect erroneous document item IDs
					aSuccErrDocItemIDs.push(oChangeResponse.data.DocumentItemInternalID);
					// Collect already erroneous document items
					aErrorDocumentItems.push({
						DocumentID: oChangeResponse.data.DocumentInternalID,
						DocumentItemID: oChangeResponse.data.DocumentItemInternalID,
						Message: oChangeResponse.data.BestBeforeDatePostingMessage
					});
					break;
				}

				// TFS 2784 : Gestion des erreurs sur le n° de lot
				switch (oChangeResponse.data.BatchNumberPostingState) {
				case retail.store.receiveproduct.utils.Constants.postingState.success:
				case retail.store.receiveproduct.utils.Constants.postingState.notStarted:
					// Collect successful document item IDs
					aSuccErrDocItemIDs.push(oChangeResponse.data.DocumentItemInternalID);
					break;
				case retail.store.receiveproduct.utils.Constants.postingState.inProgress:
					// Collect pending document item IDs
					aPendingDocumentItemIDs.push(oChangeResponse.data.DocumentItemInternalID);
					break;
				case retail.store.receiveproduct.utils.Constants.postingState.error:
					// Collect erroneous document item IDs
					aSuccErrDocItemIDs.push(oChangeResponse.data.DocumentItemInternalID);
					// Collect already erroneous document items
					aErrorDocumentItems.push({
						DocumentID: oChangeResponse.data.DocumentInternalID,
						DocumentItemID: oChangeResponse.data.DocumentItemInternalID,
						Message: oChangeResponse.data.BatchNumberPostingMessage
					});
					break;
				}

				// Get the document item from the data buffer
				iIndexDocumentItem = this.getDocumentItemIndexByID(sStoreID, sDocumentID, oChangeResponse.data.DocumentItemInternalID);

				if (iIndexDocumentItem > -1) {
					// Update the data of the document item
					this.updateDocItemFromPostDocItem(this._aDocumentItems[iIndexDocumentItem], oChangeResponse.data);
				}
			}
		}

		for (i = 1; i < iGetDocLength + 1; i++) {
			// Get response for document GET request
			oBatchResponseDoc = oData.__batchResponses[i + 1];
			if (oBatchResponseDoc && oBatchResponseDoc.statusCode === "200" && oBatchResponseDoc.data) {
				// Merge the document into the buffer
				aResults = [jQuery.extend({}, oBatchResponseDoc.data)];
				this.mergeNewDocuments(aResults);
			}
		}

		// Call success function
		if (typeof fnSuccess === "function") {
			fnSuccess(aSuccErrDocItemIDs, aPendingDocumentItemIDs, aErrorDocumentItems);
		}

		// Call error function if necessary
		if (aErrorResponses && aErrorResponses.length > 0 && typeof fnError === "function") {
			fnError(aErrorResponses);
		}
	}, this), jQuery.proxy(function (oError) {
		// Batch request failed
		this.onRequestCompleted();
		if (typeof fnError === "function") {
			fnError([oError]);
		}
	}, this));
};

/**
 * TFS 2784 : Cette nouvelle méthode cré un appel OData vers POSTDOCUMENT_UPDATE_ENTITY et 
 *			  retourne un tableau de type BatchOperation.
 *	
 * @param {sStoreID}			Code du point de vente 
 *		  {sDocumentID}			ID du document principal
 * 
 * @returns {void} 
 */

retail.store.receiveproduct.utils.DataManager.prepareMergeDocOperations = function (sStoreID, aDocumentIDs) {
	var oOperation = null;
	var aOperations = [];
	var sPath = "";
	var iIndex = -1;
	var oEntityData = {};

	// Get all document IDs in the parent chain of the given document (including the current one)
	var aCompleteDocumentIDs = this.getParentDocumentChain(sStoreID, aDocumentIDs);
	var iLength = aCompleteDocumentIDs.length;
	for (var i = 0; i < iLength; i++) {

		iIndex = this.getDocumentIndexByID(sStoreID, aCompleteDocumentIDs[i], true);

		if (iIndex < 0) {
			continue;
		}

		oEntityData = {};
		oEntityData.UserIdentifier = this._aDocuments[iIndex].UserIdentifier;

		// Create MERGE operation for every postdocument in the parent chain
		sPath = "/PostDocuments(StoreID='" + sStoreID + "',DocumentInternalID='" + aCompleteDocumentIDs[i] + "',Barcode='')";
		oOperation = this._oDataModel.createBatchOperation(sPath, "MERGE", oEntityData);

		aOperations.push(oOperation);
	}

	return aOperations;
};

/**
 * TFS 2784 : Cette méthode est une copie de la méthode standard. Elle est appelée lors du 
 * ---------  retour du backend pour mettre à jour les données de chaque items de poste dès 
 *		      que l'utilisateur enregistre ces saisies au niveau  de la vue liste des produits 
 *			  pour finaliser son traitement au niveau postes.
 *	
 * @param {oDocumentItem}			
 *		  {oPostDocumentItem}		
 * 
 * @returns {void} 
 */

retail.store.receiveproduct.utils.DataManager.updateDocItemFromPostDocItem = function (oDocumentItem, oPostDocumentItem) {
	// Update properties in DocumentItem with new data coming from PostDocumentItem
	// Posted quantity part
	oDocumentItem.PostedQuantity = oPostDocumentItem.PostedQuantity;
	oDocumentItem.PostedQuantityUnitCode = oPostDocumentItem.PostedQuantityUnitCode;
	oDocumentItem.PostedQuantityUnitName = oPostDocumentItem.PostedQuantityUnitName;
	oDocumentItem.PostedQuantityBase = oPostDocumentItem.PostedQuantityBase;

	// Receive quantity part
	oDocumentItem.ReceiveQuantity = oPostDocumentItem.ReceiveQuantity;
	oDocumentItem.ReceiveQuantityUnitCode = oPostDocumentItem.ReceiveQuantityUnitCode;
	oDocumentItem.ReceiveQuantityBase = oPostDocumentItem.ReceiveQuantityBase;
	oDocumentItem.ReceiveQuantityIsChanged = oPostDocumentItem.ReceiveQuantityIsChanged;
	oDocumentItem.ReceiveQuantityPostingState = oPostDocumentItem.ReceiveQuantityPostingState;
	oDocumentItem.ReceiveQuantityPostingMessage = oPostDocumentItem.ReceiveQuantityPostingMessage;
	oDocumentItem.ReceivingIsFinished = oPostDocumentItem.ReceivingIsFinished;

	// Open quantity part
	// oDocumentItem.OpenQuantity = oPostDocumentItem.OpenQuantity;
	// TFS 2784 : On recalcul la qté en litige (open qty) car celle-ci n'est pas persistée dans la table RTST_RP_STAT_ITM
	oDocumentItem.OpenQuantity = Number(oDocumentItem.ReceiveQuantity) - Number(oDocumentItem.ExpectedQuantity);
	// oDocumentItem.OpenQuantityBase = oPostDocumentItem.OpenQuantityBase;
	// TFS 2784 : On recalcul la qté en litige (open qty) car celle-ci n'est pas persistée dans la table RTST_RP_STAT_ITM
	oDocumentItem.OpenQuantityBase = Number(oDocumentItem.ReceiveQuantityBase) - Number(oDocumentItem.ExpectedQuantityBase);
	oDocumentItem.OpenQuantityUnitCode = oPostDocumentItem.OpenQuantityUnitCode;

	// Remaining part
	oDocumentItem.AssignedMaterialDocIDs = oPostDocumentItem.AssignedMaterialDocIDs;
	oDocumentItem.LastProcessedTime = oPostDocumentItem.LastProcessedTime;

	// Return quantity part
	oDocumentItem.ReturnQuantity = oPostDocumentItem.ReturnQuantity;
	oDocumentItem.ReturnQuantityBase = oPostDocumentItem.ReturnQuantityBase;
	oDocumentItem.ReturnQuantityIsChanged = oPostDocumentItem.ReturnQuantityIsChanged;
	oDocumentItem.ReturnQuantityPostingState = oPostDocumentItem.ReturnQuantityPostingState;
	oDocumentItem.ReturnQuantityPostingMessage = oPostDocumentItem.ReturnQuantityPostingMessage;

	// Best Before Date part (DLUO)
	oDocumentItem.BestBeforeDate = oPostDocumentItem.BestBeforeDate;
	oDocumentItem.BestBeforeDatePostingState = oPostDocumentItem.BestBeforeDatePostingState;
	oDocumentItem.BestBeforeDatePostingMessage = oPostDocumentItem.BestBeforeDatePostingMessage;

	// Batch number part
	oDocumentItem.BatchNumber = oPostDocumentItem.BatchNumber;
	oDocumentItem.BatchNumberPostingState = oPostDocumentItem.BatchNumberPostingState;
	oDocumentItem.BatchNumberPostingMessage = oPostDocumentItem.BatchNumberPostingMessage;

	// Update ETag value
	if (oPostDocumentItem.__metadata && oPostDocumentItem.__metadata.etag && oDocumentItem.__metadata) {
		oDocumentItem.__metadata.etag = oPostDocumentItem.__metadata.etag;
	}
};

/**
 * TFS 2784 : Supprime les zéros non signigicatifs devant les n° de rolls
 *	
 * @param {aDocuments} Liste des Rolls
 * @returns {void} 
 */
retail.store.receiveproduct.utils.DataManager.mergeNewDocuments = function (aDocuments) {
	var iIndex = 0;
	var sStoreID = "";
	var sDocumentID = "";

	for (var i = 0; i < aDocuments.length; i++) {
		sStoreID = aDocuments[i].StoreID;
		sDocumentID = aDocuments[i].DocumentInternalID;

		iIndex = this.getDocumentIndexByID(sStoreID, sDocumentID, true);
		aDocuments[i].DocumentDisplayID = parseInt(aDocuments[i].DocumentDisplayID, 10);
		if (this._aDocuments[iIndex] && this._aDocuments[iIndex].StoreID === sStoreID &&
			this._aDocuments[iIndex].DocumentInternalID === sDocumentID) {
			// Update with new data
			this._aDocuments[iIndex] = aDocuments[i];
		} else {
			// Insert new document
			this._aDocuments.splice(iIndex, 0, aDocuments[i]);
		}
	}
};

/**
 * -----------------------------------------------------------------------
 * TFS 5833 : Lister les étiquettes (balisage) associées aux produits 
 * -----------------------------------------------------------------------
 * 
 */

retail.store.receiveproduct.utils.DataManager.buildExpandForDocumentItem = function () {
	var sExpand = "Product/ProductGlobalTradeItemNumber,Product/TagColorItem"; // TFS 5833 : Ajouter l'expand à Product/TagColorItem
	if (this._bDetailedReceiving) {
		sExpand = sExpand + ",Product/ProductQuantityUnit";
	}
	return sExpand;
};

/** 
 * TFS XXXX : Retourner l'Id Produit d'un article scanné (Barcode)
 * ---------
 * @param {sStoreID} Code du PDV
 * @param {sBarcode} GTIN
 * @returns {fnSuccess,fnError}
 **/
retail.store.receiveproduct.utils.DataManager.barCodeGetArticle = function (sStoreID, sBarCode, fnSuccess, fnError) {
	var sPath = "/ScanInformations(StoreID='" + sStoreID + "',Barcode='" + sBarCode + "')";
	this.onRequestSent();
	this._oDataModel.read(sPath, {
		success: jQuery.proxy(function (oData, oResponse) {
			this.onRequestCompleted();
			if (typeof fnSuccess === "function") {
				fnSuccess(oData, oResponse);
			}
		}, this),
		error: jQuery.proxy(function (oError) {
			this.onRequestCompleted();
			if (typeof fnError === "function") {
				fnError(oError);
			}
		}, this)
	});

};