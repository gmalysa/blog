/**
 * Scripts for the edit page, which support previews and generating slugs to show
 */

function preview() {
	var title = document.getElementById('title').value;
	var slug = document.getElementById('slug').value;
	var content = document.getElementById('content').value;

	var args = {
		method : 'POST',
		credentials: 'same-origin',
		headers : {
			'Content-Type': 'application/json',
			'Accept' : 'application/json'
		},
		body : JSON.stringify({
			title : title,
			slug : slug,
			content : content
		})
	};

	fetch('/preview', args).then(function(r) { return r.json(); })
		.then(function(data) {
			var preview = document.getElementById('preview');
			preview.innerHTML = data.preview;
			Prism.highlightAllUnder(preview);
		});
}

function titleChange() {
	var title = document.getElementById('title').value;

	var args = {
		method : 'POST',
		credentials: 'same-origin',
		headers : {
			'Content-Type': 'application/json',
			'Accept' : 'application/json'
		},
		body : JSON.stringify({
			title : title
		})
	};

	fetch('/slug', args).then(function(r) { return r.json(); })
		.then(function(data) {
			document.getElementById('slug').value = data.slug;
		});
}
