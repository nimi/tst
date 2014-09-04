(function(window, undefined, $) {

	var $el = $('#element');
	var $window = $(window);

	$el.hide();

	for (var i = 0; i < 10; i++) {
		console.log(i);
	}

	$el.val('Valuables');

	var doSomething = function(cb) {
		$el.attr('background-color', 'red');

		if ($el) return cb(el);
	}

})(jQuery);
