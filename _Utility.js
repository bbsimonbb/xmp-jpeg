// Typeof
nTypeof = function (obj) {
	 return ({}).toString.call(obj).match(/\s([a-z|A-Z]+)/)[1].toLowerCase();
}

//------------------------------------Common functions-------------------------------------------------
function addClass(node, classToAdd) {
	try {
		if (node.className.indexOf(classToAdd) == -1) { // Si classToAdd n'est pas déjà attribuée à node alors...
			if (!node.className.length)
				node.className = classToAdd;
			else
				node.className += ' ' + classToAdd;
		}
	} catch (err) { console.log(err) }
}
function removeClass(node, classToRemove) {
	try {
		if (node.className.indexOf(classToRemove) != -1) {
		  node.className = node.className.slice(0, node.className.indexOf(classToRemove)) + node.className.slice(node.className.indexOf(classToRemove) + classToRemove.length, node.className.length);
		  //remove leading space
		  if (node.className.charAt(0) == ' ')
				node.className = node.className.slice(1, node.className.length);
		  //remove trailing space
		  if (node.className.charAt(node.className.length - 1) == ' ')
				node.className = node.className.slice(0, node.className.length - 1);
		}
	} catch (err) { console.log(err) }
}
// thumb0 --> thumb1 --> thumb0
function toggleClass(node, classToToggle) {
	 var index = node.className.indexOf(classToToggle) + classToToggle.length;
	 var classAsArray = node.className.split("");
	 classAsArray[index] = (parseInt(classAsArray[index]) + 1) % 2;
	 node.className = classAsArray.join("");
}
function absorbEvent(event) {
	try {
		  var e = event || window.event;
		  e.preventDefault && e.preventDefault();
		  e.stopPropagation && e.stopPropagation();
		  e.cancelBubble = true;
		  e.returnValue = false;
	 } catch (e) { }
	 finally {
		  return false;
	 }
}

function ImageShrinker() {
	 var me = this;
	 me.fileSizeFactor = null;
	 this.config = {
		  maxWidth: 800,
		  maxHeight: 400,
		  maxLenBase64: 200, //kbytes
		  quality: 0.6
	 }
	 me.scaleImage = function (img, completionCallback) {
		  var canvas = document.createElement('canvas');
		  if (img.height > img.width) {
				canvas.width = img.width;
				canvas.height = img.height;
				canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
		  } else {
				canvas.width = img.height;
				canvas.height = img.width;
				var context = canvas.getContext('2d');
				context.save();
				context.translate(canvas.width / 2, canvas.height / 2);
				context.rotate(90 * Math.PI / 180);
				//context.drawImage(img, 0, 0, canvas.height, canvas.width);
				context.drawImage(img, -img.width / 2, -img.height / 2);
				context.restore();
		  }

		  var initialLongSide, initialShortSide, maxLongSide, maxShortSide,
				longSideFactor, shortSideFactor, finalFactor, finalWidth,
				fileSize;

		  if (img.width > img.height) {
				initialLongSide = img.width;
				initialShortSide = img.height;
		  } else {
				initialLongSide = img.height;
				initialShortSide = img.width;
		  }
		  if (me.config.maxWidth > me.config.maxHeight) {
				maxLongSide = me.config.maxWidth;
				maxShortSide = me.config.maxHeight;
		  } else {
				maxLongSide = me.config.maxHeight;
				maxShortSide = me.config.maxWidth;
		  }
		  longSideFactor = maxLongSide / initialLongSide;
		  shortSideFactor = maxShortSide / initialShortSide;
		  finalFactor = Math.min(longSideFactor, shortSideFactor);
		  finalWidth = Math.floor(img.width * finalFactor);

		  var imageData = me.scale(canvas, finalWidth);

		  completionCallback(imageData);
	 };
	 me.scale = function (canvas, finalWidth) {
		  while (canvas.width >= (2 * finalWidth)) {
				canvas = me.getHalfScaleCanvas(canvas);
		  }
		  //keep this halfscaled canvas in case file size criteria isn't met
		  var halfCanvas = canvas;

		  if (canvas.width > finalWidth) {
				canvas = me.scaleCanvasWithAlgorithm(canvas, finalWidth);
		  }
		  var imageData = canvas.toDataURL('image/jpeg', me.config.quality);

		  //file size
		  if (imageData.length > me.config.maxLenBase64 * 1000) {
				//discard canvas and proceed with halfCanvas, compress to calculate factor
				imageData = halfCanvas.toDataURL('image/jpeg', me.config.quality);
				fileSize = imageData.length;
				//file size proportional to the square of an edge
				if (!me.fileSizeFactor)
					 me.fileSizeFactor = Math.sqrt(me.config.maxLenBase64 * 1000 / fileSize * .8);
				else //don't get caught in a loop. Decrease the fileSize each time we pass.
					 me.fileSizeFactor = me.fileSizeFactor * .9;
				if (me.fileSizeFactor < 1) {
					 //Recursion. First pass scales by config dimension, then tests file size
					 //Second pass, if necessary, starts with last halfCanvas, and repeats the scale with a target dimension calculated from first pass file size.
					 imageData = me.scale(halfCanvas, Math.floor(halfCanvas.width * me.fileSizeFactor));
				}
		  }
		  return imageData;
	 }
	 me.scaleCanvasWithAlgorithm = function (canvas, outputWidth) {
		  var scaledCanvas = document.createElement('canvas');

		  var scale = outputWidth / canvas.width;

		  scaledCanvas.width = outputWidth;
		  scaledCanvas.height = canvas.height * scale;

		  var srcImgData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
		  var destImgData = scaledCanvas.getContext('2d').createImageData(scaledCanvas.width, scaledCanvas.height);

		  me.applyBilinearInterpolation(srcImgData, destImgData, scale);

		  scaledCanvas.getContext('2d').putImageData(destImgData, 0, 0);

		  return scaledCanvas;
	 };

	 me.getHalfScaleCanvas = function (canvas) {
		  var halfCanvas = document.createElement('canvas');
		  halfCanvas.width = canvas.width / 2;
		  halfCanvas.height = canvas.height / 2;

		  halfCanvas.getContext('2d').drawImage(canvas, 0, 0, halfCanvas.width, halfCanvas.height);

		  return halfCanvas;
	 };
}


//Appel Picker avec Promises!

//choices : pour une simple liste déroulante, sans webservice, fournis un tableau de choix.
//          Pour une recherche contre un réferentiel serveur, mets l'url du webservice. Le webservice doit retourner
//          un tableau de choix, chaque choix ayant a minima un "id", un "label", et optionellement un "icon" et un "code"
//          les listes suivantes sont préchargés: "pays", "devises", "services", "natures".

//currChoice : s'il y a déjà une valeur sélectionnée, picker peut la présenter en surbrillance.

//withContext (boolean) : Si ta recherche aura besoin d'une session sur le serveur, mets true. Ainsi, le serveur saura retourner une erreur
//				419 sans déranger la méthode sous-jacente.
//				ex. SaisieDepense-->Choix Dossier n'en a pas besoin, donc false. SaisieFrais-->Choix Nature en a besoin, donc true.

//localChoiceSet : un nom pour cloisonner les options choisis, voir les commentaires à l'entête de Picker.js

//getFullList et getAndStoreFullList (boolean) font que le premier affichage de Picker.aspx présente 2 listes. Les choix précédents
//				dessus, s'il y en a, et puis "tous les éléments" dessous. Ayant récupéré d'emblée "tous les éléments", les recherches utilisateurs
//				se font en javascript contre cette liste. Additionellement, avec getAndStoreFullList, la liste sera retenue en localStorage, 
//				et disponible automatiquement ensuite. Pays, devises, services et natures marchent comme ça.

//function Pick(choices, withContext, currChoice, localChoiceSet, mode, tweaks) 
function Pick(field, choices, currChoice, withContext, localChoiceSet, getFullList, getAndStoreFullList) {
	addClass(field, "actif");
	parent.returnTo(field);
	return parent.goP(1, "Picker.aspx")
	.then(function (pickerPage) {
		window.setTimeout(function () { removeClass(field, "actif"); }, 600);
		pickerPage.settings.withContext = withContext;
		pickerPage.settings.localChoiceSet = localChoiceSet;
		pickerPage.settings.getFullList = getFullList;
		pickerPage.settings.getAndStoreFullList = getAndStoreFullList;
		return pickerPage.start(choices, currChoice);
	})
	.then(function (choice) {
		parent.slide(0);
		if (choice)
			setField(choice, field);
		else
			clearField(field);
		return choice;
	});
}

// Gestion d'erreurs ajax par défaut. 
// Un appel ajax, s'il a besoin d'une session sur le serveur, devrait envoyer withContext=true. Si la session n'est pas présente,
// global.asax retournera HTTP 419. La fonction ci-dessous capte cette réponse et recharge l'acceuil. Cette méthode peut 
// être surchargé au niveau de la page pour une gestion plus soignée.
function onAjaxError(err) {
	var msg
	msg = err;
	try { msg = err.message } catch (anotherError) { }
	if (msg.substring(0, 3) == "419") {
		  parent.Notifications.ValidOk(window.top.sessionErrorMsg, function () { window.top.location.reload(); });
	 } else {
		  console.log(err);
	 }
}
//requêtes HTTP avec Promises !
//returns xhr object, used by getUrlAsXXX() functions
function getUrl(url) {
	 // Return a new promise.
	 return new Promise(function (resolve, reject) {
		  // Do the usual XHR stuff
		  var xhr = new XMLHttpRequest();
		  xhr.open('GET', url);

		  xhr.onload = function () {
				// This is called even on 404 etc
				// so check the status
				if (xhr.status == 200) {
					 // Resolve the promise with the request object
					 // so downstream functions have full access.
					 resolve(xhr);
				}
				else {
					 // Otherwise reject with the status text
					 // which will hopefully be a meaningful error
					 reject(Error(xhr.status + " \"" + xhr.statusText + "\" while getting " + url));
				}
		  };

		  // Handle network errors
		  xhr.onerror = function () {
				reject("Network Error");
		  };

		  // Make the request
		  xhr.send();
	 });
}
//returns text result of url request
function getUrlAsTxt(url) {
	 return getUrl(url).then(
		  function (xhr) { return xhr.response; }
	 )
}
//returns parsed json result of url request
function getUrlAsJson(url) {
	 return getUrl(url).then(
		  function (xhr) {
			try {
				if (xhr.response === "")
					return null;
				else
					 return JSON.parse(xhr.response);
			} catch (err) {
				throw new Error("Response is not JSON. Error parsing the result from " + url)
			}
		  }
	 )
}
//returns responseXml property of url request
function getUrlAsXml(url) {
	 return getUrl(url).then(
		  function (xhr) {
				return xhr.responseXML;
		  }
	 )
}
ImageShrinker.prototype.applyBilinearInterpolation = function (srcCanvasData, destCanvasData, scale) {
	 function inner(f00, f10, f01, f11, x, y) {
		  var un_x = 1.0 - x;
		  var un_y = 1.0 - y;
		  return (f00 * un_x * un_y + f10 * x * un_y + f01 * un_x * y + f11 * x * y);
	 }
	 var i, j;
	 var iyv, iy0, iy1, ixv, ix0, ix1;
	 var idxD, idxS00, idxS10, idxS01, idxS11;
	 var dx, dy;
	 var r, g, b, a;
	 for (i = 0; i < destCanvasData.height; ++i) {
		  iyv = i / scale;
		  iy0 = Math.floor(iyv);
		  // Math.ceil can go over bounds
		  iy1 = (Math.ceil(iyv) > (srcCanvasData.height - 1) ? (srcCanvasData.height - 1) : Math.ceil(iyv));
		  for (j = 0; j < destCanvasData.width; ++j) {
				ixv = j / scale;
				ix0 = Math.floor(ixv);
				// Math.ceil can go over bounds
				ix1 = (Math.ceil(ixv) > (srcCanvasData.width - 1) ? (srcCanvasData.width - 1) : Math.ceil(ixv));
				idxD = (j + destCanvasData.width * i) * 4;
				// matrix to vector indices
				idxS00 = (ix0 + srcCanvasData.width * iy0) * 4;
				idxS10 = (ix1 + srcCanvasData.width * iy0) * 4;
				idxS01 = (ix0 + srcCanvasData.width * iy1) * 4;
				idxS11 = (ix1 + srcCanvasData.width * iy1) * 4;
				// overall coordinates to unit square
				dx = ixv - ix0;
				dy = iyv - iy0;
				// I let the r, g, b, a on purpose for debugging
				r = inner(srcCanvasData.data[idxS00], srcCanvasData.data[idxS10], srcCanvasData.data[idxS01], srcCanvasData.data[idxS11], dx, dy);
				destCanvasData.data[idxD] = r;

				g = inner(srcCanvasData.data[idxS00 + 1], srcCanvasData.data[idxS10 + 1], srcCanvasData.data[idxS01 + 1], srcCanvasData.data[idxS11 + 1], dx, dy);
				destCanvasData.data[idxD + 1] = g;

				b = inner(srcCanvasData.data[idxS00 + 2], srcCanvasData.data[idxS10 + 2], srcCanvasData.data[idxS01 + 2], srcCanvasData.data[idxS11 + 2], dx, dy);
				destCanvasData.data[idxD + 2] = b;

				a = inner(srcCanvasData.data[idxS00 + 3], srcCanvasData.data[idxS10 + 3], srcCanvasData.data[idxS01 + 3], srcCanvasData.data[idxS11 + 3], dx, dy);
				destCanvasData.data[idxD + 3] = a;
		  }
	 }
};