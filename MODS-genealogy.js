{
	"translatorID": "b5624642-e482-45f7-b9ca-03e04d6b0d52",
	"label": "MODS-genealogy 2",
	"creator": "Stephen W. Adcock",
	"target": "xml",
	"minVersion": "2.1.9",
	"maxVersion": "",
	"priority": 40,
	"configOptions": {
		"dataMode": "xml/dom"
	},
	"displayOptions": {
		"exportNotes": true
	},
	"inRepository": true,
	"translatorType": 1,
	"browserSupport": "gcs",
	"lastUpdated": "2013-05-02 13:30:08"
}

var fromTypeOfResource = {
  //"text":XXX,
  "cartographic":"map",
  //"notated music":XXX,
  "sound recording-musical":"audioRecording",
  "sound recording-nonmusical":"audioRecording",
  "sound recording":"audioRecording",
  "still image":"artwork",
  "moving image":"videoRecording",
  //"three dimensional object":XXX,
  "software, multimedia":"computerProgram"
};

var modsTypeRegex = {
//  'artwork': 
//  'audioRecording': /\bmusic/i,
//  'bill': 
  'blogPost': /\bblog/i,
//  'book': 
//  'bookSection': 
//  'case': 
//  'computerProgram': 
//  'conferencePaper': 
//  'dictionaryEntry': 
//  'email': 
//  'encyclopediaArticle': 
//  'film': 
//  'forumPost': 
//  'hearing': 
//  'instantMessage': 
//  'interview': 
  'journalArticle': /journal\s*article/i,
//  'letter': 
  'magazineArticle': /magazine\s*article/i,
//  'manuscript': 
//  'map': 
  'newspaperArticle': /newspaper\*article/i
//  'patent': 
//  'podcast': 
//  'presentation': 
//  'radioBroadcast': 
//  'report': 
//  'statute': 
//  'thesis': 
//  'tvBroadcast': 
//  'videoRecording': 
//  'webpage': 
};

var modsInternetMediaTypes = {
  //a ton of types listed at http://www.iana.org/assignments/media-types/index.html
  'text/html': 'webpage'
};

var marcRelators = {
  "aut":"author",
  "edt":"editor",
  "ctb":"contributor",
  "pbd":"seriesEditor",
  "trl":"translator"
};

// Item types that are part of a larger work
var partialItemTypes = ["blogPost", "bookSection", "conferencePaper", "dictionaryEntry",
  "encyclopediaArticle", "forumPost", "journalArticle", "magazineArticle",
  "newspaperArticle", "webpage"];

// Namespace array for using ZU.xpath
var ns = "http://www.loc.gov/mods/v3",
  xns = {"m":ns};

// =========================================================================

function detectImport() {
  var doc = Zotero.getXML().documentElement;
  if (!doc) {
  return false;
  }

  var bMODSdoc = ( doc.namespaceURI === "http://www.loc.gov/mods/v3" &&
		  (doc.tagName === "modsCollection" || doc.tagName === "mods" ) ); 
  if (!bMODSdoc) {
  return false;
  }

  // In order to be a valid import document, every <mods> element must have a child
  //   <targetAudience authority="genCL">Genealogists</target Audience> element
  // NOTE: genCL = 'genealogy citation language' - a set of "authority" additions
  //       to MODS, to enable richer genealogy citations, via Zotero and CSL.

  var modsElements = ZU.xpath(doc, "/m:mods | /m:modsCollection/m:mods", xns);

  Z.debug('[DEBUG] MODS node count: ' + modsElements.length);

  for(var iModsElements=0, nModsElements=modsElements.length;
	  iModsElements<nModsElements; iModsElements++)
  {
	var modsElement = modsElements[iModsElements];
	var tgtAudience = ZU.xpathText(modsElement, 'm:targetAudience[@authority="genCL"]', xns);
	if (!tgtAudience)
	{
	  return false;
	}
	if ( tgtAudience != 'Genealogists' ) { return false; }
  } 

  return true;
}

// =========================================================================

/**
 * If property is defined, this function adds an appropriate XML element as a child of
 * parentElement.
 * @param {Element} parentElement The parent of the new element to be created.
 * @param {String} elementName The name of the new element to be created.
 * @param {Any} property The property to inspect. If this property is defined and not
 *     null, false, or empty, a new element is created whose textContent is its value.
 * @param {Object} [attributes] If defined, this object defines attributes to be added
 *     to the new element.
 */
function mapProperty(parentElement, elementName, property, attributes) {
  if(!property && property !== 0) return null;
  var doc = parentElement.ownerDocument,
	newElement = doc.createElementNS(ns, elementName);
  if(attributes) {
	for(var i in attributes) {
	  newElement.setAttribute(i, attributes[i]);
	}
  }
  newElement.appendChild(doc.createTextNode(property));
  parentElement.appendChild(newElement);
  return newElement;
}

// =========================================================================

function processTitleInfo(titleInfo) {
  var title = ZU.xpathText(titleInfo, "m:title[1]", xns).trim();
  var subtitle = ZU.xpathText(titleInfo, "m:subTitle[1]", xns);
  if(subtitle) title = title.replace(/:$/,'') + ": "+ subtitle.trim();
  var nonSort = ZU.xpathText(titleInfo, "m:nonSort[1]", xns);
  if(nonSort) title = nonSort.trim() + " " + title;
  return title;
}

// =========================================================================

function processTitle(contextElement) {
  // Try to find a titleInfo element with no type specified and a title element as a
  // child
  var titleElements = ZU.xpath(contextElement, "m:titleInfo[not(@type)][m:title][1]", xns);
  if(titleElements.length) return processTitleInfo(titleElements[0]);
  
  // That failed, so look for any titleInfo element without no type secified
  var title = ZU.xpathText(contextElement, "m:titleInfo[not(@type)][1]", xns);
  if(title) return title;
  
  // That failed, so just go for the first title
  return ZU.xpathText(contextElement, "m:titleInfo[1]", xns);
}

// =========================================================================

function processGenre(contextElement) {
  // Try to get itemType by treating local genre as Zotero item type
  var genre = ZU.xpath(contextElement, 'm:genre[@authority="local"]', xns);
  for(var i=0; i<genre.length; i++) {
	var genreStr = genre[i].textContent;
	if(Zotero.Utilities.itemTypeExists(genreStr)) return genreStr;
  }
  
  // Try to get MARC genre and convert to an item type
  genre = ZU.xpath(contextElement,
	 'm:genre[@authority="marcgt"] | m:genre[@authority="marc"]', xns);
  for(var i=0; i<genre.length; i++) {
	var genreStr = genre[i].textContent;
	if(fromMarcGenre[genreStr]) return fromMarcGenre[genreStr];
  }
  
  // Try to get DCT genre and convert to an item type
  genre = ZU.xpath(contextElement, 'm:genre[@authority="dct"]', xns);
  for(var i=0; i<genre.length; i++) {
	var genreStr = genre[i].textContent.replace(/\s+/g, "");
	if(dctGenres[genreStr]) return dctGenres[genreStr];
  }
  
  // Try unlabeled genres
  genre = ZU.xpath(contextElement, 'm:genre', xns);
  for(var i=0; i<genre.length; i++) {
	var genreStr = genre[i].textContent;
	
	// Zotero
	if(Zotero.Utilities.itemTypeExists(genreStr)) return genreStr;
	
	// MARC
	if(fromMarcGenre[genreStr]) return fromMarcGenre[genreStr];
	
	// DCT
	var dctGenreStr = genreStr.replace(/\s+/g, "");
	if(dctGenres[dctGenreStr]) return dctGenres[dctGenreStr];
	
	// Try regexps
	for(var type in modsTypeRegex) {
	  if(modsTypeRegex[type].exec(genreStr)) return type;
	}
  }
  
  return undefined;
}

// =========================================================================

function processItemType(contextElement) {
  var type = processGenre(contextElement);
  if(type) return type;
  
  // Try to get type information from typeOfResource
  var typeOfResource = ZU.xpath(contextElement, 'm:typeOfResource', xns);
  for(var i=0; i<typeOfResource.length; i++) {
	var typeOfResourceStr = typeOfResource[i].textContent.trim();
	
	// Try list
	if(fromTypeOfResource[typeOfResourceStr]) {
	  return fromTypeOfResource[typeOfResourceStr];
	}
	
	// Try regexps
	for(var type in modsTypeRegex) {
	  if(modsTypeRegex[type].exec(typeOfResourceStr)) return type;
	}
  }
  
  var hasHost = false;
  var periodical = false;
  
  // Try to get genre data from host
  var hosts = ZU.xpath(contextElement, 'm:relatedItem[@type="host"]', xns);
  for(var i=0; i<hosts.length; i++) {
	type = processGenre(hosts[i]);
	if(type) return type;
  }
	
  // Figure out if it's a periodical
  var periodical = ZU.xpath(contextElement, 
	'm:relatedItem[@type="host"]/m:originInfo/m:issuance[text()="continuing" or text()="serial"]',
	xns).length;

  // Try physicalDescription/internetMediaType
  var internetMediaTypes = ZU.xpath(contextElement,
		'm:physicalDescription/m:internetMediaType', xns);
  for(var i=0; i<internetMediaTypes.length; i++) {
	var internetMediaTypeStr = internetMediaTypes[i].textContent.trim();
	if(modsInternetMediaTypes[internetMediaTypeStr]) {
	  return modsInternetMediaTypes[internetMediaTypeStr];
	};
  }

  // As a last resort, if it has a host, let's set it to book chapter, so we can import
  // more info. Otherwise default to document
  if(hosts.length) {
	if(periodical) return 'journalArticle';
	return 'bookSection';
  }
  
  return "document";
}

// =========================================================================

function processCreator(name, itemType, defaultCreatorType) {
  var creator = {};
  var backupName = new Array();
  creator.firstName = ZU.xpathText(name, 'm:namePart[@type="given"]', xns, " ") || undefined;
  creator.lastName = ZU.xpathText(name, 'm:namePart[@type="family"]', xns, " ");

  Z.debug('[DEBUG] Creator: ' + creator.lastName);
  
  if(!creator.lastName) {
	var isPersonalName = name.getAttribute("type") === "personal",
	  backupName = ZU.xpathText(name, 'm:namePart[not(@type="date")][not(@type="termsOfAddress")]',
		  xns, (isPersonalName ? " " : ": "));
	
	if(!backupName) return null;
	
	if(isPersonalName) {
	  creator = ZU.cleanAuthor(backupName.replace(/[\[\(][^A-Za-z]*[\]\)]/g, ''),
		"author", true);
	  delete creator.creatorType;
	} else {
	  creator.lastName = ZU.trimInternal(backupName);
	  creator.fieldMode = 1;
	}
  }
  
  if(!creator.lastName) return null;

  // Look for roles
  var roles = ZU.xpath(name, 'm:role/m:roleTerm[@type="text" or not(@type)][@authority="zotero"]', xns);

  Z.debug('[DEBUG] Item type: ' + itemType);

  var validCreatorsForItemType = ZU.getCreatorsForType(itemType); 
  Z.debug('[DEBUG] validCreators: ' + validCreatorsForItemType);

  for(var i=0; i<roles.length; i++) {
	var roleStr = roles[i].textContent.toLowerCase();
	Z.debug('[DEBUG] Role: ' + roleStr);

	if(validCreatorsForItemType.indexOf(roleStr) !== -1) {
	  creator.creatorType = roleStr;
	}
  }
  
  if(!creator.creatorType) {
	// Look for MARC roles
	var roles = ZU.xpath(name,
		 'm:role/m:roleTerm[@type="code"][@authority="marcrelator"]', xns);
	for(var i=0; i<roles.length; i++) {
	  var roleStr = roles[i].textContent.toLowerCase();
	  if(marcRelators[roleStr]) creator.creatorType = marcRelators[roleStr];
	}
	
	// Default to author
	if(!creator.creatorType) creator.creatorType = defaultCreatorType;
  }

  return creator;
}

// =========================================================================

function processCreators(contextElement, newItem, defaultCreatorType) {
  var names = ZU.xpath(contextElement, 'm:name', xns);
  for(var i=0; i<names.length; i++) {
	var creator = processCreator(names[i], newItem.itemType, defaultCreatorType);
	if(creator) newItem.creators.push(creator);
  }
}

// =========================================================================

function processExtent(extent, newItem) {
  //try to parse extent according to
  //http://www.loc.gov/standards/mods/v3/mods-userguide-elements.html#extent
  //i.e. http://www.loc.gov/marc/bibliographic/bd300.html
  //and http://www.loc.gov/marc/bibliographic/bd306.html
  var extentRe = new RegExp(
	'^(.*?)(?=(?:[:;]|$))' +  //extent [1]
	'(?::.*?(?=(?:;|$)))?' +  //other physical details
	'(?:;(.*))?' +        //dimensions [2]
	'$'              //make sure to capture the rest of the line
	);

  var ma = extentRe.exec(extent);
  if(ma && ma[1]) {
	//drop supplemental info (i.e. everything after +)
	if(ma[1].indexOf('+') >= 0) {
	  ma[1] = ma[1].slice(0, ma[1].indexOf('+'));
	}

	// pages
	if(!newItem.pages && ZU.fieldIsValidForType('pages', newItem.itemType)) {
	  var pages = ma[1].match(/\bp(?:ages?)?\.?\s+([a-z]?\d+(?:\s*-\s*[a-z]?\d+))/i);
	  if(pages) {
		newItem.pages = pages[1].replace(/\s+/,'');
	  }
	}

	// volume
	if(!newItem.volume && ZU.fieldIsValidForType('volume', newItem.itemType)) {
	  var volume = ma[1].match(/\bv(?:ol(?:ume)?)?\.?\s+(\d+)/i);
	  if(volume) {
		newItem.volume = volume[1];
	  }
	}

	//issue
	if(!newItem.issue && ZU.fieldIsValidForType('issue', newItem.itemType)) {
	  var issue = ma[1].match(/\b(?:no?|iss(?:ue)?)\.?\s+(\d+)/i);
	  if(issue) {
		newItem.issue = issue[1];
	  }
	}

	// numPages
	if(!newItem.numPages && ZU.fieldIsValidForType('numPages', newItem.itemType)) {
	  var pages = ma[1].match(/(\d+)\s*p(?:ages?)?\b/i);
	  if(pages) {
		newItem.numPages = pages[1];
	  }
	}

	// numberOfVolumes
	if(!newItem.numberOfVolumes && ZU.fieldIsValidForType('numberOfVolumes', newItem.itemType)) {
	  //includes volumes, scores, sound (discs, but I think there could be others)
	  //video (cassette, but could have others)
	  var nVol = ma[1].match(/(\d+)\s+(?:v(?:olumes?)?|scores?|sound|video)\b/i);
	  if(nVol) {
		newItem.numberOfVolumes = nVol[1];
	  }
	}
  }
}

// =========================================================================

function processIdentifiers(contextElement, newItem) {
  var isbnNodes = ZU.xpath(contextElement, './/m:identifier[@type="isbn"]', xns),
	isbns = [];
  for(var i=0; i<isbnNodes.length; i++) {    
	var m = isbnNodes[i].textContent.replace(/\s*-\s*/g,'').match(/(?:[\dX]{10}|\d{13})/i);
	if(m) isbns.push(m[0]);
  }
  if(isbns.length) newItem.ISBN = isbns.join(", ");
  
  var issnNodes = ZU.xpath(contextElement, './/m:identifier[@type="issn"]', xns),
	issns = [];
  for(var i=0; i<issnNodes.length; i++) {    
	var m = issnNodes[i].textContent.match(/\b\d{4}\s*-?\s*\d{4}\b/i);
	if(m) issns.push(m[0]);
  }
  if(issns.length) newItem.ISSN = issns.join(", ");
  
  newItem.DOI = ZU.xpathText(contextElement, 'm:identifier[@type="doi"]', xns);
}

// =========================================================================

function getFirstResult(contextNode, xpaths) {
  for(var i=0; i<xpaths.length; i++) {
	var results = ZU.xpath(contextNode, xpaths[i], xns);
	if(results.length) return results[0].textContent;
  }
}

// =========================================================================

function doImport() {
  var xml = Zotero.getXML();
  
  var modsElements = ZU.xpath(xml, "/m:mods | /m:modsCollection/m:mods", xns);
  
  for(var iModsElements=0, nModsElements=modsElements.length;
	  iModsElements<nModsElements; iModsElements++) {
	var modsElement = modsElements[iModsElements],
	  newItem = new Zotero.Item();
	
	// title
	newItem.title = processTitle(modsElement);
	
	// shortTitle
	var abbreviatedTitle = ZU.xpath(modsElement, 'm:titleInfo[@type="abbreviated"]', xns);
	if(abbreviatedTitle.length) {
	  newItem.shortTitle = processTitleInfo(abbreviatedTitle[0]);
	}
	
	// itemType
	newItem.itemType = processItemType(modsElement);
	
	var isPartialItem = partialItemTypes.indexOf(newItem.itemType) !== -1;
	
	// TODO: thesisType, type
	
	// creators
	processCreators(modsElement, newItem, "author");

	// source
	newItem.source = ZU.xpathText(modsElement, 'm:recordInfo/m:recordContentSource', xns);

	// accessionNumber
	newItem.accessionNumber = ZU.xpathText(modsElement, 'm:recordInfo/m:recordIdentifier', xns);

	// rights
	newItem.rights = ZU.xpathText(modsElement, 'm:accessCondition', xns);

	// archive
	newItem.archive = ZU.xpathText(modsElement, 'm:location/m:physicalLocation', xns);
	
	// libraryCatalog
	newItem.libraryCatalog = ZU.xpathText(modsElement, 'm:note[@type="reference"]', xns);
	
	// extra
	newItem.extra = ZU.xpathText(modsElement, 'm:note[@type="venue"]', xns);
	
	/** SUPPLEMENTAL FIELDS **/
	
	var part = [], originInfo = [];
	
	// host
	var hostNodes = ZU.xpath(modsElement, 'm:relatedItem[@type="host"]', xns)
	for(var i=0; i<hostNodes.length; i++) {
	  var host = hostNodes[i];
	  
	  // publicationTitle
	  if(!newItem.publicationTitle) newItem.publicationTitle = processTitle(host);
	  
	  // journalAbbreviation
	  if(!newItem.journalAbbreviation) {
		var titleInfo = ZU.xpath(host, 'm:titleInfo[@type="abbreviated"]', xns);
		if(titleInfo.length) {
		  newItem.journalAbbreviation = processTitleInfo(titleInfo[0]);
		}
	  }
	  
	  // creators (might be editors)
	  processCreators(host, newItem, "editor");
	  
	  // identifiers
	  processIdentifiers(host, newItem);
	  
	  part = part.concat(ZU.xpath(host, 'm:part', xns));
	  originInfo = originInfo.concat(ZU.xpath(host, 'm:originInfo', xns));
	}
	
	if(!newItem.publicationTitle) newItem.publicationTitle = newItem.journalAbbreviation;    
	
	// series
	var seriesNodes = ZU.xpath(modsElement, './/m:relatedItem[@type="series"]', xns);
	for(var i=0; i<seriesNodes.length; i++) {
	  var seriesNode = seriesNodes[i];
	  var series = ZU.xpathText(seriesNode, 'm:titleInfo/m:title', xns);
	  
	  if(ZU.fieldIsValidForType('series', newItem.itemType)) {
		newItem.series = series;
	  } else if(ZU.fieldIsValidForType('seriesTitle', newItem.itemType)) {
		newItem.seriesTitle = series;
	  }
	  
	  if(!newItem.seriesText) {
		newItem.seriesText = ZU.xpathText(seriesNode, 'm:titleInfo/m:subTitle', xns);
	  }
	  
	  if(!newItem.seriesNumber) {
		newItem.seriesNumber = getFirstResult(seriesNode,
		  ['m:part/m:detail[@type="volume"]/m:number', 'm:titleInfo/m:partNumber']);
	  }
	  
	  processCreators(seriesNode, newItem, "seriesEditor");
	}
	
	// Add part and originInfo from main entry
	part = part.concat(ZU.xpath(modsElement, 'm:part', xns));
	originInfo = originInfo.concat(ZU.xpath(modsElement, 'm:originInfo', xns));
	
	if(part.length) {
	  // volume, issue, section
	  var details = ["volume", "issue", "section"];
	  for(var i=0; i<details.length; i++) {
		var detail = details[i];
		
		newItem[detail] = getFirstResult(part, ['m:detail[@type="'+detail+'"]/m:number',
		  'm:detail[@type="'+detail+'"]']);
	  }

	  // pages and other extent information
	  var extents = ZU.xpath(part, "m:extent", xns);
	  for(var i=0; i<extents.length; i++) {
		var extent = extents[i],
		  unit = extent.getAttribute("unit");
		
		if(unit === "pages" || unit === "page") {
		  if(newItem.pages) continue;
		  var pagesStart = ZU.xpathText(extent, "m:start[1]", xns);
		  var pagesEnd = ZU.xpathText(extent, "m:end[1]", xns);
		  if(pagesStart || pagesEnd) {
			if(pagesStart == pagesEnd) {
			  newItem.pages = pagesStart;
			} else if(pagesStart && pagesEnd) {
			  newItem.pages = pagesStart+"-"+pagesEnd;
			} else {
			  newItem.pages = pagesStart+pagesEnd;
			}
		  }
		} else {
		  processExtent(extent.textContent, newItem);
		}
	  }
	  
	  newItem.date = getFirstResult(part, ['m:date[not(@point="end")][@encoding]',
		'm:date[not(@point="end")]', 'm:date']);
	}

	// physical description
	var extents = ZU.xpath(modsElement, "m:physicalDescription/m:extent", xns);
	for(var i=0; i<extents.length; i++) {
	  processExtent(extents[i].textContent, newItem);
	}

	// identifier
	processIdentifiers(modsElement, newItem);
	
	if(originInfo.length) {
	  // edition
	  var editionNodes = ZU.xpath(originInfo, 'm:edition', xns);
	  if(editionNodes.length) newItem.edition = editionNodes[0].textContent;
	  
	  // place
	  var placeNodes = ZU.xpath(originInfo, 'm:place/m:placeTerm[@type="text"]', xns);
	  if(placeNodes.length) newItem.place = placeNodes[0].textContent;
	  
	  // publisher/distributor
	  var publisherNodes = ZU.xpath(originInfo, 'm:publisher', xns);
	  if(publisherNodes.length) {
		newItem.publisher = publisherNodes[0].textContent;
		if(newItem.itemType == "webpage" && !newItem.publicationTitle) {
		  newItem.publicationTitle = newItem.publisher;
		}
	  }
	  
	  // date
	  newItem.date = getFirstResult(originInfo, ['m:copyrightDate[@encoding]',
		'm:copyrightDate', 'm:dateIssued[not(@point="end")][@encoding]',
		'm:dateIssued[not(@point="end")]', 'm:dateIssued',
		'm:dateCreated[@encoding]',  'm:dateCreated']) || newItem.date;
	  
	  // lastModified
	  newItem.lastModified = getFirstResult(originInfo, ['m:dateModified[@encoding]',
		'm:dateModified']);
	  
	  // accessDate
	  newItem.accessDate = getFirstResult(originInfo, ['m:dateCaptured[@encoding]',
		'm:dateCaptured[not(@encoding)]']);
	}
	
	// call number
	newItem.callNumber = ZU.xpathText(modsElement, 'm:classification', xns);
	if ( !newItem.callNumber)
	{
		newItem.callNumber = ZU.xpathText(modsElement, 'm:identifier[@type="local"]', xns);
	}
	Z.debug('[DEBUG] callNumber: ' + newItem.callNumber);

	// archiveLocation
	newItem.archiveLocation = ZU.xpathText(modsElement, 
		'.//m:location/m:holdingSimple/m:copyInformation/m:shelfLocator', xns, "; ");

	// attachments and url
	var urlNodes = ZU.xpath(modsElement, 'm:location/m:url', xns);
	for(var i=0; i<urlNodes.length; i++) {
	  var urlNode = urlNodes[0],
		access = urlNode.getAttribute("access"),
		usage = urlNode.getAttribute("usage");
	  if(access === "raw object") {
		var attachment = {url:urlNode.textContent,
			title:(urlNode.getAttribute("displayLabel") || "Attachment"),
			downloadable:true};
		if (attachment.url.substr(-4) === ".pdf") attachment.mimeType = "application/pdf";
		newItem.attachments.push(attachment);
	  }
	  
	  if((!newItem.url || usage === "primary" || usage === "primary display")
		  && access !== "preview") {
		newItem.url = urlNode.textContent;
	  }
	  
	  if(!newItem.accessDate) {
		newItem.accessDate = urlNode.getAttribute("dateLastAccessed");
	  }
	}

	// abstract
	newItem.abstractNote = ZU.xpathText(modsElement, 'm:abstract', xns, "\n\n");
	
	/** NOTES **/
	var noteNodes = ZU.xpath(modsElement, 'm:note', xns);
	for(var i=0; i<noteNodes.length; i++) {
	  var note = noteNodes[i];
	  newItem.notes.push({ note:
		(note.hasAttribute("type") ? note.getAttribute("type") + ': ':'') +
		note.textContent
	  });
	}

	// ToC - goes into notes
	var tocNodes = ZU.xpath(modsElement, 'm:tableOfContents', xns);
	for(var i=0; i<tocNodes.length; i++) {
	  newItem.notes.push({note:'Table of Contents: ' + tocNodes[i].textContent});
	}

	/** TAGS **/
	var tagNodes = ZU.xpath(modsElement, 'm:subject/m:topic', xns);
	for(var i=0; i<tagNodes.length; i++) {
	  newItem.tags.push(ZU.trimInternal(tagNodes[i].textContent));
	}

	// scale
	if(ZU.fieldIsValidForType('scale', newItem.itemType)) {
	  var scale = ZU.xpathText(modsElement, 'm:subject/m:cartographics/m:scale', xns);
	  if(scale) {
		var m = scale.match(/1\s*:\s*\d+(?:,\d+)/);
		if(m) newItem.scale = m[0];
	  }
	}
	
	// Language
	// create an array of languages
	var languages = [];
	var languageNodes = ZU.xpath(modsElement, 'm:language', xns);
	for(var i=0; i<languageNodes.length; i++) {
	  var code = false,
		languageNode = languageNodes[i],
		languageTerms = ZU.xpath(languageNode, 'm:languageTerm', xns);
		
	  for(var j=0; j<languageTerms.length; j++) {
		var term = languageTerms[j],
		  termType = term.getAttribute("type");
		
		if (termType === "text") {
		  languages.push(term.textContent);
		  code = false;
		  break;
		// code authorities should be used, not ignored
		// but we ignore them for now
		} else if (termType === "code" || term.hasAttribute("authority")) {
		  code = term.textContent;
		}
	  }
	  // If we have a code or text content of the node
	  // (prefer the former), then we add that
	  if (code || (languageNode.childNodes.length === 1
		  && languageNode.firstChild.nodeType === 3 /* Node.TEXT_NODE*/
		  && (code = languageNode.firstChild.nodeValue))) {
		languages.push(code);
	  }
	}
	// join the list separated by semicolons & add it to zotero item
	newItem.language = languages.join('; ');
	
	Zotero.setProgress(iModsElements/nModsElements*100);
	newItem.complete();
  }
}

// =========================================================================

/** BEGIN TEST CASES **/
var testCases = [
	{
		"type": "import",
		"input": "<modsCollection xmlns=\"http://www.loc.gov/mods/v3\"\n                xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"\n                xsi:schemaLocation=\"http://www.loc.gov/mods/v3 ./mods/mods_3_4.xsd.xml\">\n<mods>\n      <titleInfo>\n         <title>Birth Certificate</title>\n      </titleInfo>\n      <titleInfo type=\"abbreviated\">\n         <title>birth cert.</title>\n      </titleInfo>\n      <typeOfResource>text</typeOfResource>\n      <targetAudience authority=\"genCL\">Genealogists</targetAudience>\n      <genre authority=\"local\">document</genre>\n      <genre authority=\"genCL\">GRO-Birth</genre>\n      <genre authority=\"genCL\">BMD Certificate</genre>\n      <name type=\"personal\">\n         <namePart type=\"given\">Frank Edward</namePart>\n         <namePart type=\"family\">Norris</namePart>\n         <role>\n            <roleTerm authority=\"marcrelator\" type=\"text\">author</roleTerm>\n            <roleTerm authority=\"zotero\" type=\"text\">author</roleTerm>\n            <roleTerm authority=\"genCL\" type=\"text\">recipient</roleTerm>\n            <roleTerm authority=\"genCL\" type=\"text\">child</roleTerm>\n         </role>\n      </name>\n      <originInfo>\n         <issuance>monographic</issuance>\n      </originInfo>\n      <abstract>-</abstract>\n      <language>\n         <languageTerm type=\"text\">English</languageTerm>\n      </language>\n      <location>\n         <physicalLocation>S.W. Adcock Genealogy Library</physicalLocation>\n         <url>file://C:/genCL/BMD/Births/norris_1890.pdf</url>\n         <holdingSimple>\n            <copyInformation>\n               <subLocation>Top floor</subLocation>\n               <shelfLocator>Birth Certificates Binder</shelfLocator>\n               <electronicLocator/>\n               <note>Additional location details</note>\n            </copyInformation>\n         </holdingSimple>\n      </location>\n      <subject authority=\"genCL\">\n         <topic>birth</topic>\n      </subject>\n      <identifier type=\"local\">swa.genealogy.bmd.birth.norris_f.1890.00001</identifier>\n</mods>\n</modsCollection>",
		"items": [
			{
				"itemType": "document",
				"creators": [
					{
						"firstName": "Frank Edward",
						"lastName": "Norris",
						"creatorType": "author"
					}
				],
				"notes": [],
				"tags": [
					"birth"
				],
				"seeAlso": [],
				"attachments": [],
				"title": "Birth Certificate",
				"shortTitle": "birth cert.",
				"archive": "S.W. Adcock Genealogy Library",
				"callNumber": "swa.genealogy.bmd.birth.norris_f.1890.00001",
				"archiveLocation": "Birth Certificates Binder",
				"url": "file://C:/genCL/BMD/Births/norris_1890.pdf",
				"abstractNote": "-",
				"language": "English"
			}
		]
	},
	{
		"type": "import",
		"input": "<modsCollection xmlns=\"http://www.loc.gov/mods/v3\"\n                xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"\n                xsi:schemaLocation=\"http://www.loc.gov/mods/v3 ./mods/mods_3_4.xsd.xml\">\n   <mods>\n      <titleInfo>\n         <title>Marriage Certificate</title>\n      </titleInfo>\n      <titleInfo type=\"abbreviated\">\n         <title>marr. cert.</title>\n      </titleInfo>\n      <typeOfResource>text</typeOfResource>\n      <targetAudience authority=\"genCL\">Genealogists</targetAudience>\n      <genre authority=\"local\">document</genre>\n      <genre authority=\"genCL\">GRO-Marriage</genre>\n      <genre authority=\"genCL\">BMD Certificate</genre>\n      <name type=\"personal\">\n         <namePart type=\"given\">Joseph</namePart>\n         <namePart type=\"family\">Holah</namePart>\n         <role>\n            <roleTerm authority=\"marcrelator\" type=\"text\">author</roleTerm>\n            <roleTerm authority=\"zotero\" type=\"text\">author</roleTerm>\n            <roleTerm authority=\"genCL\" type=\"text\">recipient</roleTerm>\n            <roleTerm authority=\"genCL\" type=\"text\">husband</roleTerm>\n         </role>\n      </name>\n      <name type=\"personal\">\n         <namePart type=\"given\">Emily</namePart>\n         <namePart type=\"family\">Marsh</namePart>\n         <role>\n            <roleTerm authority=\"marcrelator\" type=\"text\">author</roleTerm>\n            <roleTerm authority=\"zotero\" type=\"text\">author</roleTerm>\n            <roleTerm authority=\"genCL\" type=\"text\">recipient</roleTerm>\n            <roleTerm authority=\"genCL\" type=\"text\">wife</roleTerm>\n         </role>\n      </name>\n      <originInfo>\n         <publisher>General Register Office, England and Wales, Glanford Brigg District</publisher>\n         <dateCreated>1868-01-28</dateCreated>\n         <issuance>monographic</issuance>\n         <dateCaptured>2008-08-09</dateCaptured>\n      </originInfo>\n      <abstract>-</abstract>\n      <language>\n         <languageTerm type=\"text\">English</languageTerm>\n      </language>\n      <note type=\"venue\">Roxby-with-Risby, Lincolnshire</note>\n      <note type=\"reference\">BMD Index, Glanford Brigg, Jan-Feb-Mar 1868, vol 7a, page 0955</note>\n      <note type=\"acquisition\">2008-08-09T00:00:00</note>\n      <location>\n         <physicalLocation>S.W. Adcock Genealogy Library</physicalLocation>\n         <url>file://C:/genCL/BMD/Marriages/holah_marsh_1868.pdf</url>\n         <holdingSimple>\n            <copyInformation>\n               <subLocation>Top floor</subLocation>\n               <shelfLocator>Marriage Certificates Binder</shelfLocator>\n               <electronicLocator/>\n               <note>Additional location details</note>\n            </copyInformation>\n         </holdingSimple>\n      </location>\n      <subject authority=\"genCL\">\n         <topic>marriage</topic>\n      </subject>\n      <identifier type=\"local\">swa.genealogy.bmd.marr.holah_marsh.1868.00022</identifier>\n      <relatedItem type=\"host\">\n         <titleInfo>\n            <title>BMD Index</title>\n         </titleInfo>\n         <originInfo>\n            <issuance>continuing</issuance>\n         </originInfo>\n         <genre>index</genre>\n         <part>\n            <date>Jan-Feb-Mar 1868</date>\n            <detail type=\"volume\">\n               <number>7a</number>\n            </detail>\n            <detail type=\"page\">\n               <number>0955</number>\n            </detail>\n         </part>\n      </relatedItem>\n   </mods>\n</modsCollection>",
		"items": [
			{
				"itemType": "document",
				"creators": [
					{
						"firstName": "Joseph",
						"lastName": "Holah",
						"creatorType": "author"
					},
					{
						"firstName": "Emily",
						"lastName": "Marsh",
						"creatorType": "author"
					}
				],
				"notes": [
					{
						"note": "venue: Roxby-with-Risby, Lincolnshire"
					},
					{
						"note": "reference: BMD Index, Glanford Brigg, Jan-Feb-Mar 1868, vol 7a, page 0955"
					},
					{
						"note": "acquisition: 2008-08-09T00:00:00"
					}
				],
				"tags": [
					"marriage"
				],
				"seeAlso": [],
				"attachments": [],
				"title": "Marriage Certificate",
				"shortTitle": "marr. cert.",
				"archive": "S.W. Adcock Genealogy Library",
				"libraryCatalog": "BMD Index, Glanford Brigg, Jan-Feb-Mar 1868, vol 7a, page 0955",
				"extra": "Roxby-with-Risby, Lincolnshire",
				"publicationTitle": "BMD Index",
				"volume": "7a",
				"date": "1868-01-28",
				"publisher": "General Register Office, England and Wales, Glanford Brigg District",
				"accessDate": "2008-08-09",
				"callNumber": "swa.genealogy.bmd.marr.holah_marsh.1868.00022",
				"archiveLocation": "Marriage Certificates Binder",
				"url": "file://C:/genCL/BMD/Marriages/holah_marsh_1868.pdf",
				"abstractNote": "-",
				"language": "English"
			}
		]
	}
]
/** END TEST CASES **/