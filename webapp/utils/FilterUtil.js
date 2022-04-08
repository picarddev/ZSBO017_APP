jQuery.sap.declare("retail.store.receiveproduct.Z_SBO017B_RECV_PROD.utils.FilterUtil"); // This line of code declares my extended FilterUtil.js
jQuery.sap.require("retail.store.receiveproduct.utils.FilterUtil"); // This line of code references the standard FilterUtil.js

/**
 * TFS 2784 : On remplace la méthode standard pour forcer la sélection de tous les filtres.
 * ---------  Cette méthode est appelée lors de l'évènement onFilterButtonPress du controller
 *			  DocumentList.controller.js
 *	
 * @param {aFilters} 
 *		  {sFilterType}
 *			
 * @returns {void} 
 */
// retail.store.receiveproduct.utils.FilterUtil.applyFiltersToData = function(aFilters, sFilterType) {

// 	var oFilterValue = null;
// 	for (var i = 0; i < aFilters.length; i++) {
// 		for (var j = 0; j < aFilters[i].FilterValues.results.length; j++) {
// 			oFilterValue = aFilters[i].FilterValues.results[j];
// 			// ne pas sélectionné l'état cloturé
// 			if (oFilterValue.FilterID === "ProcessingState" && oFilterValue.FilterValueID === "8") {
// 				aFilters[i].FilterValues.results[j].Selected = false;
// 			} else {
// 				aFilters[i].FilterValues.results[j].Selected = true;
// 			}
// 		}
// 	}
// };