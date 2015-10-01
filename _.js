//function justifImgClick(event) {
//	//if (document.getElementById("justifThumb").src.indexOf("justif_icon.png") == -1) {
//	//deleted all the code that changes panels
//	//} else {
//	//pop camera
//	document.getElementById('justifFileInput').click();
//	//}
//}
function handleJustif(evt) {
	document.getElementById("justifLoading").style.display = "block";
	var files = evt.target.files; // FileList object

	// Loop through the FileList and render image files as thumbnails.
	for (var i = 0, f; f = files[i]; i++) {
		// Only process image files.
		if (!f.type.match('image.*')) {
			continue;
		}
		var reader = new FileReader();
		// Closure to capture the file information.
		reader.onload = (function (theFile) {
			return function (e) {
				//var exif = EXIF.readFromBinaryFile(new BinaryFile(reader.result));
				//alert(exif.Orientation);
				//Shrink it
				var img = document.createElement("img");
				img.addEventListener("load", function () {
					var shrkr = new ImageShrinker();
					shrkr.config.maxWidth = 20;
					shrkr.config.maxHeight = 20;
					//base64 longer than binary, conversion here.
					shrkr.config.maxLenBase64 = 250 * 4 / 3;
					shrkr.config.quality = 80 / 100;

					shrkr.scaleImage(img, finaliseJustifSelection);
				});
				img.src = e.target.result;
			};
		})(f);
		// Read in the image file as a data URL.
		reader.readAsDataURL(f);
	}
}

function finaliseJustifSelection(scaledImg) {
	// metadata handling starts here
	headerAndData = scaledImg.split(',');
	var bytes = Crypto.util.base64ToBytes(headerAndData[1]);
	var arr = Uint8Array.from(bytes);
	var imgWithMeta = insertXmp(arr.buffer, "BODDY,Simonאא");
	var b64ImgWithMeta = headerAndData[0] + ',' + Crypto.util.bytesToBase64(imgWithMeta);
	document.getElementById("justifLoading").style.display = "none";
	document.getElementById("justifInput").value = b64ImgWithMeta;
	var thumb = document.getElementById("justifThumb");
	thumb.src = b64ImgWithMeta;
	var newImg = new Image();
	newImg.src = thumb.src;
}
function preview( arr) {
	var taste = '';
	taste += '<table><tr>'
	for (var i = 0; i < arr.length; i++) {
		if (i>1 && i % 16 == 0)
			taste += '</tr><tr>'

			taste += '<td>' + paddy(arr[i].toString(16),2) + '</td>';
	}
	taste += '</tr></table>';
	//alert(taste);
	document.getElementById("putBytesHere").innerHTML = taste;
}
//Left pad an input n to width p with padding char c, or zero
function paddy(n, p, c) {
	var pad_char = typeof c !== 'undefined' ? c : '0';
	var pad = new Array(1 + p).join(pad_char);
	return (pad + n).slice(-pad.length);
}
function insertXmp(inBuffer, NOMPrenom) {
	var parser = new DOMParser();
	var xmp = parser.parseFromString(getXmpTemplate(), "text/xml").documentElement;
	var now = new Date().toISOString();
	var httpNsAdobe = 'http://ns.adobe.com/xap/1.0/\0'
	//we will insert after the FFE0 segment whose length is defined in bytes 4 & 5


	xmp.getElementsByTagName("Description")[0].setAttribute("xmp:ModifyDate", now);
	xmp.getElementsByTagName("Description")[0].setAttribute("xmp:CreateDate", now);
	xmp.getElementsByTagName("Description")[0].setAttribute("xmp:MetadataDate", now);
	xmp.getElementsByTagName("creator")[0].firstChild.firstChild.innerHTML = NOMPrenom;
	xmp.getElementsByTagName("rights")[0].firstChild.firstChild.innerHTML = NOMPrenom;

	//insert it
	var dvIn = new DataView(inBuffer);
	var pos = 4 + dvIn.getUint16(4); //get length of APP0 segment
	var encodedPayload = new TextEncoder().encode(
		'XXXX' + //APP1 marker and length will go here
		httpNsAdobe + 
		getXmpPacketHeader() +
		xmp.innerHTML +
		getPadding() +
		getXmpPacketFooter()
	)
	//DataView lets us treat our buffer as whatever data type we like, 
	//So we can assign 2 byte integers at the start of our utf8 encoded stream...
	dvOut = new DataView(encodedPayload.buffer);
	//APP1 marker
	dvOut.setUint16(0, 0xFFE1);
	//length of packet as 2 byte integer, in bytes 2 & 3.
	dvOut.setUint16(2, encodedPayload.buffer.byteLength - 2); //APP1 marker not counted in length
	//begin="0xFEFF", byte order marker
	dvOut.setUint16(50, 0xFEFF);

	var inArr = new Uint8Array(inBuffer);
	var outBuffer = new ArrayBuffer(inArr.length + encodedPayload.length);
	var outArr = new Uint8Array(outBuffer);
	outArr.set(inArr.subarray(0, pos)); //APP0 segment, 20 bytes
	outArr.set(encodedPayload, pos); //Our XMP payload
	outArr.set(inArr.subarray(pos), pos + encodedPayload.length);//Rest of image

	preview(outArr);

	//deals with unicode !!
	return outArr;
}
function getXmpTemplate() {
	return '<root><x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Adobe XMP Core 5.5-c002 1.148022, 2012/07/15-18:06:45        ">\n' +
'	<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">\n' +
'		<rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:xmp="http://ns.adobe.com/xap/1.0/" \n' +
'			xmlns:xmpMM="http://ns.adobe.com/xap/1.0/mm/" xmlns:stEvt="http://ns.adobe.com/xap/1.0/sType/ResourceEvent#" \n' +
'			xmlns:stRef="http://ns.adobe.com/xap/1.0/sType/ResourceRef#" \n' +
'			rdf:about=""\n' +
'			dc:format="image/jpeg" \n' +
'			xmp:ModifyDate="2014-05-06T21:03:57+02:00" \n' +
'			xmp:CreateDate="2014-04-30T19:37:15.00" \n' +
'			xmp:MetadataDate="2014-05-06T21:03:57+02:00">\n' +
'			<dc:creator><rdf:Seq><rdf:li>creator</rdf:li></rdf:Seq></dc:creator>\n' + //access with .firstChild doesn't like whitespace
'			<dc:rights><rdf:Alt><rdf:li xml:lang="x-default">rights</rdf:li></rdf:Alt></dc:rights>\n' +
'			<xmpMM:History>\n' +
'				<rdf:Seq>\n' +
'					<rdf:li stEvt:action="derived" stEvt:parameters="resized by notilus mobility"/>\n' +
'				</rdf:Seq>\n' +
'			</xmpMM:History>\n' +
'		</rdf:Description>\n' +
'	</rdf:RDF>\n' +
'</x:xmpmeta></root>';
}
function getXmpPacketHeader() {
	return '<?xpacket begin="XX" id="' + generateGUID() + '"?>';
}
function getXmpPacketFooter() {
	return '<?xpacket end="w"?>';
}
function getPadding() {
	var lines = '';
	for (var i = 0; i < 10; i++) { //1k padding
		lines += '                                                                                                  \n'
	}
	return lines;
}

var generateGUID = (typeof (window.crypto) != 'undefined' &&
						 typeof (window.crypto.getRandomValues) != 'undefined') ?
		 function () {
		 	// If we have a cryptographically secure PRNG, use that
		 	// http://stackoverflow.com/questions/6906916/collisions-when-generating-uuids-in-javascript
		 	var buf = new Uint16Array(8);
		 	window.crypto.getRandomValues(buf);
		 	var S4 = function (num) {
		 		var ret = num.toString(16);
		 		while (ret.length < 4) {
		 			ret = "0" + ret;
		 		}
		 		return ret;
		 	};
		 	return (S4(buf[0]) + S4(buf[1]) + "-" + S4(buf[2]) + "-" + S4(buf[3]) + "-" + S4(buf[4]) + "-" + S4(buf[5]) + S4(buf[6]) + S4(buf[7]));
		 }

		 :

		 function () {
		 	// Otherwise, just use Math.random
		 	// http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/2117523#2117523
		 	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		 		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		 		return v.toString(16);
		 	});
		 };
