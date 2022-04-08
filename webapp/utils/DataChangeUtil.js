jQuery.sap.declare("retail.store.receiveproduct.Z_SBO017B_RECV_PROD.utils.DataChangeUtil");
// jQuery.sap.require("retail.store.receiveproduct.Z_SBO017B_RECV_PROD.utils.DataManager");

retail.store.receiveproduct.Z_SBO017B_RECV_PROD.utils.DataChangeUtil = {

	_fnDelayedCall: null,
	_sSelectedDocumentItemID: null,

	/**
	 * -----------------------------------------------------------------------
	 * Incrémenter/décrémenter le stock réserve en unité carton
	 * -----------------------------------------------------------------------
	 * 
	 * XPO le 30.08.2018 :
	 * ------------------
	 *	- TFS 4391 : L'utilisateur modifie le stock réserve d'un article dans les unités du roll
	 */

	increaseStockRoomQuantity: function (oDocumentItem, fNumberToAdd) { // TFS 4389 : Ajout du paramètre fNumberToAdd 
		var fOldStockRoomQuantity = oDocumentItem.StockRoomQuantity * 1; // convert from string to number
		var fMaxStockRoomQuantity = this.getMaxStockRoomQuantity();

		if (fOldStockRoomQuantity < fMaxStockRoomQuantity) {
			var fNewStockRoomQuantity = fOldStockRoomQuantity + fNumberToAdd;
			if (fNewStockRoomQuantity > fMaxStockRoomQuantity) {
				// Set it to the maximum
				fNewStockRoomQuantity = fMaxStockRoomQuantity;
			}

			// Set the new order quantity
			oDocumentItem.StockRoomQuantity = fNewStockRoomQuantity;
			retail.store.receiveproduct.utils.DataManager.updateStockRoomQuantity(oDocumentItem);

			/* 
				Create a delayed submit, so that after a certain inactivity time the data 
				is sent automatically to the backend for update
			*/

			if (this._sSelectedDocumentItemID !== oDocumentItem.DocumentItemID) {
				this._sSelectedDocumentItemID = oDocumentItem.DocumentItemID;
				this._fnDelayedCall = this.delayedFunctionCall(function () {

					retail.store.receiveproduct.utils.DataManager.submitDocumentItemChanges({
						StoreID: oDocumentItem.StoreID,
						DocumentID: oDocumentItem.DocumentID,
						DocumentItemID: oDocumentItem.DocumentItemID
					}, null, function (oError) {
						// Error callback function
						retail.store.receiveproduct.utils.MessageUtil.showMessageBox({
							type: sap.ca.ui.message.Type.ERROR,
							message: sap.retail.store.lib.reuse.util.TextUtil.getText("ERROR_MSG_UPDATE_REQUEST_FAILED"),
							details: sap.retail.store.lib.reuse.util.TextUtil.getMessageForErrorResponses([oError])
						});
					});

				}, 1000);
			}

			this._fnDelayedCall(oDocumentItem);
		}
	},
	 
	/**
	 * -----------------------------------------------------------------------
	 *	Returns a function, that, as long as it continues to be invoked, will not
	 *	be triggered. The function will be called after it stops being called for
	 *	N milliseconds. If `immediate` is passed, trigger the function on the
	 *	leading edge, instead of the trailing.
	 * -----------------------------------------------------------------------
	 */
	delayedFunctionCall: function (func, wait, immediate) {
		var timeout;
		return function () {
			var args = arguments;
			var later = function () {
				timeout = null;
				if (!immediate) func.apply(this, args);
			}.bind(this);
			var callNow = immediate && !timeout;
			jQuery.sap.clearDelayedCall(timeout);
			timeout = jQuery.sap.delayedCall(wait, null, later);
			if (callNow) func.apply(this, args);
		};
	},

	/**
	 * -----------------------------------------------------------------------
	 * RDG 130M : Contrôler la quantité à sortir 
	 * -----------------------------------------------------------------------
	 * 
	 * XPO le 02.07.2018 :
	 * ------------------
	 *	- TFS 4388 : La quantité à sortir est comprise entre 0 et 999 (bornes comprises)
	 *
	 */

	getMaxStockRoomQuantity: function () {
		return 999;
	}
};