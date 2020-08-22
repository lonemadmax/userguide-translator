const edit_tool = '/shared/translate_tool.html';
const edit_tool_ctx = 'TranslateBlock';

var edit_window = null;
var edited_node = null;
var original_text;
var translated_text;
var all_nodes = new Array();

function sendEdition(node, id, trans, mark_fuzzy) {
	var xml_http = HTTPRequest('POST', 'translate.php',
		{
			translate_lang: lang,
			translate_doc: doc_id,
			translate_string: id,
			translate_text: trans,
			translate_source: source_strings[id],
			is_fuzzy: (mark_fuzzy ? '1' : '0'),
		} , {
			load: serverRequestListener,
		});

	xml_http.userguide_string_id = id;
	xml_http.userguide_new_text = trans;
	xml_http.userguide_fuzzy = mark_fuzzy;
}

function cancelEdition(node, id) {
	var text = translated_strings[id] == '' ? source_strings[id] : translated_strings[id];
	node.innerHTML = formatText(text);
	node.setAttribute(attr_state, getBlockState(id));
	closeEditWindow();
}

function removeBlock(node, id) {
	// TODO: currently gives an error due to empty text, but could be used
	// to remove a translation
	sendEdition(node, id, '', false);
}

function editSaveFinished(id, trans, fuzzy, send_ok) {
	edit_window.focus();

	if (!send_ok) {
		window.edited_node.setAttribute(attr_state, 'error');
		return;
	}

	var next_node;

	is_fuzzy[id] = fuzzy;
	translated_strings[id] = trans;
	trans = formatText(trans);
	const state = getBlockState(id);

	for (const node of getBlockNodes(id)) {
		node.innerHTML = trans;
		node.setAttribute(attr_state, state);
	}

	if (edit_window.document.getElementById('auto_cont').checked) {
		var current_id = window.edited_node.getAttribute('_internal_id');
		while (current_id < all_nodes.length) {
			var t_id = all_nodes[current_id].getAttribute(attr_trans_id);
			if (translated_strings[t_id] == '') {
				next_node = all_nodes[current_id];
				break;
			}
			current_id++;
		}
	}

	translateBlockDone(next_node);
}

function translateBlockDone(next_node) {
	if (next_node) {
		window.edited_node = next_node;
		var id = next_node.getAttribute(attr_trans_id);
		window.original_text = source_strings[id];
		window.translated_text = translated_strings[id];
		window.setTimeout(edit_window.refreshAll, 0);
	} else {
		closeEditWindow();
	}
}

function getBlockState(id) {
	if (translated_strings[id] == '') {
		return 'untranslated';
	} else if (is_fuzzy[id]) {
		return 'fuzzy';
	}
	return '';
}

function initializeNode(node) {
	const id = node.getAttribute(attr_trans_id);
	const state = getBlockState(id);

	if (translated_strings[id] != '') {
		node.innerHTML = formatText(translated_strings[id]);
	}
	node.setAttribute(attr_state, state);
	node.setAttribute('_internal_id', all_nodes.length);
	all_nodes.push(node);
}

window.onload = function() {
	var functions_ok = 0;

	if (window.XMLHttpRequest)
		functions_ok++;

	if (Object.entries)
		functions_ok++;

	if (functions_ok != 2) {
		window.alert('Your browser does not support some JavaScript ' +
			'functions which are needed for this page to work correctly. ' +
			"\nTry again with an updated modern browser.");
		return;
	}

	insertUnreachableBlocks();
	for (const node of getAllBlockNodes()) {
		initializeNode(node);
	}

	document.addEventListener('click', clickHandler);
}
