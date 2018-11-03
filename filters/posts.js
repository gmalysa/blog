module.exports = function(db) {
	var cols = {
		id : db.int_t,
		posted : db.datetime_t,
		title : [db.varchar_t, 128],
		slug : [db.varchar_t, 128],
		content : db.text_t,
		views : db.int_t
	};

	db.add_filter("posts", new db("posts", cols, {}));
}
