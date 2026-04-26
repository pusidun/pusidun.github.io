$(document).ready(function() {
  var searchData = null;
  var $input = $('#navbar-search-input');
  var $results = $('#search-results');

  function loadSearchData(callback) {
    if (searchData) return callback();
    $.getJSON('/search.json', function(data) {
      searchData = data;
      callback();
    });
  }

  function doSearch(query) {
    if (!query || !searchData) {
      $results.removeClass('visible').empty();
      return;
    }
    var q = query.toLowerCase();
    var matches = searchData.filter(function(post) {
      return post.title.toLowerCase().indexOf(q) !== -1 ||
             (post.tags && post.tags.join(' ').toLowerCase().indexOf(q) !== -1);
    }).slice(0, 10);

    $results.empty();
    if (matches.length === 0) {
      $results.append('<div class="search-no-result">没有找到相关文章</div>');
    } else {
      matches.forEach(function(post) {
        var tags = post.tags ? post.tags.join(' / ') : '';
        $results.append(
          '<a class="search-result-item" href="' + post.url + '">' +
            '<div class="search-result-title">' + post.title + '</div>' +
            '<div class="search-result-meta">' + post.date + (tags ? ' · ' + tags : '') + '</div>' +
          '</a>'
        );
      });
    }
    $results.addClass('visible');
  }

  $input.on('focus', function() {
    loadSearchData(function() {
      if ($input.val()) doSearch($input.val());
    });
  });

  $input.on('input', function() {
    loadSearchData(function() {
      doSearch($input.val());
    });
  });

  $(document).on('click', function(e) {
    if (!$(e.target).closest('.navbar-search').length) {
      $results.removeClass('visible');
    }
  });

  $(document).on('keydown', function(e) {
    if (e.key === 's' && !$(e.target).is('input, textarea, select')) {
      e.preventDefault();
      $input.focus();
    }
    if (e.key === 'Escape') {
      $results.removeClass('visible');
      $input.blur();
    }
  });

  // Mobile menu toggle
  $('#navbar-toggle').click(function() {
    $('#navbar-menu').toggleClass('visible');
  });

  // Mobile dropdown toggle
  $('.navbar-link--has-dropdown').click(function(e) {
    if (window.innerWidth <= 768) {
      e.preventDefault();
      $(this).closest('.navbar-dropdown').toggleClass('open');
    }
  });

  $(document).click(function(e) {
    if (!$(e.target).closest('.top-navbar').length) {
      $('#navbar-menu').removeClass('visible');
      $('.navbar-dropdown').removeClass('open');
    }
  });
});
