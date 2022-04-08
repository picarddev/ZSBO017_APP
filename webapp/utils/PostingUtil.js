jQuery.sap.declare("retail.store.receiveproduct.Z_SBO017B_RECV_PROD.utils.PostingUtil");

/**
 * TFS 5598 : Cette méthode est une copie de la méthode standard. Elle est appelée lors 
 * ---------  du retour du backend dès que l'utilisateur enregistre ces saisies au niveau 
 *		      de la vue liste des produits pour finaliser son traitement au niveau postes.
 *	
 * @param {sStoreID}			Code du point de vente 
 *		  {sDocumentID}			ID du document principal
 *		  {aDocumentItemIDs}	liste des ID des items de documents
 * 
 * @returns {void} 
 */
 
retail.store.receiveproduct.utils.PostingUtil.postDocumentItems = function (sStoreID, sDocumentID, aDocumentItemIDs) {
	retail.store.receiveproduct.utils.DataManager.postDocumentItems(sStoreID, sDocumentID, aDocumentItemIDs,
		jQuery.proxy(function (aSuccErrDocumentItemIDs, aPendingDocumentItemIDs, aErrorDocumentItems) {

			// Refresh the document (or parent doc chain if necessary) 
			var aDocumentIDs = retail.store.receiveproduct.utils.DataManager.getParentDocumentChain(sStoreID, [sDocumentID]);
			retail.store.receiveproduct.utils.DataManager.triggerDocumentRefresh(aDocumentIDs);

			if (aSuccErrDocumentItemIDs.length > 0) {
				// Refresh successful or erroneous items; pending items do not have to be updated, because nothing changed beside posting state					
				retail.store.receiveproduct.utils.DataManager.triggerDocumentItemRefresh(sDocumentID, aSuccErrDocumentItemIDs);
				if (aErrorDocumentItems.length === 0) {
					sap.ca.ui.message.showMessageToast(sap.retail.store.lib.reuse.util.TextUtil.getText(
						aSuccErrDocumentItemIDs.length === 1 ? "SUCCESS_MSG_DOC_ITEMS_POSTED_SUCCESSFULLY" :
						"SUCCESS_MSG_DOCS_ITEMS_POSTED_SUCCESSFULLY", [aSuccErrDocumentItemIDs.length]
					));
				}
			}

			if (aPendingDocumentItemIDs.length > 0) {
				// Register the posted document items for subsequent refresh (asynchronous posting in backend)
				this.registerPendingDocumentItems(sDocumentID, aPendingDocumentItemIDs);
				if (aErrorDocumentItems.length === 0) {
					sap.ca.ui.message.showMessageToast(sap.retail.store.lib.reuse.util.TextUtil.getText(
						aPendingDocumentItemIDs.length === 1 ? "SUCCESS_MSG_DOC_ITEMS_POSTED" : "SUCCESS_MSG_DOCS_ITEMS_POSTED", [
							aPendingDocumentItemIDs.length
						]
					));
				}
			}

			if (aErrorDocumentItems.length > 0) {
				// Some document items were posted synchronously and caused errors -> display messages
				this.displayMessageForErroneousDocumentItems(aErrorDocumentItems);
				
				// Re-read the document
				retail.store.receiveproduct.utils.DataManager.readSingleDocument(sStoreID, sDocumentID, function () {
					retail.store.receiveproduct.utils.DataManager.triggerDocumentRefresh([sDocumentID], true);
				});
				retail.store.receiveproduct.utils.DataManager.readItemsForDocument(sStoreID, sDocumentID, function () {
					retail.store.receiveproduct.utils.DataManager.triggerDocumentItemRefresh(sDocumentID, aDocumentItemIDs, true);
				});	
			}
		}, this),
		function (aErrorResponses) {
			// Error callback function
			retail.store.receiveproduct.utils.MessageUtil.showMessageBox({
				type: sap.ca.ui.message.Type.ERROR,
				message: sap.retail.store.lib.reuse.util.TextUtil.getText("ERROR_MSG_POST_REQUEST_FAILED"),
				details: sap.retail.store.lib.reuse.util.TextUtil.getMessageForErrorResponses(aErrorResponses)
			});
			
			/*
			 *	TFS 5598 :Bogue popup message erreur "Produit xxx modifié entre temps par l'utilisateur yyy. Action interrompue" 
			 *
			 *	On force le rechargement du model à partir du backend pour forcer la mise à jour de l'etag. Sinon
			 *  le message d'erreur "Produit xxx modifié entre temps par l'utilisateur yyy. Action interrompue"
			 *	apparait.
			*/
			
			// Re-read the document
			retail.store.receiveproduct.utils.DataManager.readSingleDocument(sStoreID, sDocumentID, function () {
				retail.store.receiveproduct.utils.DataManager.triggerDocumentRefresh([sDocumentID], true);
			});
			retail.store.receiveproduct.utils.DataManager.readItemsForDocument(sStoreID, sDocumentID, function () {
				retail.store.receiveproduct.utils.DataManager.triggerDocumentItemRefresh(sDocumentID, aDocumentItemIDs, true);
			});
		});
};