<?php
function _prepare_string_insert($columns, $data) {
	return db_prepare('INSERT INTO ' . DB_STRINGS . " ($columns)
		SELECT $data FROM " . DB_STRINGS . "
		WHERE string_id = ?");
}

function get_prepared_insert_string($fuzzy = null) {
	$r_norm = ', doc_id';
	$r_col_fuzzy = '';
	$r_set_fuzzy = '';
	$req = db_query('SELECT lang_code FROM ' . DB_LANGS);
	while ($row = db_fetch($req)) {
		$r_norm .= ', "translation_' . $row['lang_code'] . '"';
		$r_col_fuzzy .= ', "is_fuzzy_' . $row['lang_code'] . '"';
		$r_set_fuzzy .= ', 1';
	}
	db_free($req);

	$columns = 'source_md5' . $r_norm . $r_col_fuzzy;

	if ($fuzzy === null or $fuzzy) {
		$up_to = "?" . $r_norm . $r_set_fuzzy;
		$stmt_set = _prepare_string_insert($columns, $up_to);
	}

	if ($fuzzy === null or !$fuzzy) {
		$up_to = "?" . $r_norm . $r_col_fuzzy;
		$stmt_cur = _prepare_string_insert($columns, $up_to);
	}

	if ($fuzzy === null)
		return array('force' => $stmt_set, 'keep' => $stmt_cur);
	if ($fuzzy)
		return $stmt_set;
	return $stmt_cur;
}

function get_strings_hashes($doc_id) {
	$hashes = array();
	$req = db_query('
		SELECT string_id, source_md5 FROM ' . DB_STRINGS . "
		WHERE doc_id = ?", array($doc_id));
	while ($row = db_fetch($req)) {
		$hashes[$row['source_md5']] = $row['string_id'];
	}
	db_free($req);

	return $hashes;
}

